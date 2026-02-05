import { useState, useEffect } from 'react';
import { 
	Calendar, Save, Plus, Search, Edit, Eye, Trash2, 
	TrendingUp, BarChart3, CheckCircle, Users, FileText, AlertTriangle
} from 'lucide-react';
import AsistenciaService from '../../services/asistenciaService';
import ScoutService from '../../services/scoutService';
import { supabase } from '../../lib/supabase';
import ReporteAsistenciaScout from './ReporteAsistenciaScout';
import { usePermissions } from '../../contexts/PermissionsContext';

// ==================== INTERFACES ====================
interface Reunion {
	id: string;
	fecha: string;
	titulo: string;
	descripcion?: string;
	rama?: string;
	tipo_actividad?: string;
	ubicacion?: string;
	hora_inicio?: string;
	hora_fin?: string;
	responsable?: string;
	total_invitados?: number;
	asistencias_registradas?: number;
}

interface Scout {
	id: string;
	nombres: string;
	apellidos: string;
	rama_actual: string;
	codigo_scout: string;
	estado?: string;
}

interface ReunionFormData {
	fecha: string;
	titulo: string;
	descripcion: string;
	rama: string;
	tipo_actividad: string;
	ubicacion: string;
	hora_inicio: string;
	hora_fin: string;
	responsable: string;
}

interface AsistenciaFormData {
	reunion_id: string;
	scout_id: string;
	estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
	hora_llegada: string;
	observaciones: string;
}

// ==================== COMPONENT ====================
export default function Asistencia() {
	// ============= PERMISOS =============
	const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();
	
	// ============= ESTADOS =============
	const [scouts, setScouts] = useState<Scout[]>([]);
	const [reuniones, setReuniones] = useState<Reunion[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRama, setSelectedRama] = useState('');
	const [vistaActual, setVistaActual] = useState<'reuniones' | 'asistencia' | 'estadisticas' | 'asistencia_masiva' | 'detalle_programa' | 'reporte_scout'>('reuniones');
	// ============= ASISTENCIA MASIVA =============
	const [selectedPrograma, setSelectedPrograma] = useState<Reunion | null>(null);
	const [selectedPatrulla, setSelectedPatrulla] = useState<string>('');
	const [asistenciaMasiva, setAsistenciaMasiva] = useState<Record<string, 'presente' | 'ausente' | 'tardanza' | 'justificado'>>({});
	// ============= DETALLE PROGRAMA =============
	const [asistenciasPrograma, setAsistenciasPrograma] = useState<any[]>([]);

	const handleOpenAsistenciaMasiva = async (programa: Reunion) => {
		setSelectedPrograma(programa);
		setVistaActual('asistencia_masiva');
		setSelectedPatrulla('');
		
		// Cargar asistencias ya guardadas para este programa
		const asistenciasGuardadas = await AsistenciaService.getAsistenciasPorActividad(programa.id);
		
		// Mapear estados guardados a formato del componente (MAYÚSCULAS → minúsculas)
		const estadoMapInverso: Record<string, 'presente' | 'ausente' | 'tardanza' | 'justificado'> = {
			'PRESENTE': 'presente',
			'AUSENTE': 'ausente',
			'TARDANZA': 'tardanza',
			'JUSTIFICADO': 'justificado'
		};
		
		const estadosGuardados: Record<string, 'presente' | 'ausente' | 'tardanza' | 'justificado'> = {};
		asistenciasGuardadas.forEach(asist => {
			estadosGuardados[asist.scout_id] = estadoMapInverso[asist.estado_asistencia] || 'presente';
		});
		
		setAsistenciaMasiva(estadosGuardados);
	};

	const handleSelectPatrulla = (patrulla: string) => {
		setSelectedPatrulla(patrulla);
		setAsistenciaMasiva({});
	};

	const scoutsFiltrados = scouts.filter(s => !selectedPatrulla || s.rama_actual === selectedPatrulla);

	const handleChangeAsistenciaScout = (scoutId: string, estado: 'presente' | 'ausente' | 'tardanza' | 'justificado') => {
		setAsistenciaMasiva(prev => ({ ...prev, [scoutId]: estado }));
	};

	const handleRegistrarAsistenciaMasiva = async () => {
		setLoading(true);
		try {
			// Obtener sesión autenticada (más confiable que getUser en Azure)
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.user) {
				alert('❌ Debes estar autenticado para registrar asistencia');
				return;
			}
			const user = session.user;

			// Supabase: inserción masiva
			// Mapear estados a valores del enum en BD (MAYÚSCULAS)
			const estadoMap: Record<string, string> = {
				'presente': 'PRESENTE',
				'ausente': 'AUSENTE',
				'tardanza': 'TARDANZA',
				'justificado': 'JUSTIFICADO'
			};
			const registros = Object.entries(asistenciaMasiva).map(([scout_id, estado]) => ({
				actividad_id: selectedPrograma?.id,
				scout_id,
				estado_asistencia: estadoMap[estado] || 'PRESENTE',
				fecha: selectedPrograma?.fecha || new Date().toISOString().split('T')[0],
				registrado_por: user.id
			}));
			const { data, error } = await AsistenciaService.registrarAsistenciaMasiva(registros);
			if (error) throw error;
			await loadInitialData();
			setVistaActual('reuniones');
			setSelectedPrograma(null);
			setSelectedPatrulla('');
			setAsistenciaMasiva({});
			alert(`✅ Asistencia actualizada exitosamente (${registros.length} scouts)`);
		} catch (error) {
			console.error('❌ Error:', error);
			alert('❌ Error al registrar asistencia masiva');
		} finally {
			setLoading(false);
		}
	};

	// Modales
	const [showCreateReunionModal, setShowCreateReunionModal] = useState(false);
	const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
	const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);

	// Formularios
	const [reunionFormData, setReunionFormData] = useState<ReunionFormData>({
		fecha: new Date().toISOString().split('T')[0],
		titulo: '',
		descripcion: '',
		rama: '',
		tipo_actividad: 'reunion_semanal',
		ubicacion: '',
		hora_inicio: '15:00',
		hora_fin: '17:00',
		responsable: ''
	});

	const [asistenciaFormData, setAsistenciaFormData] = useState<AsistenciaFormData>({
		reunion_id: '',
		scout_id: '',
		estado: 'presente',
		hora_llegada: '',
		observaciones: ''
	});

	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [estadisticas, setEstadisticas] = useState({
		total_reuniones: 0,
		promedio_asistencia: 0
	});

	// ============= CONFIGURACION =============
	const ramas = [
		{ value: 'MANADA', label: 'Manada (Lobatos/Lobeznas)' },
		{ value: 'TROPA', label: 'Tropa (Scouts)' },
		{ value: 'COMUNIDAD', label: 'Comunidad (Caminantes)' },
		{ value: 'CLAN', label: 'Clan (Rovers)' }
	];

	const tiposActividad = [
		{ value: 'reunion_semanal', label: 'Reunión Semanal' },
		{ value: 'campamento', label: 'Campamento' },
		{ value: 'actividad_especial', label: 'Actividad Especial' },
		{ value: 'ceremonia', label: 'Ceremonia' },
		{ value: 'capacitacion', label: 'Capacitación' },
		{ value: 'servicio', label: 'Servicio Comunitario' }
	];

	const estadosAsistencia = [
		{ value: 'presente', label: 'Presente', color: 'text-green-700 bg-green-100' },
		{ value: 'ausente', label: 'Ausente', color: 'text-red-700 bg-red-100' },
		{ value: 'tardanza', label: 'Tardanza', color: 'text-yellow-700 bg-yellow-100' },
		{ value: 'justificado', label: 'Justificado', color: 'text-blue-700 bg-blue-100' }
	];

	// ============= EFECTOS =============
	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		calculateStatistics();
	}, [reuniones]);

	// ============= FUNCIONES DE CARGA =============
	const loadInitialData = async () => {
		try {
			setLoading(true);
			const [scoutsData, reunionesData] = await Promise.all([
				ScoutService.getAllScouts(),
				AsistenciaService.getReuniones()
			]);
      
			// Filtrar scouts con estado 'activo' (cualquier variante)
			const scoutsActivos = scoutsData.filter(scout =>
				typeof scout.estado === 'string' && scout.estado.trim().toLowerCase() === 'activo'
			);
			setScouts(scoutsActivos.length > 0 ? scoutsActivos as Scout[] : scoutsData as Scout[]);
			setReuniones(reunionesData);
		} catch (error) {
			console.error('Error cargando datos:', error);
			// Datos demo para desarrollo
			setScouts([
				{ id: '1', nombres: 'Juan', apellidos: 'Pérez', rama_actual: 'TROPA', codigo_scout: 'TR2401' },
				{ id: '2', nombres: 'María', apellidos: 'González', rama_actual: 'TROPA', codigo_scout: 'TR2402' },
				{ id: '3', nombres: 'Carlos', apellidos: 'López', rama_actual: 'MANADA', codigo_scout: 'MA2401' }
			]);
			setReuniones([
				{
					id: '1',
					fecha: '2024-10-27',
					titulo: 'Reunión Semanal Tropa',
					descripcion: 'Actividades de pionerismo y juegos',
					rama: 'TROPA',
					tipo_actividad: 'reunion_semanal',
					ubicacion: 'Local Scout',
					hora_inicio: '15:00',
					hora_fin: '17:00',
					responsable: 'Juan Dirigente',
					total_invitados: 15,
					asistencias_registradas: 12
				}
			]);
		} finally {
			setLoading(false);
		}
	};

	const calculateStatistics = async () => {
		try {
			const stats = await AsistenciaService.getEstadisticasGenerales();
			setEstadisticas(stats);
		} catch (error) {
			// Cálculo local si falla el servicio
			setEstadisticas({
				total_reuniones: reuniones.length,
				promedio_asistencia: 85
			});
		}
	};

	// ============= FUNCIONES AUXILIARES =============
	const validateReunionForm = (): Record<string, string> => {
		const errors: Record<string, string> = {};

		if (!reunionFormData.fecha.trim()) {
			errors.fecha = 'La fecha es obligatoria';
		}
		if (!reunionFormData.titulo.trim()) {
			errors.titulo = 'El título es obligatoria';
		}
		if (!reunionFormData.rama) {
			errors.rama = 'La rama es obligatoria';
		}

		return errors;
	};

	const validateAsistenciaForm = (): Record<string, string> => {
		const errors: Record<string, string> = {};

		if (!asistenciaFormData.scout_id) {
			errors.scout_id = 'Debe seleccionar un scout';
		}
		if (!asistenciaFormData.estado) {
			errors.estado = 'Debe seleccionar un estado';
		}

		return errors;
	};

	const resetReunionForm = () => {
		setReunionFormData({
			fecha: new Date().toISOString().split('T')[0],
			titulo: '',
			descripcion: '',
			rama: '',
			tipo_actividad: 'reunion_semanal',
			ubicacion: '',
			hora_inicio: '15:00',
			hora_fin: '17:00',
			responsable: ''
		});
		setFormErrors({});
		setSelectedReunion(null);
	};

	const resetAsistenciaForm = () => {
		setAsistenciaFormData({
			reunion_id: '',
			scout_id: '',
			estado: 'presente',
			hora_llegada: '',
			observaciones: ''
		});
		setFormErrors({});
	};

	// ============= FUNCIONES CRUD =============
	const handleCreateReunion = async () => {
		// Verificar permiso
		if (!puedeCrear('asistencia')) {
			alert('No tienes permiso para crear reuniones');
			return;
		}
		try {
			const errors = validateReunionForm();
			if (Object.keys(errors).length > 0) {
				setFormErrors(errors);
				return;
			}

			setLoading(true);
			const result = await AsistenciaService.crearReunion(reunionFormData);
      
			if (result.success) {
				await loadInitialData();
				setShowCreateReunionModal(false);
				resetReunionForm();
				alert('✅ Reunión creada exitosamente');
			} else {
				alert(`❌ Error: ${result.error}`);
			}
		} catch (error) {
			console.error('Error creando reunión:', error);
			alert('❌ Error al crear la reunión');
		} finally {
			setLoading(false);
		}
	};

	const handleEditReunion = (reunion: Reunion) => {
		if (!puedeEditar('asistencia')) {
			alert('No tienes permiso para editar reuniones');
			return;
		}
		setSelectedReunion(reunion);
		setReunionFormData({
			fecha: reunion.fecha,
			titulo: reunion.titulo,
			descripcion: reunion.descripcion || '',
			rama: reunion.rama || '',
			tipo_actividad: reunion.tipo_actividad || 'reunion_semanal',
			ubicacion: reunion.ubicacion || '',
			hora_inicio: reunion.hora_inicio || '15:00',
			hora_fin: reunion.hora_fin || '17:00',
			responsable: reunion.responsable || ''
		});
		alert('Modal de edición - Implementar en siguiente iteración');
	};

	const handleDeleteReunion = async (reunion: Reunion) => {
		if (!puedeEliminar('asistencia')) {
			alert('No tienes permiso para eliminar reuniones');
			return;
		}
		if (!window.confirm(`¿Estás seguro de eliminar la reunión "${reunion.titulo}"?`)) {
			return;
		}

		try {
			setLoading(true);
			const result = await AsistenciaService.deleteReunion(reunion.id);
      
			if (result.success) {
				await loadInitialData();
				alert('✅ Reunión eliminada exitosamente');
			} else {
				alert(`❌ Error: ${result.error}`);
			}
		} catch (error) {
			console.error('Error eliminando reunión:', error);
			alert('❌ Error al eliminar la reunión');
		} finally {
			setLoading(false);
		}
	};

	const handleViewReunion = async (reunion: Reunion) => {
		try {
			setLoading(true);
			setSelectedReunion(reunion);
			
			// Cargar asistencias del programa
			const asistencias = await AsistenciaService.getAsistenciasPorActividad(reunion.id);
			
			// Enriquecer con datos de scouts
			const asistenciasConScout = asistencias.map(asist => {
				const scout = scouts.find(s => s.id === asist.scout_id);
				return {
					...asist,
					scout_nombre: scout ? `${scout.nombres} ${scout.apellidos}` : 'Desconocido',
					scout_codigo: scout?.codigo_scout || 'N/A',
					scout_rama: scout?.rama_actual || 'N/A'
				};
			});
			
			setAsistenciasPrograma(asistenciasConScout);
			setVistaActual('detalle_programa');
		} catch (error) {
			console.error('Error cargando detalles de reunión:', error);
			alert('❌ Error al cargar detalles');
		} finally {
			setLoading(false);
		}
	};

	const handleRegistrarAsistencia = (reunion: Reunion) => {
		setAsistenciaFormData(prev => ({
			...prev,
			reunion_id: reunion.id
		}));
		setSelectedReunion(reunion);
		setShowAsistenciaModal(true);
	};

	const handleSubmitAsistencia = async () => {
		try {
			const errors = validateAsistenciaForm();
			if (Object.keys(errors).length > 0) {
				setFormErrors(errors);
				return;
			}

			setLoading(true);
			// Obtener sesión autenticada (más confiable que getUser en Azure)
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.user) {
				alert('❌ Debes estar autenticado para registrar asistencia');
				return;
			}
			const user = session.user;

			// Normalizar estado para el enum de la BD
			const estadoMap: Record<string, string> = {
				'presente': 'PRESENTE',
				'ausente': 'AUSENTE',
				'tardanza': 'TARDANZA',
				'justificado': 'JUSTIFICADO'
			};
			const result = await AsistenciaService.registrarAsistencia({
				actividad_id: asistenciaFormData.reunion_id, // Usamos el id de la reunión (programa_semanal) como actividad_id
				scout_id: asistenciaFormData.scout_id,
				estado_asistencia: (asistenciaFormData.estado === 'justificado' ? 'JUSTIFICADO' : asistenciaFormData.estado?.toUpperCase() || 'PRESENTE'),
				hora_llegada: asistenciaFormData.hora_llegada || undefined,
				observaciones: asistenciaFormData.observaciones || undefined,
				registrado_por: user.id,
				fecha: selectedReunion?.fecha || new Date().toISOString().split('T')[0]
			});
      
			if (result.success) {
				await loadInitialData();
				resetAsistenciaForm();
				setShowAsistenciaModal(false);
				alert('✅ Asistencia registrada exitosamente');
			} else {
				alert(`❌ Error: ${result.error}`);
			}
		} catch (error) {
			console.error('Error registrando asistencia:', error);
			alert('❌ Error al registrar la asistencia');
		} finally {
			setLoading(false);
		}
	};

	const filteredReuniones = reuniones.filter(reunion => {
		const matchesSearch = reunion.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
												 reunion.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRama = !selectedRama || reunion.rama === selectedRama;
    
		return matchesSearch && matchesRama;
	});

	// ============= RENDER =============
	if (loading && reuniones.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Cargando sistema de asistencia...</p>
				</div>
			</div>
		);
	}

	// ============= VISTA REPORTE POR SCOUT =============
	if (vistaActual === 'reporte_scout') {
		return (
			<ReporteAsistenciaScout 
				onClose={() => setVistaActual('reuniones')}
			/>
		);
	}

	// ============= VISTA DETALLE PROGRAMA =============
	if (vistaActual === 'detalle_programa' && selectedReunion) {
		const totalAsistencias = asistenciasPrograma.length;
		const presentes = asistenciasPrograma.filter(a => a.estado_asistencia === 'PRESENTE').length;
		const ausentes = asistenciasPrograma.filter(a => a.estado_asistencia === 'AUSENTE').length;
		const tardanzas = asistenciasPrograma.filter(a => a.estado_asistencia === 'TARDANZA').length;
		const justificados = asistenciasPrograma.filter(a => a.estado_asistencia === 'JUSTIFICADO').length;
		const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((presentes / totalAsistencias) * 100) : 0;

		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-6">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white mb-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold mb-2">Detalle de Asistencia</h1>
								<p className="text-purple-100 text-lg">{selectedReunion.titulo}</p>
								<p className="text-sm text-purple-200">{selectedReunion.fecha} • {selectedReunion.rama}</p>
							</div>
							<button 
								onClick={() => {
									setVistaActual('reuniones');
									setSelectedReunion(null);
									setAsistenciasPrograma([]);
								}}
								className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
							>
								← Volver
							</button>
						</div>
					</div>

					{/* KPIs de Asistencia */}
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
						<div className="bg-white rounded-xl shadow-lg p-4">
							<div className="text-center">
								<Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">Total</p>
								<p className="text-3xl font-bold text-gray-900">{totalAsistencias}</p>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-lg p-4">
							<div className="text-center">
								<CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">Presentes</p>
								<p className="text-3xl font-bold text-green-600">{presentes}</p>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-lg p-4">
							<div className="text-center">
								<AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">Ausentes</p>
								<p className="text-3xl font-bold text-red-600">{ausentes}</p>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-lg p-4">
							<div className="text-center">
								<Calendar className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">Tardanzas</p>
								<p className="text-3xl font-bold text-yellow-600">{tardanzas}</p>
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-lg p-4">
							<div className="text-center">
								<TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">% Asistencia</p>
								<p className="text-3xl font-bold text-purple-600">{porcentajeAsistencia}%</p>
							</div>
						</div>
					</div>

					{/* Tabla de Asistencias */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="p-6 border-b">
							<h2 className="text-xl font-bold text-gray-900">Registro de Asistencias</h2>
						</div>
						{asistenciasPrograma.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rama</th>
											<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora Llegada</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{asistenciasPrograma.map((asist, idx) => {
											const estadoConfig = {
												'PRESENTE': { color: 'bg-green-100 text-green-800', label: 'Presente' },
												'AUSENTE': { color: 'bg-red-100 text-red-800', label: 'Ausente' },
												'TARDANZA': { color: 'bg-yellow-100 text-yellow-800', label: 'Tardanza' },
												'JUSTIFICADO': { color: 'bg-blue-100 text-blue-800', label: 'Justificado' }
											}[asist.estado_asistencia] || { color: 'bg-gray-100 text-gray-800', label: 'Desconocido' };

											return (
												<tr key={idx} className="hover:bg-gray-50">
													<td className="px-6 py-4 text-sm text-gray-900">{asist.scout_codigo}</td>
													<td className="px-6 py-4 text-sm font-medium text-gray-900">{asist.scout_nombre}</td>
													<td className="px-6 py-4 text-sm text-gray-600">{asist.scout_rama}</td>
													<td className="px-6 py-4 text-center">
														<span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
															{estadoConfig.label}
														</span>
													</td>
													<td className="px-6 py-4 text-sm text-gray-600">{asist.hora_llegada || '-'}</td>
													<td className="px-6 py-4 text-sm text-gray-600">{asist.observaciones || '-'}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						) : (
							<div className="text-center py-12">
								<Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">Sin asistencias registradas</h3>
								<p className="text-gray-500 mb-4">Aún no se ha registrado asistencia para este programa</p>
								<button 
									onClick={() => handleOpenAsistenciaMasiva(selectedReunion)}
									className="btn-primary"
								>
									<BarChart3 className="w-4 h-4 inline mr-2" />
									Registrar Asistencia Masiva
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// ============= VISTA ASISTENCIA MASIVA =============
	if (vistaActual === 'asistencia_masiva' && selectedPrograma) {
		return (
			<div className="min-h-screen bg-gray-50 p-4 md:p-6">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-bold mb-2">Asistencia Masiva</h1>
								<p className="text-blue-100">{selectedPrograma.titulo}</p>
								<p className="text-sm text-blue-200">{selectedPrograma.fecha} • {selectedPrograma.rama}</p>
							</div>
							<button 
								onClick={() => {
									setVistaActual('reuniones');
									setSelectedPrograma(null);
									setAsistenciaMasiva({});
								}}
								className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
							>
								← Volver
							</button>
						</div>
					</div>

					{/* Acciones Rápidas */}
					<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-bold text-gray-900">Acciones Rápidas</h2>
							{/* KPI: Scouts con registro */}
							<div className="flex items-center gap-4">
								<div className="text-right">
									<p className="text-xs text-gray-500">Scouts con registro</p>
									<p className="text-2xl font-bold text-blue-600">
										{Object.keys(asistenciaMasiva).length} / {scoutsFiltrados.length}
									</p>
								</div>
								<div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
									<Users className="w-6 h-6 text-blue-600" />
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<button
								onClick={() => {
									const todos = new Map();
									scoutsFiltrados.forEach(s => todos.set(s.id, 'presente'));
									setAsistenciaMasiva(Object.fromEntries(todos));
								}}
								className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
							>
								<CheckCircle className="w-4 h-4" />
								Todos Presente
							</button>
							<button
								onClick={() => {
									const todos = new Map();
									scoutsFiltrados.forEach(s => todos.set(s.id, 'ausente'));
									setAsistenciaMasiva(Object.fromEntries(todos));
								}}
								className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
							>
								<AlertTriangle className="w-4 h-4" />
								Todos Ausente
							</button>
							<button
								onClick={() => setAsistenciaMasiva({})}
								className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
							>
								Limpiar Selección
							</button>
						</div>

						{/* Botón Guardar */}
						{Object.keys(asistenciaMasiva).length > 0 && (
							<div className="mt-4 flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
								<div>
									<p className="text-sm font-medium text-blue-900">
										{Object.keys(asistenciaMasiva).length} scout(s) seleccionado(s)
									</p>
								</div>
								<button
									onClick={handleRegistrarAsistenciaMasiva}
									disabled={loading}
									className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
								>
									{loading ? 'Guardando...' : (
										<>
											<CheckCircle className="w-5 h-5" />
											Guardar Asistencias
										</>
									)}
								</button>
							</div>
						)}
					</div>

					{/* Lista de Scouts */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
							<h2 className="text-lg font-bold text-gray-900">Scouts ({scoutsFiltrados.length})</h2>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scout</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones Rápidas</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{scoutsFiltrados.map(scout => {
										const estadoActual = asistenciaMasiva[scout.id];
									const tieneRegistro = estadoActual !== undefined;
									return (
										<tr key={scout.id} className={`hover:bg-gray-50 ${tieneRegistro ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
											<td className="px-6 py-4">
												<div className="flex items-center">
													<div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
														<span className="text-blue-600 font-bold text-sm">
															{scout.nombres.charAt(0)}{scout.apellidos.charAt(0)}
														</span>
													</div>
													<div className="ml-4">
														<div className="text-sm font-medium text-gray-900">
															{scout.nombres} {scout.apellidos}
															{tieneRegistro && (
																<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
																	✓ Guardado
																</span>
															)}
															</div>
															<div className="text-sm text-gray-500">{scout.rama_actual}</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 text-sm text-gray-500">{scout.codigo_scout}</td>
												<td className="px-6 py-4">
													<div className="flex items-center justify-center gap-2">
														{estadosAsistencia.map(estado => {
															const isSelected = estadoActual === estado.value;
															return (
																<button
																	key={estado.value}
																	onClick={() => handleChangeAsistenciaScout(scout.id, estado.value as any)}
																	className={`p-2 rounded-lg transition-all ${
																		isSelected 
																			? estado.color + ' text-white scale-110 shadow-lg'
																			: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
																	}`}
																	title={estado.label}
																>
																	<CheckCircle className="w-4 h-4" />
																</button>
															);
														})}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				{/* KPIs de asistencia */}
				{/* KPIs superiores - Solo métricas relevantes */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
					<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Total Reuniones</p>
								<p className="text-2xl font-bold text-gray-900">{estadisticas.total_reuniones}</p>
							</div>
							<Calendar className="w-8 h-8 text-blue-600" />
						</div>
					</div>
					<div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Promedio Asistencia</p>
								<p className="text-2xl font-bold text-green-600">{estadisticas.promedio_asistencia}%</p>
							</div>
							<TrendingUp className="w-8 h-8 text-green-600" />
						</div>
					</div>
				</div>

				{/* Filtros y búsqueda */}
				<div className="bg-white rounded-lg shadow mb-6 p-4 flex gap-4 items-center flex-wrap">
					<select className="w-32" value={selectedRama} onChange={e => setSelectedRama(e.target.value)}>
						<option value="">Todas las ramas</option>
						{ramas.map(rama => (
							<option key={rama.value} value={rama.value}>{rama.label}</option>
						))}
					</select>
					<input
						type="search"
						placeholder="Buscar por título..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="flex-1 px-4 py-2 border rounded-lg"
					/>
					<button 
						className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
						onClick={() => setVistaActual('reporte_scout')}
					>
						<FileText className="w-4 h-4" /> Reportes por Scout
					</button>
					<button className="btn-primary" onClick={() => setShowCreateReunionModal(true)}>
						<Plus className="w-4 h-4" /> Nueva Reunión
					</button>
				</div>

				{/* Lista de reuniones y flujo de asistencia */}
				{filteredReuniones.length > 0 ? (
					<div className="space-y-4 mt-6">
						{filteredReuniones.map(reunion => (
							<div key={reunion.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
								<div>
									<h3 className="font-bold text-lg">{reunion.titulo}</h3>
									<p className="text-gray-600">{reunion.descripcion}</p>
									<div className="text-sm text-gray-500">{reunion.fecha} | {reunion.rama}</div>
								</div>
								<div className="flex gap-2 mt-4 md:mt-0">
									<button className="btn-secondary" onClick={() => handleRegistrarAsistencia(reunion)}>
										<CheckCircle className="w-4 h-4" /> Registrar Asistencia
									</button>
									<button className="btn-secondary" onClick={() => handleOpenAsistenciaMasiva(reunion)}>
										<BarChart3 className="w-4 h-4" /> Asistencia Masiva
									</button>
									<button className="btn-secondary" onClick={() => handleViewReunion(reunion)}>
										<Eye className="w-4 h-4" /> Ver Detalles
									</button>
									<button className="btn-secondary" onClick={() => handleEditReunion(reunion)}>
										<Edit className="w-4 h-4" /> Editar
									</button>
									<button className="btn-danger" onClick={() => handleDeleteReunion(reunion)}>
										<Trash2 className="w-4 h-4" /> Eliminar
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<Calendar className="mx-auto h-24 w-24 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">No hay reuniones registradas</h3>
						<p className="text-gray-500 mb-4">Comienza creando una reunión para registrar asistencia</p>
						<button className="btn-primary" onClick={() => setShowCreateReunionModal(true)}>
							Crear Reunión
						</button>
					</div>
				)}

				{/* MODAL CREAR REUNION */}
				{showCreateReunionModal && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg max-w-md w-full">
							{/* ...contenido del modal... */}
						</div>
					</div>
				)}
				   {/* MODAL REGISTRAR ASISTENCIA */}
				   {showAsistenciaModal && selectedReunion && (
					   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						   <div className="bg-white rounded-lg max-w-md w-full p-6">
							   <h2 className="text-xl font-bold mb-4">Registrar Asistencia</h2>
							   <div className="mb-4">
								   <label className="block text-sm font-medium mb-1">Scout</label>
								   <select
									   className="w-full px-4 py-2 border rounded-lg"
									   value={asistenciaFormData.scout_id}
									   onChange={e => setAsistenciaFormData({ ...asistenciaFormData, scout_id: e.target.value })}
								   >
									   <option value="">Selecciona un scout...</option>
									   {scouts.map(s => (
										   <option key={s.id} value={s.id}>{s.nombres} {s.apellidos} ({s.rama_actual})</option>
									   ))}
								   </select>
								   {formErrors.scout_id && <p className="text-red-500 text-xs mt-1">{formErrors.scout_id}</p>}
							   </div>
							   <div className="mb-4">
								   <label className="block text-sm font-medium mb-1">Estado</label>
								   <select
									   className="w-full px-4 py-2 border rounded-lg"
									   value={asistenciaFormData.estado}
									   onChange={e => setAsistenciaFormData({ ...asistenciaFormData, estado: e.target.value as any })}
								   >
									   {estadosAsistencia.map(ea => (
										   <option key={ea.value} value={ea.value}>{ea.label}</option>
									   ))}
								   </select>
								   {formErrors.estado && <p className="text-red-500 text-xs mt-1">{formErrors.estado}</p>}
							   </div>
							   <div className="mb-4">
								   <label className="block text-sm font-medium mb-1">Hora de llegada</label>
								   <input
									   type="time"
									   className="w-full px-4 py-2 border rounded-lg"
									   value={asistenciaFormData.hora_llegada}
									   onChange={e => setAsistenciaFormData({ ...asistenciaFormData, hora_llegada: e.target.value })}
								   />
							   </div>
							   <div className="mb-4">
								   <label className="block text-sm font-medium mb-1">Observaciones</label>
								   <textarea
									   className="w-full px-4 py-2 border rounded-lg"
									   value={asistenciaFormData.observaciones}
									   onChange={e => setAsistenciaFormData({ ...asistenciaFormData, observaciones: e.target.value })}
								   />
							   </div>
							   <div className="flex gap-4 justify-end mt-6">
								   <button
									   className="btn-secondary"
									   onClick={() => { setShowAsistenciaModal(false); resetAsistenciaForm(); }}
									   type="button"
								   >
									   Cancelar
								   </button>
								   <button
									   className="btn-primary"
									   onClick={handleSubmitAsistencia}
									   disabled={loading}
									   type="button"
								   >
									   <Save className="w-4 h-4 inline mr-2" /> Registrar
								   </button>
							   </div>
						   </div>
					   </div>
				   )}
			</div>
		</div>
	);
}
