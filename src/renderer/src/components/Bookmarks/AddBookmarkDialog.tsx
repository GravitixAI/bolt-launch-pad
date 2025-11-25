import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBookmarkDialog({ open, onOpenChange, onSuccess }: AddBookmarkDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingFavicon, setFetchingFavicon] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    favicon: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      // Fetch favicon if not already fetched
      let favicon = formData.favicon;
      if (!favicon && formData.url) {
        setFetchingFavicon(true);
        favicon = await window.system.getFavicon(formData.url);
        setFetchingFavicon(false);
      }

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
      setFormData({ title: '', url: '', category: '', favicon: null });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      toast.error('Failed to create bookmark');
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
      const favicon = await window.system.getFavicon(formData.url);
      setFormData({ ...formData, favicon });
      if (favicon) {
        toast.success('Favicon fetched successfully');
      } else {
        toast.info('No favicon found for this URL');
      }
    } catch (error) {
      console.error('Failed to fetch favicon:', error);
      toast.error('Failed to fetch favicon');
    } finally {
      setFetchingFavicon(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Favorite Website"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Work, Personal, etc."
              />
            </div>
            {formData.favicon && (
              <div className="flex items-center gap-2">
                <Label>Icon Preview:</Label>
                <img src={formData.favicon} alt="Favicon" className="w-8 h-8" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingFavicon}>
              {loading ? 'Creating...' : 'Create Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

