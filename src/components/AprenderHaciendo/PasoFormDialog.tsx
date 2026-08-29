/**
 * PasoFormDialog — crear/editar un `ah_paso` de un módulo de
 * "Aprender Haciendo". Formulario simple con `useState` plano (mismo
 * estilo que `ConceptosFinanzas.tsx`), sin librería de formularios
 * (no se usa en el resto de la app). Se monta sólo mientras está
 * abierto (ver `ModuloDetalle.tsx`), así el estado arranca limpio
 * cada vez que se abre para crear o editar un paso distinto.
 */
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Music, Plus, X } from 'lucide-react';

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import PictogramaInput from './PictogramaInput';
import type { AhPaso } from '@/types/aprenderHaciendo';

interface PasoFormDialogProps {
  moduloId: string;
  /** Paso a editar; null = crear uno nuevo */
  pasoEditar: AhPaso | null;
  /** Número de paso a usar al crear (típicamente `pasos.length + 1`) */
  numeroPasoNuevo: number;
  onClose: () => void;
  onGuardado: () => void;
}

export default function PasoFormDialog({
  moduloId, pasoEditar, numeroPasoNuevo, onClose, onGuardado,
}: PasoFormDialogProps) {
  const esEdicion = !!pasoEditar;

  const [titulo, setTitulo] = useState(pasoEditar?.titulo ?? '');
  const [instruccionTexto, setInstruccionTexto] = useState(pasoEditar?.instruccion_texto ?? '');
  const [pictograma, setPictograma] = useState(pasoEditar?.pictograma_url ?? '');
  const [materiales, setMateriales] = useState<string[]>(pasoEditar?.materiales_requeridos ?? []);
  const [nuevoMaterial, setNuevoMaterial] = useState('');
  const [efectoSonido, setEfectoSonido] = useState(pasoEditar?.efecto_sonido_url ?? '');
  const [subiendoSonido, setSubiendoSonido] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [guardando, setGuardando] = useState(false);

  const handleArchivoSonido = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSubiendoSonido(true);
    try {
      const resultado = await AprenderHacienoService.subirEfectoSonido(file);
      if (!resultado.success || !resultado.url) {
        toast.error(resultado.error || 'No se pudo subir el sonido');
        return;
      }
      setEfectoSonido(resultado.url);
    } finally {
      setSubiendoSonido(false);
    }
  };

  const agregarMaterial = () => {
    const valor = nuevoMaterial.trim();
    if (!valor) return;
    if (materiales.includes(valor)) {
      setNuevoMaterial('');
      return;
    }
    setMateriales(m => [...m, valor]);
    setNuevoMaterial('');
  };

  const quitarMaterial = (valor: string) => {
    setMateriales(m => m.filter(x => x !== valor));
  };

  const handleGuardar = async () => {
    if (!titulo.trim()) {
      toast.error('El título del paso es obligatorio');
      return;
    }
    if (!instruccionTexto.trim()) {
      toast.error('La instrucción del paso es obligatoria');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await AprenderHacienoService.guardarPaso({
        id: pasoEditar?.id,
        modulo_id: moduloId,
        numero_paso: pasoEditar?.numero_paso ?? numeroPasoNuevo,
        titulo: titulo.trim(),
        instruccion_texto: instruccionTexto.trim(),
        pictograma_url: pictograma.trim() || undefined,
        materiales_requeridos: materiales,
        efecto_sonido_url: efectoSonido.trim() || undefined,
      });

      if (!resultado.success) {
        toast.error(resultado.message);
        return;
      }
      toast.success(resultado.message);
      onGuardado();
    } catch (err) {
      console.error('Error al guardar el paso:', err);
      toast.error('No se pudo guardar el paso');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar paso' : 'Agregar paso'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paso-titulo" required>Título</Label>
            <Input
              id="paso-titulo"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Arma la carpa"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paso-instruccion" required>Instrucción</Label>
            <Textarea
              id="paso-instruccion"
              value={instruccionTexto}
              onChange={e => setInstruccionTexto(e.target.value)}
              placeholder="Explica el paso en un lenguaje simple y claro"
              rows={4}
            />
          </div>

          <PictogramaInput value={pictograma} onChange={setPictograma} label="Pictograma" />

          <div className="flex flex-col gap-1.5">
            <Label>Efecto de sonido (opcional)</Label>
            <p className="text-xs text-gray-500">
              Se reproduce al mostrarse este paso — ej. relincho de caballo, cañón, campana.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {efectoSonido && (
                <audio controls src={efectoSonido} className="h-9 max-w-[220px]" />
              )}
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={subiendoSonido}
                className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm shrink-0
                  bg-white text-fuchsia-700 border-2 border-fuchsia-200 hover:bg-fuchsia-50 transition-all disabled:opacity-60
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
              >
                {subiendoSonido ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                {subiendoSonido ? 'Subiendo...' : efectoSonido ? 'Cambiar sonido' : 'Subir sonido'}
              </button>
              {efectoSonido && (
                <button
                  type="button"
                  onClick={() => setEfectoSonido('')}
                  className="min-h-[44px] px-2 text-sm text-gray-500 hover:text-red-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 rounded"
                >
                  ✕ Quitar
                </button>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                onChange={handleArchivoSonido}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Materiales requeridos</Label>
            <div className="flex gap-2">
              <Input
                value={nuevoMaterial}
                onChange={e => setNuevoMaterial(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarMaterial();
                  }
                }}
                placeholder="Ej: Estacas"
              />
              <Button type="button" variant="outline" onClick={agregarMaterial} className="min-h-[40px] shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            {materiales.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {materiales.map(material => (
                  <Badge key={material} variant="outline" className="gap-1 pr-1">
                    {material}
                    <button
                      type="button"
                      onClick={() => quitarMaterial(material)}
                      aria-label={`Quitar material ${material}`}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
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
