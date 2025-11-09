import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: boolean;
  placeholder?: string;
}

export default function Select({ className = '', error = false, options, placeholder, ...props }: SelectProps) {
  const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/10 backdrop-blur-sm text-white border-white/20";
  const errorClasses = error ? "border-red-400 focus:ring-red-400" : "hover:border-white/30";
  
  return (
    <select
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      {placeholder && <option value="" className="bg-gray-800 text-white">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-gray-800 text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
}