/**
 * PatrullasTab - Gestión de patrullas por actividad
 * Permite crear, editar, eliminar patrullas e importar desde el sistema
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Upload,
  Edit,
  Trash2,
  MoreHorizontal,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ActividadesExteriorService,
  PatrullaActividad,
  NuevaPatrullaActividad,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionsContext';

// Colores predefinidos para patrullas
const COLORES_PATRULLA = [
  { nombre: 'Azul', valor: '#3B82F6' },
  { nombre: 'Rojo', valor: '#EF4444' },
  { nombre: 'Verde', valor: '#22C55E' },
  { nombre: 'Amarillo', valor: '#EAB308' },
  { nombre: 'Morado', valor: '#A855F7' },
  { nombre: 'Naranja', valor: '#F97316' },
  { nombre: 'Rosa', valor: '#EC4899' },
  { nombre: 'Celeste', valor: '#06B6D4' },
];

// Iconos predefinidos
const ICONOS_PATRULLA = ['🦅', '🐺', '🦁', '🐻', '🦊', '🦌', '🦎', '🐍', '🦉', '🐝', '🏕️', '⛺', '🔥', '🌲', '⭐', '🌙'];

interface PatrullasTabProps {
  actividadId: string;
  patrullas: PatrullaActividad[];
  onRefresh: () => void;
}

const PatrullasTab: React.FC<PatrullasTabProps> = ({
  actividadId,
  patrullas,
  onRefresh,
}) => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();
  
  // Dialogs
  const [showCrearDialog, setShowCrearDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [patrullaSeleccionada, setPatrullaSeleccionada] = useState<PatrullaActividad | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<NuevaPatrullaActividad>({
    nombre: '',
    color: '#3B82F6',
    icono: '🏕️',
  });
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);

  // Rankings (opcional, para mostrar puntajes)
  const [rankings, setRankings] = useState<PatrullaActividad[]>([]);
  const [cargandoRankings, setCargandoRankings] = useState(false);

  // Cargar rankings
  useEffect(() => {
    if (patrullas.length > 0) {
      cargarRankings();
    }
  }, [patrullas]);

  const cargarRankings = async () => {
    try {
      setCargandoRankings(true);
      const data = await ActividadesExteriorService.rankingPatrullasActividad(actividadId);
      setRankings(data);
    } catch (error) {
      console.error('Error cargando rankings:', error);
    } finally {
      setCargandoRankings(false);
    }
  };

  const handleCrear = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setGuardando(true);
      await ActividadesExteriorService.crearPatrullaActividad(actividadId, formData);
      toast.success('Patrulla creada correctamente');
      setShowCrearDialog(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error creando patrulla:', error);
      toast.error('Error al crear patrulla');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async () => {
    if (!patrullaSeleccionada || !formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setGuardando(true);
      await ActividadesExteriorService.actualizarPatrullaActividad(patrullaSeleccionada.id, formData);
      toast.success('Patrulla actualizada');
      setShowEditarDialog(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error actualizando patrulla:', error);
      toast.error('Error al actualizar patrulla');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!patrullaSeleccionada) return;

    try {
      setGuardando(true);
      await ActividadesExteriorService.eliminarPatrullaActividad(patrullaSeleccionada.id);
      toast.success('Patrulla eliminada');
      setShowEliminarDialog(false);
      setPatrullaSeleccionada(null);
      onRefresh();
    } catch (error) {
      console.error('Error eliminando patrulla:', error);
      toast.error('Error al eliminar patrulla');
    } finally {
      setGuardando(false);
    }
  };

  const handleImportarSistema = async () => {
    try {
      setImportando(true);
      const result = await ActividadesExteriorService.importarPatrullasSistema(actividadId);
      
      if (result.cantidad > 0) {
        toast.success(`Se importaron ${result.cantidad} patrullas del sistema`);
        onRefresh();
      } else {
        toast.info('No se encontraron patrullas nuevas para importar');
      }
    } catch (error) {
      console.error('Error importando patrullas:', error);
      toast.error('Error al importar patrullas');
    } finally {
      setImportando(false);
    }
  };

  const openEditarDialog = (patrulla: PatrullaActividad) => {
    setPatrullaSeleccionada(patrulla);
    setFormData({
      nombre: patrulla.nombre,
      color: patrulla.color,
      icono: patrulla.icono,
    });
    setShowEditarDialog(true);
  };

  const openEliminarDialog = (patrulla: PatrullaActividad) => {
    setPatrullaSeleccionada(patrulla);
    setShowEliminarDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: '#3B82F6',
      icono: '🏕️',
    });
    setPatrullaSeleccionada(null);
  };

  // Buscar puntaje de la patrulla en rankings
  const getPuntaje = (patrullaId: string): number => {
    const ranking = rankings.find(r => r.id === patrullaId);
    return ranking?.puntaje_total || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Patrullas de la Actividad</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las patrullas que participan en esta actividad
          </p>
        </div>

        {puedeCrear('actividades_exterior') && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleImportarSistema}
              disabled={importando}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importando ? 'Importando...' : 'Importar del Sistema'}
            </Button>
            <Button onClick={() => setShowCrearDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Patrulla
            </Button>
          </div>
        )}
      </div>

      {/* Lista de patrullas */}
      {patrullas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin patrullas definidas</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Crea patrullas para organizar a los participantes en equipos. 
              Puedes importar las patrullas existentes del sistema o crear nuevas específicas para esta actividad.
            </p>
            {puedeCrear('actividades_exterior') && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleImportarSistema} disabled={importando}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar del Sistema
                </Button>
                <Button onClick={() => setShowCrearDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Patrulla
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patrullas.map((patrulla, index) => {
            const puntaje = getPuntaje(patrulla.id);
            
            return (
              <Card key={patrulla.id} className="relative overflow-hidden">
                {/* Barra de color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: patrulla.color }}
                />

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${patrulla.color}20` }}
                      >
                        {patrulla.icono}
                      </div>
                      <div>
                        <CardTitle className="text-base">{patrulla.nombre}</CardTitle>
                        {rankings.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Trophy className="h-3 w-3 text-amber-500" />
                            <span className="text-sm font-medium text-amber-600">
                              {puntaje} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(puedeEditar('actividades_exterior') || puedeEliminar('actividades_exterior')) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {puedeEditar('actividades_exterior') && (
                            <DropdownMenuItem onClick={() => openEditarDialog(patrulla)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {puedeEliminar('actividades_exterior') && (
                            <DropdownMenuItem
                              onClick={() => openEliminarDialog(patrulla)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{patrulla.cantidad_participantes || 0} participantes</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: patrulla.color,
                        color: patrulla.color,
                      }}
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ranking global si hay patrullas */}
      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking de Patrullas
            </CardTitle>
            <CardDescription>
              Clasificación por puntaje acumulado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((patrulla, index) => (
                <div
                  key={patrulla.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                    style={{
                      backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E5E7EB',
                      color: index < 3 ? '#000' : '#6B7280',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${patrulla.color}20` }}
                  >
                    {patrulla.icono}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{patrulla.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {patrulla.cantidad_participantes || 0} participantes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: patrulla.color }}>
                      {patrulla.puntaje_total || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">puntos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Crear/Editar Patrulla */}
      <Dialog
        open={showCrearDialog || showEditarDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCrearDialog(false);
            setShowEditarDialog(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showEditarDialog ? 'Editar Patrulla' : 'Nueva Patrulla'}
            </DialogTitle>
            <DialogDescription>
              {showEditarDialog
                ? 'Modifica los datos de la patrulla'
                : 'Crea una nueva patrulla para esta actividad'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Águilas, Lobos, Equipo A..."
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORES_PATRULLA.map((color) => (
                  <button
                    key={color.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.valor })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.valor
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.valor }}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>

            {/* Icono */}
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="flex flex-wrap gap-2">
                {ICONOS_PATRULLA.map((icono) => (
                  <button
                    key={icono}
                    type="button"
                    onClick={() => setFormData({ ...formData, icono })}
                    className={`w-10 h-10 rounded-lg border text-xl flex items-center justify-center transition-all ${
                      formData.icono === icono
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:bg-muted'
                    }`}
                  >
                    {icono}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {formData.icono}
                </div>
                <span className="font-medium" style={{ color: formData.color }}>
                  {formData.nombre || 'Nombre de patrulla'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCrearDialog(false);
                setShowEditarDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={showEditarDialog ? handleEditar : handleCrear}
              disabled={guardando || !formData.nombre.trim()}
            >
              {guardando ? 'Guardando...' : showEditarDialog ? 'Guardar Cambios' : 'Crear Patrulla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Eliminar */}
      <AlertDialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar patrulla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la patrulla "{patrullaSeleccionada?.nombre}".
              Los participantes asignados quedarán sin patrulla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {guardando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatrullasTab;
