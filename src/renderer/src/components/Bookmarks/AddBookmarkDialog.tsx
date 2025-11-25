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
  prefilledTag?: string | null; // For prefilling tag when adding to specific section
}

export function AddBookmarkDialog({ open, onOpenChange, onSuccess, bookmark, prefilledTag }: AddBookmarkDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingFavicon, setFetchingFavicon] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    tags: '',
    favicon: null as string | null,
  });
  const [showCustomIconUpload, setShowCustomIconUpload] = useState(false);

  // Prefill form when editing or adding with tag
  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category || '',
        tags: bookmark.tags || '',
        favicon: bookmark.favicon || null,
      });
    } else {
      setFormData({ 
        title: '', 
        url: '', 
        category: '', 
        tags: prefilledTag || '', 
        favicon: null 
      });
    }
  }, [bookmark, prefilledTag, open]);

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

      // Try to fetch favicon if not already fetched
      let favicon = formData.favicon;
      if (!favicon && formData.url && !bookmark) {
        try {
          console.log('Auto-fetching favicon during save for:', formData.url);
          setFetchingFavicon(true);
          favicon = await window.system.getFavicon(formData.url);
          console.log('Auto-fetch result:', favicon ? 'Success' : 'Failed');
          console.log('Favicon data length:', favicon ? favicon.length : 0);
          if (favicon) {
            console.log('Favicon preview:', favicon.substring(0, 100) + '...');
            // Test if image is valid by trying to load it
            const testImg = new Image();
            testImg.onload = () => console.log('✅ Favicon image is valid and loadable');
            testImg.onerror = () => console.error('❌ Favicon image failed to load - corrupt data');
            testImg.src = favicon;
          }
          setFetchingFavicon(false);
          if (!favicon) {
            console.log('No favicon found, continuing with letter placeholder');
          }
        } catch (faviconError) {
          console.error('Failed to auto-fetch favicon - ERROR:', faviconError);
          setFetchingFavicon(false);
          // Continue without favicon - it's optional
        }
      }

      if (bookmark) {
        // Update existing bookmark
        await window.bookmarks.update(bookmark.id, {
          title: formData.title,
          url: formData.url,
          favicon: favicon || undefined,
          category: formData.category || undefined,
          tags: formData.tags || undefined,
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
          tags: formData.tags || undefined,
          is_team_level: 0,
          is_personal: 1,
          created_by: userEmail || 'local-user',
          updated_by: userEmail || 'local-user',
        });
        toast.success('Bookmark created successfully');
      }

      setFormData({ title: '', url: '', category: '', tags: '', favicon: null });
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
        setShowCustomIconUpload(false);
      } else {
        toast.info('No favicon found - you can upload a custom icon or use the letter placeholder');
        setShowCustomIconUpload(true);
      }
    } catch (error) {
      console.error('Failed to fetch favicon:', error);
      toast.error(`Failed to fetch favicon: ${error}`);
      setShowCustomIconUpload(true);
    } finally {
      setFetchingFavicon(false);
    }
  };

  const handleCustomIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, favicon: base64 });
        toast.success('Custom icon uploaded successfully');
        setShowCustomIconUpload(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload custom icon:', error);
      toast.error('Failed to upload custom icon');
    }
  };

  const handleClearIcon = () => {
    setFormData({ ...formData, favicon: null });
    setShowCustomIconUpload(false);
    toast.info('Icon cleared - will use letter placeholder');
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
                  title="Manually fetch the site's favicon"
                >
                  {fetchingFavicon ? 'Fetching...' : 'Get Icon'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Icon will be fetched automatically when you click Done, or click "Get Icon" to preview first
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="work, favorites, dev-tools (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Add multiple tags separated by commas. Shortcuts will appear under each tag.
              </p>
            </div>
            {formData.favicon && (
              <div className="flex items-center gap-2">
                <Label>Icon Preview:</Label>
                <img src={formData.favicon} alt="Favicon" className="w-8 h-8 rounded-full" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearIcon}
                  title="Clear icon and use letter placeholder"
                >
                  Clear Icon
                </Button>
              </div>
            )}
            {showCustomIconUpload && !formData.favicon && (
              <div className="space-y-2 p-4 border border-dashed rounded-md bg-muted/30">
                <Label htmlFor="custom-icon">Custom Icon (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  No icon was found automatically. You can upload your own icon or use the default letter placeholder.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="custom-icon"
                    type="file"
                    accept="image/*"
                    onChange={handleCustomIconUpload}
                    className="cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomIconUpload(false)}
                  >
                    Use Letter
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted: PNG, JPG, ICO, SVG (max 1MB)
                </p>
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

