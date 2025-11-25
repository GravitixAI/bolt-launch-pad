import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Bookmark } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddBookmarkDialog } from '../components/Bookmarks/AddBookmarkDialog';
import { BookmarkCard } from '../components/Bookmarks/BookmarkCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function BookmarksView() {
  const { userEmail } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [prefilledTag, setPrefilledTag] = useState<string | null>(null);

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
        {/* Tagged Groups */}
        {tagNames.map((tag) => (
          <div key={tag}>
            <h2 className="text-xl font-semibold mb-4 text-foreground capitalize">{tag}</h2>
            <div className="flex flex-wrap gap-6">
              {groups[tag].map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleOpenBookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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

        {/* Untagged Bookmarks */}
        {untagged.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              {tagNames.length > 0 ? 'Other' : 'All Shortcuts'}
            </h2>
            <div className="flex flex-wrap gap-6">
              {untagged.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleOpenBookmark}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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
        )}

        {/* Add Shortcut Button - Only visible when no bookmarks at all */}
        {bookmarks.length === 0 && (
          <div className="flex flex-wrap gap-6">
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
        )}

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

