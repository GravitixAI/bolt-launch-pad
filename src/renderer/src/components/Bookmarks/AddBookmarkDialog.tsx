import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Bookmark } from '../../types';

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  bookmark?: Bookmark | null; // For edit mode
}

export function AddBookmarkDialog({ open, onOpenChange, onSuccess, bookmark }: AddBookmarkDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingFavicon, setFetchingFavicon] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    favicon: null as string | null,
  });

  // Prefill form when editing
  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category || '',
        favicon: bookmark.favicon || null,
      });
    } else {
      setFormData({ title: '', url: '', category: '', favicon: null });
    }
  }, [bookmark, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate URL (unless editing the same bookmark)
      if (!bookmark) {
        const allBookmarks = await window.bookmarks.getAll(userEmail || undefined);
        const duplicate = allBookmarks.find(b => b.url.toLowerCase() === formData.url.toLowerCase());
        if (duplicate) {
          toast.error(`A bookmark with this URL already exists: "${duplicate.title}"`);
          setLoading(false);
          return;
        }
      }

      // Use the favicon from form data (user can fetch it with "Get Icon" button)
      const favicon = formData.favicon;

      if (bookmark) {
        // Update existing bookmark
        await window.bookmarks.update(bookmark.id, {
          title: formData.title,
          url: formData.url,
          favicon: favicon || undefined,
          category: formData.category || undefined,
          updated_by: userEmail || 'local-user',
        });
        toast.success('Bookmark updated successfully');
      } else {
        // Create new bookmark
        await window.bookmarks.create({
          title: formData.title,
          url: formData.url,
          favicon: favicon || undefined,
          category: formData.category || undefined,
          is_team_level: 0,
          is_personal: 1,
          created_by: userEmail || 'local-user',
          updated_by: userEmail || 'local-user',
        });
        toast.success('Bookmark created successfully');
      }

      setFormData({ title: '', url: '', category: '', favicon: null });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(`Failed to ${bookmark ? 'update' : 'create'} bookmark:`, error);
      toast.error(`Failed to ${bookmark ? 'update' : 'create'} bookmark`);
    } finally {
      setLoading(false);
      setFetchingFavicon(false);
    }
  };

  const handleFetchFavicon = async () => {
    if (!formData.url) {
      toast.error('Please enter a URL first');
      return;
    }

    setFetchingFavicon(true);
    try {
      console.log('Fetching favicon for:', formData.url);
      const favicon = await window.system.getFavicon(formData.url);
      console.log('Favicon result:', favicon ? 'Success' : 'No favicon found');
      setFormData({ ...formData, favicon });
      if (favicon) {
        toast.success('Favicon fetched successfully');
      } else {
        toast.warning('No favicon found - using letter placeholder');
      }
    } catch (error) {
      console.error('Failed to fetch favicon:', error);
      toast.error(`Failed to fetch favicon: ${error}`);
    } finally {
      setFetchingFavicon(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit shortcut' : 'Add Bookmark'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Favorite Website"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFetchFavicon}
                  disabled={fetchingFavicon || !formData.url}
                >
                  {fetchingFavicon ? 'Fetching...' : 'Get Icon'}
                </Button>
              </div>
            </div>
            {formData.favicon && (
              <div className="flex items-center gap-2">
                <Label>Icon Preview:</Label>
                <img src={formData.favicon} alt="Favicon" className="w-8 h-8" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingFavicon}>
              {loading ? (bookmark ? 'Saving...' : 'Creating...') : 'Done'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

