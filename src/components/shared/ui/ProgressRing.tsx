/**
 * ProgressRing V2 – Anillo de progreso animado con SVG
 * Inspirado en scout-progression-hub-main
 */
import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 100,
  strokeWidth = 7,
  color = '#00ffff',
  className = '',
  children,
  animated = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute top-0 left-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children ?? (
          <span className="text-sm font-bold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};
