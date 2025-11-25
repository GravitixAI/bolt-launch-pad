import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Bookmark } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onOpen: (url: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

export function BookmarkCard({ bookmark, onOpen, onEdit, onDelete }: BookmarkCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group flex flex-col items-center gap-2 w-28"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main clickable card */}
      <div
        className={`relative flex items-center justify-center w-24 h-24 rounded-full bg-muted transition-all cursor-pointer hover:bg-accent hover:shadow-lg hover:ring-2 hover:ring-border dark:hover:shadow-white/20 dark:hover:ring-white/30 dark:hover:brightness-125 ${
          isHovered ? 'bg-accent scale-105 shadow-lg ring-2 ring-border dark:shadow-white/20 dark:ring-white/30 dark:brightness-125' : ''
        }`}
        onClick={() => onOpen(bookmark.url)}
      >
        {/* Favicon or fallback */}
        {bookmark.favicon ? (
          <img
            src={bookmark.favicon}
            alt={bookmark.title}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary">
              {bookmark.title.charAt(0).toUpperCase()}
            </span>
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
                <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit shortcut
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(bookmark.id)} className="text-destructive dark:text-red-400">
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
        {bookmark.title}
      </span>
    </div>
  );
}

