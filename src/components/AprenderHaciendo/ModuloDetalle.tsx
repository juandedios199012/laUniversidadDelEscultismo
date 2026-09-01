/**
 * ModuloDetalle — visor paso a paso de un módulo de "Aprender
 * Haciendo": un paso por pantalla (no todos a la vez, para bajar la
 * carga cognitiva), con pictograma grande, botón "🔊 Escuchar" y
 * navegación Anterior/Siguiente siempre en la misma posición. Al
 * terminar los pasos, muestra los retos asociados para jugarlos vía
 * `RetoRunner`.
 *
 * Fase 2: si el usuario logueado resuelve a un scout propio (ver
 * useMiIdentidadScout, basado en el login por DNI), el progreso se
 * asocia automáticamente a él — sin selector, no puede jugar en
 * nombre de otro. El selector de scout (Fase 1) queda visible solo
 * para roles con permiso crear/editar sobre este módulo, para que un
 * dirigente pueda facilitar una sesión grupal o probar el juego.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, ArrowRight, Gamepad2, ListChecks, Loader2, Pencil, Plus, Repeat, ShieldAlert, Star, Users,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useMiIdentidadScout } from '@/hooks/useMiIdentidadScout';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import ScoutService from '@/services/scoutService';
import type { Scout } from '@/lib/supabase';
import type { AhModuloDetalle, AhPaso, AhReto } from '@/types/aprenderHaciendo';
import PictogramCard, { resolverIcono } from './PictogramCard';
import RetoRunner from './RetoRunner';
import PasoFormDialog from './PasoFormDialog';
import RetoFormDialog from './RetoFormDialog';

type Vista = 'pasos' | 'retos' | 'jugando';

interface ModuloDetalleProps {
  moduloId: string;
  onBack: () => void;
  /** Si se pasa, RetoRunner muestra un botón "Ver tabla completa" al terminar un reto */
  onVerRanking?: () => void;
}

export default function ModuloDetalle({ moduloId, onBack, onVerRanking }: ModuloDetalleProps) {
  const { puedeVerDetalle, puedeCrear, puedeEditar } = usePermissions();
  const { esScout, scoutId: miScoutId, nombres: misNombres, apellidos: misApellidos } = useMiIdentidadScout();

  // Mismo par de permisos que ya gatea crear/editar contenido: quien
  // puede autorear el módulo también puede elegir con quién probarlo
  // o facilitar una sesión grupal.
  const puedeElegirCualquiera = puedeCrear('aprender_haciendo') || puedeEditar('aprender_haciendo');
  const puedeJugar = esScout || puedeElegirCualquiera;

  const [detalle, setDetalle] = useState<AhModuloDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [pasoIndex, setPasoIndex] = useState(0);
  const [vista, setVista] = useState<Vista>('pasos');
  const [retoActivo, setRetoActivo] = useState<AhReto | null>(null);

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [scoutId, setScoutId] = useState<string>('');

  // Diálogos de autoría de contenido (Fase 2) — se montan sólo mientras
  // están abiertos para arrancar siempre con estado limpio.
  const [dialogoPaso, setDialogoPaso] = useState<'nuevo' | AhPaso | null>(null);
  const [dialogoReto, setDialogoReto] = useState<'nuevo' | AhReto | null>(null);

  const cargarDetalle = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AprenderHacienoService.obtenerModuloDetalle(moduloId);
      setDetalle(data);
      setPasoIndex(0);
      setVista(data.pasos.length === 0 ? 'retos' : 'pasos');
    } catch (err) {
      console.error('Error al cargar el módulo:', err);
      toast.error('No se pudo cargar el módulo');
    } finally {
      setLoading(false);
    }
  }, [moduloId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  // Recarga liviana usada tras guardar un paso/reto desde los diálogos de
  // autoría — a diferencia de `cargarDetalle`, no resetea la vista actual
  // ni el índice de paso (el dirigente se queda donde estaba trabajando).
  const refrescarDetalle = useCallback(async () => {
    try {
      const data = await AprenderHacienoService.obtenerModuloDetalle(moduloId);
      setDetalle(data);
      setPasoIndex(i => Math.min(i, Math.max(0, data.pasos.length - 1)));
    } catch (err) {
      console.error('Error al recargar el módulo:', err);
      toast.error('No se pudo actualizar la información del módulo');
    }
  }, [moduloId]);

  useEffect(() => {
    // El buscador de scouts es solo para quien puede elegir con quién
    // jugar (staff con permiso crear/editar) — un scout jugando como
    // sí mismo no necesita, ni debe, ver el listado completo.
    if (!puedeElegirCualquiera) return;
    ScoutService.getAllScouts()
      .then(data => setScouts(data.filter(s => s.estado === 'ACTIVO')))
      .catch(err => console.error('Error al cargar scouts:', err));
  }, [puedeElegirCualquiera]);

  // Un scout jugando como sí mismo queda fijado automáticamente,
  // sin selector ni posibilidad de jugar en nombre de otro.
  useEffect(() => {
    if (esScout && miScoutId && !puedeElegirCualquiera) {
      setScoutId(miScoutId);
    }
  }, [esScout, miScoutId, puedeElegirCualquiera]);

  // Efecto de sonido del paso actual ("Cuentos Sensoriales" VAK) — se
  // reproduce automáticamente al mostrarse el paso, complementando la
  // lectura por voz. Guardado en un ref para poder repetirlo con el
  // botón "🔁 Repetir sonido" sin volver a disparar el autoplay.
  const audioEfectoRef = useRef<HTMLAudioElement | null>(null);
  const efectoSonidoActual = vista === 'pasos' ? detalle?.pasos[pasoIndex]?.efecto_sonido_url : null;

  useEffect(() => {
    if (!efectoSonidoActual) return;
    const audio = new Audio(efectoSonidoActual);
    audioEfectoRef.current = audio;
    // Reproducción automática puede quedar bloqueada por el navegador si
    // ocurre fuera de un gesto del usuario — no es un error real, el
    // botón "Repetir sonido" sigue disponible para reproducirlo a mano.
    audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [efectoSonidoActual]);

  const repetirSonido = () => {
    audioEfectoRef.current?.play().catch(() => {});
  };

  if (!puedeVerDetalle('aprender_haciendo')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-gray-500">
        <ShieldAlert className="w-12 h-12 text-gray-300" />
        <p className="font-semibold text-lg">Acceso no disponible</p>
        <p className="text-sm max-w-sm">No tienes permiso para ver el detalle de este módulo.</p>
        <Button variant="outline" onClick={onBack} className="mt-2 min-h-[44px]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  if (loading || !detalle) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    );
  }

  const { modulo, pasos, retos } = detalle;
  const pasoActual = pasos[pasoIndex];
  const Icono = resolverIcono(modulo.icono);

  const guardarProgreso = async (nuevoPaso: number, completado: boolean) => {
    if (!scoutId) return; // selector de scout es opcional en Fase 1
    try {
      await AprenderHacienoService.actualizarProgreso({
        scoutId,
        moduloId,
        pasoActual: nuevoPaso,
        completado,
      });
    } catch (err) {
      console.error('Error al guardar progreso:', err);
    }
  };

  const handleSiguiente = () => {
    const esUltimo = pasoIndex >= pasos.length - 1;
    if (esUltimo) {
      guardarProgreso(pasos.length, true);
      // Refuerzo positivo al terminar de leer/escuchar todos los pasos —
      // antes solo los retos (juegos) tenían festejo; terminar el
      // contenido paso a paso también merece celebrarse, para cualquier
      // scout, no solo quien usa apoyos visuales/auditivos.
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
      });
      setVista('retos');
    } else {
      const siguiente = pasoIndex + 1;
      setPasoIndex(siguiente);
      guardarProgreso(siguiente + 1, false);
    }
  };

  const handleAnterior = () => {
    if (vista === 'retos') {
      setVista('pasos');
      return;
    }
    if (pasoIndex > 0) setPasoIndex(i => i - 1);
  };

  const handleJugar = (reto: AhReto) => {
    setRetoActivo(reto);
    setVista('jugando');
  };

  const handleGuardadoPaso = () => {
    setDialogoPaso(null);
    refrescarDetalle();
  };

  const handleGuardadoReto = () => {
    setDialogoReto(null);
    refrescarDetalle();
  };

  return (
    <div className="container mx-auto p-4 pt-2 max-w-3xl">
      {/* Cabecera — "Volver" siempre arriba a la izquierda */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={onBack} className="min-h-[44px]" aria-label="Volver a Aprender Haciendo">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 truncate">
          <Icono className="h-6 w-6 text-fuchsia-600 shrink-0" />
          <span className="truncate">{modulo.titulo}</span>
        </h1>
        <div className="w-[92px]" aria-hidden="true" />
      </div>

      {/* Selector de scout — solo para quien puede elegir con quién jugar
          (staff con permiso crear/editar sobre este módulo) */}
      {puedeElegirCualquiera && (
        <div className="flex items-center gap-2 mb-6 bg-white/70 border border-gray-100 rounded-xl px-3 py-2">
          <Users className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 shrink-0">¿Quién está jugando?</span>
          <Select value={scoutId} onValueChange={setScoutId}>
            <SelectTrigger className="min-h-[44px] flex-1">
              <SelectValue placeholder="Seleccionar scout (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {scouts.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.nombres} {s.apellidos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Un scout jugando como sí mismo: solo confirma quién es, sin selector */}
      {!puedeElegirCualquiera && esScout && (
        <div className="flex items-center gap-2 mb-6 bg-white/70 border border-gray-100 rounded-xl px-3 py-2">
          <Users className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">
            Jugando como <strong>{misNombres} {misApellidos}</strong>
          </span>
        </div>
      )}

      {vista === 'jugando' && retoActivo && (
        <RetoRunner
          reto={retoActivo}
          scoutId={scoutId || null}
          patrullaId={null}
          onBack={() => {
            setRetoActivo(null);
            setVista('retos');
          }}
          onVerRanking={onVerRanking}
        />
      )}

      {vista === 'pasos' && pasoActual && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Progress value={((pasoIndex + 1) / pasos.length) * 100} className="flex-1" />
            <span className="text-sm font-semibold text-gray-500 shrink-0">
              Paso {pasoIndex + 1} / {pasos.length}
            </span>
          </div>

          <Card
            className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-white to-fuchsia-50/40 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-400"
            onClick={handleSiguiente}
            role="button"
            tabIndex={0}
            aria-label="Toca en cualquier parte para continuar al siguiente paso"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSiguiente();
              }
            }}
          >
            <CardContent className="p-6 sm:p-10 flex flex-col items-center gap-5">
              {puedeEditar('aprender_haciendo') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => { e.stopPropagation(); setDialogoPaso(pasoActual); }}
                  className="self-end min-h-[40px] -mb-2"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar paso
                </Button>
              )}

              <PictogramCard
                label={pasoActual.titulo}
                textoVoz={pasoActual.instruccion_texto}
                imagenUrl={pasoActual.pictograma_url}
                iconoNombre={modulo.icono}
                size="lg"
              />

              {pasoActual.efecto_sonido_url && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); repetirSonido(); }}
                  className="min-h-[44px] px-5 inline-flex items-center gap-2 rounded-full font-semibold text-sm bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 -mt-2"
                >
                  <Repeat className="w-4 h-4" />
                  Repetir sonido
                </button>
              )}

              <p className="text-base sm:text-lg text-gray-700 text-center max-w-xl leading-relaxed">
                {pasoActual.instruccion_texto}
              </p>

              {pasoActual.materiales_requeridos?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                  {pasoActual.materiales_requeridos.map((material, i) => (
                    <Badge key={i} variant="outline">{material}</Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center -mt-2">
                Toca en cualquier parte de la tarjeta para continuar
              </p>
            </CardContent>
          </Card>

          {/* Navegación — misma posición siempre: Anterior a la izquierda, Siguiente a la derecha */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleAnterior}
              disabled={pasoIndex === 0}
              className="min-h-[48px] px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={handleSiguiente}
              className="min-h-[48px] px-6 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
            >
              {pasoIndex >= pasos.length - 1 ? 'Ver retos' : 'Siguiente'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {puedeCrear('aprender_haciendo') && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setDialogoPaso('nuevo')}
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar paso
              </Button>
            </div>
          )}
        </div>
      )}

      {vista === 'pasos' && !pasoActual && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground border rounded-2xl border-dashed">
          <ListChecks className="h-10 w-10 text-gray-300" />
          <p className="font-medium">Este módulo todavía no tiene pasos configurados</p>
          {puedeCrear('aprender_haciendo') && (
            <Button
              onClick={() => setDialogoPaso('nuevo')}
              className="min-h-[44px] mt-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar paso
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setVista('retos')} className="min-h-[44px] mt-2">
            Ver retos
          </Button>
        </div>
      )}

      {vista === 'retos' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-fuchsia-600" />
              Retos de este módulo
            </h2>
            <div className="flex items-center gap-2">
              {(pasos.length > 0 || puedeCrear('aprender_haciendo')) && (
                <Button variant="outline" size="sm" onClick={handleAnterior} className="min-h-[44px]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Repasar pasos
                </Button>
              )}
              {puedeCrear('aprender_haciendo') && (
                <Button
                  size="sm"
                  onClick={() => setDialogoReto('nuevo')}
                  className="min-h-[44px] bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar reto
                </Button>
              )}
            </div>
          </div>

          {retos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground border rounded-2xl border-dashed">
              <Gamepad2 className="h-10 w-10 text-gray-300" />
              <p className="font-medium">Este módulo todavía no tiene retos configurados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {retos.map(reto => (
                <Card key={reto.id} className="border-0 shadow-md rounded-2xl overflow-hidden">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{reto.tipo_juego}</Badge>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {reto.puntos_base} pts
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800">{reto.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {puedeJugar && (
                        <Button
                          onClick={() => handleJugar(reto)}
                          className="min-h-[44px] flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
                        >
                          <Gamepad2 className="h-4 w-4 mr-2" />
                          Jugar
                        </Button>
                      )}
                      {puedeEditar('aprender_haciendo') && (
                        <Button
                          variant="outline"
                          onClick={() => setDialogoReto(reto)}
                          className="min-h-[44px] shrink-0"
                          aria-label={`Editar reto ${reto.titulo}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {!puedeJugar && (
                      <p className="text-xs text-gray-400">No tienes permiso para jugar este reto.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {dialogoPaso && (
        <PasoFormDialog
          moduloId={moduloId}
          pasoEditar={dialogoPaso === 'nuevo' ? null : dialogoPaso}
          numeroPasoNuevo={pasos.length + 1}
          onClose={() => setDialogoPaso(null)}
          onGuardado={handleGuardadoPaso}
        />
      )}

      {dialogoReto && (
        <RetoFormDialog
          moduloId={moduloId}
          retoEditar={dialogoReto === 'nuevo' ? null : dialogoReto}
          onClose={() => setDialogoReto(null)}
          onGuardado={handleGuardadoReto}
        />
      )}
    </div>
  );
}
