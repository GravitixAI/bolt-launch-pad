import { useState, useEffect } from 'react';
import { Plus, Play, Copy, Upload } from 'lucide-react';
import { SearchBar } from '../components/Layout/SearchBar';
import { Button } from '../components/ui/button';
import { Script } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function ScriptsView() {
  const { userEmail } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term) {
      loadScripts();
      return;
    }
    try {
      const results = await window.scripts.search(term, userEmail || undefined);
      setScripts(results);
    } catch (error) {
      console.error('Search failed:', error);
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

  const handleCopy = async (script: Script) => {
    try {
      await window.scripts.copyToClipboard(script.script_content);
      toast.success('Script copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy script');
    }
  };

  const handlePromoteToTeam = async (id: string) => {
    try {
      await window.scripts.promoteToTeam(id, userEmail || '');
      toast.success('Script promoted to team level');
      loadScripts();
    } catch (error) {
      console.error('Failed to promote:', error);
      toast.error('Failed to promote script');
    }
  };

  if (loading) {
    return <div className="p-8">Loading scripts...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Scripts</h2>
          <Button onClick={() => toast.info('Add script dialog - coming soon')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Script
          </Button>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} placeholder="Search scripts..." />

        {/* Scripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {script.icon && (
                    <img src={script.icon} alt="" className="w-5 h-5" />
                  )}
                  <h3 className="font-semibold">{script.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground">
                    {script.script_type}
                  </span>
                  {script.is_team_level === 1 && (
                    <span className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Team</span>
                  )}
                </div>
              </div>
              <pre className="text-xs bg-muted p-2 rounded mb-3 max-h-32 overflow-auto">
                {script.script_content.substring(0, 200)}
                {script.script_content.length > 200 && '...'}
              </pre>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleExecute(script)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCopy(script)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {script.is_team_level === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePromoteToTeam(script.id)}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {scripts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No scripts found</p>
            <p className="text-sm">Add your first script to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

