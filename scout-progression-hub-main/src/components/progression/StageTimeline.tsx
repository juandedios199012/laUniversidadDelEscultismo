import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { STAGES } from '@/types/scout';

export const StageTimeline = () => {
  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-stage-travesia opacity-30" />
      
      <div className="space-y-6">
        {STAGES.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
          >
            <GlassCard className="relative pl-20" hoverable={true}>
              {/* Stage indicator */}
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ 
                  background: stage.color,
                  boxShadow: `0 0 20px ${stage.color}60`
                }}
                whileHover={{ scale: 1.1 }}
              >
                {stage.icon}
              </motion.div>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-xl font-bold" style={{ color: stage.color }}>
                      {stage.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {stage.age} años
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right ml-4">
                  <div className="text-2xl font-display font-bold" style={{ color: stage.color }}>
                    {6 - index}
                  </div>
                  <div className="text-xs text-muted-foreground">scouts</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
