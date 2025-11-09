import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiUsers, FiCalendar, FiBarChart2, FiEye } from 'react-icons/fi';
import PresupuestoService from '../../services/presupuestoService';
import type { Campamento, GastoCampamento, ParticipanteCampamento } from '../../lib/supabase';

interface ResumenCampamento {
  participantes: { jovenes: number; adultos: number; total: number };
  finanzas: { ingresos_esperados: number; gastos_total: number; balance: number };
  pagos: { recibidos: number; pendientes: number; porcentaje_cobrado: number };
}

const Presupuestos: React.FC = () => {
  const [campamentos, setCampamentos] = useState<Campamento[]>([]);
  const [campamentoSeleccionado, setCampamentoSeleccionado] = useState<Campamento | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'participantes' | 'gastos' | 'ingresos' | 'reportes'>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos del campamento seleccionado
  const [participantes, setParticipantes] = useState<ParticipanteCampamento[]>([]);
  const [gastos, setGastos] = useState<GastoCampamento[]>([]);
  const [resumen, setResumen] = useState<ResumenCampamento | null>(null);

  // Estados para modales
  const [showCampamentoModal, setShowCampamentoModal] = useState(false);
  const [showParticipanteModal, setShowParticipanteModal] = useState(false);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [showEditCampamentoModal, setShowEditCampamentoModal] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [showEditGastoModal, setShowEditGastoModal] = useState(false);
  const [showViewCampamentoModal, setShowViewCampamentoModal] = useState(false);
  const [showViewParticipanteModal, setShowViewParticipanteModal] = useState(false);
  const [showViewGastoModal, setShowViewGastoModal] = useState(false);

  // Estados para elementos seleccionados para edición/vista
  const [selectedCampamento, setSelectedCampamento] = useState<Campamento | null>(null);
  const [selectedParticipante, setSelectedParticipante] = useState<ParticipanteCampamento | null>(null);
  const [selectedGasto, setSelectedGasto] = useState<GastoCampamento | null>(null);

  // Estados para formularios
  const [nuevoCampamento, setNuevoCampamento] = useState({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    responsable: '',
    presupuesto_estimado: 0
  });

  const [nuevoParticipante, setNuevoParticipante] = useState({
    nombre: '',
    apellido: '',
    tipo_participante: 'joven' as 'joven' | 'adulto',
    cargo: '',
    rama: '',
    telefono: '',
    email: ''
  });

  const [nuevoGasto, setNuevoGasto] = useState({
    concepto: '',
    categoria: 'materiales' as 'movilidad' | 'alimentacion' | 'alojamiento' | 'materiales' | 'equipamiento' | 'servicios' | 'emergencias' | 'otros',
    monto_total: 0,
    descripcion: '',
    proveedor: '',
    responsable_pago: ''
  });

  useEffect(() => {
    loadCampamentos();
  }, []);

  useEffect(() => {
    if (campamentoSeleccionado) {
      loadDatosCampamento();
    }
  }, [campamentoSeleccionado]);

  const loadCampamentos = async () => {
    try {
      setLoading(true);
      const data = await PresupuestoService.getAllCampamentos();
      setCampamentos(data);
      if (data.length > 0 && !campamentoSeleccionado) {
        setCampamentoSeleccionado(data[0]);
      }
    } catch (err) {
      setError('Error al cargar campamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatosCampamento = async () => {
    if (!campamentoSeleccionado) return;

    try {
      const [participantesData, gastosData, resumenData] = await Promise.all([
        PresupuestoService.getParticipantesByCampamento(campamentoSeleccionado.id),
        PresupuestoService.getGastosByCampamento(campamentoSeleccionado.id),
        PresupuestoService.getResumenCampamento(campamentoSeleccionado.id)
      ]);

      setParticipantes(participantesData);
      setGastos(gastosData);
      setResumen(resumenData);
    } catch (err) {
      setError('Error al cargar datos del campamento');
      console.error(err);
    }
  };

  const handleCreateCampamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const campamento = await PresupuestoService.createCampamento({
        nombre: nuevoCampamento.nombre,
        descripcion: nuevoCampamento.descripcion,
        fecha_inicio: nuevoCampamento.fecha_inicio,
        fecha_fin: nuevoCampamento.fecha_fin,
        ubicacion: nuevoCampamento.lugar
      });

      if (campamento.success) {
        await loadCampamentos(); // Recargar la lista completa
        setShowCampamentoModal(false);
        setNuevoCampamento({
          nombre: '',
          descripcion: '',
          fecha_inicio: '',
          fecha_fin: '',
          lugar: '',
          responsable: '',
          presupuesto_estimado: 0
        });
      } else {
        setError(campamento.error || 'Error al crear campamento');
      }
    } catch (err) {
      setError('Error al crear campamento');
      console.error(err);
    }
  };

  const handleAddParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campamentoSeleccionado) return;

    try {
      const resultado = await PresupuestoService.addParticipante({
        ...nuevoParticipante,
        campamento_id: campamentoSeleccionado.id
      });

      if (resultado.success) {
        // Recargar datos del campamento completo
        await loadDatosCampamento();
        setShowParticipanteModal(false);
        setNuevoParticipante({
          nombre: '',
          apellido: '',
          tipo_participante: 'joven',
          cargo: '',
          rama: '',
          telefono: '',
          email: ''
        });
      } else {
        setError(resultado.error || 'Error al agregar participante');
      }
    } catch (err) {
      setError('Error al agregar participante');
      console.error(err);
    }
  };

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campamentoSeleccionado) return;

    try {
      const resultado = await PresupuestoService.registrarGasto(
        campamentoSeleccionado.id,
        nuevoGasto.concepto,
        nuevoGasto.categoria,
        nuevoGasto.monto_total,
        nuevoGasto.descripcion,
        nuevoGasto.proveedor,
        nuevoGasto.responsable_pago
      );

      if (resultado.success) {
        // Recargar gastos y resumen
        await loadDatosCampamento();
        setShowGastoModal(false);
        setNuevoGasto({
          concepto: '',
          categoria: 'materiales',
          monto_total: 0,
          descripcion: '',
          proveedor: '',
          responsable_pago: ''
        });
      } else {
        setError(resultado.error || 'Error al registrar gasto');
      }
    } catch (err) {
      setError('Error al agregar gasto');
      console.error(err);
    }
  };

  // ============= 🏕️ FUNCIONES DE EDICIÓN DE CAMPAMENTOS =============
  
  const handleEditCampamento = (campamento: Campamento) => {
    setSelectedCampamento(campamento);
    setNuevoCampamento({
      nombre: campamento.nombre,
      descripcion: campamento.descripcion || '',
      fecha_inicio: campamento.fecha_inicio,
      fecha_fin: campamento.fecha_fin,
      lugar: (campamento as any).ubicacion || campamento.nombre || '',
      responsable: campamento.responsable || '',
      presupuesto_estimado: campamento.presupuesto_estimado || 0
    });
    setShowEditCampamentoModal(true);
  };

  const handleUpdateCampamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampamento) return;

    try {
      const resultado = await PresupuestoService.updateCampamento(
        selectedCampamento.id,
        {
          nombre: nuevoCampamento.nombre,
          descripcion: nuevoCampamento.descripcion,
          fecha_inicio: nuevoCampamento.fecha_inicio,
          fecha_fin: nuevoCampamento.fecha_fin,
          ubicacion: nuevoCampamento.lugar,
          responsable: nuevoCampamento.responsable,
          presupuesto_estimado: nuevoCampamento.presupuesto_estimado
        }
      );

      if (resultado.success) {
        await loadCampamentos();
        setShowEditCampamentoModal(false);
        setSelectedCampamento(null);
      } else {
        setError(resultado.error || 'Error al actualizar campamento');
      }
    } catch (err) {
      setError('Error al actualizar campamento');
      console.error(err);
    }
  };

  const handleDeleteCampamento = async (campamento: Campamento) => {
    if (window.confirm(`¿Estás seguro de eliminar el campamento "${campamento.nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        const resultado = await PresupuestoService.deleteCampamento(campamento.id);
        
        if (resultado.success) {
          await loadCampamentos();
          if (campamentoSeleccionado?.id === campamento.id) {
            setCampamentoSeleccionado(null);
          }
        } else {
          setError(resultado.error || 'Error al eliminar campamento');
        }
      } catch (err) {
        setError('Error al eliminar campamento');
        console.error(err);
      }
    }
  };

  // ============= 👥 FUNCIONES DE EDICIÓN DE PARTICIPANTES =============
  
  const handleEditParticipante = (participante: ParticipanteCampamento) => {
    setSelectedParticipante(participante);
    setNuevoParticipante({
      nombre: participante.nombre,
      apellido: participante.apellido,
      tipo_participante: participante.tipo_participante,
      cargo: participante.cargo || '',
      rama: participante.rama || '',
      telefono: participante.telefono || '',
      email: participante.email || ''
    });
    setShowEditParticipanteModal(true);
  };

  const handleUpdateParticipante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipante) return;

    try {
      const resultado = await PresupuestoService.updateParticipante(
        selectedParticipante.id,
        {
          nombre: nuevoParticipante.nombre,
          apellido: nuevoParticipante.apellido,
          tipo_participante: nuevoParticipante.tipo_participante,
          cargo: nuevoParticipante.cargo,
          rama: nuevoParticipante.rama,
          telefono: nuevoParticipante.telefono,
          email: nuevoParticipante.email
        }
      );

      if (resultado.success) {
        await loadDatosCampamento();
        setShowEditParticipanteModal(false);
        setSelectedParticipante(null);
      } else {
        setError(resultado.error || 'Error al actualizar participante');
      }
    } catch (err) {
      setError('Error al actualizar participante');
      console.error(err);
    }
  };

  const handleDeleteParticipante = async (participante: ParticipanteCampamento) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${participante.nombre} ${participante.apellido}"? Esta acción no se puede deshacer.`)) {
      try {
        const resultado = await PresupuestoService.deleteParticipante(participante.id);
        
        if (resultado.success) {
          await loadDatosCampamento();
        } else {
          setError(resultado.error || 'Error al eliminar participante');
        }
      } catch (err) {
        setError('Error al eliminar participante');
        console.error(err);
      }
    }
  };

  // ============= 💸 FUNCIONES DE EDICIÓN DE GASTOS =============
  
  const handleEditGasto = (gasto: GastoCampamento) => {
    setSelectedGasto(gasto);
    setNuevoGasto({
      concepto: gasto.concepto,
      categoria: gasto.categoria,
      monto_total: gasto.monto_total,
      descripcion: gasto.descripcion || '',
      proveedor: gasto.proveedor || '',
      responsable_pago: gasto.responsable_pago || ''
    });
    setShowEditGastoModal(true);
  };

  const handleUpdateGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGasto) return;

    try {
      const resultado = await PresupuestoService.updateGasto(
        selectedGasto.id,
        {
          concepto: nuevoGasto.concepto,
          categoria: nuevoGasto.categoria,
          monto_total: nuevoGasto.monto_total,
          descripcion: nuevoGasto.descripcion,
          proveedor: nuevoGasto.proveedor,
          responsable_pago: nuevoGasto.responsable_pago
        }
      );

      if (resultado.success) {
        await loadDatosCampamento();
        setShowEditGastoModal(false);
        setSelectedGasto(null);
      } else {
        setError(resultado.error || 'Error al actualizar gasto');
      }
    } catch (err) {
      setError('Error al actualizar gasto');
      console.error(err);
    }
  };

  const handleDeleteGasto = async (gasto: GastoCampamento) => {
    if (window.confirm(`¿Estás seguro de eliminar el gasto "${gasto.concepto}"? Esta acción no se puede deshacer.`)) {
      try {
        const resultado = await PresupuestoService.deleteGasto(gasto.id);
        
        if (resultado.success) {
          await loadDatosCampamento();
        } else {
          setError(resultado.error || 'Error al eliminar gasto');
        }
      } catch (err) {
        setError('Error al eliminar gasto');
        console.error(err);
      }
    }
  };

  // ============= 👁️ FUNCIONES DE VISTA DETALLADA =============
  
  const handleViewCampamento = (campamento: Campamento) => {
    setSelectedCampamento(campamento);
    setShowViewCampamentoModal(true);
  };

  const handleViewParticipante = (participante: ParticipanteCampamento) => {
    setSelectedParticipante(participante);
    setShowViewParticipanteModal(true);
  };

  const handleViewGasto = (gasto: GastoCampamento) => {
    setSelectedGasto(gasto);
    setShowViewGastoModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      'planificacion': 'bg-yellow-100 text-yellow-800',
      'activo': 'bg-green-100 text-green-800',
      'finalizado': 'bg-blue-100 text-blue-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Presupuestos de Campamentos</h1>
            <p className="text-gray-600">Gestión financiera de campamentos y actividades</p>
          </div>
          <button
            onClick={() => setShowCampamentoModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Campamento</span>
          </button>
        </div>

        {/* Selector de Campamento */}
        <div className="flex space-x-4">
          <select
            value={campamentoSeleccionado?.id || ''}
            onChange={(e) => {
              const campamento = campamentos.find(c => c.id === e.target.value);
              setCampamentoSeleccionado(campamento || null);
            }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Seleccionar campamento</option>
            {campamentos.map(campamento => (
              <option key={campamento.id} value={campamento.id}>
                {campamento.nombre} - {new Date(campamento.fecha_inicio).getFullYear()}
              </option>
            ))}
          </select>
          {campamentoSeleccionado && (
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-2 rounded-full text-sm font-medium ${getEstadoColor(campamentoSeleccionado.estado)}`}>
                {campamentoSeleccionado.estado}
              </span>
              <button
                onClick={() => handleViewCampamento(campamentoSeleccionado)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Ver detalles del campamento"
              >
                <FiEye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditCampamento(campamentoSeleccionado)}
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                title="Editar campamento"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCampamento(campamentoSeleccionado)}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                title="Eliminar campamento"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {campamentoSeleccionado && (
        <>
          {/* Resumen Rápido */}
          {resumen && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <FiUsers className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Participantes</p>
                    <p className="text-2xl font-bold text-gray-900">{resumen.participantes.total}</p>
                    <p className="text-xs text-gray-500">
                      {resumen.participantes.jovenes} jóvenes, {resumen.participantes.adultos} adultos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <FiDollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos Esperados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(resumen.finanzas.ingresos_esperados)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumen.pagos.porcentaje_cobrado}% cobrado
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <FiBarChart2 className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(resumen.finanzas.gastos_total)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <FiDollarSign className={`w-8 h-8 ${resumen.finanzas.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className={`text-2xl font-bold ${resumen.finanzas.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(resumen.finanzas.balance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'resumen', label: 'Resumen', icon: FiEye },
                  { key: 'participantes', label: 'Participantes', icon: FiUsers },
                  { key: 'gastos', label: 'Gastos', icon: FiDollarSign },
                  { key: 'ingresos', label: 'Ingresos', icon: FiBarChart2 },
                  { key: 'reportes', label: 'Reportes', icon: FiCalendar }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Tab: Participantes */}
              {activeTab === 'participantes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Participantes del Campamento ({participantes.length})
                    </h3>
                    <button
                      onClick={() => setShowParticipanteModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Agregar Participante</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cargo/Rama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarifa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participantes.map((participante) => (
                          <tr key={participante.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {participante.nombre} {participante.apellido}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                participante.tipo_participante === 'joven' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {participante.tipo_participante}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {participante.cargo} {participante.rama && `- ${participante.rama}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(participante.tipo_participante === 'joven' ? 35 : 45)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{participante.telefono}</div>
                              <div>{participante.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => handleViewParticipante(participante)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Ver detalles"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditParticipante(participante)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar participante"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteParticipante(participante)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar participante"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Gastos */}
              {activeTab === 'gastos' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Gastos del Campamento ({gastos.length})
                    </h3>
                    <button
                      onClick={() => setShowGastoModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Registrar Gasto</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Concepto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado Pago
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {gastos.map((gasto) => (
                          <tr key={gasto.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{gasto.concepto}</div>
                              {gasto.descripcion && (
                                <div className="text-sm text-gray-500">{gasto.descripcion}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                {gasto.categoria}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(gasto.monto_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                gasto.estado_pago === 'pagado' 
                                  ? 'bg-green-100 text-green-800'
                                  : gasto.estado_pago === 'parcial'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {gasto.estado_pago}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(gasto.fecha_gasto).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => handleViewGasto(gasto)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Ver detalles"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditGasto(gasto)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar gasto"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteGasto(gasto)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Eliminar gasto"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal: Nuevo Campamento */}
      {showCampamentoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Campamento</h3>
              <form onSubmit={handleCreateCampamento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nuevoCampamento.nombre}
                    onChange={(e) => setNuevoCampamento(prev => ({ ...prev, nombre: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={nuevoCampamento.descripcion}
                    onChange={(e) => setNuevoCampamento(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                    <input
                      type="date"
                      required
                      value={nuevoCampamento.fecha_inicio}
                      onChange={(e) => setNuevoCampamento(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                    <input
                      type="date"
                      required
                      value={nuevoCampamento.fecha_fin}
                      onChange={(e) => setNuevoCampamento(prev => ({ ...prev, fecha_fin: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lugar</label>
                  <input
                    type="text"
                    value={nuevoCampamento.lugar}
                    onChange={(e) => setNuevoCampamento(prev => ({ ...prev, lugar: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsable</label>
                  <input
                    type="text"
                    value={nuevoCampamento.responsable}
                    onChange={(e) => setNuevoCampamento(prev => ({ ...prev, responsable: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Presupuesto Estimado</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoCampamento.presupuesto_estimado}
                    onChange={(e) => setNuevoCampamento(prev => ({ ...prev, presupuesto_estimado: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCampamentoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Crear Campamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Participante */}
      {showParticipanteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Participante</h3>
              <form onSubmit={handleAddParticipante} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      required
                      value={nuevoParticipante.nombre}
                      onChange={(e) => setNuevoParticipante(prev => ({ ...prev, nombre: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <input
                      type="text"
                      required
                      value={nuevoParticipante.apellido}
                      onChange={(e) => setNuevoParticipante(prev => ({ ...prev, apellido: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Participante</label>
                  <select
                    value={nuevoParticipante.tipo_participante}
                    onChange={(e) => setNuevoParticipante(prev => ({ ...prev, tipo_participante: e.target.value as 'joven' | 'adulto' }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="joven">Joven (S/. 35.00)</option>
                    <option value="adulto">Adulto (S/. 45.00)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <input
                      type="text"
                      value={nuevoParticipante.cargo}
                      onChange={(e) => setNuevoParticipante(prev => ({ ...prev, cargo: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rama</label>
                    <input
                      type="text"
                      value={nuevoParticipante.rama}
                      onChange={(e) => setNuevoParticipante(prev => ({ ...prev, rama: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={nuevoParticipante.telefono}
                    onChange={(e) => setNuevoParticipante(prev => ({ ...prev, telefono: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={nuevoParticipante.email}
                    onChange={(e) => setNuevoParticipante(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowParticipanteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Agregar Participante
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Gasto</h3>
              <form onSubmit={handleAddGasto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Concepto</label>
                  <input
                    type="text"
                    required
                    value={nuevoGasto.concepto}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, concepto: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select
                    value={nuevoGasto.categoria}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, categoria: e.target.value as any }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="movilidad">Movilidad</option>
                    <option value="alimentacion">Alimentación</option>
                    <option value="alojamiento">Alojamiento</option>
                    <option value="materiales">Materiales</option>
                    <option value="equipamiento">Equipamiento</option>
                    <option value="servicios">Servicios</option>
                    <option value="emergencias">Emergencias</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoGasto.monto_total}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, monto_total: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={nuevoGasto.descripcion}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                  <input
                    type="text"
                    value={nuevoGasto.proveedor}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsable del Pago</label>
                  <input
                    type="text"
                    value={nuevoGasto.responsable_pago}
                    onChange={(e) => setNuevoGasto(prev => ({ ...prev, responsable_pago: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowGastoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Registrar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============= 🏕️ MODAL EDITAR CAMPAMENTO ============= */}
      {showEditCampamentoModal && selectedCampamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar Campamento</h2>
            <form onSubmit={handleUpdateCampamento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Campamento</label>
                <input
                  type="text"
                  required
                  value={nuevoCampamento.nombre}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, nombre: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={nuevoCampamento.descripcion}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                <input
                  type="date"
                  required
                  value={nuevoCampamento.fecha_inicio}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                <input
                  type="date"
                  required
                  value={nuevoCampamento.fecha_fin}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lugar</label>
                <input
                  type="text"
                  value={nuevoCampamento.lugar}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, lugar: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Presupuesto Estimado</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCampamento.presupuesto_estimado}
                  onChange={(e) => setNuevoCampamento(prev => ({ ...prev, presupuesto_estimado: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCampamentoModal(false);
                    setSelectedCampamento(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Actualizar Campamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============= 👥 MODAL EDITAR PARTICIPANTE ============= */}
      {showEditParticipanteModal && selectedParticipante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar Participante</h2>
            <form onSubmit={handleUpdateParticipante} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={nuevoParticipante.nombre}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, nombre: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  required
                  value={nuevoParticipante.apellido}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, apellido: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Participante</label>
                <select
                  value={nuevoParticipante.tipo_participante}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, tipo_participante: e.target.value as 'joven' | 'adulto' }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="joven">Joven</option>
                  <option value="adulto">Adulto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                <input
                  type="text"
                  value={nuevoParticipante.cargo}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, cargo: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rama</label>
                <select
                  value={nuevoParticipante.rama}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, rama: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Seleccionar rama</option>
                  <option value="MANADA">Manada</option>
                  <option value="TROPA">Tropa</option>
                  <option value="COMUNIDAD">Comunidad</option>
                  <option value="CLAN">Clan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  value={nuevoParticipante.telefono}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, telefono: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={nuevoParticipante.email}
                  onChange={(e) => setNuevoParticipante(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditParticipanteModal(false);
                    setSelectedParticipante(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Actualizar Participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============= 💸 MODAL EDITAR GASTO ============= */}
      {showEditGastoModal && selectedGasto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar Gasto</h2>
            <form onSubmit={handleUpdateGasto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Concepto</label>
                <input
                  type="text"
                  required
                  value={nuevoGasto.concepto}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, concepto: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <select
                  value={nuevoGasto.categoria}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, categoria: e.target.value as any }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="materiales">Materiales</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="alojamiento">Alojamiento</option>
                  <option value="movilidad">Movilidad</option>
                  <option value="equipamiento">Equipamiento</option>
                  <option value="servicios">Servicios</option>
                  <option value="emergencias">Emergencias</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto Total</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={nuevoGasto.monto_total}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, monto_total: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                <input
                  type="text"
                  value={nuevoGasto.proveedor}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, proveedor: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Responsable de Pago</label>
                <input
                  type="text"
                  value={nuevoGasto.responsable_pago}
                  onChange={(e) => setNuevoGasto(prev => ({ ...prev, responsable_pago: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditGastoModal(false);
                    setSelectedGasto(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Actualizar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============= 👁️ MODALES DE VISTA DETALLADA ============= */}
      
      {/* Modal Ver Campamento */}
      {showViewCampamentoModal && selectedCampamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Detalles del Campamento</h2>
              <button
                onClick={() => {
                  setShowViewCampamentoModal(false);
                  setSelectedCampamento(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Nombre:</strong> {selectedCampamento.nombre}</div>
              <div><strong>Descripción:</strong> {selectedCampamento.descripcion || 'Sin descripción'}</div>
              <div><strong>Fechas:</strong> {selectedCampamento.fecha_inicio} al {selectedCampamento.fecha_fin}</div>
              <div><strong>Estado:</strong> <span className={`px-2 py-1 rounded-full text-sm ${getEstadoColor(selectedCampamento.estado)}`}>{selectedCampamento.estado}</span></div>
              <div><strong>Presupuesto Estimado:</strong> {formatCurrency(selectedCampamento.presupuesto_estimado || 0)}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewCampamentoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Participante */}
      {showViewParticipanteModal && selectedParticipante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Detalles del Participante</h2>
              <button
                onClick={() => {
                  setShowViewParticipanteModal(false);
                  setSelectedParticipante(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Nombre Completo:</strong> {selectedParticipante.nombre} {selectedParticipante.apellido}</div>
              <div><strong>Tipo:</strong> <span className={`px-2 py-1 rounded-full text-sm ${selectedParticipante.tipo_participante === 'joven' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{selectedParticipante.tipo_participante}</span></div>
              <div><strong>Cargo:</strong> {selectedParticipante.cargo || 'Sin cargo'}</div>
              <div><strong>Rama:</strong> {selectedParticipante.rama || 'Sin rama'}</div>
              <div><strong>Teléfono:</strong> {selectedParticipante.telefono || 'Sin teléfono'}</div>
              <div><strong>Email:</strong> {selectedParticipante.email || 'Sin email'}</div>
              <div><strong>Monto a Pagar:</strong> {formatCurrency(selectedParticipante.tipo_participante === 'joven' ? 35 : 45)}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewParticipanteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Gasto */}
      {showViewGastoModal && selectedGasto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Detalles del Gasto</h2>
              <button
                onClick={() => {
                  setShowViewGastoModal(false);
                  setSelectedGasto(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Concepto:</strong> {selectedGasto.concepto}</div>
              <div><strong>Categoría:</strong> <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">{selectedGasto.categoria}</span></div>
              <div><strong>Monto Total:</strong> {formatCurrency(selectedGasto.monto_total)}</div>
              <div><strong>Descripción:</strong> {selectedGasto.descripcion || 'Sin descripción'}</div>
              <div><strong>Proveedor:</strong> {selectedGasto.proveedor || 'Sin proveedor'}</div>
              <div><strong>Responsable de Pago:</strong> {selectedGasto.responsable_pago || 'Sin responsable'}</div>
              <div><strong>Estado de Pago:</strong> <span className={`px-2 py-1 rounded-full text-sm ${selectedGasto.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : selectedGasto.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{selectedGasto.estado_pago}</span></div>
              <div><strong>Fecha del Gasto:</strong> {new Date(selectedGasto.fecha_gasto).toLocaleDateString()}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewGastoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-900 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;