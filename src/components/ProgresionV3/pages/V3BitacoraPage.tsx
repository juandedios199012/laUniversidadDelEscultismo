import React, { useState } from 'react';
import { BookOpen, Download, Lightbulb, Plus, Search, ShieldCheck } from 'lucide-react';
import { FilterField, PillButton, SearchField, Surface } from '../V3Primitives';
import type { V3BitacoraEntry, V3InsightCard, V3ScoutSummary } from '../types';

interface V3BitacoraPageProps {
  scouts: V3ScoutSummary[];
  entries: V3BitacoraEntry[];
  insights: V3InsightCard[];
}

const V3BitacoraPage: React.FC<V3BitacoraPageProps> = ({ scouts, entries, insights }) => {
  const [selectedScout, setSelectedScout] = useState('');
  const [search, setSearch] = useState('');

  const filtered = entries.filter((entry) => {
    const matchesScout = !selectedScout || entry.scoutId === selectedScout;
    const matchesSearch = !search || entry.title.toLowerCase().includes(search.toLowerCase()) || entry.description.toLowerCase().includes(search.toLowerCase());
    return matchesScout && matchesSearch;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.6fr_1.45fr_0.75fr]">
      <Surface className="p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-[#2f6a2d]" />
          <h2 className="text-3xl font-black tracking-tight text-slate-700">Filtros</h2>
        </div>
        <div className="mt-6 space-y-5">
          <FilterField label="Tipo de Actividad" value="todos" onChange={() => undefined} options={[{ value: 'todos', label: 'Todos los tipos' }]} />
          <FilterField label="Categoría" value="todas" onChange={() => undefined} options={[{ value: 'todas', label: 'Todas las categorías' }]} />
          <FilterField label="Período" value="todo" onChange={() => undefined} options={[{ value: 'todo', label: 'Todo el tiempo' }]} />
          <div>
            <div className="mb-3 text-lg font-semibold text-slate-600">Estado</div>
            <div className="space-y-3 text-lg text-slate-500">
              <label className="flex items-center gap-3"><input type="checkbox" /> Solo verificados</label>
              <label className="flex items-center gap-3"><input type="checkbox" /> Con fotos</label>
              <label className="flex items-center gap-3"><input type="checkbox" /> Con notas</label>
            </div>
          </div>
          <div className="rounded-[26px] border border-[#eadfd5] bg-[#fffdfa] p-5">
            <div className="flex items-center gap-3 text-[#58a9ea]"><Lightbulb className="h-6 w-6" /><span className="text-2xl font-black tracking-tight text-slate-700">Sugerencia IA</span></div>
            <p className="mt-3 text-lg leading-8 text-slate-500">Revisa actividades de campamento del último mes para identificar patrones de progreso.</p>
          </div>
        </div>
      </Surface>

      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-6xl font-black tracking-tight text-slate-700">Bitácora Digital</h1>
            <p className="mt-2 text-2xl text-slate-500">Seguimiento cronológico de actividades y logros de scouts</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PillButton><Download className="h-4 w-4" />Exportar Bitácora</PillButton>
            <PillButton><BookOpen className="h-4 w-4" />Ver Análisis</PillButton>
            <PillButton active><Plus className="h-4 w-4" />Nueva Entrada</PillButton>
          </div>
        </div>

        <Surface className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <FilterField
              label="Seleccionar Scout"
              value={selectedScout}
              onChange={setSelectedScout}
              options={[{ value: '', label: 'Todos los Scouts' }, ...scouts.map((scout) => ({ value: scout.id, label: `${scout.fullName} - ${scout.stageName}` }))]}
            />
            <SearchField label="Buscar" value={search} onChange={setSearch} placeholder="Search options..." />
          </div>
        </Surface>

        <Surface className="p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-4xl font-black tracking-tight text-slate-700">Línea de Tiempo</h2>
            <span className="text-xl font-semibold text-slate-500">{filtered.length} entradas</span>
          </div>
          <div className="mt-6 space-y-6">
            {filtered.map((entry) => (
              <div key={entry.id} className="relative rounded-[28px] border border-[#eadfd5] bg-[#fffdfa] p-7 pl-10 shadow-[0_12px_30px_rgba(69,45,18,0.05)]">
                <div className="absolute left-5 top-10 h-4 w-4 rounded-full border-4 border-white" style={{ background: entry.color, boxShadow: `0 0 0 6px ${entry.color}20` }} />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-700">{entry.title}</h3>
                    <p className="mt-2 text-lg text-slate-500">{entry.date} • {entry.category}</p>
                  </div>
                  {entry.verified ? <div className="inline-flex items-center gap-2 text-lg font-semibold text-[#2fb565]"><ShieldCheck className="h-5 w-5" />Verificado</div> : null}
                </div>
                <p className="mt-5 text-xl leading-9 text-slate-500">{entry.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#f3efe9] px-3 py-1 text-sm font-semibold text-slate-500">{tag}</span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-lg">
                  <button type="button" className="font-semibold text-slate-600">Ver detalles</button>
                  <span className="font-bold text-[#2f6a2d]">+{entry.points} puntos</span>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6a2d] to-[#58a9ea] text-white"><Lightbulb className="h-7 w-7" /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-700">Análisis IA</h2>
            <p className="text-lg text-slate-500">Insights inteligentes de progreso</p>
          </div>
        </div>
        <div className="mt-8 space-y-5">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className={`rounded-[28px] border border-[#d7c8f2] bg-gradient-to-br ${insight.gradient} p-6`}>
              <h3 className="text-2xl font-black tracking-tight text-slate-700">{insight.title}</h3>
              <p className="mt-3 text-lg leading-8 text-slate-500">{insight.body}</p>
              <div className="mt-5 text-lg font-semibold text-slate-600"><Search className="mr-2 inline h-4 w-4" />Ver detalles</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
};

export default V3BitacoraPage;