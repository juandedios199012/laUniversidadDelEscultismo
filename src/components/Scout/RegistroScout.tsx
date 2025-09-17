import React, { useState } from 'react';
import { User, Smile as Family, Award, Save, X } from 'lucide-react';
import FormField from '../Forms/FormField';
import Input from '../Forms/Input';
import Select from '../Forms/Select';
import { DEPARTAMENTOS_PERU, RAMAS_EDADES, NOMBRAMIENTOS_POR_RAMA, PARENTESCOS } from '../../data/constants';

interface RegistroScoutProps {
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export default function RegistroScout({ onSave, onCancel }: RegistroScoutProps) {
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    // Datos Personales
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    pais: 'Perú',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    celular: '',
    telefono: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    correo: '',
    centroEstudio: '',
    ocupacion: '',
    centroLaboral: '',
    esDirigente: false,
    fechaIngreso: '',
    activo: true,
    // Datos Familiar
    familiarNombres: '',
    familiarApellidos: '',
    parentesco: '',
    familiarCelular: '',
    familiarTelefono: '',
    familiarCorreo: '',
    familiarOcupacion: '',
    familiarCentroLaboral: '',
    // Datos de Rama
    rama: '',
    seisena: '',
    patrulla: '',
    nombramiento: '',
    cargo: '',
    dirigenteScout: '',
    fechaIngresoRama: ''
  });

  const sections = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'familiar', label: 'Datos Familiar', icon: Family },
    { id: 'rama', label: 'Rama Scout', icon: Award }
  ];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getSuggestedRama = (age: number) => {
    for (const [rama, edades] of Object.entries(RAMAS_EDADES)) {
      if (age >= edades.min && age <= edades.max) {
        return rama;
      }
    }
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica de validación y guardado
    console.log('Guardando datos:', formData);
    onSave?.(formData);
  };

  const edad = calculateAge(formData.fechaNacimiento);
  const ramaRecomendada = getSuggestedRama(edad);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Registro de Boy Scout</h1>
        <p className="text-gray-600">Complete la información del nuevo miembro scout</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {activeSection === 'personal' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos Personales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nombres">
                <Input
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  placeholder="Ingrese los nombres completos"
                />
              </FormField>

              <FormField label="Apellidos">
                <Input
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  placeholder="Ingrese los apellidos completos"
                />
              </FormField>

              <FormField label="Fecha de Nacimiento">
                <Input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                />
                {edad > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Edad calculada: {edad} años 
                    {ramaRecomendada && (
                      <span className="text-blue-600 ml-1">
                        (Recomendado: {ramaRecomendada})
                      </span>
                    )}
                  </p>
                )}
              </FormField>

              <FormField label="País">
                <Select
                  value={formData.pais}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  options={[{ value: 'Perú', label: 'Perú' }]}
                />
              </FormField>

              <FormField label="Departamento">
                <Select
                  value={formData.departamento}
                  onChange={(e) => handleInputChange('departamento', e.target.value)}
                  options={DEPARTAMENTOS_PERU.map(dept => ({ value: dept, label: dept }))}
                  placeholder="Seleccione departamento"
                />
              </FormField>

              <FormField label="Provincia">
                <Input
                  value={formData.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  placeholder="Ingrese la provincia"
                  disabled={!formData.departamento}
                />
              </FormField>

              <FormField label="Distrito">
                <Input
                  value={formData.distrito}
                  onChange={(e) => handleInputChange('distrito', e.target.value)}
                  placeholder="Ingrese el distrito"
                  disabled={!formData.provincia}
                />
              </FormField>

              <FormField label="Dirección">
                <Input
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  placeholder="Ingrese la dirección completa"
                />
              </FormField>

              <FormField label="Celular">
                <Input
                  value={formData.celular}
                  onChange={(e) => handleInputChange('celular', e.target.value)}
                  placeholder="999-999-999"
                />
              </FormField>

              <FormField label="Teléfono">
                <Input
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="01-999-9999"
                />
              </FormField>

              <FormField label="Tipo de Documento">
                <Select
                  value={formData.tipoDocumento}
                  onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
                  options={[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'Carnet de Extranjería', label: 'Carnet de Extranjería' }
                  ]}
                />
              </FormField>

              <FormField label="Número de Documento">
                <Input
                  value={formData.numeroDocumento}
                  onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                  placeholder="Ingrese el número"
                />
              </FormField>

              <FormField label="Correo Electrónico">
                <Input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange('correo', e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </FormField>

              <FormField label="Centro de Estudio">
                <Input
                  value={formData.centroEstudio}
                  onChange={(e) => handleInputChange('centroEstudio', e.target.value)}
                  placeholder="Nombre del colegio/universidad"
                />
              </FormField>

              <FormField label="Ocupación">
                <Input
                  value={formData.ocupacion}
                  onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                  placeholder="Estudiante, profesional, etc."
                />
              </FormField>

              <FormField label="Centro Laboral">
                <Input
                  value={formData.centroLaboral}
                  onChange={(e) => handleInputChange('centroLaboral', e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </FormField>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="esDirigente"
                checked={formData.esDirigente}
                onChange={(e) => handleInputChange('esDirigente', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="esDirigente" className="text-sm font-medium text-gray-700">
                ¿Es Dirigente Scout?
              </label>
            </div>

            <FormField label="Fecha de Ingreso">
              <Input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => handleInputChange('fechaIngreso', e.target.value)}
              />
            </FormField>
          </div>
        )}

        {activeSection === 'familiar' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos del Familiar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nombres del Familiar">
                <Input
                  value={formData.familiarNombres}
                  onChange={(e) => handleInputChange('familiarNombres', e.target.value)}
                  placeholder="Nombres completos"
                />
              </FormField>

              <FormField label="Apellidos del Familiar">
                <Input
                  value={formData.familiarApellidos}
                  onChange={(e) => handleInputChange('familiarApellidos', e.target.value)}
                  placeholder="Apellidos completos"
                />
              </FormField>

              <FormField label="Parentesco">
                <Select
                  value={formData.parentesco}
                  onChange={(e) => handleInputChange('parentesco', e.target.value)}
                  options={PARENTESCOS.map(p => ({ value: p, label: p }))}
                  placeholder="Seleccione parentesco"
                />
              </FormField>

              <FormField label="Celular">
                <Input
                  value={formData.familiarCelular}
                  onChange={(e) => handleInputChange('familiarCelular', e.target.value)}
                  placeholder="999-999-999"
                />
              </FormField>

              <FormField label="Teléfono">
                <Input
                  value={formData.familiarTelefono}
                  onChange={(e) => handleInputChange('familiarTelefono', e.target.value)}
                  placeholder="01-999-9999"
                />
              </FormField>

              <FormField label="Correo">
                <Input
                  type="email"
                  value={formData.familiarCorreo}
                  onChange={(e) => handleInputChange('familiarCorreo', e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </FormField>

              <FormField label="Ocupación">
                <Input
                  value={formData.familiarOcupacion}
                  onChange={(e) => handleInputChange('familiarOcupacion', e.target.value)}
                  placeholder="Profesión u ocupación"
                />
              </FormField>

              <FormField label="Centro Laboral">
                <Input
                  value={formData.familiarCentroLaboral}
                  onChange={(e) => handleInputChange('familiarCentroLaboral', e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </FormField>
            </div>
          </div>
        )}

        {activeSection === 'rama' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos de Rama o Unidad Scout</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Rama">
                <Select
                  value={formData.rama}
                  onChange={(e) => handleInputChange('rama', e.target.value)}
                  options={Object.keys(RAMAS_EDADES).map(rama => ({ value: rama, label: rama }))}
                  placeholder="Seleccione rama"
                />
                {ramaRecomendada && (
                  <p className="text-sm text-blue-600 mt-1">
                    Sugerencia: {ramaRecomendada} (basado en edad: {edad} años)
                  </p>
                )}
              </FormField>

              {formData.rama === 'Manada' && (
                <FormField label="Seisena">
                  <Input
                    value={formData.seisena}
                    onChange={(e) => handleInputChange('seisena', e.target.value)}
                    placeholder="Nombre de la seisena"
                  />
                </FormField>
              )}

              {formData.rama === 'Tropa' && (
                <FormField label="Patrulla">
                  <Input
                    value={formData.patrulla}
                    onChange={(e) => handleInputChange('patrulla', e.target.value)}
                    placeholder="Nombre de la patrulla"
                  />
                </FormField>
              )}

              {formData.rama && (
                <FormField label="Nombramiento">
                  <Select
                    value={formData.nombramiento}
                    onChange={(e) => handleInputChange('nombramiento', e.target.value)}
                    options={(NOMBRAMIENTOS_POR_RAMA[formData.rama as keyof typeof NOMBRAMIENTOS_POR_RAMA] || [])
                      .map(n => ({ value: n, label: n }))}
                    placeholder="Seleccione nombramiento"
                  />
                </FormField>
              )}

              {formData.rama === 'Tropa' && (
                <FormField label="Cargo de Patrulla">
                  <Select
                    value={formData.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    options={[
                      { value: 'Intendente', label: 'Intendente' },
                      { value: 'Tesorero', label: 'Tesorero' },
                      { value: 'Secretario', label: 'Secretario' }
                    ]}
                    placeholder="Seleccione cargo"
                  />
                </FormField>
              )}

              <FormField label="Dirigente Scout">
                <Input
                  value={formData.dirigenteScout}
                  onChange={(e) => handleInputChange('dirigenteScout', e.target.value)}
                  placeholder="Buscar dirigente..."
                />
              </FormField>

              <FormField label="Fecha de Ingreso a la Rama">
                <Input
                  type="date"
                  value={formData.fechaIngresoRama}
                  onChange={(e) => handleInputChange('fechaIngresoRama', e.target.value)}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Scout</span>
          </button>
        </div>
      </div>
    </div>
  );
}