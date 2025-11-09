import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function Input({ className = '', error = false, ...props }: InputProps) {
  const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border-white/20";
  const errorClasses = error ? "border-red-400 focus:ring-red-400" : "hover:border-white/30";
  
  return (
    <input
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
}