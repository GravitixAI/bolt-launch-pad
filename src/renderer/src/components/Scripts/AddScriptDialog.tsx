import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface AddScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddScriptDialog({ open, onOpenChange, onSuccess }: AddScriptDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    script_content: '',
    script_type: 'powershell' as 'powershell' | 'cmd',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.script_content) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      // Get default icon based on script type
      const icon = formData.script_type === 'powershell' 
        ? await window.system.getDefaultPowerShellIcon()
        : await window.system.getDefaultCmdIcon();

      await window.scripts.create({
        title: formData.title,
        script_content: formData.script_content,
        script_type: formData.script_type,
        icon,
        category: formData.category || undefined,
        is_team_level: 0,
        is_personal: 1,
        created_by: userEmail || 'local-user',
        updated_by: userEmail || 'local-user',
      });

      toast.success('Script created successfully');
      setFormData({ title: '', script_content: '', script_type: 'powershell', category: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create script:', error);
      toast.error('Failed to create script');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Script</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Useful Script"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="script_type">Script Type *</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.script_type === 'powershell' ? 'default' : 'secondary'}
                  onClick={() => setFormData({ ...formData, script_type: 'powershell' })}
                >
                  PowerShell
                </Button>
                <Button
                  type="button"
                  variant={formData.script_type === 'cmd' ? 'default' : 'secondary'}
                  onClick={() => setFormData({ ...formData, script_type: 'cmd' })}
                >
                  CMD
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="script_content">Script Content *</Label>
              <Textarea
                id="script_content"
                value={formData.script_content}
                onChange={(e) => setFormData({ ...formData, script_content: e.target.value })}
                placeholder={formData.script_type === 'powershell' 
                  ? 'Write-Host "Hello, World!"' 
                  : 'echo Hello, World!'}
                required
                className="min-h-[200px] font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Utilities, Admin, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Script'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

