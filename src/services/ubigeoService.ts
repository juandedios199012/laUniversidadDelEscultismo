import { supabase } from '@/lib/supabase';

export interface Departamento {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Provincia {
  id: number;
  codigo: string;
  nombre: string;
  departamento_id: number;
}

export interface Distrito {
  id: number;
  codigo: string;
  nombre: string;
  provincia_id: number;
}

export class UbigeoService {
  private static departamentosCache: Departamento[] | null = null;
  private static provinciasCache: Map<number, Provincia[]> = new Map();
  private static distritosCache: Map<number, Distrito[]> = new Map();

  static async obtenerDepartamentos(): Promise<Departamento[]> {
    // Usar cache si existe
    if (this.departamentosCache) {
      return this.departamentosCache;
    }

    const { data, error } = await supabase.rpc('api_obtener_departamentos');
    
    if (error) {
      console.error('Error obteniendo departamentos:', error);
      return [];
    }

    if (data?.success) {
      this.departamentosCache = data.data;
      return data.data;
    }

    return [];
  }

  static async obtenerProvincias(departamentoId: number): Promise<Provincia[]> {
    // Usar cache si existe
    if (this.provinciasCache.has(departamentoId)) {
      return this.provinciasCache.get(departamentoId)!;
    }

    const { data, error } = await supabase.rpc('api_obtener_provincias', {
      p_departamento_id: departamentoId
    });
    
    if (error) {
      console.error('Error obteniendo provincias:', error);
      return [];
    }

    if (data?.success) {
      this.provinciasCache.set(departamentoId, data.data);
      return data.data;
    }

    return [];
  }

  static async obtenerDistritos(provinciaId: number): Promise<Distrito[]> {
    // Usar cache si existe
    if (this.distritosCache.has(provinciaId)) {
      return this.distritosCache.get(provinciaId)!;
    }

    const { data, error } = await supabase.rpc('api_obtener_distritos', {
      p_provincia_id: provinciaId
    });
    
    if (error) {
      console.error('Error obteniendo distritos:', error);
      return [];
    }

    if (data?.success) {
      this.distritosCache.set(provinciaId, data.data);
      return data.data;
    }

    return [];
  }

  // Limpiar cache (útil si se actualizan datos)
  static limpiarCache(): void {
    this.departamentosCache = null;
    this.provinciasCache.clear();
    this.distritosCache.clear();
  }
}
