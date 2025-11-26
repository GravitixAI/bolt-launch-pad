import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Executable } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddExecutableDialog } from '../components/Executables/AddExecutableDialog';
import { ExecutableCard } from '../components/Executables/ExecutableCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../lib/utils';

export function ExecutablesView() {
  const { userEmail } = useAuth();
  const [executables, setExecutables] = useState<Executable[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingExecutable, setEditingExecutable] = useState<Executable | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [executableToDelete, setExecutableToDelete] = useState<string | null>(null);
  const [prefilledTag, setPrefilledTag] = useState<string | null>(null);
  const [draggingExecutable, setDraggingExecutable] = useState<Executable | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

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
      setPrefilledTag(null);
    }
  };

  const handleAddWithTag = (tag: string) => {
    setEditingExecutable(null);
    setPrefilledTag(tag);
    setAddDialogOpen(true);
  };

  // Drag and drop handlers for reordering between sections
  const handleDragStart = (executable: Executable) => {
    setDraggingExecutable(executable);
  };

  const handleDragOverSection = (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetTag);
  };

  const handleDragLeaveSection = () => {
    setDropTarget(null);
  };

  const handleDropOnSection = async (e: React.DragEvent, targetTag: string | null) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggingExecutable) return;

    const currentTags = draggingExecutable.tags
      ? draggingExecutable.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      : [];

    let newTags: string[];

    if (targetTag === null) {
      newTags = [];
    } else {
      if (currentTags.length === 0) {
        newTags = [targetTag];
      } else if (currentTags.length === 1) {
        newTags = [targetTag];
      } else {
        if (currentTags.includes(targetTag)) {
          console.log('Executable already has this tag');
          setDraggingExecutable(null);
          return;
        }
        newTags = [targetTag, ...currentTags.slice(1)];
      }
    }

    const newTagsString = newTags.join(', ');

    try {
      await window.executables.update(draggingExecutable.id, {
        tags: newTagsString || undefined,
        updated_by: userEmail || 'local-user',
      });
      toast.success(`Moved to ${targetTag || 'General'}`);
      loadExecutables();
    } catch (error) {
      console.error('Failed to update executable tags:', error);
      toast.error('Failed to move executable');
    } finally {
      setDraggingExecutable(null);
    }
  };

  // Group executables by tags
  const groupedExecutables = () => {
    const groups: { [key: string]: Executable[] } = {};
    const untagged: Executable[] = [];

    executables.forEach((executable) => {
      if (!executable.tags || executable.tags.trim() === '') {
        untagged.push(executable);
      } else {
        const tags = executable.tags.split(',').map(t => t.trim()).filter(t => t !== '');
        tags.forEach(tag => {
          if (!groups[tag]) {
            groups[tag] = [];
          }
          groups[tag].push(executable);
        });
      }
    });

    return { groups, untagged };
  };

  if (loading) {
    return <div className="p-8">Loading executables...</div>;
  }

  const { groups, untagged } = groupedExecutables();
  const tagNames = Object.keys(groups).sort();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* General (Untagged) Section - Always show, even if empty */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">General</h2>
          <div
            className={cn(
              "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed transition-all",
              dropTarget === null ? "border-primary bg-primary/5" : "border-transparent"
            )}
            onDragOver={(e) => handleDragOverSection(e, null)}
            onDragLeave={handleDragLeaveSection}
            onDrop={(e) => handleDropOnSection(e, null)}
          >
            {untagged.map((executable) => (
              <ExecutableCard
                key={executable.id}
                executable={executable}
                onLaunch={handleLaunch}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDragStart={handleDragStart}
                isDragging={draggingExecutable?.id === executable.id}
              />
            ))}
            
            {/* Add Shortcut Button - always visible in General section */}
            <div
              className="flex flex-col items-center gap-2 w-24 cursor-pointer"
              onClick={() => {
                setEditingExecutable(null);
                setPrefilledTag(null);
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

        {/* Tagged Groups - Alphabetically sorted, only show if has items */}
        {tagNames.map((tag) => {
          const tagExecutables = groups[tag];
          if (tagExecutables.length === 0) return null; // Don't show empty tag sections
          
          return (
            <div key={tag}>
              <h2 className="text-xl font-semibold mb-4 text-foreground capitalize">{tag}</h2>
              <div
                className={cn(
                  "flex flex-wrap gap-6 p-4 rounded-lg border-2 border-dashed transition-all",
                  dropTarget === tag ? "border-primary bg-primary/5" : "border-transparent"
                )}
                onDragOver={(e) => handleDragOverSection(e, tag)}
                onDragLeave={handleDragLeaveSection}
                onDrop={(e) => handleDropOnSection(e, tag)}
              >
                {tagExecutables.map((executable) => (
                  <ExecutableCard
                    key={executable.id}
                    executable={executable}
                    onLaunch={handleLaunch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    isDragging={draggingExecutable?.id === executable.id}
                  />
                ))}
                
                {/* Add Shortcut Button for this tag */}
                <div
                  className="flex flex-col items-center gap-2 w-24 cursor-pointer"
                  onClick={() => handleAddWithTag(tag)}
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
        <AddExecutableDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          onSuccess={loadExecutables}
          executable={editingExecutable}
          prefilledTag={prefilledTag}
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
