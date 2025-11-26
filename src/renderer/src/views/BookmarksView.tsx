import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Bookmark } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddBookmarkDialog } from '../components/Bookmarks/AddBookmarkDialog';
import { BookmarkCard } from '../components/Bookmarks/BookmarkCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../lib/utils';

export function BookmarksView() {
  const { userEmail } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [prefilledTag, setPrefilledTag] = useState<string | null>(null);
  const [draggingBookmark, setDraggingBookmark] = useState<Bookmark | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, [userEmail]);

  const loadBookmarks = async () => {
    try {
      const data = await window.bookmarks.getAll(userEmail || undefined);
      console.log('📚 Loaded bookmarks:', data.length);
      data.forEach(b => {
        console.log(`  - ${b.title}: favicon=${b.favicon ? `${b.favicon.substring(0, 30)}... (${b.favicon.length} chars)` : 'NULL'}`);
      });
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookmark = async (url: string) => {
    try {
      await window.system.openExternal(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
      toast.error('Failed to open bookmark');
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setBookmarkToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookmarkToDelete) return;

    try {
      await window.bookmarks.delete(bookmarkToDelete);
      toast.success('Bookmark deleted successfully');
      loadBookmarks();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      toast.error('Failed to delete bookmark');
    } finally {
      setDeleteConfirmOpen(false);
      setBookmarkToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditingBookmark(null);
      setPrefilledTag(null);
    }
  };

  const handleAddWithTag = (tag: string) => {
    setEditingBookmark(null);
    setPrefilledTag(tag);
    setAddDialogOpen(true);
  };

  // Drag and drop handlers for reordering between sections
  const handleDragStart = (bookmark: Bookmark) => {
    setDraggingBookmark(bookmark);
  };

  const handleDragOverSection = (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetTag);
  };

  const handleDragLeaveSection = () => {
    setDropTarget(null);
  };

  const handleDropOnSection = async (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggingBookmark) return;

    // Get current tags as array
    const currentTags = draggingBookmark.tags
      ? draggingBookmark.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      : [];

    // Determine the source tag (where the bookmark was dragged from)
    // If bookmark has only one tag, that's the source
    // If bookmark has multiple tags, we need to figure out which section it came from
    let newTags: string[];

    if (targetTag === null) {
      // Dropped on General (untagged) section
      // Remove all tags
      newTags = [];
    } else {
      // Dropped on a tagged section
      if (currentTags.length === 0) {
        // Was untagged, add the new tag
        newTags = [targetTag];
      } else if (currentTags.length === 1) {
        // Has one tag, replace it with the new tag
        newTags = [targetTag];
      } else {
        // Has multiple tags
        // We need to swap: find which tag to replace
        // For now, let's check if targetTag is already in tags
        if (currentTags.includes(targetTag)) {
          // Already has this tag, no change needed
          console.log('Bookmark already has this tag');
          setDraggingBookmark(null);
          return;
        }
        // Replace the first tag with the target tag (simple approach)
        // Better UX: we could track which section it was dragged FROM
        newTags = [targetTag, ...currentTags.slice(1)];
      }
    }

    const newTagsString = newTags.join(', ');

    try {
      await window.bookmarks.update(draggingBookmark.id, {
        tags: newTagsString || undefined,
        updated_by: userEmail || 'local-user',
      });
      toast.success(`Moved to ${targetTag || 'General'}`);
      loadBookmarks();
    } catch (error) {
      console.error('Failed to update bookmark tags:', error);
      toast.error('Failed to move bookmark');
    } finally {
      setDraggingBookmark(null);
    }
  };

  // Group bookmarks by tags
  const groupedBookmarks = () => {
    const groups: { [key: string]: Bookmark[] } = {};
    const untagged: Bookmark[] = [];

    bookmarks.forEach((bookmark) => {
      if (!bookmark.tags || bookmark.tags.trim() === '') {
        untagged.push(bookmark);
      } else {
        // Split tags and add bookmark to each tag group
        const tags = bookmark.tags.split(',').map(t => t.trim()).filter(t => t !== '');
        tags.forEach(tag => {
          if (!groups[tag]) {
            groups[tag] = [];
          }
          groups[tag].push(bookmark);
        });
      }
    });

    return { groups, untagged };
  };

  if (loading) {
    return <div className="p-8">Loading bookmarks...</div>;
  }

  const { groups, untagged } = groupedBookmarks();
  const tagNames = Object.keys(groups).sort();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* General (Untagged) Section - Always show, even if empty */}
        <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">General</h2>
            <div
              className={cn(
                "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed transition-all",
                dropTarget === null ? "border-primary bg-primary/5" : "border-transparent"
              )}
              onDragOver={(e) => handleDragOverSection(e, null)}
              onDragLeave={handleDragLeaveSection}
              onDrop={(e) => handleDropOnSection(e, null)}
            >
              {untagged.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleOpenBookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDragStart={handleDragStart}
                  isDragging={draggingBookmark?.id === bookmark.id}
                />
              ))}
              
              {/* Add Shortcut Button for untagged section */}
              <div
                className="flex flex-col items-center gap-2 w-24 cursor-pointer"
                onClick={() => {
                  setEditingBookmark(null);
                  setPrefilledTag(null);
                  setAddDialogOpen(true);
                }}
              >
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm text-center text-foreground">Add shortcut</span>
              </div>
            </div>
          </div>

        {/* Tagged Groups - Alphabetically sorted */}
        {tagNames.map((tag) => (
          <div key={tag}>
            <h2 className="text-xl font-semibold mb-4 text-foreground capitalize">{tag}</h2>
            <div
              className={cn(
                "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed transition-all",
                dropTarget === tag ? "border-primary bg-primary/5" : "border-transparent"
              )}
              onDragOver={(e) => handleDragOverSection(e, tag)}
              onDragLeave={handleDragLeaveSection}
              onDrop={(e) => handleDropOnSection(e, tag)}
            >
              {groups[tag].map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleOpenBookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDragStart={handleDragStart}
                  isDragging={draggingBookmark?.id === bookmark.id}
                />
              ))}
              
              {/* Add Shortcut Button for this tag */}
              <div
                className="flex flex-col items-center gap-2 w-24 cursor-pointer"
                onClick={() => handleAddWithTag(tag)}
              >
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm text-center text-foreground">Add shortcut</span>
              </div>
            </div>
          </div>
        ))}

        {/* Dialogs */}
        <AddBookmarkDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadBookmarks}
          bookmark={editingBookmark}
          prefilledTag={prefilledTag}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Remove bookmark?"
          description="This bookmark will be permanently deleted."
          onConfirm={confirmDelete}
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  );
}

