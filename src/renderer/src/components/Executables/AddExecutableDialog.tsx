import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Executable } from '../../types';
import { FolderOpen } from 'lucide-react';

interface AddExecutableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  executable?: Executable | null;
}

export function AddExecutableDialog({ open, onOpenChange, onSuccess, executable }: AddExecutableDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [extractingIcon, setExtractingIcon] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    executable_path: '',
    parameters: '',
    category: '',
    icon: null as string | null,
  });

  useEffect(() => {
    if (executable) {
      setFormData({
        title: executable.title,
        executable_path: executable.executable_path,
        parameters: executable.parameters || '',
        category: executable.category || '',
        icon: executable.icon || null,
      });
    } else {
      setFormData({ title: '', executable_path: '', parameters: '', category: '', icon: null });
    }
  }, [executable, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.executable_path) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
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
          is_team_level: 0,
          is_personal: 1,
          created_by: userEmail || 'local-user',
          updated_by: userEmail || 'local-user',
        });
        toast.success('Executable created successfully');
      }

      setFormData({ title: '', executable_path: '', parameters: '', category: '', icon: null });
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
      setFormData({ ...formData, icon });
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
            {formData.icon && (
              <div className="flex items-center gap-2">
                <Label>Icon Preview:</Label>
                <img src={formData.icon} alt="Icon" className="w-8 h-8" />
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

