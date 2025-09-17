import { useState } from 'react';
import { Package, Search, Save, Edit, Trash2, Plus, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';

interface ItemInventario {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  cantidad: number;
  cantidadMinima: number;
  ubicacion: string;
  responsable: string;
  estado: 'disponible' | 'en-uso' | 'mantenimiento' | 'perdido' | 'dañado';
  fechaAdquisicion: string;
  costo: number;
  proveedor: string;
  observaciones: string;
  ultimaRevision: string;
  proximaRevision: string;
}

export default function Inventario() {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    cantidad: '',
    cantidadMinima: '',
    ubicacion: '',
    responsable: '',
    estado: '',
    fechaAdquisicion: '',
    costo: '',
    proveedor: '',
    observaciones: '',
    ultimaRevision: '',
    proximaRevision: ''
  });

  const [items, setItems] = useState<ItemInventario[]>([
    {
      id: '1',
      nombre: 'Carpas Coleman 4 personas',
      categoria: 'Campamento',
      descripcion: 'Carpas impermeables para 4 personas con mosquitero',
      cantidad: 8,
      cantidadMinima: 5,
      ubicacion: 'Almacén Principal - Estante A1',
      responsable: 'Carlos Mendoza',
      estado: 'disponible',
      fechaAdquisicion: '2023-06-15',
      costo: 250,
      proveedor: 'Outdoor Peru',
      observaciones: '',
      ultimaRevision: '2024-03-01',
      proximaRevision: '2024-06-01'
    },
    {
      id: '2',
      nombre: 'Cuerdas dinámicas 10mm',
      categoria: 'Seguridad',
      descripcion: 'Cuerdas de escalada certificadas para actividades de altura',
      cantidad: 3,
      cantidadMinima: 5,
      ubicacion: 'Almacén Secundario - Caja B3',
      responsable: 'Ana Rodríguez',
      estado: 'disponible',
      fechaAdquisicion: '2023-09-20',
      costo: 180,
      proveedor: 'Climbing Store',
      observaciones: 'Revisar estado antes de cada uso',
      ultimaRevision: '2024-02-15',
      proximaRevision: '2024-05-15'
    },
    {
      id: '3',
      nombre: 'Botiquín de Primeros Auxilios',
      categoria: 'Salud',
      descripcion: 'Kit completo de primeros auxilios para 20 personas',
      cantidad: 2,
      cantidadMinima: 3,
      ubicacion: 'Oficina - Gabinete de Emergencias',
      responsable: 'Dr. Pedro González',
      estado: 'en-uso',
      fechaAdquisicion: '2024-01-10',
      costo: 120,
      proveedor: 'Farmacia San Juan',
      observaciones: 'Verificar fechas de vencimiento mensualmente',
      ultimaRevision: '2024-03-10',
      proximaRevision: '2024-04-10'
    },
    {
      id: '4',
      nombre: 'Cocina portátil a gas',
      categoria: 'Cocina',
      descripcion: 'Cocina de dos hornillas con regulador de gas',
      cantidad: 1,
      cantidadMinima: 2,
      ubicacion: 'Almacén Principal - Estante C2',
      responsable: 'María García',
      estado: 'mantenimiento',
      fechaAdquisicion: '2022-11-30',
      costo: 85,
      proveedor: 'Hogar & Cocina SAC',
      observaciones: 'Requiere cambio de manguera de gas',
      ultimaRevision: '2024-03-05',
      proximaRevision: '2024-04-05'
    }
  ]);

  const [modoEdicion, setModoEdicion] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    estado: '',
    responsable: '',
    busqueda: ''
  });

  const categorias = [
    { value: 'Campamento', label: 'Campamento' },
    { value: 'Cocina', label: 'Cocina y Alimentación' },
    { value: 'Seguridad', label: 'Seguridad y Rescate' },
    { value: 'Salud', label: 'Salud y Primeros Auxilios' },
    { value: 'Deporte', label: 'Deportes y Recreación' },
    { value: 'Herramientas', label: 'Herramientas y Mantenimiento' },
    { value: 'Electronicos', label: 'Electrónicos y Comunicación' },
    { value: 'Uniformes', label: 'Uniformes y Distintivos' },
    { value: 'Libros', label: 'Libros y Material Educativo' },
    { value: 'Otros', label: 'Otros' }
  ];

  const estados = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'en-uso', label: 'En Uso' },
    { value: 'mantenimiento', label: 'En Mantenimiento' },
    { value: 'perdido', label: 'Perdido' },
    { value: 'dañado', label: 'Dañado' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const nuevoItem: ItemInventario = {
      id: modoEdicion || (items.length + 1).toString(),
      nombre: formData.nombre,
      categoria: formData.categoria,
      descripcion: formData.descripcion,
      cantidad: parseInt(formData.cantidad) || 0,
      cantidadMinima: parseInt(formData.cantidadMinima) || 0,
      ubicacion: formData.ubicacion,
      responsable: formData.responsable,
      estado: formData.estado as ItemInventario['estado'],
      fechaAdquisicion: formData.fechaAdquisicion,
      costo: parseFloat(formData.costo) || 0,
      proveedor: formData.proveedor,
      observaciones: formData.observaciones,
      ultimaRevision: formData.ultimaRevision,
      proximaRevision: formData.proximaRevision
    };

    if (modoEdicion) {
      setItems(prev => prev.map(item => 
        item.id === modoEdicion ? nuevoItem : item
      ));
      setModoEdicion(null);
    } else {
      setItems(prev => [nuevoItem, ...prev]);
    }

    // Limpiar formulario
    setFormData({
      nombre: '', categoria: '', descripcion: '', cantidad: '', cantidadMinima: '',
      ubicacion: '', responsable: '', estado: '', fechaAdquisicion: '', costo: '',
      proveedor: '', observaciones: '', ultimaRevision: '', proximaRevision: ''
    });
  };

  const handleEdit = (item: ItemInventario) => {
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      descripcion: item.descripcion,
      cantidad: item.cantidad.toString(),
      cantidadMinima: item.cantidadMinima.toString(),
      ubicacion: item.ubicacion,
      responsable: item.responsable,
      estado: item.estado,
      fechaAdquisicion: item.fechaAdquisicion,
      costo: item.costo.toString(),
      proveedor: item.proveedor,
      observaciones: item.observaciones,
      ultimaRevision: item.ultimaRevision,
      proximaRevision: item.proximaRevision
    });
    setModoEdicion(item.id);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'disponible': 'bg-green-100 text-green-800',
      'en-uso': 'bg-blue-100 text-blue-800',
      'mantenimiento': 'bg-yellow-100 text-yellow-800',
      'perdido': 'bg-red-100 text-red-800',
      'dañado': 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado: string) => {
    const iconos = {
      'disponible': <CheckCircle className="w-4 h-4" />,
      'en-uso': <Clock className="w-4 h-4" />,
      'mantenimiento': <AlertTriangle className="w-4 h-4" />,
      'perdido': <AlertTriangle className="w-4 h-4" />,
      'dañado': <AlertTriangle className="w-4 h-4" />
    };
    return iconos[estado as keyof typeof iconos] || <Package className="w-4 h-4" />;
  };

  const itemsFiltrados = items.filter(item => {
    const cumpleCategoria = !filtros.categoria || item.categoria === filtros.categoria;
    const cumpleEstado = !filtros.estado || item.estado === filtros.estado;
    const cumpleResponsable = !filtros.responsable || item.responsable.toLowerCase().includes(filtros.responsable.toLowerCase());
    const cumpleBusqueda = !filtros.busqueda || 
      item.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    return cumpleCategoria && cumpleEstado && cumpleResponsable && cumpleBusqueda;
  });

  const estadisticas = {
    total: items.length,
    disponible: items.filter(i => i.estado === 'disponible').length,
    enUso: items.filter(i => i.estado === 'en-uso').length,
    mantenimiento: items.filter(i => i.estado === 'mantenimiento').length,
    stockBajo: items.filter(i => i.cantidad <= i.cantidadMinima).length,
    valorTotal: items.reduce((sum, item) => sum + (item.costo * item.cantidad), 0)
  };

  const itemsStockBajo = items.filter(item => item.cantidad <= item.cantidadMinima);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventario</h1>
        <p className="text-gray-600">Gestión de equipos y materiales del grupo scout</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{estadisticas.disponible}</div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.enUso}</div>
              <div className="text-sm text-gray-600">En Uso</div>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.mantenimiento}</div>
              <div className="text-sm text-gray-600">Mantenimiento</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{estadisticas.stockBajo}</div>
              <div className="text-sm text-gray-600">Stock Bajo</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">S/{estadisticas.valorTotal.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </div>
            <Package className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {itemsStockBajo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Alertas de Stock Bajo ({itemsStockBajo.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsStockBajo.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-gray-800 mb-1">{item.nombre}</h4>
                <p className="text-sm text-gray-600 mb-2">{item.categoria}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Stock: {item.cantidad}</span>
                  <span className="text-gray-500">Mínimo: {item.cantidadMinima}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-green-600" />
          {modoEdicion ? 'Editar Item' : 'Nuevo Item de Inventario'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Nombre del Item">
            <Input
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre del item"
            />
          </FormField>

          <FormField label="Categoría">
            <Select
              value={formData.categoria}
              onChange={(e) => handleInputChange('categoria', e.target.value)}
              options={categorias}
              placeholder="Seleccionar categoría"
            />
          </FormField>

          <FormField label="Estado">
            <Select
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              options={estados}
              placeholder="Estado del item"
            />
          </FormField>
        </div>

        <div className="mb-6">
          <FormField label="Descripción">
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción detallada del item"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <FormField label="Cantidad">
            <Input
              type="number"
              value={formData.cantidad}
              onChange={(e) => handleInputChange('cantidad', e.target.value)}
              placeholder="0"
              min="0"
            />
          </FormField>

          <FormField label="Cantidad Mínima">
            <Input
              type="number"
              value={formData.cantidadMinima}
              onChange={(e) => handleInputChange('cantidadMinima', e.target.value)}
              placeholder="0"
              min="0"
            />
          </FormField>

          <FormField label="Costo Unitario (S/)">
            <Input
              type="number"
              value={formData.costo}
              onChange={(e) => handleInputChange('costo', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </FormField>

          <FormField label="Fecha de Adquisición">
            <Input
              type="date"
              value={formData.fechaAdquisicion}
              onChange={(e) => handleInputChange('fechaAdquisicion', e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FormField label="Ubicación">
            <Input
              value={formData.ubicacion}
              onChange={(e) => handleInputChange('ubicacion', e.target.value)}
              placeholder="Ubicación del item"
            />
          </FormField>

          <FormField label="Responsable">
            <Input
              value={formData.responsable}
              onChange={(e) => handleInputChange('responsable', e.target.value)}
              placeholder="Persona responsable"
            />
          </FormField>

          <FormField label="Proveedor">
            <Input
              value={formData.proveedor}
              onChange={(e) => handleInputChange('proveedor', e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField label="Última Revisión">
            <Input
              type="date"
              value={formData.ultimaRevision}
              onChange={(e) => handleInputChange('ultimaRevision', e.target.value)}
            />
          </FormField>

          <FormField label="Próxima Revisión">
            <Input
              type="date"
              value={formData.proximaRevision}
              onChange={(e) => handleInputChange('proximaRevision', e.target.value)}
            />
          </FormField>
        </div>

        <div className="mb-6">
          <FormField label="Observaciones">
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              placeholder="Observaciones adicionales"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </FormField>
        </div>

        <div className="flex justify-end space-x-4">
          {modoEdicion && (
            <button
              onClick={() => {
                setModoEdicion(null);
                setFormData({
                  nombre: '', categoria: '', descripcion: '', cantidad: '', cantidadMinima: '',
                  ubicacion: '', responsable: '', estado: '', fechaAdquisicion: '', costo: '',
                  proveedor: '', observaciones: '', ultimaRevision: '', proximaRevision: ''
                });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {modoEdicion ? 'Actualizar' : 'Guardar'} Item
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-gray-600" />
          Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Búsqueda">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="pl-10"
              />
            </div>
          </FormField>

          <FormField label="Categoría">
            <Select
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
              options={[{ value: '', label: 'Todas las categorías' }, ...categorias]}
            />
          </FormField>

          <FormField label="Estado">
            <Select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              options={[{ value: '', label: 'Todos los estados' }, ...estados]}
            />
          </FormField>

          <FormField label="Responsable">
            <Input
              value={filtros.responsable}
              onChange={(e) => handleFiltroChange('responsable', e.target.value)}
              placeholder="Filtrar por responsable"
            />
          </FormField>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Items de Inventario ({itemsFiltrados.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ubicación</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Responsable</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{item.nombre}</div>
                      <div className="text-sm text-gray-600">{item.descripcion}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {item.categoria}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${item.cantidad <= item.cantidadMinima ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.cantidad}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mín: {item.cantidadMinima}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(item.estado)}`}>
                      {getEstadoIcon(item.estado)}
                      <span className="ml-2 capitalize">{item.estado.replace('-', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {item.ubicacion}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {item.responsable}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-center">
                      <div className="font-medium text-gray-800">
                        S/{(item.costo * item.cantidad).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        S/{item.costo} c/u
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Editar item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar item"
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

        {itemsFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay items que coincidan con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No hay items en el inventario</h3>
          <p>Agrega el primer item para comenzar a gestionar el inventario</p>
        </div>
      )}
    </div>
  );
}