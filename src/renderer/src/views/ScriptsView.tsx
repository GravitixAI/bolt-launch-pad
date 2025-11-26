import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Script, ScriptExecutionResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddScriptDialog } from '../components/Scripts/AddScriptDialog';
import { ScriptCard } from '../components/Scripts/ScriptCard';
import { ScriptResultDialog } from '../components/Scripts/ScriptResultDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../lib/utils';

export function ScriptsView() {
  const { userEmail } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);
  const [prefilledTag, setPrefilledTag] = useState<string | null>(null);
  const [draggingScript, setDraggingScript] = useState<Script | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<ScriptExecutionResult | null>(null);
  const [executedScriptTitle, setExecutedScriptTitle] = useState<string>('');

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
      
      // Store result and open dialog
      setExecutionResult(result);
      setExecutedScriptTitle(script.title);
      setResultDialogOpen(true);
      
      // Also show toast for quick feedback
      if (result.success) {
        toast.success('Script executed successfully');
      } else {
        toast.error('Script failed - see details');
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
      setPrefilledTag(null);
    }
  };

  const handleDragStart = (script: Script) => {
    setDraggingScript(script);
  };

  const handleDragOverSection = (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(targetTag);
  };

  const handleDragLeaveSection = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDropOnSection = async (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);

    if (!draggingScript) return;

    try {
      const currentTags = draggingScript.tags ? draggingScript.tags.split(',').map(t => t.trim()) : [];
      const sourceTag = currentTags[0] || null;

      // Don't update if dropped on the same section
      if (sourceTag === targetTag) {
        setDraggingScript(null);
        return;
      }

      let newTags: string[];
      if (currentTags.length === 0) {
        // No tags → add target tag (or leave empty for General)
        newTags = targetTag ? [targetTag] : [];
      } else if (currentTags.length === 1) {
        // Single tag → replace with target tag (or empty for General)
        newTags = targetTag ? [targetTag] : [];
      } else {
        // Multiple tags → swap the first tag with target tag
        newTags = targetTag ? [targetTag, ...currentTags.slice(1)] : currentTags.slice(1);
      }

      await window.scripts.update(draggingScript.id, {
        tags: newTags.join(','),
        updated_by: userEmail || 'local-user',
      });

      toast.success('Script moved successfully');
      loadScripts();
    } catch (error) {
      console.error('Failed to move script:', error);
      toast.error('Failed to move script');
    } finally {
      setDraggingScript(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading scripts...</div>;
  }

  // Group scripts by tags
  const generalScripts = scripts.filter(s => !s.tags || s.tags.trim() === '');
  const taggedScripts = scripts.filter(s => s.tags && s.tags.trim() !== '');

  // Get unique tags
  const allTags = new Set<string>();
  taggedScripts.forEach(script => {
    if (script.tags) {
      script.tags.split(',').forEach(tag => allTags.add(tag.trim()));
    }
  });
  const sortedTags = Array.from(allTags).sort();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* General Section (always visible) */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">General</h2>
          <div
            onDragOver={(e) => handleDragOverSection(e, null)}
            onDragLeave={handleDragLeaveSection}
            onDrop={(e) => handleDropOnSection(e, null)}
            className={cn(
              "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed min-h-[120px] transition-all",
              dropTarget === null ? "border-primary bg-primary/5" : "border-transparent"
            )}
          >
            {generalScripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                onExecute={handleExecute}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDragStart={handleDragStart}
              />
            ))}

            {/* Add Shortcut Button */}
            <div
              className="flex flex-col items-center gap-2 w-24 cursor-pointer"
              onClick={() => {
                setEditingScript(null);
                setPrefilledTag(null);
                setAddDialogOpen(true);
              }}
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 transition-all">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm text-center text-foreground">Add shortcut</span>
            </div>

            {generalScripts.length === 0 && scripts.length === 0 && (
              <div className="w-full text-center py-12 text-muted-foreground">
                <p>No scripts found</p>
                <p className="text-sm">Click "Add shortcut" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Tagged Sections */}
        {sortedTags.map(tag => {
          const scriptsForTag = taggedScripts.filter(s => 
            s.tags?.split(',').map(t => t.trim()).includes(tag)
          );

          // Only render if there are scripts with this tag
          if (scriptsForTag.length === 0) return null;

          return (
            <div key={tag}>
              <h2 className="text-2xl font-bold mb-4 text-foreground capitalize">{tag}</h2>
              <div
                onDragOver={(e) => handleDragOverSection(e, tag)}
                onDragLeave={handleDragLeaveSection}
                onDrop={(e) => handleDropOnSection(e, tag)}
                className={cn(
                  "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed min-h-[120px] transition-all",
                  dropTarget === tag ? "border-primary bg-primary/5" : "border-transparent"
                )}
              >
                {scriptsForTag.map((script) => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    onExecute={handleExecute}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                  />
                ))}

                {/* Add Shortcut Button for this tag */}
                <div
                  className="flex flex-col items-center gap-2 w-24 cursor-pointer"
                  onClick={() => {
                    setEditingScript(null);
                    setPrefilledTag(tag);
                    setAddDialogOpen(true);
                  }}
                >
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted hover:bg-accent hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 transition-all">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-center text-foreground">Add shortcut</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dialogs */}
        <AddScriptDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadScripts}
          script={editingScript}
          prefilledTag={prefilledTag}
        />

        <ScriptResultDialog
          open={resultDialogOpen}
          onOpenChange={setResultDialogOpen}
          result={executionResult}
          scriptTitle={executedScriptTitle}
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
