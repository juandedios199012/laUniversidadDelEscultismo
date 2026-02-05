/**
 * Scout Detail Modal Component
 * Muestra los detalles completos de un scout
 */

import { useState, useEffect } from 'react';
import { X, User, Users, FileText, Phone, Mail, MapPin, Building2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScoutService from '@/services/scoutService';
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
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  🚧 Esta sección estará disponible próximamente con el historial de actividades, logros y cambios de rama.
                </p>
              </div>
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
