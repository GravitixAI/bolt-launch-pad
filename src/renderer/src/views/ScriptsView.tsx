import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Script } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddScriptDialog } from '../components/Scripts/AddScriptDialog';
import { ScriptCard } from '../components/Scripts/ScriptCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ScriptsView() {
  const { userEmail } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadScripts();
  }, [userEmail]);

  const loadScripts = async () => {
    try {
      const data = await window.scripts.getAll(userEmail || undefined);
      setScripts(data);
    } catch (error) {
      console.error('Failed to load scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (script: Script) => {
    try {
      toast.info(`Executing ${script.title}...`);
      const result = await window.scripts.execute(script.script_content, script.script_type);
      if (result.success) {
        toast.success('Script executed successfully');
        console.log('Output:', result.stdout);
      } else {
        toast.error('Script failed: ' + (result.error || result.stderr));
        console.error('Error:', result.stderr);
      }
    } catch (error) {
      console.error('Failed to execute:', error);
      toast.error('Failed to execute script');
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setScriptToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!scriptToDelete) return;

    try {
      await window.scripts.delete(scriptToDelete);
      toast.success('Script deleted successfully');
      loadScripts();
    } catch (error) {
      console.error('Failed to delete script:', error);
      toast.error('Failed to delete script');
    } finally {
      setDeleteConfirmOpen(false);
      setScriptToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditingScript(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading scripts...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Scripts Grid - Chrome-style */}
        <div className="flex flex-wrap gap-6 mb-8">
          {scripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              onExecute={handleExecute}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {/* Add Shortcut Button */}
          <div
            className="flex flex-col items-center gap-2 w-24 cursor-pointer"
            onClick={() => {
              setEditingScript(null);
              setAddDialogOpen(true);
            }}
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 transition-all">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm text-center text-foreground">Add shortcut</span>
          </div>
        </div>

        {scripts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No scripts found</p>
            <p className="text-sm">Click "Add shortcut" to get started</p>
          </div>
        )}

        {/* Dialogs */}
        <AddScriptDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadScripts}
          script={editingScript}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Remove script?"
          description="This script will be permanently deleted."
          onConfirm={confirmDelete}
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  );
}
