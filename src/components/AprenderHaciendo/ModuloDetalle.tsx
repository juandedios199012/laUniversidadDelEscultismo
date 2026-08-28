/**
 * ModuloDetalle — visor paso a paso de un módulo de "Aprender
 * Haciendo": un paso por pantalla (no todos a la vez, para bajar la
 * carga cognitiva), con pictograma grande, botón "🔊 Escuchar" y
 * navegación Anterior/Siguiente siempre en la misma posición. Al
 * terminar los pasos, muestra los retos asociados para jugarlos vía
 * `RetoRunner`.
 *
 * Como los scouts en este sistema generalmente no tienen cuenta
 * propia, esta pantalla la opera el dirigente que facilita la sesión;
 * incluye un selector de scout mínimo (Fase 1) para poder asociar el
 * progreso y los intentos de juego a un scout concreto.
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Gamepad2, Loader2, ShieldAlert, Star, Users,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/contexts/PermissionsContext';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import ScoutService from '@/services/scoutService';
import type { Scout } from '@/lib/supabase';
import type { AhModuloDetalle, AhReto } from '@/types/aprenderHaciendo';
import PictogramCard, { resolverIcono } from './PictogramCard';
import RetoRunner from './RetoRunner';

type Vista = 'pasos' | 'retos' | 'jugando';

interface ModuloDetalleProps {
  moduloId: string;
  onBack: () => void;
}

export default function ModuloDetalle({ moduloId, onBack }: ModuloDetalleProps) {
  const { puedeVerDetalle, puedeCrear } = usePermissions();

  const [detalle, setDetalle] = useState<AhModuloDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [pasoIndex, setPasoIndex] = useState(0);
  const [vista, setVista] = useState<Vista>('pasos');
  const [retoActivo, setRetoActivo] = useState<AhReto | null>(null);

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [scoutId, setScoutId] = useState<string>('');

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

  useEffect(() => {
    ScoutService.getAllScouts()
      .then(data => setScouts(data.filter(s => s.estado === 'ACTIVO')))
      .catch(err => console.error('Error al cargar scouts:', err));
  }, []);

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

      {/* Selector de scout — mínimo para Fase 1, opcional */}
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

      {vista === 'jugando' && retoActivo && (
        <RetoRunner
          reto={retoActivo}
          scoutId={scoutId || null}
          patrullaId={null}
          onBack={() => {
            setRetoActivo(null);
            setVista('retos');
          }}
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

          <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-white to-fuchsia-50/40">
            <CardContent className="p-6 sm:p-10 flex flex-col items-center gap-5">
              <PictogramCard
                label={pasoActual.titulo}
                textoVoz={pasoActual.instruccion_texto}
                imagenUrl={pasoActual.pictograma_url}
                iconoNombre={modulo.icono}
                size="lg"
              />

              <p className="text-base sm:text-lg text-gray-700 text-center max-w-xl leading-relaxed">
                {pasoActual.instruccion_texto}
              </p>

              {pasoActual.materiales_requeridos?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {pasoActual.materiales_requeridos.map((material, i) => (
                    <Badge key={i} variant="outline">{material}</Badge>
                  ))}
                </div>
              )}
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
        </div>
      )}

      {vista === 'retos' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-fuchsia-600" />
              Retos de este módulo
            </h2>
            {pasos.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAnterior} className="min-h-[44px]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Repasar pasos
              </Button>
            )}
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
                    {puedeCrear('aprender_haciendo') ? (
                      <Button
                        onClick={() => handleJugar(reto)}
                        className="min-h-[44px] mt-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90"
                      >
                        <Gamepad2 className="h-4 w-4 mr-2" />
                        Jugar
                      </Button>
                    ) : (
                      <p className="text-xs text-gray-400">No tienes permiso para jugar este reto.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
