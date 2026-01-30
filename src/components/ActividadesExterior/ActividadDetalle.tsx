/**
 * Detalle de Actividad al Aire Libre
 * Vista completa con programa, participantes, presupuesto, etc.
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  ClipboardList,
  Award,
  Utensils,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ActividadExteriorCompleta,
  BloqueProgramaActividad,
  ProgramaActividad,
  TIPOS_ACTIVIDAD_EXTERIOR,
  ESTADOS_ACTIVIDAD_EXTERIOR,
  CATEGORIAS_PRESUPUESTO_ACTIVIDAD,
  TIPOS_COMIDA_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

// Diálogos
import NuevoProgramaDialog from './dialogs/NuevoProgramaDialog';
import InscribirParticipantesDialog from './dialogs/InscribirParticipantesDialog';
import NuevoPresupuestoDialog from './dialogs/NuevoPresupuestoDialog';
import NuevoMenuDialog from './dialogs/NuevoMenuDialog';
import RegistrarPuntajeDialog from './dialogs/RegistrarPuntajeDialog';
import AgregarStaffDialog from './dialogs/AgregarStaffDialog';
import SubirDocumentoDialog from './dialogs/SubirDocumentoDialog';
import RegistrarCompraDialog from './dialogs/RegistrarCompraDialog';
import RegistrarPagoDialog from './dialogs/RegistrarPagoDialog';
import GestionarAutorizacionDialog from './dialogs/GestionarAutorizacionDialog';
import NuevaActividadDialog from './dialogs/NuevaActividadDialog';

interface ActividadDetalleProps {
  actividadId: string;
  onBack: () => void;
  onRefresh: () => void;
}

const ActividadDetalle: React.FC<ActividadDetalleProps> = ({
  actividadId,
  onBack,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [actividad, setActividad] = useState<ActividadExteriorCompleta | null>(null);
  const [activeTab, setActiveTab] = useState('resumen');
  const [programasExpandidos, setProgramasExpandidos] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showEditarActividadDialog, setShowEditarActividadDialog] = useState(false);
  const [showProgramaDialog, setShowProgramaDialog] = useState(false);
  const [programaEditar, setProgramaEditar] = useState<ProgramaActividad | null>(null);
  const [showParticipantesDialog, setShowParticipantesDialog] = useState(false);
  const [showPresupuestoDialog, setShowPresupuestoDialog] = useState(false);
  const [presupuestoEditar, setPresupuestoEditar] = useState<any>(null);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [menuEditar, setMenuEditar] = useState<any>(null);
  const [showPuntajeDialog, setShowPuntajeDialog] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showDocumentoDialog, setShowDocumentoDialog] = useState(false);
  const [showCompraDialog, setShowCompraDialog] = useState(false);
  const [compraEditar, setCompraEditar] = useState<any>(null);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [participantePago, setParticipantePago] = useState<any>(null);
  const [showAutorizacionDialog, setShowAutorizacionDialog] = useState(false);
  const [participanteAutorizacion, setParticipanteAutorizacion] = useState<any>(null);

  // Función para abrir el dialog de editar programa
  const handleEditarPrograma = (programa: ProgramaActividad) => {
    setProgramaEditar(programa);
    setShowProgramaDialog(true);
  };

  // Función para abrir el dialog de nuevo programa
  const handleNuevoPrograma = () => {
    setProgramaEditar(null);
    setShowProgramaDialog(true);
  };

  // Handlers para eliminar programa
  const handleEliminarPrograma = async (programaId: string, nombre: string) => {
    if (confirm(`¿Eliminar programa "${nombre}" y todos sus bloques?`)) {
      try {
        await ActividadesExteriorService.eliminarPrograma(programaId);
        toast.success('Programa eliminado');
        cargarActividad();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  // Handlers para presupuesto
  const handleEditarPresupuesto = (item: any) => {
    setPresupuestoEditar(item);
    setShowPresupuestoDialog(true);
  };

  const handleNuevoPresupuesto = () => {
    setPresupuestoEditar(null);
    setShowPresupuestoDialog(true);
  };

  const handleEliminarPresupuesto = async (itemId: string, concepto: string) => {
    if (confirm(`¿Eliminar "${concepto}" del presupuesto?`)) {
      try {
        await ActividadesExteriorService.eliminarPresupuesto(itemId);
        toast.success('Item de presupuesto eliminado');
        cargarActividad();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  // Handlers para menú
  const handleEditarMenu = (item: any) => {
    setMenuEditar(item);
    setShowMenuDialog(true);
  };

  const handleNuevoMenu = () => {
    setMenuEditar(null);
    setShowMenuDialog(true);
  };

  const handleEliminarMenu = async (menuId: string, nombrePlato: string) => {
    if (confirm(`¿Eliminar "${nombrePlato}" del menú?`)) {
      try {
        await ActividadesExteriorService.eliminarMenu(menuId);
        toast.success('Plato eliminado del menú');
        cargarActividad();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  // Handlers para compras
  const handleEditarCompra = (compra: any) => {
    setCompraEditar(compra);
    setShowCompraDialog(true);
  };

  const handleNuevaCompra = () => {
    setCompraEditar(null);
    setShowCompraDialog(true);
  };

  // Handler para pagos
  const handleRegistrarPago = (participante: any) => {
    setParticipantePago(participante);
    setShowPagoDialog(true);
  };

  // Handler para autorización
  const handleGestionarAutorizacion = (participante: any) => {
    setParticipanteAutorizacion(participante);
    setShowAutorizacionDialog(true);
  };

  // Handler para confirmar/desconfirmar participante
  const handleToggleConfirmado = async (participante: any) => {
    try {
      const nuevoEstado = !participante.confirmado;
      await ActividadesExteriorService.confirmarParticipante(participante.id, nuevoEstado);
      toast.success(nuevoEstado ? 'Participante confirmado' : 'Confirmación removida');
      cargarActividad();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar confirmación');
    }
  };

  // Handler para eliminar puntaje
  const handleEliminarPuntaje = async (puntajeId: string) => {
    if (confirm('¿Eliminar este puntaje?')) {
      try {
        await ActividadesExteriorService.eliminarPuntaje(puntajeId);
        toast.success('Puntaje eliminado');
        cargarActividad();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  useEffect(() => {
    cargarActividad();
  }, [actividadId]);

  const cargarActividad = async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.obtenerActividad(actividadId);
      setActividad(data);
      
      // Expandir primer programa por defecto
      if (data.programas.length > 0) {
        setProgramasExpandidos(new Set([data.programas[0].id]));
      }
    } catch (error) {
      console.error('Error cargando actividad:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (monto: number): string => {
    return `S/ ${(monto || 0).toFixed(2)}`;
  };

  const togglePrograma = (id: string) => {
    setProgramasExpandidos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEliminarActividad = async () => {
    try {
      setEliminando(true);
      await ActividadesExteriorService.eliminarActividad(actividadId);
      toast.success('Actividad eliminada exitosamente');
      onRefresh();
      onBack();
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      toast.error('Error al eliminar la actividad');
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Actividad no encontrada</h3>
        <Button onClick={onBack}>Volver al listado</Button>
      </div>
    );
  }

  const tipoInfo = TIPOS_ACTIVIDAD_EXTERIOR.find(t => t.value === actividad.tipo);
  const estadoInfo = ESTADOS_ACTIVIDAD_EXTERIOR.find(e => e.value === actividad.estado);

  // Estadísticas
  const participantesConfirmados = actividad.participantes.filter(p => p.confirmado).length;
  const autorizacionesRecibidas = actividad.participantes.filter(p => 
    p.estado_autorizacion === 'FIRMADA' || p.estado_autorizacion === 'RECIBIDA' || p.estado_autorizacion === 'EXONERADA'
  ).length;
  const totalRecaudado = actividad.participantes.reduce((sum, p) => sum + (p.monto_pagado || 0), 0);
  const totalPresupuesto = actividad.presupuesto.reduce((sum, p) => sum + (p.monto_total || 0), 0);
  const totalEjecutadoPresupuesto = actividad.presupuesto.reduce((sum, p) => sum + (p.monto_ejecutado || 0), 0);

  // Calcular días de actividad
  const diasActividad = (() => {
    if (!actividad.fecha_inicio || !actividad.fecha_fin) return 1;
    const inicio = new Date(actividad.fecha_inicio);
    const fin = new Date(actividad.fecha_fin);
    return Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  })();

  // Obtener todos los bloques de todos los programas
  const todosLosBloques: (BloqueProgramaActividad & { programa_nombre?: string })[] = 
    actividad.programas.flatMap(p => 
      p.bloques.map(b => ({
        ...b,
        programa_nombre: p.nombre,
      }))
    );

  // Ranking de puntajes
  const rankingAgrupado = actividad.puntajes.reduce((acc, p) => {
    if (!acc[p.patrulla_id]) {
      acc[p.patrulla_id] = { nombre: p.patrulla_nombre, total: 0 };
    }
    acc[p.patrulla_id].total += p.puntaje;
    return acc;
  }, {} as Record<string, { nombre: string; total: number }>);

  const rankingSorted = Object.entries(rankingAgrupado)
    .sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header con navegación */}
      <div className="flex items-start gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{tipoInfo?.emoji}</span>
            <h1 className="text-2xl font-bold">{actividad.nombre}</h1>
            <Badge variant="outline" className="ml-2">{actividad.codigo}</Badge>
            <Badge 
              className={`ml-2 ${
                estadoInfo?.color === 'green' ? 'bg-green-100 text-green-700' :
                estadoInfo?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                estadoInfo?.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                estadoInfo?.color === 'red' ? 'bg-red-100 text-red-700' :
                ''
              }`}
            >
              {estadoInfo?.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {actividad.fecha_inicio}
              {actividad.fecha_fin !== actividad.fecha_inicio && ` - ${actividad.fecha_fin}`}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {actividad.ubicacion}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {actividad.participantes.length} participantes
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEditarActividadDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowEliminarDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-muted-foreground">Confirmados</div>
            <div className="text-2xl font-bold text-green-600">
              {participantesConfirmados}/{actividad.participantes.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-muted-foreground">Autorizaciones</div>
            <div className="text-2xl font-bold text-blue-600">
              {autorizacionesRecibidas}/{actividad.participantes.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-muted-foreground">Recaudado</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatMonto(totalRecaudado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-muted-foreground">Presupuesto</div>
            <div className="text-2xl font-bold">
              {formatMonto(totalPresupuesto)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="resumen">📋 Resumen</TabsTrigger>
          <TabsTrigger value="programa">📅 Programa</TabsTrigger>
          <TabsTrigger value="participantes">👥 Participantes</TabsTrigger>
          <TabsTrigger value="presupuesto">💰 Presupuesto</TabsTrigger>
          <TabsTrigger value="compras">🛒 Compras</TabsTrigger>
          <TabsTrigger value="menu">🍽️ Menú</TabsTrigger>
          <TabsTrigger value="puntajes">🏆 Puntajes</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actividad.descripcion && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h4>
                    <p className="text-sm">{actividad.descripcion}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Punto de encuentro</h4>
                    <p className="text-sm">{actividad.punto_encuentro || 'No especificado'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Hora concentración</h4>
                    <p className="text-sm">{actividad.hora_concentracion || 'No especificada'}</p>
                  </div>
                </div>
                {actividad.equipamiento_obligatorio && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipamiento Obligatorio</h4>
                    <p className="text-sm">{actividad.equipamiento_obligatorio}</p>
                  </div>
                )}
                {actividad.equipamiento_opcional && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipamiento Opcional</h4>
                    <p className="text-sm">{actividad.equipamiento_opcional}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Staff</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowStaffDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                {actividad.staff.length === 0 ? (
                  <div className="text-center py-6">
                    <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-3">No hay staff asignado</p>
                    <Button size="sm" variant="outline" onClick={() => setShowStaffDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Staff
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actividad.staff.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{s.nombre}</p>
                            <p className="text-sm text-muted-foreground">{s.rol}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.confirmado && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm(`¿Eliminar a ${s.nombre} del staff?`)) {
                                try {
                                  await ActividadesExteriorService.eliminarStaff(s.id);
                                  toast.success('Staff eliminado');
                                  cargarActividad();
                                } catch (error: any) {
                                  toast.error(error.message || 'Error al eliminar');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Documentos</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowDocumentoDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Subir
                </Button>
              </CardHeader>
              <CardContent>
                {actividad.documentos.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-3">No hay documentos adjuntos</p>
                    <Button size="sm" variant="outline" onClick={() => setShowDocumentoDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Subir Documento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actividad.documentos.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded group">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.nombre}</p>
                          <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.url_archivo && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.open(doc.url_archivo, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async () => {
                              if (confirm(`¿Eliminar documento "${doc.nombre}"?`)) {
                                try {
                                  await ActividadesExteriorService.eliminarDocumentoRPC(doc.id);
                                  toast.success('Documento eliminado');
                                  cargarActividad();
                                } catch (error: any) {
                                  toast.error(error.message || 'Error al eliminar');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking rápido */}
            {rankingSorted.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Ranking de Patrullas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rankingSorted.slice(0, 5).map(([id, data], index) => (
                      <div key={id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{data.nombre}</p>
                        </div>
                        <p className="font-bold">{data.total} pts</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab Programa */}
        <TabsContent value="programa">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Programa de Actividades</CardTitle>
                <CardDescription>Agenda día por día</CardDescription>
              </div>
              <Button onClick={handleNuevoPrograma}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Programa
              </Button>
            </CardHeader>
            <CardContent>
              {actividad.programas.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin programa aún</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea el programa día a día con las actividades planificadas
                  </p>
                  <Button onClick={handleNuevoPrograma}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Programa
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {actividad.programas.map((programa, pIndex) => (
                    <Collapsible 
                      key={programa.id}
                      open={programasExpandidos.has(programa.id)}
                      onOpenChange={() => togglePrograma(programa.id)}
                    >
                      <Card>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                  programa.tipo === 'DIURNO' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {programa.tipo === 'DIURNO' ? '☀️' : '🌙'}
                                </div>
                                <div>
                                  <CardTitle className="text-base">
                                    {programa.nombre || `Programa ${pIndex + 1}`}
                                  </CardTitle>
                                  <CardDescription>
                                    {programa.fecha}
                                    {programa.hora_inicio && ` • ${programa.hora_inicio}`}
                                    {programa.hora_fin && ` - ${programa.hora_fin}`}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Botón Editar Programa */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarPrograma(programa);
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Editar programa y bloques"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {/* Botón Eliminar Programa */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarPrograma(programa.id, programa.nombre);
                                  }}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Eliminar programa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Badge variant="outline">
                                  {programa.bloques.length} bloques
                                </Badge>
                                {programasExpandidos.has(programa.id) ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent>
                            {programa.bloques.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">
                                No hay bloques de actividades
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {programa.bloques.map((bloque, index) => (
                                  <div 
                                    key={bloque.id || index} 
                                    className="flex gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                                      {bloque.hora_inicio} - {bloque.hora_fin}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{bloque.nombre}</h4>
                                      {bloque.descripcion && (
                                        <p className="text-sm text-muted-foreground">{bloque.descripcion}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        {bloque.tipo_bloque && (
                                          <Badge variant="outline" className="text-xs">
                                            {bloque.tipo_bloque}
                                          </Badge>
                                        )}
                                        {bloque.otorga_puntaje && (
                                          <Badge variant="secondary" className="text-xs">
                                            🏆 {bloque.puntaje_maximo} pts máx
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Participantes */}
        <TabsContent value="participantes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Participantes</CardTitle>
                <CardDescription>
                  {actividad.participantes.length} inscritos • {participantesConfirmados} confirmados
                </CardDescription>
              </div>
              <Button onClick={() => setShowParticipantesDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Inscribir Scouts
              </Button>
            </CardHeader>
            <CardContent>
              {actividad.participantes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin participantes</h3>
                  <p className="text-muted-foreground mb-4">
                    Inscribe a los scouts que participarán en esta actividad
                  </p>
                  <Button onClick={() => setShowParticipantesDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Inscribir Scouts
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Scout</th>
                        <th className="text-center py-3 px-2 font-medium">Confirmado</th>
                        <th className="text-center py-3 px-2 font-medium">Autorización</th>
                        <th className="text-right py-3 px-2 font-medium">Pago</th>
                        <th className="py-3 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.participantes.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{p.scout_nombre}</p>
                              <p className="text-xs text-muted-foreground">{p.scout_codigo}</p>
                            </div>
                          </td>
                          <td 
                            className="py-3 px-2 text-center cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => handleToggleConfirmado(p)}
                            title={p.confirmado ? 'Clic para desconfirmar' : 'Clic para confirmar'}
                          >
                            {p.confirmado ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full mx-auto hover:border-green-400" />
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge 
                              variant={
                                p.estado_autorizacion === 'FIRMADA' ? 'default' :
                                p.estado_autorizacion === 'RECIBIDA' ? 'secondary' :
                                p.estado_autorizacion === 'ENVIADA' ? 'secondary' :
                                p.estado_autorizacion === 'RECHAZADA' ? 'destructive' :
                                'outline'
                              }
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleGestionarAutorizacion(p)}
                            >
                              {p.estado_autorizacion === 'FIRMADA' ? '✅' : 
                               p.estado_autorizacion === 'RECIBIDA' ? '📥' :
                               p.estado_autorizacion === 'ENVIADA' ? '📤' :
                               p.estado_autorizacion === 'RECHAZADA' ? '❌' :
                               p.estado_autorizacion === 'EXONERADA' ? '🛡️' : '⏳'}{' '}
                              {p.estado_autorizacion || 'PENDIENTE'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div>
                              <p className={`font-medium ${p.pagado_completo ? 'text-green-600' : ''}`}>
                                {formatMonto(p.monto_pagado || 0)}
                              </p>
                              {!p.pagado_completo && actividad.costo_por_participante > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  de {formatMonto(actividad.costo_por_participante)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant={p.pagado_completo ? "outline" : "default"}
                                className={p.pagado_completo ? "" : "bg-green-600 hover:bg-green-700"}
                                onClick={() => handleRegistrarPago(p)}
                              >
                                <span className="font-bold mr-1">S/</span>
                                {p.pagado_completo ? 'Ver' : 'Pagar'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Presupuesto */}
        <TabsContent value="presupuesto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Presupuesto</CardTitle>
                <CardDescription>
                  {formatMonto(totalEjecutadoPresupuesto)} ejecutado de {formatMonto(totalPresupuesto)}
                </CardDescription>
              </div>
              <Button onClick={handleNuevoPresupuesto}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress value={(totalEjecutadoPresupuesto / totalPresupuesto) * 100 || 0} />
              </div>
              
              {actividad.presupuesto.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin presupuesto</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega los gastos planificados para esta actividad
                  </p>
                  <Button onClick={handleNuevoPresupuesto}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Concepto</th>
                        <th className="text-left py-3 px-2 font-medium">Categoría</th>
                        <th className="text-center py-3 px-2 font-medium">Cantidad</th>
                        <th className="text-right py-3 px-2 font-medium">P. Unit</th>
                        <th className="text-right py-3 px-2 font-medium">Total</th>
                        <th className="text-right py-3 px-2 font-medium">Ejecutado</th>
                        <th className="py-3 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.presupuesto.map(item => {
                        const cat = CATEGORIAS_PRESUPUESTO_ACTIVIDAD.find(c => c.value === item.categoria);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50 group">
                            <td className="py-3 px-2">
                              <p className="font-medium">{item.concepto}</p>
                              {item.proveedor && (
                                <p className="text-xs text-muted-foreground">{item.proveedor}</p>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline">
                                {cat?.emoji} {cat?.label || item.categoria}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-center">{item.cantidad}</td>
                            <td className="py-3 px-2 text-right">{formatMonto(item.precio_unitario)}</td>
                            <td className="py-3 px-2 text-right font-medium">{formatMonto(item.monto_total)}</td>
                            <td className="py-3 px-2 text-right">
                              {(item.monto_ejecutado || 0) > 0 ? (
                                <span className="text-green-600">{formatMonto(item.monto_ejecutado || 0)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleEditarPresupuesto(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleEliminarPresupuesto(item.id, item.concepto)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={4} className="py-3 px-2 text-right">Total:</td>
                        <td className="py-3 px-2 text-right">{formatMonto(totalPresupuesto)}</td>
                        <td className="py-3 px-2 text-right text-green-600">{formatMonto(totalEjecutadoPresupuesto)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Compras */}
        <TabsContent value="compras">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Compras Realizadas
                </CardTitle>
                <CardDescription>
                  Registro de gastos ejecutados de la actividad
                </CardDescription>
              </div>
              <Button onClick={handleNuevaCompra}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Compra
              </Button>
            </CardHeader>
            <CardContent>
              {/* KPIs de compras */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Compras</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMonto(actividad.compras?.reduce((sum, c) => sum + c.monto_total, 0) || 0)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-2xl font-bold">
                    {formatMonto(totalPresupuesto)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Disponible</p>
                  <p className={`text-2xl font-bold ${
                    (totalPresupuesto - (actividad.compras?.reduce((sum, c) => sum + c.monto_total, 0) || 0)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatMonto(totalPresupuesto - (actividad.compras?.reduce((sum, c) => sum + c.monto_total, 0) || 0))}
                  </p>
                </div>
              </div>

              {/* Lista de compras */}
              {!actividad.compras || actividad.compras.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No hay compras registradas</h3>
                  <p className="text-muted-foreground mb-4">
                    Registra las compras realizadas para llevar control del presupuesto ejecutado
                  </p>
                  <Button onClick={handleNuevaCompra}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primera Compra
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Fecha</th>
                        <th className="text-left py-3 px-2">Concepto</th>
                        <th className="text-left py-3 px-2">Proveedor</th>
                        <th className="text-right py-3 px-2">Monto</th>
                        <th className="text-center py-3 px-2">Comprobante</th>
                        <th className="text-center py-3 px-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.compras.map((compra) => (
                        <tr key={compra.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2">
                            {new Date(compra.fecha_compra).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-medium">{compra.concepto}</p>
                            {compra.descripcion && (
                              <p className="text-xs text-muted-foreground">{compra.descripcion}</p>
                            )}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {compra.proveedor || '-'}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            {formatMonto(compra.monto_total)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {compra.comprobante_url ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(compra.comprobante_url, '_blank')}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {compra.tipo_comprobante}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEditarCompra(compra)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (confirm(`¿Eliminar compra "${compra.concepto}"?`)) {
                                    try {
                                      await ActividadesExteriorService.eliminarCompra(compra.id);
                                      toast.success('Compra eliminada');
                                      cargarActividad();
                                    } catch (error: any) {
                                      toast.error(error.message || 'Error al eliminar');
                                    }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={3} className="py-3 px-2 text-right">Total Gastado:</td>
                        <td className="py-3 px-2 text-right text-primary">
                          {formatMonto(actividad.compras.reduce((sum, c) => sum + c.monto_total, 0))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Menú */}
        <TabsContent value="menu">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Menú
                </CardTitle>
                <CardDescription>Planificación de comidas</CardDescription>
              </div>
              <Button onClick={handleNuevoMenu}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Comida
              </Button>
            </CardHeader>
            <CardContent>
              {actividad.menu.length === 0 ? (
                <div className="text-center py-12">
                  <Utensils className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin menú planificado</h3>
                  <p className="text-muted-foreground mb-4">
                    Planifica las comidas para cada día de la actividad
                  </p>
                  <Button onClick={handleNuevoMenu}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Comida
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar por día */}
                  {Array.from(new Set(actividad.menu.map(m => m.dia))).sort().map(dia => (
                    <div key={dia}>
                      <h4 className="font-semibold mb-2">Día {dia}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {actividad.menu
                          .filter(m => m.dia === dia)
                          .map(item => {
                            const comidaInfo = TIPOS_COMIDA_ACTIVIDAD.find(c => c.value === item.tipo_comida);
                            return (
                              <Card key={item.id} className="group relative">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span>{comidaInfo?.emoji}</span>
                                      <span className="font-medium">{comidaInfo?.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => handleEditarMenu(item)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleEliminarMenu(item.id, item.nombre_plato)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="font-medium text-sm">{item.nombre_plato}</p>
                                  {item.descripcion && (
                                    <p className="text-xs text-muted-foreground mt-1">{item.descripcion}</p>
                                  )}
                                  {item.responsable_cocina && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      👨‍🍳 {item.responsable_cocina}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Puntajes */}
        <TabsContent value="puntajes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Ranking de Patrullas
                  </CardTitle>
                </div>
                <Button onClick={() => setShowPuntajeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Puntaje
                </Button>
              </CardHeader>
              <CardContent>
                {rankingSorted.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay puntajes registrados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {rankingSorted.map(([id, data], index) => (
                      <div key={id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{data.nombre}</p>
                        </div>
                        <p className="text-2xl font-bold">{data.total}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Puntajes</CardTitle>
              </CardHeader>
              <CardContent>
                {actividad.puntajes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay puntajes registrados
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {actividad.puntajes.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 border-b group">
                        <div>
                          <p className="font-medium">{p.patrulla_nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.observaciones || p.bloque_nombre || 'Sin detalle'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={p.puntaje > 0 ? 'default' : 'destructive'}>
                            {p.puntaje > 0 ? '+' : ''}{p.puntaje}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEliminarPuntaje(p.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación para eliminar actividad */}
      <AlertDialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Eliminar Actividad
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la actividad{' '}
              <strong>"{actividad?.nombre}"</strong>?
              <br /><br />
              Esta acción eliminará permanentemente:
              <ul className="list-disc list-inside mt-2 text-left">
                <li>Todos los programas y bloques</li>
                <li>Lista de participantes ({actividad?.participantes.length || 0})</li>
                <li>Presupuesto ({actividad?.presupuesto.length || 0} items)</li>
                <li>Menú planificado</li>
                <li>Puntajes registrados</li>
              </ul>
              <br />
              <strong>Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEliminarActividad}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar Actividad'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs CRUD */}
      <NuevoProgramaDialog
        open={showProgramaDialog}
        onOpenChange={(open) => {
          setShowProgramaDialog(open);
          if (!open) setProgramaEditar(null);
        }}
        actividadId={actividadId}
        fechaInicio={actividad.fecha_inicio}
        fechaFin={actividad.fecha_fin}
        onSuccess={cargarActividad}
        programaEditar={programaEditar}
      />

      <InscribirParticipantesDialog
        open={showParticipantesDialog}
        onOpenChange={setShowParticipantesDialog}
        actividadId={actividadId}
        participantesActuales={actividad.participantes.map(p => p.scout_id)}
        onSuccess={cargarActividad}
      />

      <NuevoPresupuestoDialog
        open={showPresupuestoDialog}
        onOpenChange={setShowPresupuestoDialog}
        actividadId={actividadId}
        onSuccess={cargarActividad}
      />

      <NuevoMenuDialog
        open={showMenuDialog}
        onOpenChange={setShowMenuDialog}
        actividadId={actividadId}
        diasActividad={diasActividad}
        onSuccess={cargarActividad}
      />

      <RegistrarPuntajeDialog
        open={showPuntajeDialog}
        onOpenChange={setShowPuntajeDialog}
        actividadId={actividadId}
        bloques={todosLosBloques}
        onSuccess={cargarActividad}
      />

      <AgregarStaffDialog
        open={showStaffDialog}
        onOpenChange={setShowStaffDialog}
        actividadId={actividadId}
        onSuccess={cargarActividad}
      />

      <SubirDocumentoDialog
        open={showDocumentoDialog}
        onOpenChange={setShowDocumentoDialog}
        actividadId={actividadId}
        onSuccess={cargarActividad}
      />

      <RegistrarCompraDialog
        open={showCompraDialog}
        onOpenChange={(open) => {
          setShowCompraDialog(open);
          if (!open) setCompraEditar(null);
        }}
        actividadId={actividadId}
        presupuesto={actividad.presupuesto}
        onSuccess={cargarActividad}
      />

      <RegistrarPagoDialog
        open={showPagoDialog}
        onOpenChange={setShowPagoDialog}
        participante={participantePago}
        onSuccess={cargarActividad}
      />

      <GestionarAutorizacionDialog
        open={showAutorizacionDialog}
        onOpenChange={setShowAutorizacionDialog}
        participante={participanteAutorizacion}
        actividadId={actividadId}
        onSuccess={cargarActividad}
      />

      {/* Diálogo de editar actividad */}
      {actividad && (
        <NuevaActividadDialog
          open={showEditarActividadDialog}
          onOpenChange={setShowEditarActividadDialog}
          onSuccess={() => {
            cargarActividad();
            toast.success('Actividad actualizada correctamente');
          }}
          actividadEditar={{
            id: actividad.id,
            nombre: actividad.nombre,
            tipo: actividad.tipo,
            estado: actividad.estado,
            descripcion: actividad.descripcion,
            fecha_inicio: actividad.fecha_inicio,
            fecha_fin: actividad.fecha_fin,
            hora_concentracion: actividad.hora_concentracion,
            punto_encuentro: actividad.punto_encuentro,
            ubicacion: actividad.ubicacion,
            lugar_detalle: actividad.lugar_detalle,
            max_participantes: actividad.max_participantes,
            costo_por_participante: actividad.costo_por_participante,
            equipamiento_obligatorio: actividad.equipamiento_obligatorio,
            equipamiento_opcional: actividad.equipamiento_opcional,
            recomendaciones: actividad.recomendaciones,
          }}
        />
      )}
    </div>
  );
};

export default ActividadDetalle;
