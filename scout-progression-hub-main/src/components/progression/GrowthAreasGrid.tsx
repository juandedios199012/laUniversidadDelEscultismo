import { motion } from 'framer-motion';
import { GROWTH_AREAS } from '@/types/scout';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface GrowthAreasGridProps {
  onAreaClick?: (areaId: string) => void;
}

// Mock progress data - in a real app this would come from props or context
const mockAreaProgress = {
  corporalidad: { completed: 4, total: 6, percentage: 67 },
  creatividad: { completed: 2, total: 5, percentage: 40 },
  caracter: { completed: 1, total: 4, percentage: 25 },
  afectividad: { completed: 3, total: 4, percentage: 75 },
  sociabilidad: { completed: 2, total: 3, percentage: 67 },
  espiritualidad: { completed: 1, total: 3, percentage: 33 },
};

export const GrowthAreasGrid = ({ onAreaClick }: GrowthAreasGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {GROWTH_AREAS.map((area, index) => {
        const progress = mockAreaProgress[area.id as keyof typeof mockAreaProgress];
        
        return (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              className={`area-${area.id} cursor-pointer`}
              onClick={() => onAreaClick?.(area.id)}
              glowColor={area.color}
            >
              <div className="flex items-start gap-4">
                <ProgressRing
                  percentage={progress.percentage}
                  size={70}
                  strokeWidth={5}
                  color={area.color}
                >
                  <span className="text-2xl">{area.icon}</span>
                </ProgressRing>

                <div className="flex-1">
                  <h3 
                    className="font-display font-semibold text-base mb-1"
                    style={{ color: area.color }}
                  >
                    {area.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {area.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 progress-bar h-1.5">
                      <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        style={{ background: area.color }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};
