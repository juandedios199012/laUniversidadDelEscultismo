import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowColor?: string;
}

export const GlassCard = ({
  children,
  className,
  hoverable = true,
  glowColor,
  ...props
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        'glass-card p-6',
        hoverable && 'interactive-card cursor-pointer',
        className
      )}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      style={glowColor ? { boxShadow: `0 0 30px ${glowColor}40` } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};
