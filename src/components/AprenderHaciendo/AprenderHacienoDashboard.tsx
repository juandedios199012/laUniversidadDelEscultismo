/**
 * AprenderHacienoDashboard — punto de entrada del módulo "Aprender
 * Haciendo" (Fase 1). Grilla de tarjetas con gradiente ("estilo
 * Canva"), una por módulo activo, con filtro de categoría. Al hacer
 * clic en una tarjeta se abre `ModuloDetalle`. Incluye acceso al
 * ranking de patrullas y, si el usuario tiene permiso `crear`, un
 * formulario mínimo para dar de alta un módulo nuevo.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Gamepad2, Loader2, Plus, ShieldAlert, Trophy } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePermissions } from '@/contexts/PermissionsContext';

import AprenderHacienoService from '@/services/aprenderHacienoService';
import type { AhCategoria, AhModulo, AhNivel, FormularioModulo } from '@/types/aprenderHaciendo';
import { resolverIcono } from './PictogramCard';
import ModuloDetalle from './ModuloDetalle';
import RankingPatrullas from './RankingPatrullas';

const CATEGORIAS: { value: AhCategoria; label: string }[] = [
  { value: 'NUDOS', label: 'Nudos' },
  { value: 'COCINA', label: 'Cocina' },
  { value: 'CAMPISMO', label: 'Campismo' },
  { value: 'HISTORIA', label: 'Historia' },
  { value: 'PRIMEROS_AUXILIOS', label: 'Primeros Auxilios' },
  { value: 'MORSE', label: 'Morse' },
  { value: 'SEMAFORO', label: 'Semáforo' },
  { value: 'SENALES_PISTA', label: 'Señales de Pista' },
  { value: 'OTRO', label: 'Otro' },
];

const NIVELES: { value: AhNivel; label: string }[] = [
  { value: 'INICIAL', label: 'Inicial' },
  { value: 'INTERMEDIO', label: 'Intermedio' },
  { value: 'AVANZADO', label: 'Avanzado' },
];

const NIVEL_BADGE: Record<AhNivel, string> = {
  INICIAL: 'bg-green-100 text-green-800 border-transparent',
  INTERMEDIO: 'bg-amber-100 text-amber-800 border-transparent',
  AVANZADO: 'bg-red-100 text-red-800 border-transparent',
};

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const FORM_INICIAL: FormularioModulo = {
  titulo: '',
  slug: '',
  categoria: 'NUDOS',
  nivel_dificultad: 'INICIAL',
  descripcion: '',
};

type Vista = 'grid' | 'detalle' | 'ranking';

export default function AprenderHacienoDashboard() {
  const { puedeAcceder, puedeCrear } = usePermissions();

  const [vista, setVista] = useState<Vista>('grid');
  const [moduloSeleccionadoId, setModuloSeleccionadoId] = useState<string | null>(null);

  const [modulos, setModulos] = useState<AhModulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<AhCategoria | 'TODAS'>('TODAS');

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [form, setForm] = useState<FormularioModulo>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const cargarModulos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AprenderHacienoService.listarModulos({
        categoria: categoriaFiltro === 'TODAS' ? undefined : categoriaFiltro,
      });
      setModulos(data);
    } catch (err) {
      console.error('Error al cargar módulos de Aprender Haciendo:', err);
      toast.error('No se pudieron cargar los módulos');
    } finally {
      setLoading(false);
    }
  }, [categoriaFiltro]);

  useEffect(() => {
    if (vista === 'grid') {
      cargarModulos();
    }
  }, [vista, cargarModulos]);

  const abrirModulo = (id: string) => {
    setModuloSeleccionadoId(id);
    setVista('detalle');
  };

  const handleNuevoModulo = () => {
    setForm(FORM_INICIAL);
    setDialogAbierto(true);
  };

  const handleGuardarModulo = async () => {
    if (!form.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      const slug = form.slug.trim() || slugify(form.titulo);
      const resultado = await AprenderHacienoService.guardarModulo({ ...form, slug });
      if (resultado.success) {
        toast.success(resultado.message);
        setDialogAbierto(false);
        cargarModulos();
      } else {
        toast.error(resultado.message);
      }
    } catch (err) {
      console.error('Error al guardar módulo:', err);
      toast.error('Error inesperado al guardar el módulo');
    } finally {
      setGuardando(false);
    }
  };

  if (!puedeAcceder('aprender_haciendo')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-gray-500">
        <ShieldAlert className="w-12 h-12 text-gray-300" />
        <p className="font-semibold text-lg">Acceso no disponible</p>
        <p className="text-sm max-w-sm">No tienes permiso para acceder al módulo Aprender Haciendo.</p>
      </div>
    );
  }

  if (vista === 'detalle' && moduloSeleccionadoId) {
    return (
      <ModuloDetalle
        moduloId={moduloSeleccionadoId}
        onBack={() => {
          setVista('grid');
          setModuloSeleccionadoId(null);
        }}
      />
    );
  }

  if (vista === 'ranking') {
    return <RankingPatrullas onBack={() => setVista('grid')} />;
  }

  return (
    <div className="container mx-auto p-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gamepad2 className="h-7 w-7 text-fuchsia-600" />
          Aprender Haciendo
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVista('ranking')} className="min-h-[44px]">
            <Trophy className="h-4 w-4 mr-2 text-amber-500" />
            Ranking de Patrullas
          </Button>
          {puedeCrear('aprender_haciendo') && (
            <Button size="sm" onClick={handleNuevoModulo} className="min-h-[44px] bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Módulo
            </Button>
          )}
        </div>
      </div>

      {/* Chips de categoría — carga cognitiva baja, todos visibles a la vez */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setCategoriaFiltro('TODAS')}
          className={`min-h-[44px] px-4 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 ${
            categoriaFiltro === 'TODAS'
              ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todas
        </button>
        {CATEGORIAS.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategoriaFiltro(c.value)}
            className={`min-h-[44px] px-4 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500 ${
              categoriaFiltro === c.value
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
        </div>
      ) : modulos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground border rounded-2xl border-dashed">
          <Gamepad2 className="h-10 w-10 text-gray-300" />
          <p className="font-medium">Todavía no hay módulos en esta categoría</p>
          {puedeCrear('aprender_haciendo') && (
            <p className="text-sm max-w-md">Usa "Nuevo Módulo" para crear el primero.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modulos.map((modulo, i) => {
            const Icono = resolverIcono(modulo.icono);
            return (
              <motion.div
                key={modulo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => abrirModulo(modulo.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      abrirModulo(modulo.id);
                    }
                  }}
                  className="cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 rounded-2xl"
                >
                  <div
                    className="h-28 flex items-center justify-center bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(to bottom right, ${modulo.color_gradiente_inicio}, ${modulo.color_gradiente_fin})`,
                    }}
                  >
                    {modulo.portada_url ? (
                      <img src={modulo.portada_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icono className="w-14 h-14 text-white drop-shadow" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-800 text-base mb-2 leading-snug">{modulo.titulo}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIAS.find(c => c.value === modulo.categoria)?.label || modulo.categoria}
                      </Badge>
                      <Badge className={`text-xs ${NIVEL_BADGE[modulo.nivel_dificultad]}`}>
                        {NIVELES.find(n => n.value === modulo.nivel_dificultad)?.label || modulo.nivel_dificultad}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Alta mínima de módulo — Fase 1: solo campos esenciales */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo módulo</DialogTitle>
            <DialogDescription>
              Crea un nuevo módulo de "Aprender Haciendo". Podrás agregar sus pasos y retos después.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ah-titulo" required>Título</Label>
              <Input
                id="ah-titulo"
                value={form.titulo}
                onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej. Nudo as de guía"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setForm(f => ({ ...f, categoria: v as AhCategoria }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Nivel</Label>
                <Select
                  value={form.nivel_dificultad}
                  onValueChange={(v) => setForm(f => ({ ...f, nivel_dificultad: v as AhNivel }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NIVELES.map(n => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ah-descripcion">Descripción</Label>
              <Textarea
                id="ah-descripcion"
                value={form.descripcion}
                onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Breve descripción del módulo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarModulo} loading={guardando} className="bg-gradient-to-r from-fuchsia-500 to-purple-600">
              Guardar módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
