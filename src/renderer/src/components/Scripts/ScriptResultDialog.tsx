import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ScriptExecutionResult } from '../../types';

interface ScriptResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ScriptExecutionResult | null;
  scriptTitle: string;
}

export function ScriptResultDialog({ open, onOpenChange, result, scriptTitle }: ScriptResultDialogProps) {
  if (!result) return null;

  const handleCopy = () => {
    const output = result.stdout || result.stderr || result.error || '';
    navigator.clipboard.writeText(output);
    toast.success('Output copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <span>{scriptTitle} - Execution Result</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exit Code */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">Exit Code:</span>
            <span className={`px-2 py-0.5 rounded ${result.exitCode === 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/20 text-destructive'}`}>
              {result.exitCode ?? 'N/A'}
            </span>
          </div>

          {/* Standard Output */}
          {result.stdout && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Output:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="p-4 bg-muted rounded-lg text-sm overflow-auto max-h-[300px] text-foreground font-mono whitespace-pre-wrap break-all overflow-wrap-anywhere">
                {result.stdout}
              </pre>
            </div>
          )}

          {/* Standard Error */}
          {result.stderr && (
            <div className="space-y-2">
              <span className="font-semibold text-destructive">Error Output:</span>
              <pre className="p-4 bg-destructive/10 rounded-lg text-sm overflow-auto max-h-[200px] text-destructive font-mono whitespace-pre-wrap break-all overflow-wrap-anywhere">
                {result.stderr}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {result.error && (
            <div className="space-y-2">
              <span className="font-semibold text-destructive">Error Message:</span>
              <pre className="p-4 bg-destructive/10 rounded-lg text-sm overflow-auto max-h-[200px] text-destructive font-mono whitespace-pre-wrap break-all overflow-wrap-anywhere">
                {result.error}
              </pre>
            </div>
          )}

          {/* Empty output message */}
          {!result.stdout && !result.stderr && !result.error && result.success && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Script executed successfully with no output</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

