
import React from 'react';

/**
 * NeoSkeleton - Loading skeleton component for graceful loading states
 */
const NeoSkeleton = ({
    variant = 'text',
    width,
    height,
    className = '',
    count = 1
}) => {
    const variantStyles = {
        text: 'h-4 rounded',
        title: 'h-8 rounded',
        card: 'h-32 rounded',
        badge: 'h-6 w-20 rounded-full',
        avatar: 'h-10 w-10 rounded-full',
    };

    const baseStyles = `
        bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
        animate-pulse border-2 border-black
    `;

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${className}
            `}
            style={{
                width: width || (variant === 'text' ? '100%' : undefined),
                height: height,
            }}
        />
    ));

    return count === 1 ? elements[0] : <div className="space-y-2">{elements}</div>;
};

/**
 * NeoSkeletonCard - Pre-built skeleton for card layouts
 */
export const NeoSkeletonCard = ({ className = '' }) => (
    <div className={`bg-white border-4 border-black shadow-neo p-6 ${className}`}>
        <NeoSkeleton variant="title" width="60%" className="mb-4" />
        <NeoSkeleton variant="text" count={3} className="mb-2" />
        <div className="flex gap-2 mt-4">
            <NeoSkeleton variant="badge" />
            <NeoSkeleton variant="badge" />
        </div>
    </div>
);

/**
 * NeoSkeletonActionItem - Pre-built skeleton for action items
 */
export const NeoSkeletonActionItem = ({ className = '' }) => (
    <div className={`bg-white border-4 border-black shadow-neo p-4 ${className}`}>
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <NeoSkeleton variant="text" width="70%" className="mb-2" />
                <NeoSkeleton variant="text" width="40%" />
            </div>
            <NeoSkeleton variant="badge" />
        </div>
    </div>
);

export default NeoSkeleton;
