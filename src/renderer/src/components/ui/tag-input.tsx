import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

interface TagInputProps {
  value: string; // Comma-separated tags
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  existingTags?: string[]; // All available tags for autocomplete
}

export function TagInput({ value, onChange, placeholder, className, existingTags = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated string into array
  const tags = value
    .split(',')
    .map(t => t.trim())
    .filter(t => t !== '');

  // Filter suggestions based on input
  const suggestions = existingTags
    .filter(tag => {
      // Don't suggest already added tags
      if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) return false;
      // Filter by input
      return tag.toLowerCase().includes(inputValue.toLowerCase());
    })
    .slice(0, 8); // Limit to 8 suggestions

  // Show dropdown when there are suggestions and input is focused
  useEffect(() => {
    setShowDropdown(inputValue.length > 0 && suggestions.length > 0);
    setSelectedIndex(0);
  }, [inputValue, suggestions.length]);

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
    // Handle dropdown navigation
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addTag(suggestions[selectedIndex]);
        setShowDropdown(false);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    // Normal tag input behavior
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicking on dropdown items
    setTimeout(() => {
      setShowDropdown(false);
      // Add tag on blur if there's input
      if (inputValue.trim() !== '') {
        addTag(inputValue);
      }
    }, 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
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
          onFocus={() => {
            if (inputValue.length > 0 && suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSuggestionClick(suggestion);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm capitalize transition-colors',
                'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                index === selectedIndex && 'bg-accent text-accent-foreground'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

