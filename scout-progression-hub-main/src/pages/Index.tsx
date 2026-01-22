import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ScoutCard } from '@/components/scouts/ScoutCard';
import { StageTimeline } from '@/components/progression/StageTimeline';
import { GrowthAreasGrid } from '@/components/progression/GrowthAreasGrid';
import { mockPatrols, getAllScouts } from '@/data/mockData';
import heroBg from '@/assets/hero-bg.jpg';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const allScouts = getAllScouts();
  const recentScouts = allScouts.slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Scout navigation" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-hero-pattern" />
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * -200],
                opacity: [0.3, 0.8, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium text-sm">Sistema de Progresión Scout</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent glow-text">
                Scout Tracker
              </span>
              <br />
              <span className="text-foreground/90">Rama Tropa</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed"
            >
              Gestiona el progreso de cada scout a través de las etapas 
              <span className="text-primary font-semibold"> Pista</span>,
              <span className="text-accent font-semibold"> Senda</span>,
              <span className="text-[hsl(45,100%,55%)] font-semibold"> Rumbo</span> y
              <span className="text-[hsl(340,82%,55%)] font-semibold"> Travesía</span>.
              Controla objetivos, técnicas y áreas de crecimiento.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-4"
            >
              <Link to="/scouts">
                <Button size="lg" className="gap-2 glow-primary font-display">
                  <Compass className="w-5 h-5" />
                  Explorar Scouts
                </Button>
              </Link>
              <Link to="/progresion">
                <Button size="lg" variant="outline" className="gap-2 font-display border-primary/30 hover:bg-primary/10">
                  Ver Etapas
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-20 relative z-20">
        <div className="container mx-auto px-4">
          <StatsOverview />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Scouts */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Scouts Recientes</h2>
                  <Link to="/scouts" className="text-primary text-sm font-medium hover:underline">
                    Ver todos →
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {recentScouts.map((scout, index) => (
                    <ScoutCard key={scout.id} scout={scout} index={index} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Stages Overview */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold">Etapas</h2>
                  <Link to="/progresion" className="text-primary text-sm font-medium hover:underline">
                    Ver detalles →
                  </Link>
                </div>

                <StageTimeline />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Areas Section */}
      <section className="py-12 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-2xl font-bold mb-2">Áreas de Crecimiento</h2>
            <p className="text-muted-foreground">
              Seis dimensiones del desarrollo integral del scout
            </p>
          </motion.div>

          <GrowthAreasGrid />
        </div>
      </section>

      {/* Patrols Preview */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-2xl font-bold mb-2">Patrullas</h2>
            <p className="text-muted-foreground">
              {mockPatrols.length} patrullas activas en la unidad
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPatrols.map((patrol, index) => (
              <motion.div
                key={patrol.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/patrol/${patrol.id}`}>
                  <div 
                    className="glass-card p-6 interactive-card border-l-4"
                    style={{ borderLeftColor: patrol.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-lg mb-1">{patrol.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {patrol.scouts.length} scouts
                        </p>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-display font-bold"
                        style={{ 
                          background: `${patrol.color}20`,
                          color: patrol.color,
                        }}
                      >
                        {patrol.scouts.length}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Scout Tracker - Sistema de Gestión de Progresión para Rama Tropa
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Basado en la metodología scout y las áreas de crecimiento
          </p>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
