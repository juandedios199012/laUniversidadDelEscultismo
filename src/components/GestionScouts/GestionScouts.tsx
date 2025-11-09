import React, { useState } from 'react';
import ListaScouts from './ListaScouts';
import EditarScoutModal from './EditarScoutModal';
import VerScoutModal from './VerScoutModal';
import ScoutService from '../../services/scoutService';
import type { Scout } from '../../lib/supabase';

export const GestionScouts: React.FC = () => {
  const [scoutSeleccionado, setScoutSeleccionado] = useState<Scout | null>(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleVerScout = async (scout: Scout) => {
    try {
      setLoading(true);
      console.log('🔍 Cargando datos completos para ver scout:', scout.id);
      
      // Obtener datos completos del scout incluyendo familiares
      const scoutCompleto = await ScoutService.getScoutById(scout.id);
      
      if (scoutCompleto) {
        console.log('✅ Scout completo obtenido:', scoutCompleto);
        setScoutSeleccionado(scoutCompleto);
        setModalVer(true);
      } else {
        console.error('❌ No se pudo obtener los datos del scout');
        // Usar los datos básicos como fallback
        setScoutSeleccionado(scout);
        setModalVer(true);
      }
    } catch (error) {
      console.error('❌ Error al cargar scout:', error);
      // Usar los datos básicos como fallback
      setScoutSeleccionado(scout);
      setModalVer(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarScout = async (scout: Scout) => {
    try {
      setLoading(true);
      console.log('✏️ Cargando datos completos para editar scout:', scout.id);
      
      // Obtener datos completos del scout
      const scoutCompleto = await ScoutService.getScoutById(scout.id);
      
      if (scoutCompleto) {
        console.log('✅ Scout completo obtenido para edición:', scoutCompleto);
        setScoutSeleccionado(scoutCompleto);
        setModalEditar(true);
      } else {
        console.error('❌ No se pudo obtener los datos del scout');
        // Usar los datos básicos como fallback
        setScoutSeleccionado(scout);
        setModalEditar(true);
      }
    } catch (error) {
      console.error('❌ Error al cargar scout:', error);
      // Usar los datos básicos como fallback
      setScoutSeleccionado(scout);
      setModalEditar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleScoutGuardado = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh en ListaScouts
    setModalEditar(false);
    setScoutSeleccionado(null);
  };

  const handleCerrarModal = () => {
    setModalEditar(false);
    setModalVer(false);
    setScoutSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ListaScouts
          key={refreshKey}
          onVerScout={handleVerScout}
          onEditarScout={handleEditarScout}
        />

        <EditarScoutModal
          scout={scoutSeleccionado}
          isOpen={modalEditar}
          onClose={handleCerrarModal}
          onSaved={handleScoutGuardado}
        />

        <VerScoutModal
          scout={scoutSeleccionado}
          isOpen={modalVer}
          onClose={handleCerrarModal}
        />
      </div>
    </div>
  );
};

export default GestionScouts;