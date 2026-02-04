/**
 * Reporte Excel de Scouts - Componente UI
 * 
 * @fileoverview
 * Componente para generar reporte Excel completo de scouts
 * con vista previa, opciones de filtrado y feedback visual.
 * 
 * Principios UX aplicados:
 * - Estado vacío significativo
 * - KPIs de preview antes de exportar
 * - Feedback visual claro (loading, success, error)
 * - Opciones de filtrado accesibles
 */

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Filter,
  FileCheck,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { generateScoutsExcel } from '../services/excelService';
import { getAllScoutsForExcel, getScoutsExcelPreview } from '../services/scoutExcelDataService';

// ============================================
// Types
// ============================================

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface PreviewData {
  totalScouts: number;
  totalFamiliares: number;
  scoutsPorRama: Record<string, number>;
  scoutsPorEstado: Record<string, number>;
}

// ============================================
// Constants
// ============================================

const RAMAS = [
  { value: 'TODAS', label: 'Todas las ramas' },
  { value: 'Manada', label: 'Manada' },
  { value: 'Tropa', label: 'Tropa' },
  { value: 'Comunidad', label: 'Comunidad' },
  { value: 'Clan', label: 'Clan' },
  { value: 'Dirigentes', label: 'Dirigentes' },
];

const ESTADOS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Solo activos' },
  { value: 'INACTIVO', label: 'Solo inactivos' },
];

// ============================================
// Component
// ============================================

export function ScoutsExcelReport() {
  // State
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  
  // Filtros
  const [rama, setRama] = useState<string>('TODAS');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO');
  
  // Opciones de exportación (8 hojas según los 7 steps + resumen)
  const [incluirResumen, setIncluirResumen] = useState(true);
  const [incluirDatosPersonales, setIncluirDatosPersonales] = useState(true);
  const [incluirContacto, setIncluirContacto] = useState(true);
  const [incluirFamiliar, setIncluirFamiliar] = useState(true);
  const [incluirEducacion, setIncluirEducacion] = useState(true);
  const [incluirReligion, setIncluirReligion] = useState(true);
  const [incluirSalud, setIncluirSalud] = useState(true);
  const [incluirScout, setIncluirScout] = useState(true);

  // Cargar preview al montar y cuando cambian filtros
  useEffect(() => {
    loadPreview();
  }, [rama, estado]);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const data = await getScoutsExcelPreview({
        rama: rama === 'TODAS' ? undefined : rama,
        estado,
      });
      setPreview(data);
    } catch (err) {
      console.error('Error cargando preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExport = async () => {
    setStatus('loading');
    setError(null);

    try {
      // Obtener datos
      const scouts = await getAllScoutsForExcel({
        rama: rama === 'TODAS' ? undefined : rama,
        estado,
        incluirFamiliares: incluirFamiliar,
      });

      if (scouts.length === 0) {
        setError('No hay scouts para exportar con los filtros seleccionados');
        setStatus('error');
        return;
      }

      // Generar Excel con las 8 hojas organizadas por steps
      const result = await generateScoutsExcel(scouts, {
        includeResumen: incluirResumen,
        includeDatosPersonales: incluirDatosPersonales,
        includeContacto: incluirContacto,
        includeFamiliar: incluirFamiliar,
        includeEducacion: incluirEducacion,
        includeReligion: incluirReligion,
        includeSalud: incluirSalud,
        includeScout: incluirScout,
      });

      if (result.success) {
        setStatus('success');
        // Reset después de 3 segundos
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error exportando:', err);
      setError(err instanceof Error ? err.message : 'Error al generar Excel');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Exportar Scouts a Excel
          </h2>
          <p className="text-sm text-gray-500">
            Genera un archivo Excel completo con todos los campos de scouts y familiares
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Estructura del Excel (8 hojas por Steps)</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              <li><strong>Resumen:</strong> KPIs y estadísticas del grupo</li>
              <li><strong>1. Datos Personales:</strong> Nombre, DNI, fecha nacimiento, sexo</li>
              <li><strong>2. Contacto:</strong> Teléfonos, emails, dirección, ubicación GPS</li>
              <li><strong>3. Familiar:</strong> Padres/Tutores (1 fila por familiar)</li>
              <li><strong>4. Educación:</strong> Centro de estudio, año, ocupación</li>
              <li><strong>5. Religión:</strong> Información religiosa</li>
              <li><strong>6. Salud:</strong> Grupo sanguíneo, seguro, discapacidad</li>
              <li><strong>7. Scout:</strong> Rama, patrulla, cargo, fecha ingreso</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtros y Opciones */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Opciones
            </CardTitle>
            <CardDescription>
              Personaliza qué datos incluir en el reporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rama</Label>
                <Select value={rama} onValueChange={setRama}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ramas" />
                  </SelectTrigger>
                  <SelectContent>
                    {RAMAS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={estado} 
                  onValueChange={(v) => setEstado(v as typeof estado)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opciones de hojas */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Hojas a incluir en el Excel</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Resumen */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-resumen"
                    checked={incluirResumen}
                    onCheckedChange={(checked) => setIncluirResumen(!!checked)}
                  />
                  <label htmlFor="incluir-resumen" className="text-sm font-medium cursor-pointer">
                    📊 Resumen (KPIs)
                  </label>
                </div>

                {/* Step 1: Datos Personales */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-personal"
                    checked={incluirDatosPersonales}
                    onCheckedChange={(checked) => setIncluirDatosPersonales(!!checked)}
                  />
                  <label htmlFor="incluir-personal" className="text-sm font-medium cursor-pointer">
                    👤 1. Datos Personales
                  </label>
                </div>

                {/* Step 2: Contacto */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-contacto"
                    checked={incluirContacto}
                    onCheckedChange={(checked) => setIncluirContacto(!!checked)}
                  />
                  <label htmlFor="incluir-contacto" className="text-sm font-medium cursor-pointer">
                    📞 2. Contacto
                  </label>
                </div>

                {/* Step 3: Familiar */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-familiar"
                    checked={incluirFamiliar}
                    onCheckedChange={(checked) => setIncluirFamiliar(!!checked)}
                  />
                  <label htmlFor="incluir-familiar" className="text-sm font-medium cursor-pointer">
                    👨‍👩‍👧 3. Familiar
                  </label>
                </div>

                {/* Step 4: Educación */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-educacion"
                    checked={incluirEducacion}
                    onCheckedChange={(checked) => setIncluirEducacion(!!checked)}
                  />
                  <label htmlFor="incluir-educacion" className="text-sm font-medium cursor-pointer">
                    🎓 4. Educación
                  </label>
                </div>

                {/* Step 5: Religión */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-religion"
                    checked={incluirReligion}
                    onCheckedChange={(checked) => setIncluirReligion(!!checked)}
                  />
                  <label htmlFor="incluir-religion" className="text-sm font-medium cursor-pointer">
                    ⛪ 5. Religión
                  </label>
                </div>

                {/* Step 6: Salud */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-salud"
                    checked={incluirSalud}
                    onCheckedChange={(checked) => setIncluirSalud(!!checked)}
                  />
                  <label htmlFor="incluir-salud" className="text-sm font-medium cursor-pointer">
                    ❤️ 6. Salud
                  </label>
                </div>

                {/* Step 7: Scout */}
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="incluir-scout"
                    checked={incluirScout}
                    onCheckedChange={(checked) => setIncluirScout(!!checked)}
                  />
                  <label htmlFor="incluir-scout" className="text-sm font-medium cursor-pointer">
                    ⚜️ 7. Scout
                  </label>
                </div>
              </div>
            </div>

            {/* Botón de exportar */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleExport}
                disabled={status === 'loading' || loadingPreview || preview?.totalScouts === 0}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando Excel...
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ¡Descargado!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Descargar Excel
                  </>
                )}
              </Button>

              {/* Error message */}
              {status === 'error' && error && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview / KPIs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Vista Previa
            </CardTitle>
            <CardDescription>
              Datos que se incluirán en el reporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : preview ? (
              <div className="space-y-4">
                {/* Total scouts */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium">Total Scouts</span>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {preview.totalScouts}
                  </Badge>
                </div>

                {/* Total familiares */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium">Total Familiares</span>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {preview.totalFamiliares}
                  </Badge>
                </div>

                {/* Por rama */}
                {Object.keys(preview.scoutsPorRama).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Por Rama</span>
                    <div className="space-y-1">
                      {Object.entries(preview.scoutsPorRama).map(([r, count]) => (
                        <div key={r} className="flex justify-between text-sm">
                          <span className="text-gray-600">{r}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Por estado */}
                {Object.keys(preview.scoutsPorEstado).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Por Estado</span>
                    <div className="space-y-1">
                      {Object.entries(preview.scoutsPorEstado).map(([e, count]) => (
                        <div key={e} className="flex justify-between text-sm">
                          <span className="text-gray-600">{e}</span>
                          <Badge 
                            variant={e === 'ACTIVO' ? 'default' : 'secondary'}
                            className={e === 'ACTIVO' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado vacío */}
                {preview.totalScouts === 0 && (
                  <div className="text-center py-4">
                    <AlertCircle className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      No hay scouts con los filtros seleccionados
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Error cargando preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ScoutsExcelReport;
