import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Calendar } from 'lucide-react';
import ScoutService from '../../services/scoutService';
import type { Scout } from '../../lib/supabase';

interface InscripcionAnual {
  id: string;
  scoutId: string;
  scout: Scout;
  año: string;
  cuota: number;
  fechaPago: string;
}

const InscripcionAnual: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scoutsEncontrados, setScoutsEncontrados] = useState<Scout[]>([]);
  const [buscandoScouts, setBuscandoScouts] = useState(false);
  const [inscripciones, setInscripciones] = useState<InscripcionAnual[]>([]);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [formData, setFormData] = useState({
    año: '',
    cuota: '',
    fechaPago: ''
  });

  // Función para buscar scouts en la base de datos real
  const buscarScouts = async (termino: string) => {
    if (termino.length < 2) {
      setScoutsEncontrados([]);
      return;
    }

    setBuscandoScouts(true);
    try {
      const scouts = await ScoutService.searchScoutsWithFilters({
        buscar_texto: termino,
        estado: 'ACTIVO',
        limite: 20
      });

      setScoutsEncontrados(scouts || []);
    } catch (error) {
      console.error('Error al buscar scouts:', error);
      setScoutsEncontrados([]);
    } finally {
      setBuscandoScouts(false);
    }
  };

  // Efecto para buscar scouts cuando cambia el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarScouts(searchTerm);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleScoutSelect = (scout: Scout) => {
    setSelectedScout(scout);
    setSearchTerm('');
    setScoutsEncontrados([]);
    setFormData({
      año: new Date().getFullYear().toString(),
      cuota: '',
      fechaPago: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScout) return;

    // Verificar si el scout ya está inscrito en ese año
    const yaInscrito = inscripciones.some(
      insc => insc.scoutId === selectedScout.id && insc.año === formData.año
    );

    if (yaInscrito) {
      alert('Este scout ya está inscrito para el año ' + formData.año);
      return;
    }

    const nuevaInscripcion: InscripcionAnual = {
      id: Date.now().toString(),
      scoutId: selectedScout.id,
      scout: selectedScout,
      año: formData.año,
      cuota: parseFloat(formData.cuota),
      fechaPago: formData.fechaPago
    };

    setInscripciones(prev => [...prev, nuevaInscripcion]);
    setSelectedScout(null);
    setFormData({
      año: '',
      cuota: '',
      fechaPago: ''
    });
  };

  // Calcular estadísticas por año
  const getEstadisticasPorAño = (año: string) => {
    const inscripcionesDelAño = inscripciones.filter(insc => insc.año === año);
    return {
      totalInscritos: inscripcionesDelAño.length,
      totalRecaudado: inscripcionesDelAño.reduce((sum, insc) => sum + insc.cuota, 0)
    };
  };

  const añosUnicos = [...new Set(inscripciones.map(insc => insc.año))].sort();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Inscripción Anual</h1>
          <p className="text-green-100">Registro anual de scouts con cuotas por año</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario de Inscripción */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-green-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Registrar Inscripción Anual
            </h2>

            {/* Búsqueda de Scout */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-green-700 mb-2">
                Buscar Scout Registrado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar por nombre, apellido o DNI..."
                  className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {buscandoScouts && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  </div>
                )}
              </div>
              
              {/* Resultados de búsqueda */}
              {searchTerm.length > 0 && scoutsEncontrados.length > 0 && (
                <div className="mt-2 bg-white border border-green-200 rounded-lg max-h-48 overflow-y-auto">
                  {scoutsEncontrados.map(scout => (
                    <div
                      key={scout.id}
                      onClick={() => handleScoutSelect(scout)}
                      className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">
                        {scout.nombres} {scout.apellidos}
                      </div>
                      <div className="text-sm text-gray-600">
                        DNI: {scout.numero_documento} | {scout.rama_actual}
                        {scout.celular && ` | Tel: ${scout.celular}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchTerm.length > 0 && !buscandoScouts && scoutsEncontrados.length === 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 text-center text-gray-500">
                  No se encontraron scouts registrados
                </div>
              )}
            </div>

            {/* Scout Seleccionado */}
            {selectedScout && (
              <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Scout Seleccionado:</h4>
                <div className="text-gray-700">
                  <div><strong>{selectedScout.nombres} {selectedScout.apellidos}</strong></div>
                  <div className="text-sm">
                    DNI: {selectedScout.numero_documento} | {selectedScout.rama_actual}
                    {selectedScout.celular && ` | Tel: ${selectedScout.celular}`}
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de Inscripción */}
            {selectedScout && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Año de Inscripción
                  </label>
                  <input
                    type="text"
                    value={formData.año}
                    onChange={(e) => setFormData(prev => ({ ...prev, año: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Cuota (S/.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cuota}
                    onChange={(e) => setFormData(prev => ({ ...prev, cuota: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="100.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={formData.fechaPago}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Registrar Inscripción
                </button>
              </form>
            )}
          </div>

          {/* Lista de Inscripciones y Estadísticas */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Inscripciones por Año
            </h2>

            {/* Estadísticas por Año */}
            {añosUnicos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-blue-700 mb-4">Resumen por Año</h3>
                <div className="space-y-3">
                  {añosUnicos.map(año => {
                    const stats = getEstadisticasPorAño(año);
                    return (
                      <div key={año} className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-blue-800">Año {año}</div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{stats.totalInscritos} scouts</div>
                            <div className="font-semibold text-green-600">S/. {stats.totalRecaudado.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de Inscripciones */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-medium text-blue-700">Todas las Inscripciones</h3>
              {inscripciones.map(inscripcion => (
                <div key={inscripcion.id} className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {inscripcion.scout.nombres} {inscripcion.scout.apellidos}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {inscripcion.scout.rama_actual}
                        {inscripcion.scout.celular && ` | Tel: ${inscripcion.scout.celular}`}
                      </p>
                      <p className="text-sm text-blue-600 font-medium">Año: {inscripcion.año}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">S/. {inscripcion.cuota}</div>
                      <div className="text-xs text-gray-500">{inscripcion.fechaPago}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {inscripciones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay inscripciones registradas
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscripcionAnual;