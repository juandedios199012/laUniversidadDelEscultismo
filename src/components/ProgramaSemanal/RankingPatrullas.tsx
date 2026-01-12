import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, X } from 'lucide-react';
import ProgramaSemanalService from '../../services/programaSemanalService';

interface TotalPatrulla {
  patrulla_id: string;
  patrulla_nombre: string;
  color_patrulla: string;
  total_puntaje: number;
  actividades_participadas: number;
}

interface RankingPatrullasProps {
  programaId: string;
  programaTema: string;
  onClose: () => void;
}

export default function RankingPatrullas({
  programaId,
  programaTema,
  onClose
}: RankingPatrullasProps) {
  const [totales, setTotales] = useState<TotalPatrulla[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarTotales();
  }, [programaId]);

  const cargarTotales = async () => {
    setLoading(true);
    try {
      const data = await ProgramaSemanalService.obtenerTotalesPrograma(programaId);
      setTotales(data);
    } catch (error) {
      console.error('Error al cargar totales:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerIconoPosicion = (posicion: number) => {
    switch (posicion) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-700" />;
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-gray-400 font-bold text-xl">#{posicion}</div>;
    }
  };

  const obtenerColorPosicion = (posicion: number) => {
    switch (posicion) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200';
    }
  };

  const calcularPromedio = (total: number, actividades: number) => {
    return actividades > 0 ? (total / actividades).toFixed(1) : '0';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold">🏆 Ranking de Patrullas</h2>
                <p className="text-yellow-100">{programaTema}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : totales.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay puntajes registrados aún</p>
              <p className="text-gray-400 text-sm mt-2">Registra puntajes en las actividades para ver el ranking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Podio Top 3 */}
              {totales.length >= 3 && (
                <div className="mb-8 flex items-end justify-center space-x-4 h-64">
                  {/* 2do Lugar */}
                  <div className="flex flex-col items-center" style={{ width: '180px' }}>
                    <Medal className="w-12 h-12 text-gray-400 mb-2" />
                    <div className="w-full bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg shadow-lg" style={{ height: '140px' }}>
                      <div className="p-4 text-center h-full flex flex-col justify-between">
                        <div>
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white"
                            style={{ backgroundColor: totales[1].color_patrulla || '#6B7280' }}
                          >
                            {totales[1].patrulla_nombre.charAt(0)}
                          </div>
                          <p className="font-bold text-white text-lg">{totales[1].patrulla_nombre}</p>
                        </div>
                        <div className="text-3xl font-bold text-white">{totales[1].total_puntaje}</div>
                      </div>
                    </div>
                    <div className="bg-gray-500 text-white px-4 py-2 rounded-b-lg w-full text-center font-bold">
                      2do Lugar
                    </div>
                  </div>

                  {/* 1er Lugar */}
                  <div className="flex flex-col items-center" style={{ width: '200px' }}>
                    <Trophy className="w-16 h-16 text-yellow-500 mb-2 animate-pulse" />
                    <div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg shadow-2xl" style={{ height: '180px' }}>
                      <div className="p-4 text-center h-full flex flex-col justify-between">
                        <div>
                          <div
                            className="w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white"
                            style={{ backgroundColor: totales[0].color_patrulla || '#6B7280' }}
                          >
                            {totales[0].patrulla_nombre.charAt(0)}
                          </div>
                          <p className="font-bold text-white text-xl">{totales[0].patrulla_nombre}</p>
                        </div>
                        <div className="text-4xl font-bold text-white">{totales[0].total_puntaje}</div>
                      </div>
                    </div>
                    <div className="bg-yellow-600 text-white px-4 py-2 rounded-b-lg w-full text-center font-bold">
                      🏆 CAMPEÓN
                    </div>
                  </div>

                  {/* 3er Lugar */}
                  <div className="flex flex-col items-center" style={{ width: '180px' }}>
                    <Award className="w-12 h-12 text-amber-700 mb-2" />
                    <div className="w-full bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg shadow-lg" style={{ height: '120px' }}>
                      <div className="p-4 text-center h-full flex flex-col justify-between">
                        <div>
                          <div
                            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-4 border-white"
                            style={{ backgroundColor: totales[2].color_patrulla || '#6B7280' }}
                          >
                            {totales[2].patrulla_nombre.charAt(0)}
                          </div>
                          <p className="font-bold text-white text-lg">{totales[2].patrulla_nombre}</p>
                        </div>
                        <div className="text-3xl font-bold text-white">{totales[2].total_puntaje}</div>
                      </div>
                    </div>
                    <div className="bg-amber-800 text-white px-4 py-2 rounded-b-lg w-full text-center font-bold">
                      3er Lugar
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla completa */}
              <div className="border rounded-lg overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Pos.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patrulla
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Actividades
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Promedio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {totales.map((total, index) => {
                      const posicion = index + 1;
                      return (
                        <tr
                          key={total.patrulla_id}
                          className={`hover:bg-gray-50 transition-colors ${posicion <= 3 ? 'bg-yellow-50/30' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {obtenerIconoPosicion(posicion)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                style={{ backgroundColor: total.color_patrulla || '#6B7280' }}
                              >
                                {total.patrulla_nombre.charAt(0)}
                              </div>
                              <div className="font-medium text-gray-900 text-lg">
                                {total.patrulla_nombre}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {total.total_puntaje}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-lg text-gray-700">
                              {total.actividades_participadas}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                              <TrendingUp className="w-4 h-4" />
                              <span>{calcularPromedio(total.total_puntaje, total.actividades_participadas)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {totales.reduce((sum, t) => sum + t.total_puntaje, 0)}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">Puntos Totales</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {totales.length}
                  </div>
                  <div className="text-sm text-green-700 mt-1">Patrullas Participantes</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {totales.length > 0 ? Math.max(...totales.map(t => t.actividades_participadas)) : 0}
                  </div>
                  <div className="text-sm text-purple-700 mt-1">Actividades Evaluadas</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
