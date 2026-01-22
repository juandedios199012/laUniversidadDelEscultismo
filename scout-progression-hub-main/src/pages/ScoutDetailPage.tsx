import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Award, CheckCircle2, Circle, FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StageBadge } from '@/components/ui/StageBadge';
import { getScoutById, getPatrolById, calculateProgress } from '@/data/mockData';
import { GROWTH_AREAS, STAGES } from '@/types/scout';
import { Button } from '@/components/ui/button';
import { generateScoutProgressPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

const ScoutDetailPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { id } = useParams<{ id: string }>();
  const scout = getScoutById(id || '');
  const patrol = scout ? getPatrolById(scout.patrolId) : undefined;

  const handleGeneratePDF = async () => {
    if (!scout || !patrol) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      generateScoutProgressPDF(scout, patrol.name);
      toast.success('PDF generado exitosamente', {
        description: `Reporte de ${scout.name} descargado`,
      });
    } catch (error) {
      toast.error('Error al generar PDF', {
        description: 'Por favor intenta nuevamente',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!scout) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-display font-bold">Scout no encontrado</h1>
          <Link to="/scouts" className="text-primary hover:underline mt-4 inline-block">
            ← Volver a scouts
          </Link>
        </div>
      </Layout>
    );
  }

  const overallProgress = calculateProgress(scout.objectives);
  const stageInfo = STAGES.find(s => s.id === scout.currentStage);

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex justify-between items-center"
          >
            <Link to="/scouts">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Volver a scouts
              </Button>
            </Link>
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Descargar PDF
            </Button>
          </motion.div>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard hoverable={false} className="relative overflow-hidden">
              {/* Decorative background */}
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
                style={{ background: stageInfo?.color }}
              />

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                {/* Avatar/Progress Ring */}
                <ProgressRing
                  percentage={overallProgress.percentage}
                  size={120}
                  strokeWidth={8}
                  color={stageInfo?.color}
                >
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-display font-bold"
                    style={{ background: `${stageInfo?.color}20` }}
                  >
                    {scout.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </ProgressRing>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl font-bold">{scout.name}</h1>
                    <StageBadge stage={scout.currentStage} />
                  </div>
                  
                  {patrol && (
                    <p className="text-muted-foreground mb-4">{patrol.name}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Ingresó: {scout.joinDate.toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="w-4 h-4" />
                      <span>{overallProgress.completed} objetivos completados</span>
                    </div>
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="text-center md:text-right">
                  <div 
                    className="text-5xl font-display font-bold"
                    style={{ color: stageInfo?.color }}
                  >
                    {overallProgress.percentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progreso total</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Areas Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="font-display text-xl font-bold mb-4">Progreso por Área</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GROWTH_AREAS.map((area, index) => {
                const areaProgress = calculateProgress(scout.objectives, area.id);
                return (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <GlassCard 
                      className={`area-${area.id}`}
                      hoverable={false}
                    >
                      <div className="flex items-center gap-4">
                        <ProgressRing
                          percentage={areaProgress.percentage}
                          size={60}
                          strokeWidth={5}
                          color={area.color}
                        >
                          <span className="text-xl">{area.icon}</span>
                        </ProgressRing>
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: area.color }}>
                            {area.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {areaProgress.completed} de {areaProgress.total} objetivos
                          </p>
                          <div className="progress-bar h-1.5 mt-2">
                            <motion.div
                              className="progress-bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${areaProgress.percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              style={{ background: area.color }}
                            />
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Objectives by Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-xl font-bold mb-4">Objetivos</h2>
            <div className="space-y-6">
              {GROWTH_AREAS.map((area) => {
                const areaObjectives = scout.objectives.filter(obj => obj.area === area.id);
                if (areaObjectives.length === 0) return null;

                return (
                  <GlassCard key={area.id} hoverable={false} className={`area-${area.id}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{area.icon}</span>
                      <h3 className="font-display font-semibold text-lg" style={{ color: area.color }}>
                        {area.name}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {areaObjectives.map((objective, index) => (
                        <motion.div
                          key={objective.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            objective.completed ? 'bg-accent/10' : 'bg-secondary/30'
                          }`}
                        >
                          {objective.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${objective.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {objective.title}
                            </p>
                            {objective.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completado: {objective.completedAt.toLocaleDateString('es-ES')}
                              </p>
                            )}
                          </div>
                          <StageBadge stage={objective.stage} size="sm" showLabel={false} />
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ScoutDetailPage;
