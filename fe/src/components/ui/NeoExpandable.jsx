
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * NeoExpandable - Expandable card component with smooth animations
 * Used for action items and other expandable content
 */
const NeoExpandable = ({
    header,
    children,
    defaultExpanded = false,
    className = '',
    headerClassName = '',
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div
            className={`
                bg-white border-4 border-black shadow-neo
                transition-all duration-200
                ${className}
            `}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full flex items-center justify-between p-4
                    text-left font-bold hover:bg-neo-white
                    transition-colors duration-150
                    ${headerClassName}
                `}
            >
                <div className="flex-1">{header}</div>
                <div className="ml-4 p-1 border-2 border-black bg-neo-yellow">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="p-4 pt-0 border-t-2 border-black bg-neo-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NeoExpandable;
