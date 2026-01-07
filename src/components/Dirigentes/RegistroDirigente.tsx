import { useState, useEffect } from 'react';
import { 
  Shield, Save, UserPlus, Users, Search, Edit, Eye, 
  Phone, Mail, MapPin, Calendar, Award, Trash2, CheckCircle,
  AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Scout {
  id: string;
  persona_id: string;
  codigo_scout: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  numero_documento: string;
  celular?: string;
  correo?: string;
  rama_actual?: string;
}

interface Dirigente {
  dirigente_id: string;
  persona_id: string;
  numero_credencial: string;
  cargo: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  celular?: string;
  correo?: string;
  fecha_inicio_dirigente: string;
  especialidades: string[];
  certificaciones: string[];
  estado: string;
  es_ex_scout: boolean;
  ramas_asignadas: Array<{
    rama: string;
    es_responsable_principal: boolean;
    fecha_inicio: string;
  }>;
}

export default function RegistroDirigente() {
  // Estados principales
  const [tipoRegistro, setTipoRegistro] = useState<'scout' | 'externo'>('scout');
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Para promoción de scout
    scout_id: '',
    
    // Para dirigente externo
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: 'MASCULINO' as 'MASCULINO' | 'FEMENINO',
    tipo_documento: 'DNI' as 'DNI' | 'CARNET_EXTRANJERIA' | 'PASAPORTE',
    numero_documento: '',
    celular: '',
    correo: '',
    direccion: '',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: '',
    
    // Datos del dirigente
    cargo: 'DIRIGENTE' as string,
    numero_credencial: '',
    fecha_inicio_dirigente: new Date().toISOString().split('T')[0],
    ramas_asignadas: [] as string[],
    es_responsable_principal: false,
    especialidades: '',
    certificaciones: '',
    observaciones: ''
  });

  // Opciones
  const cargoOptions = [
    { value: 'JEFE_GRUPO', label: 'Jefe de Grupo' },
    { value: 'JEFE_RAMA', label: 'Jefe de Rama' },
    { value: 'SUBJEFE_RAMA', label: 'Subjefe de Rama' },
    { value: 'ASESOR', label: 'Asesor' },
    { value: 'DIRIGENTE', label: 'Dirigente' },
    { value: 'COMITE_GRUPO', label: 'Comité de Grupo' }
  ];

  const ramaOptions = [
    { value: 'Manada', label: '🐺 Manada' },
    { value: 'Tropa', label: '🦅 Tropa' },
    { value: 'Caminantes', label: '🥾 Caminantes' },
    { value: 'Clan', label: '⛰️ Clan' }
  ];

  // Efectos
  useEffect(() => {
    cargarScouts();
    cargarDirigentes();
  }, []);

  // ================================================================
  // FUNCIONES DE CARGA
  // ================================================================

  const cargarScouts = async () => {
    try {
      const { data, error } = await supabase
        .from('scouts')
        .select(`
          id,
          persona_id,
          codigo_scout,
          rama_actual,
          personas!inner (
            nombres,
            apellidos,
            fecha_nacimiento,
            numero_documento,
            celular,
            correo
          )
        `)
        .eq('estado', 'ACTIVO')
        .order('personas(apellidos)');

      if (error) throw error;

      const scoutsFormateados = data?.map((s: any) => ({
        id: s.id,
        persona_id: s.persona_id,
        codigo_scout: s.codigo_scout,
        nombres: s.personas.nombres,
        apellidos: s.personas.apellidos,
        fecha_nacimiento: s.personas.fecha_nacimiento,
        numero_documento: s.personas.numero_documento,
        celular: s.personas.celular,
        correo: s.personas.correo,
        rama_actual: s.rama_actual
      })) || [];

      setScouts(scoutsFormateados);
    } catch (err: any) {
      console.error('Error al cargar scouts:', err);
    }
  };

  const cargarDirigentes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dirigentes')
        .select(`
          id,
          persona_id,
          cargo,
          numero_credencial,
          fecha_inicio_dirigente,
          especialidades,
          certificaciones,
          estado,
          personas!inner (
            nombres,
            apellidos,
            tipo_documento,
            numero_documento,
            celular,
            correo
          )
        `)
        .eq('estado', 'ACTIVO')
        .order('personas(apellidos)');

      if (error) throw error;

      const dirigentesFormateados = data?.map((d: any) => ({
        dirigente_id: d.id,
        persona_id: d.persona_id,
        numero_credencial: d.numero_credencial,
        cargo: d.cargo,
        nombres: d.personas.nombres,
        apellidos: d.personas.apellidos,
        nombre_completo: `${d.personas.nombres} ${d.personas.apellidos}`,
        tipo_documento: d.personas.tipo_documento,
        numero_documento: d.personas.numero_documento,
        celular: d.personas.celular,
        correo: d.personas.correo,
        fecha_inicio_dirigente: d.fecha_inicio_dirigente,
        especialidades: d.especialidades || [],
        certificaciones: d.certificaciones || [],
        estado: d.estado,
        es_ex_scout: false,
        ramas_asignadas: []
      })) || [];

      setDirigentes(dirigentesFormateados);
    } catch (err: any) {
      console.error('Error al cargar dirigentes:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // FUNCIONES DE REGISTRO
  // ================================================================

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const especialidadesArray = formData.especialidades
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

      const certificacionesArray = formData.certificaciones
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const params = tipoRegistro === 'scout' 
        ? {
            p_scout_id: formData.scout_id,
            p_cargo: formData.cargo,
            p_numero_credencial: formData.numero_credencial || null,
            p_fecha_inicio_dirigente: formData.fecha_inicio_dirigente,
            p_ramas_asignadas: formData.ramas_asignadas,
            p_es_responsable_principal: formData.es_responsable_principal,
            p_especialidades: especialidadesArray,
            p_certificaciones: certificacionesArray,
            p_observaciones: formData.observaciones || null
          }
        : {
            p_datos_persona: {
              nombres: formData.nombres,
              apellidos: formData.apellidos,
              fecha_nacimiento: formData.fecha_nacimiento,
              sexo: formData.sexo,
              tipo_documento: formData.tipo_documento,
              numero_documento: formData.numero_documento,
              celular: formData.celular,
              correo: formData.correo,
              direccion: formData.direccion,
              departamento: formData.departamento,
              provincia: formData.provincia,
              distrito: formData.distrito
            },
            p_cargo: formData.cargo,
            p_numero_credencial: formData.numero_credencial || null,
            p_fecha_inicio_dirigente: formData.fecha_inicio_dirigente,
            p_ramas_asignadas: formData.ramas_asignadas,
            p_es_responsable_principal: formData.es_responsable_principal,
            p_especialidades: especialidadesArray,
            p_certificaciones: certificacionesArray,
            p_observaciones: formData.observaciones || null
          };

      const { data, error: rpcError } = await supabase.rpc('api_registrar_dirigente', params);

      if (rpcError) throw rpcError;

      if (data.success) {
        setSuccess('✅ Dirigente registrado exitosamente');
        setMostrarFormulario(false);
        resetForm();
        await cargarDirigentes();
        await cargarScouts();
      } else {
        setError(data.error || 'Error al registrar dirigente');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar dirigente');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      scout_id: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      sexo: 'MASCULINO',
      tipo_documento: 'DNI',
      numero_documento: '',
      celular: '',
      correo: '',
      direccion: '',
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: '',
      cargo: 'DIRIGENTE',
      numero_credencial: '',
      fecha_inicio_dirigente: new Date().toISOString().split('T')[0],
      ramas_asignadas: [],
      es_responsable_principal: false,
      especialidades: '',
      certificaciones: '',
      observaciones: ''
    });
  };

  const handleToggleRama = (rama: string) => {
    setFormData(prev => ({
      ...prev,
      ramas_asignadas: prev.ramas_asignadas.includes(rama)
        ? prev.ramas_asignadas.filter(r => r !== rama)
        : [...prev.ramas_asignadas, rama]
    }));
  };

  // Filtrado
  const dirigentesFiltrados = dirigentes.filter(d =>
    d.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.numero_credencial.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.numero_documento.includes(busqueda)
  );

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-orange-500" />
                Registro de Dirigentes
              </h1>
              <p className="text-gray-600 mt-2">Gestión completa de dirigentes del grupo scout</p>
            </div>
            <button
              onClick={() => {
                setMostrarFormulario(!mostrarFormulario);
                if (!mostrarFormulario) resetForm();
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              {mostrarFormulario ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {mostrarFormulario ? 'Cancelar' : 'Nuevo Dirigente'}
            </button>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          )}
        </div>

        {/* Formulario de Registro */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <form onSubmit={handleRegistrar}>
              
              {/* Selector de Tipo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Registro *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoRegistro('scout')}
                    className={`p-4 rounded-lg border-2 transition ${
                      tipoRegistro === 'scout'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Promover Scout
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Scout existente que será dirigente</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTipoRegistro('externo')}
                    className={`p-4 rounded-lg border-2 transition ${
                      tipoRegistro === 'externo'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Dirigente Externo
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Nueva persona que nunca fue scout</div>
                  </button>
                </div>
              </div>

              {/* Formulario según tipo */}
              {tipoRegistro === 'scout' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Scout *
                  </label>
                  <select
                    value={formData.scout_id}
                    onChange={(e) => setFormData({ ...formData, scout_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Seleccionar scout...</option>
                    {scouts.map((scout) => (
                      <option key={scout.id} value={scout.id}>
                        {scout.nombres} {scout.apellidos} - {scout.codigo_scout} ({scout.rama_actual})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value as any })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="DNI">DNI</option>
                      <option value="CARNET_EXTRANJERIA">Carné de Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Documento *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sexo *
                    </label>
                    <select
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Datos del Dirigente (común para ambos) */}
              <div className="bg-orange-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Información de Dirigente
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo *
                    </label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      {cargoOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_inicio_dirigente}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio_dirigente: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° Credencial (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.numero_credencial}
                      onChange={(e) => setFormData({ ...formData, numero_credencial: e.target.value })}
                      placeholder="Se genera automáticamente"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ramas Asignadas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ramaOptions.map((rama) => (
                        <label key={rama.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border cursor-pointer hover:bg-orange-50">
                          <input
                            type="checkbox"
                            checked={formData.ramas_asignadas.includes(rama.value)}
                            onChange={() => handleToggleRama(rama.value)}
                            className="rounded text-orange-500"
                          />
                          <span className="text-sm">{rama.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.es_responsable_principal}
                        onChange={(e) => setFormData({ ...formData, es_responsable_principal: e.target.checked })}
                        className="rounded text-orange-500"
                      />
                      Es responsable principal de la(s) rama(s)
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidades (separadas por coma)
                    </label>
                    <input
                      type="text"
                      value={formData.especialidades}
                      onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                      placeholder="Ej: Primeros Auxilios, Campismo, Administración"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificaciones (separadas por coma)
                    </label>
                    <input
                      type="text"
                      value={formData.certificaciones}
                      onChange={(e) => setFormData({ ...formData, certificaciones: e.target.value })}
                      placeholder="Ej: Formación Básica Scout, Seguridad y Protección"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>Registrando...</>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Registrar Dirigente
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Dirigentes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-500" />
              Dirigentes Registrados ({dirigentesFiltrados.length})
            </h2>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar dirigente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-transparent border-none outline-none w-64"
              />
            </div>
          </div>

          {loading && <p className="text-gray-600">Cargando dirigentes...</p>}

          {!loading && dirigentesFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay dirigentes registrados</p>
            </div>
          )}

          <div className="space-y-4">
            {dirigentesFiltrados.map((dirigente) => (
              <div
                key={dirigente.dirigente_id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dirigente.nombre_completo}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {dirigente.numero_credencial} • {dirigente.cargo}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {dirigente.celular || 'Sin teléfono'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {dirigente.correo || 'Sin correo'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Desde: {new Date(dirigente.fecha_inicio_dirigente).toLocaleDateString()}
                      </div>
                    </div>

                    {dirigente.especialidades.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <div className="flex flex-wrap gap-2">
                          {dirigente.especialidades.map((esp, idx) => (
                            <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                              {esp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-blue-50 rounded-lg transition">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-green-50 rounded-lg transition">
                      <Edit className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
