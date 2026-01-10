
import React, { useRef, useEffect, useState } from 'react';
import NeoSearchInput from '../ui/NeoSearchInput';
import NeoBadge from '../ui/NeoBadge';
import { FileText, Clock } from 'lucide-react';

/**
 * TranscriptViewer - Scrollable transcript with speaker grouping and sentiment
 */
const TranscriptViewer = ({
    transcript = [],
    isLoading = false,
    highlightedId = null,
    onTimestampClick = () => { },
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTranscript, setFilteredTranscript] = useState(transcript);
    const containerRef = useRef(null);
    const highlightedRef = useRef(null);

    // Speaker color mapping for consistent colors
    const speakerColors = {};
    const colorPalette = [
        'bg-neo-teal',
        'bg-neo-red',
        'bg-neo-yellow',
        'bg-neo-dark',
        'bg-green-200',
        'bg-orange-200',
    ];

    const getSpeakerColor = (speaker) => {
        if (!speakerColors[speaker]) {
            const index = Object.keys(speakerColors).length % colorPalette.length;
            speakerColors[speaker] = colorPalette[index];
        }
        return speakerColors[speaker];
    };

    // Filter transcript based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTranscript(transcript);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredTranscript(
                transcript.filter(
                    entry =>
                        entry.text.toLowerCase().includes(query) ||
                        entry.speaker.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, transcript]);

    // Scroll to highlighted entry
    useEffect(() => {
        if (highlightedId && highlightedRef.current) {
            highlightedRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [highlightedId]);

    const getSentimentIndicator = (sentiment) => {
        const indicators = {
            positive: <span className="text-green-600">●</span>,
            neutral: <span className="text-gray-400">●</span>,
            negative: <span className="text-red-500">●</span>,
        };
        return indicators[sentiment] || indicators.neutral;
    };

    const highlightSearchTerm = (text, query) => {
        if (!query.trim()) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className="bg-neo-yellow px-0.5">{part}</mark>
                : part
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white border-4 border-black shadow-neo p-4">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={20} />
                    <h3 className="font-black uppercase">Transcript</h3>
                </div>
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="w-16 h-4 bg-gray-200 rounded border-2 border-black"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded border-2 border-black w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded border-2 border-black"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-4 border-black shadow-neo">
            {/* Header with Search */}
            <div className="p-4 border-b-4 border-black bg-neo-white">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <h3 className="flex items-center gap-2 font-black uppercase">
                        <FileText size={20} />
                        Transcript
                        <span className="text-sm font-bold text-gray-500">
                            ({transcript.length} entries)
                        </span>
                    </h3>
                </div>
                <NeoSearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                    placeholder="Search transcript..."
                />
            </div>

            {/* Transcript Entries */}
            <div
                ref={containerRef}
                className="max-h-96 overflow-y-auto p-4 space-y-3"
            >
                {filteredTranscript.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 font-medium">
                        {transcript.length === 0
                            ? 'No transcript available.'
                            : 'No matches found for your search.'
                        }
                    </div>
                ) : (
                    filteredTranscript.map((entry, index) => (
                        <div
                            key={entry.id || index}
                            ref={entry.id === highlightedId ? highlightedRef : null}
                            className={`
                                flex gap-3 p-3 rounded transition-all duration-300
                                ${entry.id === highlightedId
                                    ? 'bg-neo-yellow border-2 border-black shadow-neo-sm'
                                    : 'hover:bg-gray-50'
                                }
                            `}
                        >
                            {/* Timestamp */}
                            <button
                                onClick={() => onTimestampClick(entry)}
                                className="
                                    flex-shrink-0 flex items-center gap-1 
                                    text-xs font-mono font-bold text-gray-500
                                    hover:text-black hover:underline
                                "
                            >
                                <Clock size={12} />
                                {entry.timestamp}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={`
                                            text-sm font-black px-2 py-0.5 
                                            border-2 border-black rounded
                                            ${getSpeakerColor(entry.speaker)}
                                        `}
                                    >
                                        {entry.speaker}
                                    </span>
                                    {getSentimentIndicator(entry.sentiment)}
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {highlightSearchTerm(entry.text, searchQuery)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TranscriptViewer;
