/**
 * ProgresionV2Module – Punto de entrada del módulo de Progresión v2
 * Contiene 3 sub-módulos: Progresión | Especialidades | Objetivos Educativos
 *
 * Este componente es una PROPUESTA de UI — no modifica el módulo v1 actual.
 * Se accede vía la ruta 'progresion-v2' en App.tsx.
 */
import React, { useState } from 'react';
import { Map, Star, Target } from 'lucide-react';
import ProgresionPageV2 from './progresion/ProgresionPageV2';
import EspecialidadesPageV2 from './especialidades/EspecialidadesPageV2';
import ObjetivosPageV2 from './objetivos/ObjetivosPageV2';

type TabId = 'progresion' | 'especialidades' | 'objetivos';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  activeColor: string;
}

const TABS: Tab[] = [
  {
    id: 'progresion',
    label: 'Progresión',
    icon: <Map className="w-4 h-4" />,
    gradient: 'from-cyan-400 to-emerald-400',
    activeColor: '#00e5ff',
  },
  {
    id: 'especialidades',
    label: 'Especialidades',
    icon: <Star className="w-4 h-4" />,
    gradient: 'from-purple-400 to-pink-500',
    activeColor: '#d500f9',
  },
  {
    id: 'objetivos',
    label: 'Objetivos Educativos',
    icon: <Target className="w-4 h-4" />,
    gradient: 'from-violet-500 to-purple-600',
    activeColor: '#651fff',
  },
];

const ProgresionV2Module: React.FC = () => {
  const [tab, setTab] = useState<TabId>('progresion');

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-[#060d1a]">
      {/* ── Barra de navegación superior ──────────────────────────────── */}
      <nav
        className="sticky top-0 z-30 border-b border-white/10 bg-[#060d1a]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* Título del módulo */}
          <div className="flex items-center gap-3 pt-4 pb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${activeTab.activeColor}20` }}
            >
              {activeTab.icon}
            </div>
            <span className="text-xs text-white/40 uppercase tracking-widest">
              Sistema de Progresión • Versión 2
            </span>
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: `${activeTab.activeColor}20`,
                color: activeTab.activeColor,
                border: `1px solid ${activeTab.activeColor}40`,
              }}
            >
              BETA
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((t) => {
              const isActive = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'text-white border-current'
                      : 'text-white/40 border-transparent hover:text-white/70 hover:border-white/20'
                  }`}
                  style={isActive ? { borderColor: t.activeColor, color: t.activeColor } : {}}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Contenido ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {tab === 'progresion' && <ProgresionPageV2 />}
        {tab === 'especialidades' && <EspecialidadesPageV2 />}
        {tab === 'objetivos' && <ObjetivosPageV2 />}
      </div>
    </div>
  );
};

export default ProgresionV2Module;
