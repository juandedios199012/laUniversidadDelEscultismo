import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ScoutCard } from '@/components/scouts/ScoutCard';
import { getAllScouts, mockPatrols } from '@/data/mockData';
import { STAGES } from '@/types/scout';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';

const ScoutsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatrol, setSelectedPatrol] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const allScouts = getAllScouts();

  const filteredScouts = allScouts.filter(scout => {
    const matchesSearch = scout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatrol = selectedPatrol === 'all' || scout.patrolId === selectedPatrol;
    const matchesStage = selectedStage === 'all' || scout.currentStage === selectedStage;
    return matchesSearch && matchesPatrol && matchesStage;
  });

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
                Scouts
              </span>
            </h1>
            <p className="text-muted-foreground">
              Gestiona y visualiza el progreso de todos los scouts de la unidad
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard hoverable={false} className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar scout por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>

                {/* Patrol Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedPatrol}
                    onChange={(e) => setSelectedPatrol(e.target.value)}
                    className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Todas las patrullas</option>
                    {mockPatrols.map(patrol => (
                      <option key={patrol.id} value={patrol.id}>{patrol.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stage Filter */}
                <div>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Todas las etapas</option>
                    {STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.icon} {stage.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Results count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredScouts.length} de {allScouts.length} scouts
            </p>
          </motion.div>

          {/* Scouts Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScouts.map((scout, index) => (
              <ScoutCard key={scout.id} scout={scout} index={index} />
            ))}
          </div>

          {/* Empty state */}
          {filteredScouts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-display text-xl font-semibold mb-2">
                No se encontraron scouts
              </h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ScoutsPage;
