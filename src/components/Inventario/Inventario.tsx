import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, Eye, 
  AlertTriangle, CheckCircle, Clock, Package2, BarChart, ArrowRightLeft
} from 'lucide-react';
import { InventarioService } from '../../services/inventarioService';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { InventarioItem } from '../../lib/supabase';
import { PopUpRegistro } from '../../modules/inventario/components/PopUpRegistro';
import { DetalleMaterial } from '../../modules/inventario/components/DetalleMaterial';
import { PopUpTransferencia } from '../../modules/inventario/components/PopUpTransferencia';

const Inventario: React.FC = () => {
  console.log('🏗️ Inventario component loading...');

  // ============= PERMISOS =============
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermissions();

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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [itemBorrowers, setItemBorrowers] = useState<Record<string, string>>({});
  const [itemHistory, setItemHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
      const prestados = items.filter(item => item.estado_item === 'PRESTADO');
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
        (item.estado_item === 'PRESTADO' && itemBorrowers[item.id]?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filtro por categoría o estado
    if (selectedCategory !== 'all') {
      if (selectedCategory.startsWith('estado:')) {
        const estado = selectedCategory.replace('estado:', '');
        filtered = filtered.filter(item => item.estado_item === estado);
      } else {
        filtered = filtered.filter(item => item.categoria === selectedCategory);
      }
    }

    setFilteredItems(filtered);
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
    if (!puedeEditar('inventario')) {
      alert('No tienes permiso para editar items del inventario');
      return;
    }
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (item: InventarioItem) => {
    if (!puedeEliminar('inventario')) {
      alert('No tienes permiso para eliminar items del inventario');
      return;
    }
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE': return 'text-green-600 bg-green-100';
      case 'PRESTADO': return 'text-yellow-600 bg-yellow-100';
      case 'EN_MANTENIMIENTO': return 'text-blue-600 bg-blue-100';
      case 'DAÑADO': return 'text-orange-600 bg-orange-100';
      case 'PERDIDO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const ESTADO_LABEL: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    PRESTADO: 'Prestado',
    EN_MANTENIMIENTO: 'En Mantenimiento',
    DAÑADO: 'Dañado',
    PERDIDO: 'Perdido',
  };

  const CATEGORIA_LABEL: Record<string, string> = {
    CAMPING: 'Camping / Material Scout',
    CEREMONIAL: 'Ceremonial',
    DEPORTE: 'Deportivo',
    SEGURIDAD: 'Primeros Auxilios',
    COCINA: 'Cocina / Alimentación',
    EDUCATIVO: 'Material Educativo',
    OTRO: 'Otro / Administrativo',
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'CAMPING': return '⛺';
      case 'CEREMONIAL': return '🎖️';
      case 'DEPORTE': return '⚽';
      case 'SEGURIDAD': return '🏥';
      case 'COCINA': return '🍳';
      case 'EDUCATIVO': return '📚';
      default: return '📦';
    }
  };

  const itemsToShow = filteredItems;
  const valorTotalMostrado = itemsToShow.reduce(
    (sum, item) => sum + Number(item.valor_unitario || 0) * Number(item.cantidad_disponible || 0),
    0
  );

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
                  {itemsToShow.filter(item => item.estado_item === 'DISPONIBLE').length}
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
                  {itemsToShow.filter(item => item.estado_item === 'PRESTADO').length}
                </p>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  S/ {valorTotalMostrado.toFixed(2)}
                </p>
              </div>
              <BarChart className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
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
                <option value="CAMPING">Camping / Material Scout</option>
                <option value="CEREMONIAL">Ceremonial</option>
                <option value="DEPORTE">Deportivo</option>
                <option value="SEGURIDAD">Primeros Auxilios</option>
                <option value="COCINA">Cocina / Alimentación</option>
                <option value="EDUCATIVO">Material Educativo</option>
                <option value="OTRO">Otro / Administrativo</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedCategory.startsWith('estado:') ? selectedCategory : 'all'}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="estado:DISPONIBLE">🟢 Solo Disponibles</option>
                <option value="estado:PRESTADO">🟡 Solo Prestados</option>
                <option value="estado:EN_MANTENIMIENTO">🔵 En Mantenimiento</option>
                <option value="estado:DAÑADO">🟠 Dañados</option>
                <option value="estado:PERDIDO">🔴 Perdidos</option>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {CATEGORIA_LABEL[item.categoria] || item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {item.cantidad_disponible}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(item.estado_item)}`}>
                        {ESTADO_LABEL[item.estado_item] || item.estado_item}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.estado_item === 'PRESTADO' && itemBorrowers[item.id] ? (
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
                          onClick={() => { setSelectedItem(item); setShowTransferModal(true); }}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Mover / Transferir"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
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
                  <>🔴 Sin conexión con Supabase</>
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

        {/* Modal de registro — nuevo PopUpRegistro con Kardex */}
        {showAddForm && (
          <PopUpRegistro
            onClose={() => setShowAddForm(false)}
            onSave={() => loadData()}
          />
        )}

        {/* Modal de transferencia / mover material */}
        {showTransferModal && selectedItem && (
          <PopUpTransferencia
            item={selectedItem}
            onClose={() => { setShowTransferModal(false); setSelectedItem(null); }}
            onSuccess={() => { loadData(); setShowTransferModal(false); setSelectedItem(null); }}
          />
        )}

        {/* Modal de detalle con pestañas — nuevo DetalleMaterial */}
        {showViewModal && selectedItem && (
          <DetalleMaterial
            material={selectedItem}
            onClose={() => { setShowViewModal(false); setSelectedItem(null); }}
          />
        )}
        {/* Modal para editar item — usa PopUpRegistro en modo edición */}
        {showEditModal && selectedItem && (
          <PopUpRegistro
            itemToEdit={selectedItem}
            onClose={() => { setShowEditModal(false); setSelectedItem(null); }}
            onSave={() => { loadData(); setShowEditModal(false); setSelectedItem(null); }}
          />
        )}

      </div>
    </div>
  );
};

export default Inventario;