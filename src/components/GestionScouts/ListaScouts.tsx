import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';
import ScoutService from '../../services/scoutService';
import type { Scout } from '../../lib/supabase';
import { getScoutData } from '../../modules/reports/services/reportDataService';
import { generateReportMetadata } from '../../modules/reports/services/pdfService';
import DNGI03Template from '../../modules/reports/templates/pdf/DNGI03Template';

interface ListaScoutsProps {
  onVerScout?: (scout: Scout) => void;
  onEditarScout?: (scout: Scout) => void;
  onEliminarScout?: (scout: Scout) => void;
}

export const ListaScouts: React.FC<ListaScoutsProps> = ({
  onVerScout,
  onEditarScout,
  onEliminarScout
}) => {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    rama: '',
    estado: ''  // Cambiar a vacío para que inicialmente muestre todos
  });
  const [paginacion, setPaginacion] = useState({
    paginaActual: 1,
    elementosPorPagina: 10
  });

  const cargarScouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando scouts con filtros:', filtros);
      
      // Usar búsqueda con filtros si hay algún filtro aplicado
      let data;
      const hayFiltros = filtros.busqueda || filtros.rama || (filtros.estado && filtros.estado !== '');
      
      console.log('🔍 Hay filtros aplicados:', hayFiltros);
      console.log('🔍 Filtros actuales:', {
        busqueda: filtros.busqueda,
        rama: filtros.rama, 
        estado: filtros.estado,
        hayFiltros
      });
      
      if (hayFiltros) {
        console.log('🔍 Usando búsqueda con filtros');
        data = await ScoutService.searchScoutsWithFilters({
          buscar_texto: filtros.busqueda,
          rama: filtros.rama,
          estado: filtros.estado,
          limite: 100  // Cargar hasta 100 scouts
        });
      } else {
        console.log('📋 Obteniendo todos los scouts');
        data = await ScoutService.getAllScouts();
      }
      
      console.log('📊 Datos recibidos:', data);
      console.log('📊 Cantidad de scouts:', data?.length || 0);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📊 Primer scout de muestra:', data[0]);
        console.log('📊 Campos del scout:', Object.keys(data[0]));
        console.log('📊 Rama actual:', data[0].rama_actual);
        console.log('📊 Celular:', data[0].celular);
        console.log('📊 Correo:', data[0].correo);
      }
      
      setScouts(data || []);
    } catch (err) {
      console.error('❌ Error al cargar scouts:', err);
      setError('Error al cargar la lista de scouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce para búsqueda de texto
    const timer = setTimeout(() => {
      cargarScouts();
    }, filtros.busqueda ? 500 : 0); // 500ms de debounce para búsqueda, inmediato para otros filtros

    return () => clearTimeout(timer);
  }, [filtros]);

  // Cargar datos inicial
  useEffect(() => {
    cargarScouts();
  }, []); // Solo al montar el componente

  const handleEliminar = async (scout: Scout) => {
    if (!window.confirm(`⚠️ ATENCIÓN: Esta acción eliminará PERMANENTEMENTE al scout ${scout.nombres} ${scout.apellidos} y no se podrá recuperar.\n\n¿Estás COMPLETAMENTE SEGURO?`)) {
      return;
    }

    try {
      const result = await ScoutService.deleteScout(scout.id);
      if (result.success) {
        await cargarScouts(); // Recargar la lista
        alert('✅ Scout eliminado permanentemente');
      } else {
        alert(`❌ Error al eliminar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar scout:', error);
      alert('❌ Error al eliminar el scout');
    }
  };

  const handleDesactivar = async (scout: Scout) => {
    if (!window.confirm(`¿Desactivar al scout ${scout.nombres} ${scout.apellidos}?\n\nEl scout pasará a estado INACTIVO pero sus datos se conservarán.`)) {
      return;
    }

    try {
      const result = await ScoutService.desactivarScout(scout.id);
      if (result.success) {
        await cargarScouts(); // Recargar la lista
        alert('✅ Scout desactivado exitosamente');
      } else {
        alert(`❌ Error al desactivar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al desactivar scout:', error);
      alert('❌ Error al desactivar el scout');
    }
  };

  const handleGenerarPDF = async (scout: Scout) => {
    try {
      console.log('📄 Generando PDF para scout:', scout.id);
      
      // Obtener datos completos del scout
      const scoutData = await getScoutData(scout.id);
      
      if (!scoutData) {
        alert('No se pudieron obtener los datos del scout');
        return;
      }

      // Generar metadata
      const metadata = generateReportMetadata();

      // Generar documento PDF
      const doc = <DNGI03Template scout={scoutData} metadata={metadata} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Descargar PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DNGI03_${scout.codigo_scout}_${scout.nombres}_${scout.apellidos}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
    }
  };

  const scoutsFiltrados = scouts.filter(scout => {
    const coincideBusqueda = !filtros.busqueda || 
      `${scout.nombres} ${scout.apellidos}`.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      scout.numero_documento.includes(filtros.busqueda) ||
      scout.codigo_scout.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const coincideRama = !filtros.rama || scout.rama_actual === filtros.rama;
    const coincideEstado = !filtros.estado || scout.estado === filtros.estado;
    
    return coincideBusqueda && coincideRama && coincideEstado;
  });

  const totalPaginas = Math.ceil(scoutsFiltrados.length / paginacion.elementosPorPagina);
  const indiceInicio = (paginacion.paginaActual - 1) * paginacion.elementosPorPagina;
  const scoutsPaginados = scoutsFiltrados.slice(indiceInicio, indiceInicio + paginacion.elementosPorPagina);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando scouts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <div className="flex">
          <span className="text-red-500">❌</span>
          <div className="ml-3">
            <strong>Error:</strong> {error}
            <button 
              onClick={cargarScouts}
              className="ml-3 text-red-800 underline hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          👥 Gestión de Scouts
        </h2>
        <div className="text-sm text-gray-600">
          Total: {scoutsFiltrados.length} scouts
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              placeholder="Nombre, documento o código..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rama
            </label>
            <select
              value={filtros.rama}
              onChange={(e) => setFiltros(prev => ({ ...prev, rama: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las ramas</option>
              <option value="Lobatos">Lobatos</option>
              <option value="Scouts">Scouts</option>
              <option value="Rovers">Rovers</option>
              <option value="Dirigentes">Dirigentes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarScouts}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? 'Cargando...' : `Total: ${scouts.length} scouts`}
        </div>
        <div className="text-sm text-gray-500">
          {scoutsFiltrados.length !== scouts.length && 
            `Mostrando ${scoutsFiltrados.length} de ${scouts.length} scouts`
          }
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scoutsPaginados.map((scout) => (
                <tr key={scout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {scout.nombres.charAt(0)}{scout.apellidos.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {scout.nombres} {scout.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">
                          {scout.numero_documento}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {scout.codigo_scout}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calcularEdad(scout.fecha_nacimiento)} años
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      scout.rama_actual === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                      scout.rama_actual === 'Tropa' ? 'bg-green-100 text-green-800' :
                      scout.rama_actual === 'Caminantes' ? 'bg-orange-100 text-orange-800' :
                      scout.rama_actual === 'Clan' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {scout.rama_actual}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      scout.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                      scout.estado === 'INACTIVO' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {scout.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{scout.celular || '-'}</div>
                    <div className="text-xs">{scout.correo || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onVerScout?.(scout)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition-colors"
                        title="Ver perfil"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleGenerarPDF(scout)}
                        className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded transition-colors"
                        title="Generar PDF DNGI-03"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => onEditarScout?.(scout)}
                        className="text-green-600 hover:text-green-900 px-2 py-1 rounded transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDesactivar(scout)}
                        className="text-orange-600 hover:text-orange-900 px-2 py-1 rounded transition-colors"
                        title="Desactivar (cambiar a INACTIVO)"
                      >
                        ⏸️
                      </button>
                      <button
                        onClick={() => handleEliminar(scout)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition-colors"
                        title="Eliminar permanentemente"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {scoutsPaginados.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">📭</div>
            <p className="text-gray-500">No se encontraron scouts con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPaginacion(prev => ({ 
                ...prev, 
                paginaActual: Math.max(1, prev.paginaActual - 1) 
              }))}
              disabled={paginacion.paginaActual === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginacion(prev => ({ 
                ...prev, 
                paginaActual: Math.min(totalPaginas, prev.paginaActual + 1) 
              }))}
              disabled={paginacion.paginaActual === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + paginacion.elementosPorPagina, scoutsFiltrados.length)} de{' '}
                <span className="font-medium">{scoutsFiltrados.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPaginacion(prev => ({ 
                    ...prev, 
                    paginaActual: Math.max(1, prev.paginaActual - 1) 
                  }))}
                  disabled={paginacion.paginaActual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ←
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => setPaginacion(prev => ({ ...prev, paginaActual: pagina }))}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagina === paginacion.paginaActual
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pagina}
                  </button>
                ))}
                <button
                  onClick={() => setPaginacion(prev => ({ 
                    ...prev, 
                    paginaActual: Math.min(totalPaginas, prev.paginaActual + 1) 
                  }))}
                  disabled={paginacion.paginaActual === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaScouts;