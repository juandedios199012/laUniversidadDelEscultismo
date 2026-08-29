/**
 * RankingPatrullas — leaderboard de "Aprender Haciendo", con dos
 * pestañas: puntaje acumulado por patrulla (`api_ah_ranking_patrullas`)
 * y puntaje individual por scout (`api_ah_ranking_scouts`). Podio para
 * el top 3 + lista para el resto en ambas, filtrable por rama.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Medal, Star, Trophy, User } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import type { AhRankingPatrulla, AhRankingScout } from '@/types/aprenderHaciendo';

const RAMAS = [
  { value: 'MANADA', label: 'Manada' },
  { value: 'TROPA', label: 'Tropa' },
  { value: 'COMUNIDAD', label: 'Comunidad' },
  { value: 'CLAN', label: 'Clan' },
];

const PODIO_ESTILO = [
  { orden: 2, alto: 'h-28', medalla: 'text-gray-400', bg: 'from-gray-300 to-gray-400' },
  { orden: 1, alto: 'h-36', medalla: 'text-amber-400', bg: 'from-amber-300 to-amber-500' },
  { orden: 3, alto: 'h-20', medalla: 'text-orange-400', bg: 'from-orange-300 to-orange-400' },
];

type Pestana = 'patrullas' | 'scouts';

interface RankingPatrullasProps {
  onBack?: () => void;
}

export default function RankingPatrullas({ onBack }: RankingPatrullasProps) {
  const [pestana, setPestana] = useState<Pestana>('patrullas');
  const [ranking, setRanking] = useState<AhRankingPatrulla[]>([]);
  const [rankingScouts, setRankingScouts] = useState<AhRankingScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [rama, setRama] = useState<string>('TODAS');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const filtroRama = rama === 'TODAS' ? undefined : rama;
      if (pestana === 'patrullas') {
        const data = await AprenderHacienoService.obtenerRankingPatrullas(filtroRama);
        setRanking(data);
      } else {
        const data = await AprenderHacienoService.obtenerRankingScouts(filtroRama);
        setRankingScouts(data);
      }
    } catch (err) {
      console.error('Error al cargar el ranking:', err);
      toast.error('No se pudo cargar el ranking');
    } finally {
      setLoading(false);
    }
  }, [rama, pestana]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const listaActual = pestana === 'patrullas' ? ranking : rankingScouts;
  const top3 = listaActual.slice(0, 3);
  const resto = listaActual.slice(3);
  // Orden visual del podio: 2do, 1ro, 3ro
  const podio = [top3[1], top3[0], top3[2]];

  return (
    <div className="container mx-auto p-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="min-h-[44px]" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-500" />
            Tabla de Posiciones
          </h1>
        </div>

        <Select value={rama} onValueChange={setRama}>
          <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
            <SelectValue placeholder="Todas las ramas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas las ramas</SelectItem>
            {RAMAS.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pestañas Patrullas / Scouts — misma posición siempre, arriba */}
      <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 mb-6 w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setPestana('patrullas')}
          className={`flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2
            ${pestana === 'patrullas' ? 'bg-white text-fuchsia-700 shadow-md' : 'text-gray-500'}`}
        >
          <Star className="h-4 w-4" />
          Patrullas
        </button>
        <button
          type="button"
          onClick={() => setPestana('scouts')}
          className={`flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2
            ${pestana === 'scouts' ? 'bg-white text-fuchsia-700 shadow-md' : 'text-gray-500'}`}
        >
          <User className="h-4 w-4" />
          Scouts
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
        </div>
      ) : listaActual.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground border rounded-2xl border-dashed">
          <Trophy className="h-10 w-10 text-gray-300" />
          <p className="font-medium">Todavía no hay puntajes registrados</p>
          <p className="text-sm max-w-md">
            {pestana === 'patrullas'
              ? 'El ranking se llena a medida que las patrullas completan retos.'
              : 'El ranking se llena a medida que los scouts completan retos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Podio */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4">
              {podio.map((item, i) => {
                if (!item) return <div key={i} className="w-28" />;
                const estilo = PODIO_ESTILO[i];
                const id = pestana === 'patrullas' ? (item as AhRankingPatrulla).patrulla_id : (item as AhRankingScout).scout_id;
                const nombre = pestana === 'patrullas'
                  ? (item as AhRankingPatrulla).nombre
                  : `${(item as AhRankingScout).nombres} ${(item as AhRankingScout).apellidos}`;
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex flex-col items-center gap-2 w-28"
                  >
                    <Medal className={`w-8 h-8 ${estilo.medalla}`} />
                    <p className="font-bold text-sm text-center truncate w-full">{nombre}</p>
                    <p className="text-xs text-gray-500">{item.total_puntos} pts</p>
                    <div
                      className={`w-full ${estilo.alto} rounded-t-xl bg-gradient-to-b ${estilo.bg} flex items-start justify-center pt-2 shadow-md`}
                    >
                      <span className="text-white font-black text-xl">#{estilo.orden}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Resto de la lista */}
          {resto.length > 0 && (
            <Card className="border-0 shadow-md rounded-2xl">
              <CardContent className="p-0 divide-y">
                {pestana === 'patrullas'
                  ? (resto as AhRankingPatrulla[]).map((patrulla, i) => (
                    <div key={patrulla.patrulla_id} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-8 text-center font-bold text-gray-400">#{i + 4}</span>
                      <div
                        className="w-3 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: patrulla.color_patrulla || '#a855f7' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{patrulla.nombre}</p>
                        {patrulla.animal_totem && (
                          <p className="text-xs text-gray-500">{patrulla.animal_totem}</p>
                        )}
                      </div>
                      <span className="font-bold text-fuchsia-600">{patrulla.total_puntos} pts</span>
                    </div>
                  ))
                  : (resto as AhRankingScout[]).map((scout, i) => (
                    <div key={scout.scout_id} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-8 text-center font-bold text-gray-400">#{i + 4}</span>
                      <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{scout.nombres} {scout.apellidos}</p>
                        <p className="text-xs text-gray-500">
                          {scout.patrulla_nombre || scout.rama} · {scout.retos_completados} reto{scout.retos_completados === 1 ? '' : 's'}
                        </p>
                      </div>
                      <span className="font-bold text-fuchsia-600">{scout.total_puntos} pts</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
