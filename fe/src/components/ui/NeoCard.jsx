
import React from 'react';

const NeoCard = ({ children, className = '' }) => {
    return (
        <div className={`
      bg-white border-4 border-black shadow-neo p-8
      ${className}
    `}>
            {children}
        </div>
    );
};

export default NeoCard;
