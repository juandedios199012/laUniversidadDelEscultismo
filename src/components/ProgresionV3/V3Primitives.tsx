import React from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';

export const pageShell = 'rounded-[32px] border border-[#eadfd5] bg-white shadow-[0_12px_36px_rgba(69,45,18,0.08)]';

export const Surface: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <section className={`${pageShell} ${className}`}>{children}</section>
);

export const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="text-[2.1rem] font-black tracking-tight text-slate-700">{title}</h2>
      {subtitle ? <p className="mt-2 text-base text-slate-500">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

export const PillButton: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ children, active, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
      active
        ? 'border-[#2f6a2d] bg-[#2f6a2d] text-white shadow-[0_10px_24px_rgba(47,106,45,0.22)]'
        : 'border-[#e6d9ca] bg-white text-slate-500 hover:bg-[#fff8f0] hover:text-slate-700'
    } ${className}`}
  >
    {children}
  </button>
);

export const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  delta?: string;
  deltaTone?: 'green' | 'red' | 'blue' | 'orange';
}> = ({ icon, label, value, detail, delta, deltaTone = 'green' }) => {
  const tone = {
    green: 'text-emerald-500',
    red: 'text-red-400',
    blue: 'text-sky-500',
    orange: 'text-orange-500',
  }[deltaTone];

  return (
    <Surface className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f7ff] text-slate-600">
          {icon}
        </div>
        {delta ? <span className={`text-lg font-semibold ${tone}`}>{delta}</span> : null}
      </div>
      <p className="mt-8 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-5xl font-black tracking-tight text-slate-700">{value}</p>
      <p className="mt-3 text-base text-slate-500">{detail}</p>
    </Surface>
  );
};

export const FilterField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ label, value, onChange, options }) => (
  <div>
    <label className="mb-3 block text-lg font-semibold text-slate-600">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-[20px] border border-[#e5d8ca] bg-white px-6 py-4 pr-12 text-2xl font-medium text-slate-800 shadow-[0_8px_22px_rgba(84,60,25,0.06)] outline-none transition focus:border-[#2f6a2d]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
    </div>
  </div>
);

export const SearchField: React.FC<{
  label?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
  <div>
    {label ? <label className="mb-3 block text-lg font-semibold text-slate-600">{label}</label> : null}
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[18px] border border-[#e5d8ca] bg-white px-5 py-3 text-lg font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2f6a2d]"
    />
  </div>
);

export const ResetButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-lg font-semibold text-slate-600 transition hover:text-slate-800"
  >
    <RotateCcw className="h-5 w-5" />
    Restablecer
  </button>
);

export const ProgressBar: React.FC<{
  value: number;
  colorClass?: string;
  trackClass?: string;
  className?: string;
}> = ({ value, colorClass = 'from-[#2f6a2d] to-[#4f94e0]', trackClass = 'bg-slate-200', className = '' }) => (
  <div className={`h-4 overflow-hidden rounded-full ${trackClass} ${className}`}>
    <div
      className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export const StagePill: React.FC<{
  label: string;
  color: string;
  active?: boolean;
}> = ({ label, color, active }) => (
  <span
    className="inline-flex items-center rounded-full border px-4 py-2 text-xl font-bold"
    style={{
      borderColor: active ? `${color}90` : '#e4d9ce',
      color,
      background: active ? `${color}14` : '#fffdfa',
    }}
  >
    {label}
  </span>
);