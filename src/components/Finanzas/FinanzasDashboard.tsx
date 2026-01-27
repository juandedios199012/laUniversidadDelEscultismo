/**
 * Finanzas Module - Dashboard Principal
 * Gestión integral de ingresos, egresos, préstamos y deudas
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  AlertCircle,
  Plus,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ReceiptText,
  Wallet,
  PiggyBank
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FinanzasService, 
  ResumenFinanciero, 
  Transaccion, 
  Prestamo,
  CATEGORIAS_INGRESO,
  CATEGORIAS_EGRESO,
} from '@/services/finanzasService';
import TransaccionesTab from './tabs/TransaccionesTab';
import PrestamosTab from './tabs/PrestamosTab';
import NuevaTransaccionDialog from './dialogs/NuevaTransaccionDialog';
import NuevoPrestamoDialog from './dialogs/NuevoPrestamoDialog';

// ============= COMPONENTES AUXILIARES =============

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}> = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
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
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-xs ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                 trend === 'down' ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                {trendValue}
              </div>
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

const EstadoVacioFinanzas: React.FC<{ onNuevaTransaccion: () => void }> = ({ onNuevaTransaccion }) => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
      <Wallet className="h-12 w-12 text-blue-500" />
    </div>
    <h3 className="text-xl font-semibold mb-2">No hay transacciones aún</h3>
    <p className="text-muted-foreground max-w-md mx-auto mb-6">
      Comienza a registrar los ingresos y egresos del grupo scout para mantener 
      un control financiero ordenado y transparente.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button onClick={onNuevaTransaccion} size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Registrar Primera Transacción
      </Button>
    </div>
  </div>
);

// ============= COMPONENTE PRINCIPAL =============

const FinanzasDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [totalTransacciones, setTotalTransacciones] = useState(0);
  
  // Dialogs
  const [showNuevaTransaccion, setShowNuevaTransaccion] = useState(false);
  const [showNuevoPrestamo, setShowNuevoPrestamo] = useState(false);
  
  // Tab activo
  const [activeTab, setActiveTab] = useState('resumen');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resumenData, transData, prestamosData] = await Promise.all([
        FinanzasService.obtenerResumen(),
        FinanzasService.listarTransacciones({ limite: 10 }),
        FinanzasService.listarPrestamos(),
      ]);

      setResumen(resumenData);
      setTransacciones(transData.transacciones);
      setTotalTransacciones(transData.total);
      setPrestamos(prestamosData);
    } catch (err) {
      console.error('Error cargando datos financieros:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  };

  const prestamosPendientes = prestamos.filter(p => p.estado === 'PENDIENTE' || p.estado === 'PARCIAL');

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <Button onClick={cargarDatos}>Reintentar</Button>
      </div>
    );
  }

  // Estado vacío
  if (totalTransacciones === 0 && prestamos.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Finanzas</h1>
            <p className="text-muted-foreground">Gestión de ingresos, egresos y préstamos</p>
          </div>
        </div>
        
        <Card>
          <EstadoVacioFinanzas onNuevaTransaccion={() => setShowNuevaTransaccion(true)} />
        </Card>
        
        <NuevaTransaccionDialog 
          open={showNuevaTransaccion} 
          onOpenChange={setShowNuevaTransaccion}
          onSuccess={cargarDatos}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">Gestión de ingresos, egresos y préstamos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNuevoPrestamo(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar Préstamo
          </Button>
          <Button onClick={() => setShowNuevaTransaccion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Ingresos"
          value={formatMonto(resumen?.ingresos || 0)}
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="Este período"
        />
        <MetricCard
          title="Egresos"
          value={formatMonto(resumen?.egresos || 0)}
          icon={TrendingDown}
          color="red"
          trend="down"
          trendValue="Este período"
        />
        <MetricCard
          title="Balance"
          value={formatMonto(resumen?.balance || 0)}
          subtitle={`Saldo disponible: ${formatMonto(resumen?.saldo_disponible || 0)}`}
          icon={DollarSign}
          color={(resumen?.balance || 0) >= 0 ? 'blue' : 'red'}
        />
        <MetricCard
          title="Préstamos Pendientes"
          value={formatMonto(resumen?.prestamos_pendientes || 0)}
          subtitle={`${prestamosPendientes.length} préstamo(s) activo(s)`}
          icon={CreditCard}
          color={prestamosPendientes.length > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Alerta de préstamos próximos a vencer */}
      {prestamosPendientes.some(p => {
        if (!p.fecha_vencimiento) return false;
        const vencimiento = new Date(p.fecha_vencimiento);
        const hoy = new Date();
        const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 7 && diasRestantes > 0;
      }) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Préstamos próximos a vencer</h4>
            <p className="text-sm text-yellow-700">
              Tienes préstamos que vencen en los próximos 7 días. 
              Revisa la pestaña de Préstamos para más detalles.
            </p>
          </div>
        </div>
      )}

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="resumen" className="gap-2">
            <ReceiptText className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="transacciones" className="gap-2">
            <FileText className="h-4 w-4" />
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="prestamos" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Préstamos
            {prestamosPendientes.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {prestamosPendientes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas transacciones */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Últimas Transacciones</CardTitle>
                  <CardDescription>Movimientos recientes</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('transacciones')}
                >
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {transacciones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay transacciones recientes
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transacciones.slice(0, 5).map((trans) => {
                      const esIngreso = trans.tipo === 'INGRESO' || trans.tipo === 'PRESTAMO_RECIBIDO';
                      const categoria = [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO].find(
                        c => c.value === trans.categoria
                      );
                      
                      return (
                        <div key={trans.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              esIngreso ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {esIngreso ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{trans.concepto}</p>
                              <p className="text-xs text-muted-foreground">
                                {categoria?.emoji} {categoria?.label} • {trans.fecha_transaccion}
                              </p>
                            </div>
                          </div>
                          <p className={`font-semibold ${
                            esIngreso ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {esIngreso ? '+' : '-'}{formatMonto(trans.monto)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Préstamos pendientes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Préstamos Pendientes</CardTitle>
                  <CardDescription>Deudas por pagar</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('prestamos')}
                >
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                {prestamosPendientes.length === 0 ? (
                  <div className="text-center py-8">
                    <PiggyBank className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      ¡Sin deudas pendientes! 🎉
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prestamosPendientes.slice(0, 5).map((prestamo) => {
                      const porcentajePagado = (prestamo.monto_devuelto / prestamo.monto_prestado) * 100;
                      
                      return (
                        <div key={prestamo.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{prestamo.prestamista_nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {prestamo.motivo || 'Sin especificar'}
                              </p>
                            </div>
                            <Badge variant={prestamo.estado === 'PENDIENTE' ? 'destructive' : 'secondary'}>
                              {prestamo.estado === 'PENDIENTE' ? 'Pendiente' : 'Parcial'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Pendiente: <span className="font-medium text-foreground">
                                {formatMonto(prestamo.saldo_pendiente)}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {porcentajePagado.toFixed(0)}% pagado
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${porcentajePagado}%` }}
                            />
                          </div>
                          {prestamo.fecha_vencimiento && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Vence: {prestamo.fecha_vencimiento}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transacciones">
          <TransaccionesTab onRefresh={cargarDatos} />
        </TabsContent>

        <TabsContent value="prestamos">
          <PrestamosTab onRefresh={cargarDatos} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NuevaTransaccionDialog 
        open={showNuevaTransaccion} 
        onOpenChange={setShowNuevaTransaccion}
        onSuccess={cargarDatos}
      />
      
      <NuevoPrestamoDialog
        open={showNuevoPrestamo}
        onOpenChange={setShowNuevoPrestamo}
        onSuccess={cargarDatos}
      />
    </div>
  );
};

export default FinanzasDashboard;
