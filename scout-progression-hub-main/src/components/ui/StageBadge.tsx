import { motion } from 'framer-motion';
import { Stage, STAGES } from '@/types/scout';
import { cn } from '@/lib/utils';

interface StageBadgeProps {
  stage: Stage;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StageBadge = ({
  stage,
  size = 'md',
  showLabel = true,
  className,
}: StageBadgeProps) => {
  const stageInfo = STAGES.find(s => s.id === stage);
  
  if (!stageInfo) return null;

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-display font-semibold',
        `stage-${stage}`,
        sizeClasses[size],
        className
      )}
      style={{
        boxShadow: `0 0 16px ${stageInfo.color}50`,
      }}
    >
      <span>{stageInfo.icon}</span>
      {showLabel && <span>{stageInfo.name}</span>}
    </motion.span>
  );
};
