import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GROWTH_AREAS, STAGES } from '@/types/scout';
import { BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BitacoraPage = () => {
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
                Bitácora Scout
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              La bitácora es el cuaderno personal de viaje que acompaña a cada scout 
              en su camino de crecimiento a través de las etapas Pista y Senda.
            </p>
          </motion.div>

          {/* Download Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard hoverable={false} className="flex flex-col sm:flex-row items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display font-semibold text-lg">Bitácora Pistas y Senda</h3>
                <p className="text-sm text-muted-foreground">
                  Documento oficial con objetivos y áreas de crecimiento
                </p>
              </div>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Descargar PDF
              </Button>
            </GlassCard>
          </motion.div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* About the Bitácora */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard hoverable={false} className="h-full">
                <h2 className="font-display text-xl font-bold mb-4">¿Qué es la Bitácora?</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    La Bitácora es un cuaderno personal de viaje pensado para acompañar a cada 
                    scout en su camino de crecimiento. Las actividades que se realizan en la 
                    patrulla y en la Unidad Scout, junto con todo lo que se hace en la escuela, 
                    en el hogar y con amigos, contribuyen al crecimiento personal.
                  </p>
                  <p>
                    Poco a poco, cada scout irá logrando los objetivos que reflejan ese crecimiento, 
                    con la ayuda de su patrulla y sus dirigentes.
                  </p>
                  <p>
                    Cada cierto tiempo, con el apoyo del Consejo de patrulla, los dirigentes y 
                    los amigos, se evalúa el crecimiento en relación con esos objetivos.
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Stages in Bitácora */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard hoverable={false} className="h-full">
                <h2 className="font-display text-xl font-bold mb-4">Etapas Incluidas</h2>
                <div className="space-y-4">
                  {STAGES.filter(s => s.id === 'pista' || s.id === 'senda').map(stage => (
                    <div 
                      key={stage.id}
                      className="p-4 rounded-xl"
                      style={{ background: `${stage.color}10`, borderLeft: `4px solid ${stage.color}` }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{stage.icon}</span>
                        <div>
                          <h3 className="font-display font-semibold" style={{ color: stage.color }}>
                            Etapa {stage.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">{stage.age} años</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Growth Areas Reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <h2 className="font-display text-2xl font-bold mb-6">Áreas de Crecimiento en la Bitácora</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GROWTH_AREAS.map((area, index) => (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard 
                    className={`area-${area.id}`}
                    hoverable={false}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: `${area.color}20` }}
                      >
                        {area.icon}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold" style={{ color: area.color }}>
                          {area.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">Área de desarrollo</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {area.description}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Objectives Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <GlassCard hoverable={false}>
              <h2 className="font-display text-xl font-bold mb-4">Ejemplos de Objetivos</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Corporalidad</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Participo en actividades para mantener mi cuerpo fuerte y sano</li>
                    <li>• Me doy cuenta de los cambios que se están produciendo en mi cuerpo</li>
                    <li>• Trato de evitar situaciones que puedan dañar mi salud</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-accent mb-2">Sociabilidad</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Participo activamente en mi patrulla</li>
                    <li>• Ayudo a ordenar y limpiar los espacios que uso</li>
                    <li>• Colaboro en proyectos de servicio comunitario</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(280,100%,65%)] mb-2">Creatividad</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Sé preparar comidas sencillas al aire libre</li>
                    <li>• Conozco y utilizo diferentes nudos y amarres</li>
                    <li>• Sé orientarme usando un mapa y brújula</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(340,85%,60%)] mb-2">Afectividad</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Expreso mis emociones de manera adecuada</li>
                    <li>• Respeto a mis compañeros y compañeras</li>
                    <li>• Puedo hablar de mis sentimientos con personas de confianza</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default BitacoraPage;
