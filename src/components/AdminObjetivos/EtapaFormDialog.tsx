// ============================================================================
// EtapaFormDialog — Diálogo para crear / editar etapas y grupos
// ============================================================================

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { RAMAS, Etapa, GrupoObjetivo } from '../../../services/progresionService';
import type { EtapaFormData, GrupoFormData } from '../../../hooks/useEtapasAdmin';

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const etapaSchema = z.object({
  nombre:            z.string().min(2, 'El nombre es requerido').max(50),
  codigo:            z.string().max(20).optional(),
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
    } else if (modo === 'grupo') {
      grupoForm.reset({ nombre: '', codigo: '', descripcion: '' });
    }
  }, [open, modo, etapaEditar, grupoEditar]);

  // ---- Submit ----
  const handleSubmitEtapa = etapaForm.handleSubmit(async (values) => {
    const datos: EtapaFormData = {
      nombre:            values.nombre,
      codigo:            values.codigo || undefined,
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
    const datos: GrupoFormData = {
      nombre:      values.nombre,
      codigo:      values.codigo || undefined,
      descripcion: values.descripcion || undefined,
      orden:       values.orden || undefined,
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
              <FormField
                control={grupoForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                    <FormControl><Input placeholder="ej: Pista-Senda" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
