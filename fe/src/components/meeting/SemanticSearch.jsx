
import React, { useState, useEffect } from 'react';
import NeoSearchInput from '../ui/NeoSearchInput';
import { Search, Clock, User } from 'lucide-react';

/**
 * SemanticSearch - Search within meeting content with semantic understanding
 */
const SemanticSearch = ({
    meetingId,
    onSearch,
    onResultClick,
    transcript = [],
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            setHasSearched(true);

            try {
                let searchResults = null;

                // Try API search first
                if (onSearch) {
                    searchResults = await onSearch(query);
                }

                // If API returned null or empty, use local search fallback
                if (!searchResults || searchResults.length === 0) {
                    const queryLower = query.toLowerCase();
                    searchResults = transcript
                        .filter(entry =>
                            entry.text.toLowerCase().includes(queryLower) ||
                            entry.speaker.toLowerCase().includes(queryLower)
                        )
                        .map(entry => ({
                            ...entry,
                            excerpt: getExcerpt(entry.text, query),
                        }));

                    // Small delay for visual feedback
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                setResults(searchResults || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, transcript, onSearch]);

    const getExcerpt = (text, query) => {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        const index = textLower.indexOf(queryLower);

        if (index === -1) return text.slice(0, 100) + '...';

        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + query.length + 50);

        let excerpt = text.slice(start, end);
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';

        return excerpt;
    };

    const highlightMatch = (text, query) => {
        if (!query.trim()) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="bg-neo-yellow px-0.5 font-bold">{part}</mark>
                : part
        );
    };

    const handleResultClick = (result) => {
        if (onResultClick) {
            onResultClick(result);
        }
    };

    return (
        <div className="bg-white border-4 border-black shadow-neo">
            {/* Header */}
            <div className="p-4 border-b-4 border-black bg-neo-teal">
                <h3 className="flex items-center gap-2 font-black uppercase text-black">
                    <Search size={20} />
                    Search Meeting
                </h3>
                <p className="text-xs font-medium mt-1 text-gray-700">
                    Find specific moments and discussions
                </p>
            </div>

            {/* Search Input */}
            <div className="p-4">
                <NeoSearchInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClear={() => setQuery('')}
                    placeholder="Search meeting content..."
                    isLoading={isSearching}
                />
            </div>

            {/* Results */}
            {(hasSearched || results.length > 0) && (
                <div className="border-t-4 border-black max-h-80 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-medium">
                            {isSearching
                                ? 'Searching...'
                                : 'No results found for your search.'
                            }
                        </div>
                    ) : (
                        <div className="divide-y-2 divide-black">
                            <div className="px-4 py-2 bg-neo-white text-xs font-bold text-gray-600">
                                {results.length} result{results.length !== 1 ? 's' : ''} found
                            </div>
                            {results.map((result, index) => (
                                <button
                                    key={result.id || index}
                                    onClick={() => handleResultClick(result)}
                                    className="
                                        w-full text-left p-4 
                                        hover:bg-neo-yellow transition-colors
                                    "
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="flex items-center gap-1 text-xs font-mono text-gray-500">
                                            <Clock size={12} />
                                            {result.timestamp}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                                            <User size={12} />
                                            {result.speaker}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {highlightMatch(result.excerpt || result.text, query)}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SemanticSearch;
