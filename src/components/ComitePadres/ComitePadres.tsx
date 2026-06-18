import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Calendar, Save, Plus, Search, User, Edit, Eye, Phone, Mail,
  Trash2, Award, Shield, UserCheck, ChevronRight, ChevronLeft, X,
  CreditCard, Briefcase, Sparkles, AlertCircle, Check, BadgeCheck,
} from 'lucide-react';
import { ComitePadresEntry } from '../../lib/supabase';
import ComitePadresService from '../../services/comitePadresService';
import { PersonSearchCombobox } from '../shared/PersonSearch';
import type { PersonaResult } from '../../services/personaService';

// ============================================================
// 👨‍👩‍👧‍👦 COMITÉ DE PADRES — UI futurista, claro y minimalista
// ============================================================

type Cargo = 'PRESIDENTE' | 'SECRETARIO' | 'TESORERO' | 'VOCAL' | 'SUPLENTE';
type Estado = 'ACTIVO' | 'INACTIVO' | 'CULMINADO';

interface FormState {
  nombres: string;
  apellidos: string;
  numero_documento: string;
  tipo_documento: 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE';
  fecha_nacimiento: string;
  sexo: 'MASCULINO' | 'FEMENINO';
  email: string;
  telefono: string;
  cargo: Cargo;
  fecha_inicio: string;
  fecha_fin: string;
  scout_hijo_nombre: string;
  experiencia_previa: string;
  habilidades: string[];
  disponibilidad: string;
  observaciones: string;
}

const FORM_INICIAL: FormState = {
  nombres: '',
  apellidos: '',
  numero_documento: '',
  tipo_documento: 'DNI',
  fecha_nacimiento: '',
  sexo: 'MASCULINO',
  email: '',
  telefono: '',
  cargo: 'VOCAL',
  fecha_inicio: '',
  fecha_fin: '',
  scout_hijo_nombre: '',
  experiencia_previa: '',
  habilidades: [],
  disponibilidad: '',
  observaciones: '',
};

const CARGOS: { value: Cargo; label: string; icon: React.ElementType; from: string; to: string; soft: string; text: string }[] = [
  { value: 'PRESIDENTE', label: 'Presidente(a)', icon: Shield, from: 'from-blue-500', to: 'to-indigo-500', soft: 'bg-blue-50 text-blue-700 ring-blue-200', text: 'text-blue-600' },
  { value: 'SECRETARIO', label: 'Secretario(a)', icon: Edit, from: 'from-emerald-500', to: 'to-teal-500', soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200', text: 'text-emerald-600' },
  { value: 'TESORERO', label: 'Tesorero(a)', icon: Award, from: 'from-amber-500', to: 'to-orange-500', soft: 'bg-amber-50 text-amber-700 ring-amber-200', text: 'text-amber-600' },
  { value: 'VOCAL', label: 'Vocal', icon: User, from: 'from-violet-500', to: 'to-purple-500', soft: 'bg-violet-50 text-violet-700 ring-violet-200', text: 'text-violet-600' },
  { value: 'SUPLENTE', label: 'Suplente', icon: UserCheck, from: 'from-slate-500', to: 'to-slate-600', soft: 'bg-slate-100 text-slate-700 ring-slate-200', text: 'text-slate-600' },
];

const ESTADOS: { value: Estado; label: string; soft: string; dot: string }[] = [
  { value: 'ACTIVO', label: 'Activo', soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  { value: 'INACTIVO', label: 'Inactivo', soft: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  { value: 'CULMINADO', label: 'Culminado', soft: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
];

const PASOS = [
  { id: 1, title: 'Identidad', icon: CreditCard },
  { id: 2, title: 'Cargo & Afiliación', icon: Briefcase },
  { id: 3, title: 'Experiencia', icon: Sparkles },
];

const cargoInfo = (c: string) => CARGOS.find((x) => x.value === c) ?? CARGOS[3];
const estadoInfo = (e: string) => ESTADOS.find((x) => x.value === e) ?? ESTADOS[1];

const iniciales = (nombres = '', apellidos = '') =>
  `${(nombres.trim()[0] ?? '')}${(apellidos.trim()[0] ?? '')}`.toUpperCase() || '·';

// Clases base reutilizables (glow focus claro)
const inputBase =
  'w-full px-4 py-2.5 rounded-xl border bg-white/90 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2';
const inputOk =
  'border-slate-200 focus:border-blue-400 focus:ring-blue-100 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)]';
const inputErr =
  'border-rose-300 focus:border-rose-400 focus:ring-rose-100 focus:shadow-[0_0_15px_rgba(244,63,94,0.2)]';

const labelBase = 'block text-sm font-medium text-slate-600 mb-1.5';

export default function ComitePadres() {
  // ============= ESTADO PRINCIPAL =============
  const [miembros, setMiembros] = useState<ComitePadresEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Wizard / modal
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [viewMiembro, setViewMiembro] = useState<ComitePadresEntry | null>(null);
  const [selectedMiembro, setSelectedMiembro] = useState<ComitePadresEntry | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [paso, setPaso] = useState(1);
  const [saving, setSaving] = useState(false);
  const [personaVinculada, setPersonaVinculada] = useState<PersonaResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [skillInput, setSkillInput] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const modoEdicion = modalMode === 'edit';

  // ============= CARGA =============
  useEffect(() => {
    loadMiembros();
  }, []);

  const loadMiembros = async () => {
    setLoading(true);
    try {
      const data = await ComitePadresService.getMiembrosComite({ activos_solo: false });
      setMiembros(data);
    } catch (error) {
      console.error('❌ Error cargando comité de padres:', error);
      setMiembros([]);
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    if (type === 'ok') setTimeout(() => setToast(null), 3000);
  };

  // ============= APERTURA DE MODALES =============
  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setErrors({});
    setPersonaVinculada(null);
    setSkillInput('');
    setPaso(1);
    setSelectedMiembro(null);
    setModalMode('create');
  };

  const abrirEditar = (m: ComitePadresEntry) => {
    setSelectedMiembro(m);
    setForm({
      nombres: m.nombres,
      apellidos: m.apellidos,
      numero_documento: m.numero_documento || '',
      tipo_documento: m.tipo_documento || 'DNI',
      fecha_nacimiento: m.fecha_nacimiento && m.fecha_nacimiento !== '1900-01-01' ? m.fecha_nacimiento : '',
      sexo: m.sexo || 'MASCULINO',
      email: m.email || m.correo || '',
      telefono: m.telefono || m.celular || '',
      cargo: m.cargo,
      fecha_inicio: m.fecha_inicio || '',
      fecha_fin: m.fecha_fin || '',
      scout_hijo_nombre: m.scout_hijo_nombre || '',
      experiencia_previa: m.experiencia_previa || '',
      habilidades: (m.habilidades || []).filter(Boolean),
      disponibilidad: m.disponibilidad || '',
      observaciones: m.observaciones || '',
    });
    setErrors({});
    setPersonaVinculada(null);
    setSkillInput('');
    setPaso(1);
    setModalMode('edit');
  };

  const cerrarModal = () => {
    setModalMode('closed');
    setSelectedMiembro(null);
  };

  // ============= VALIDACIÓN =============
  const validarPaso = (n: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (n === 1) {
      if (!form.nombres.trim()) e.nombres = 'Ingresa los nombres';
      if (!form.apellidos.trim()) e.apellidos = 'Ingresa los apellidos';
      if (!form.numero_documento.trim()) e.numero_documento = 'Documento obligatorio';
    }
    if (n === 2) {
      if (!form.cargo) e.cargo = 'Selecciona un cargo';
      if (!form.fecha_inicio.trim()) e.fecha_inicio = 'Indica la fecha de inicio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const irAPaso = (n: number) => {
    if (modoEdicion && n >= 1 && n <= PASOS.length) setPaso(n);
  };

  const siguiente = () => {
    if (validarPaso(paso)) setPaso((p) => Math.min(p + 1, PASOS.length));
  };
  const anterior = () => setPaso((p) => Math.max(p - 1, 1));

  // ============= HABILIDADES (chips) =============
  const agregarSkill = () => {
    const v = skillInput.trim();
    if (v && !form.habilidades.includes(v)) {
      setForm((f) => ({ ...f, habilidades: [...f.habilidades, v] }));
    }
    setSkillInput('');
  };
  const quitarSkill = (s: string) =>
    setForm((f) => ({ ...f, habilidades: f.habilidades.filter((x) => x !== s) }));

  // ============= GUARDAR =============
  const guardar = async () => {
    // Validar todos los campos obligatorios; navegar al primer paso con error
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.numero_documento.trim()) {
      validarPaso(1);
      setPaso(1);
      return;
    }
    if (!form.cargo || !form.fecha_inicio.trim()) {
      validarPaso(2);
      setPaso(2);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        numero_documento: form.numero_documento.trim(),
        tipo_documento: form.tipo_documento,
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo,
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        cargo: form.cargo,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        scout_hijo_nombre: form.scout_hijo_nombre.trim(),
        experiencia_previa: form.experiencia_previa.trim(),
        habilidades: form.habilidades,
        disponibilidad: form.disponibilidad.trim(),
        observaciones: form.observaciones.trim(),
      };

      const res = modoEdicion && selectedMiembro
        ? await ComitePadresService.updateMiembro(selectedMiembro.id, payload)
        : await ComitePadresService.registrarMiembro(payload);

      if (!res.success) {
        mostrarToast('err', res.error || 'No se pudo guardar el miembro');
        return;
      }

      await loadMiembros();
      cerrarModal();
      mostrarToast('ok', modoEdicion ? 'Miembro actualizado' : 'Miembro registrado');
    } catch (err) {
      console.error('Error al guardar miembro:', err);
      mostrarToast('err', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (m: ComitePadresEntry) => {
    if (!confirm(`¿Quitar a ${m.nombres} ${m.apellidos} del comité?`)) return;
    setLoading(true);
    try {
      const res = await ComitePadresService.deleteMiembro(m.id);
      if (!res.success) throw new Error(res.error);
      await loadMiembros();
      mostrarToast('ok', 'Miembro retirado del comité');
    } catch (err) {
      console.error('Error eliminando miembro:', err);
      mostrarToast('err', err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // ============= FILTRADO =============
  const filtrados = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return miembros.filter((m) => {
      const matchSearch =
        `${m.nombres} ${m.apellidos}`.toLowerCase().includes(q) ||
        (m.email || m.correo || '').toLowerCase().includes(q) ||
        (m.numero_documento || '').toLowerCase().includes(q);
      const matchCargo = !filterCargo || m.cargo === filterCargo;
      const matchEstado = !filterEstado || m.estado === filterEstado;
      return matchSearch && matchCargo && matchEstado;
    });
  }, [miembros, searchQuery, filterCargo, filterEstado]);

  // ============= RENDER =============
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-white to-blue-50/40 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* ---------- Header ---------- */}
        <header className="relative overflow-hidden rounded-2xl mb-6 border border-white/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 shadow-[0_8px_30px_rgba(59,130,246,0.25)]">
          <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/30">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Comité de Padres</h1>
                <p className="text-blue-100/90 text-sm">Gestión de los padres y madres que apoyan al grupo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={abrirCrear}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              Nuevo Miembro
            </button>
          </div>
        </header>

        {/* ---------- Filtros ---------- */}
        <div className="sticky top-0 z-20 mb-6 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-md">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o documento…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputBase} ${inputOk} pl-10`}
              />
            </div>
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className={`${inputBase} ${inputOk}`}
            >
              <option value="">Todos los cargos</option>
              {CARGOS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className={`${inputBase} ${inputOk}`}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ---------- Lista ---------- */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            filtrando={!!(searchQuery || filterCargo || filterEstado)}
            onNuevo={abrirCrear}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((m) => (
              <MiembroCard
                key={m.id}
                m={m}
                onView={() => setViewMiembro(m)}
                onEdit={() => abrirEditar(m)}
                onDelete={() => eliminar(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Wizard (crear / editar) ---------- */}
      {modalMode !== 'closed' && (
        <Modal onClose={cerrarModal} ancho="max-w-3xl">
          {/* Encabezado wizard */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
                  {modoEdicion ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {modoEdicion ? 'Editar miembro' : 'Nuevo miembro del comité'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {modoEdicion ? 'Edición libre — toca cualquier paso' : `Paso ${paso} de ${PASOS.length}`}
                  </p>
                </div>
              </div>
              <button type="button" onClick={cerrarModal} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="mt-5 flex items-center">
              {PASOS.map((p, i) => {
                const activo = paso === p.id;
                const completado = paso > p.id;
                const Icon = p.icon;
                const clickable = modoEdicion;
                return (
                  <React.Fragment key={p.id}>
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => irAPaso(p.id)}
                      className={`flex flex-col items-center gap-1.5 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-full ring-1 transition-all ${
                          activo
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white ring-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                            : completado
                            ? 'bg-blue-50 text-blue-600 ring-blue-200'
                            : 'bg-slate-50 text-slate-400 ring-slate-200'
                        } ${clickable ? 'hover:scale-105' : ''}`}
                      >
                        {completado ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>
                      <span className={`text-[11px] font-medium ${activo ? 'text-blue-600' : 'text-slate-400'}`}>{p.title}</span>
                    </button>
                    {i < PASOS.length - 1 && (
                      <div className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors ${paso > p.id ? 'bg-blue-400' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Cuerpo de pasos (no <form> para evitar submit accidental) */}
          <div
            className="px-6 py-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault();
            }}
          >
            {paso === 1 && (
              <PasoIdentidad
                form={form}
                setForm={setForm}
                errors={errors}
                personaVinculada={personaVinculada}
                onVincular={(persona) => {
                  setPersonaVinculada(persona);
                  setForm((f) => ({
                    ...f,
                    nombres: persona.nombres ?? f.nombres,
                    apellidos: persona.apellidos ?? f.apellidos,
                    tipo_documento: (persona.tipo_documento as FormState['tipo_documento']) ?? f.tipo_documento,
                    numero_documento: persona.numero_documento ?? f.numero_documento,
                    email: persona.correo ?? f.email,
                    telefono: persona.celular ?? f.telefono,
                    sexo: (persona.sexo as FormState['sexo']) ?? f.sexo,
                  }));
                }}
                onDesvincular={() => setPersonaVinculada(null)}
                modoEdicion={modoEdicion}
              />
            )}

            {paso === 2 && <PasoCargo form={form} setForm={setForm} errors={errors} />}

            {paso === 3 && (
              <PasoExperiencia
                form={form}
                setForm={setForm}
                skillInput={skillInput}
                setSkillInput={setSkillInput}
                onAddSkill={agregarSkill}
                onRemoveSkill={quitarSkill}
              />
            )}
          </div>

          {/* Footer wizard */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
            <button
              type="button"
              onClick={anterior}
              disabled={paso === 1}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>

            {modoEdicion ? (
              <button
                type="button"
                onClick={guardar}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            ) : paso < PASOS.length ? (
              <button
                type="button"
                onClick={siguiente}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={guardar}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
              >
                <BadgeCheck className="h-4 w-4" /> {saving ? 'Registrando…' : 'Registrar miembro'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* ---------- Modal Ver ---------- */}
      {viewMiembro && (
        <Modal onClose={() => setViewMiembro(null)} ancho="max-w-2xl">
          <DetalleMiembro
            m={viewMiembro}
            onClose={() => setViewMiembro(null)}
            onEdit={() => {
              const m = viewMiembro;
              setViewMiembro(null);
              abrirEditar(m);
            }}
          />
        </Modal>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ring-1 ${
              toast.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                : 'bg-rose-50 text-rose-800 ring-rose-200'
            }`}
          >
            {toast.type === 'ok' ? <Check className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-rose-500" />}
            <span className="text-sm font-medium">{toast.msg}</span>
            {toast.type === 'err' && (
              <button type="button" onClick={() => setToast(null)} className="ml-1 text-rose-400 hover:text-rose-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function Modal({ children, onClose, ancho }: { children: React.ReactNode; onClose: () => void; ancho: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${ancho} w-full max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200`}>
        {children}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-500">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
      {msg}
    </p>
  );
}

function PasoIdentidad({
  form, setForm, errors, personaVinculada, onVincular, onDesvincular, modoEdicion,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Partial<Record<keyof FormState, string>>;
  personaVinculada: PersonaResult | null;
  onVincular: (p: PersonaResult) => void;
  onDesvincular: () => void;
  modoEdicion: boolean;
}) {
  return (
    <div className="space-y-6">
      {!modoEdicion && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-tr from-blue-50/60 to-indigo-50/40 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Search className="h-4 w-4 text-blue-500" />
            ¿Ya está registrada en el sistema?
          </label>
          <PersonSearchCombobox
            placeholder="Buscar por nombre o N° de documento…"
            onSelect={onVincular}
            personaVinculada={personaVinculada}
            onDesvincular={onDesvincular}
          />
          <p className="mt-2 text-xs text-slate-400">
            Si es padre/madre de un scout ya existe en el sistema. Vincúlalo para no duplicar datos.
          </p>
        </div>
      )}

      {/* Bento de identidad */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelBase}>Nombres *</label>
          <input
            type="text"
            value={form.nombres}
            onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
            className={`${inputBase} ${errors.nombres ? inputErr : inputOk}`}
          />
          <FieldError msg={errors.nombres} />
        </div>
        <div>
          <label className={labelBase}>Apellidos *</label>
          <input
            type="text"
            value={form.apellidos}
            onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
            className={`${inputBase} ${errors.apellidos ? inputErr : inputOk}`}
          />
          <FieldError msg={errors.apellidos} />
        </div>
        <div>
          <label className={labelBase}>Tipo de documento</label>
          <select
            value={form.tipo_documento}
            onChange={(e) => setForm((f) => ({ ...f, tipo_documento: e.target.value as FormState['tipo_documento'] }))}
            className={`${inputBase} ${inputOk}`}
          >
            <option value="DNI">DNI</option>
            <option value="CARNET_EXTRANJERIA">Carnet de Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>
        <div>
          <label className={labelBase}>N° de documento *</label>
          <input
            type="text"
            value={form.numero_documento}
            onChange={(e) => setForm((f) => ({ ...f, numero_documento: e.target.value }))}
            className={`${inputBase} ${errors.numero_documento ? inputErr : inputOk}`}
          />
          <FieldError msg={errors.numero_documento} />
        </div>
        <div>
          <label className={labelBase}>Fecha de nacimiento</label>
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
            className={`${inputBase} ${inputOk}`}
          />
        </div>
        <div>
          <label className={labelBase}>Sexo</label>
          <div className="flex gap-2">
            {(['MASCULINO', 'FEMENINO'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, sexo: s }))}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  form.sexo === s
                    ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_12px_rgba(59,130,246,0.18)]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {s === 'MASCULINO' ? 'Masculino' : 'Femenino'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelBase}>Correo</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={`${inputBase} ${inputOk} pl-10`}
            />
          </div>
        </div>
        <div>
          <label className={labelBase}>Teléfono / Celular</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className={`${inputBase} ${inputOk} pl-10`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PasoCargo({
  form, setForm, errors,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Partial<Record<keyof FormState, string>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className={labelBase}>Cargo en el comité *</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARGOS.map((c) => {
            const Icon = c.icon;
            const activo = form.cargo === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, cargo: c.value }))}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
                  activo
                    ? `border-transparent bg-gradient-to-br ${c.from} ${c.to} text-white shadow-lg`
                    : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {activo && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/25">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
                <Icon className={`h-6 w-6 ${activo ? 'text-white' : c.text}`} />
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.cargo} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelBase}>Fecha de inicio *</label>
          <input
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
            className={`${inputBase} ${errors.fecha_inicio ? inputErr : inputOk}`}
          />
          <FieldError msg={errors.fecha_inicio} />
        </div>
        <div>
          <label className={labelBase}>Fecha de fin</label>
          <input
            type="date"
            value={form.fecha_fin}
            onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
            className={`${inputBase} ${inputOk}`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-600">
          <Users className="h-4 w-4 text-slate-400" /> Scout hijo/a (afiliación)
        </label>
        <input
          type="text"
          value={form.scout_hijo_nombre}
          onChange={(e) => setForm((f) => ({ ...f, scout_hijo_nombre: e.target.value }))}
          placeholder="Nombre del scout hijo/a (opcional)"
          className={`${inputBase} ${inputOk}`}
        />
        <p className="mt-2 text-xs text-slate-400">Vincula al miembro con su hijo/a scout para tener contexto familiar.</p>
      </div>
    </div>
  );
}

function PasoExperiencia({
  form, setForm, skillInput, setSkillInput, onAddSkill, onRemoveSkill,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  skillInput: string;
  setSkillInput: (v: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (s: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Habilidades como chips */}
      <div>
        <label className={labelBase}>Habilidades y competencias</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddSkill();
              }
            }}
            placeholder="Escribe y presiona Enter (ej. Contabilidad)"
            className={`${inputBase} ${inputOk} flex-1`}
          />
          <button
            type="button"
            onClick={onAddSkill}
            className="rounded-xl bg-blue-50 px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            Agregar
          </button>
        </div>
        {form.habilidades.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {form.habilidades.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-sm text-blue-700 ring-1 ring-blue-100"
              >
                {s}
                <button type="button" onClick={() => onRemoveSkill(s)} className="text-blue-400 hover:text-rose-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelBase}>Experiencia previa</label>
        <textarea
          rows={3}
          value={form.experiencia_previa}
          onChange={(e) => setForm((f) => ({ ...f, experiencia_previa: e.target.value }))}
          placeholder="Cargos o experiencia relevante…"
          className={`${inputBase} ${inputOk} resize-none`}
        />
      </div>

      <div>
        <label className={labelBase}>Disponibilidad</label>
        <input
          type="text"
          value={form.disponibilidad}
          onChange={(e) => setForm((f) => ({ ...f, disponibilidad: e.target.value }))}
          placeholder="Ej. Fines de semana, tardes entre semana, flexible"
          className={`${inputBase} ${inputOk}`}
        />
      </div>

      <div>
        <label className={labelBase}>Observaciones</label>
        <textarea
          rows={3}
          value={form.observaciones}
          onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
          placeholder="Notas adicionales…"
          className={`${inputBase} ${inputOk} resize-none`}
        />
      </div>
    </div>
  );
}

function MiembroCard({
  m, onView, onEdit, onDelete,
}: {
  m: ComitePadresEntry;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cargo = cargoInfo(m.cargo);
  const estado = estadoInfo(m.estado);
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className={`h-1.5 w-full bg-gradient-to-r ${cargo.from} ${cargo.to}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${cargo.from} ${cargo.to} text-sm font-bold text-white shadow-md`}>
            {iniciales(m.nombres, m.apellidos)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-slate-800">{m.nombres} {m.apellidos}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cargo.soft}`}>
                {cargo.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${estado.soft}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
                {estado.label}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-sm text-slate-500">
          {(m.email || m.correo) && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{m.email || m.correo}</span>
            </div>
          )}
          {(m.telefono || m.celular) && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{m.telefono || m.celular}</span>
            </div>
          )}
          {m.fecha_inicio && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Desde {new Date(m.fecha_inicio).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {m.habilidades && m.habilidades.filter(Boolean).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.habilidades.filter(Boolean).slice(0, 3).map((h, i) => (
              <span key={i} className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">{h}</span>
            ))}
            {m.habilidades.filter(Boolean).length > 3 && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-200">
                +{m.habilidades.filter(Boolean).length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-end gap-1 pt-4">
          <button type="button" onClick={onView} title="Ver" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
            <Eye className="h-4 w-4" />
          </button>
          <button type="button" onClick={onEdit} title="Editar" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600">
            <Edit className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} title="Retirar" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetalleMiembro({
  m, onClose, onEdit,
}: {
  m: ComitePadresEntry;
  onClose: () => void;
  onEdit: () => void;
}) {
  const cargo = cargoInfo(m.cargo);
  const estado = estadoInfo(m.estado);
  const habilidades = (m.habilidades || []).filter(Boolean);
  return (
    <>
      <div className={`relative overflow-hidden bg-gradient-to-r ${cargo.from} ${cargo.to} px-6 py-6 text-white`}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-xl font-bold ring-1 ring-white/30 backdrop-blur">
            {iniciales(m.nombres, m.apellidos)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{m.nombres} {m.apellidos}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">{cargo.label}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} /> {estado.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={CreditCard} label="Documento" value={`${m.tipo_documento || 'DNI'} ${m.numero_documento || '—'}`} />
          <InfoRow icon={Mail} label="Correo" value={m.email || m.correo || '—'} />
          <InfoRow icon={Phone} label="Teléfono" value={m.telefono || m.celular || '—'} />
          <InfoRow
            icon={Calendar}
            label="Período"
            value={`${m.fecha_inicio ? new Date(m.fecha_inicio).toLocaleDateString() : '—'} → ${m.fecha_fin ? new Date(m.fecha_fin).toLocaleDateString() : 'Indefinido'}`}
          />
        </div>

        {m.scout_hijo_nombre && (
          <DetalleBloque titulo="Scout hijo/a">{m.scout_hijo_nombre}</DetalleBloque>
        )}

        {habilidades.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {habilidades.map((h, i) => (
                <span key={i} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 ring-1 ring-blue-100">{h}</span>
              ))}
            </div>
          </div>
        )}

        {m.experiencia_previa && <DetalleBloque titulo="Experiencia previa">{m.experiencia_previa}</DetalleBloque>}
        {m.disponibilidad && <DetalleBloque titulo="Disponibilidad">{m.disponibilidad}</DetalleBloque>}
        {m.observaciones && <DetalleBloque titulo="Observaciones">{m.observaciones}</DetalleBloque>}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Cerrar
          </button>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg">
            <Edit className="h-4 w-4" /> Editar
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function DetalleBloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">{titulo}</h3>
      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-100">{children}</p>
    </div>
  );
}

function EmptyState({ filtrando, onNuevo }: { filtrando: boolean; onNuevo: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
      <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100">
        <Users className="h-10 w-10 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">
        {filtrando ? 'Sin resultados' : 'Aún no hay miembros'}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
        {filtrando
          ? 'No encontramos miembros con los filtros aplicados. Prueba ajustarlos.'
          : 'Registra al primer padre o madre que forma parte del comité.'}
      </p>
      {!filtrando && (
        <button
          type="button"
          onClick={onNuevo}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" /> Registrar miembro
        </button>
      )}
    </div>
  );
}
