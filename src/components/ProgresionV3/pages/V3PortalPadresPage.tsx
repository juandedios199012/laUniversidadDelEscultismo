import React, { useState } from 'react';
import { Calendar, Download, Eye, Medal, Sparkles, Star, Trophy, Users } from 'lucide-react';
import { PillButton, ProgressBar, StagePill, Surface } from '../V3Primitives';
import type { V3AnnouncementCard, V3EventCard, V3ScoutSummary } from '../types';

interface V3PortalPadresPageProps {
  scout: V3ScoutSummary | undefined;
  events: V3EventCard[];
  announcements: V3AnnouncementCard[];
}

const priorityColor: Record<V3AnnouncementCard['priority'], string> = {
  Alta: 'text-red-400',
  Media: 'text-orange-500',
  Baja: 'text-emerald-500',
};

const V3PortalPadresPage: React.FC<V3PortalPadresPageProps> = ({ scout, events, announcements }) => {
  const [subTab, setSubTab] = useState<'resumen' | 'logros' | 'eventos' | 'informes' | 'contacto'>('resumen');

  if (!scout) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black tracking-tight text-slate-700">Portal de Padres</h1>
          <p className="mt-3 text-2xl text-slate-500">Seguimiento completo del desarrollo scout de su hijo</p>
        </div>
        <PillButton active><Download className="h-4 w-4" />Exportar Datos</PillButton>
      </div>

      <Surface className="p-8">
        <div className="flex flex-wrap items-center gap-6 lg:flex-nowrap">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-[#eef4e8] text-6xl font-black text-slate-400">
            {scout.photoUrl ? <img src={scout.photoUrl} alt={scout.fullName} className="h-full w-full object-cover" /> : scout.firstName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-5xl font-black tracking-tight text-slate-700">{scout.fullName}</h2>
            <div className="mt-4 flex flex-wrap gap-5 text-xl text-slate-500">
              <span>{scout.age} años</span>
              <span>Etapa {scout.stageName}</span>
              <span className="font-semibold text-[#2fb565]">↗ {scout.progress}% Completado</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-[22px] border border-[#eadfd5] p-5"><div className="text-base text-slate-500">Objetivos</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">{scout.objectivesCompleted}/{scout.objectivesTotal}</div></div>
              <div className="rounded-[22px] border border-[#eadfd5] p-5"><div className="text-base text-slate-500">Técnicas</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">{scout.activeSpecialties}/{Math.max(20, scout.activeSpecialties + 7)}</div></div>
              <div className="rounded-[22px] border border-[#eadfd5] p-5"><div className="text-base text-slate-500">Insignias</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">{scout.badgeCount}</div></div>
              <div className="rounded-[22px] border border-[#eadfd5] p-5"><div className="text-base text-slate-500">Logros</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">{scout.achievements}</div></div>
            </div>
          </div>
        </div>
      </Surface>

      <div className="flex flex-wrap gap-3">
        <PillButton active={subTab === 'resumen'} onClick={() => setSubTab('resumen')}><Users className="h-4 w-4" />Resumen General</PillButton>
        <PillButton active={subTab === 'logros'} onClick={() => setSubTab('logros')}><Trophy className="h-4 w-4" />Logros</PillButton>
        <PillButton active={subTab === 'eventos'} onClick={() => setSubTab('eventos')}><Calendar className="h-4 w-4" />Eventos</PillButton>
        <PillButton active={subTab === 'informes'} onClick={() => setSubTab('informes')}><Medal className="h-4 w-4" />Informes</PillButton>
        <PillButton active={subTab === 'contacto'} onClick={() => setSubTab('contacto')}><Eye className="h-4 w-4" />Contacto</PillButton>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface className="p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-4xl font-black tracking-tight text-slate-700">Progreso de Etapa</h2>
            <StagePill label={scout.stageName} color={scout.stageAccent} active />
          </div>
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between text-xl font-semibold text-slate-600">
              <span>Progreso General</span>
              <span>{scout.progress}%</span>
            </div>
            <ProgressBar value={scout.progress} className="h-4" />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#eadfd5] p-6"><div className="text-base text-slate-500">Objetivos Completados</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">{scout.objectivesCompleted}/{scout.objectivesTotal}</div><ProgressBar value={scout.objectivesTotal ? (scout.objectivesCompleted / scout.objectivesTotal) * 100 : 0} className="mt-5 h-3" colorClass="from-[#2f6a2d] to-[#2f6a2d]" /></div>
            <div className="rounded-[24px] border border-[#eadfd5] p-6"><div className="text-base text-slate-500">Actividades en Curso</div><div className="mt-2 text-4xl font-black tracking-tight text-slate-700">5</div><div className="mt-4 text-lg text-slate-500">Próxima revisión: 15 de Febrero, 2026</div></div>
          </div>
          <div className="mt-6 rounded-[24px] border border-[#eadfd5] p-6">
            <div className="text-3xl font-black tracking-tight text-slate-700">Próximo Hito</div>
            <div className="mt-3 text-2xl text-slate-500">Completar técnicas de orientación avanzada</div>
            <div className="mt-4 text-xl font-semibold text-[#2f6a2d]">Fecha estimada: 28 de Febrero, 2026</div>
          </div>
        </Surface>

        <Surface className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6a2d] to-[#58a9ea] text-white"><Sparkles className="h-8 w-8" /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-700">Análisis IA</h2>
              <p className="text-lg text-slate-500">Insights personalizados sobre el desarrollo</p>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            <div className="rounded-[24px] border border-[#eadfd5] p-6"><div className="text-3xl font-black tracking-tight text-slate-700">Fortalezas Destacadas</div><ul className="mt-4 space-y-3 text-xl leading-9 text-slate-500"><li>Excelente capacidad de liderazgo.</li><li>Trabajo en equipo consistente.</li><li>Compromiso con el servicio comunitario.</li></ul></div>
            <div className="rounded-[24px] border border-[#eadfd5] p-6"><div className="text-3xl font-black tracking-tight text-slate-700">Áreas de Crecimiento</div><ul className="mt-4 space-y-3 text-xl leading-9 text-slate-500"><li>Comunicación verbal en presentaciones.</li><li>Más práctica en cocina de campamento.</li><li>Refuerzo de lectura de mapas.</li></ul></div>
          </div>
        </Surface>
      </div>

      {(subTab === 'resumen' || subTab === 'eventos') ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Surface className="p-8">
            <div className="flex items-center justify-between gap-4"><h2 className="text-4xl font-black tracking-tight text-slate-700">Próximos Eventos</h2><span className="text-xl font-semibold text-[#2f6a2d]">{events.length} eventos</span></div>
            <div className="mt-6 space-y-5">
              {events.map((event) => (
                <div key={event.id} className="rounded-[24px] border border-[#eadfd5] p-6">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-black tracking-tight text-slate-700">{event.title}</h3><p className="mt-2 text-lg leading-8 text-slate-500">{event.description}</p></div><span className="rounded-full px-4 py-2 text-base font-semibold" style={{ color: '#2f6a2d', background: event.color }}>{event.type}</span></div>
                  <div className="mt-5 grid gap-3 text-lg text-slate-500 md:grid-cols-2"><span>{event.date}</span><span>{event.time}</span><span>{event.location}</span><span>Materiales requeridos</span></div>
                  {event.notes ? <ul className="mt-5 space-y-2 text-lg text-slate-500">{event.notes.map((note) => <li key={note}>✓ {note}</li>)}</ul> : null}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-8">
            <div className="flex items-center justify-between gap-4"><h2 className="text-4xl font-black tracking-tight text-slate-700">Anuncios Importantes</h2><span className="text-xl font-semibold text-sky-500">3 nuevos</span></div>
            <div className="mt-6 space-y-5">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-[24px] border border-[#eadfd5] p-6">
                  <div className="flex items-start justify-between gap-4"><h3 className="text-2xl font-black tracking-tight text-slate-700">{announcement.title}</h3><span className={`text-xl font-semibold ${priorityColor[announcement.priority]}`}>{announcement.priority}</span></div>
                  <p className="mt-3 text-lg leading-8 text-slate-500">{announcement.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-base text-slate-500"><span>{announcement.author}</span><span>{announcement.date}</span><span>Requiere acción</span></div>
                  <div className="mt-4 text-xl font-semibold text-[#2f6a2d]">Ver más detalles →</div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      ) : null}

      {(subTab === 'resumen' || subTab === 'logros') ? (
        <Surface className="p-8">
          <div className="flex items-center justify-between gap-4"><h2 className="text-4xl font-black tracking-tight text-slate-700">Logros Recientes</h2><span className="text-xl text-slate-500">Últimos 30 días</span></div>
          <div className="mt-6 space-y-5">
            {[0, 1].map((index) => (
              <div key={index} className="rounded-[24px] border border-[#eadfd5] p-6">
                <div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-black tracking-tight text-slate-700">{index === 0 ? 'Insignia de Campamento Avanzado' : 'Objetivo de Primeros Auxilios Completado'}</h3><p className="mt-2 text-lg leading-8 text-slate-500">{index === 0 ? `${scout.firstName} demostró habilidades de supervivencia durante la última salida regional.` : 'Completó con éxito el módulo de primeros auxilios básicos.'}</p></div><span className="text-base text-slate-500">{index === 0 ? '10 de Enero, 2026' : '5 de Enero, 2026'}</span></div>
                {index === 0 ? <div className="mt-5 h-56 rounded-[22px] bg-[linear-gradient(135deg,#17381d_0%,#214d2b_35%,#c46c2c_100%)]" /> : null}
                <div className="mt-5 flex items-center justify-between gap-4"><div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-500"><span className="rounded-full bg-[#f3efe9] px-3 py-1">Campamento</span><span className="rounded-full bg-[#f3efe9] px-3 py-1">Supervivencia</span><span className="rounded-full bg-[#f3efe9] px-3 py-1">Liderazgo</span></div><span className="text-xl font-bold text-[#2f6a2d]">+{index === 0 ? 50 : 30} puntos</span></div>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}
    </div>
  );
};

export default V3PortalPadresPage;