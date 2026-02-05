import React, { useState, useEffect } from 'react';
import ScoutService from '../../services/scoutService';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { Scout } from '../../lib/supabase';

interface EditarScoutModalProps {
  scout: Scout | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EditarScoutModal: React.FC<EditarScoutModalProps> = ({
  scout,
  isOpen,
  onClose,
  onSaved
}) => {
  const { puedeEditar } = usePermissions();
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    sexo: '' as 'MASCULINO' | 'FEMENINO' | '',
    celular: '',
    correo: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    centro_estudio: '',
    ocupacion: '',
    centro_laboral: '',
    rama_actual: '',
    estado: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del scout cuando se abre el modal
  useEffect(() => {
    if (scout && isOpen) {
      setFormData({
        nombres: scout.nombres || '',
        apellidos: scout.apellidos || '',
        sexo: scout.sexo || '',
        celular: scout.celular || '',
        correo: scout.correo || '',
        departamento: scout.departamento || '',
        provincia: scout.provincia || '',
        distrito: scout.distrito || '',
        direccion: scout.direccion || '',
        centro_estudio: scout.centro_estudio || '',
        ocupacion: scout.ocupacion || '',
        centro_laboral: scout.centro_laboral || '',
        rama_actual: scout.rama_actual || '',
        estado: scout.estado || ''
      });
      setError(null);
    }
  }, [scout, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = (): string | null => {
    if (!formData.nombres.trim()) return 'Los nombres son obligatorios';
    if (!formData.apellidos.trim()) return 'Los apellidos son obligatorios';
    if (!formData.sexo) return 'El sexo es obligatorio';
    if (formData.correo && !isValidEmail(formData.correo)) {
      return 'El formato del correo electrónico no es válido';
    }
    return null;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scout) return;

    // Verificar permiso de edición
    if (!puedeEditar('scouts')) {
      setError('No tienes permiso para editar scouts');
      return;
    }

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updates = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        sexo: formData.sexo || undefined,
        celular: formData.celular?.trim() || undefined,
        correo: formData.correo?.trim() || undefined,
        departamento: formData.departamento?.trim() || undefined,
        provincia: formData.provincia?.trim() || undefined,
        distrito: formData.distrito?.trim() || undefined,
        direccion: formData.direccion?.trim() || undefined,
        centro_estudio: formData.centro_estudio?.trim() || undefined,
        ocupacion: formData.ocupacion?.trim() || undefined,
        centro_laboral: formData.centro_laboral?.trim() || undefined,
        rama_actual: formData.rama_actual || undefined,
        estado: formData.estado || undefined
      };

      const result = await ScoutService.updateScout(scout.id, updates);
      
      if (result.success) {
        onSaved();
        onClose();
      } else {
        setError(result.error || 'Error al actualizar el scout');
      }
    } catch (error) {
      console.error('Error al actualizar scout:', error);
      setError('Error al actualizar el scout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              ✏️ Editar Scout: {scout?.nombres} {scout?.apellidos}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              ❌ {error}
            </div>
          )}

          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="text-lg font-medium text-gray-900 col-span-full border-b pb-2">
              👤 Datos Personales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres *
              </label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo *
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rama
              </label>
              <select
                name="rama_actual"
                value={formData.rama_actual}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
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
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="text-lg font-medium text-gray-900 col-span-full border-b pb-2">
              📞 Contacto
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celular
              </label>
              <input
                type="tel"
                name="celular"
                value={formData.celular}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <h3 className="text-lg font-medium text-gray-900 col-span-full border-b pb-2">
              📍 Ubicación
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <input
                type="text"
                name="provincia"
                value={formData.provincia}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distrito
              </label>
              <input
                type="text"
                name="distrito"
                value={formData.distrito}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Datos adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="text-lg font-medium text-gray-900 col-span-full border-b pb-2">
              🎓 Datos Adicionales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Centro de Estudio
              </label>
              <input
                type="text"
                name="centro_estudio"
                value={formData.centro_estudio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ocupación
              </label>
              <input
                type="text"
                name="ocupacion"
                value={formData.ocupacion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Centro Laboral
              </label>
              <input
                type="text"
                name="centro_laboral"
                value={formData.centro_laboral}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarScoutModal;