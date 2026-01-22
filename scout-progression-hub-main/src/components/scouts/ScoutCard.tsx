import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Scout, STAGES, GROWTH_AREAS } from '@/types/scout';
import { calculateProgress } from '@/data/mockData';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StageBadge } from '@/components/ui/StageBadge';

interface ScoutCardProps {
  scout: Scout;
  index?: number;
}

export const ScoutCard = ({ scout, index = 0 }: ScoutCardProps) => {
  const overallProgress = calculateProgress(scout.objectives);
  const stageInfo = STAGES.find(s => s.id === scout.currentStage);

  return (
    <Link to={`/scout/${scout.id}`}>
      <GlassCard
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        glowColor={stageInfo?.color}
      >
        {/* Decorative glow */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
          style={{ background: stageInfo?.color }}
        />

        <div className="flex items-start gap-4 relative z-10">
          {/* Progress Ring */}
          <ProgressRing
            percentage={overallProgress.percentage}
            size={80}
            strokeWidth={6}
            color={stageInfo?.color}
          >
            <span className="text-lg font-display font-bold text-foreground">
              {overallProgress.percentage}%
            </span>
          </ProgressRing>

          {/* Scout Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-semibold text-lg text-foreground truncate">
                {scout.name}
              </h3>
            </div>
            <StageBadge stage={scout.currentStage} size="sm" />
            
            {/* Area progress bars */}
            <div className="mt-3 space-y-1.5">
              {GROWTH_AREAS.slice(0, 3).map((area) => {
                const areaProgress = calculateProgress(scout.objectives, area.id);
                return (
                  <div key={area.id} className="flex items-center gap-2">
                    <span className="text-xs w-4">{area.icon}</span>
                    <div className="flex-1 progress-bar h-1.5">
                      <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${areaProgress.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                        style={{ background: area.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {areaProgress.completed}/{areaProgress.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 relative z-10">
          <span className="text-xs text-muted-foreground">
            {overallProgress.completed} de {overallProgress.total} objetivos
          </span>
          <motion.span 
            className="text-xs font-medium text-primary"
            whileHover={{ scale: 1.05 }}
          >
            Ver detalles →
          </motion.span>
        </div>
      </GlassCard>
    </Link>
  );
};
