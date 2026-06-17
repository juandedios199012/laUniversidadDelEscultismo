// ============================================================================
// EtapaFormDialog — Diálogo para crear / editar etapas y grupos
// ============================================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { RAMAS, Etapa, GrupoObjetivo } from '../../services/progresionService';
import type { EtapaFormData, GrupoFormData } from '../../hooks/useEtapasAdmin';

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const etapaSchema = z.object({
  nombre:            z.string().min(2, 'El nombre es requerido').max(50),
  descripcion:       z.string().optional(),
  edad_tipica:       z.coerce.number().int().positive().optional(),
  orden:             z.coerce.number().int().positive().optional(),
  icono:             z.string().max(10).optional(),
  color:             z.string().max(50).optional(),
  requisitos_avance: z.string().optional(),
});

const grupoSchema = z.object({
  nombre:      z.string().min(2, 'El nombre es requerido').max(80),
  codigo:      z.string().max(30).optional(),
  descripcion: z.string().optional(),
  orden:       z.coerce.number().int().positive().optional(),
});

type EtapaFormValues = z.infer<typeof etapaSchema>;
type GrupoFormValues  = z.infer<typeof grupoSchema>;

// ============================================================================
// PROPS
// ============================================================================

interface EtapaFormDialogProps {
  open: boolean;
  onClose: () => void;
  modo: 'etapa' | 'grupo';
  ramaActiva: string;
  /** Lista de etapas disponibles para configurar etapas_aplicables en grupos */
  etapasDisponibles?: Etapa[];
  /** Si se provee, es modo edición */
  etapaEditar?: Etapa;
  grupoEditar?: GrupoObjetivo;
  guardando: boolean;
  onCrearEtapa: (datos: EtapaFormData) => Promise<void>;
  onActualizarEtapa: (id: string, datos: EtapaFormData) => Promise<void>;
  onCrearGrupo: (datos: GrupoFormData) => Promise<void>;
  onActualizarGrupo: (id: string, datos: GrupoFormData) => Promise<void>;
}

// ============================================================================
// COMPONENTE
// ============================================================================

export function EtapaFormDialog({
  open,
  onClose,
  modo,
  ramaActiva,
  etapasDisponibles = [],
  etapaEditar,
  grupoEditar,
  guardando,
  onCrearEtapa,
  onActualizarEtapa,
  onCrearGrupo,
  onActualizarGrupo,
}: EtapaFormDialogProps) {
  const esEdicion = modo === 'etapa' ? !!etapaEditar : !!grupoEditar;
  const ramaInfo = RAMAS.find(r => r.codigo === ramaActiva);

  // Estado local para etapas_aplicables y validación
  const [etapasAplicables, setEtapasAplicables] = useState<string[]>([]);
  const [errorEtapas, setErrorEtapas]             = useState<string | null>(null);
  // Último nombre auto-generado: permite detectar si el usuario lo sobreescribió
  const [autoNombre, setAutoNombre]               = useState('');

  const toggleEtapa = (codigo: string) => {
    const nuevos = etapasAplicables.includes(codigo)
      ? etapasAplicables.filter(c => c !== codigo)
      : [...etapasAplicables, codigo];

    // Auto-generar nombre desde las etapas seleccionadas
    const nombreGenerado = etapasDisponibles
      .filter(e => nuevos.includes(e.codigo))
      .map(e => e.nombre)
      .join(' - ');

    // Solo sobreescribir el nombre si el usuario no lo modificó manualmente
    const nombreActual = grupoForm.getValues('nombre');
    if (!nombreActual || nombreActual === autoNombre) {
      grupoForm.setValue('nombre', nombreGenerado, { shouldValidate: !!nombreGenerado });
    }
    setAutoNombre(nombreGenerado);
    setEtapasAplicables(nuevos);
    setErrorEtapas(null);
  };

  // ---- Formulario Etapa ----
  const etapaForm = useForm<EtapaFormValues>({
    resolver: zodResolver(etapaSchema),
    defaultValues: {
      nombre: '', codigo: '', descripcion: '', icono: '📍',
      color: 'hsl(210, 70%, 55%)',
    },
  });

  // ---- Formulario Grupo ----
  const grupoForm = useForm<GrupoFormValues>({
    resolver: zodResolver(grupoSchema),
    defaultValues: { nombre: '', codigo: '', descripcion: '' },
  });

  // Cargar datos en modo edición
  useEffect(() => {
    if (!open) return;
    if (modo === 'etapa' && etapaEditar) {
      etapaForm.reset({
        nombre:            etapaEditar.nombre,
        codigo:            etapaEditar.codigo,
        descripcion:       etapaEditar.descripcion || '',
        edad_tipica:       etapaEditar.edad_tipica,
        orden:             etapaEditar.orden,
        icono:             etapaEditar.icono || '📍',
        color:             etapaEditar.color || 'hsl(210, 70%, 55%)',
        requisitos_avance: etapaEditar.requisitos_avance || '',
      });
    } else if (modo === 'etapa') {
      etapaForm.reset({ nombre: '', codigo: '', descripcion: '', icono: '📍', color: 'hsl(210, 70%, 55%)' });
    }

    if (modo === 'grupo' && grupoEditar) {
      grupoForm.reset({
        nombre:      grupoEditar.nombre,
        codigo:      grupoEditar.codigo,
        descripcion: grupoEditar.descripcion || '',
        orden:       grupoEditar.orden,
      });
      setEtapasAplicables(grupoEditar.etapas_aplicables ?? []);
      setAutoNombre('');
      setErrorEtapas(null);
    } else if (modo === 'grupo') {
      grupoForm.reset({ nombre: '', codigo: '', descripcion: '' });
      setEtapasAplicables([]);
      setAutoNombre('');
      setErrorEtapas(null);
    }
  }, [open, modo, etapaEditar, grupoEditar]);

  // ---- Submit ----
  const handleSubmitEtapa = etapaForm.handleSubmit(async (values) => {
    const datos: EtapaFormData = {
      nombre:            values.nombre,
      descripcion:       values.descripcion || undefined,
      edad_tipica:       values.edad_tipica || undefined,
      orden:             values.orden || undefined,
      icono:             values.icono || undefined,
      color:             values.color || undefined,
      requisitos_avance: values.requisitos_avance || undefined,
    };
    if (esEdicion && etapaEditar) {
      await onActualizarEtapa(etapaEditar.id, datos);
    } else {
      await onCrearEtapa(datos);
    }
    onClose();
  });

  const handleSubmitGrupo = grupoForm.handleSubmit(async (values) => {
    // Validar: se debe seleccionar al menos una etapa (si hay etapas disponibles)
    if (etapasDisponibles.length > 0 && etapasAplicables.length === 0) {
      setErrorEtapas('Selecciona al menos una etapa para este grupo');
      return;
    }
    const datos: GrupoFormData = {
      nombre:             values.nombre,
      codigo:             values.codigo || undefined,
      descripcion:        values.descripcion || undefined,
      orden:              values.orden || undefined,
      etapas_aplicables:  etapasAplicables.length > 0 ? etapasAplicables : undefined,
    };
    if (esEdicion && grupoEditar) {
      await onActualizarGrupo(grupoEditar.id, datos);
    } else {
      await onCrearGrupo(datos);
    }
    onClose();
  });

  const titulo = modo === 'etapa'
    ? (esEdicion ? 'Editar Etapa' : 'Nueva Etapa')
    : (esEdicion ? 'Editar Grupo de Objetivos' : 'Nuevo Grupo de Objetivos');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{titulo}</span>
            {ramaInfo && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ramaInfo.bg} ${ramaInfo.text}`}>
                {ramaInfo.icono} {ramaInfo.label}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ---- FORM ETAPA ---- */}
        {modo === 'etapa' && (
          <Form {...etapaForm}>
            <form
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={etapaForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="ej: Pista" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={etapaForm.control}
                  name="edad_tipica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad típica</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={30} placeholder="ej: 11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={etapaForm.control}
                  name="icono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícono (emoji)</FormLabel>
                      <FormControl><Input placeholder="📍" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos avanzados colapsados */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none">
                  Opciones avanzadas ▸
                </summary>
                <div className="mt-3">
                  <FormField
                    control={etapaForm.control}
                    name="orden"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orden</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="Auto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>
              <FormField
                control={etapaForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Descripción de la etapa..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={etapaForm.control}
                name="requisitos_avance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos de avance</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="¿Qué debe cumplir para avanzar?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSubmitEtapa} disabled={guardando}>
                  {guardando ? 'Guardando…' : esEdicion ? 'Guardar Cambios' : 'Crear Etapa'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* ---- FORM GRUPO ---- */}
        {modo === 'grupo' && (
          <Form {...grupoForm}>
            <form
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="space-y-4"
            >

              {/* ── PASO 1: Selección de etapas (lo más importante, va primero) ── */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Etapas que cubre este grupo
                      {etapasDisponibles.length > 0 && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Un grupo agrupa objetivos educativos compartidos por una o más etapas
                    </p>
                  </div>
                  {etapasAplicables.length > 0 && (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {etapasAplicables.length} seleccionada{etapasAplicables.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {etapasDisponibles.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    ⚠ No hay etapas registradas para esta rama. Crea las etapas primero.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {etapasDisponibles.map((etapa) => {
                      const activa = etapasAplicables.includes(etapa.codigo);
                      return (
                        <button
                          key={etapa.codigo}
                          type="button"
                          onClick={() => toggleEtapa(etapa.codigo)}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            activa
                              ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <span>{etapa.icono ?? '📍'}</span>
                          <span>{etapa.nombre}</span>
                          {activa && <span className="text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {errorEtapas && (
                  <p className="text-xs text-red-500">{errorEtapas}</p>
                )}
              </div>

              {/* ── PASO 2: Nombre (auto-generado o manual) ── */}
              <FormField
                control={grupoForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Nombre del grupo <span className="text-red-500">*</span>
                      {field.value && field.value === autoNombre && (
                        <span className="text-xs font-normal text-gray-400">auto-generado · puedes editarlo</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Se genera al seleccionar etapas..."
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Si el usuario edita manualmente, desconectar del auto-nombre
                          if (e.target.value !== autoNombre) setAutoNombre('');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Campos opcionales ── */}
              <details className="group">
                <summary className="cursor-pointer list-none text-xs text-gray-400 hover:text-gray-600 select-none">
                  <span className="group-open:hidden">▸ Campos opcionales (código, orden, descripción)</span>
                  <span className="hidden group-open:inline">▾ Campos opcionales</span>
                </summary>
                <div className="pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={grupoForm.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
                          <FormControl><Input placeholder="Auto-generado" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={grupoForm.control}
                      name="orden"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orden</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} placeholder="Auto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={grupoForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea rows={2} placeholder="Descripción del grupo..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSubmitGrupo} disabled={guardando}>
                  {guardando ? 'Guardando…' : esEdicion ? 'Guardar Cambios' : 'Crear Grupo'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EtapaFormDialog;
