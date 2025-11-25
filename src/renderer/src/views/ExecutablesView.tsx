import { useState, useEffect } from 'react';
import { Plus, Play, Upload } from 'lucide-react';
import { SearchBar } from '../components/Layout/SearchBar';
import { Button } from '../components/ui/button';
import { Executable } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AddExecutableDialog } from '../components/Executables/AddExecutableDialog';

export function ExecutablesView() {
  const { userEmail } = useAuth();
  const [executables, setExecutables] = useState<Executable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      loadExecutables();
      return;
    }
    try {
      const results = await window.executables.search(term, userEmail || undefined);
      setExecutables(results);
    } catch (error) {
      console.error('Search failed:', error);
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

  const handlePromoteToTeam = async (id: string) => {
    try {
      await window.executables.promoteToTeam(id, userEmail || '');
      toast.success('Executable promoted to team level');
      loadExecutables();
    } catch (error) {
      console.error('Failed to promote:', error);
      toast.error('Failed to promote executable');
    }
  };

  if (loading) {
    return <div className="p-8">Loading executables...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Executables</h2>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Executable
          </Button>
        </div>

        {/* Add Dialog */}
        <AddExecutableDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={loadExecutables}
        />

        {/* Search */}
        <SearchBar onSearch={handleSearch} placeholder="Search executables..." />

        {/* Executables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {executables.map((executable) => (
            <div
              key={executable.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {executable.icon && (
                    <img src={executable.icon} alt="" className="w-6 h-6" />
                  )}
                  <h3 className="font-semibold text-foreground truncate">{executable.title}</h3>
                </div>
                {executable.is_team_level === 1 && (
                  <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Team</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate mb-1">{executable.executable_path}</p>
              {executable.parameters && (
                <p className="text-xs text-muted-foreground truncate mb-3">Params: {executable.parameters}</p>
              )}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleLaunch(executable)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Launch
                </Button>
                {executable.is_team_level === 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePromoteToTeam(executable.id)}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {executables.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No executables found</p>
            <p className="text-sm">Add your first executable to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

