import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, Award } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { mockPatrols, calculateProgress, getAllScouts } from '@/data/mockData';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  delay?: number;
}

const StatCard = ({ icon, label, value, subtext, color, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <GlassCard className="relative overflow-hidden" hoverable={false}>
      {/* Decorative background */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }}
      />
      
      <div className="flex items-center gap-4 relative z-10">
        <div 
          className="p-3 rounded-xl"
          style={{ 
            background: `${color}20`,
            border: `1px solid ${color}40`
          }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

export const StatsOverview = () => {
  const allScouts = getAllScouts();
  const totalObjectives = allScouts.reduce((acc, scout) => acc + scout.objectives.length, 0);
  const completedObjectives = allScouts.reduce((acc, scout) => {
    const progress = calculateProgress(scout.objectives);
    return acc + progress.completed;
  }, 0);

  const avgProgress = Math.round(
    allScouts.reduce((acc, scout) => {
      return acc + calculateProgress(scout.objectives).percentage;
    }, 0) / allScouts.length
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Users className="w-6 h-6" />}
        label="Total Scouts"
        value={allScouts.length}
        subtext={`${mockPatrols.length} patrullas`}
        color="hsl(180, 100%, 50%)"
        delay={0}
      />
      <StatCard
        icon={<Target className="w-6 h-6" />}
        label="Objetivos Cumplidos"
        value={completedObjectives}
        subtext={`de ${totalObjectives} totales`}
        color="hsl(160, 84%, 45%)"
        delay={0.1}
      />
      <StatCard
        icon={<TrendingUp className="w-6 h-6" />}
        label="Progreso Promedio"
        value={`${avgProgress}%`}
        subtext="de toda la unidad"
        color="hsl(45, 100%, 55%)"
        delay={0.2}
      />
      <StatCard
        icon={<Award className="w-6 h-6" />}
        label="Próximos a Avanzar"
        value={3}
        subtext="scouts listos"
        color="hsl(340, 82%, 55%)"
        delay={0.3}
      />
    </div>
  );
};
