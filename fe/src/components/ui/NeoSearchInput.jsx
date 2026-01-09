
import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * NeoSearchInput - Styled search input with loading state and clear button
 */
const NeoSearchInput = ({
    value,
    onChange,
    onClear,
    placeholder = 'Search...',
    isLoading = false,
    className = ''
}) => {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Search size={20} />
                )}
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
                    w-full bg-white text-black font-medium py-3 pl-12 pr-12
                    border-4 border-black shadow-neo-sm outline-none
                    focus:bg-neo-white focus:shadow-neo transition-all
                    placeholder:text-gray-500
                "
            />
            {value && (
                <button
                    onClick={onClear}
                    className="
                        absolute right-3 top-1/2 -translate-y-1/2
                        p-1 bg-neo-red border-2 border-black
                        hover:bg-red-400 transition-colors
                    "
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default NeoSearchInput;
