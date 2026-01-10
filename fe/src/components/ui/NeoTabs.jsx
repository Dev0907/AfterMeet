
import React from 'react';

/**
 * NeoTabs - Tab navigation component with Neobrutalist styling
 */
const NeoTabs = ({ tabs, activeTab, onTabChange, className = '' }) => {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        px-4 py-2 font-bold uppercase tracking-wide
                        border-4 border-black transition-all duration-150
                        ${activeTab === tab.id
                            ? 'bg-black text-white shadow-none translate-x-1 translate-y-1'
                            : 'bg-neo-yellow shadow-neo hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-hover'
                        }
                    `}
                >
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default NeoTabs;
