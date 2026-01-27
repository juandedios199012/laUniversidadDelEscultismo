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
  Settings,
  CheckCircle,
  AlertCircle,
  User,
  ChevronDown,
  ChevronUp,
  Trash2
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
  TIPOS_ACTIVIDAD_EXTERIOR,
  ESTADOS_ACTIVIDAD_EXTERIOR,
  CATEGORIAS_PRESUPUESTO_ACTIVIDAD,
  TIPOS_COMIDA_ACTIVIDAD,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

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
  
  // Dialog de eliminación
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [eliminando, setEliminando] = useState(false);

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
    return `S/ ${monto.toFixed(2)}`;
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
  const autorizacionesRecibidas = actividad.participantes.filter(p => p.autorizacion_estado === 'RECIBIDA').length;
  // const pagosCompletos = actividad.participantes.filter(p => p.pagado_completo).length;
  const totalRecaudado = actividad.participantes.reduce((sum, p) => sum + p.monto_pagado, 0);
  const totalPresupuesto = actividad.presupuesto.reduce((sum, p) => sum + p.monto_total, 0);
  const totalPagadoPresupuesto = actividad.presupuesto.reduce((sum, p) => sum + p.monto_pagado, 0);

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
          <Button variant="outline" size="sm">
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
                {actividad.objetivos && actividad.objetivos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Objetivos</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {actividad.objetivos.map((obj, i) => (
                        <li key={i} className="text-sm">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {actividad.equipo_necesario && actividad.equipo_necesario.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipo necesario</h4>
                    <div className="flex flex-wrap gap-2">
                      {actividad.equipo_necesario.map((eq, i) => (
                        <Badge key={i} variant="outline">{eq}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Staff</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                {actividad.staff.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay staff asignado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {actividad.staff.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{s.dirigente_nombre}</p>
                            <p className="text-sm text-muted-foreground">{s.rol}</p>
                          </div>
                        </div>
                        {s.confirmado && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
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
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Subir
                </Button>
              </CardHeader>
              <CardContent>
                {actividad.documentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No hay documentos adjuntos
                  </p>
                ) : (
                  <div className="space-y-2">
                    {actividad.documentos.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.nombre}</p>
                          <p className="text-xs text-muted-foreground">{doc.tipo_documento}</p>
                        </div>
                        <Button size="sm" variant="ghost">Ver</Button>
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Día
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
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Programa
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {actividad.programas.map(programa => (
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
                                  programa.tipo === 'DIA' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {programa.dia_numero}
                                </div>
                                <div>
                                  <CardTitle className="text-base">
                                    Día {programa.dia_numero} - {programa.tipo === 'DIA' ? '☀️ Diurno' : '🌙 Nocturno'}
                                  </CardTitle>
                                  <CardDescription>
                                    {programa.fecha}
                                    {programa.tema_del_dia && ` • ${programa.tema_del_dia}`}
                                  </CardDescription>
                                </div>
                              </div>
                              {programasExpandidos.has(programa.id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
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
                                      <h4 className="font-medium">{bloque.actividad}</h4>
                                      {bloque.descripcion && (
                                        <p className="text-sm text-muted-foreground">{bloque.descripcion}</p>
                                      )}
                                      {bloque.tipo_juego && (
                                        <Badge variant="outline" className="mt-1">
                                          🎯 {bloque.tipo_juego}
                                          {bloque.puntaje_posible && ` (${bloque.puntaje_posible} pts)`}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button variant="outline" size="sm" className="mt-4 w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Bloque
                            </Button>
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
              <Button>
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
                  <Button>
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
                        <th className="text-left py-3 px-2 font-medium">Patrulla</th>
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
                          <td className="py-3 px-2 text-muted-foreground">
                            {p.patrulla_nombre || '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {p.confirmado ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant={
                              p.autorizacion_estado === 'RECIBIDA' ? 'default' :
                              p.autorizacion_estado === 'ENVIADA' ? 'secondary' :
                              'outline'
                            }>
                              {p.autorizacion_estado}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div>
                              <p className={`font-medium ${p.pagado_completo ? 'text-green-600' : ''}`}>
                                {formatMonto(p.monto_pagado)}
                              </p>
                              {!p.pagado_completo && (
                                <p className="text-xs text-muted-foreground">
                                  de {formatMonto(actividad.costo_por_participante)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
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
                  {formatMonto(totalPagadoPresupuesto)} pagado de {formatMonto(totalPresupuesto)}
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress value={(totalPagadoPresupuesto / totalPresupuesto) * 100 || 0} />
              </div>
              
              {actividad.presupuesto.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin presupuesto</h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega los gastos planificados para esta actividad
                  </p>
                  <Button>
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
                        <th className="text-center py-3 px-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.presupuesto.map(item => {
                        const cat = CATEGORIAS_PRESUPUESTO_ACTIVIDAD.find(c => c.value === item.categoria);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
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
                            <td className="py-3 px-2 text-center">
                              {item.pagado ? (
                                <Badge className="bg-green-100 text-green-700">Pagado</Badge>
                              ) : (
                                <Badge variant="outline">Pendiente</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={4} className="py-3 px-2 text-right">Total:</td>
                        <td className="py-3 px-2 text-right">{formatMonto(totalPresupuesto)}</td>
                        <td></td>
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
              <Button>
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
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Comida
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar por día */}
                  {Array.from(new Set(actividad.menu.map(m => m.dia_numero))).sort().map(dia => (
                    <div key={dia}>
                      <h4 className="font-semibold mb-2">Día {dia}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {actividad.menu
                          .filter(m => m.dia_numero === dia)
                          .map(item => {
                            const comidaInfo = TIPOS_COMIDA_ACTIVIDAD.find(c => c.value === item.comida);
                            return (
                              <Card key={item.id}>
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span>{comidaInfo?.emoji}</span>
                                    <span className="font-medium">{comidaInfo?.label}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                                  {item.costo_estimado && (
                                    <p className="text-sm font-medium mt-2">
                                      Costo: {formatMonto(item.costo_estimado)}
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
                <Button>
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
                      <div key={p.id} className="flex items-center justify-between p-2 border-b">
                        <div>
                          <p className="font-medium">{p.patrulla_nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.motivo || p.juego_descripcion || 'Sin detalle'}
                          </p>
                        </div>
                        <Badge variant={p.puntaje > 0 ? 'default' : 'destructive'}>
                          {p.puntaje > 0 ? '+' : ''}{p.puntaje}
                        </Badge>
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
    </div>
  );
};

export default ActividadDetalle;
