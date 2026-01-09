
import React from 'react';

const NeoButton = ({ children, onClick, type = 'button', className = '' }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
        bg-neo-yellow text-black font-bold py-3 px-6 
        border-4 border-black shadow-neo transition-all
        hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-hover
        active:translate-x-1 active:translate-y-1 active:shadow-none
        uppercase tracking-wider ${className}
      `}
        >
            {children}
        </button>
    );
};

export default NeoButton;
