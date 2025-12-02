import { useState, useRef, useEffect } from 'react';
import { useJobAutocomplete } from '../../hooks/useJobAutocomplete';
import './JobAutocomplete.css';

interface JobAutocompleteProps {
  onSelect: (job: string) => void;
  placeholder?: string;
}

export function JobAutocomplete({ onSelect, placeholder = "e.g., Software Engineer, Data Scientist, Product Manager..." }: JobAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { suggestions, isLoading, error, fetchSuggestions, clearSuggestions } = useJobAutocomplete();

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedJob(null); // Always clear selection when typing
    setFocusedIndex(-1);
    
    // If input is empty, clear selection and notify parent
    if (value.trim().length === 0) {
      onSelect(''); // Notify parent that selection is cleared
      clearSuggestions();
      setIsOpen(false);
      return;
    }
    
    if (value.trim().length >= 2) {
      fetchSuggestions(value);
      setIsOpen(true);
    } else {
      clearSuggestions();
      setIsOpen(false);
    }
  };

  // Handle suggestion selection
  const handleSelect = (job: string) => {
    setInputValue(job);
    setSelectedJob(job);
    setIsOpen(false);
    clearSuggestions();
    onSelect(job);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && suggestions[focusedIndex]) {
          handleSelect(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const focusedElement = dropdownRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  const showDropdown = isOpen && (suggestions.length > 0 || isLoading || error);

  return (
    <div className="job-autocomplete">
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className={`autocomplete-input ${selectedJob ? 'has-selection' : ''}`}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search for job role"
          aria-autocomplete="list"
          aria-controls="job-suggestions"
          aria-expanded={showDropdown}
          autoComplete="off"
        />
        {isLoading && (
          <div className="autocomplete-spinner" aria-hidden="true">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          id="job-suggestions"
          className="autocomplete-dropdown"
          role="listbox"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="dropdown-loading">
              <span>Searching roles...</span>
            </div>
          )}

          {error && (
            <div className="dropdown-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && (
            <div className="dropdown-empty">
              <span>No roles found. Try a different search.</span>
            </div>
          )}

          {suggestions.map((job, index) => (
            <button
              key={index}
              type="button"
              className={`dropdown-item ${index === focusedIndex ? 'focused' : ''}`}
              onClick={() => handleSelect(job)}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={index === focusedIndex}
            >
              <span className="job-icon">💼</span>
              <span className="job-text">{job}</span>
            </button>
          ))}
        </div>
      )}

      {/* Validation indicator */}
      {selectedJob && (
        <div className="selection-indicator">
          <span className="check-icon">✓</span>
          <span className="selected-text">Ready to start interview</span>
        </div>
      )}
    </div>
  );
}
