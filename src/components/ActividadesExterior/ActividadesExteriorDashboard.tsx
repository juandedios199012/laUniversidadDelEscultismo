/**
 * Actividades al Aire Libre - Dashboard Principal
 * Gestión de campamentos, caminatas, excursiones
 */

import React, { useState, useEffect } from 'react';
import { 
  Tent, 
  Footprints, 
  Calendar,
  Users,
  Banknote,
  ClipboardCheck,
  Plus,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  ChevronRight,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ActividadesExteriorService,
  ActividadExteriorResumen,
  TipoActividadExterior,
  EstadoActividadExterior,
  TIPOS_ACTIVIDAD_EXTERIOR,
  ESTADOS_ACTIVIDAD_EXTERIOR,
} from '@/services/actividadesExteriorService';
import NuevaActividadDialog from './dialogs/NuevaActividadDialog';
import ActividadDetalle from './ActividadDetalle';
import { usePermissions } from '@/contexts/PermissionsContext';

// ============= COMPONENTES AUXILIARES =============

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBg[color]}`}>
            <Icon className={`h-5 w-5 ${colorClasses[color].split(' ')[1]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EstadoVacio: React.FC<{ onNuevaActividad: () => void }> = ({ onNuevaActividad }) => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <Tent className="h-12 w-12 text-green-600" />
    </div>
    <h3 className="text-xl font-semibold mb-2">No hay actividades programadas</h3>
    <p className="text-muted-foreground max-w-md mx-auto mb-6">
      Planifica el próximo campamento, caminata o excursión del grupo scout 
      para mantener organizadas todas las actividades al aire libre.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button onClick={onNuevaActividad} size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Crear Primera Actividad
      </Button>
    </div>
  </div>
);

const ActividadCard: React.FC<{
  actividad: ActividadExteriorResumen;
  onClick: () => void;
}> = ({ actividad, onClick }) => {
  const tipoInfo = TIPOS_ACTIVIDAD_EXTERIOR.find(t => t.value === actividad.tipo);
  const estadoInfo = ESTADOS_ACTIVIDAD_EXTERIOR.find(e => e.value === actividad.estado);
  
  const diasRestantes = (() => {
    const inicio = new Date(actividad.fecha_inicio);
    const hoy = new Date();
    return Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const getEstadoBadgeVariant = (estado: EstadoActividadExterior) => {
    switch (estado) {
      case 'aprobado':
        return 'default';
      case 'en_curso':
        return 'default';
      case 'finalizado':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{tipoInfo?.emoji}</div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {actividad.nombre}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="font-mono text-xs">{actividad.codigo}</span>
                <Badge variant={getEstadoBadgeVariant(actividad.estado)} className="text-xs">
                  {estadoInfo?.label}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{actividad.fecha_inicio}</span>
            {actividad.fecha_fin !== actividad.fecha_inicio && (
              <span>- {actividad.fecha_fin}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{actividad.ubicacion}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {actividad.participantes_count} participantes
              {actividad.max_participantes && ` / ${actividad.max_participantes}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-medium">S/</span>
            <span>
              {actividad.costo_por_participante.toFixed(2)} p/persona
            </span>
          </div>
        </div>

        {/* Indicadores de estado */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          {actividad.tiene_programa ? (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <ClipboardCheck className="h-3 w-3" />
              Programa listo
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <AlertCircle className="h-3 w-3" />
              Sin programa
            </div>
          )}
          
          {diasRestantes > 0 && diasRestantes <= 14 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Clock className="h-3 w-3" />
              En {diasRestantes} días
            </div>
          )}

          {actividad.presupuesto_total > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              Presupuesto: S/ {actividad.presupuesto_total.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============= COMPONENTE PRINCIPAL =============

const ActividadesExteriorDashboard: React.FC = () => {
  // Permisos
  const { puedeCrear } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actividades, setActividades] = useState<ActividadExteriorResumen[]>([]);
  const [, setTotal] = useState(0);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoActividadExterior | 'TODOS'>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<EstadoActividadExterior | 'TODOS'>('TODOS');
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear());
  
  // Dialogs
  const [showNuevaActividad, setShowNuevaActividad] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    cargarActividades();
  }, [filtroTipo, filtroEstado, filtroAnio]);

  const cargarActividades = async () => {
    try {
      setLoading(true);
      setError(null);

      const { actividades: data, total: totalCount } = await ActividadesExteriorService.listarActividades({
        tipo: filtroTipo === 'TODOS' ? undefined : filtroTipo,
        estado: filtroEstado === 'TODOS' ? undefined : filtroEstado,
        anio: filtroAnio,
        limite: 50,
      });

      setActividades(data);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error cargando actividades:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas
  const actividadesProximas = actividades.filter(a => {
    const fecha = new Date(a.fecha_inicio);
    const hoy = new Date();
    return fecha > hoy && a.estado !== 'cancelado';
  });
  
  const actividadesEnCurso = actividades.filter(a => a.estado === 'en_curso');
  const actividadesCompletadas = actividades.filter(a => a.estado === 'finalizado');
  const totalParticipantes = actividades.reduce((sum, a) => sum + a.participantes_count, 0);
  const totalPresupuesto = actividades.reduce((sum, a) => sum + a.presupuesto_total, 0);

  // Si hay una actividad seleccionada, mostrar el detalle
  if (actividadSeleccionada) {
    return (
      <ActividadDetalle 
        actividadId={actividadSeleccionada}
        onBack={() => setActividadSeleccionada(null)}
        onRefresh={cargarActividades}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={cargarActividades}>Reintentar</Button>
      </div>
    );
  }

  // Estado vacío
  if (actividades.length === 0 && filtroTipo === 'TODOS' && filtroEstado === 'TODOS') {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Actividades al Aire Libre</h1>
            <p className="text-muted-foreground">Campamentos, caminatas y excursiones</p>
          </div>
        </div>
        
        <Card>
          <EstadoVacio onNuevaActividad={() => {
            if (!puedeCrear('actividades_exterior')) {
              alert('No tienes permiso para crear actividades');
              return;
            }
            setShowNuevaActividad(true);
          }} />
        </Card>
        
        <NuevaActividadDialog 
          open={showNuevaActividad} 
          onOpenChange={setShowNuevaActividad}
          onSuccess={(id) => {
            cargarActividades();
            setActividadSeleccionada(id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Actividades al Aire Libre</h1>
          <p className="text-muted-foreground">Campamentos, caminatas y excursiones</p>
        </div>
        {puedeCrear('actividades_exterior') && (
          <Button onClick={() => setShowNuevaActividad(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Actividad
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          title="Próximas"
          value={actividadesProximas.length}
          subtitle="Actividades programadas"
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="En Curso"
          value={actividadesEnCurso.length}
          icon={Footprints}
          color="green"
        />
        <MetricCard
          title="Completadas"
          value={actividadesCompletadas.length}
          subtitle={`En ${filtroAnio}`}
          icon={Award}
          color="purple"
        />
        <MetricCard
          title="Participantes"
          value={totalParticipantes}
          subtitle="Total inscritos"
          icon={Users}
          color="yellow"
        />
        <MetricCard
          title="Presupuesto"
          value={`S/ ${totalPresupuesto.toFixed(0)}`}
          subtitle="Total actividades"
          icon={Banknote}
          color="red"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select 
          value={filtroAnio.toString()} 
          onValueChange={(v) => setFiltroAnio(parseInt(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(anio => (
              <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filtroTipo} 
          onValueChange={(v) => setFiltroTipo(v as TipoActividadExterior | 'TODOS')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de actividad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los tipos</SelectItem>
            {TIPOS_ACTIVIDAD_EXTERIOR.map(tipo => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.emoji} {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filtroEstado} 
          onValueChange={(v) => setFiltroEstado(v as EstadoActividadExterior | 'TODOS')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {ESTADOS_ACTIVIDAD_EXTERIOR.map(estado => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de actividades */}
      {actividades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay actividades que coincidan con los filtros seleccionados
            </p>
            <Button 
              variant="link" 
              onClick={() => {
                setFiltroTipo('TODOS');
                setFiltroEstado('TODOS');
              }}
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {actividades.map(actividad => (
            <ActividadCard 
              key={actividad.id}
              actividad={actividad}
              onClick={() => setActividadSeleccionada(actividad.id)}
            />
          ))}
        </div>
      )}

      {/* Dialog Nueva Actividad */}
      <NuevaActividadDialog 
        open={showNuevaActividad} 
        onOpenChange={setShowNuevaActividad}
        onSuccess={(id) => {
          cargarActividades();
          setActividadSeleccionada(id);
        }}
      />
    </div>
  );
};

export default ActividadesExteriorDashboard;
