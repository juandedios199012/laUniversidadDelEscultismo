# Cambios en RegistroScout.tsx

## 1. Agregar imports al inicio del archivo

```typescript
import FamiliarModal from './FamiliarModal';
import FamiliarTable from './FamiliarTable';
import { Familiar } from '../../types';
import { Heart, Activity, Church } from 'lucide-react'; // Agregar estos iconos
```

## 2. Extender interface FormularioScout

```typescript
interface FormularioScout {
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: 'MASCULINO' | 'FEMENINO' | '';
  numero_documento: string;
  tipo_documento: string;
  // Contacto
  celular: string;
  celular_secundario?: string;
  telefono?: string;
  correo: string;
  correo_secundario?: string;
  // Ubicación
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  // Scout
  centro_estudio: string;
  ocupacion: string;
  centro_laboral: string;
  es_dirigente: boolean;
  rama_actual: string;
  rama: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | '';
  // Campos nuevos - Religiosos
  religion?: string;
  // Campos nuevos - Salud
  grupo_sanguineo?: 'A' | 'B' | 'AB' | 'O' | '';
  factor_sanguineo?: 'POSITIVO' | 'NEGATIVO' | '';
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
}
```

## 3. Agregar estados para familiares

```typescript
// Después de los estados existentes, agregar:
const [familiares, setFamiliares] = useState<Familiar[]>([]);
const [familiarModal, setFamiliarModal] = useState({
  isOpen: false,
  familiar: null as Familiar | null,
  index: -1
});
```

## 4. Actualizar seccionesAbiertas

```typescript
const [seccionesAbiertas, setSeccionesAbiertas] = useState({
  datosPersonales: true,
  datosContacto: false,
  datosReligiosos: false,
  datosSalud: false,
  datosEducacion: false,
  datosFamiliares: false,
  datosScout: false
});
```

## 5. Agregar opciones para grupo sanguíneo

```typescript
const grupoSanguineoOptions = [
  { value: '', label: 'Seleccionar' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' },
  { value: 'O', label: 'O' }
];

const factorSanguineoOptions = [
  { value: '', label: 'Seleccionar' },
  { value: 'POSITIVO', label: 'Positivo (+)' },
  { value: 'NEGATIVO', label: 'Negativo (-)' }
];
```

## 6. Agregar funciones para manejar familiares

```typescript
const handleAgregarFamiliar = () => {
  setFamiliarModal({
    isOpen: true,
    familiar: null,
    index: -1
  });
};

const handleEditarFamiliar = (familiar: Familiar, index: number) => {
  setFamiliarModal({
    isOpen: true,
    familiar: familiar,
    index: index
  });
};

const handleEliminarFamiliar = (index: number) => {
  setFamiliares(prev => prev.filter((_, i) => i !== index));
};

const handleGuardarFamiliar = (familiar: Familiar) => {
  if (familiarModal.index >= 0) {
    // Editar familiar existente
    setFamiliares(prev => prev.map((f, i) => 
      i === familiarModal.index ? familiar : f
    ));
  } else {
    // Agregar nuevo familiar
    setFamiliares(prev => [...prev, familiar]);
  }
  setFamiliarModal({ isOpen: false, familiar: null, index: -1 });
};
```

## 7. Actualizar función resetFormulario

```typescript
const resetFormulario = () => {
  setFormData({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    numero_documento: '',
    tipo_documento: 'DNI',
    celular: '',
    celular_secundario: '',
    telefono: '',
    correo: '',
    correo_secundario: '',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    centro_estudio: '',
    ocupacion: '',
    centro_laboral: '',
    es_dirigente: false,
    rama_actual: '',
    rama: '',
    estado: 'ACTIVO',
    religion: '',
    grupo_sanguineo: '',
    factor_sanguineo: '',
    seguro_medico: '',
    tipo_discapacidad: '',
    carnet_conadis: '',
    descripcion_discapacidad: ''
  });
  setFamiliares([]);
  setModoEdicion(false);
  setScoutSeleccionado(null);
};
```

## 8. Actualizar función handleSubmit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validar que haya al menos un familiar
  if (familiares.length === 0) {
    setError('Debe agregar al menos un familiar');
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    const scoutData = {
      ...formData,
      telefono: formData.celular, // Backend espera 'telefono'
      email: formData.correo, // Backend espera 'email'
      familiares: familiares // Enviar array de familiares
    };

    let result;
    if (modoEdicion && scoutSeleccionado) {
      result = await ScoutService.updateScout(scoutSeleccionado.id, scoutData);
    } else {
      result = await ScoutService.createScout(scoutData);
    }

    if (result.success) {
      await cargarScouts();
      resetFormulario();
      setMostrarFormulario(false);
      alert(`Scout ${modoEdicion ? 'actualizado' : 'registrado'} exitosamente`);
    } else {
      setError(result.error || 'Error al guardar el scout');
    }
  } catch (error: any) {
    console.error('Error en submit:', error);
    setError(error.message || 'Error inesperado');
  } finally {
    setLoading(false);
  }
};
```

## 9. Actualizar función editarScout

```typescript
const editarScout = async (scout: Scout) => {
  setModoEdicion(true);
  setMostrarFormulario(true);

  // Cargar familiares del scout
  let familiaresData: Familiar[] = [];
  try {
    const scoutCompleto = await ScoutService.getScoutById(scout.id);
    if (scoutCompleto && scoutCompleto.familiares && scoutCompleto.familiares.length > 0) {
      familiaresData = scoutCompleto.familiares;
    }
  } catch (error) {
    console.error('❌ Error cargando familiares:', error);
  }

  setFormData({
    nombres: scout.nombres,
    apellidos: scout.apellidos,
    fecha_nacimiento: scout.fecha_nacimiento,
    sexo: (scout.sexo as 'MASCULINO' | 'FEMENINO') || '',
    numero_documento: scout.numero_documento,
    tipo_documento: scout.tipo_documento || 'DNI',
    celular: scout.celular || '',
    celular_secundario: scout.celular_secundario || '',
    telefono: scout.telefono || '',
    correo: scout.correo || '',
    correo_secundario: scout.correo_secundario || '',
    departamento: scout.departamento || '',
    provincia: scout.provincia || '',
    distrito: scout.distrito || '',
    direccion: scout.direccion || '',
    centro_estudio: scout.centro_estudio || '',
    ocupacion: scout.ocupacion || '',
    centro_laboral: scout.centro_laboral || '',
    es_dirigente: Boolean(scout.es_dirigente),
    rama_actual: scout.rama_actual || '',
    rama: scout.rama_actual || '',
    estado: (scout.estado as 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO') || 'ACTIVO',
    religion: scout.religion || '',
    grupo_sanguineo: (scout.grupo_sanguineo as any) || '',
    factor_sanguineo: (scout.factor_sanguineo as any) || '',
    seguro_medico: scout.seguro_medico || '',
    tipo_discapacidad: scout.tipo_discapacidad || '',
    carnet_conadis: scout.carnet_conadis || '',
    descripcion_discapacidad: scout.descripcion_discapacidad || ''
  });
  
  setFamiliares(familiaresData);
  setScoutSeleccionado(scout);
};
```

## 10. En el JSX, después de la sección "DATOS DE CONTACTO", agregar:

```tsx
{/* Sección: DATOS RELIGIOSOS */}
<div className="mb-6">
  <button
    type="button"
    onClick={() => toggleSeccion('datosReligiosos')}
    className="flex items-center justify-between w-full text-left mb-4"
  >
    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
      <Church className="w-5 h-5 text-purple-600" />
      Datos Religiosos
    </h3>
    {seccionesAbiertas.datosReligiosos ? 
      <ChevronUp className="w-5 h-5 text-gray-600" /> : 
      <ChevronDown className="w-5 h-5 text-gray-600" />
    }
  </button>

  {seccionesAbiertas.datosReligiosos && (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Religión o Credo
        </label>
        <input
          type="text"
          value={formData.religion || ''}
          onChange={(e) => handleInputChange('religion', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Católico, Protestante, etc."
        />
      </div>
    </div>
  )}
</div>

{/* Sección: DATOS MÉDICOS Y SALUD */}
<div className="mb-6">
  <button
    type="button"
    onClick={() => toggleSeccion('datosSalud')}
    className="flex items-center justify-between w-full text-left mb-4"
  >
    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
      <Activity className="w-5 h-5 text-red-600" />
      Datos Médicos y Salud
    </h3>
    {seccionesAbiertas.datosSalud ? 
      <ChevronUp className="w-5 h-5 text-gray-600" /> : 
      <ChevronDown className="w-5 h-5 text-gray-600" />
    }
  </button>

  {seccionesAbiertas.datosSalud && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grupo Sanguíneo
        </label>
        <select
          value={formData.grupo_sanguineo || ''}
          onChange={(e) => handleInputChange('grupo_sanguineo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {grupoSanguineoOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Factor Sanguíneo
        </label>
        <select
          value={formData.factor_sanguineo || ''}
          onChange={(e) => handleInputChange('factor_sanguineo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {factorSanguineoOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seguro Médico
        </label>
        <input
          type="text"
          value={formData.seguro_medico || ''}
          onChange={(e) => handleInputChange('seguro_medico', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="EsSalud, SIS, Privado, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Discapacidad
        </label>
        <input
          type="text"
          value={formData.tipo_discapacidad || ''}
          onChange={(e) => handleInputChange('tipo_discapacidad', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Visual, Auditiva, Motriz, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carné CONADIS
        </label>
        <input
          type="text"
          value={formData.carnet_conadis || ''}
          onChange={(e) => handleInputChange('carnet_conadis', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Número de carné"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción de Discapacidad (si aplica)
        </label>
        <textarea
          value={formData.descripcion_discapacidad || ''}
          onChange={(e) => handleInputChange('descripcion_discapacidad', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describa detalladamente cualquier condición especial que requiera atención..."
        />
      </div>
    </div>
  )}
</div>
```

## 11. Reemplazar la sección de "DATOS DEL FAMILIAR" con:

```tsx
{/* Sección: DATOS DE FAMILIARES */}
<div className="mb-6">
  <button
    type="button"
    onClick={() => toggleSeccion('datosFamiliares')}
    className="flex items-center justify-between w-full text-left mb-4"
  >
    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
      <Users className="w-5 h-5 text-green-600" />
      Datos de Familiares
    </h3>
    {seccionesAbiertas.datosFamiliares ? 
      <ChevronUp className="w-5 h-5 text-gray-600" /> : 
      <ChevronDown className="w-5 h-5 text-gray-600" />
    }
  </button>

  {seccionesAbiertas.datosFamiliares && (
    <div>
      <FamiliarTable
        familiares={familiares}
        onEdit={handleEditarFamiliar}
        onDelete={handleEliminarFamiliar}
        onAdd={handleAgregarFamiliar}
      />
    </div>
  )}
</div>

{/* Modal de Familiar */}
<FamiliarModal
  isOpen={familiarModal.isOpen}
  onClose={() => setFamiliarModal({ isOpen: false, familiar: null, index: -1 })}
  onSave={handleGuardarFamiliar}
  familiar={familiarModal.familiar}
  title={familiarModal.index >= 0 ? 'Editar Familiar' : 'Agregar Familiar'}
/>
```

---

Estos son todos los cambios necesarios. La implementación mantiene el flujo existente y agrega la funcionalidad de múltiples familiares con el modal y tabla.
