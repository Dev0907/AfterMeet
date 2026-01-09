
import React from 'react';

const NeoInput = ({ label, type = 'text', value, onChange, placeholder, name, required = false, autoComplete }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label className="font-bold text-black uppercase">{label}</label>}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoComplete={autoComplete}
                className="
          w-full bg-white text-black font-medium py-3 px-4
          border-4 border-black shadow-neo-sm outline-none
          focus:bg-neo-white focus:shadow-neo transition-all
          placeholder:text-gray-500
        "
            />
        </div>
    );
};

export default NeoInput;

