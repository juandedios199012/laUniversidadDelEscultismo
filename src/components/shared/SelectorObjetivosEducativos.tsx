/**
 * Selector de Área de Crecimiento + Objetivos Educativos.
 *
 * Patrón: se elige primero un Área de Crecimiento, lo que habilita (filtra)
 * la lista de sus Objetivos Educativos para marcar varios con checkbox. El
 * Área es solo un filtro de UI — no se persiste por sí sola; cada objetivo
 * ya tiene su propio area_id, así que basta guardar los objetivo_ids
 * elegidos. Reutilizable en cualquier formulario de actividad/bloque.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ProgresionService, { AreaCrecimiento, Objetivo } from '@/services/progresionService';

interface SelectorObjetivosEducativosProps {
  objetivoIds: string[];
  onChange: (objetivoIds: string[]) => void;
}

const SelectorObjetivosEducativos: React.FC<SelectorObjetivosEducativosProps> = ({
  objetivoIds,
  onChange,
}) => {
  const [areas, setAreas] = useState<AreaCrecimiento[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [areaId, setAreaId] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [areaInicializada, setAreaInicializada] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all([ProgresionService.obtenerAreas(), ProgresionService.obtenerObjetivos()])
      .then(([areasData, objetivosData]) => {
        if (!activo) return;
        setAreas(areasData);
        setObjetivos(objetivosData);
      })
      .catch((err) => console.error('Error cargando áreas/objetivos educativos:', err))
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Al cargar datos, si ya hay objetivos seleccionados (modo edición),
  // preseleccionar el área a la que pertenece el primero.
  useEffect(() => {
    if (areaInicializada || objetivos.length === 0) return;
    if (objetivoIds.length > 0) {
      const primerObjetivo = objetivos.find((o) => o.id === objetivoIds[0]);
      if (primerObjetivo) setAreaId(primerObjetivo.area_id);
    }
    setAreaInicializada(true);
  }, [objetivos, objetivoIds, areaInicializada]);

  const objetivosDelArea = useMemo(
    () => objetivos.filter((o) => o.area_id === areaId),
    [objetivos, areaId],
  );

  const toggleObjetivo = (objetivoId: string, marcado: boolean) => {
    const siguiente = marcado
      ? [...objetivoIds, objetivoId]
      : objetivoIds.filter((id) => id !== objetivoId);
    onChange(siguiente);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs">Área de Crecimiento</Label>
      </div>
      <Select value={areaId} onValueChange={setAreaId} disabled={cargando}>
        <SelectTrigger>
          <SelectValue placeholder={cargando ? 'Cargando áreas...' : 'Selecciona un área'} />
        </SelectTrigger>
        <SelectContent>
          {areas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.icono} {area.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {areaId && (
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs">Objetivos Educativos</Label>
          {objetivosDelArea.length === 0 ? (
            <p className="text-xs text-muted-foreground">Esta área no tiene objetivos registrados.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-md p-2">
              {objetivosDelArea.map((objetivo) => (
                <label
                  key={objetivo.id}
                  className="flex items-start gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={objetivoIds.includes(objetivo.id)}
                    onCheckedChange={(checked) => toggleObjetivo(objetivo.id, !!checked)}
                  />
                  <span>{objetivo.titulo}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectorObjetivosEducativos;
