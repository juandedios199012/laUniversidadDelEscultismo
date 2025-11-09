import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, Eye, 
  AlertTriangle, CheckCircle, Clock, Package2, BarChart 
} from 'lucide-react';
import { InventarioService } from '../../services/inventarioService';
import type { InventarioItem } from '../../lib/supabase';

const Inventario: React.FC = () => {
  console.log('🏗️ Inventario component loading...');

  // ============= ESTADOS =============
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estados para modales de acciones
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [showChangeStateModal, setShowChangeStateModal] = useState(false);
  const [newState, setNewState] = useState<'disponible' | 'prestado' | 'mantenimiento' | 'perdido' | 'baja'>('disponible');
  const [stateObservations, setStateObservations] = useState('');
  const [borrower, setBorrower] = useState('');
  const [itemBorrowers, setItemBorrowers] = useState<Record<string, string>>({});
  const [itemHistory, setItemHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Estados para el formulario de agregar item
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'material_scout' as 'material_scout' | 'camping' | 'ceremonial' | 'deportivo' | 'primeros_auxilios' | 'administrativo',
    descripcion: '',
    cantidad: 1,
    cantidad_minima: 1,
    ubicacion: '',
    costo: 0
  });
  const [saving, setSaving] = useState(false);

  // ============= EFECTOS =============
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedCategory, items, itemBorrowers]);

  // ============= FUNCIONES =============
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Intentando cargar datos desde Supabase...');
      const itemsData = await InventarioService.getAllItems();
      console.log('📊 Datos recibidos:', itemsData.length, 'items');
      console.log('🗂️ Primeros 3 items:', itemsData.slice(0, 3));
      
      setItems(itemsData);
      setFilteredItems(itemsData);

      // Cargar destinatarios de items prestados
      await loadBorrowers(itemsData);
      
    } catch (err) {
      console.error('❌ Error loading inventory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar el inventario: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowers = async (items: InventarioItem[]) => {
    try {
      console.log('👥 Cargando destinatarios de items prestados...');
      const prestados = items.filter(item => item.estado === 'prestado');
      const borrowersMap: Record<string, string> = {};

      for (const item of prestados) {
        try {
          const historial = await InventarioService.getHistorialItem(item.id);
          // Buscar el último préstamo
          const ultimoPrestamo = historial
            .filter(mov => mov.tipo_movimiento === 'prestamo' && mov.destino)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          if (ultimoPrestamo && ultimoPrestamo.destino) {
            borrowersMap[item.id] = ultimoPrestamo.destino;
          }
        } catch (error) {
          console.warn(`⚠️ No se pudo cargar historial para item ${item.id}:`, error);
        }
      }

      setItemBorrowers(borrowersMap);
      console.log('👥 Destinatarios cargados:', borrowersMap);
    } catch (error) {
      console.error('❌ Error cargando destinatarios:', error);
    }
  };

  const filterItems = () => {
    if (!items.length) return;
    
    let filtered = [...items];
    
    // Filtro por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.estado === 'prestado' && itemBorrowers[item.id]?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filtro por categoría o estado
    if (selectedCategory !== 'all') {
      if (selectedCategory.startsWith('estado:')) {
        const estado = selectedCategory.replace('estado:', '');
        filtered = filtered.filter(item => item.estado === estado);
      } else {
        filtered = filtered.filter(item => item.categoria === selectedCategory);
      }
    }
    
    setFilteredItems(filtered);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('🆕 Agregando nuevo item:', formData);
      const newItem = await InventarioService.createItem({
        ...formData,
        estado: 'disponible'
      });
      
      console.log('✅ Item creado exitosamente:', newItem);
      
      // Actualizar la lista de items
      await loadData();
      
      // Limpiar el formulario
      setFormData({
        nombre: '',
        categoria: 'material_scout',
        descripcion: '',
        cantidad: 1,
        cantidad_minima: 1,
        ubicacion: '',
        costo: 0
      });
      
      // Cerrar el modal
      setShowAddForm(false);
      
    } catch (err) {
      console.error('❌ Error al agregar item:', err);
      alert('Error al agregar el item. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' || name === 'cantidad_minima' || name === 'costo' 
        ? Number(value) 
        : value
    }));
  };

  // Funciones para manejar acciones de los items
  const handleViewItem = async (item: InventarioItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
    
    // Cargar historial del item
    setLoadingHistory(true);
    try {
      const history = await InventarioService.getHistorialItem(item.id);
      setItemHistory(history);
    } catch (error) {
      console.warn('⚠️ No se pudo cargar el historial:', error);
      setItemHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditItem = (item: InventarioItem) => {
    setSelectedItem(item);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      descripcion: item.descripcion || '',
      cantidad: item.cantidad,
      cantidad_minima: item.cantidad_minima,
      ubicacion: item.ubicacion || '',
      costo: item.costo || 0
    });
    setShowEditModal(true);
  };

  const handleDeleteItem = async (item: InventarioItem) => {
    if (window.confirm(`¿Estás seguro de eliminar "${item.nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        setSaving(true);
        console.log('🗑️ Eliminando item:', item.id);
        
        await InventarioService.deleteItem(item.id);
        console.log('✅ Item eliminado exitosamente');
        
        // Recargar datos
        await loadData();
        
      } catch (err) {
        console.error('❌ Error al eliminar item:', err);
        alert('Error al eliminar el item. Por favor intenta de nuevo.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    setSaving(true);
    
    try {
      console.log('✏️ Actualizando item:', selectedItem.id, formData);
      
      await InventarioService.updateItem(selectedItem.id, {
        ...formData,
        estado: selectedItem.estado // Mantener el estado actual
      });
      
      console.log('✅ Item actualizado exitosamente');
      
      // Recargar datos
      await loadData();
      
      // Cerrar modal
      setShowEditModal(false);
      setSelectedItem(null);
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        categoria: 'material_scout',
        descripcion: '',
        cantidad: 1,
        cantidad_minima: 1,
        ubicacion: '',
        costo: 0
      });
      
    } catch (err) {
      console.error('❌ Error al actualizar item:', err);
      alert('Error al actualizar el item. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Función para cambiar estado
  const handleChangeState = async () => {
    if (!selectedItem) return;
    
    setSaving(true);
    
    try {
      console.log('🔄 Cambiando estado del item:', selectedItem.id, 'de', selectedItem.estado, 'a', newState);
      
      // Actualización directa del estado usando updateItem
      await InventarioService.updateItem(selectedItem.id, { 
        estado: newState,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Estado actualizado en BD');
      
      // Registrar movimiento para trazabilidad (solo para ciertos cambios)
      try {
        if (newState === 'prestado' && borrower) {
          console.log('📤 Registrando préstamo a:', borrower);
          await InventarioService.registrarMovimiento({
            item_id: selectedItem.id,
            tipo_movimiento: 'prestamo',
            cantidad: 1,
            cantidad_anterior: selectedItem.cantidad,
            cantidad_nueva: selectedItem.cantidad - 1,
            responsable: 'sistema',
            destino: borrower,
            observaciones: stateObservations || `Prestado a ${borrower}`
          });
        } else if (newState === 'disponible' && selectedItem.estado === 'prestado') {
          console.log('📥 Registrando devolución');
          await InventarioService.registrarMovimiento({
            item_id: selectedItem.id,
            tipo_movimiento: 'devolucion',
            cantidad: 1,
            cantidad_anterior: selectedItem.cantidad,
            cantidad_nueva: selectedItem.cantidad + 1,
            responsable: 'sistema',
            observaciones: stateObservations || 'Item devuelto'
          });
        } else if (newState === 'perdido') {
          console.log('❌ Registrando pérdida');
          await InventarioService.registrarMovimiento({
            item_id: selectedItem.id,
            tipo_movimiento: 'baja',
            cantidad: 1,
            cantidad_anterior: selectedItem.cantidad,
            cantidad_nueva: selectedItem.cantidad - 1,
            responsable: 'sistema',
            motivo: 'Perdido',
            observaciones: stateObservations || 'Item reportado como perdido'
          });
        }
      } catch (movError) {
        console.warn('⚠️ Error al registrar movimiento (pero estado ya actualizado):', movError);
      }
      
      console.log('✅ Cambio de estado completado');
      
      // Recargar datos
      await loadData();
      
      // Cerrar modales
      setShowChangeStateModal(false);
      setShowViewModal(false);
      
      // Limpiar campos
      setStateObservations('');
      setBorrower('');
      setNewState('disponible');
      
    } catch (err) {
      console.error('❌ Error al cambiar estado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al cambiar el estado: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const openChangeStateModal = (state: 'disponible' | 'prestado' | 'mantenimiento' | 'perdido' | 'baja') => {
    setNewState(state);
    setShowChangeStateModal(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'text-green-600 bg-green-100';
      case 'prestado': return 'text-yellow-600 bg-yellow-100';
      case 'mantenimiento': return 'text-blue-600 bg-blue-100';
      case 'perdido': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'material_scout': return '🏕️';
      case 'camping': return '⛺';
      case 'ceremonial': return '🎖️';
      case 'deportivo': return '⚽';
      case 'primeros_auxilios': return '🏥';
      default: return '📦';
    }
  };

  // ============= DATOS DE PRUEBA =============
  // Estos datos se mostrarán hasta conectar con Supabase real
  const datosDemo: InventarioItem[] = [
    {
      id: '1',
      nombre: 'Carpa 4 personas',
      categoria: 'camping',
      descripcion: 'Carpa impermeable para 4 personas, ideal para campamentos',
      cantidad: 5,
      cantidad_minima: 2,
      estado: 'disponible',
      ubicacion: 'Almacén Principal - Estante A',
      costo: 150.00,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      nombre: 'Pañoleta Scout',
      categoria: 'ceremonial',
      descripcion: 'Pañoleta oficial del grupo scout',
      cantidad: 25,
      cantidad_minima: 10,
      estado: 'disponible',
      ubicacion: 'Oficina - Armario',
      costo: 15.00,
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-10T14:20:00Z'
    },
    {
      id: '3',
      nombre: 'Botiquín Primeros Auxilios',
      categoria: 'primeros_auxilios',
      descripcion: 'Botiquín completo para emergencias',
      cantidad: 1,
      cantidad_minima: 2,
      estado: 'prestado',
      ubicacion: 'Con patrulla Águilas',
      costo: 80.00,
      created_at: '2024-01-05T09:15:00Z',
      updated_at: '2024-01-20T16:45:00Z'
    }
  ];

  const itemsToShow = filteredItems.length > 0 || items.length === 0 ? filteredItems : datosDemo;

  // ============= RENDER =============
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-gray-600">Cargando inventario...</h2>
            <p className="text-gray-500 mt-2">Conectando con Supabase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 md:w-8 md:h-8" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold">Inventario Scout</h1>
                <p className="text-blue-100 text-sm md:text-base">Gestión integral de materiales y equipos</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium flex items-center space-x-2 shadow-sm transition-colors duration-200 w-full max-w-xs md:w-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="text-base font-semibold">Agregar Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <div>
              <strong>Error de conexión:</strong> {error}
              <br />
              <span className="text-sm">Mostrando datos de demostración mientras tanto.</span>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{itemsToShow.length}</p>
              </div>
              <Package2 className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {itemsToShow.filter(item => item.estado === 'disponible').length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Prestados</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">
                  {itemsToShow.filter(item => item.estado === 'prestado').length}
                </p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  {itemsToShow.filter(item => item.cantidad <= item.cantidad_minima).length}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las categorías</option>
                <option value="material_scout">Material Scout</option>
                <option value="camping">Camping</option>
                <option value="ceremonial">Ceremonial</option>
                <option value="deportivo">Deportivo</option>
                <option value="primeros_auxilios">Primeros Auxilios</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedCategory.startsWith('estado:') ? selectedCategory : 'all'}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="estado:disponible">🟢 Solo Disponibles</option>
                <option value="estado:prestado">🟡 Solo Prestados</option>
                <option value="estado:mantenimiento">🔵 En Mantenimiento</option>
                <option value="estado:perdido">🔴 Perdidos</option>
                <option value="estado:baja">⚫ Dados de Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Items */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinatario/Ubicación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsToShow.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{getCategoriaIcon(item.categoria)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                          <div className="text-sm text-gray-500">{item.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {item.categoria.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className={`font-medium ${item.cantidad <= item.cantidad_minima ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.cantidad}
                        </span>
                        <span className="text-gray-500"> / mín. {item.cantidad_minima}</span>
                      </div>
                      {item.cantidad <= item.cantidad_minima && (
                        <div className="flex items-center text-red-500 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Stock bajo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getEstadoColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.estado === 'prestado' && itemBorrowers[item.id] ? (
                        <div>
                          <div className="flex items-center text-yellow-700">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{itemBorrowers[item.id]}</span>
                          </div>
                          {item.ubicacion && (
                            <div className="text-xs text-gray-400 mt-1">📍 {item.ubicacion}</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{item.ubicacion || 'No especificada'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        {/* Estado vacío */}
        {itemsToShow.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay items en el inventario</h3>
            <p className="text-gray-500 mb-6">Comienza agregando tu primer item al inventario.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Primer Item</span>
            </button>
          </div>
        )}

        {/* Footer con información */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <BarChart className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Estado del Sistema</h4>
              <p className="text-sm text-blue-700 mt-1">
                {error ? (
                  <>🔴 Modo demostración - Conexión con Supabase pendiente</>
                ) : (
                  <>🟢 Conectado a Supabase - Sistema operativo</>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                📋 Mostrando {itemsToShow.length} items del inventario scout
              </p>
            </div>
          </div>
        </div>

        {/* Modal para agregar item */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Item</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Item *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Carpa 4 personas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="material_scout">Material Scout</option>
                    <option value="camping">Camping</option>
                    <option value="ceremonial">Ceremonial</option>
                    <option value="deportivo">Deportivo</option>
                    <option value="primeros_auxilios">Primeros Auxilios</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción detallada del item..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      name="cantidad_minima"
                      value={formData.cantidad_minima}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Almacén Principal - Estante A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo (S/.)
                  </label>
                  <input
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Agregar Item</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para ver detalles */}
        {showViewModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Detalles del Item</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-3xl">{getCategoriaIcon(selectedItem.categoria)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedItem.nombre}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {selectedItem.categoria.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Estado</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getEstadoColor(selectedItem.estado)}`}>
                      {selectedItem.estado}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Stock</label>
                    <p className="text-sm font-medium">
                      <span className={selectedItem.cantidad <= selectedItem.cantidad_minima ? 'text-red-600' : 'text-gray-900'}>
                        {selectedItem.cantidad}
                      </span>
                      <span className="text-gray-500"> / mín. {selectedItem.cantidad_minima}</span>
                    </p>
                  </div>
                </div>

                {/* Información del préstamo si está prestado */}
                {selectedItem.estado === 'prestado' && itemBorrowers[selectedItem.id] && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                    <div className="flex items-center text-yellow-700 mb-2">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">Item Prestado</span>
                    </div>
                    <div className="text-sm">
                      <p className="text-yellow-800">
                        <span className="font-medium">Destinatario:</span> {itemBorrowers[selectedItem.id]}
                      </p>
                    </div>
                  </div>
                )}

                {selectedItem.descripcion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Descripción</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedItem.descripcion}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ubicación</label>
                  <p className="text-sm text-gray-900">{selectedItem.ubicacion || 'No especificada'}</p>
                </div>

                {selectedItem.costo && selectedItem.costo > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Costo</label>
                    <p className="text-sm text-gray-900">S/. {selectedItem.costo.toFixed(2)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Creado</label>
                    <p className="text-xs text-gray-600">
                      {new Date(selectedItem.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Actualizado</label>
                    <p className="text-xs text-gray-600">
                      {new Date(selectedItem.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {selectedItem.cantidad <= selectedItem.cantidad_minima && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <div className="flex items-center text-red-700">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Stock bajo</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Este item está por debajo del stock mínimo recomendado.
                    </p>
                  </div>
                )}

                {/* Botones para cambiar estado */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Cambiar Estado</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => openChangeStateModal('disponible')}
                      disabled={selectedItem.estado === 'disponible'}
                      className="px-3 py-2 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      🟢 Disponible
                    </button>
                    <button
                      onClick={() => openChangeStateModal('prestado')}
                      disabled={selectedItem.estado === 'prestado'}
                      className="px-3 py-2 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    >
                      🟡 Prestar
                    </button>
                    <button
                      onClick={() => openChangeStateModal('mantenimiento')}
                      disabled={selectedItem.estado === 'mantenimiento'}
                      className="px-3 py-2 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      🔵 Mantenimiento
                    </button>
                    <button
                      onClick={() => openChangeStateModal('perdido')}
                      disabled={selectedItem.estado === 'perdido'}
                      className="px-3 py-2 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    >
                      🔴 Perdido
                    </button>
                    <button
                      onClick={() => openChangeStateModal('baja')}
                      disabled={selectedItem.estado === 'baja'}
                      className="px-3 py-2 text-xs rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    >
                      ⚫ Dar de Baja
                    </button>
                  </div>
                </div>

                {/* Historial de movimientos */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Historial de Movimientos</h4>
                  {loadingHistory ? (
                    <div className="text-center py-4">
                      <svg className="animate-spin w-5 h-5 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs text-gray-500 mt-2">Cargando historial...</p>
                    </div>
                  ) : itemHistory.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {itemHistory.slice(0, 5).map((movimiento, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  movimiento.tipo_movimiento === 'prestamo' ? 'bg-yellow-100 text-yellow-800' :
                                  movimiento.tipo_movimiento === 'devolucion' ? 'bg-green-100 text-green-800' :
                                  movimiento.tipo_movimiento === 'baja' ? 'bg-red-100 text-red-800' :
                                  movimiento.tipo_movimiento === 'entrada' ? 'bg-blue-100 text-blue-800' :
                                  movimiento.tipo_movimiento === 'salida' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {movimiento.tipo_movimiento === 'prestamo' ? '📤' :
                                   movimiento.tipo_movimiento === 'devolucion' ? '📥' :
                                   movimiento.tipo_movimiento === 'baja' ? '❌' :
                                   movimiento.tipo_movimiento === 'entrada' ? '📥' : 
                                   movimiento.tipo_movimiento === 'salida' ? '📤' :
                                   movimiento.tipo_movimiento === 'ajuste' ? '🔧' : '📝'}
                                  {movimiento.tipo_movimiento}
                                </span>
                                {movimiento.destino && (
                                  <span className="text-gray-600">→ {movimiento.destino}</span>
                                )}
                              </div>
                              {movimiento.observaciones && (
                                <p className="text-gray-500 mt-1 text-xs">{movimiento.observaciones}</p>
                              )}
                            </div>
                            <div className="text-gray-400 text-xs ml-2">
                              {new Date(movimiento.created_at).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      {itemHistory.length > 5 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          ... y {itemHistory.length - 5} movimientos más
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No hay historial de movimientos registrado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditItem(selectedItem);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar item */}
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Item</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Item *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Carpa 4 personas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="material_scout">Material Scout</option>
                    <option value="camping">Camping</option>
                    <option value="ceremonial">Ceremonial</option>
                    <option value="deportivo">Deportivo</option>
                    <option value="primeros_auxilios">Primeros Auxilios</option>
                    <option value="administrativo">Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción detallada del item..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      name="cantidad_minima"
                      value={formData.cantidad_minima}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Almacén Principal - Estante A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo (S/.)
                  </label>
                  <input
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedItem(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        <span>Actualizar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para cambiar estado */}
        {showChangeStateModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cambiar Estado</h2>
                <button
                  onClick={() => setShowChangeStateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">Item: <span className="font-medium">{selectedItem.nombre}</span></p>
                  <p className="text-sm text-gray-600">Estado actual: <span className={`font-medium capitalize ${getEstadoColor(selectedItem.estado).split(' ')[0]}`}>{selectedItem.estado}</span></p>
                  <p className="text-sm text-gray-600">Nuevo estado: <span className="font-medium capitalize text-blue-600">{newState}</span></p>
                </div>

                {newState === 'prestado' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinatario *
                    </label>
                    <input
                      type="text"
                      value={borrower}
                      onChange={(e) => setBorrower(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre de la persona o patrulla"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={stateObservations}
                    onChange={(e) => setStateObservations(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Motivo del cambio de estado..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowChangeStateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangeState}
                    disabled={saving || (newState === 'prestado' && !borrower)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cambiando...</span>
                      </>
                    ) : (
                      <span>Cambiar Estado</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventario;