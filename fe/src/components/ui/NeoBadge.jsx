
import React from 'react';

/**
 * NeoBadge - Pill-shaped badge for urgency levels and sentiment
 * Variants: critical, high, medium, low (urgency) | positive, neutral, negative (sentiment)
 */
const NeoBadge = ({ variant = 'neutral', children, className = '', size = 'md' }) => {
    const variantStyles = {
        // Urgency variants
        critical: 'bg-red-400 text-black border-red-600',
        high: 'bg-orange-300 text-black border-orange-500',
        medium: 'bg-neo-yellow text-black border-yellow-500',
        low: 'bg-green-300 text-black border-green-500',
        // Sentiment variants
        positive: 'bg-green-300 text-black border-green-500',
        neutral: 'bg-neo-teal text-black border-blue-400',
        negative: 'bg-neo-red text-black border-red-400',
    };

    const sizeStyles = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    const icons = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
        positive: '🟢',
        neutral: '🟡',
        negative: '🔴',
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 font-bold uppercase tracking-wide
                border-2 border-black shadow-neo-sm rounded-full
                ${variantStyles[variant] || variantStyles.neutral}
                ${sizeStyles[size]}
                ${className}
            `}
        >
            <span className="text-xs">{icons[variant]}</span>
            {children}
        </span>
    );
};

export default NeoBadge;
