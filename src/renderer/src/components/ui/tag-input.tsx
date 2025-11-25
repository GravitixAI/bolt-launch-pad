import { useState, KeyboardEvent, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

interface TagInputProps {
  value: string; // Comma-separated tags
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse comma-separated string into array
  const tags = value
    .split(',')
    .map(t => t.trim())
    .filter(t => t !== '');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag === '') return;

    // Check if tag already exists
    if (tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      setInputValue('');
      return;
    }

    const newTags = [...tags, trimmedTag];
    onChange(newTags.join(', '));
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    // Add tag on blur if there's input
    if (inputValue.trim() !== '') {
      addTag(inputValue);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Tag Tokens */}
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
        >
          <span className="capitalize">{tag}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

