import { useState } from 'react';
import { UserPlus, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import ScoutService from '../../services/scoutService';

interface FormData {
  nombres: string;
  apellidos: string;
  sexo: 'M' | 'F' | '';
  fecha_nacimiento: string;
  tipo_documento: string;
  numero_documento: string;
  rama_actual: string;
  // Datos del familiar/apoderado
  familiar_nombres: string;
  familiar_apellidos: string;
  familiar_telefono: string;
}

interface RegistroScoutRapidoProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistroScoutRapido({ onClose, onSuccess }: RegistroScoutRapidoProps) {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    sexo: '',
    fecha_nacimiento: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    rama_actual: '',
    familiar_nombres: '',
    familiar_apellidos: '',
    familiar_telefono: ''
  });

  const ramas = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

  const validarPaso1 = (): boolean => {
    if (!formData.nombres.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.apellidos.trim()) {
      setError('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.sexo) {
      setError('Selecciona el sexo');
      return false;
    }
    if (!formData.fecha_nacimiento) {
      setError('La fecha de nacimiento es obligatoria');
      return false;
    }
    setError('');
    return true;
  };

  const validarPaso2 = (): boolean => {
    if (!formData.rama_actual) {
      setError('Selecciona la rama');
      return false;
    }
    setError('');
    return true;
  };

  const handleSiguiente = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2);
    } else if (paso === 2 && validarPaso2()) {
      setPaso(3);
    } else if (paso === 3) {
      setPaso(4); // Sin validación, opcional
    }
  };

  const handleRegistrar = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Preparar datos para el servicio (formato web)
      const datosCompletos: any = {
        // Datos personales
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento,
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento.trim() || undefined,
        
        // Datos scout
        rama_actual: formData.rama_actual,
        estado: 'ACTIVO' as const,
        es_dirigente: false,
        fecha_ingreso: new Date().toISOString().split('T')[0], // Hoy
        
        // Valores por defecto
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Lima'
      };

      // Agregar datos del familiar solo si se completaron
      if (formData.familiar_nombres.trim() && formData.familiar_apellidos.trim()) {
        datosCompletos.familiar_nombres = formData.familiar_nombres.trim();
        datosCompletos.familiar_apellidos = formData.familiar_apellidos.trim();
        datosCompletos.parentesco = 'PADRE';
        if (formData.familiar_telefono.trim()) {
          datosCompletos.familiar_telefono = formData.familiar_telefono.trim();
        }
      }

      const result = await ScoutService.createScout(datosCompletos);
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Error al registrar el scout');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-6 h-6" />
              <h2 className="text-lg font-bold">Registro Rápido</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
          <div className="text-sm text-blue-100">
            Paso {paso} de 4
          </div>
          <div className="flex space-x-1 mt-2">
            <div className={`h-1 flex-1 rounded ${paso >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 flex-1 rounded ${paso >= 2 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 flex-1 rounded ${paso >= 3 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1 flex-1 rounded ${paso >= 4 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Contenido */}
        <div className="p-4">
          {/* PASO 1: Datos Personales */}
          {paso === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                👤 Datos Personales
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: Juan Carlos"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: Pérez García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, sexo: 'M' })}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.sexo === 'M'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    👦 Masculino
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, sexo: 'F' })}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.sexo === 'F'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    👧 Femenino
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: 12345678"
                  maxLength={8}
                />
              </div>
            </div>
          )}

          {/* PASO 2: Datos Scout */}
          {paso === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                ⚜️ Datos Scout
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ramas.map(rama => (
                    <button
                      key={rama}
                      onClick={() => setFormData({ ...formData, rama_actual: rama })}
                      className={`p-4 rounded-lg border-2 font-medium transition-all ${
                        formData.rama_actual === rama
                          ? rama === 'Manada' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                            rama === 'Tropa' ? 'border-green-500 bg-green-50 text-green-700' :
                            rama === 'Comunidad' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                            'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {rama}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Estado:</strong> ACTIVO (automático)
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  El scout será registrado como activo y podrá participar inmediatamente.
                </p>
              </div>
            </div>
          )}

          {/* PASO 3: Datos del Apoderado */}
          {paso === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3">
                👨‍👩‍👧‍👦 Datos del Apoderado (Opcional)
              </h3>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Opcional:</strong> Puedes registrar el apoderado ahora o agregarlo después desde la web.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres del Apoderado
                </label>
                <input
                  type="text"
                  value={formData.familiar_nombres}
                  onChange={(e) => setFormData({ ...formData, familiar_nombres: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: María Rosa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos del Apoderado
                </label>
                <input
                  type="text"
                  value={formData.familiar_apellidos}
                  onChange={(e) => setFormData({ ...formData, familiar_apellidos: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: García López"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono del Apoderado
                </label>
                <input
                  type="tel"
                  value={formData.familiar_telefono}
                  onChange={(e) => setFormData({ ...formData, familiar_telefono: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Ej: 987654321"
                  maxLength={9}
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Por defecto se registrará como "Padre/Madre". Puedes editar el parentesco después desde la web.
                </p>
              </div>
            </div>
          )}

          {/* PASO 4: Confirmación */}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  Confirmar Registro
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Revisa los datos antes de registrar
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Nombre Completo</p>
                  <p className="font-semibold text-gray-800">
                    {formData.nombres} {formData.apellidos}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Sexo</p>
                    <p className="font-semibold text-gray-800">
                      {formData.sexo === 'M' ? '👦 Masculino' : '👧 Femenino'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha Nac.</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(formData.fecha_nacimiento).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>

                {formData.numero_documento && (
                  <div>
                    <p className="text-xs text-gray-500">Documento</p>
                    <p className="font-semibold text-gray-800">
                      {formData.tipo_documento}: {formData.numero_documento}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500">Rama</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    formData.rama_actual === 'Manada' ? 'bg-yellow-100 text-yellow-800' :
                    formData.rama_actual === 'Tropa' ? 'bg-green-100 text-green-800' :
                    formData.rama_actual === 'Comunidad' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {formData.rama_actual}
                  </span>
                </div>

                {(formData.familiar_nombres || formData.familiar_apellidos) && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-gray-500 mb-2">Apoderado</p>
                    <p className="font-semibold text-gray-800">
                      {formData.familiar_nombres} {formData.familiar_apellidos}
                    </p>
                    {formData.familiar_telefono && (
                      <p className="text-sm text-gray-600 mt-1">
                        📱 {formData.familiar_telefono}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Tip:</strong> Los datos adicionales (dirección, email, etc.) se pueden completar después desde la web.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2">
          <div className="flex space-x-2">
            {paso > 1 && (
              <button
                onClick={() => setPaso((paso - 1) as 1 | 2 | 3 | 4)}
                className="flex-1 flex items-center justify-center space-x-2 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>
            )}

            {paso < 4 ? (
              <button
                onClick={handleSiguiente}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg active:scale-95 transition-transform"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleRegistrar}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? '⏳ Registrando...' : '✅ Registrar Scout'}
              </button>
            )}
          </div>

          {paso === 1 && (
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-600 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
