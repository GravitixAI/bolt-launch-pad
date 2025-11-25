import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Share2, Upload } from 'lucide-react';
import { SearchBar } from '../components/Layout/SearchBar';
import { Button } from '../components/ui/button';
import { Bookmark } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddBookmarkDialog } from '../components/Bookmarks/AddBookmarkDialog';

export function BookmarksView() {
  const { userEmail } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      loadBookmarks();
      return;
    }
    try {
      const results = await window.bookmarks.search(term, userEmail || undefined);
      setBookmarks(results);
    } catch (error) {
      console.error('Search failed:', error);
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

  const handlePromoteToTeam = async (id: string) => {
    try {
      await window.bookmarks.promoteToTeam(id, userEmail || '');
      toast.success('Bookmark promoted to team level');
      loadBookmarks();
    } catch (error) {
      console.error('Failed to promote:', error);
      toast.error('Failed to promote bookmark');
    }
  };

  if (loading) {
    return <div className="p-8">Loading bookmarks...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Bookmarks</h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bookmark
          </Button>
        </div>

        {/* Add Dialog */}
        <AddBookmarkDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={loadBookmarks}
        />

        {/* Search */}
        <SearchBar onSearch={handleSearch} placeholder="Search bookmarks..." />

        {/* Bookmarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {bookmark.favicon && (
                    <img src={bookmark.favicon} alt="" className="w-4 h-4" />
                  )}
                  <h3 className="font-semibold text-foreground truncate">{bookmark.title}</h3>
                </div>
                {bookmark.is_team_level === 1 && (
                  <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Team</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate mb-3">{bookmark.url}</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleOpenBookmark(bookmark.url)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                {bookmark.is_team_level === 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePromoteToTeam(bookmark.id)}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {bookmarks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No bookmarks found</p>
            <p className="text-sm">Add your first bookmark to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

