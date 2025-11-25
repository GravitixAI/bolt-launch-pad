import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Executable } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddExecutableDialog } from '../components/Executables/AddExecutableDialog';
import { ExecutableCard } from '../components/Executables/ExecutableCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ExecutablesView() {
  const { userEmail } = useAuth();
  const [executables, setExecutables] = useState<Executable[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingExecutable, setEditingExecutable] = useState<Executable | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [executableToDelete, setExecutableToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadExecutables();
  }, [userEmail]);

  const loadExecutables = async () => {
    try {
      const data = await window.executables.getAll(userEmail || undefined);
      setExecutables(data);
    } catch (error) {
      console.error('Failed to load executables:', error);
      toast.error('Failed to load executables');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (executable: Executable) => {
    try {
      toast.info(`Launching ${executable.title}...`);
      const result = await window.executables.launch(executable.executable_path, executable.parameters);
      if (result.success) {
        toast.success('Executable launched successfully');
      } else {
        toast.error('Executable failed: ' + (result.error || result.stderr));
      }
    } catch (error) {
      console.error('Failed to launch:', error);
      toast.error('Failed to launch executable');
    }
  };

  const handleEdit = (executable: Executable) => {
    setEditingExecutable(executable);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setExecutableToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!executableToDelete) return;

    try {
      await window.executables.delete(executableToDelete);
      toast.success('Executable deleted successfully');
      loadExecutables();
    } catch (error) {
      console.error('Failed to delete executable:', error);
      toast.error('Failed to delete executable');
    } finally {
      setDeleteConfirmOpen(false);
      setExecutableToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditingExecutable(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading executables...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Executables Grid - Chrome-style */}
        <div className="flex flex-wrap gap-6 mb-8">
          {executables.map((executable) => (
            <ExecutableCard
              key={executable.id}
              executable={executable}
              onLaunch={handleLaunch}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Add Shortcut Button */}
          <div
            className="flex flex-col items-center gap-2 w-28 cursor-pointer"
            onClick={() => {
              setEditingExecutable(null);
              setAddDialogOpen(true);
            }}
          >
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border transition-all">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <span className="text-sm text-center text-foreground">Add shortcut</span>
          </div>
        </div>

        {executables.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No executables found</p>
            <p className="text-sm">Click "Add shortcut" to get started</p>
          </div>
        )}

        {/* Dialogs */}
        <AddExecutableDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadExecutables}
          executable={editingExecutable}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Remove executable?"
          description="This executable will be permanently deleted."
          onConfirm={confirmDelete}
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  );
}
