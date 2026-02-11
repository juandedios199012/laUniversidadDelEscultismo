/**
 * Tab de Reportes para Actividades al Aire Libre
 * KPIs, estadísticas y exportación de datos
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, FileSpreadsheet, FileDown, Users, Wallet, Package,
  Calendar, CheckCircle, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ActividadesExteriorService, ActividadExteriorCompleta, DashboardInventario } from '@/services/actividadesExteriorService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ReportesTabProps {
  actividad: ActividadExteriorCompleta;
}

// Tipos de reporte disponibles
const TIPOS_REPORTE = [
  { id: 'participantes', label: '👥 Participantes', icon: Users },
  { id: 'presupuesto', label: '💰 Presupuesto', icon: Wallet },
  { id: 'inventario', label: '📦 Inventario (Items)', icon: Package },
  { id: 'inventario_ingresos', label: '📥 Ingresos Consolidado', icon: Package },
  { id: 'inventario_prestador', label: '🔄 Por Prestador', icon: Package },
  { id: 'compras', label: '🛒 Compras', icon: FileSpreadsheet },
  { id: 'programa', label: '📅 Programa', icon: Calendar },
];

// Campos exportables por tipo de reporte
const CAMPOS_REPORTE: Record<string, { id: string; label: string; default: boolean }[]> = {
  participantes: [
    { id: 'scout_nombre', label: 'Nombre', default: true },
    { id: 'scout_codigo', label: 'Código', default: true },
    { id: 'patrulla_nombre', label: 'Patrulla', default: true },
    { id: 'monto_a_pagar', label: 'Cuota', default: true },
    { id: 'monto_pagado', label: 'Pagado', default: true },
    { id: 'estado_autorizacion', label: 'Autorización', default: true },
    { id: 'confirmado', label: 'Confirmado', default: false },
  ],
  presupuesto: [
    { id: 'concepto', label: 'Concepto', default: true },
    { id: 'categoria', label: 'Categoría', default: true },
    { id: 'cantidad', label: 'Cantidad', default: true },
    { id: 'precio_unitario', label: 'P. Unit.', default: true },
    { id: 'monto_total', label: 'Total', default: true },
    { id: 'monto_ejecutado', label: 'Ejecutado', default: true },
    { id: 'proveedor', label: 'Proveedor', default: false },
  ],
  inventario: [
    { id: 'nombre', label: 'Nombre', default: true },
    { id: 'categoria', label: 'Categoría', default: true },
    { id: 'cantidad', label: 'Cantidad', default: true },
    { id: 'tipo_propiedad', label: 'Tipo', default: true },
    { id: 'prestado_por', label: 'Prestado por', default: true },
    { id: 'asignado_a', label: 'Asignado a', default: true },
    { id: 'estado', label: 'Estado', default: true },
    { id: 'condicion', label: 'Condición', default: false },
  ],
  inventario_ingresos: [
    { id: 'nombre', label: 'Producto', default: true },
    { id: 'categoria', label: 'Categoría', default: true },
    { id: 'tipo_propiedad', label: 'Tipo', default: true },
    { id: 'prestador', label: 'Prestado por', default: true },
    { id: 'cantidad_ingresada', label: 'Cantidad', default: true },
    { id: 'cantidad_devuelta', label: 'Devueltos', default: true },
    { id: 'cantidad_pendiente', label: 'Pendientes', default: true },
  ],
  inventario_prestador: [
    { id: 'prestador', label: 'Prestador', default: true },
    { id: 'contacto', label: 'Contacto', default: true },
    { id: 'total_items', label: 'Total Items', default: true },
    { id: 'devueltos', label: 'Devueltos', default: true },
    { id: 'pendientes', label: 'Pendientes', default: true },
    { id: 'productos', label: 'Detalle Productos', default: true },
  ],
  compras: [
    { id: 'concepto', label: 'Concepto', default: true },
    { id: 'descripcion', label: 'Descripción', default: false },
    { id: 'cantidad', label: 'Cantidad', default: true },
    { id: 'precio_unitario', label: 'P. Unit.', default: true },
    { id: 'monto_total', label: 'Total', default: true },
    { id: 'proveedor', label: 'Proveedor', default: true },
    { id: 'fecha_compra', label: 'Fecha', default: true },
  ],
  programa: [
    { id: 'dia', label: 'Día', default: true },
    { id: 'fecha', label: 'Fecha', default: true },
    { id: 'hora_inicio', label: 'Hora Inicio', default: true },
    { id: 'hora_fin', label: 'Hora Fin', default: true },
    { id: 'titulo', label: 'Título', default: true },
    { id: 'responsable', label: 'Responsable', default: true },
    { id: 'materiales', label: 'Materiales', default: false },
  ],
};

const ReportesTab: React.FC<ReportesTabProps> = ({
  actividad,
}) => {
  const [inventarioDashboard, setInventarioDashboard] = useState<DashboardInventario | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado de exportación
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('participantes');
  const [camposSeleccionados, setCamposSeleccionados] = useState<string[]>([]);
  const [formatoExport, setFormatoExport] = useState<'pdf' | 'excel'>('pdf');
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [actividad.id]);

  useEffect(() => {
    // Inicializar campos por defecto al cambiar tipo de reporte
    const camposDefault = CAMPOS_REPORTE[tipoReporte]
      ?.filter(c => c.default)
      .map(c => c.id) || [];
    setCamposSeleccionados(camposDefault);
  }, [tipoReporte]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const dashboard = await ActividadesExteriorService.dashboardInventario(actividad.id);
      setInventarioDashboard(dashboard);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // KPIs calculados
  const kpis = {
    totalParticipantes: actividad.participantes?.length || 0,
    staff: actividad.staff?.length || 0,
    
    montoTotal: actividad.participantes?.reduce((sum, p) => sum + (p.monto_a_pagar || 0), 0) || 0,
    montoPagado: actividad.participantes?.reduce((sum, p) => sum + (p.monto_pagado || 0), 0) || 0,
    get porcentajeRecaudacion() {
      return this.montoTotal > 0 ? Math.round((this.montoPagado / this.montoTotal) * 100) : 0;
    },
    
    conAutorizacion: actividad.participantes?.filter(p => p.estado_autorizacion === 'FIRMADA' || p.estado_autorizacion === 'RECIBIDA').length || 0,
    get porcentajeAutorizacion() {
      return this.totalParticipantes > 0 ? Math.round((this.conAutorizacion / this.totalParticipantes) * 100) : 0;
    },
    
    comprasTotal: actividad.compras?.reduce((sum, c) => sum + (c.monto_total || 0), 0) || 0,
    
    bloquesPrograma: actividad.programas?.reduce((sum: number, p) => sum + (p.bloques?.length || 0), 0) || 0,
    diasPrograma: actividad.programas?.length || 0,
    
    inventarioTotal: inventarioDashboard?.total_items || 0,
    inventarioPrestado: inventarioDashboard?.prestados || 0,
    inventarioPorDevolver: inventarioDashboard?.pendientes_devolucion || 0,
  };

  const handleAbrirExport = () => {
    setShowExportDialog(true);
  };

  const toggleCampo = (campoId: string) => {
    setCamposSeleccionados(prev => 
      prev.includes(campoId) 
        ? prev.filter(c => c !== campoId)
        : [...prev, campoId]
    );
  };

  const seleccionarTodos = () => {
    const todos = CAMPOS_REPORTE[tipoReporte]?.map(c => c.id) || [];
    setCamposSeleccionados(todos);
  };

  const deseleccionarTodos = () => {
    setCamposSeleccionados([]);
  };

  const obtenerDatos = async (): Promise<any[]> => {
    switch (tipoReporte) {
      case 'participantes':
        return (actividad.participantes || []).map(p => ({
          scout_nombre: p.scout_nombre,
          scout_codigo: p.scout_codigo,
          patrulla_nombre: p.patrulla_nombre || '-',
          monto_a_pagar: `S/ ${(p.monto_a_pagar || 0).toFixed(2)}`,
          monto_pagado: `S/ ${(p.monto_pagado || 0).toFixed(2)}`,
          estado_autorizacion: p.estado_autorizacion || '-',
          confirmado: p.confirmado ? '✓ Sí' : '✗ No',
        }));
      
      case 'presupuesto':
        return (actividad.presupuesto || []).map(item => ({
          concepto: item.concepto,
          categoria: item.categoria || '-',
          cantidad: item.cantidad,
          precio_unitario: `S/ ${(item.precio_unitario || 0).toFixed(2)}`,
          monto_total: `S/ ${(item.monto_total || 0).toFixed(2)}`,
          monto_ejecutado: `S/ ${(item.monto_ejecutado || 0).toFixed(2)}`,
          proveedor: item.proveedor || '-',
        }));
      
      case 'inventario':
        const inventario = await ActividadesExteriorService.listarInventario(actividad.id);
        return inventario.map(item => ({
          nombre: item.nombre,
          categoria: item.categoria,
          cantidad: item.cantidad,
          tipo_propiedad: item.tipo_propiedad,
          prestado_por: item.prestado_por || '-',
          asignado_a: item.asignado_a || '-',
          estado: item.estado,
          condicion: item.condicion,
        }));
      
      case 'inventario_ingresos':
        // Reporte consolidado de ingresos (agrupado por producto)
        const ingresosData = await ActividadesExteriorService.reporteInventarioIngresos(actividad.id);
        return ingresosData.data.map(item => ({
          nombre: item.producto,
          categoria: item.categoria,
          tipo_propiedad: item.tipo_propiedad === 'PRESTADO' ? 'Prestado' : 
                          item.tipo_propiedad === 'GRUPO' ? 'Del Grupo' : 'Comprado',
          prestador: item.prestado_por || '-',
          cantidad_ingresada: item.cantidad_ingresada,
          cantidad_devuelta: item.cantidad_devuelta,
          cantidad_pendiente: item.cantidad_pendiente,
        }));
      
      case 'inventario_prestador':
        // Reporte por prestador (qué devolver a cada persona)
        const porPrestador = await ActividadesExteriorService.reportePorPrestador(actividad.id);
        return porPrestador.map(item => ({
          prestador: item.prestador,
          contacto: item.contacto || '-',
          total_items: item.total_items,
          devueltos: item.devueltos,
          pendientes: item.pendientes,
          productos: item.items.map((p: any) => 
            `${p.producto} (${p.cantidad})`
          ).join(', '),
        }));
      
      case 'compras':
        return (actividad.compras || []).map(c => ({
          concepto: c.concepto,
          descripcion: c.descripcion || '-',
          cantidad: c.cantidad,
          precio_unitario: `S/ ${(c.precio_unitario || 0).toFixed(2)}`,
          monto_total: `S/ ${(c.monto_total || 0).toFixed(2)}`,
          proveedor: c.proveedor || '-',
          fecha_compra: c.fecha_compra || '-',
        }));
      
      case 'programa':
        const bloques: { dia: string; fecha: string; hora_inicio: string; hora_fin: string; titulo: string; responsable: string; materiales: string }[] = [];
        (actividad.programas || []).forEach(dia => {
          (dia.bloques || []).forEach(b => {
            bloques.push({
              dia: dia.nombre || 'Sin nombre',
              fecha: dia.fecha,
              hora_inicio: b.hora_inicio || '-',
              hora_fin: b.hora_fin || '-',
              titulo: b.nombre,
              responsable: b.responsable_id || '-',
              materiales: b.materiales_necesarios || '-',
            });
          });
        });
        return bloques;
      
      default:
        return [];
    }
  };

  const exportarPDF = async (datos: any[]) => {
    const doc = new jsPDF();
    const camposInfo = CAMPOS_REPORTE[tipoReporte] || [];
    const columnas = camposInfo.filter(c => camposSeleccionados.includes(c.id));
    
    // Título
    doc.setFontSize(16);
    doc.text(actividad.nombre, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Reporte de ${TIPOS_REPORTE.find(t => t.id === tipoReporte)?.label.replace(/[^\w\s]/gi, '')}`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 34);
    
    // Tabla
    autoTable(doc, {
      startY: 42,
      head: [columnas.map(c => c.label)],
      body: datos.map(row => columnas.map(c => row[c.id] || '-')),
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    
    doc.save(`${actividad.nombre.replace(/[^a-z0-9]/gi, '_')}_${tipoReporte}.pdf`);
  };

  const exportarExcel = async (datos: any[]) => {
    const camposInfo = CAMPOS_REPORTE[tipoReporte] || [];
    const columnas = camposInfo.filter(c => camposSeleccionados.includes(c.id));
    
    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipoReporte);
    
    // Headers
    const headers = columnas.map(c => c.label);
    worksheet.addRow(headers);
    
    // Estilizar header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Agregar datos
    datos.forEach(row => {
      worksheet.addRow(columnas.map(c => row[c.id] || '-'));
    });
    
    // Ajustar anchos de columna
    worksheet.columns.forEach(col => {
      col.width = 18;
    });
    
    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${actividad.nombre.replace(/[^a-z0-9]/gi, '_')}_${tipoReporte}.xlsx`);
  };

  const handleExportar = async () => {
    if (camposSeleccionados.length === 0) {
      toast.error('Selecciona al menos un campo para exportar');
      return;
    }

    setExportando(true);
    try {
      const datos = await obtenerDatos();
      
      if (datos.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      if (formatoExport === 'pdf') {
        await exportarPDF(datos);
        toast.success('PDF generado correctamente');
      } else {
        await exportarExcel(datos);
        toast.success('Excel generado correctamente');
      }
      
      setShowExportDialog(false);
    } catch (error: any) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar');
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acción de exportar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Reportes y Estadísticas
          </h2>
          <p className="text-muted-foreground text-sm">
            KPIs de la actividad y exportación de datos
          </p>
        </div>
        <Button onClick={handleAbrirExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar Datos
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Participantes */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.totalParticipantes}</p>
                <p className="text-xs text-muted-foreground">Participantes</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline">{kpis.staff} staff</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recaudación */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">S/ {kpis.montoPagado.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Recaudado</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{kpis.porcentajeRecaudacion}% del total</span>
                <span>S/ {kpis.montoTotal.toFixed(0)}</span>
              </div>
              <Progress value={kpis.porcentajeRecaudacion} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Autorizaciones */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.conAutorizacion}</p>
                <p className="text-xs text-muted-foreground">Autorizaciones</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>{kpis.porcentajeAutorizacion}% aprobadas</span>
                <span>{kpis.totalParticipantes - kpis.conAutorizacion} pendientes</span>
              </div>
              <Progress value={kpis.porcentajeAutorizacion} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Inventario */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.inventarioTotal}</p>
                <p className="text-xs text-muted-foreground">Items Inventario</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline">{kpis.inventarioPrestado} prestados</Badge>
              <Badge variant="outline" className="text-orange-600">{kpis.inventarioPorDevolver} por devolver</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen Financiero */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Cuotas esperadas</span>
              <span className="font-medium">S/ {kpis.montoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Cuotas recaudadas</span>
              <span className="font-medium text-green-600">S/ {kpis.montoPagado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Cuotas pendientes</span>
              <span className="font-medium text-orange-600">S/ {(kpis.montoTotal - kpis.montoPagado).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total compras</span>
              <span className="font-medium">S/ {kpis.comprasTotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2 text-lg font-semibold">
              <span>Balance</span>
              <span className={kpis.montoPagado - kpis.comprasTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                S/ {(kpis.montoPagado - kpis.comprasTotal).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Programa y Logística */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programa y Logística
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Días de programa</span>
              <span className="font-medium">{kpis.diasPrograma}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Bloques de actividades</span>
              <span className="font-medium">{kpis.bloquesPrograma}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Staff asignado</span>
              <span className="font-medium">{kpis.staff}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Items inventario propios</span>
              <span className="font-medium">{kpis.inventarioTotal - kpis.inventarioPrestado}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Items prestados</span>
              <span className="font-medium">{kpis.inventarioPrestado}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Pendientes de devolver</span>
              <span className="font-medium text-orange-600">{kpis.inventarioPorDevolver}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participantes por tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribución de Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por patrulla */}
            <div>
              <h4 className="font-medium mb-3">Por Patrulla</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(
                  (actividad.participantes || []).reduce((acc: Record<string, number>, p) => {
                    const patrulla = p.patrulla_nombre || 'Sin patrulla';
                    acc[patrulla] = (acc[patrulla] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([patrulla, count]) => (
                  <div key={patrulla} className="flex justify-between items-center">
                    <span className="text-sm truncate">{patrulla}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Por estado de autorización */}
            <div>
              <h4 className="font-medium mb-3">Por Estado de Autorización</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(
                  (actividad.participantes || []).reduce((acc: Record<string, number>, p) => {
                    const estado = p.estado_autorizacion || 'PENDIENTE';
                    acc[estado] = (acc[estado] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([estado, count]) => (
                  <div key={estado} className="flex justify-between items-center">
                    <span className="text-sm truncate">{estado}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Exportación */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Exportar Datos
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de reporte, formato y campos a incluir
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de reporte */}
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REPORTE.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label>Formato de Exportación</Label>
              <div className="flex gap-4">
                <div 
                  className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formatoExport === 'pdf' ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormatoExport('pdf')}
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-xs text-muted-foreground">Documento portable</p>
                    </div>
                  </div>
                </div>
                <div 
                  className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formatoExport === 'excel' ? 'border-blue-500 bg-blue-50' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormatoExport('excel')}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Excel</p>
                      <p className="text-xs text-muted-foreground">Hoja de cálculo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos a incluir */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Campos a Incluir</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={seleccionarTodos}
                  >
                    Todos
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={deseleccionarTodos}
                  >
                    Ninguno
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {CAMPOS_REPORTE[tipoReporte]?.map(campo => (
                  <div key={campo.id} className="flex items-center gap-2">
                    <Checkbox
                      id={campo.id}
                      checked={camposSeleccionados.includes(campo.id)}
                      onCheckedChange={() => toggleCampo(campo.id)}
                    />
                    <Label htmlFor={campo.id} className="text-sm cursor-pointer">
                      {campo.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExportar} 
              disabled={exportando || camposSeleccionados.length === 0}
            >
              {exportando ? 'Exportando...' : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {formatoExport.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportesTab;
