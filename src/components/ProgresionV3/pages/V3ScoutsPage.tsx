import React, { useState } from 'react';
import { Award, CalendarDays, CheckCircle2, Medal, Sparkles, Target, Trophy } from 'lucide-react';
import { ETAPAS_CONFIG } from '../../ProgresionV2/config/etapasConfig';
import { PillButton, ProgressBar, SearchField, StagePill, Surface } from '../V3Primitives';
import type { V3ScoutSummary } from '../types';

interface V3ScoutsPageProps {
  scouts: V3ScoutSummary[];
}

const formatScoutCardName = (fullName: string) => {
  const parts = fullName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 2) {
    return fullName;
  }

  return parts.slice(0, 2).join(' ');
};

const formatPatrolLabel = (patrol: string) => {
  if (!patrol) return 'Tropa Scout';
  return patrol.length > 18 ? `${patrol.slice(0, 18)}...` : patrol;
};

const ScoutGridCard: React.FC<{
  scout: V3ScoutSummary;
  selected: boolean;
  onClick: () => void;
}> = ({ scout, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white p-5 text-left transition-all duration-200 hover:shadow-lg ${
      selected
        ? 'border-[#b8d4b6] shadow-md ring-1 ring-[#b8d4b6]'
        : 'border-[#e8e0d6] shadow-sm hover:-translate-y-0.5'
    }`}
  >
    {/* Avatar — izquierda */}
    <div className="relative shrink-0">
      <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-[#eef4e8] text-3xl font-black text-slate-400 ring-2 ring-[#e4dcd2]">
        {scout.photoUrl ? (
          <img src={scout.photoUrl} alt={scout.fullName} className="h-full w-full object-cover" />
        ) : (
          scout.firstName[0]
        )}
      </div>
      {/* Stage dot */}
      <span
        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white"
        style={{ background: scout.stageAccent }}
      />
    </div>

    {/* Contenido — derecha */}
    <div className="min-w-0 flex-1">
      {/* Stage pill */}
      <span
        className="mb-1 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-white"
        style={{ background: scout.stageAccent }}
      >
        {scout.stageName}
      </span>

      {/* Name */}
      <h3 className="truncate text-sm font-bold leading-tight text-slate-800">
        {scout.fullName}
      </h3>
      <p className="mt-0.5 truncate text-xs text-slate-500">
        {scout.age} años • {formatPatrolLabel(scout.patrol)}
      </p>

      {/* Progress */}
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[0.68rem] font-semibold text-slate-500">
          <span>Progreso General</span>
          <span>{scout.progress}%</span>
        </div>
        <ProgressBar value={scout.progress} className="h-1.5" />
      </div>

      {/* Stats */}
      <div className="mt-2 flex items-center gap-3 text-[0.68rem] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Award className="h-3 w-3 text-[#4f8ddb]" />
          {scout.achievements} logros
        </span>
        <span className="inline-flex items-center gap-1">
          <Target className="h-3 w-3 text-[#27c664]" />
          {scout.objectivesCompleted} objetivos
        </span>
      </div>
    </div>
  </button>
);

const V3ScoutsPage: React.FC<V3ScoutsPageProps> = ({ scouts }) => {
  const [search, setSearch] = useState('');
  const [selectedScoutId, setSelectedScoutId] = useState<string>(scouts[0]?.id ?? '');

  const filteredScouts = scouts.filter((scout) => !search || scout.fullName.toLowerCase().includes(search.toLowerCase()));
  const selectedScout = filteredScouts.find((scout) => scout.id === selectedScoutId) ?? filteredScouts[0] ?? scouts[0];
  const selectedStage = selectedScout ? ETAPAS_CONFIG[selectedScout.stageCode] ?? ETAPAS_CONFIG.PISTA : ETAPAS_CONFIG.PISTA;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black tracking-tight text-slate-700">Scouts</h1>
          <p className="mt-3 text-2xl text-slate-500">Vista tipo ficha con tarjetas, etapa actual y resumen de logros</p>
        </div>
        <div className="w-full max-w-md">
          <SearchField value={search} onChange={setSearch} placeholder="Buscar scout..." />
        </div>
      </div>

      <Surface className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-4xl font-black tracking-tight text-slate-700">Scouts de la Tropa</h2>
          <span className="text-xl font-semibold text-slate-500">{filteredScouts.length} de {scouts.length} Scouts</span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredScouts.map((scout) => (
            <ScoutGridCard
              key={scout.id}
              scout={scout}
              selected={scout.id === selectedScout?.id}
              onClick={() => setSelectedScoutId(scout.id)}
            />
          ))}
        </div>
      </Surface>

      {selectedScout ? (
        <div className="space-y-6">
            <Surface className="p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-4xl font-black tracking-tight text-slate-700">Etapa Actual</h2>
                <StagePill label={selectedStage.nombre} color={selectedScout.stageAccent} active />
              </div>
              <div className="mt-6 rounded-[28px] border-4 p-8" style={{ borderColor: `${selectedScout.stageAccent}66`, background: `${selectedScout.stageAccent}12` }}>
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 text-4xl" style={{ borderColor: selectedScout.stageAccent, color: selectedScout.stageAccent }}>
                    {selectedStage.icon}
                  </div>
                  <div>
                    <div className="text-6xl font-black tracking-tight" style={{ color: selectedScout.stageAccent }}>{selectedStage.nombre}</div>
                    <div className="mt-2 text-3xl text-slate-500">{selectedScout.age} años</div>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-3 text-2xl text-slate-500"><CalendarDays className="h-7 w-7" />Edad actual: {selectedScout.age} años</div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Object.values(ETAPAS_CONFIG).map((stage) => (
                  <div
                    key={stage.codigo}
                    className="rounded-[28px] border-4 p-5"
                    style={{
                      borderColor: selectedScout.stageCode === stage.codigo ? `${selectedScout.stageAccent}80` : '#e7ddd3',
                      background: selectedScout.stageCode === stage.codigo ? `${selectedScout.stageAccent}10` : '#fffdfa',
                    }}
                  >
                    <div className="text-4xl">{stage.icon}</div>
                    <div className="mt-5 text-3xl font-black tracking-tight" style={{ color: selectedScout.stageCode === stage.codigo ? selectedScout.stageAccent : '#64748b' }}>{stage.nombre}</div>
                    <div className="mt-2 text-2xl text-slate-500">{stage.edadMin} años</div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-4xl font-black tracking-tight text-slate-700">Resumen de Logros</h2>
                <PillButton><Sparkles className="h-4 w-4" />IA Activa</PillButton>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  { icon: <Target className="h-8 w-8" />, label: 'Objetivos', value: `${selectedScout.objectivesCompleted}/${selectedScout.objectivesTotal}`, percent: selectedScout.objectivesTotal ? Math.round((selectedScout.objectivesCompleted / selectedScout.objectivesTotal) * 100) : 0, tone: 'from-[#bed8ff] to-[#d7e7ff]' },
                  { icon: <Award className="h-8 w-8" />, label: 'Técnicas', value: `${selectedScout.activeSpecialties}/${Math.max(8, selectedScout.activeSpecialties + 10)}`, percent: Math.round((selectedScout.activeSpecialties / Math.max(8, selectedScout.activeSpecialties + 10)) * 100), tone: 'from-[#cffad6] to-[#ddf7e6]' },
                  { icon: <Trophy className="h-8 w-8" />, label: 'Metas Alcanzadas', value: `${selectedScout.badgeCount}/${Math.max(12, selectedScout.badgeCount + 8)}`, percent: Math.round((selectedScout.badgeCount / Math.max(12, selectedScout.badgeCount + 8)) * 100), tone: 'from-[#ffe8bf] to-[#fff0d7]' },
                  { icon: <Medal className="h-8 w-8" />, label: 'Áreas de Desarrollo', value: `${selectedScout.areas.filter((item) => item.porcentaje >= 60).length}/${Math.max(6, selectedScout.areas.length)}`, percent: selectedScout.areas.length ? Math.round(selectedScout.areas.reduce((sum, item) => sum + item.porcentaje, 0) / selectedScout.areas.length) : 0, tone: 'from-[#ecd9ff] to-[#f4e8ff]' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[28px] border border-[#eadfd5] p-6">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${item.tone} text-slate-600`}>
                      {item.icon}
                    </div>
                    <div className="mt-5 text-2xl font-semibold text-slate-500">{item.label}</div>
                    <div className="mt-1 text-5xl font-black tracking-tight text-slate-700">{item.value}</div>
                    <ProgressBar value={item.percent} className="mt-5 h-3" />
                    <div className="mt-4 text-center text-xl text-slate-500">{item.percent}% completado</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[28px] border border-[#eadfd5] p-6 text-[#2fb565]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-7 w-7" />
                  <div>
                    <div className="text-3xl font-black tracking-tight">Progreso Excelente</div>
                    <div className="mt-3 text-2xl leading-10 text-slate-500">Este scout está avanzando consistentemente en todas las áreas de desarrollo.</div>
                  </div>
                </div>
              </div>
            </Surface>
        </div>
      ) : null}
    </div>
  );
};

export default V3ScoutsPage;