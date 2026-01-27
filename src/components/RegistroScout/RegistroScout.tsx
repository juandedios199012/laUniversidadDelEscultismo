import { useState, useEffect } from 'react';
import { 
  UserCheck, Save, FileText, 
  User, Heart, Users, Flag, ChevronDown, ChevronUp, Plus,
  AlertCircle, Search, Edit, Eye, Phone, Mail, Activity, Church
} from 'lucide-react';
import ScoutService from '../../services/scoutService';
import { supabase } from '../../lib/supabase';
import type { Scout } from '../../lib/supabase';
import type { Familiar } from '../../types';
import FamiliarModal from './FamiliarModal';
import FamiliarTable from './FamiliarTable';
import PatrullaSelector from './PatrullaSelector';
import CargoPatrullaSelector from './CargoPatrullaSelector';
import type { CargoPatrulla } from '../../types/patrulla';

interface FormularioScout {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: 'MASCULINO' | 'FEMENINO' | '';
  numero_documento: string;
  tipo_documento: string;
  celular: string;
  celular_secundario: string;
  telefono: string;
  correo: string;
  correo_secundario: string;
  correo_institucional: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  codigo_postal: string;
  centro_estudio: string;
  anio_estudios: string;
  ocupacion: string;
  centro_laboral: string;
  es_dirigente: boolean;
  rama_actual: string;
  rama: string;
  codigo_asociado: string;
  religion: string;
  grupo_sanguineo: string;
  factor_sanguineo: string;
  seguro_medico: string;
  tipo_discapacidad: string;
  carnet_conadis: string;
  descripcion_discapacidad: string;
  fecha_ingreso: string;
  patrulla_id: string | null;  // Nueva propiedad para asociación de patrulla
  cargo_patrulla: CargoPatrulla;  // Cargo dentro de la patrulla
}

export default function RegistroScout() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [scoutSeleccionado, setScoutSeleccionado] = useState<Scout | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [familiarModal, setFamiliarModal] = useState<{
    isOpen: boolean;
    familiar: Familiar | null;
    index: number | null;
  }>({ isOpen: false, familiar: null, index: null });

  const [formData, setFormData] = useState<FormularioScout>({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    numero_documento: '',
    tipo_documento: 'DNI',
    celular: '',
    celular_secundario: '',
    telefono: '',
    correo: '',
    correo_secundario: '',
    correo_institucional: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    codigo_postal: '',
    centro_estudio: '',
    anio_estudios: '',
    ocupacion: '',
    centro_laboral: '',
    es_dirigente: false,
    rama_actual: '',
    rama: '',
    codigo_asociado: '',
    religion: '',
    grupo_sanguineo: '',
    factor_sanguineo: '',
    seguro_medico: '',
    tipo_discapacidad: '',
    carnet_conadis: '',
    descripcion_discapacidad: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    patrulla_id: null,  // Inicializar patrulla
    cargo_patrulla: 'MIEMBRO'  // Cargo por defecto
  });

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    datosPersonales: true,
    datosContacto: false,
    datosEducacion: false,
    datosReligiosos: false,
    datosSalud: false,
    datosFamiliares: false,
    datosScout: false
  });

  // Opciones para selects
  const tipoDocumentoOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de Extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];

  // parentescoOptions ahora se define en FamiliarModal
  // const parentescoOptions = [
  //   { value: 'padre', label: 'Padre' },
  //   { value: 'madre', label: 'Madre' },
  //   { value: 'tutor', label: 'Tutor/a' },
  //   { value: 'hermano', label: 'Hermano/a' },
  //   { value: 'abuelo', label: 'Abuelo/a' },
  //   { value: 'tio', label: 'Tío/a' },
  //   { value: 'otro', label: 'Otro' }
  // ];

  const ramaOptions = [
    { value: 'Manada', label: '🐺 Manada (7-10 años)' },
    { value: 'Tropa', label: '🦅 Tropa (11-14 años)' },
    { value: 'Caminantes', label: '🏕️ Caminantes (15-17 años)' },
    { value: 'Clan', label: '🥾 Clan (18-21 años)' },
    { value: 'Dirigentes', label: '👨‍🏫 Dirigentes (22+ años)' }
  ];

  const grupoSanguineoOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'AB', label: 'AB' },
    { value: 'O', label: 'O' }
  ];

  const factorSanguineoOptions = [
    { value: 'POSITIVO', label: 'Positivo (+)' },
    { value: 'NEGATIVO', label: 'Negativo (-)' }
  ];

  // Funciones de manejo de familiares
  const handleAgregarFamiliar = () => {
    setFamiliarModal({ isOpen: true, familiar: null, index: null });
  };

  const handleEditarFamiliar = (familiar: Familiar, index: number) => {
    setFamiliarModal({ isOpen: true, familiar, index });
  };

  const handleEliminarFamiliar = (index: number) => {
    if (familiares.length === 1) {
      alert('Debe haber al menos un familiar responsable registrado');
      return;
    }
    setFamiliares(familiares.filter((_, i) => i !== index));
  };

  const handleGuardarFamiliar = (familiar: Familiar) => {
    if (familiarModal.index !== null) {
      // Editar familiar existente
      const nuevosFamiliares = [...familiares];
      nuevosFamiliares[familiarModal.index] = familiar;
      setFamiliares(nuevosFamiliares);
    } else {
      // Agregar nuevo familiar
      setFamiliares([...familiares, familiar]);
    }
    setFamiliarModal({ isOpen: false, familiar: null, index: null });
  };

  // Efectos
  useEffect(() => {
    cargarScouts();
  }, []);

  useEffect(() => {
    // Cargar estadísticas después de que se carguen los scouts
    if (scouts.length >= 0) {
      cargarEstadisticas();
    }
  }, [scouts.length]);

  useEffect(() => {
    if (busqueda.trim()) {
      buscarScouts(busqueda);
    } else {
      cargarScouts();
    }
  }, [busqueda]);

  // Funciones de carga de datos
  const cargarScouts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Iniciando carga de scouts...');
      
      const data = await ScoutService.getAllScouts();
      console.log('📊 Datos recibidos:', data);
      
      setScouts(data);
      
      if (data.length === 0) {
        console.log('⚠️ No se encontraron scouts en la base de datos');
      }
    } catch (error) {
      console.error('❌ Error al cargar scouts:', error);
      setError('Error al cargar la lista de scouts. Verifica la conexión a la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const buscarScouts = async (query: string) => {
    try {
      setLoading(true);
      const data = await ScoutService.searchScouts(query);
      setScouts(data);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setError('Error al buscar scouts');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      console.log('📊 Cargando estadísticas del dashboard...');
      
      // Primero intentar limpiar cache expirado
      try {
        await ScoutService.limpiarCacheDashboard();
      } catch (error) {
        console.log('⚠️ No se pudo limpiar cache, continuando...');
      }
      
      const data = await ScoutService.getEstadisticasGrupo();
      console.log('📊 Estadísticas recibidas:', data);
      
      // Función helper para calcular nuevos en los últimos 12 meses
      const calcularNuevosAño = () => {
        const hace12Meses = new Date();
        hace12Meses.setFullYear(hace12Meses.getFullYear() - 1);
        
        // DEBUG: Ver qué scouts se están contando
        const nuevos = scouts.filter(s => {
          if (s.estado !== 'ACTIVO') return false;
          const fechaIngreso = s.fecha_ingreso || s.created_at;
          if (!fechaIngreso) return false;
          const esNuevo = new Date(fechaIngreso) >= hace12Meses;
          if (!esNuevo) {
            console.log(`❌ NO cuenta: ${s.nombres} ${s.apellidos} - fecha_ingreso: ${s.fecha_ingreso}, created_at: ${s.created_at}`);
          }
          return esNuevo;
        });
        
        console.log(`📊 Nuevos (últimos 12 meses desde ${hace12Meses.toISOString()}): ${nuevos.length}`);
        return nuevos.length;
      };

      // Si los datos vienen del cache pero parecen desactualizados, usar contador manual
      if (data && data.scouts && scouts.length > 0 && data.scouts.total !== scouts.length) {
        console.log('🔄 Datos del cache desactualizados, usando conteo manual');
        const estadisticasActualizadas = {
          ...data,
          scouts: {
            ...data.scouts,
            total: scouts.length,
            activos: scouts.filter(s => s.estado === 'ACTIVO').length,
            nuevos_año: calcularNuevosAño()
          }
        };
        setEstadisticas(estadisticasActualizadas);
      } else {
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      
      // Fallback: calcular estadísticas localmente si hay scouts cargados
      if (scouts.length > 0) {
        console.log('📊 Calculando estadísticas localmente...');
        
        // Calcular nuevos en los últimos 12 meses
        const hace12Meses = new Date();
        hace12Meses.setFullYear(hace12Meses.getFullYear() - 1);
        const nuevosEsteAño = scouts.filter(s => {
          if (s.estado !== 'ACTIVO') return false;
          const fechaIngreso = s.fecha_ingreso || s.created_at;
          if (!fechaIngreso) return false;
          return new Date(fechaIngreso) >= hace12Meses;
        }).length;
        
        const estadisticasLocal = {
          scouts: {
            total: scouts.length,
            activos: scouts.filter(s => s.estado === 'ACTIVO').length,
            nuevos_año: nuevosEsteAño,
            dirigentes: scouts.filter(s => s.estado === 'ACTIVO' && s.es_dirigente).length,
            por_rama: scouts.reduce((acc, scout) => {
              const rama = scout.rama_actual || 'Sin rama';
              acc[rama] = (acc[rama] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          actividades: { planificadas: 0, en_curso: 0, este_mes: 0 },
          inventario: { items_disponibles: 0, stock_bajo: 0, valor_total: 0 }
        };
        setEstadisticas(estadisticasLocal);
      }
    }
  };

  // Funciones del formulario
  const toggleSeccion = (seccion: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
  };

  const handleInputChange = (field: keyof FormularioScout, value: string | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      sexo: '',
      numero_documento: '',
      tipo_documento: 'DNI',
      celular: '',
      celular_secundario: '',
      telefono: '',
      correo: '',
      correo_secundario: '',
      correo_institucional: '',
      departamento: '',
      provincia: '',
      distrito: '',
      direccion: '',
      codigo_postal: '',
      centro_estudio: '',
      anio_estudios: '',
      ocupacion: '',
      centro_laboral: '',
      es_dirigente: false,
      rama_actual: '',
      rama: '',
      codigo_asociado: '',
      religion: '',
      grupo_sanguineo: '',
      factor_sanguineo: '',
      seguro_medico: '',
      tipo_discapacidad: '',
      carnet_conadis: '',
      descripcion_discapacidad: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      patrulla_id: null,  // Limpiar patrulla
      cargo_patrulla: 'MIEMBRO'  // Resetear cargo
    });
    setFamiliares([]);
    setModoEdicion(false);
    setScoutSeleccionado(null);
    setError(null);
  };

  const validarFormulario = (): string | null => {
    if (!formData.nombres.trim()) return 'Los nombres son obligatorios';
    if (!formData.apellidos.trim()) return 'Los apellidos son obligatorios';
    if (!formData.fecha_nacimiento) return 'La fecha de nacimiento es obligatoria';
    if (!formData.sexo) return 'El sexo es obligatorio';
    // Número de documento es opcional
    // if (!formData.numero_documento.trim()) return 'El número de documento es obligatorio';
    if (formData.numero_documento && formData.numero_documento.trim() && formData.numero_documento.trim().length < 8) return 'El número de documento debe tener al menos 8 caracteres';
    if (!formData.rama_actual.trim()) return 'La rama es obligatoria';
    
    // Validar edad mínima (5 años mínimo según backend)
    const fechaNac = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad < 5) return 'La edad mínima para registro es 5 años';

    // Familiares son opcionales
    // if (familiares.length === 0) return 'Debe agregar al menos un familiar responsable';

    return null;
  };

  /**
   * 🔄 Gestiona la membresía de patrulla del scout
   * @description Actualiza o crea la membresía en miembros_patrulla
   * @principles Data Integrity, Clean Code
   */
  const gestionarMembresiPatrulla = async (
    scoutId: string, 
    nuevaPatrullaId: string | null,
    cargo: CargoPatrulla = 'MIEMBRO'
  ) => {
    try {
      // 1. Obtener membresía actual activa
      const { data: membresiaActual } = await supabase
        .from('miembros_patrulla')
        .select('*')
        .eq('scout_id', scoutId)
        .eq('estado_miembro', 'ACTIVO')
        .is('fecha_salida', null)
        .maybeSingle();

      // 2. Si la patrulla no cambió pero el cargo sí, actualizar solo el cargo
      if (membresiaActual?.patrulla_id === nuevaPatrullaId) {
        if (membresiaActual?.cargo_patrulla !== cargo && nuevaPatrullaId) {
          const { error: updateError } = await supabase
            .from('miembros_patrulla')
            .update({ cargo_patrulla: cargo })
            .eq('id', membresiaActual.id);
          
          if (updateError) throw updateError;
        }
        return { success: true };
      }

      // 3. Cerrar membresía anterior si existe
      if (membresiaActual) {
        await supabase
          .from('miembros_patrulla')
          .update({
            fecha_salida: new Date().toISOString().split('T')[0],
            estado_miembro: 'INACTIVO'
          })
          .eq('id', membresiaActual.id);
      }

      // 4. Crear nueva membresía si se seleccionó patrulla
      if (nuevaPatrullaId) {
        const { error: insertError } = await supabase
          .from('miembros_patrulla')
          .insert({
            scout_id: scoutId,
            patrulla_id: nuevaPatrullaId,
            cargo_patrulla: cargo,
            fecha_ingreso: new Date().toISOString().split('T')[0],
            estado_miembro: 'ACTIVO'
          });

        if (insertError) throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error gestionando membresía de patrulla:', error);
      return { success: false, error };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (modoEdicion && scoutSeleccionado) {
        // Actualizar scout existente 
        await ScoutService.updateScout(scoutSeleccionado.id, {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fecha_nacimiento: formData.fecha_nacimiento,
          fecha_ingreso: formData.fecha_ingreso,
          numero_documento: formData.numero_documento,
          tipo_documento: formData.tipo_documento as any,
          telefono: formData.telefono,
          correo: formData.correo,
          correo_secundario: formData.correo_secundario,
          correo_institucional: formData.correo_institucional,
          departamento: formData.departamento,
          provincia: formData.provincia,
          distrito: formData.distrito,
          direccion: formData.direccion,
          codigo_postal: formData.codigo_postal,
          centro_estudio: formData.centro_estudio,
          anio_estudios: formData.anio_estudios,
          ocupacion: formData.ocupacion,
          centro_laboral: formData.centro_laboral,
          es_dirigente: formData.es_dirigente,
          rama_actual: formData.rama_actual as any,
          codigo_asociado: formData.codigo_asociado,
          religion: formData.religion,
          grupo_sanguineo: formData.grupo_sanguineo,
          factor_sanguineo: formData.factor_sanguineo,
          seguro_medico: formData.seguro_medico,
          tipo_discapacidad: formData.tipo_discapacidad,
          carnet_conadis: formData.carnet_conadis,
          descripcion_discapacidad: formData.descripcion_discapacidad
        });

        // Gestionar cambio de patrulla con cargo
        await gestionarMembresiPatrulla(scoutSeleccionado.id, formData.patrulla_id, formData.cargo_patrulla);
        
      } else {
        // Registrar nuevo scout - uso telefono porque celular no está en la signature
        const resultado = await ScoutService.registrarScout({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          fecha_nacimiento: formData.fecha_nacimiento,
          sexo: formData.sexo as 'MASCULINO' | 'FEMENINO',
          numero_documento: formData.numero_documento,
          tipo_documento: formData.tipo_documento,
          telefono: formData.celular || formData.telefono, // celular prioritario
          email: formData.correo,
          direccion: formData.direccion,
          distrito: formData.distrito,
          rama: formData.rama || formData.rama_actual,
          fecha_ingreso: formData.fecha_ingreso || undefined
        });
        
        if (!resultado.success) {
          throw new Error(resultado.error || 'Error al registrar scout');
        }

        // Si se registró exitosamente y tiene patrulla, asignarla con cargo
        if (resultado.scout_id && formData.patrulla_id) {
          await gestionarMembresiPatrulla(resultado.scout_id, formData.patrulla_id, formData.cargo_patrulla);
        }
      }

      // Recargar datos
      await cargarScouts();
      await cargarEstadisticas();
      
      // Limpiar formulario
      limpiarFormulario();
      setMostrarFormulario(false);
      
    } catch (error: any) {
      console.error('Error al guardar scout:', error);
      setError(error.message || 'Error al guardar el scout');
    } finally {
      setLoading(false);
    }
  };

  const editarScout = async (scout: Scout) => {
    setFormData({
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      fecha_nacimiento: scout.fecha_nacimiento,
      sexo: (scout.sexo as 'MASCULINO' | 'FEMENINO') || '',
      numero_documento: scout.numero_documento || '',
      tipo_documento: scout.tipo_documento || 'DNI',
      celular: scout.celular || '',
      celular_secundario: scout.celular_secundario || '',
      telefono: scout.telefono || '',
      correo: scout.correo || '',
      correo_secundario: scout.correo_secundario || '',
      correo_institucional: scout.correo_institucional || '',
      departamento: scout.departamento || '',
      provincia: scout.provincia || '',
      distrito: scout.distrito || '',
      direccion: scout.direccion || '',
      codigo_postal: scout.codigo_postal || '',
      centro_estudio: scout.centro_estudio || '',
      anio_estudios: scout.anio_estudios || '',
      ocupacion: scout.ocupacion || '',
      centro_laboral: scout.centro_laboral || '',
      es_dirigente: scout.es_dirigente,
      rama_actual: scout.rama_actual || '',
      rama: scout.rama_actual || '',
      codigo_asociado: scout.codigo_asociado || '',
      religion: scout.religion || '',
      grupo_sanguineo: scout.grupo_sanguineo || '',
      factor_sanguineo: scout.factor_sanguineo || '',
      seguro_medico: scout.seguro_medico || '',
      tipo_discapacidad: scout.tipo_discapacidad || '',
      carnet_conadis: scout.carnet_conadis || '',
      descripcion_discapacidad: scout.descripcion_discapacidad || '',
      fecha_ingreso: scout.fecha_ingreso || new Date().toISOString().split('T')[0],
      patrulla_id: null,  // Se cargará después
      cargo_patrulla: 'MIEMBRO'  // Se cargará después
    });
    
    // Cargar patrulla y cargo actual del scout (si tiene)
    try {
      const { data: membresia, error: membresiaError } = await supabase
        .from('miembros_patrulla')
        .select('patrulla_id, cargo_patrulla')
        .eq('scout_id', scout.id)
        .eq('estado_miembro', 'ACTIVO')
        .is('fecha_salida', null)
        .maybeSingle();
      
      if (membresiaError) {
        console.error('Error cargando patrulla:', membresiaError);
      }
      
      if (membresia) {
        console.log('Patrulla cargada:', membresia);
        setFormData(prev => ({ 
          ...prev, 
          patrulla_id: membresia.patrulla_id,
          cargo_patrulla: (membresia.cargo_patrulla || 'MIEMBRO') as CargoPatrulla
        }));
      } else {
        console.log('Scout sin patrulla asignada');
      }
    } catch (err) {
      console.error('Error inesperado cargando patrulla:', err);
    }
    
    // Cargar familiares si existen
    if (scout.familiares && Array.isArray(scout.familiares)) {
      setFamiliares(scout.familiares.map(f => ({
        id: f.id,
        nombres: f.nombres,
        apellidos: f.apellidos,
        parentesco: f.parentesco as any, // Type assertion por diferencias en enum
        sexo: (f.sexo || undefined) as 'MASCULINO' | 'FEMENINO' | undefined,
        tipo_documento: f.tipo_documento || 'DNI',
        numero_documento: f.numero_documento || '',
        celular: f.celular || '',
        celular_secundario: f.celular_secundario || '',
        telefono: f.telefono || '',
        correo: f.correo || '',
        correo_secundario: f.correo_secundario || '',
        direccion: f.direccion || '',
        departamento: f.departamento || '',
        provincia: f.provincia || '',
        distrito: f.distrito || '',
        profesion: f.profesion || f.ocupacion || '',
        centro_laboral: f.centro_laboral || '',
        cargo: f.cargo || '',
        es_contacto_emergencia: f.es_contacto_emergencia || false,
        es_autorizado_recoger: f.es_autorizado_recoger || false
      })));
    }
    
    setScoutSeleccionado(scout);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const obtenerColorRama = (rama: string): string => {
    const colores = {
      Lobatos: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Scouts: 'bg-green-100 text-green-800 border-green-300',
      Rovers: 'bg-blue-100 text-blue-800 border-blue-300',
      Dirigentes: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colores[rama as keyof typeof colores] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const obtenerIconoRama = (rama: string): string => {
    const iconos = {
      Lobatos: '🐺',
      Scouts: '🦅',
      Rovers: '🥾',
      Dirigentes: '�‍🏫'
    };
    return iconos[rama as keyof typeof iconos] || '👤';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Registro de Scouts</h1>
                <p className="text-blue-100 text-sm md:text-base">Gestiona el registro y datos de los scouts del grupo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Scouts</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {estadisticas.scouts?.total || 0}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Dirigentes</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {estadisticas.scouts?.dirigentes || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Nuevos este año</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {estadisticas.scouts?.nuevos_año || 0}
                  </p>
                </div>
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Asistencia promedio</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    {estadisticas.asistencia_promedio ? Math.round(estadisticas.asistencia_promedio) : 0}%
                  </p>
                </div>
                <Flag className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Botón para refrescar estadísticas */}
        <div className="flex justify-end mb-4">
          <button
            onClick={async () => {
              try {
                await ScoutService.limpiarCacheDashboard();
                await cargarEstadisticas();
              } catch (error) {
                console.error('Error al refrescar:', error);
              }
            }}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            title="Refrescar estadísticas"
          >
            🔄 Actualizar Estadísticas
          </button>
        </div>

        {/* Controles principales */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o código scout..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botón nuevo scout */}
            <button
              onClick={() => {
                limpiarFormulario();
                setMostrarFormulario(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span className="text-base font-semibold">Nuevo Scout</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Formulario de registro/edición */}
        {mostrarFormulario && (
          <div className="mb-6 bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                {modoEdicion ? 'Editar Scout' : 'Nuevo Scout'}
              </h2>
              <button
                onClick={() => {
                  limpiarFormulario();
                  setMostrarFormulario(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Datos Personales */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosPersonales')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Datos Personales
                  </h3>
                  {seccionesAbiertas.datosPersonales ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosPersonales && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => handleInputChange('nombres', e.target.value)}
                        placeholder="Nombres completos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => handleInputChange('apellidos', e.target.value)}
                        placeholder="Apellidos completos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexo *
                      </label>
                      <select
                        value={formData.sexo}
                        onChange={(e) => handleInputChange('sexo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar sexo</option>
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMENINO">Femenino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Documento
                      </label>
                      <select
                        value={formData.tipo_documento}
                        onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {tipoDocumentoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Documento
                      </label>
                      <input
                        type="text"
                        value={formData.numero_documento}
                        onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                        placeholder="Número de documento (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Contacto */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosContacto')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Datos de Contacto
                  </h3>
                  {seccionesAbiertas.datosContacto ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosContacto && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular Principal
                      </label>
                      <input
                        type="tel"
                        value={formData.celular}
                        onChange={(e) => handleInputChange('celular', e.target.value)}
                        placeholder="Número de celular"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular Secundario
                      </label>
                      <input
                        type="tel"
                        value={formData.celular_secundario}
                        onChange={(e) => handleInputChange('celular_secundario', e.target.value)}
                        placeholder="Celular alternativo (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono Fijo
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        placeholder="Teléfono fijo (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico Principal
                      </label>
                      <input
                        type="email"
                        value={formData.correo}
                        onChange={(e) => handleInputChange('correo', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico Secundario
                      </label>
                      <input
                        type="email"
                        value={formData.correo_secundario}
                        onChange={(e) => handleInputChange('correo_secundario', e.target.value)}
                        placeholder="correo2@ejemplo.com (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Institucional
                      </label>
                      <input
                        type="email"
                        value={formData.correo_institucional}
                        onChange={(e) => handleInputChange('correo_institucional', e.target.value)}
                        placeholder="correo@colegio.edu.pe (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departamento
                      </label>
                      <input
                        type="text"
                        value={formData.departamento}
                        onChange={(e) => handleInputChange('departamento', e.target.value)}
                        placeholder="Departamento"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={formData.provincia}
                        onChange={(e) => handleInputChange('provincia', e.target.value)}
                        placeholder="Provincia"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distrito
                      </label>
                      <input
                        type="text"
                        value={formData.distrito}
                        onChange={(e) => handleInputChange('distrito', e.target.value)}
                        placeholder="Distrito"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={formData.codigo_postal}
                        onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
                        placeholder="Código postal (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Religiosos */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosReligiosos')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Church className="w-5 h-5 text-indigo-600" />
                    Datos Religiosos
                  </h3>
                  {seccionesAbiertas.datosReligiosos ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosReligiosos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Religión
                      </label>
                      <input
                        type="text"
                        value={formData.religion}
                        onChange={(e) => handleInputChange('religion', e.target.value)}
                        placeholder="Religión (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Médicos y Salud */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosSalud')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    Datos Médicos y Salud
                  </h3>
                  {seccionesAbiertas.datosSalud ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosSalud && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grupo Sanguíneo
                      </label>
                      <select
                        value={formData.grupo_sanguineo}
                        onChange={(e) => handleInputChange('grupo_sanguineo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        {grupoSanguineoOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Factor Sanguíneo
                      </label>
                      <select
                        value={formData.factor_sanguineo}
                        onChange={(e) => handleInputChange('factor_sanguineo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        {factorSanguineoOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seguro Médico
                      </label>
                      <input
                        type="text"
                        value={formData.seguro_medico}
                        onChange={(e) => handleInputChange('seguro_medico', e.target.value)}
                        placeholder="Nombre del seguro (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Discapacidad
                      </label>
                      <input
                        type="text"
                        value={formData.tipo_discapacidad}
                        onChange={(e) => handleInputChange('tipo_discapacidad', e.target.value)}
                        placeholder="Tipo de discapacidad (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Carnet CONADIS
                      </label>
                      <input
                        type="text"
                        value={formData.carnet_conadis}
                        onChange={(e) => handleInputChange('carnet_conadis', e.target.value)}
                        placeholder="Número de carnet (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción de la Discapacidad
                      </label>
                      <textarea
                        value={formData.descripcion_discapacidad}
                        onChange={(e) => handleInputChange('descripcion_discapacidad', e.target.value)}
                        placeholder="Descripción detallada (opcional)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Educación/Trabajo */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosEducacion')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Educación y Trabajo
                  </h3>
                  {seccionesAbiertas.datosEducacion ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosEducacion && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Centro de Estudios
                      </label>
                      <input
                        type="text"
                        value={formData.centro_estudio}
                        onChange={(e) => handleInputChange('centro_estudio', e.target.value)}
                        placeholder="Colegio, universidad, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año de Estudios
                      </label>
                      <input
                        type="text"
                        value={formData.anio_estudios}
                        onChange={(e) => handleInputChange('anio_estudios', e.target.value)}
                        placeholder="1ro primaria, 3ro secundaria, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        value={formData.ocupacion}
                        onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                        placeholder="Estudiante, profesional, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Centro Laboral
                      </label>
                      <input
                        type="text"
                        value={formData.centro_laboral}
                        onChange={(e) => handleInputChange('centro_laboral', e.target.value)}
                        placeholder="Lugar de trabajo"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Familiares Responsables */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosFamiliares')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    Datos de Familiares Responsables
                  </h3>
                  {seccionesAbiertas.datosFamiliares ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosFamiliares && (
                  <FamiliarTable
                    familiares={familiares}
                    onEdit={handleEditarFamiliar}
                    onDelete={handleEliminarFamiliar}
                    onAdd={handleAgregarFamiliar}
                  />
                )}
              </div>

              {/* Datos Scout */}
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  type="button"
                  onClick={() => toggleSeccion('datosScout')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-orange-600" />
                    Datos Scout
                  </h3>
                  {seccionesAbiertas.datosScout ? 
                    <ChevronUp className="w-5 h-5 text-gray-600" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  }
                </button>

                {seccionesAbiertas.datosScout && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rama *
                      </label>
                      <select
                        value={formData.rama_actual}
                        onChange={(e) => {
                          handleInputChange('rama_actual', e.target.value);
                          handleInputChange('rama', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar rama</option>
                        {ramaOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código de Asociado
                      </label>
                      <input
                        type="text"
                        value={formData.codigo_asociado}
                        onChange={(e) => handleInputChange('codigo_asociado', e.target.value)}
                        placeholder="Código de asociado (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Selector de Patrulla - Componente inteligente */}
                    <div className="md:col-span-2">
                      <PatrullaSelector
                        ramaActual={formData.rama_actual}
                        scoutId={scoutSeleccionado?.id}
                        patrullaActualId={formData.patrulla_id}
                        onChange={(patrullaId) => {
                          handleInputChange('patrulla_id', patrullaId);
                          // Resetear cargo a MIEMBRO si se cambia de patrulla
                          if (patrullaId !== formData.patrulla_id) {
                            handleInputChange('cargo_patrulla', 'MIEMBRO');
                          }
                        }}
                        disabled={!formData.rama_actual || loading}
                      />
                    </div>

                    {/* Selector de Cargo en Patrulla */}
                    {formData.patrulla_id && (
                      <div className="md:col-span-2">
                        <CargoPatrullaSelector
                          patrullaId={formData.patrulla_id}
                          cargoActual={formData.cargo_patrulla}
                          scoutId={scoutSeleccionado?.id}
                          onChange={(cargo) => handleInputChange('cargo_patrulla', cargo)}
                          disabled={loading}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Ingreso
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_ingreso}
                        onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ¿Es Dirigente?
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.es_dirigente}
                          onChange={(e) => handleInputChange('es_dirigente', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Sí, es dirigente</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones del formulario */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarFormulario(false);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Guardando...' : (modoEdicion ? 'Actualizar Scout' : 'Registrar Scout')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de scouts */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Lista de Scouts ({scouts.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando scouts...</p>
            </div>
          ) : scouts.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay scouts registrados</h3>
              <p className="text-gray-600">
                {busqueda ? 'No se encontraron scouts con ese criterio de búsqueda' : 'Registra el primer scout para empezar'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scouts.map((scout) => (
                <div key={scout.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">{obtenerIconoRama(scout.rama_actual || '')}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {scout.nombres} {scout.apellidos}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Código: {scout.codigo_scout}</span>
                            <span>•</span>
                            <span>Edad: {calcularEdad(scout.fecha_nacimiento)} años</span>
                            {scout.es_dirigente && (
                              <>
                                <span>•</span>
                                <span className="text-orange-600 font-medium">DIRIGENTE</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full border text-xs font-medium ${obtenerColorRama(scout.rama_actual || '')}`}>
                          {(scout.rama_actual || '').toUpperCase()}
                        </span>
                        
                        {scout.celular && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {scout.celular}
                          </span>
                        )}
                        
                        {scout.correo && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {scout.correo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => editarScout(scout)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar scout"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          // TODO: Implementar vista de perfil completo
                          console.log('Ver perfil:', scout.id);
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Ver perfil completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Familiar */}
      <FamiliarModal
        isOpen={familiarModal.isOpen}
        familiar={familiarModal.familiar}
        onClose={() => setFamiliarModal({ isOpen: false, familiar: null, index: null })}
        onSave={handleGuardarFamiliar}
      />
    </div>
  );
}
