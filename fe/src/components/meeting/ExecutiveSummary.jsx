
import React from 'react';
import NeoCard from '../ui/NeoCard';
import NeoBadge from '../ui/NeoBadge';

/**
 * ExecutiveSummary - Top section showing meeting overview and sentiment
 */
const ExecutiveSummary = ({
    title,
    date,
    duration,
    summary,
    sentiment = 'neutral',
    isLoading = false
}) => {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <NeoCard className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 border-2 border-black"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6 border-2 border-black"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded border-2 border-black"></div>
                    <div className="h-4 bg-gray-200 rounded border-2 border-black"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 border-2 border-black"></div>
                </div>
            </NeoCard>
        );
    }

    return (
        <NeoCard className="relative overflow-hidden">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neo-teal opacity-30 rounded-full -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative">
                {/* Header with sentiment badge */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
                            {title || 'Meeting Summary'}
                        </h1>
                        <p className="text-sm font-medium text-gray-600">
                            {formatDate(date)} {duration && `• ${duration}`}
                        </p>
                    </div>
                    <NeoBadge variant={sentiment} size="lg">
                        {sentiment === 'positive' && 'Positive Outcome'}
                        {sentiment === 'neutral' && 'Neutral'}
                        {sentiment === 'negative' && 'Needs Attention'}
                    </NeoBadge>
                </div>

                {/* Executive Summary */}
                <div className="bg-neo-white border-4 border-black p-4 shadow-neo-sm">
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-2">
                        Executive Summary
                    </h2>
                    <p className="text-lg font-medium leading-relaxed">
                        {summary || 'No summary available.'}
                    </p>
                </div>
            </div>
        </NeoCard>
    );
};

export default ExecutiveSummary;
