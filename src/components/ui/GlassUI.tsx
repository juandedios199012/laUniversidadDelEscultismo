/**
 * Componentes UI con estilo Glassmorphism
 * Inspirado en diseño futurista con efectos de vidrio y animaciones
 */

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// ============================================================================
// TIPOS
// ============================================================================

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  hoverable?: boolean;
  glowColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

// ============================================================================
// GLASSMORPHISM CARD
// ============================================================================

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hoverable = false,
  glowColor = 'primary',
  padding = 'md',
  className = '',
  ...props
}) => {
  const glowColors: Record<string, string> = {
    primary: 'hover:shadow-cyan-500/20',
    success: 'hover:shadow-emerald-500/20',
    warning: 'hover:shadow-amber-500/20',
    danger: 'hover:shadow-red-500/20',
    info: 'hover:shadow-blue-500/20',
  };

  const paddingClasses: Record<string, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-xl
        border border-slate-200/50 dark:border-slate-700/50
        shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
        ${hoverable ? `cursor-pointer transition-all duration-300 hover:shadow-xl ${glowColors[glowColor]}` : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      whileHover={hoverable ? { scale: 1.01, y: -2 } : undefined}
      whileTap={hoverable ? { scale: 0.99 } : undefined}
      {...props}
    >
      {/* Gradiente sutil de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-slate-100/30 dark:from-slate-800/50 dark:to-slate-900/30 pointer-events-none" />
      
      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// ============================================================================
// METRIC CARD
// ============================================================================

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  subtitle,
}) => {
  const colorSchemes: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
    yellow: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', icon: 'text-cyan-500' },
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${scheme.text}`}>{value}</p>
          
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-400 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-xl ${scheme.bg}`}>
            <span className={scheme.icon}>{icon}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// PROGRESS RING
// ============================================================================

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#06b6d4',
  bgColor = '#e2e8f0',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        {/* Progreso */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      
      {/* Contenido central */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// BADGE
// ============================================================================

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    outline: 'bg-transparent border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-500">{icon}</span>}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
          {badge !== undefined && (
            <Badge variant="info" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-slate-400"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-5 bg-white dark:bg-slate-900">{children}</div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// INPUT FIELD CON ESTILO
// ============================================================================

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helper,
  icon,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-white dark:bg-slate-800
            border transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
            }
            focus:outline-none focus:ring-4
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400
          `}
        />
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1.5 text-sm text-slate-400">{helper}</p>
      )}
    </div>
  );
};

// ============================================================================
// SELECT FIELD CON ESTILO
// ============================================================================

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  helper?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  error,
  helper,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        {...props}
        className={`
          w-full px-4 py-2.5 rounded-lg appearance-none
          bg-white dark:bg-slate-800
          border transition-all duration-200
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
          }
          focus:outline-none focus:ring-4
          text-slate-900 dark:text-slate-100
          cursor-pointer
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {helper && !error && <p className="mt-1.5 text-sm text-slate-400">{helper}</p>}
    </div>
  );
};

// ============================================================================
// CHECKBOX CON ESTILO
// ============================================================================

interface CheckboxFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  description,
  checked,
  onChange,
  required,
  disabled,
}) => {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200
            ${checked 
              ? 'bg-cyan-500 border-cyan-500' 
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
            }
            peer-focus:ring-4 peer-focus:ring-cyan-500/20
          `}
        >
          {checked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-white"
            >
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
};

// ============================================================================
// TEXTAREA CON ESTILO
// ============================================================================

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  error,
  helper,
  required,
  className = '',
  rows = 3,
  ...props
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        {...props}
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-lg resize-none
          bg-white dark:bg-slate-800
          border transition-all duration-200
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
          }
          focus:outline-none focus:ring-4
          text-slate-900 dark:text-slate-100
          placeholder:text-slate-400
        `}
      />
      
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      {helper && !error && <p className="mt-1.5 text-sm text-slate-400">{helper}</p>}
    </div>
  );
};

// ============================================================================
// BUTTON CON ESTILOS
// ============================================================================

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  type = 'button',
  onClick,
}) => {
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25',
    secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600',
    outline: 'bg-transparent border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-cyan-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </motion.button>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <span className="text-slate-400 text-4xl">{icon}</span>
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {description}
      </p>
      
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
};

// ============================================================================
// TOAST / NOTIFICATION
// ============================================================================

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const types: Record<string, { bg: string; border: string; icon: string }> = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-500', icon: '✓' },
    error: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-500', icon: '✕' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-500', icon: '!' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-500', icon: 'i' },
  };

  const t = types[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`${t.bg} border-l-4 ${t.border} p-4 rounded-r-lg shadow-lg flex items-start gap-3`}
    >
      <span className="font-bold">{t.icon}</span>
      <span className="flex-1 text-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}
    />
  );
};

// ============================================================================
// AVATAR
// ============================================================================

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-slate-800`}
    >
      {initials}
    </div>
  );
};
