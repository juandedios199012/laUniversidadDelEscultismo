import React, { useState, useEffect } from 'react';
import { X, User, FileText, Phone, MapPin, Briefcase, Shield } from 'lucide-react';
import { Familiar } from '../../types';

interface FamiliarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (familiar: Familiar) => void;
  familiar?: Familiar | null;
  title?: string;
}

const FamiliarModal: React.FC<FamiliarModalProps> = ({
  isOpen,
  onClose,
  onSave,
  familiar,
  title = 'Agregar Familiar'
}) => {
  const [formData, setFormData] = useState<Familiar>({
    nombres: '',
    apellidos: '',
    sexo: undefined,
    fecha_nacimiento: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    celular: '',
    celular_secundario: '',
    telefono: '',
    correo: '',
    correo_secundario: '',
    direccion: '',
    departamento: '',
    provincia: '',
    distrito: '',
    parentesco: 'PADRE',
    profesion: '',
    centro_laboral: '',
    cargo: '',
    es_contacto_emergencia: true,
    es_autorizado_recoger: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (familiar) {
      setFormData({
        ...familiar,
        sexo: familiar.sexo || undefined,
        tipo_documento: familiar.tipo_documento || 'DNI',
        fecha_nacimiento: familiar.fecha_nacimiento || '',
        numero_documento: familiar.numero_documento || '',
        celular_secundario: familiar.celular_secundario || '',
        telefono: familiar.telefono || '',
        correo_secundario: familiar.correo_secundario || '',
        direccion: familiar.direccion || '',
        departamento: familiar.departamento || '',
        provincia: familiar.provincia || '',
        distrito: familiar.distrito || '',
        profesion: familiar.profesion || '',
        centro_laboral: familiar.centro_laboral || '',
        cargo: familiar.cargo || '',
        es_contacto_emergencia: familiar.es_contacto_emergencia ?? true,
        es_autorizado_recoger: familiar.es_autorizado_recoger ?? true
      });
    }
  }, [familiar]);

  const handleChange = (field: keyof Familiar, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.celular.trim()) {
      newErrors.celular = 'Celular es obligatorio';
    } else if (!/^\d{9,15}$/.test(formData.celular.replace(/\s/g, ''))) {
      newErrors.celular = 'Celular debe tener entre 9 y 15 dígitos';
    }
    // Validar correo solo si se proporcionó
    if (formData.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'Correo electrónico inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      sexo: undefined,
      fecha_nacimiento: '',
      tipo_documento: 'DNI',
      numero_documento: '',
      celular: '',
      celular_secundario: '',
      telefono: '',
      correo: '',
      correo_secundario: '',
      direccion: '',
      departamento: '',
      provincia: '',
      distrito: '',
      parentesco: 'PADRE',
      profesion: '',
      centro_laboral: '',
      cargo: '',
      es_contacto_emergencia: true,
      es_autorizado_recoger: true
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            
            {/* Datos Básicos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                Datos Básicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => handleChange('nombres', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleChange('apellidos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo
                  </label>
                  <select
                    value={formData.sexo || ''}
                    onChange={(e) => handleChange('sexo', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento || ''}
                    onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parentesco <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.parentesco}
                    onChange={(e) => handleChange('parentesco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PADRE">Padre</option>
                    <option value="MADRE">Madre</option>
                    <option value="TUTOR">Tutor</option>
                    <option value="HERMANO">Hermano/a</option>
                    <option value="TIO">Tío/a</option>
                    <option value="ABUELO">Abuelo/a</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                Documentos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.tipo_documento || 'DNI'}
                    onChange={(e) => handleChange('tipo_documento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CARNET_EXTRANJERIA">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={formData.numero_documento || ''}
                    onChange={(e) => handleChange('numero_documento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-blue-600" />
                Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.celular}
                    onChange={(e) => handleChange('celular', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.celular ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="987654321"
                  />
                  {errors.celular && (
                    <p className="text-red-500 text-xs mt-1">{errors.celular}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular 2
                  </label>
                  <input
                    type="tel"
                    value={formData.celular_secundario || ''}
                    onChange={(e) => handleChange('celular_secundario', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="987654321"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo 1
                  </label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => handleChange('correo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.correo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.correo && (
                    <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Secundario
                  </label>
                  <input
                    type="email"
                    value={formData.correo_secundario || ''}
                    onChange={(e) => handleChange('correo_secundario', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="correo.alternativo@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                Ubicación
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion || ''}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Av. Principal 123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.departamento || ''}
                      onChange={(e) => handleChange('departamento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={formData.provincia || ''}
                      onChange={(e) => handleChange('provincia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distrito
                    </label>
                    <input
                      type="text"
                      value={formData.distrito || ''}
                      onChange={(e) => handleChange('distrito', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Información Laboral
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesión
                  </label>
                  <input
                    type="text"
                    value={formData.profesion || ''}
                    onChange={(e) => handleChange('profesion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingeniero, Doctor, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Centro Laboral
                  </label>
                  <input
                    type="text"
                    value={formData.centro_laboral || ''}
                    onChange={(e) => handleChange('centro_laboral', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Empresa ABC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo || ''}
                    onChange={(e) => handleChange('cargo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Gerente, Analista, etc."
                  />
                </div>
              </div>
            </div>

            {/* Permisos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                Permisos y Autorizaciones
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.es_contacto_emergencia}
                    onChange={(e) => handleChange('es_contacto_emergencia', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Contacto de emergencia</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.es_autorizado_recoger}
                    onChange={(e) => handleChange('es_autorizado_recoger', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Autorizado para recoger al scout</span>
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Familiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamiliarModal;
