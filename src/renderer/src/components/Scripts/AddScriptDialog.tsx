import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { TagInput, TagInputRef } from '../ui/tag-input';
import { ScriptAssistantChat } from './ScriptAssistantChat';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Script } from '../../types';

interface AddScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  script?: Script | null;
  prefilledTag?: string | null;
}

export function AddScriptDialog({ open, onOpenChange, onSuccess, script, prefilledTag }: AddScriptDialogProps) {
  const { userEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const tagInputRef = useRef<TagInputRef>(null);
  const [formData, setFormData] = useState({
    title: '',
    script_content: '',
    script_type: 'powershell' as 'powershell' | 'cmd',
    tags: '',
  });
  const [testOutput, setTestOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Load existing tags for autocomplete
  useEffect(() => {
    const loadTags = async () => {
      try {
        const allScripts = await window.scripts.getAll(userEmail || undefined);
        const tagsSet = new Set<string>();
        allScripts.forEach(s => {
          if (s.tags) {
            s.tags.split(',').forEach(tag => tagsSet.add(tag.trim()));
          }
        });
        setExistingTags(Array.from(tagsSet));
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, [userEmail]);

  useEffect(() => {
    if (script) {
      setFormData({
        title: script.title,
        script_content: script.script_content,
        script_type: script.script_type,
        tags: script.tags || '',
      });
    } else {
      setFormData({ 
        title: '', 
        script_content: '', 
        script_type: 'powershell', 
        tags: prefilledTag || '' 
      });
    }
  }, [script, prefilledTag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.script_content) {
      toast.error('Please fill in required fields');
      return;
    }

    // Commit any pending tag input before saving
    const finalTags = tagInputRef.current?.commitPendingTag() || formData.tags;
    console.log('📋 Script tags before save:', finalTags);

    setLoading(true);
    try {
      // Check for duplicate script (by title or exact content match, unless editing the same script)
      if (!script) {
        const allScripts = await window.scripts.getAll(userEmail || undefined);
        const duplicateByTitle = allScripts.find(s => s.title.toLowerCase() === formData.title.toLowerCase());
        const duplicateByContent = allScripts.find(s => s.script_content === formData.script_content);
        
        if (duplicateByTitle) {
          toast.error(`A script with this title already exists: "${duplicateByTitle.title}"`);
          setLoading(false);
          return;
        }
        if (duplicateByContent) {
          toast.error(`A script with identical content already exists: "${duplicateByContent.title}"`);
          setLoading(false);
          return;
        }
      }

      // Get default icon based on script type
      const icon = formData.script_type === 'powershell' 
        ? await window.system.getDefaultPowerShellIcon()
        : await window.system.getDefaultCmdIcon();
      
      console.log(`📦 Retrieved ${formData.script_type} icon, length:`, icon?.length || 'NULL');

      console.log('💾 Saving script with icon length:', icon?.length || 'NULL');
      
      if (script) {
        await window.scripts.update(script.id, {
          title: formData.title,
          script_content: formData.script_content,
          script_type: formData.script_type,
          icon,
          tags: finalTags || undefined,
          updated_by: userEmail || 'local-user',
        });
        toast.success('Script updated successfully');
      } else {
        await window.scripts.create({
          title: formData.title,
          script_content: formData.script_content,
          script_type: formData.script_type,
          icon,
          tags: finalTags || undefined,
          is_team_level: 0,
          is_personal: 1,
          created_by: userEmail || 'local-user',
          updated_by: userEmail || 'local-user',
        });
        toast.success('Script created successfully');
      }

      setFormData({ title: '', script_content: '', script_type: 'powershell', tags: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(`Failed to ${script ? 'update' : 'create'} script:`, error);
      toast.error(`Failed to ${script ? 'update' : 'create'} script`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertCode = (code: string) => {
    setFormData(prev => ({ ...prev, script_content: code }));
    toast.success('Code inserted into editor');
  };

  const handleRunTest = async () => {
    if (!formData.script_content.trim()) {
      toast.error('Please enter script content to test');
      return;
    }

    setIsRunning(true);
    setTestOutput('Running...\n');

    try {
      const result = await window.scripts.execute(formData.script_content, formData.script_type);
      
      let output = '';
      if (result.stdout) {
        output += result.stdout;
      }
      if (result.stderr) {
        output += '\n--- Errors ---\n' + result.stderr;
      }
      if (result.error) {
        output += '\n--- Error ---\n' + result.error;
      }
      if (!result.stdout && !result.stderr && !result.error) {
        output = 'Script executed with no output.';
      }
      output += `\n\nExit Code: ${result.exitCode ?? 'N/A'}`;
      
      setTestOutput(output);
      
      if (result.success) {
        toast.success('Script test completed successfully');
      } else {
        toast.error('Script test failed');
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to execute test');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{script ? 'Edit Script' : 'Create New Script'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Script Form (2/3 width) */}
          <div className="w-2/3 border-r overflow-y-auto">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 flex flex-col space-y-4 px-6 py-4">
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
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput
                    ref={tagInputRef}
                    value={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    suggestions={existingTags}
                    placeholder="Add tags..."
                  />
                </div>
                
                {/* Script Content - Takes 1/2 of remaining space */}
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="script_content">Script Content *</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRunTest}
                      disabled={isRunning || !formData.script_content.trim()}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isRunning ? 'Running...' : 'Test Run'}
                    </Button>
                  </div>
                  <Textarea
                    id="script_content"
                    value={formData.script_content}
                    onChange={(e) => setFormData({ ...formData, script_content: e.target.value })}
                    placeholder={formData.script_type === 'powershell' 
                      ? 'Write-Host "Hello, World!"' 
                      : 'echo Hello, World!'}
                    required
                    className="flex-1 font-mono resize-none"
                  />
                </div>

                {/* Test Output - Takes 1/2 of remaining space */}
                <div className="flex-1 flex flex-col space-y-2 min-h-0">
                  <Label htmlFor="test_output">Test Output</Label>
                  <Textarea
                    id="test_output"
                    value={testOutput}
                    readOnly
                    placeholder="Script output will appear here after running a test..."
                    className="flex-1 font-mono bg-muted/50 resize-none"
                  />
                </div>
              </div>
              
              <DialogFooter className="px-6 py-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (script ? 'Saving...' : 'Creating...') : 'Done'}
                </Button>
              </DialogFooter>
            </form>
          </div>

          {/* Right Side - AI Assistant Chat (1/3 width) */}
          <div className="w-1/3 flex flex-col">
            <ScriptAssistantChat 
              scriptType={formData.script_type}
              onInsertCode={handleInsertCode}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

