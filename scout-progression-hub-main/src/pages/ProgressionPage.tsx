import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { StageTimeline } from '@/components/progression/StageTimeline';
import { GrowthAreasGrid } from '@/components/progression/GrowthAreasGrid';
import { STAGES, GROWTH_AREAS } from '@/types/scout';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing } from '@/components/ui/ProgressRing';

const ProgressionPage = () => {
  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Sistema de Progresión
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              El sistema de progresión scout guía el crecimiento personal a través de cuatro etapas 
              y seis áreas de desarrollo integral.
            </p>
          </motion.div>

          {/* Stages Section */}
          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Las Cuatro Etapas</h2>
              <p className="text-muted-foreground">
                Cada etapa representa un nivel de madurez y corresponde a una edad específica
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              <StageTimeline />

              {/* Stages Overview Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard hoverable={false} className="h-full">
                  <h3 className="font-display text-lg font-semibold mb-4">Distribución por Etapa</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {STAGES.map((stage, index) => (
                      <div 
                        key={stage.id}
                        className="flex flex-col items-center p-4 rounded-xl"
                        style={{ background: `${stage.color}10` }}
                      >
                        <ProgressRing
                          percentage={(4 - index) * 25}
                          size={80}
                          strokeWidth={6}
                          color={stage.color}
                        >
                          <span className="text-2xl">{stage.icon}</span>
                        </ProgressRing>
                        <span 
                          className="font-display font-semibold mt-2"
                          style={{ color: stage.color }}
                        >
                          {stage.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {6 - index} scouts
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <h4 className="text-sm font-semibold mb-3">¿Cómo avanzar de etapa?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Completar al menos el 50% de los objetivos de la etapa actual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Participar activamente en actividades de patrulla y unidad</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Evaluación conjunta con dirigentes y consejo de patrulla</span>
                      </li>
                    </ul>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </section>

          {/* Growth Areas Section */}
          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Áreas de Crecimiento</h2>
              <p className="text-muted-foreground">
                Seis dimensiones que conforman el desarrollo integral de cada scout
              </p>
            </motion.div>

            <GrowthAreasGrid />
          </section>

          {/* Areas Description */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Detalle de Áreas</h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GROWTH_AREAS.map((area, index) => (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard 
                    className={`area-${area.id} h-full`}
                    hoverable={false}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{area.icon}</span>
                      <h3 
                        className="font-display font-semibold text-lg"
                        style={{ color: area.color }}
                      >
                        {area.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {area.description}
                    </p>
                    <div className="text-xs text-muted-foreground/70">
                      {area.id === 'corporalidad' && 'Actividades físicas, salud, higiene, seguridad'}
                      {area.id === 'creatividad' && 'Técnicas, artes, innovación, resolución de problemas'}
                      {area.id === 'caracter' && 'Voluntad, responsabilidad, decisiones, compromiso'}
                      {area.id === 'afectividad' && 'Emociones, autoestima, relaciones, comunicación'}
                      {area.id === 'sociabilidad' && 'Trabajo en equipo, servicio, ciudadanía, liderazgo'}
                      {area.id === 'espiritualidad' && 'Valores, naturaleza, sentido de vida, trascendencia'}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ProgressionPage;
