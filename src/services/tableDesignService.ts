import { supabase } from '../lib/supabase';

export interface TableDesign {
  id: string;
  name: string;
  description: string;
  design_data: any;
  is_default: boolean;
  category: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveTableDesignRequest {
  name: string;
  description?: string;
  design_data: any;
  category?: string;
}

class TableDesignService {
  
  /**
   * Obtener todos los diseños de tabla
   */
  async getAllDesigns(): Promise<TableDesign[]> {
    try {
      console.log('🔍 Iniciando consulta getAllDesigns...');
      
      // Verificar usuario actual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('👤 Usuario actual:', userData?.user?.id || 'no autenticado');
      
      if (userError) {
        console.warn('⚠️ Warning obteniendo usuario:', userError);
      }

      const { data, error } = await supabase
        .from('table_designs')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📋 Respuesta de Supabase:', { data, error });
      console.log('📊 Cantidad de registros obtenidos:', data?.length || 0);

      if (error) {
        console.error('❌ Error obteniendo diseños:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Detalles del error:', error.details);
        console.error('❌ Mensaje completo:', error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error en getAllDesigns:', error);
      throw error;
    }
  }

  /**
   * Obtener diseño por ID
   */
  async getDesignById(id: string): Promise<TableDesign | null> {
    try {
      const { data, error } = await supabase
        .from('table_designs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error obteniendo diseño por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getDesignById:', error);
      throw error;
    }
  }

  /**
   * Obtener diseño por defecto de una categoría
   */
  async getDefaultDesign(category: string = 'dngi03'): Promise<TableDesign | null> {
    try {
      const { data, error } = await supabase
        .from('table_designs')
        .select('*')
        .eq('category', category)
        .eq('is_default', true)
        .single();

      if (error) {
        console.error('Error obteniendo diseño por defecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getDefaultDesign:', error);
      throw error;
    }
  }

  /**
   * Guardar nuevo diseño
   */
  async saveDesign(design: SaveTableDesignRequest): Promise<TableDesign> {
    try {
      console.log('🚀 Guardando diseño:', design);

      // Obtener usuario actual (puede ser null)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.warn('⚠️ Warning obteniendo usuario:', userError);
      }

      const userId = userData?.user?.id || null;
      console.log('👤 Usuario ID:', userId);

      const { data, error } = await supabase
        .from('table_designs')
        .insert({
          name: design.name,
          description: design.description || '',
          design_data: design.design_data,
          category: design.category || 'custom',
          is_default: false,
          created_by: userId // Explícitamente permitir null
        })
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error guardando diseño:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Detalles del error:', error.details);
        
        // Si es error de RLS, dar más información
        if (error.code === '42501') {
          throw new Error('Error de permisos: Revisa las políticas RLS de la tabla table_designs. Usuario ID: ' + userId);
        }
        
        throw error;
      }

      console.log('✅ Diseño guardado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en saveDesign:', error);
      throw error;
    }
  }

  /**
   * Actualizar diseño existente
   */
  async updateDesign(id: string, design: Partial<SaveTableDesignRequest>): Promise<TableDesign> {
    try {
      console.log('🔄 Actualizando diseño:', { id, design });

      const { data, error } = await supabase
        .from('table_designs')
        .update({
          ...(design.name && { name: design.name }),
          ...(design.description && { description: design.description }),
          ...(design.design_data && { design_data: design.design_data }),
          ...(design.category && { category: design.category }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error actualizando diseño:', error);
        throw error;
      }

      console.log('✅ Diseño actualizado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateDesign:', error);
      throw error;
    }
  }

  /**
   * Eliminar diseño
   */
  async deleteDesign(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Eliminando diseño:', id);

      const { error } = await supabase
        .from('table_designs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error eliminando diseño:', error);
        throw error;
      }

      console.log('✅ Diseño eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error en deleteDesign:', error);
      throw error;
    }
  }

  /**
   * Obtener diseños por categoría
   */
  async getDesignsByCategory(category: string): Promise<TableDesign[]> {
    try {
      const { data, error } = await supabase
        .from('table_designs')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo diseños por categoría:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getDesignsByCategory:', error);
      throw error;
    }
  }

  /**
   * Marcar diseño como por defecto
   */
  async setDefaultDesign(id: string, category: string): Promise<TableDesign> {
    try {
      // Primero quitar el default de otros diseños de la misma categoría
      await supabase
        .from('table_designs')
        .update({ is_default: false })
        .eq('category', category);

      // Luego marcar este diseño como default
      const { data, error } = await supabase
        .from('table_designs')
        .update({ is_default: true })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error estableciendo diseño como por defecto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en setDefaultDesign:', error);
      throw error;
    }
  }
}

export const tableDesignService = new TableDesignService();
export default tableDesignService;