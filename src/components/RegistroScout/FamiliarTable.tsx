import React from 'react';
import { Edit2, Trash2, UserPlus, Phone, Mail } from 'lucide-react';
import { Familiar } from '../../types';

interface FamiliarTableProps {
  familiares: Familiar[];
  onEdit: (familiar: Familiar, index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

const FamiliarTable: React.FC<FamiliarTableProps> = ({
  familiares,
  onEdit,
  onDelete,
  onAdd
}) => {
  const getParentescoLabel = (parentesco: string): string => {
    const labels: Record<string, string> = {
      'PADRE': 'Padre',
      'MADRE': 'Madre',
      'TUTOR': 'Tutor/a',
      'HERMANO': 'Hermano/a',
      'TIO': 'Tío/a',
      'ABUELO': 'Abuelo/a',
      'OTRO': 'Otro'
    };
    return labels[parentesco] || parentesco;
  };

  return (
    <div className="space-y-4">
      {/* Header con botón */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Familiares Registrados ({familiares.length})
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Familiar
        </button>
      </div>

      {/* Tabla o mensaje vacío */}
      {familiares.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay familiares registrados</p>
          <p className="text-sm text-gray-500 mb-4">
            Agrega al menos un familiar (padre, madre o tutor) para el scout
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Primer Familiar
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parentesco
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profesión
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {familiares.map((familiar, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {familiar.nombres} {familiar.apellidos}
                        </div>
                        {familiar.numero_documento && (
                          <div className="text-xs text-gray-500">
                            {familiar.tipo_documento || 'DNI'}: {familiar.numero_documento}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getParentescoLabel(familiar.parentesco)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 space-y-1">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{familiar.celular}</span>
                      </div>
                      {familiar.correo && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 truncate max-w-[150px]">
                            {familiar.correo}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {familiar.profesion || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <div className="space-y-1">
                      {familiar.es_contacto_emergencia && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          Emergencia
                        </span>
                      )}
                      {familiar.es_autorizado_recoger && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Autorizado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(familiar, index)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Está seguro de eliminar este familiar?')) {
                            onDelete(index);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info adicional */}
      {familiares.length > 0 && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
            Emergencia
          </span>
          <span>= Contacto de emergencia</span>
          <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            Autorizado
          </span>
          <span>= Autorizado para recoger al scout</span>
        </div>
      )}
    </div>
  );
};

export default FamiliarTable;
