# 🎯 Guía de Integración - Database Functions API

## 🚀 **Setup e Instalación**

### **1. Requisitos Previos**
```bash
# PostgreSQL 14+ con extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

# Node.js 18+ para servicios
node --version  # >= 18.0.0

# Supabase CLI (opcional)
npm install -g @supabase/cli
```

### **2. Aplicar Database Functions**
```bash
# Orden de aplicación (IMPORTANTE)
psql -d scout_lima12 -f database/01_schema.sql
psql -d scout_lima12 -f database/02_functions.sql
psql -d scout_lima12 -f database/03_security.sql
psql -d scout_lima12 -f database/04_seed_data.sql

# Database Functions por módulo
psql -d scout_lima12 -f database/05_functions_inventario.sql
psql -d scout_lima12 -f database/06_functions_scouts.sql
psql -d scout_lima12 -f database/07_functions_presupuestos.sql
psql -d scout_lima12 -f database/08_functions_asistencia.sql
psql -d scout_lima12 -f database/09_functions_dirigentes.sql
psql -d scout_lima12 -f database/10_functions_patrullas.sql
psql -d scout_lima12 -f database/11_functions_comite_padres.sql
psql -d scout_lima12 -f database/12_functions_libro_oro.sql
psql -d scout_lima12 -f database/13_functions_programa_semanal.sql
psql -d scout_lima12 -f database/14_functions_inscripcion.sql
psql -d scout_lima12 -f database/15_functions_actividades.sql
psql -d scout_lima12 -f database/16_functions_reports.sql

# Aplicar optimizaciones (ÚLTIMO)
psql -d scout_lima12 -f database/apply_performance_optimizations.sql
```

### **3. Validar Instalación**
```bash
# Ejecutar validación automática
./validate-architecture.sh

# O desde PostgreSQL
psql -d scout_lima12 -c "SELECT health_check_performance();"
```

---

## 🔧 **Integración con Supabase**

### **Configuración del Cliente**
```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'scout-lima12-app'
    }
  }
});

// Tipos TypeScript generados
export type { Database } from './types/database.types';
```

### **Wrapper de Database Functions**
```typescript
// db-functions.ts
import { supabase } from './supabase';

export class DatabaseFunctions {
  
  // Wrapper genérico para todas las funciones
  static async callFunction<T = any>(
    functionName: string, 
    params: Record<string, any> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw new Error(error.message);
      }
      
      // Las funciones retornan JSON con estructura estándar
      return data as ApiResponse<T>;
      
    } catch (error) {
      console.error(`Database function error:`, error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error desconocido',
        errors: [{ field: 'system', code: 'DB_ERROR', message: error.message }]
      };
    }
  }
  
  // Wrapper con retry automático para funciones críticas
  static async callFunctionWithRetry<T = any>(
    functionName: string,
    params: Record<string, any> = {},
    maxRetries: number = 3
  ): Promise<ApiResponse<T>> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.callFunction<T>(functionName, params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Backoff exponencial
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
    
    throw lastError!;
  }
}
```

---

## 🛠️ **Servicios por Módulo**

### **Scout Service**
```typescript
// services/scout.service.ts
import { DatabaseFunctions } from '../lib/db-functions';

export interface Scout {
  id: string;
  numeroScout: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  rama: Rama;
  estado: EstadoScout;
  datosContacto: ContactoScout;
  datosFamilia: FamiliaScout;
}

export class ScoutService {
  
  static async registrar(datos: RegistroScoutData): Promise<Scout> {
    const response = await DatabaseFunctions.callFunction('registrar_scout', {
      p_nombre: datos.nombre,
      p_apellidos: datos.apellidos,
      p_fecha_nacimiento: datos.fechaNacimiento,
      p_rama: datos.rama,
      p_datos_contacto: datos.contacto,
      p_datos_familia: datos.familia,
      p_dirigente_id: datos.dirigenteId
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async buscar(filtros: FiltrosScout): Promise<Scout[]> {
    const response = await DatabaseFunctions.callFunction('buscar_scouts_por_criterio', {
      p_filtros: filtros,
      p_limite: filtros.limite || 50,
      p_offset: filtros.offset || 0
    });
    
    return response.success ? response.data : [];
  }
  
  static async obtenerPorId(id: string): Promise<Scout | null> {
    const response = await DatabaseFunctions.callFunction('obtener_scout_por_id', {
      p_scout_id: id
    });
    
    return response.success ? response.data : null;
  }
  
  static async actualizar(id: string, datos: ActualizacionScout): Promise<Scout> {
    const response = await DatabaseFunctions.callFunction('actualizar_datos_scout', {
      p_scout_id: id,
      p_datos_actualizacion: datos
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
}
```

### **Inventario Service**
```typescript
// services/inventario.service.ts
export class InventarioService {
  
  static async registrarItem(item: RegistroItemData): Promise<ItemInventario> {
    const response = await DatabaseFunctions.callFunction('registrar_item_inventario', {
      p_nombre: item.nombre,
      p_categoria: item.categoria,
      p_descripcion: item.descripcion,
      p_cantidad_total: item.cantidadTotal,
      p_ubicacion: item.ubicacion,
      p_valor_unitario: item.valorUnitario,
      p_metadata: item.metadata
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }
  
  static async crearPrestamo(prestamo: SolicitudPrestamo): Promise<string> {
    const response = await DatabaseFunctions.callFunctionWithRetry('crear_prestamo_inventario', {
      p_items_prestamo: prestamo.items,
      p_solicitante_id: prestamo.solicitanteId,
      p_responsable_prestamo_id: prestamo.responsableId,
      p_fecha_devolucion_estimada: prestamo.fechaDevolucion,
      p_motivo: prestamo.motivo,
      p_condiciones_prestamo: prestamo.condiciones
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data.prestamo_id;
  }
  
  static async buscarDisponibles(filtros: FiltrosBusqueda): Promise<ItemInventario[]> {
    const response = await DatabaseFunctions.callFunction('buscar_items_disponibles_prestamo', {
      p_categoria: filtros.categoria,
      p_cantidad_minima: filtros.cantidadMinima,
      p_fecha_necesaria: filtros.fechaNecesaria
    });
    
    return response.success ? response.data : [];
  }
}
```

---

## 🔐 **Autenticación y Autorización**

### **Row Level Security Integration**
```typescript
// auth/auth-context.tsx
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Obtener rol del usuario desde JWT o base de datos
        getUserRole(session.user.id).then(setUserRole);
      }
    });
    
    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          const role = await getUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <AuthContext.Provider value={{ session, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Hook de Permisos**
```typescript
// hooks/use-permissions.ts
export const usePermissions = () => {
  const { userRole } = useAuth();
  
  const canAccessModule = (module: ModuleName): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions?.modules.includes(module) || false;
  };
  
  const canPerformAction = (action: ActionType, resource: ResourceType): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions?.actions[resource]?.includes(action) || false;
  };
  
  return {
    canAccessModule,
    canPerformAction,
    role: userRole
  };
};

// Definición de permisos
const ROLE_PERMISSIONS = {
  COORDINADOR: {
    modules: ['SCOUTS', 'INVENTARIO', 'PRESUPUESTOS', 'REPORTES', 'DIRIGENTES'],
    actions: {
      SCOUTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      INVENTARIO: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRESUPUESTOS: ['CREATE', 'READ', 'UPDATE', 'DELETE']
    }
  },
  DIRIGENTE: {
    modules: ['SCOUTS', 'ASISTENCIA', 'PATRULLAS', 'ACTIVIDADES'],
    actions: {
      SCOUTS: ['READ', 'UPDATE'],
      ASISTENCIA: ['CREATE', 'READ', 'UPDATE'],
      PATRULLAS: ['READ', 'UPDATE']
    }
  }
  // ... más roles
};
```

---

## 📊 **Manejo de Estados y Cache**

### **React Query Integration**
```typescript
// hooks/use-scouts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useScouts = (filtros?: FiltrosScout) => {
  return useQuery({
    queryKey: ['scouts', filtros],
    queryFn: () => ScoutService.buscar(filtros || {}),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!filtros || Object.keys(filtros || {}).length === 0
  });
};

export const useScout = (id: string) => {
  return useQuery({
    queryKey: ['scout', id],
    queryFn: () => ScoutService.obtenerPorId(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000 // 2 minutos para datos individuales
  });
};

export const useRegistrarScout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ScoutService.registrar,
    onSuccess: (nuevoScout) => {
      // Invalidar cache de búsquedas
      queryClient.invalidateQueries({ queryKey: ['scouts'] });
      
      // Actualizar cache específico
      queryClient.setQueryData(['scout', nuevoScout.id], nuevoScout);
      
      // Mostrar notificación
      toast.success('Scout registrado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};
```

### **Estado Global con Zustand**
```typescript
// stores/app.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Cache de datos críticos
  currentUser: User | null;
  selectedRama: Rama | null;
  dashboardData: DashboardData | null;
  
  // Configuración de UI
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setSelectedRama: (rama: Rama | null) => void;
  updateDashboard: (data: DashboardData) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      selectedRama: null,
      dashboardData: null,
      sidebarCollapsed: false,
      theme: 'light',
      
      setCurrentUser: (user) => set({ currentUser: user }),
      setSelectedRama: (rama) => set({ selectedRama: rama }),
      updateDashboard: (data) => set({ dashboardData: data }),
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      }))
    }),
    {
      name: 'scout-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);
```

---

## 🚨 **Manejo de Errores**

### **Error Boundary Global**
```typescript
// components/error-boundary.tsx
export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean; error: Error | null}
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error
    console.error('Error capturado por boundary:', error, errorInfo);
    
    // Enviar a servicio de monitoreo (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Algo salió mal</h2>
          <p>Ha ocurrido un error inesperado. Por favor, recarga la página.</p>
          <button onClick={() => window.location.reload()}>
            Recargar Página
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### **Hook para Manejo de Errores**
```typescript
// hooks/use-error-handler.ts
export const useErrorHandler = () => {
  const showNotification = useNotification();
  
  const handleError = useCallback((error: unknown, context?: string) => {
    let message = 'Ha ocurrido un error inesperado';
    let details = '';
    
    if (error instanceof ApiError) {
      message = error.message;
      details = error.errors?.map(e => e.message).join(', ') || '';
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    // Log del error
    console.error(`Error en ${context}:`, error);
    
    // Mostrar notificación al usuario
    showNotification({
      type: 'error',
      title: 'Error',
      message,
      details,
      duration: 5000
    });
    
    // Reportar a servicio de monitoreo
    if (process.env.NODE_ENV === 'production') {
      reportError(error, context);
    }
  }, [showNotification]);
  
  return { handleError };
};
```

---

## 📱 **Componentes de UI Reutilizables**

### **DataTable Genérica**
```typescript
// components/data-table.tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  actions?: ActionConfig<T>[];
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading,
  pagination,
  onRowClick,
  actions
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>();
  const [filters, setFilters] = useState<FilterConfig>({});
  
  // Lógica de sorting y filtrado
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        );
      }
    });
    
    // Aplicar sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return result;
  }, [data, filters, sortConfig]);
  
  return (
    <div className="data-table">
      {/* Filtros */}
      <div className="table-filters">
        {columns.filter(col => col.filterable).map(column => (
          <input
            key={String(column.key)}
            placeholder={`Filtrar por ${column.title}`}
            value={filters[String(column.key)] || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              [String(column.key)]: e.target.value
            }))}
          />
        ))}
      </div>
      
      {/* Tabla */}
      <table className="table">
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={String(column.key)}
                onClick={() => column.sortable && setSortConfig({
                  key: String(column.key),
                  direction: sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                    ? 'desc' : 'asc'
                })}
                className={column.sortable ? 'sortable' : ''}
              >
                {column.title}
                {sortConfig?.key === column.key && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
            {actions && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)}>
                <div className="loading">Cargando...</div>
              </td>
            </tr>
          ) : processedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)}>
                <div className="empty-state">No hay datos disponibles</div>
              </td>
            </tr>
          ) : (
            processedData.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map(column => (
                  <td key={String(column.key)}>
                    {column.render 
                      ? column.render(row[String(column.key)], row)
                      : row[String(column.key)]
                    }
                  </td>
                ))}
                {actions && (
                  <td>
                    <div className="actions">
                      {actions.map(action => (
                        <button
                          key={action.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`action-btn ${action.variant || 'default'}`}
                          disabled={action.disabled?.(row)}
                        >
                          {action.icon && <span className="icon">{action.icon}</span>}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Paginación */}
      {pagination && (
        <div className="pagination">
          {/* Componente de paginación */}
        </div>
      )}
    </div>
  );
};
```

---

## 🧪 **Testing**

### **Tests de Integración**
```typescript
// tests/scouts.integration.test.ts
describe('Scout Integration Tests', () => {
  beforeEach(async () => {
    // Setup de datos de prueba
    await DatabaseFunctions.callFunction('limpiar_datos_prueba_scouts');
    await DatabaseFunctions.callFunction('generar_datos_prueba_scouts', { cantidad: 10 });
  });
  
  it('should register a new scout', async () => {
    const scoutData = {
      nombre: 'Juan Test',
      apellidos: 'Pérez García',
      fechaNacimiento: '2010-05-15',
      rama: 'LOBATOS',
      contacto: { telefono: '987654321' },
      familia: { padre: 'Carlos Pérez' }
    };
    
    const result = await ScoutService.registrar(scoutData);
    
    expect(result).toBeDefined();
    expect(result.nombre).toBe(scoutData.nombre);
    expect(result.numeroScout).toMatch(/SC\d{7}/);
  });
  
  it('should search scouts by criteria', async () => {
    const filtros = {
      rama: 'LOBATOS' as Rama,
      estado: 'ACTIVO' as EstadoScout
    };
    
    const scouts = await ScoutService.buscar(filtros);
    
    expect(Array.isArray(scouts)).toBe(true);
    scouts.forEach(scout => {
      expect(scout.rama).toBe('LOBATOS');
      expect(scout.estado).toBe('ACTIVO');
    });
  });
});
```

### **Tests de Performance**
```typescript
// tests/performance.test.ts
describe('Performance Tests', () => {
  it('should handle large dataset efficiently', async () => {
    const startTime = Date.now();
    
    const scouts = await ScoutService.buscar({ limite: 1000 });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(2000); // Menos de 2 segundos
    expect(scouts.length).toBeLessThanOrEqual(1000);
  });
  
  it('should use cache effectively', async () => {
    // Primera llamada (sin cache)
    const start1 = Date.now();
    await ScoutService.obtenerEstadisticas();
    const duration1 = Date.now() - start1;
    
    // Segunda llamada (con cache)
    const start2 = Date.now();
    await ScoutService.obtenerEstadisticas();
    const duration2 = Date.now() - start2;
    
    expect(duration2).toBeLessThan(duration1 * 0.5); // Al menos 50% más rápido
  });
});
```

---

## 📚 **Best Practices**

### **1. Estructura de Proyectos**
```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes básicos de UI
│   ├── forms/          # Formularios especializados
│   └── tables/         # Componentes de tablas
├── pages/              # Páginas de la aplicación
├── services/           # Servicios de API
├── hooks/              # Custom hooks
├── stores/             # Estado global
├── lib/                # Utilidades y configuración
├── types/              # Definiciones de tipos
└── tests/              # Tests
```

### **2. Convenciones de Código**
```typescript
// Naming conventions
interface Scout {}           // PascalCase para interfaces
type ScoutStatus = 'ACTIVO'; // PascalCase para types
const scoutService = {};     // camelCase para variables
const SCOUT_ROLES = {};      // UPPER_SNAKE_CASE para constantes

// Prefijos para hooks
const useScouts = () => {};      // use + PascalCase
const useScoutForm = () => {};   // Descriptivo y específico

// Sufijos para types
interface ScoutData {}           // Data para objetos de entrada
interface ScoutResponse {}       // Response para respuestas de API
interface ScoutConfig {}         // Config para configuraciones
```

### **3. Manejo de Performance**
```typescript
// Lazy loading de componentes
const ScoutDetailPage = lazy(() => import('./pages/ScoutDetailPage'));

// Memoización de componentes costosos
const ScoutList = memo(({ scouts, onSelect }) => {
  const sortedScouts = useMemo(() => 
    scouts.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [scouts]
  );
  
  return (
    <div>
      {sortedScouts.map(scout => (
        <ScoutCard key={scout.id} scout={scout} onSelect={onSelect} />
      ))}
    </div>
  );
});

// Debounce para búsquedas
const useScoutSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data: scouts } = useScouts({
    texto_busqueda: debouncedSearchTerm
  });
  
  return { scouts, searchTerm, setSearchTerm };
};
```

---

**🎯 Sistema completamente integrado y documentado para desarrollo frontend/backend**

**🔗 [Volver a API Principal](../API_DOCUMENTATION.md)**