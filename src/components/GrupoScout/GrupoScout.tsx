import { useState, useEffect } from 'react';
import { Flag, Plus, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { GrupoScout } from '../../lib/supabase';

export default function GrupoScout() {
  const [grupos, setGrupos] = useState<GrupoScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GrupoScout | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    numeral: '',
    localidad: '',
    region: '',
    fecha_fundacion: '',
    fundador: '',
    lugar_reunion: ''
  });

  // Load data effect
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏕️ Cargando grupos scout desde base de datos...');
      
      // Cargar datos reales desde la base de datos
      const { data: gruposData, error } = await supabase
        .from('grupos_scout')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGrupos(gruposData || []);
      console.log('✅ Grupos cargados:', (gruposData || []).length, 'grupos');
      
    } catch (err) {
      console.error('❌ Error loading grupos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar los grupos scout: ${errorMessage}`);
      
      // Fallback a arreglo vacío en caso de error
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      numeral: '',
      localidad: '',
      region: '',
      fecha_fundacion: '',
      fundador: '',
      lugar_reunion: ''
    });
    setShowForm(false);
    setEditingGroup(null);
  };

  // CRUD Operations
  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (editingGroup) {
        // Actualizar grupo existente
        console.log('✏️ Actualizando grupo scout...', editingGroup.id);
        
        const { error } = await supabase
          .from('grupos_scout')
          .update({
            nombre: formData.nombre,
            numeral: formData.numeral,
            localidad: formData.localidad,
            region: formData.region,
            fecha_fundacion: formData.fecha_fundacion,
            fundador: formData.fundador,
            lugar_reunion: formData.lugar_reunion
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        console.log('✅ Grupo scout actualizado exitosamente');
      } else {
        // Crear nuevo grupo
        console.log('💾 Guardando grupo scout...', formData);
        
        const { error } = await supabase
          .from('grupos_scout')
          .insert([{
            nombre: formData.nombre,
            numeral: formData.numeral,
            localidad: formData.localidad,
            region: formData.region,
            fecha_fundacion: formData.fecha_fundacion,
            fundador: formData.fundador,
            lugar_reunion: formData.lugar_reunion,
            codigo_grupo: `GR${String(Date.now()).slice(-4)}`, // Código temporal
            activo: true
          }]);

        if (error) throw error;
        console.log('✅ Grupo scout guardado exitosamente');
      }

      resetForm();
      await loadData(); // Recargar datos
      
    } catch (error: any) {
      console.error('❌ Error al guardar grupo:', error);
      setError(error.message || 'Error al guardar el grupo scout');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (grupo: GrupoScout) => {
    // Cargar datos del grupo en el formulario
    setFormData({
      nombre: grupo.nombre || '',
      numeral: grupo.numeral || '',
      localidad: grupo.localidad || '',
      region: grupo.region || '',
      fecha_fundacion: grupo.fecha_fundacion || '',
      fundador: grupo.fundador || '',
      lugar_reunion: grupo.lugar_reunion || ''
    });
    setEditingGroup(grupo);
    setShowForm(true);
  };

  const handleDelete = async (grupoId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo scout?')) {
      return;
    }

    try {
      setLoading(true);
      
      console.log('🗑️ Eliminando grupo scout...', grupoId);
      
      const { error } = await supabase
        .from('grupos_scout')
        .delete()
        .eq('id', grupoId);

      if (error) throw error;

      console.log('✅ Grupo scout eliminado exitosamente');
      await loadData(); // Recargar datos
      
    } catch (error: any) {
      console.error('❌ Error al eliminar grupo:', error);
      setError(error.message || 'Error al eliminar el grupo scout');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando grupos scout...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Flag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Grupo Scout</h1>
            <p className="text-gray-600">Gestión de grupos scout registrados en el sistema</p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo Scout
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <X className="w-5 h-5" />
            <span className="font-medium">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Simple Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingGroup ? 'Editar Grupo Scout' : 'Nuevo Grupo Scout'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del grupo"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Numeral"
                value={formData.numeral}
                onChange={(e) => handleInputChange('numeral', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Localidad"
                value={formData.localidad}
                onChange={(e) => handleInputChange('localidad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Región"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                placeholder="Fecha de fundación"
                value={formData.fecha_fundacion}
                onChange={(e) => handleInputChange('fecha_fundacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Fundador (opcional)"
                value={formData.fundador}
                onChange={(e) => handleInputChange('fundador', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                placeholder="Lugar de reunión (opcional)"
                value={formData.lugar_reunion}
                onChange={(e) => handleInputChange('lugar_reunion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.nombre.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (editingGroup ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grupos List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 bg-purple-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Grupos Scout Registrados</h2>
          <p className="text-gray-600 mt-1">Total: {grupos.length} grupo(s)</p>
        </div>

        {grupos.length === 0 ? (
          <div className="p-8 text-center">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grupos registrados</h3>
            <p className="text-gray-500">Comienza creando tu primer grupo scout</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {grupos.map((grupo) => (
              <div key={grupo.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{grupo.nombre}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        grupo.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {grupo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Numeral:</span> {grupo.numeral}
                      </div>
                      <div>
                        <span className="font-medium">Ubicación:</span> {grupo.localidad}, {grupo.region}
                      </div>
                      <div>
                        <span className="font-medium">Fundación:</span> {new Date(grupo.fecha_fundacion).toLocaleDateString('es-PE')}
                      </div>
                      {grupo.fundador && (
                        <div>
                          <span className="font-medium">Fundador:</span> {grupo.fundador}
                        </div>
                      )}
                    </div>
                    
                    {grupo.lugar_reunion && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Lugar de reunión:</span> {grupo.lugar_reunion}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(grupo)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(grupo.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}