/**
 * Nueva Actividad Dialog - Formulario para crear actividades al aire libre
 */

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Tent,
  MapPin,
  Calendar,
  Clock,
  // DollarSign removido - usando S/ directamente
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Globe2,
  GanttChartSquare,
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  Wallet,
  User,
  Search,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ActividadesExteriorService,
  TipoActividadExterior,
  TipoActividadAireLibre,
  PuntoEncuentroAireLibre,
  TipoCostoAireLibre,
  EstadoActividadExterior,
  ESTADOS_ACTIVIDAD_EXTERIOR,
  CATALOGO_ODS,
  DirigentDisponible,
  RolStaff,
  getEmojiTipoActividad,
} from '@/services/actividadesExteriorService';
import { ComboboxPuntoEncuentro } from '../components/ComboboxPuntoEncuentro';

// Schema de validación - el tipo viene del catálogo dinámico (ya no es una lista fija)
const actividadSchema = z.object({
  // Paso 1: Info básica
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  tipo: z.string().min(1, 'Selecciona un tipo de actividad'),
  estado: z.enum(['borrador', 'planificacion', 'aprobado', 'en_curso', 'finalizado', 'cancelado']).optional(),
  descripcion: z.string().optional(),
  participacion_asistencia: z.string().optional(),

  // Paso 2: Objetivos
  objetivo_general: z.string().optional(),
  objetivos_especificos: z.array(z.object({
    objetivo_especifico: z.string(),
    meta: z.string(),
  })).optional(),

  // Paso 3: Objetivo de Desarrollo Sostenible
  ods_seleccionados: z.array(z.number()).optional(),

  // Paso 4: GANTT
  cronograma_semanas: z.number().optional(),
  cronograma_actividades: z.array(z.object({
    actividad: z.string(),
    semanas: z.array(z.boolean()),
  })).optional(),

  // Paso 5: Fechas y lugar
  fecha_inicio: z.string().min(1, 'Selecciona fecha de inicio'),
  fecha_fin: z.string().min(1, 'Selecciona fecha de fin'),
  hora_concentracion: z.string().optional(),
  punto_encuentro_id: z.string().optional(),
  ubicacion: z.string().min(3, 'Ingresa la ubicación'),
  lugar_detalle: z.string().optional(),

  // Paso 6: Costos
  costo_por_participante: z.number().min(0),

  // Paso 7: Información adicional
  equipamiento_obligatorio: z.string().optional(),
  equipamiento_opcional: z.string().optional(),
  recomendaciones: z.string().optional(),

  // Paso 8: Responsables
  responsables: z.array(z.object({
    persona_id: z.string(),
    nombre: z.string(),
    rol: z.string(),
  })).optional(),

  // Paso 9: Riesgo
  riesgo_evaluacion: z.object({
    actividad_accion: z.string().optional(),
    lugar: z.string().optional(),
    peligro: z.string().optional(),
    riesgo: z.string().optional(),
    consecuencia: z.string().optional(),
    severidad: z.enum(['BAJO', 'MEDIO', 'ALTO']).optional(),
    frecuencia: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
    indice: z.number().optional(),
    acciones_preventivas: z.string().optional(),
  }).optional(),
  riesgo_protocolo: z.object({
    nombre_procedimiento: z.string().optional(),
    responsable_persona_id: z.string().optional(),
    responsable_nombre: z.string().optional(),
    forma_contacto: z.string().optional(),
    pasos_a_realizar: z.string().optional(),
    acciones_preventivas: z.string().optional(),
    observaciones: z.string().optional(),
  }).optional(),
});

type ActividadFormData = z.infer<typeof actividadSchema>;

interface ActividadEditar {
  id: string;
  nombre: string;
  tipo: string;
  estado?: string;
  descripcion?: string;
  participacion_asistencia?: string;
  objetivo_general?: string;
  objetivos_especificos?: { objetivo_especifico: string; meta: string }[];
  ods_seleccionados?: number[];
  cronograma_semanas?: number;
  cronograma_actividades?: { actividad: string; semanas: boolean[] }[];
  fecha_inicio: string;
  fecha_fin: string;
  hora_concentracion?: string;
  punto_encuentro_id?: string | null;
  ubicacion: string;
  lugar_detalle?: string;
  imagen_ubicacion_url?: string;
  costo_por_participante: number;
  equipamiento_obligatorio?: string;
  equipamiento_opcional?: string;
  recomendaciones?: string;
  staff?: { persona_id: string; nombre: string; rol: string }[];
  riesgo_evaluacion?: {
    actividad_accion?: string;
    lugar?: string;
    peligro?: string;
    riesgo?: string;
    consecuencia?: string;
    severidad?: 'BAJO' | 'MEDIO' | 'ALTO';
    frecuencia?: 'A' | 'B' | 'C' | 'D' | 'E';
    indice?: number;
    acciones_preventivas?: string;
  };
  riesgo_protocolo?: {
    nombre_procedimiento?: string;
    responsable_persona_id?: string;
    responsable_nombre?: string;
    forma_contacto?: string;
    pasos_a_realizar?: string;
    acciones_preventivas?: string;
    observaciones?: string;
  };
}

interface NuevaActividadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (actividadId: string) => void;
  actividadEditar?: ActividadEditar | null; // Para modo edición
}

const PASOS = [
  { id: 1, title: 'Información', icon: FileText },
  { id: 2, title: 'Objetivos', icon: Target },
  { id: 3, title: 'ODS', icon: Globe2 },
  { id: 4, title: 'GANTT', icon: GanttChartSquare },
  { id: 5, title: 'Lugar y Fecha', icon: MapPin },
  { id: 6, title: 'Costos', icon: Wallet },
  { id: 7, title: 'Detalles', icon: Tent },
  { id: 8, title: 'Responsables', icon: UserCheck },
  { id: 9, title: 'Riesgo', icon: AlertTriangle },
];

// UUID placeholder para listar dirigentes disponibles en modo creación,
// cuando la actividad todavía no tiene id real. La RPC
// api_listar_dirigentes_disponibles no valida que exista, solo lo usa
// para marcar "ya_asignado" (que da false para un id inexistente).
const PLACEHOLDER_ACTIVIDAD_ID = '00000000-0000-0000-0000-000000000000';

const NuevaActividadDialog: React.FC<NuevaActividadDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  actividadEditar,
}) => {
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const modoEdicion = !!actividadEditar;

  const [tiposDisponibles, setTiposDisponibles] = useState<TipoActividadAireLibre[]>([]);
  const [cargandoTipos, setCargandoTipos] = useState(false);

  const [puntosEncuentroDisponibles, setPuntosEncuentroDisponibles] = useState<PuntoEncuentroAireLibre[]>([]);
  const [cargandoPuntosEncuentro, setCargandoPuntosEncuentro] = useState(false);

  const [tiposCostoDisponibles, setTiposCostoDisponibles] = useState<TipoCostoAireLibre[]>([]);
  const [cargandoTiposCosto, setCargandoTiposCosto] = useState(false);
  const [costosPorTipo, setCostosPorTipo] = useState<Record<string, number>>({});

  // Imagen de ubicación: se difiere igual que costosPorTipo (no hay actividadId
  // en modo creación hasta el submit final), se sube recién en guardarActividad.
  const [imagenUbicacionFile, setImagenUbicacionFile] = useState<File | null>(null);
  const [imagenUbicacionUrlActual, setImagenUbicacionUrlActual] = useState<string | undefined>(undefined);

  // Paso Responsables: dirigentes disponibles para elegir + catálogo de roles.
  // El agregado real a staff_actividad también se difiere hasta guardarActividad
  // (api_agregar_staff sí valida que la actividad exista).
  const [dirigentesDisponibles, setDirigentesDisponibles] = useState<DirigentDisponible[]>([]);
  const [cargandoDirigentes, setCargandoDirigentes] = useState(false);
  const [rolesStaff, setRolesStaff] = useState<RolStaff[]>([]);
  const [busquedaResponsable, setBusquedaResponsable] = useState('');

  // Cargar catálogo de tipos de actividad cada vez que se abre el diálogo
  React.useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoTipos(true);
    ActividadesExteriorService.listarTiposActividadAireLibre(true)
      .then((tipos) => {
        if (activo) setTiposDisponibles(tipos);
      })
      .catch((err) => console.error('Error cargando tipos de actividad:', err))
      .finally(() => {
        if (activo) setCargandoTipos(false);
      });
    return () => {
      activo = false;
    };
  }, [open]);

  // Cargar catálogo de puntos de encuentro cada vez que se abre el diálogo
  React.useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoPuntosEncuentro(true);
    ActividadesExteriorService.listarPuntosEncuentroAireLibre(true)
      .then((puntos) => {
        if (activo) setPuntosEncuentroDisponibles(puntos);
      })
      .catch((err) => console.error('Error cargando puntos de encuentro:', err))
      .finally(() => {
        if (activo) setCargandoPuntosEncuentro(false);
      });
    return () => {
      activo = false;
    };
  }, [open]);

  // Cargar catálogo de tipos de costo cada vez que se abre el diálogo
  React.useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoTiposCosto(true);
    ActividadesExteriorService.listarTiposCostoAireLibre(true)
      .then((tipos) => {
        if (activo) setTiposCostoDisponibles(tipos);
      })
      .catch((err) => console.error('Error cargando tipos de costo:', err))
      .finally(() => {
        if (activo) setCargandoTiposCosto(false);
      });
    return () => {
      activo = false;
    };
  }, [open]);

  // Precargar el detalle de costos en modo edición
  React.useEffect(() => {
    if (!open || !actividadEditar) {
      if (open && !actividadEditar) setCostosPorTipo({});
      return;
    }
    let activo = true;
    ActividadesExteriorService.obtenerCostosActividad(actividadEditar.id)
      .then((costos) => {
        if (!activo) return;
        const mapa: Record<string, number> = {};
        costos.forEach((c) => { mapa[c.tipo_costo_id] = c.monto; });
        setCostosPorTipo(mapa);
      })
      .catch((err) => console.error('Error cargando costos de la actividad:', err));
    return () => {
      activo = false;
    };
  }, [open, actividadEditar]);

  // Suma de los ítems de costo del catálogo, usada como costo_por_participante
  const totalCosto = React.useMemo(
    () => Object.values(costosPorTipo).reduce((acc, monto) => acc + (monto || 0), 0),
    [costosPorTipo]
  );

  // Cargar dirigentes disponibles para el paso "Responsables" (usa un id
  // placeholder en modo creación; la RPC no valida que la actividad exista).
  React.useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoDirigentes(true);
    ActividadesExteriorService.listarDirigentesDisponibles(actividadEditar?.id || PLACEHOLDER_ACTIVIDAD_ID)
      .then((dirigentes) => {
        if (activo) setDirigentesDisponibles(dirigentes);
      })
      .catch((err) => console.error('Error cargando dirigentes disponibles:', err))
      .finally(() => {
        if (activo) setCargandoDirigentes(false);
      });
    return () => {
      activo = false;
    };
  }, [open, actividadEditar]);

  // Cargar catálogo de roles de staff (mismo catálogo que AgregarStaffDialog.tsx)
  React.useEffect(() => {
    if (!open) return;
    let activo = true;
    ActividadesExteriorService.obtenerRolesStaff()
      .then((roles) => {
        if (activo) setRolesStaff(roles);
      })
      .catch((err) => console.error('Error cargando roles de staff:', err));
    return () => {
      activo = false;
    };
  }, [open]);

  const form = useForm<ActividadFormData>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      nombre: '',
      tipo: '',
      descripcion: '',
      participacion_asistencia: '',
      objetivo_general: '',
      objetivos_especificos: [],
      ods_seleccionados: [],
      cronograma_semanas: 8,
      cronograma_actividades: [],
      fecha_inicio: '',
      fecha_fin: '',
      hora_concentracion: '',
      punto_encuentro_id: '',
      ubicacion: '',
      lugar_detalle: '',
      costo_por_participante: 0,
      equipamiento_obligatorio: '',
      equipamiento_opcional: '',
      recomendaciones: '',
      responsables: [],
      riesgo_evaluacion: {},
      riesgo_protocolo: {},
    },
    mode: 'onBlur',
  });

  const objetivosEspecificosArray = useFieldArray({ control: form.control, name: 'objetivos_especificos' });
  const cronogramaActividadesArray = useFieldArray({ control: form.control, name: 'cronograma_actividades' });
  const responsablesArray = useFieldArray({ control: form.control, name: 'responsables' });

  const cronogramaSemanas = form.watch('cronograma_semanas') || 0;

  // Al cambiar la cantidad de semanas, recorta/rellena los arrays de
  // casillas ya cargados en cada fila del GANTT en vez de romper.
  React.useEffect(() => {
    cronogramaActividadesArray.fields.forEach((field, index) => {
      const semanasActuales = form.getValues(`cronograma_actividades.${index}.semanas`) || [];
      if (semanasActuales.length === cronogramaSemanas) return;
      const nuevasSemanas = Array.from({ length: cronogramaSemanas }, (_, i) => semanasActuales[i] || false);
      form.setValue(`cronograma_actividades.${index}.semanas`, nuevasSemanas);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cronogramaSemanas]);

  // Mantener costo_por_participante sincronizado con la suma de los ítems de costo
  React.useEffect(() => {
    form.setValue('costo_por_participante', totalCosto);
  }, [totalCosto, form]);

  // Cargar datos en modo edición
  React.useEffect(() => {
    if (open && actividadEditar) {
      form.reset({
        nombre: actividadEditar.nombre,
        tipo: actividadEditar.tipo,
        estado: actividadEditar.estado,
        descripcion: actividadEditar.descripcion || '',
        participacion_asistencia: actividadEditar.participacion_asistencia || '',
        objetivo_general: actividadEditar.objetivo_general || '',
        objetivos_especificos: actividadEditar.objetivos_especificos || [],
        ods_seleccionados: actividadEditar.ods_seleccionados || [],
        cronograma_semanas: actividadEditar.cronograma_semanas || 8,
        cronograma_actividades: actividadEditar.cronograma_actividades || [],
        fecha_inicio: actividadEditar.fecha_inicio,
        fecha_fin: actividadEditar.fecha_fin,
        hora_concentracion: actividadEditar.hora_concentracion || '',
        punto_encuentro_id: actividadEditar.punto_encuentro_id || '',
        ubicacion: actividadEditar.ubicacion,
        lugar_detalle: actividadEditar.lugar_detalle || '',
        costo_por_participante: actividadEditar.costo_por_participante || 0,
        equipamiento_obligatorio: actividadEditar.equipamiento_obligatorio || '',
        equipamiento_opcional: actividadEditar.equipamiento_opcional || '',
        recomendaciones: actividadEditar.recomendaciones || '',
        responsables: actividadEditar.staff || [],
        riesgo_evaluacion: actividadEditar.riesgo_evaluacion || {},
        riesgo_protocolo: actividadEditar.riesgo_protocolo || {},
      });
      setImagenUbicacionUrlActual(actividadEditar.imagen_ubicacion_url);
      setImagenUbicacionFile(null);
    } else if (open && !actividadEditar) {
      form.reset({
        nombre: '',
        tipo: '',
        estado: undefined,
        descripcion: '',
        participacion_asistencia: '',
        objetivo_general: '',
        objetivos_especificos: [],
        ods_seleccionados: [],
        cronograma_semanas: 8,
        cronograma_actividades: [],
        fecha_inicio: '',
        fecha_fin: '',
        hora_concentracion: '',
        punto_encuentro_id: '',
        ubicacion: '',
        lugar_detalle: '',
        costo_por_participante: 0,
        equipamiento_obligatorio: '',
        equipamiento_opcional: '',
        recomendaciones: '',
        responsables: [],
        riesgo_evaluacion: {},
        riesgo_protocolo: {},
      });
      setImagenUbicacionUrlActual(undefined);
      setImagenUbicacionFile(null);
    }
  }, [open, actividadEditar, form]);

  const validarPasoActual = async (): Promise<boolean> => {
    let camposValidar: (keyof ActividadFormData)[] = [];

    switch (paso) {
      case 1:
        camposValidar = ['nombre', 'tipo'];
        break;
      case 2:
      case 3:
      case 4:
        // Objetivos, ODS y GANTT no tienen campos obligatorios
        return true;
      case 5:
        camposValidar = ['fecha_inicio', 'fecha_fin', 'ubicacion'];
        break;
      case 6:
        camposValidar = ['costo_por_participante'];
        break;
      case 7:
      case 8:
      case 9:
        // Detalles, Responsables y Riesgo no tienen campos obligatorios
        return true;
    }

    const result = await form.trigger(camposValidar);
    return result;
  };

  const siguientePaso = async () => {
    const valido = await validarPasoActual();
    if (valido && paso < PASOS.length) {
      // Usar setTimeout para evitar que el cambio de paso dispare un re-render que cause submit
      setTimeout(() => setPaso(paso + 1), 0);
    }
  };

  const pasoAnterior = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    }
  };

  // Navegación directa a un paso específico (solo en modo edición)
  const irAPaso = (numeroPaso: number) => {
    if (modoEdicion && numeroPaso >= 1 && numeroPaso <= PASOS.length) {
      setPaso(numeroPaso);
    }
  };

  // Crea un punto de encuentro al vuelo desde el combobox del paso 2
  const handleAgregarPuntoEncuentro = async (lugar: string): Promise<PuntoEncuentroAireLibre | null> => {
    try {
      const resultado = await ActividadesExteriorService.upsertPuntoEncuentroAireLibre({
        id: null,
        lugar,
        referencia: '',
        activo: true,
      });
      if (!resultado.success || !resultado.id) return null;

      const actualizados = await ActividadesExteriorService.listarPuntosEncuentroAireLibre(true);
      setPuntosEncuentroDisponibles(actualizados);
      return actualizados.find((p) => p.id === resultado.id) || null;
    } catch (err) {
      console.error('Error agregando punto de encuentro:', err);
      return null;
    }
  };

  // Agrega/quita un ODS de la selección múltiple del paso 3
  const toggleOds = (numero: number) => {
    const actuales = form.getValues('ods_seleccionados') || [];
    const yaSeleccionado = actuales.includes(numero);
    form.setValue(
      'ods_seleccionados',
      yaSeleccionado ? actuales.filter((n) => n !== numero) : [...actuales, numero]
    );
  };

  // Función de submit manual - solo se llama explícitamente desde el botón
  const guardarActividad = async () => {
    // En modo edición, validar solo los campos dirty o campos requeridos mínimos
    const camposRequeridos: (keyof ActividadFormData)[] = ['nombre', 'tipo', 'fecha_inicio', 'fecha_fin', 'ubicacion'];
    const isValid = await form.trigger(camposRequeridos);
    if (!isValid) {
      // Si hay error, ir al paso que tiene el primer error
      const errors = form.formState.errors;
      if (errors.nombre || errors.tipo) {
        setPaso(1);
      } else if (errors.fecha_inicio || errors.fecha_fin || errors.ubicacion) {
        setPaso(5);
      } else if (errors.costo_por_participante) {
        setPaso(6);
      }
      return;
    }

    const data = form.getValues();

    try {
      setGuardando(true);

      const actividadData = {
        nombre: data.nombre,
        tipo: data.tipo as TipoActividadExterior,
        estado: data.estado as EstadoActividadExterior,
        descripcion: data.descripcion,
        participacion_asistencia: data.participacion_asistencia,
        objetivo_general: data.objetivo_general,
        objetivos_especificos: data.objetivos_especificos || [],
        ods_seleccionados: data.ods_seleccionados || [],
        cronograma_semanas: data.cronograma_semanas,
        cronograma_actividades: data.cronograma_actividades || [],
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        hora_concentracion: data.hora_concentracion,
        punto_encuentro_id: data.punto_encuentro_id || null,
        ubicacion: data.ubicacion,
        lugar_detalle: data.lugar_detalle,
        costo_por_participante: data.costo_por_participante,
        equipamiento_obligatorio: data.equipamiento_obligatorio,
        equipamiento_opcional: data.equipamiento_opcional,
        recomendaciones: data.recomendaciones,
        riesgo_evaluacion: data.riesgo_evaluacion,
        riesgo_protocolo: data.riesgo_protocolo,
      };

      const costosArray = Object.entries(costosPorTipo).map(([tipo_costo_id, monto]) => ({
        tipo_costo_id,
        monto: monto || 0,
      }));

      // Agrega el staff elegido en el paso "Responsables". api_agregar_staff
      // valida UNIQUE(actividad_id, persona_id): si la persona ya estaba en
      // el staff (modo edición), se ignora ese error puntual sin abortar el resto.
      const guardarResponsables = async (actividadId: string) => {
        for (const responsable of data.responsables || []) {
          try {
            await ActividadesExteriorService.agregarStaff(actividadId, {
              persona_id: responsable.persona_id,
              rol: responsable.rol,
            });
          } catch (err) {
            console.warn(`No se pudo agregar responsable ${responsable.nombre}:`, err);
          }
        }
      };

      if (modoEdicion && actividadEditar) {
        // Modo edición: si hay imagen nueva, subirla primero (ya existe actividadId)
        let imagenUrl = imagenUbicacionUrlActual;
        if (imagenUbicacionFile) {
          const subida = await ActividadesExteriorService.subirArchivo(actividadEditar.id, imagenUbicacionFile, 'imagen');
          imagenUrl = subida.url;
        }
        await ActividadesExteriorService.actualizarActividad(actividadEditar.id, { ...actividadData, imagen_ubicacion_url: imagenUrl });
        await ActividadesExteriorService.guardarCostosActividad(actividadEditar.id, costosArray);
        await guardarResponsables(actividadEditar.id);
        form.reset();
        setPaso(1);
        onOpenChange(false);
        onSuccess(actividadEditar.id);
      } else {
        // Modo creación: la actividad no tiene id hasta crearla, la imagen y
        // los responsables se guardan después
        const result = await ActividadesExteriorService.crearActividad(actividadData);
        await ActividadesExteriorService.guardarCostosActividad(result.actividad_id, costosArray);
        await guardarResponsables(result.actividad_id);
        if (imagenUbicacionFile) {
          const subida = await ActividadesExteriorService.subirArchivo(result.actividad_id, imagenUbicacionFile, 'imagen');
          await ActividadesExteriorService.actualizarActividad(result.actividad_id, { imagen_ubicacion_url: subida.url });
        }
        form.reset();
        setPaso(1);
        onOpenChange(false);
        onSuccess(result.actividad_id);
      }
    } catch (error) {
      console.error(modoEdicion ? 'Error actualizando actividad:' : 'Error creando actividad:', error);
    } finally {
      setGuardando(false);
    }
  };

  // onSubmit del form - no hacer nada, solo prevenir submit automático
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClose = () => {
    form.reset();
    setPaso(1);
    setImagenUbicacionFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tent className="h-5 w-5" />
            {modoEdicion ? 'Editar Actividad' : 'Nueva Actividad al Aire Libre'}
          </DialogTitle>
          <DialogDescription>
            {modoEdicion 
              ? 'Modifica los datos de la actividad' 
              : 'Crea un campamento, caminata, excursión u otra actividad al aire libre'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper - clickeable en modo edición */}
        <div className="flex items-center justify-between mb-6 py-4">
          {PASOS.map((p, index) => {
            const Icon = p.icon;
            const isActive = paso === p.id;
            const isCompleted = paso > p.id;
            const isClickable = modoEdicion; // En modo edición, todos los pasos son clickeables

            return (
              <React.Fragment key={p.id}>
                <div
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
                  onClick={() => isClickable && irAPaso(p.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-gray-300 text-gray-400'
                  } ${isClickable ? 'hover:scale-105 hover:shadow-md transition-transform' : ''}`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 text-center leading-tight max-w-[4.5rem] ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {p.title}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    paso > p.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <Form {...form}>
          <form 
            onSubmit={onSubmit} 
            className="space-y-6"
            onKeyDown={(e) => {
              // Prevenir submit con Enter siempre
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            {/* Paso 1: Información básica */}
            {paso === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Actividad *</FormLabel>
                      {cargandoTipos ? (
                        <p className="text-sm text-muted-foreground py-2">Cargando tipos de actividad...</p>
                      ) : tiposDisponibles.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No hay tipos de actividad registrados. Agrégalos en Configuración &gt; Tipos de Actividad.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {tiposDisponibles.map(tipo => (
                            <button
                              key={tipo.id}
                              type="button"
                              onClick={() => field.onChange(tipo.descripcion)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                                field.value?.toLowerCase() === tipo.descripcion.toLowerCase()
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-2xl">{getEmojiTipoActividad(tipo.descripcion)}</span>
                              <span className="text-xs font-medium">{tipo.descripcion}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Actividad *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Campamento de Verano 2026"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selector de estado - solo visible en modo edición */}
                {modoEdicion && (
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado de la Actividad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTADOS_ACTIVIDAD_EXTERIOR.map(estado => (
                              <SelectItem key={estado.value} value={estado.value}>
                                <span className={`inline-flex items-center gap-2`}>
                                  <span className={`w-2 h-2 rounded-full bg-${estado.color}-500`}></span>
                                  {estado.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Énfasis Actividad</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe brevemente el énfasis de la actividad..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participacion_asistencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participación y Asistencia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe la participación y asistencia esperada..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 2: Objetivos */}
            {paso === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="objetivo_general"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo General</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el objetivo general de la actividad..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Objetivos Específicos</FormLabel>
                  {objetivosEspecificosArray.fields.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg mt-2">
                      <p className="text-sm">No hay objetivos específicos registrados</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => objetivosEspecificosArray.append({ objetivo_especifico: '', meta: '' })}
                      >
                        Agregar primer objetivo específico
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {objetivosEspecificosArray.fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg relative space-y-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive h-7 w-7"
                            onClick={() => objetivosEspecificosArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <FormField
                            control={form.control}
                            name={`objetivos_especificos.${index}.objetivo_especifico`}
                            render={({ field: itemField }) => (
                              <FormItem>
                                <FormLabel>Objetivo Específico</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Fomentar el trabajo en equipo" {...itemField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`objetivos_especificos.${index}.meta`}
                            render={({ field: itemField }) => (
                              <FormItem>
                                <FormLabel>Meta</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: 80% de los participantes completa el reto grupal" {...itemField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => objetivosEspecificosArray.append({ objetivo_especifico: '', meta: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar objetivo específico
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 3: Objetivo de Desarrollo Sostenible */}
            {paso === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="ods_seleccionados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo(s) de Desarrollo Sostenible</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CATALOGO_ODS.map((ods) => {
                          const seleccionado = (field.value || []).includes(ods.numero);
                          return (
                            <button
                              key={ods.numero}
                              type="button"
                              onClick={() => toggleOds(ods.numero)}
                              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                seleccionado
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-xs font-semibold block">ODS {ods.numero}</span>
                              <span className="text-xs text-muted-foreground">{ods.nombre}</span>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 4: GANTT */}
            {paso === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="cronograma_semanas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad de Semanas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="w-32"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Actividades</FormLabel>
                  {cronogramaActividadesArray.fields.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg mt-2">
                      <p className="text-sm">No hay actividades registradas en el cronograma</p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => cronogramaActividadesArray.append({
                          actividad: '',
                          semanas: Array(cronogramaSemanas).fill(false),
                        })}
                      >
                        Agregar primera actividad
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2 overflow-x-auto">
                      {cronogramaActividadesArray.fields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-lg relative space-y-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive h-7 w-7"
                            onClick={() => cronogramaActividadesArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <FormField
                            control={form.control}
                            name={`cronograma_actividades.${index}.actividad`}
                            render={({ field: itemField }) => (
                              <FormItem className="pr-8">
                                <FormLabel>Actividad</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Reunión de coordinación" {...itemField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-2 flex-wrap">
                            {Array.from({ length: cronogramaSemanas }).map((_, semanaIndex) => (
                              <FormField
                                key={semanaIndex}
                                control={form.control}
                                name={`cronograma_actividades.${index}.semanas.${semanaIndex}`}
                                render={({ field: semanaField }) => (
                                  <label className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                                    <span>S{semanaIndex + 1}</span>
                                    <input
                                      type="checkbox"
                                      checked={!!semanaField.value}
                                      onChange={(e) => semanaField.onChange(e.target.checked)}
                                      className="h-4 w-4"
                                    />
                                  </label>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cronogramaActividadesArray.append({
                          actividad: '',
                          semanas: Array(cronogramaSemanas).fill(false),
                        })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar actividad
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 5: Lugar y Fecha */}
            {paso === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date"
                              className="pl-10"
                              min={form.watch('fecha_inicio')}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hora_concentracion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora de Concentración</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="time"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="punto_encuentro_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Punto de Encuentro</FormLabel>
                        <FormControl>
                          <ComboboxPuntoEncuentro
                            puntos={puntosEncuentroDisponibles}
                            loading={cargandoPuntosEncuentro}
                            value={field.value}
                            onChange={field.onChange}
                            onAgregarNueva={handleAgregarPuntoEncuentro}
                            placeholder="Buscar o escribir un punto de encuentro..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación / Destino *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Ej: Cieneguilla, Lima"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lugar_detalle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalle del Lugar</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Campamento Las Lomas, Km 35"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Imagen de Ubicación</FormLabel>
                  <FormControl>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="imagen-ubicacion-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setImagenUbicacionFile(file);
                        }}
                      />
                      {imagenUbicacionFile ? (
                        <div className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{imagenUbicacionFile.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setImagenUbicacionFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : imagenUbicacionUrlActual ? (
                        <div className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <a href={imagenUbicacionUrlActual} target="_blank" rel="noreferrer" className="text-primary underline">
                              Ver imagen actual
                            </a>
                          </div>
                          <label htmlFor="imagen-ubicacion-input">
                            <span className="text-sm text-primary cursor-pointer hover:underline">Reemplazar</span>
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor="imagen-ubicacion-input"
                          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-gray-400 text-muted-foreground"
                        >
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-sm">Haz clic para subir una imagen de la ubicación</span>
                        </label>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              </div>
            )}

            {/* Paso 6: Costos */}
            {paso === 6 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <FormLabel>Distribución de Costos *</FormLabel>
                  {cargandoTiposCosto ? (
                    <p className="text-sm text-muted-foreground py-2">Cargando tipos de costo...</p>
                  ) : tiposCostoDisponibles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No hay tipos de costo registrados. Agrégalos en Configuración &gt; Tipos de Costo.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tiposCostoDisponibles.map((tipo) => (
                        <div key={tipo.id} className="flex items-center gap-3">
                          <span className="flex-1 text-sm text-gray-700">{tipo.descripcion}</span>
                          <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">S/</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-10"
                              value={costosPorTipo[tipo.id] ?? ''}
                              onChange={(e) => {
                                const monto = parseFloat(e.target.value) || 0;
                                setCostosPorTipo((prev) => ({ ...prev, [tipo.id]: monto }));
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                  <span className="font-medium">Costo por Participante</span>
                  <span className="text-lg font-semibold">S/ {totalCosto.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Paso 7: Información adicional */}
            {paso === 7 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="equipamiento_obligatorio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamiento Obligatorio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Mochila de campamento, sleeping bag, carpa personal..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equipamiento_opcional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamiento Opcional</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ej: Linterna extra, cámara fotográfica..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recomendaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recomendaciones para Participantes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Información importante, restricciones, consejos para padres..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Paso 8: Responsables */}
            {paso === 8 && (
              <div className="space-y-4">
                <div>
                  <FormLabel>Agregar Responsable</FormLabel>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar dirigente por nombre..."
                      className="pl-10"
                      value={busquedaResponsable}
                      onChange={(e) => setBusquedaResponsable(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                    {cargandoDirigentes ? (
                      <p className="text-sm text-muted-foreground p-3">Cargando dirigentes...</p>
                    ) : (
                      (() => {
                        const yaAgregados = new Set((form.watch('responsables') || []).map((r) => r.persona_id));
                        const filtrados = dirigentesDisponibles.filter(
                          (d) =>
                            !d.ya_asignado &&
                            !yaAgregados.has(d.id) &&
                            d.nombre.toLowerCase().includes(busquedaResponsable.toLowerCase())
                        );
                        if (filtrados.length === 0) {
                          return <p className="text-sm text-muted-foreground p-3">No hay dirigentes disponibles</p>;
                        }
                        return filtrados.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              responsablesArray.append({ persona_id: d.id, nombre: d.nombre, rol: 'DIRIGENTE' });
                              setBusquedaResponsable('');
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/80 transition-colors text-left border-b last:border-b-0"
                          >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{d.nombre}</p>
                              {d.cargo && <p className="text-xs text-muted-foreground">{d.cargo}</p>}
                            </div>
                          </button>
                        ));
                      })()
                    )}
                  </div>
                </div>

                <div>
                  <FormLabel>Responsables Agregados</FormLabel>
                  {responsablesArray.fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg mt-2">
                      Aún no agregaste responsables
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {responsablesArray.fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="flex-1 text-sm font-medium">{field.nombre}</span>
                          <FormField
                            control={form.control}
                            name={`responsables.${index}.rol`}
                            render={({ field: rolField }) => (
                              <Select onValueChange={rolField.onChange} value={rolField.value}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rolesStaff.map((r) => (
                                    <SelectItem key={r.codigo} value={r.codigo}>
                                      {r.icono} {r.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => responsablesArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 9: Riesgo */}
            {paso === 9 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Evaluación de Riesgo</h4>

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.actividad_accion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actividad / Acción</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Caminata por sendero rocoso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.lugar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lugar</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Zona de quebrada" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.peligro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peligro (Amenaza)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Terreno resbaladizo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.riesgo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Riesgo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Caída de participante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.consecuencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consecuencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Lesión leve a moderada" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="riesgo_evaluacion.severidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BAJO">Bajo</SelectItem>
                              <SelectItem value="MEDIO">Medio</SelectItem>
                              <SelectItem value="ALTO">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riesgo_evaluacion.frecuencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frecuencia</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">A - Común</SelectItem>
                              <SelectItem value="B">B - Ha sucedido</SelectItem>
                              <SelectItem value="C">C - Podría suceder</SelectItem>
                              <SelectItem value="D">D - Raro que suceda</SelectItem>
                              <SelectItem value="E">E - Prácticamente imposible que suceda</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.indice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Índice</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-32"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_evaluacion.acciones_preventivas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acciones Preventivas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Opcional..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Protocolos de Respuesta a Riesgos</h4>

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.nombre_procedimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de Procedimiento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Protocolo de evacuación" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.responsable_persona_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const elegido = (form.getValues('responsables') || []).find((r) => r.persona_id === value);
                            form.setValue('riesgo_protocolo.responsable_nombre', elegido?.nombre || '');
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                (form.watch('responsables') || []).length === 0
                                  ? 'Agrega responsables en el paso anterior'
                                  : 'Selecciona un responsable'
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(form.watch('responsables') || []).map((r) => (
                              <SelectItem key={r.persona_id} value={r.persona_id}>
                                {r.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.forma_contacto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Contacto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Radio canal 3, celular +51 999 999 999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.pasos_a_realizar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pasos a Realizar</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe los pasos del procedimiento..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.acciones_preventivas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acciones Preventivas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Opcional..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riesgo_protocolo.observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales..."
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div>
                {paso > 1 && !modoEdicion && (
                  <Button type="button" variant="outline" onClick={pasoAnterior}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                {modoEdicion ? (
                  // En modo edición: Guardar Cambios siempre visible
                  <Button type="button" onClick={guardarActividad} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                ) : (
                  // En modo creación: navegación secuencial
                  paso < PASOS.length ? (
                    <Button type="button" onClick={siguientePaso}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={guardarActividad} disabled={guardando}>
                      {guardando ? 'Creando...' : 'Crear Actividad'}
                    </Button>
                  )
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NuevaActividadDialog;
