/**
 * Scout Detail Modal Component
 * Muestra los detalles completos de un scout
 */

import { useState, useEffect } from 'react';
import { X, User, Users, FileText, Phone, Mail, MapPin, Building2, Calendar, ArrowRight, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScoutService, { HistorialRamaItem } from '@/services/scoutService';
import type { Scout, FamiliarScout } from '@/lib/supabase';

interface ScoutDetailModalProps {
  scout: Scout | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (scout: Scout) => void;
}

const ramaBadgeVariant: Record<string, "manada" | "tropa" | "comunidad" | "clan" | "default"> = {
  MANADA: "manada",
  Manada: "manada",
  TROPA: "tropa",
  Tropa: "tropa",
  COMUNIDAD: "comunidad",
  Comunidad: "comunidad",
  Caminantes: "comunidad",
  CLAN: "clan",
  Clan: "clan",
};

export function ScoutDetailModal({ scout, isOpen, onClose, onEdit }: ScoutDetailModalProps) {
  const [familiares, setFamiliares] = useState<FamiliarScout[]>([]);
  const [historialRamas, setHistorialRamas] = useState<HistorialRamaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoutCompleto, setScoutCompleto] = useState<Scout | null>(null);

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRamaBadgeColor = (rama: string) => {
    const ramaLower = rama.toLowerCase();
    if (ramaLower.includes('manada')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (ramaLower.includes('tropa')) return 'bg-green-100 text-green-800 border-green-300';
    if (ramaLower.includes('comunidad') || ramaLower.includes('caminante')) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (ramaLower.includes('clan') || ramaLower.includes('rover')) return 'bg-red-100 text-red-800 border-red-300';
    if (ramaLower.includes('dirigente')) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Cargar datos completos y familiares cuando se abre el modal
  useEffect(() => {
    if (scout && isOpen) {
      cargarDatosCompletos();
    }
  }, [scout, isOpen]);

  const cargarDatosCompletos = async () => {
    if (!scout) return;
    
    try {
      setLoading(true);
      // Cargar scout completo con todos los datos
      const scoutData = await ScoutService.getScoutById(scout.id);
      if (scoutData) {
        setScoutCompleto(scoutData);
        // Si el scout ya tiene familiares, usarlos
        if (scoutData.familiares && Array.isArray(scoutData.familiares)) {
          setFamiliares(scoutData.familiares);
        }
      } else {
        setScoutCompleto(scout);
      }

      // Cargar historial de ramas
      const historial = await ScoutService.getHistorialRamas(scout.id);
      setHistorialRamas(historial);
    } catch (error) {
      console.error('Error al cargar datos del scout:', error);
      setScoutCompleto(scout);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !scout) return null;

  const scoutMostrar = scoutCompleto || scout;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {scoutMostrar.nombres} {scoutMostrar.apellidos}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="datos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="datos">👤 Datos Personales</TabsTrigger>
              <TabsTrigger value="familiares">👨‍👩‍👧 Familiares ({familiares.length})</TabsTrigger>
              <TabsTrigger value="historial">📊 Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="datos" className="space-y-4 mt-4">
              {/* Header del Scout */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {scoutMostrar.nombres?.charAt(0)}{scoutMostrar.apellidos?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {scoutMostrar.nombres} {scoutMostrar.apellidos}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={scoutMostrar.estado === 'ACTIVO' ? 'activo' : 'inactivo'}>
                        {scoutMostrar.estado}
                      </Badge>
                      {scoutMostrar.rama_actual && (
                        <Badge variant={ramaBadgeVariant[scoutMostrar.rama_actual] || 'default'}>
                          {scoutMostrar.rama_actual}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {scoutMostrar.codigo_scout}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Código Scout:</span>
                      <p className="font-medium">{scoutMostrar.codigo_scout}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha de Nacimiento:</span>
                      <p className="font-medium">{formatearFecha(scoutMostrar.fecha_nacimiento)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Edad:</span>
                      <p className="font-medium">{calcularEdad(scoutMostrar.fecha_nacimiento)} años</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sexo:</span>
                      <p className="font-medium">{scoutMostrar.sexo || 'No registrado'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documentación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo de Documento:</span>
                      <p className="font-medium">{scoutMostrar.tipo_documento}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número:</span>
                      <p className="font-medium">{scoutMostrar.numero_documento}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha de Ingreso:</span>
                      <p className="font-medium">{formatearFecha(scoutMostrar.fecha_ingreso)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Celular:</span>
                      <p className="font-medium">{scoutMostrar.celular || 'No registrado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Correo:</span>
                      <p className="font-medium break-all">{scoutMostrar.correo || 'No registrado'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ubicación */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Departamento:</span>
                      <p className="font-medium">{scoutMostrar.departamento || 'No registrado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provincia:</span>
                      <p className="font-medium">{scoutMostrar.provincia || 'No registrado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distrito:</span>
                      <p className="font-medium">{scoutMostrar.distrito || 'No registrado'}</p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-muted-foreground">Dirección:</span>
                      <p className="font-medium">{scoutMostrar.direccion || 'No registrada'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Datos adicionales */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Datos Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Centro de Estudio:</span>
                      <p className="font-medium">{scoutMostrar.centro_estudio || 'No registrado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ocupación:</span>
                      <p className="font-medium">{scoutMostrar.ocupacion || 'No registrada'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">Centro Laboral:</span>
                      <p className="font-medium">{scoutMostrar.centro_laboral || 'No registrado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="familiares" className="mt-4">
              {familiares.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay familiares registrados</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {familiares.map((familiar) => (
                    <Card key={familiar.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">
                              {familiar.nombres} {familiar.apellidos}
                            </h5>
                            <Badge variant="outline" className="mt-1">
                              {familiar.parentesco}
                            </Badge>
                          </div>
                          {familiar.es_contacto_emergencia && (
                            <Badge variant="destructive" className="text-xs">
                              🚨 Emergencia
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          {familiar.celular && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{familiar.celular}</span>
                            </div>
                          )}
                          {familiar.correo && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="break-all">{familiar.correo}</span>
                            </div>
                          )}
                          {familiar.ocupacion && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{familiar.ocupacion}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              {historialRamas.length === 0 ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <History className="h-5 w-5" />
                    <p>No hay cambios de rama registrados para este scout.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Historial de Cambios de Rama
                  </h4>
                  
                  {/* Timeline vertical */}
                  <div className="relative">
                    {/* Línea vertical */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    
                    <div className="space-y-4">
                      {historialRamas.map((cambio, index) => (
                        <div key={cambio.id} className="relative pl-10">
                          {/* Punto en la timeline */}
                          <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                            index === 0 
                              ? 'bg-green-500 border-green-500' 
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                          }`}>
                            {index === 0 && (
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                            )}
                          </div>
                          
                          {/* Card del cambio */}
                          <Card className={index === 0 ? 'border-green-200 bg-green-50/50 dark:bg-green-900/20' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                {cambio.rama_anterior !== 'Ingreso' ? (
                                  <>
                                    <Badge variant="outline" className={getRamaBadgeColor(cambio.rama_anterior)}>
                                      {cambio.rama_anterior}
                                    </Badge>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  </>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Ingreso a</span>
                                )}
                                <Badge variant="outline" className={getRamaBadgeColor(cambio.rama_nueva)}>
                                  {cambio.rama_nueva}
                                </Badge>
                              </div>
                              
                              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{formatearFecha(cambio.fecha_cambio)}</span>
                                </div>
                              </div>
                              
                              {cambio.motivo && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  📝 {cambio.motivo}
                                </p>
                              )}
                              
                              {cambio.autorizado_por && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Autorizado por: {cambio.autorizado_por}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Creado: {formatearFecha(scoutMostrar.created_at)}</span>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(scoutMostrar)}>
                Editar
              </Button>
            )}
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
