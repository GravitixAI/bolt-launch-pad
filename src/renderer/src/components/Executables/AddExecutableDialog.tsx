import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TagInput, TagInputRef } from '../ui/tag-input';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Executable } from '../../types';
import { FolderOpen } from 'lucide-react';

interface AddExecutableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  executable?: Executable | null;
  prefilledTag?: string | null;
}

export function AddExecutableDialog({ open, onOpenChange, onSuccess, executable, prefilledTag }: AddExecutableDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [extractingIcon, setExtractingIcon] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    executable_path: '',
    parameters: '',
    category: '',
    tags: '',
    icon: null as string | null,
  });
  const [showCustomIconUpload, setShowCustomIconUpload] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const tagInputRef = useRef<TagInputRef>(null);

  // Load all existing tags from executables
  useEffect(() => {
    const loadExistingTags = async () => {
      try {
        const allExecutables = await window.executables.getAll(userEmail || undefined);
        const tagSet = new Set<string>();
        
        allExecutables.forEach(e => {
          if (e.tags) {
            const tags = e.tags.split(',').map(t => t.trim()).filter(t => t !== '');
            tags.forEach(tag => tagSet.add(tag));
          }
        });
        
        setExistingTags(Array.from(tagSet).sort());
      } catch (error) {
        console.error('Failed to load existing tags:', error);
      }
    };
    
    if (open) {
      loadExistingTags();
    }
  }, [open, userEmail]);

  // Prefill form when editing or adding with tag
  useEffect(() => {
    if (executable) {
      setFormData({
        title: executable.title,
        executable_path: executable.executable_path,
        parameters: executable.parameters || '',
        category: executable.category || '',
        tags: executable.tags || '',
        icon: executable.icon || null,
      });
    } else {
      setFormData({ 
        title: '', 
        executable_path: '', 
        parameters: '', 
        category: '', 
        tags: prefilledTag || '', 
        icon: null 
      });
    }
  }, [executable, prefilledTag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Commit any pending tag input before submitting (synchronously)
    const finalTags = tagInputRef.current?.commitPendingTag() || formData.tags;
    
    if (!formData.title || !formData.executable_path) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate executable path (unless editing the same executable)
      if (!executable) {
        const allExecutables = await window.executables.getAll(userEmail || undefined);
        const duplicate = allExecutables.find(
          e => e.executable_path.toLowerCase() === formData.executable_path.toLowerCase() &&
               (e.parameters || '') === (formData.parameters || '')
        );
        if (duplicate) {
          toast.error(`An executable with this path already exists: "${duplicate.title}"`);
          setLoading(false);
          return;
        }
      }

      // Extract icon if not already extracted
      let icon = formData.icon;
      if (!icon && formData.executable_path) {
        setExtractingIcon(true);
        icon = await window.executables.extractIcon(formData.executable_path);
        setExtractingIcon(false);
      }

      if (executable) {
        await window.executables.update(executable.id, {
          title: formData.title,
          executable_path: formData.executable_path,
          parameters: formData.parameters || undefined,
          icon: icon || undefined,
          category: formData.category || undefined,
          tags: finalTags || undefined,
          updated_by: userEmail || 'local-user',
        });
        toast.success('Executable updated successfully');
      } else {
        await window.executables.create({
          title: formData.title,
          executable_path: formData.executable_path,
          parameters: formData.parameters || undefined,
          icon: icon || undefined,
          category: formData.category || undefined,
          tags: finalTags || undefined,
          is_team_level: 0,
          is_personal: 1,
          created_by: userEmail || 'local-user',
          updated_by: userEmail || 'local-user',
        });
        toast.success('Executable created successfully');
      }

      setFormData({ title: '', executable_path: '', parameters: '', category: '', tags: '', icon: null });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(`Failed to ${executable ? 'update' : 'create'} executable:`, error);
      toast.error(`Failed to ${executable ? 'update' : 'create'} executable`);
    } finally {
      setLoading(false);
      setExtractingIcon(false);
    }
  };

  const handleBrowseFile = async () => {
    try {
      const filePath = await window.system.pickFile();
      if (filePath) {
        setFormData({ ...formData, executable_path: filePath });
        // Auto-extract icon
        handleExtractIcon(filePath);
      }
    } catch (error) {
      console.error('Failed to pick file:', error);
      toast.error('Failed to pick file');
    }
  };

  const handleExtractIcon = async (path?: string) => {
    const executablePath = path || formData.executable_path;
    if (!executablePath) {
      toast.error('Please select an executable first');
      return;
    }

    setExtractingIcon(true);
    try {
      const icon = await window.executables.extractIcon(executablePath);
      // Use functional update to avoid race condition with file path setting
      setFormData(prev => ({ ...prev, icon }));
      if (icon) {
        toast.success('Icon extracted successfully');
      } else {
        toast.info('No icon found for this executable');
      }
    } catch (error) {
      console.error('Failed to extract icon:', error);
      toast.error('Failed to extract icon');
    } finally {
      setExtractingIcon(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{executable ? 'Edit shortcut' : 'Add Executable'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notepad"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="executable_path">Executable Path *</Label>
              <div className="flex gap-2">
                <Input
                  id="executable_path"
                  value={formData.executable_path}
                  onChange={(e) => setFormData({ ...formData, executable_path: e.target.value })}
                  placeholder="C:\Windows\System32\notepad.exe"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBrowseFile}
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parameters">Parameters</Label>
              <Input
                id="parameters"
                value={formData.parameters}
                onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                placeholder="Optional command line arguments"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Tools, Games, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <TagInput
                ref={tagInputRef}
                value={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Type to search or create tags..."
                existingTags={existingTags}
              />
              <p className="text-xs text-muted-foreground">
                Type to search existing tags or create new ones. Press Enter/comma to add.
              </p>
            </div>
            {formData.icon && (
              <div className="flex items-center gap-2">
                <Label>Icon Preview:</Label>
                <img src={formData.icon} alt="Icon" className="w-8 h-8 rounded-full" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, icon: null })}
                  title="Clear icon"
                >
                  Clear Icon
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || extractingIcon}>
              {loading ? (executable ? 'Saving...' : 'Creating...') : 'Done'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

