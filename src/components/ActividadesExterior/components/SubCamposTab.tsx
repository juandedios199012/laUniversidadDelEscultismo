/**
 * SubCamposTab - Gestión de Sub Campos a nivel de Actividad
 * Los Sub Campos dividen las patrullas en grupos permanentes durante toda la actividad
 * Útil para campamentos grandes donde compiten entre sub campos
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  Flag,
  Trophy,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  SubCampo,
  NuevoSubCampo,
  PatrullaActividad,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionsContext';

// Colores predefinidos
const COLORES_SUBCAMPO = [
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
const ICONOS_SUBCAMPO = ['🚩', '⛺', '🏕️', '🌲', '🏔️', '🌊', '🔥', '⭐', '🌙', '☀️', '🦅', '🐺'];

interface SubCamposTabProps {
  actividadId: string;
  patrullas: PatrullaActividad[];
  onRefresh: () => void;
}

const SubCamposTab: React.FC<SubCamposTabProps> = ({
  actividadId,
  patrullas,
  onRefresh,
}) => {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();
  
  // Estado
  const [subcampos, setSubcampos] = useState<SubCampo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rankingSubcampos, setRankingSubcampos] = useState<any[]>([]);
  
  // Dialogs
  const [showCrearDialog, setShowCrearDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [subcampoSeleccionado, setSubcampoSeleccionado] = useState<SubCampo | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<NuevoSubCampo>({
    nombre: '',
    color: '#3B82F6',
    icono: '🚩',
    patrullas_ids: [],
  });
  const [guardando, setGuardando] = useState(false);
  const [patrullasSeleccionadas, setPatrullasSeleccionadas] = useState<string[]>([]);

  // Cargar sub campos
  useEffect(() => {
    cargarSubcampos();
  }, [actividadId]);

  const cargarSubcampos = async () => {
    try {
      setCargando(true);
      const data = await ActividadesExteriorService.listarSubcampos(actividadId);
      setSubcampos(data);
      
      // Cargar ranking de sub campos
      const ranking = await ActividadesExteriorService.rankingPorSubcampo(actividadId);
      setRankingSubcampos(ranking);
    } catch (error) {
      console.error('Error al cargar sub campos:', error);
      toast.error('Error al cargar sub campos');
    } finally {
      setCargando(false);
    }
  };

  const handleCrear = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setGuardando(true);
      await ActividadesExteriorService.crearSubcampo(actividadId, {
        ...formData,
        patrullas_ids: patrullasSeleccionadas,
      });
      toast.success('Sub Campo creado');
      setShowCrearDialog(false);
      resetForm();
      cargarSubcampos();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear sub campo');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async () => {
    if (!subcampoSeleccionado || !formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setGuardando(true);
      await ActividadesExteriorService.actualizarSubcampo(subcampoSeleccionado.id, {
        ...formData,
        patrullas_ids: patrullasSeleccionadas,
      });
      toast.success('Sub Campo actualizado');
      setShowEditarDialog(false);
      resetForm();
      cargarSubcampos();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!subcampoSeleccionado) return;

    try {
      setGuardando(true);
      await ActividadesExteriorService.eliminarSubcampo(subcampoSeleccionado.id);
      toast.success('Sub Campo eliminado');
      setShowEliminarDialog(false);
      setSubcampoSeleccionado(null);
      cargarSubcampos();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setGuardando(false);
    }
  };

  const abrirCrearDialog = () => {
    resetForm();
    setShowCrearDialog(true);
  };

  const abrirEditarDialog = (subcampo: SubCampo) => {
    setSubcampoSeleccionado(subcampo);
    setFormData({
      nombre: subcampo.nombre,
      color: subcampo.color || '#3B82F6',
      icono: subcampo.icono || '🚩',
      patrullas_ids: subcampo.patrullas?.map(p => p.id) || [],
    });
    setPatrullasSeleccionadas(subcampo.patrullas?.map(p => p.id) || []);
    setShowEditarDialog(true);
  };

  const abrirEliminarDialog = (subcampo: SubCampo) => {
    setSubcampoSeleccionado(subcampo);
    setShowEliminarDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: '#3B82F6',
      icono: '🚩',
      patrullas_ids: [],
    });
    setPatrullasSeleccionadas([]);
    setSubcampoSeleccionado(null);
  };

  const togglePatrulla = (patrullaId: string) => {
    setPatrullasSeleccionadas(prev => 
      prev.includes(patrullaId)
        ? prev.filter(id => id !== patrullaId)
        : [...prev, patrullaId]
    );
  };

  // Patrullas ya asignadas a otros sub campos
  const patrullasAsignadasAOtros = subcampos
    .filter(sc => sc.id !== subcampoSeleccionado?.id)
    .flatMap(sc => sc.patrullas?.map(p => p.id) || []);

  // Patrullas sin asignar a ningún sub campo
  const patrullasSinAsignar = patrullas.filter(p => 
    !subcampos.some(sc => sc.patrullas?.some(sp => sp.id === p.id))
  );

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Flag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subcampos.length}</p>
                <p className="text-sm text-muted-foreground">Sub Campos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patrullas.length}</p>
                <p className="text-sm text-muted-foreground">Patrullas Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patrullasSinAsignar.length}</p>
                <p className="text-sm text-muted-foreground">Sin Asignar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subcampos.reduce((sum, sc) => sum + (sc.puntaje_total || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Puntos Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sub Campos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Sub Campos
            </CardTitle>
            <CardDescription>
              División permanente de patrullas para toda la actividad
            </CardDescription>
          </div>
          {puedeCrear('actividades_exterior') && patrullas.length > 0 && (
            <Button onClick={abrirCrearDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Sub Campo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {patrullas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin patrullas aún</h3>
              <p className="text-muted-foreground mb-4">
                Primero crea patrullas en la pestaña "Patrullas" para poder dividirlas en sub campos
              </p>
            </div>
          ) : subcampos.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin Sub Campos</h3>
              <p className="text-muted-foreground mb-4">
                Divide las {patrullas.length} patrullas en sub campos para competencias separadas
              </p>
              {puedeCrear('actividades_exterior') && (
                <Button onClick={abrirCrearDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Sub Campo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {subcampos.map((subcampo, index) => {
                const rankingData = rankingSubcampos.find(r => r.subcampo_id === subcampo.id);
                return (
                  <Card 
                    key={subcampo.id} 
                    className="border-l-4"
                    style={{ borderLeftColor: subcampo.color || '#3B82F6' }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Posición en ranking */}
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                            {index + 1}
                          </div>
                          
                          {/* Info del sub campo */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{subcampo.icono}</span>
                              <h4 className="font-semibold text-lg">{subcampo.nombre}</h4>
                              {subcampo.responsable_nombre && (
                                <Badge variant="outline" className="text-xs">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  {subcampo.responsable_nombre}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {subcampo.patrullas?.map(p => (
                                <Badge 
                                  key={p.id} 
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: `${p.color}20`, 
                                    borderColor: p.color,
                                    color: p.color 
                                  }}
                                >
                                  {p.icono} {p.nombre}
                                </Badge>
                              ))}
                              {(!subcampo.patrullas || subcampo.patrullas.length === 0) && (
                                <span className="text-sm text-muted-foreground">
                                  Sin patrullas asignadas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Puntaje */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {subcampo.puntaje_total || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">puntos</p>
                          </div>
                          
                          {/* Acciones */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {puedeEditar('actividades_exterior') && (
                                <DropdownMenuItem onClick={() => abrirEditarDialog(subcampo)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {puedeEliminar('actividades_exterior') && (
                                <DropdownMenuItem 
                                  onClick={() => abrirEliminarDialog(subcampo)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Patrullas sin asignar */}
          {patrullasSinAsignar.length > 0 && subcampos.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                ⚠️ Patrullas sin asignar ({patrullasSinAsignar.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {patrullasSinAsignar.map(p => (
                  <Badge key={p.id} variant="outline">
                    {p.icono} {p.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear Sub Campo */}
      <Dialog open={showCrearDialog} onOpenChange={setShowCrearDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Sub Campo</DialogTitle>
            <DialogDescription>
              Agrupa patrullas en un sub campo para competencias separadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre del Sub Campo *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Sub Campo Norte, Campo Alpha"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORES_SUBCAMPO.map(c => (
                    <button
                      key={c.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.valor })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === c.valor ? 'scale-110 border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.valor }}
                      title={c.nombre}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONOS_SUBCAMPO.map(icono => (
                    <button
                      key={icono}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono })}
                      className={`w-8 h-8 rounded text-lg border transition-all ${
                        formData.icono === icono ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      {icono}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Patrullas Asignadas</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 mt-2">
                {patrullas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay patrullas creadas
                  </p>
                ) : (
                  patrullas.map((patrulla) => {
                    const asignadaAOtro = patrullasAsignadasAOtros.includes(patrulla.id);
                    return (
                      <div 
                        key={patrulla.id}
                        className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 ${
                          asignadaAOtro ? 'opacity-50' : ''
                        }`}
                      >
                        <Checkbox
                          checked={patrullasSeleccionadas.includes(patrulla.id)}
                          onCheckedChange={() => togglePatrulla(patrulla.id)}
                          disabled={asignadaAOtro}
                        />
                        <span>{patrulla.icono}</span>
                        <span className="flex-1">{patrulla.nombre}</span>
                        {asignadaAOtro && (
                          <Badge variant="outline" className="text-xs">
                            Ya asignada
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {patrullasSeleccionadas.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {patrullasSeleccionadas.length} patrulla(s) seleccionada(s)
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrearDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrear} disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear Sub Campo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Sub Campo */}
      <Dialog open={showEditarDialog} onOpenChange={setShowEditarDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Sub Campo</DialogTitle>
            <DialogDescription>
              Modifica los datos y patrullas del sub campo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre del Sub Campo *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORES_SUBCAMPO.map(c => (
                    <button
                      key={c.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.valor })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === c.valor ? 'scale-110 border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.valor }}
                      title={c.nombre}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ICONOS_SUBCAMPO.map(icono => (
                    <button
                      key={icono}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono })}
                      className={`w-8 h-8 rounded text-lg border transition-all ${
                        formData.icono === icono ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      {icono}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Patrullas Asignadas</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 mt-2">
                {patrullas.map((patrulla) => {
                  const asignadaAOtro = patrullasAsignadasAOtros.includes(patrulla.id);
                  return (
                    <div 
                      key={patrulla.id}
                      className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 ${
                        asignadaAOtro ? 'opacity-50' : ''
                      }`}
                    >
                      <Checkbox
                        checked={patrullasSeleccionadas.includes(patrulla.id)}
                        onCheckedChange={() => togglePatrulla(patrulla.id)}
                        disabled={asignadaAOtro}
                      />
                      <span>{patrulla.icono}</span>
                      <span className="flex-1">{patrulla.nombre}</span>
                      {asignadaAOtro && (
                        <Badge variant="outline" className="text-xs">
                          Ya asignada
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Eliminar */}
      <AlertDialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Sub Campo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{subcampoSeleccionado?.nombre}" y las patrullas quedarán sin asignar.
              Los puntajes registrados para este sub campo se mantendrán pero sin asociación.
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

export default SubCamposTab;
