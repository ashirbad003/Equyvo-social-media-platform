import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock, Sparkles, Brain, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAISearch, SearchSuggestion } from '@/lib/ai-search';

interface SearchSuggestProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showTrending?: boolean;
  maxSuggestions?: number;
  autoFocus?: boolean;
  hideKeyboardShortcuts?: boolean;
}

const SearchSuggest: React.FC<SearchSuggestProps> = ({
  onSearch,
  placeholder = "Search for content, users, tags...",
  className,
  showTrending = true,
  maxSuggestions = 8,
  autoFocus = false,
  hideKeyboardShortcuts = true
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { suggestions, isLoading, generateSuggestions, saveSearch } = useAISearch();

  // Enhanced SEO-friendly search tracking
  const trackSearchEvent = useCallback((searchQuery: string, action: string) => {
    // Google Analytics-like tracking
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'search', {
        search_term: searchQuery,
        action: action,
        category: 'search_engagement'
      });
    }
    
    // Custom analytics
    const searchEvent = {
      query: searchQuery,
      action,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('search_session') || 'unknown'
    };
    
    // Store for analytics (in real app, send to analytics service)
    const events = JSON.parse(localStorage.getItem('search_events') || '[]');
    events.push(searchEvent);
    localStorage.setItem('search_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
  }, []);

  // Generate suggestions with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        generateSuggestions(query.trim());
        trackSearchEvent(query.trim(), 'suggestion_request');
      }
    }, 100); // Reduced debounce to 100ms for instant real-time response

    return () => clearTimeout(timeoutId);
  }, [query, generateSuggestions, trackSearchEvent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, selectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update state if value actually changed to prevent unnecessary re-renders
    if (value !== query) {
      setQuery(value);
      // Only open dropdown if there's content or if we're typing (not deleting to empty)
      if (value.trim() || value.length > query.length) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      setSelectedIndex(-1);
    }
  };

  const handleInputFocus = () => {
    // Only open and generate suggestions if there's content or if we haven't generated default suggestions yet
    if (query.trim() || suggestions.length === 0) {
      setIsOpen(true);
      if (!query.trim() && suggestions.length === 0) {
        generateSuggestions(''); // Load default suggestions
      }
    }
  };

  const handleInputBlur = () => {
    // Don't immediately close to allow clicking on suggestions
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleSearch = useCallback(() => {
    const searchQuery = query.trim();
    if (searchQuery) {
      setIsSearching(true);
      trackSearchEvent(searchQuery, 'search_executed');
      saveSearch(searchQuery);
      
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        // Use React Router's navigate for reliable SPA navigation
        navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
      }
      
      setTimeout(() => {
        setIsSearching(false);
        setIsOpen(false);
      }, 300);
    }
  }, [query, onSearch, trackSearchEvent, saveSearch, navigate]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    setIsOpen(false);
    setSelectedIndex(-1);
    trackSearchEvent(suggestion.label, 'suggestion_clicked');
    saveSearch(suggestion.label);
    
    if (onSearch) {
      onSearch(suggestion.label);
    } else {
      // Use React Router's navigate for reliable SPA navigation
      navigate(`/app/search?q=${encodeURIComponent(suggestion.label)}&category=${encodeURIComponent(suggestion.category)}`);
    }
  }, [onSearch, trackSearchEvent, saveSearch, navigate]);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'ai-generated': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'recent': return <Clock className="h-4 w-4 text-green-500" />;
      case 'trending': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'personal': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Photography': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Video': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Music': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Food': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Fitness': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Travel': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'Technology': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'Fashion': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Art': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Gaming': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'Trending': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Recent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Education': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Lifestyle': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Reviews': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Entertainment': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Group suggestions by type for better organization
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = [];
    }
    groups[suggestion.type].push(suggestion);
    return groups;
  }, {} as Record<string, SearchSuggestion[]>);

  return (
    <div ref={dropdownRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {query && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-12 w-full bg-background/60 backdrop-blur-md border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-background/80"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoComplete="off"
          spellCheck="false"
          autoFocus={autoFocus}
          // SEO attributes
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label="Search input"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-lg border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <Brain className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p>AI is thinking...</p>
              </div>
            ) : suggestions.length === 0 && query ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Search className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p>No suggestions found for "{query}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                {/* AI-Generated Suggestions */}
                {groupedSuggestions['ai-generated'] && groupedSuggestions['ai-generated'].length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Brain className="h-3 w-3 text-blue-500" />
                      AI Suggestions
                    </div>
                    {groupedSuggestions['ai-generated'].slice(0, maxSuggestions).map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 text-left hover:bg-accent/60 transition-all duration-200 rounded-md group transform hover:scale-[1.02]",
                          selectedIndex === index && "bg-accent/80"
                        )}
                        role="option"
                        aria-selected={selectedIndex === index}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getSuggestionIcon(suggestion.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm group-hover:text-primary transition-colors duration-200 truncate">
                              {suggestion.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors duration-200 truncate">
                              {suggestion.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge className={cn("text-xs shrink-0", getCategoryColor(suggestion.category))}>
                            {suggestion.category}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {groupedSuggestions['recent'] && groupedSuggestions['recent'].length > 0 && (
                  <div className="p-2 border-t border-border/30">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3 text-green-500" />
                      Recent Searches
                    </div>
                    {groupedSuggestions['recent'].map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 text-left hover:bg-accent/60 transition-all duration-200 rounded-md group transform hover:scale-[1.02]",
                          selectedIndex === (groupedSuggestions['ai-generated']?.length || 0) + index && "bg-accent/80"
                        )}
                        role="option"
                        aria-selected={selectedIndex === (groupedSuggestions['ai-generated']?.length || 0) + index}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getSuggestionIcon(suggestion.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm group-hover:text-primary transition-colors duration-200 truncate">
                              {suggestion.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors duration-200 truncate">
                              {suggestion.description}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Trending Suggestions */}
                {showTrending && groupedSuggestions['trending'] && groupedSuggestions['trending'].length > 0 && (
                  <div className="p-2 border-t border-border/30">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      Trending Now
                    </div>
                    {groupedSuggestions['trending'].slice(0, 3).map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 text-left hover:bg-accent/60 transition-all duration-200 rounded-md group transform hover:scale-[1.02]",
                          selectedIndex === (groupedSuggestions['ai-generated']?.length || 0) + 
                                       (groupedSuggestions['recent']?.length || 0) + index && "bg-accent/80"
                        )}
                        role="option"
                        aria-selected={selectedIndex === (groupedSuggestions['ai-generated']?.length || 0) + 
                                                   (groupedSuggestions['recent']?.length || 0) + index}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getSuggestionIcon(suggestion.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium group-hover:text-primary transition-colors duration-200 truncate">
                              {suggestion.label}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors duration-200 truncate">
                              {suggestion.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge className={cn("text-xs shrink-0", getCategoryColor(suggestion.category))}>
                            {suggestion.category}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search footer - Hidden on mobile */}
                {!hideKeyboardShortcuts && (
                  <div className="hidden md:flex p-3 border-t border-border/30 bg-muted/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        <span>Powered by AI</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">↑↓</kbd>
                        <span>Navigate</span>
                        <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">Enter</kbd>
                        <span>Select</span>
                        <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">Esc</kbd>
                        <span>Close</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggest;
