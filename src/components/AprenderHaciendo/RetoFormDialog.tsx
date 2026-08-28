/**
 * RetoFormDialog — crear/editar un `ah_reto`: título, tipo de juego,
 * puntos, tiempo límite y un sub-formulario específico del tipo de
 * juego elegido que arma el JSON `configuracion` con la forma exacta
 * que cada Strategy de `games/*.tsx` espera (ver
 * `src/types/aprenderHaciendo.ts`).
 *
 * Igual que `PasoFormDialog.tsx`: `useState` plano, se monta sólo
 * mientras está abierto para arrancar siempre con estado limpio.
 *
 * Los sub-formularios están agrupados en 3 familias, en el mismo
 * criterio de consolidación que las Strategy de juego: Seleccionable
 * (TRIVIA / JENGA_EQUIPO comparten fila y sólo difieren en si se
 * muestra el campo de color), DragAndDrop (ARRASTRAR_SOLTAR /
 * SECUENCIA comparten la instrucción pero tienen filas con forma
 * distinta) y Parser (MORSE). MEMORIA queda como estaba. Todas usan el
 * mismo componente genérico `ListaRepetible` para no repetir el
 * boilerplate de agregar/quitar fila.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import type {
  AhReto, AhTipoJuego,
  DragAndDropConfiguracion, MemoriaConfiguracion,
  ParserConfiguracion, SeleccionableConfiguracion,
} from '@/types/aprenderHaciendo';

// ----------------------------------------------------------------
// Utilidades compartidas
// ----------------------------------------------------------------
let contadorId = 0;
function genId(): string {
  contadorId += 1;
  return `f${Date.now().toString(36)}${contadorId}`;
}

const TIPOS_JUEGO: { value: AhTipoJuego; label: string }[] = [
  { value: 'TRIVIA', label: 'Trivia' },
  { value: 'ARRASTRAR_SOLTAR', label: 'Arrastrar y soltar' },
  { value: 'SECUENCIA', label: 'Secuencia (ordenar pasos)' },
  { value: 'MORSE', label: 'Morse' },
  { value: 'MEMORIA', label: 'Memoria' },
  { value: 'JENGA_EQUIPO', label: 'Jenga de equipo' },
];

const PRESETS_COLOR_JENGA = [
  { value: 'auto', label: 'Automático' },
  { value: 'from-amber-500 to-orange-500', label: 'Ámbar' },
  { value: 'from-blue-500 to-cyan-500', label: 'Azul' },
  { value: 'from-emerald-500 to-teal-500', label: 'Verde' },
  { value: 'from-fuchsia-500 to-purple-600', label: 'Fucsia' },
  { value: 'from-rose-500 to-pink-600', label: 'Rosa' },
];

// ----------------------------------------------------------------
// Componente genérico de lista repetible (agregar / quitar fila) —
// evita repetir la misma mecánica en los sub-formularios.
// ----------------------------------------------------------------
interface ListaRepetibleProps<T> {
  filas: T[];
  onChange: (nuevas: T[]) => void;
  nuevaFila: () => T;
  renderFila: (fila: T, index: number, actualizar: (patch: Partial<T>) => void) => React.ReactNode;
  etiquetaAgregar: string;
}

function ListaRepetible<T>({ filas, onChange, nuevaFila, renderFila, etiquetaAgregar }: ListaRepetibleProps<T>) {
  const agregar = () => onChange([...filas, nuevaFila()]);
  const quitar = (i: number) => onChange(filas.filter((_, idx) => idx !== i));
  const actualizarFila = (i: number, patch: Partial<T>) => {
    const nuevas = [...filas];
    nuevas[i] = { ...nuevas[i], ...patch };
    onChange(nuevas);
  };

  return (
    <div className="flex flex-col gap-3">
      {filas.map((fila, i) => (
        <div key={i} className="relative border rounded-xl p-3 pr-10 bg-gray-50/70 flex flex-col gap-2">
          {renderFila(fila, i, patch => actualizarFila(i, patch))}
          {filas.length > 1 && (
            <button
              type="button"
              onClick={() => quitar(i)}
              aria-label={`Quitar fila ${i + 1}`}
              className="absolute top-2 right-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={agregar} className="min-h-[40px] self-start">
        <Plus className="h-4 w-4 mr-2" />
        {etiquetaAgregar}
      </Button>
    </div>
  );
}

// ----------------------------------------------------------------
// Filas por familia de tipo de juego (forma local de edición) +
// conversión configuración JSON <-> filas
// ----------------------------------------------------------------

// Seleccionable — TRIVIA y JENGA_EQUIPO comparten esta fila; `color`
// sólo se muestra/usa en la UI cuando el tipo elegido es JENGA_EQUIPO.
interface SeleccionableFila { rowId: string; texto: string; opciones: string[]; respuestaCorrecta: number; pictograma: string; color: string }
const filaVaciaSeleccionable = (): SeleccionableFila => (
  { rowId: genId(), texto: '', opciones: ['', '', ''], respuestaCorrecta: 0, pictograma: '', color: 'auto' }
);

function filasSeleccionableDesdeConfig(config: unknown): SeleccionableFila[] {
  const preguntas = (config as SeleccionableConfiguracion)?.preguntas;
  if (!preguntas?.length) return [filaVaciaSeleccionable()];
  return preguntas.map(p => ({
    rowId: genId(),
    texto: p.texto || '',
    opciones: [p.opciones?.[0] || '', p.opciones?.[1] || '', p.opciones?.[2] || ''],
    respuestaCorrecta: p.respuestaCorrecta ?? 0,
    pictograma: p.pictograma || '',
    color: p.color || 'auto',
  }));
}

// DragAndDrop — ARRASTRAR_SOLTAR ('emparejar') y SECUENCIA ('ordenar')
// comparten la instrucción pero tienen filas de forma distinta.
interface EmparejarFila { rowId: string; pictograma: string; etiqueta: string }
interface OrdenarFila { rowId: string; texto: string; pictograma: string }

const filaVaciaEmparejar = (): EmparejarFila => ({ rowId: genId(), pictograma: '', etiqueta: '' });
const filaVaciaOrdenar = (): OrdenarFila => ({ rowId: genId(), texto: '', pictograma: '' });

function filasEmparejarDesdeConfig(config: unknown): { instruccion: string; filas: EmparejarFila[] } {
  const c = config as DragAndDropConfiguracion;
  const pares = c?.pares;
  return {
    instruccion: c?.instruccion || '',
    filas: pares?.length
      ? pares.map(p => ({ rowId: genId(), pictograma: p.pictograma || '', etiqueta: p.etiqueta || '' }))
      : [filaVaciaEmparejar()],
  };
}

function filasOrdenarDesdeConfig(config: unknown): { instruccion: string; filas: OrdenarFila[] } {
  const c = config as DragAndDropConfiguracion;
  const pasos = c?.pasos;
  return {
    instruccion: c?.instruccion || '',
    filas: pasos?.length
      ? pasos.map(p => ({ rowId: genId(), texto: p.texto || '', pictograma: p.pictograma || '' }))
      : [filaVaciaOrdenar()],
  };
}

// Parser — hoy sólo MORSE
interface ParserFila { rowId: string; codigo: string; respuestaCorrecta: string; opciones: string[]; pista: string }
const filaVaciaParser = (): ParserFila => ({ rowId: genId(), codigo: '', respuestaCorrecta: '', opciones: ['', '', ''], pista: '' });

function filasParserDesdeConfig(config: unknown): ParserFila[] {
  const retos = (config as ParserConfiguracion)?.retos;
  if (!retos?.length) return [filaVaciaParser()];
  return retos.map(r => ({
    rowId: genId(),
    codigo: r.codigo || '',
    respuestaCorrecta: r.respuestaCorrecta || '',
    opciones: [r.opciones?.[0] || '', r.opciones?.[1] || '', r.opciones?.[2] || ''],
    pista: r.pista || '',
  }));
}

// Memoria — sin cambios
interface MemoriaFila { rowId: string; pictograma: string; etiqueta: string }
const filaVaciaMemoria = (): MemoriaFila => ({ rowId: genId(), pictograma: '', etiqueta: '' });

function filasMemoriaDesdeConfig(config: unknown): MemoriaFila[] {
  const pares = (config as MemoriaConfiguracion)?.pares;
  if (!pares?.length) return [filaVaciaMemoria()];
  return pares.map(p => ({ rowId: genId(), pictograma: p.pictograma || '', etiqueta: p.etiqueta || '' }));
}

// ----------------------------------------------------------------
// Props del componente principal
// ----------------------------------------------------------------
interface RetoFormDialogProps {
  moduloId: string;
  /** Reto a editar; null = crear uno nuevo */
  retoEditar: AhReto | null;
  onClose: () => void;
  onGuardado: () => void;
}

export default function RetoFormDialog({ moduloId, retoEditar, onClose, onGuardado }: RetoFormDialogProps) {
  const esEdicion = !!retoEditar;

  const [titulo, setTitulo] = useState(retoEditar?.titulo ?? '');
  const [tipoJuego, setTipoJuego] = useState<AhTipoJuego>(retoEditar?.tipo_juego ?? 'TRIVIA');
  const [puntosBase, setPuntosBase] = useState(String(retoEditar?.puntos_base ?? 10));
  const [tiempoLimite, setTiempoLimite] = useState(
    retoEditar?.tiempo_limite_segundos ? String(retoEditar.tiempo_limite_segundos) : ''
  );
  const [guardando, setGuardando] = useState(false);

  const configInicial = retoEditar?.configuracion;
  const tipoInicial = retoEditar?.tipo_juego;

  // Seleccionable (TRIVIA / JENGA_EQUIPO)
  const [filasSeleccionable, setFilasSeleccionable] = useState<SeleccionableFila[]>(
    () => (tipoInicial === 'TRIVIA' || tipoInicial === 'JENGA_EQUIPO')
      ? filasSeleccionableDesdeConfig(configInicial)
      : [filaVaciaSeleccionable()]
  );

  // DragAndDrop (ARRASTRAR_SOLTAR / SECUENCIA) — instrucción compartida,
  // filas separadas porque su forma es genuinamente distinta.
  const emparejarInicial = tipoInicial === 'ARRASTRAR_SOLTAR' ? filasEmparejarDesdeConfig(configInicial) : null;
  const ordenarInicial = tipoInicial === 'SECUENCIA' ? filasOrdenarDesdeConfig(configInicial) : null;
  const [instruccionDragAndDrop, setInstruccionDragAndDrop] = useState(
    emparejarInicial?.instruccion ?? ordenarInicial?.instruccion ?? ''
  );
  const [filasEmparejar, setFilasEmparejar] = useState<EmparejarFila[]>(emparejarInicial?.filas ?? [filaVaciaEmparejar()]);
  const [filasOrdenar, setFilasOrdenar] = useState<OrdenarFila[]>(ordenarInicial?.filas ?? [filaVaciaOrdenar()]);

  // Parser (MORSE)
  const [filasParser, setFilasParser] = useState<ParserFila[]>(
    () => (tipoInicial === 'MORSE' ? filasParserDesdeConfig(configInicial) : [filaVaciaParser()])
  );

  // Memoria
  const [filasMemoria, setFilasMemoria] = useState<MemoriaFila[]>(
    () => (tipoInicial === 'MEMORIA' ? filasMemoriaDesdeConfig(configInicial) : [filaVaciaMemoria()])
  );

  const moverOrdenar = (index: number, direccion: -1 | 1) => {
    const destino = index + direccion;
    if (destino < 0 || destino >= filasOrdenar.length) return;
    const nuevas = [...filasOrdenar];
    [nuevas[index], nuevas[destino]] = [nuevas[destino], nuevas[index]];
    setFilasOrdenar(nuevas);
  };

  // --------------------------------------------------------------
  // Validación + construcción del JSON `configuracion` según tipo
  // --------------------------------------------------------------
  const construirConfiguracion = (): Record<string, unknown> | null => {
    switch (tipoJuego) {
      case 'TRIVIA':
      case 'JENGA_EQUIPO': {
        const esTorre = tipoJuego === 'JENGA_EQUIPO';
        if (filasSeleccionable.some(f => !f.texto.trim())) {
          toast.error(esTorre ? 'Cada bloque necesita una pregunta' : 'Cada pregunta necesita un texto');
          return null;
        }
        if (filasSeleccionable.some(f => f.opciones.some(o => !o.trim()))) {
          toast.error(esTorre ? 'Cada bloque necesita sus 3 opciones completas' : 'Cada pregunta necesita sus 3 opciones completas');
          return null;
        }
        const config: SeleccionableConfiguracion = {
          modoVisual: esTorre ? 'torre' : 'lista',
          preguntas: filasSeleccionable.map(f => ({
            id: f.rowId,
            texto: f.texto.trim(),
            opciones: f.opciones.map(o => o.trim()),
            respuestaCorrecta: f.respuestaCorrecta,
            pictograma: f.pictograma.trim() || undefined,
            color: esTorre && f.color !== 'auto' ? f.color : undefined,
          })),
        };
        return config as unknown as Record<string, unknown>;
      }
      case 'ARRASTRAR_SOLTAR': {
        if (!instruccionDragAndDrop.trim()) {
          toast.error('La instrucción es obligatoria');
          return null;
        }
        if (filasEmparejar.some(f => !f.pictograma.trim() || !f.etiqueta.trim())) {
          toast.error('Cada par necesita un pictograma y una etiqueta');
          return null;
        }
        const config: DragAndDropConfiguracion = {
          modo: 'emparejar',
          instruccion: instruccionDragAndDrop.trim(),
          pares: filasEmparejar.map(f => ({ id: f.rowId, pictograma: f.pictograma.trim(), etiqueta: f.etiqueta.trim() })),
        };
        return config as unknown as Record<string, unknown>;
      }
      case 'SECUENCIA': {
        if (!instruccionDragAndDrop.trim()) {
          toast.error('La instrucción es obligatoria');
          return null;
        }
        if (filasOrdenar.some(f => !f.texto.trim())) {
          toast.error('Cada paso necesita un texto');
          return null;
        }
        const config: DragAndDropConfiguracion = {
          modo: 'ordenar',
          instruccion: instruccionDragAndDrop.trim(),
          pasos: filasOrdenar.map(f => ({ id: f.rowId, texto: f.texto.trim(), pictograma: f.pictograma.trim() || undefined })),
        };
        return config as unknown as Record<string, unknown>;
      }
      case 'MORSE': {
        if (filasParser.some(f => !f.codigo.trim() || !f.respuestaCorrecta.trim())) {
          toast.error('Cada código necesita el código Morse y la respuesta correcta');
          return null;
        }
        if (filasParser.some(f => f.opciones.some(o => !o.trim()))) {
          toast.error('Cada código necesita sus 3 opciones completas');
          return null;
        }
        if (filasParser.some(f => !f.opciones.map(o => o.trim()).includes(f.respuestaCorrecta.trim()))) {
          toast.error('La respuesta correcta debe ser una de las 3 opciones');
          return null;
        }
        const config: ParserConfiguracion = {
          codificacion: 'morse',
          retos: filasParser.map(f => ({
            id: f.rowId,
            codigo: f.codigo.trim(),
            respuestaCorrecta: f.respuestaCorrecta.trim(),
            opciones: f.opciones.map(o => o.trim()),
            pista: f.pista.trim() || undefined,
          })),
        };
        return config as unknown as Record<string, unknown>;
      }
      case 'MEMORIA': {
        if (filasMemoria.some(f => !f.pictograma.trim())) {
          toast.error('Cada par necesita un pictograma');
          return null;
        }
        const config: MemoriaConfiguracion = {
          pares: filasMemoria.map(f => ({ id: f.rowId, pictograma: f.pictograma.trim(), etiqueta: f.etiqueta.trim() || undefined })),
        };
        return config as unknown as Record<string, unknown>;
      }
      default:
        return null;
    }
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      toast.error('El título del reto es obligatorio');
      return;
    }
    const puntos = parseInt(puntosBase, 10);
    if (!puntos || puntos <= 0) {
      toast.error('Los puntos base deben ser un número mayor a 0');
      return;
    }

    const configuracion = construirConfiguracion();
    if (!configuracion) return;

    setGuardando(true);
    try {
      const resultado = await AprenderHacienoService.guardarReto({
        id: retoEditar?.id,
        modulo_id: moduloId,
        tipo_juego: tipoJuego,
        titulo: titulo.trim(),
        configuracion,
        puntos_base: puntos,
        tiempo_limite_segundos: tiempoLimite.trim() ? parseInt(tiempoLimite, 10) : undefined,
      });

      if (!resultado.success) {
        toast.error(resultado.message);
        return;
      }
      toast.success(resultado.message);
      onGuardado();
    } catch (err) {
      console.error('Error al guardar el reto:', err);
      toast.error('No se pudo guardar el reto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar reto' : 'Agregar reto'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reto-titulo" required>Título</Label>
              <Input id="reto-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: ¿Qué nudo es este?" autoFocus />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label required>Tipo de juego</Label>
              <Select value={tipoJuego} onValueChange={v => setTipoJuego(v as AhTipoJuego)} disabled={esEdicion}>
                <SelectTrigger className="min-h-[40px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_JUEGO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reto-puntos" required>Puntos base</Label>
              <Input id="reto-puntos" type="number" min={1} value={puntosBase} onChange={e => setPuntosBase(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reto-tiempo">Tiempo límite (segundos, opcional)</Label>
              <Input id="reto-tiempo" type="number" min={0} value={tiempoLimite} onChange={e => setTiempoLimite(e.target.value)} placeholder="Sin límite" />
            </div>
          </div>

          <div className="border-t pt-4">
            {(tipoJuego === 'TRIVIA' || tipoJuego === 'JENGA_EQUIPO') && (
              <ListaRepetible
                filas={filasSeleccionable}
                onChange={setFilasSeleccionable}
                nuevaFila={filaVaciaSeleccionable}
                etiquetaAgregar={tipoJuego === 'JENGA_EQUIPO' ? 'Agregar bloque' : 'Agregar pregunta'}
                renderFila={(fila, i, actualizar) => (
                  <>
                    <Label>{tipoJuego === 'JENGA_EQUIPO' ? `Bloque ${i + 1}` : `Pregunta ${i + 1}`}</Label>
                    <Input value={fila.texto} onChange={e => actualizar({ texto: e.target.value })} placeholder="Texto de la pregunta" />
                    <Input value={fila.pictograma} onChange={e => actualizar({ pictograma: e.target.value })} placeholder="Pictograma (emoji, opcional)" maxLength={8} />
                    {tipoJuego === 'JENGA_EQUIPO' && (
                      <div className="flex flex-col gap-1.5">
                        <Label>Color del bloque</Label>
                        <Select value={fila.color} onValueChange={v => actualizar({ color: v })}>
                          <SelectTrigger className="min-h-[40px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRESETS_COLOR_JENGA.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 mt-1">
                      {fila.opciones.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`seleccionable-correcta-${fila.rowId}`}
                            checked={fila.respuestaCorrecta === idx}
                            onChange={() => actualizar({ respuestaCorrecta: idx })}
                            className="h-4 w-4 shrink-0"
                            aria-label={`Opción ${idx + 1} es la correcta`}
                          />
                          <Input
                            value={op}
                            onChange={e => {
                              const nuevas = [...fila.opciones];
                              nuevas[idx] = e.target.value;
                              actualizar({ opciones: nuevas });
                            }}
                            placeholder={`Opción ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              />
            )}

            {(tipoJuego === 'ARRASTRAR_SOLTAR' || tipoJuego === 'SECUENCIA') && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label required>Instrucción</Label>
                  <Input
                    value={instruccionDragAndDrop}
                    onChange={e => setInstruccionDragAndDrop(e.target.value)}
                    placeholder={tipoJuego === 'ARRASTRAR_SOLTAR' ? 'Ej: Empareja cada nudo con su nombre' : 'Ej: Ordena los pasos para armar la carpa'}
                  />
                </div>

                {tipoJuego === 'ARRASTRAR_SOLTAR' ? (
                  <ListaRepetible
                    filas={filasEmparejar}
                    onChange={setFilasEmparejar}
                    nuevaFila={filaVaciaEmparejar}
                    etiquetaAgregar="Agregar par"
                    renderFila={(fila, i, actualizar) => (
                      <>
                        <Label>Par {i + 1}</Label>
                        <Input value={fila.pictograma} onChange={e => actualizar({ pictograma: e.target.value })} placeholder="Pictograma (emoji)" maxLength={8} />
                        <Input value={fila.etiqueta} onChange={e => actualizar({ etiqueta: e.target.value })} placeholder="Etiqueta (nombre correcto)" />
                      </>
                    )}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {filasOrdenar.map((fila, i) => (
                      <div key={i} className="relative border rounded-xl p-3 pr-10 bg-gray-50/70 flex flex-col gap-2">
                        <Label>Paso {i + 1} (orden correcto)</Label>
                        <Input
                          value={fila.texto}
                          onChange={e => {
                            const nuevas = [...filasOrdenar];
                            nuevas[i] = { ...nuevas[i], texto: e.target.value };
                            setFilasOrdenar(nuevas);
                          }}
                          placeholder="Texto del paso"
                        />
                        <Input
                          value={fila.pictograma}
                          onChange={e => {
                            const nuevas = [...filasOrdenar];
                            nuevas[i] = { ...nuevas[i], pictograma: e.target.value };
                            setFilasOrdenar(nuevas);
                          }}
                          placeholder="Pictograma (emoji, opcional)"
                          maxLength={8}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => moverOrdenar(i, -1)}
                            disabled={i === 0}
                            aria-label={`Subir paso ${i + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverOrdenar(i, 1)}
                            disabled={i === filasOrdenar.length - 1}
                            aria-label={`Bajar paso ${i + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg border text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        {filasOrdenar.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFilasOrdenar(filasOrdenar.filter((_, idx) => idx !== i))}
                            aria-label={`Quitar paso ${i + 1}`}
                            className="absolute top-2 right-2 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setFilasOrdenar([...filasOrdenar, filaVaciaOrdenar()])} className="min-h-[40px] self-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar paso
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tipoJuego === 'MORSE' && (
              <ListaRepetible
                filas={filasParser}
                onChange={setFilasParser}
                nuevaFila={filaVaciaParser}
                etiquetaAgregar="Agregar código"
                renderFila={(fila, i, actualizar) => (
                  <>
                    <Label>Código {i + 1}</Label>
                    <Input value={fila.codigo} onChange={e => actualizar({ codigo: e.target.value })} placeholder="Ej: ... --- ..." />
                    <Input value={fila.pista} onChange={e => actualizar({ pista: e.target.value })} placeholder="Pista (opcional)" />
                    <div className="flex flex-col gap-2 mt-1">
                      {fila.opciones.map((op, idx) => (
                        <Input
                          key={idx}
                          value={op}
                          onChange={e => {
                            const nuevas = [...fila.opciones];
                            nuevas[idx] = e.target.value;
                            actualizar({ opciones: nuevas });
                          }}
                          placeholder={`Opción ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <Input
                      value={fila.respuestaCorrecta}
                      onChange={e => actualizar({ respuestaCorrecta: e.target.value })}
                      placeholder="Respuesta correcta (debe ser igual a una de las 3 opciones)"
                    />
                  </>
                )}
              />
            )}

            {tipoJuego === 'MEMORIA' && (
              <ListaRepetible
                filas={filasMemoria}
                onChange={setFilasMemoria}
                nuevaFila={filaVaciaMemoria}
                etiquetaAgregar="Agregar par"
                renderFila={(fila, i, actualizar) => (
                  <>
                    <Label>Par {i + 1}</Label>
                    <Input value={fila.pictograma} onChange={e => actualizar({ pictograma: e.target.value })} placeholder="Pictograma (emoji)" maxLength={8} />
                    <Input value={fila.etiqueta} onChange={e => actualizar({ etiqueta: e.target.value })} placeholder="Etiqueta (opcional)" />
                  </>
                )}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando} className="min-h-[44px]">
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={guardando} className="min-h-[44px] bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90">
            {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
