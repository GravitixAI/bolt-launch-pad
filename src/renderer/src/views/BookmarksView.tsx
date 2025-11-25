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

  useEffect(() => {
    loadBookmarks();
  }, [userEmail]);

  const loadBookmarks = async () => {
    try {
      const data = await window.bookmarks.getAll(userEmail || undefined);
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
    }
  };

  if (loading) {
    return <div className="p-8">Loading bookmarks...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Bookmarks Grid - Chrome-style */}
        <div className="flex flex-wrap gap-6 mb-8">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onOpen={handleOpenBookmark}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Add Shortcut Button */}
          <div
            className="flex flex-col items-center gap-2 w-28 cursor-pointer"
            onClick={() => {
              setEditingBookmark(null);
              setAddDialogOpen(true);
            }}
          >
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted hover:bg-accent hover:scale-105 transition-all">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="text-sm text-center text-foreground">Add shortcut</span>
          </div>
        </div>

        {bookmarks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No bookmarks found</p>
            <p className="text-sm">Click "Add shortcut" to get started</p>
          </div>
        )}

        {/* Dialogs */}
        <AddBookmarkDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadBookmarks}
          bookmark={editingBookmark}
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

