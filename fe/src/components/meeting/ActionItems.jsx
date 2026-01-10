
import React, { useState, useMemo } from 'react';
import NeoExpandable from '../ui/NeoExpandable';
import NeoBadge from '../ui/NeoBadge';
import { NeoSkeletonActionItem } from '../ui/NeoSkeleton';
import { User, Calendar, AlertCircle } from 'lucide-react';

/**
 * ActionItems - Primary section displaying tasks sorted by urgency
 */
const ActionItems = ({ items = [], isLoading = false }) => {
    const [filter, setFilter] = useState('all');

    // Sort items by urgency: critical > high > medium > low
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    const sortedItems = useMemo(() => {
        let filtered = [...items];

        if (filter !== 'all') {
            filtered = filtered.filter(item => item.urgency === filter);
        }

        return filtered.sort((a, b) =>
            (urgencyOrder[a.urgency] || 4) - (urgencyOrder[b.urgency] || 4)
        );
    }, [items, filter]);

    const formatDeadline = (deadline) => {
        if (!deadline) return 'Not specified';
        const date = new Date(deadline);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays <= 7) return `Due in ${diffDays} days`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDeadlineStyle = (deadline) => {
        if (!deadline) return '';
        const date = new Date(deadline);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'text-red-600 font-bold';
        if (diffDays <= 2) return 'text-orange-600 font-bold';
        return '';
    };

    const filterButtons = [
        { id: 'all', label: 'All' },
        { id: 'critical', label: '🔴 Critical' },
        { id: 'high', label: '🟠 High' },
        { id: 'medium', label: '🟡 Medium' },
        { id: 'low', label: '🟢 Low' },
    ];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-black uppercase tracking-tight">Action Items</h2>
                <NeoSkeletonActionItem />
                <NeoSkeletonActionItem />
                <NeoSkeletonActionItem />
            </div>
        );
    }

    return (
        <div>
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <AlertCircle className="text-neo-red" size={28} />
                    Action Items
                    <span className="text-lg font-bold text-gray-500">({items.length})</span>
                </h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {filterButtons.map(btn => (
                    <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id)}
                        className={`
                            px-3 py-1.5 text-sm font-bold border-2 border-black
                            transition-all duration-150
                            ${filter === btn.id
                                ? 'bg-black text-white'
                                : 'bg-white hover:bg-neo-yellow'
                            }
                        `}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Action Items List */}
            <div className="space-y-3">
                {sortedItems.length === 0 ? (
                    <div className="bg-neo-white border-4 border-black p-8 text-center">
                        <p className="font-bold text-gray-500">
                            {items.length === 0
                                ? 'No action items found in this meeting.'
                                : 'No items match the selected filter.'
                            }
                        </p>
                    </div>
                ) : (
                    sortedItems.map(item => (
                        <NeoExpandable
                            key={item.id}
                            header={
                                <div className="flex flex-wrap items-center gap-3">
                                    <NeoBadge variant={item.urgency} size="sm">
                                        {item.urgency}
                                    </NeoBadge>
                                    <span className="text-lg font-bold flex-1 min-w-0">
                                        {item.title}
                                    </span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <User size={14} />
                                            {item.owner}
                                        </span>
                                        <span className={`flex items-center gap-1 ${getDeadlineStyle(item.deadline)}`}>
                                            <Calendar size={14} />
                                            {formatDeadline(item.deadline)}
                                        </span>
                                    </div>
                                </div>
                            }
                        >
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-black uppercase text-gray-600 mb-1">
                                        Why is this urgent?
                                    </h4>
                                    <p className="font-medium">
                                        {item.urgencyReason || 'No additional context provided.'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-sm font-bold bg-neo-teal border-2 border-black hover:shadow-neo-sm transition-all">
                                        Mark Complete
                                    </button>
                                    <button className="px-3 py-1 text-sm font-bold bg-white border-2 border-black hover:bg-neo-yellow transition-all">
                                        Reassign
                                    </button>
                                </div>
                            </div>
                        </NeoExpandable>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActionItems;
