/**
 * Componente: Dashboard de Presupuesto
 * Vista consolidada de presupuesto estimado vs real por actividad
 * Stack: React + Shadcn/ui
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PieChart,
  Receipt,
  Loader2,
  ShoppingBag,
  Utensils,
  Package,
  Truck,
  FileText,
} from 'lucide-react';
import {
  ActividadesExteriorService,
  DashboardPresupuesto,
  VoucherCompra,
} from '@/services/actividadesExteriorService';
import { toast } from 'sonner';

interface PresupuestoDashboardProps {
  actividadId: string;
  actividadNombre: string;
}

const PresupuestoDashboard: React.FC<PresupuestoDashboardProps> = ({
  actividadId,
  actividadNombre,
}) => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardPresupuesto | null>(null);

  const cargarDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ActividadesExteriorService.obtenerDashboardPresupuesto(actividadId);
      setDashboard(data);
    } catch (error) {
      console.error('Error cargando dashboard presupuesto:', error);
      toast.error('Error al cargar presupuesto');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const formatMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

  const getCategoryIcon = (categoria: string) => {
    switch (categoria.toUpperCase()) {
      case 'MENU':
        return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'MATERIALES':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'LOGISTICA':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin datos de presupuesto</h3>
          <p className="text-muted-foreground">
            Agrega ingredientes, materiales o logística para ver el presupuesto
          </p>
        </CardContent>
      </Card>
    );
  }

  const porcentajeAvance = dashboard.total_estimado > 0
    ? Math.min((dashboard.total_real / dashboard.total_estimado) * 100, 100)
    : 0;

  const diferenciaTotal = dashboard.total_real - dashboard.total_estimado;
  const esAhorro = diferenciaTotal < 0;

  return (
    <div className="space-y-6">
      {/* Header con título */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard de Presupuesto</h3>
          <p className="text-sm text-muted-foreground">{actividadNombre}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {dashboard.items_comprados}/{dashboard.total_items} comprados
        </Badge>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Estimado */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimado</p>
                <p className="text-2xl font-bold">{formatMonto(dashboard.total_estimado)}</p>
              </div>
              <Banknote className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Total Real */}
        <Card className={dashboard.total_real > 0 ? '' : 'opacity-50'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Real</p>
                <p className="text-2xl font-bold">
                  {dashboard.total_real > 0 ? formatMonto(dashboard.total_real) : '—'}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Diferencia */}
        <Card className={diferenciaTotal !== 0 ? '' : 'opacity-50'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {esAhorro ? 'Ahorro' : 'Sobrecosto'}
                </p>
                <p className={`text-2xl font-bold ${esAhorro ? 'text-green-600' : diferenciaTotal > 0 ? 'text-red-600' : ''}`}>
                  {diferenciaTotal !== 0 ? formatMonto(Math.abs(diferenciaTotal)) : '—'}
                </p>
              </div>
              {esAhorro ? (
                <TrendingDown className="h-8 w-8 text-green-500 opacity-50" />
              ) : diferenciaTotal > 0 ? (
                <TrendingUp className="h-8 w-8 text-red-500 opacity-50" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-gray-400 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avance */}
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Avance</p>
                <span className="text-sm font-medium">{porcentajeAvance.toFixed(0)}%</span>
              </div>
              <Progress value={porcentajeAvance} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{dashboard.items_comprados} comprados</span>
                <span>{dashboard.items_pendientes} pendientes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Desglose por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.por_categoria && dashboard.por_categoria.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {dashboard.por_categoria.map((categoria) => {
                const catDiferencia = categoria.total_real - categoria.total_estimado;
                const catEsAhorro = catDiferencia < 0;
                const catAvance = categoria.total_estimado > 0
                  ? (categoria.total_real / categoria.total_estimado) * 100
                  : 0;

                return (
                  <AccordionItem key={categoria.categoria} value={categoria.categoria}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(categoria.categoria)}
                          <div className="text-left">
                            <p className="font-medium">{categoria.categoria}</p>
                            <p className="text-xs text-muted-foreground">
                              {categoria.items_count} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{formatMonto(categoria.total_estimado)}</p>
                            {categoria.total_real > 0 && (
                              <p className={`text-xs ${catEsAhorro ? 'text-green-600' : catDiferencia > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                Real: {formatMonto(categoria.total_real)}
                              </p>
                            )}
                          </div>
                          {catDiferencia !== 0 && categoria.total_real > 0 && (
                            <Badge
                              variant="outline"
                              className={catEsAhorro ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}
                            >
                              {catEsAhorro ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              )}
                              {formatMonto(Math.abs(catDiferencia))}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {/* Barra de progreso */}
                        <div className="flex items-center gap-4">
                          <Progress value={Math.min(catAvance, 100)} className="flex-1 h-2" />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {catAvance.toFixed(0)}%
                          </span>
                        </div>

                        {/* Stats rápidos */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Estimado</p>
                            <p className="font-medium">{formatMonto(categoria.total_estimado)}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Real</p>
                            <p className="font-medium">
                              {categoria.total_real > 0 ? formatMonto(categoria.total_real) : '—'}
                            </p>
                          </div>
                          <div className={`rounded-lg p-2 ${
                            catEsAhorro ? 'bg-green-50' : catDiferencia > 0 ? 'bg-red-50' : 'bg-muted/30'
                          }`}>
                            <p className="text-xs text-muted-foreground">Diferencia</p>
                            <p className={`font-medium ${
                              catEsAhorro ? 'text-green-600' : catDiferencia > 0 ? 'text-red-600' : ''
                            }`}>
                              {catDiferencia !== 0 ? (
                                <>
                                  {catDiferencia > 0 ? '+' : ''}{formatMonto(catDiferencia)}
                                </>
                              ) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Sin categorías registradas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vouchers Adjuntos */}
      {dashboard.vouchers && dashboard.vouchers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprobantes Adjuntos
              <Badge variant="secondary">{dashboard.vouchers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.vouchers.map((voucher: VoucherCompra) => (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {voucher.tipo_comprobante}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {voucher.numero_comprobante || '—'}
                    </TableCell>
                    <TableCell>
                      {voucher.razon_social_proveedor || voucher.ruc_proveedor || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {voucher.monto_comprobante ? formatMonto(voucher.monto_comprobante) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {voucher.fecha_emision
                        ? new Date(voucher.fecha_emision).toLocaleDateString('es-PE')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resumen Final */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dashboard.items_pendientes > 0 ? (
                <>
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-medium">Compras en progreso</p>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.items_pendientes} items pendientes de compra
                    </p>
                  </div>
                </>
              ) : dashboard.items_comprados === dashboard.total_items ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Compras completadas</p>
                    <p className="text-sm text-muted-foreground">
                      Todos los items han sido comprados
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sin compras registradas</p>
                    <p className="text-sm text-muted-foreground">
                      Registra precios reales cambiando el estado a "Comprado"
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Balance Final</p>
              <p className={`text-2xl font-bold ${
                esAhorro ? 'text-green-600' : diferenciaTotal > 0 ? 'text-red-600' : ''
              }`}>
                {dashboard.total_real > 0 ? (
                  <>
                    {esAhorro ? 'Ahorro: ' : diferenciaTotal > 0 ? 'Sobrecosto: ' : ''}
                    {formatMonto(Math.abs(diferenciaTotal))}
                  </>
                ) : (
                  formatMonto(dashboard.total_estimado)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresupuestoDashboard;
