import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Terminal } from 'lucide-react';
import { Script } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ScriptCardProps {
  script: Script;
  onExecute: (script: Script) => void;
  onEdit: (script: Script) => void;
  onDelete: (id: string) => void;
  onDragStart?: (script: Script) => void;
}

export function ScriptCard({ script, onExecute, onEdit, onDelete, onDragStart }: ScriptCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group flex flex-col items-center gap-2 w-24"
      draggable={true}
      onDragStart={() => onDragStart?.(script)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main clickable card */}
      <div
        className={`relative flex items-center justify-center w-20 h-20 rounded-full bg-muted transition-all cursor-pointer hover:bg-accent hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 ${
          isHovered ? 'bg-accent scale-105 shadow-lg ring-2 ring-border dark:shadow-white/20 dark:ring-white/30 dark:brightness-125' : ''
        }`}
        onClick={() => onExecute(script)}
      >
        {/* Icon or fallback */}
        {script.icon ? (
          <img
            src={script.icon}
            alt={script.title}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
        )}

        {/* Kabob menu - appears on hover */}
        {isHovered && (
          <div className="absolute top-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-background/80 hover:shadow-md hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/40 dark:hover:brightness-125 text-foreground transition-all"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(script)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit shortcut
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(script.id)} className="text-destructive dark:text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Title */}
      <span className="text-sm text-center text-foreground truncate w-full px-1">
        {script.title}
      </span>

      {/* Badge for script type */}
      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
        {script.script_type}
      </span>
    </div>
  );
}

