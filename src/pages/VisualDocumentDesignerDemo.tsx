/**
 * 🎨 Demo del Editor Visual de Documentos
 * Demostración del sistema completo de diseño visual
 */

import React, { useState, useEffect } from 'react';
import { FileText, Settings, Download, Users } from 'lucide-react';
import { VisualDocumentDesigner } from '../components/documents/VisualDocumentDesigner';
import { Scout } from '../lib/supabase';
import ScoutService from '../services/scoutService';

export const VisualDocumentDesignerDemo: React.FC = () => {
  const [showDesigner, setShowDesigner] = useState(false);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [scoutsError, setScoutsError] = useState<string | null>(null);

  // Cargar scouts reales de la base de datos
  useEffect(() => {
    loadRealScouts();
  }, []);

  const loadRealScouts = async () => {
    try {
      setLoadingScouts(true);
      setScoutsError(null);
      console.log('🔍 Cargando scouts reales desde la base de datos...');
      
      const scoutsData = await ScoutService.getAllScouts();
      console.log('✅ Scouts cargados para demo:', scoutsData.length);
      
      setScouts(scoutsData);
    } catch (error) {
      console.error('❌ Error al cargar scouts para demo:', error);
      setScoutsError('Error al conectar con la base de datos');
      
      // Fallback a datos de ejemplo si falla la conexión
      setScouts(getSampleScouts());
    } finally {
      setLoadingScouts(false);
    }
  };

  // Datos de ejemplo como fallback
  const getSampleScouts = (): Scout[] => [
    {
      id: 'demo-1',
      codigo_scout: 'SCT-001',
      apellidos: 'GONZALES MARTINEZ',
      nombres: 'JUAN CARLOS',
      sexo: 'MASCULINO',
      edad: 16,
      fecha_nacimiento: '2008-05-15',
      tipo_documento: 'DNI',
      numero_documento: '12345678',
      celular: '987654321',
      telefono: '01-2345678',
      correo: 'juan.gonzales@scouts.org.pe',
      direccion: 'AV. LOS SCOUTS 123',
      pais: 'PERU',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'SAN ISIDRO',
      centro_estudio: 'COLEGIO SCOUT LIMA',
      rama_actual: 'Scouts',
      estado: 'ACTIVO' as const,
      es_dirigente: false,
      fecha_ingreso: '2020-03-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      codigo_scout: 'SCT-002',
      apellidos: 'RODRIGUEZ SILVA',
      nombres: 'MARIA ALEJANDRA',
      sexo: 'FEMENINO',
      edad: 17,
      fecha_nacimiento: '2007-11-22',
      tipo_documento: 'DNI',
      numero_documento: '87654321',
      celular: '912345678',
      telefono: '01-8765432',
      correo: 'maria.rodriguez@scouts.org.pe',
      direccion: 'JR. BADEN POWELL 456',
      pais: 'PERU',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'MIRAFLORES',
      centro_estudio: 'COLEGIO NACIONAL PERU',
      rama_actual: 'Scouts',
      estado: 'ACTIVO' as const,
      es_dirigente: false,
      fecha_ingreso: '2019-08-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Editor Visual de Documentos DNGI-03
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Sistema completo de diseño visual para documentos Scout
          </p>
          
          {!showDesigner && (
            <button
              onClick={() => setShowDesigner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium flex items-center gap-3 mx-auto transition-colors"
            >
              <FileText className="h-6 w-6" />
              Abrir Editor Visual
            </button>
          )}
        </div>

        {/* Características del sistema */}
        {!showDesigner && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-semibold">Diseño Visual</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• Editor drag & drop</li>
                <li>• Configuración de celdas</li>
                <li>• Vista previa en tiempo real</li>
                <li>• Templates predefinidos</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-semibold">Múltiples Formatos</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• HTML optimizado</li>
                <li>• Word (próximamente)</li>
                <li>• PDF (próximamente)</li>
                <li>• Generación masiva</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-4">
                <Download className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold">Gestión Avanzada</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>• Templates personalizados</li>
                <li>• Guardado automático</li>
                <li>• Descarga directa</li>
                <li>• Integración completa</li>
              </ul>
            </div>
          </div>
        )}

        {/* Datos de muestra */}
        {!showDesigner && (
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Datos para Demostración</h3>
              <div className="flex items-center gap-2">
                {loadingScouts && (
                  <div className="text-blue-600 text-sm">Cargando scouts...</div>
                )}
                {scoutsError && (
                  <div className="text-red-600 text-sm bg-red-50 px-2 py-1 rounded">
                    {scoutsError} - Usando datos de ejemplo
                  </div>
                )}
                {!loadingScouts && !scoutsError && scouts.length > 0 && (
                  <div className="text-green-600 text-sm bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {scouts.length} scouts reales conectados
                  </div>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {scouts.slice(0, 2).map((scout, index) => (
                <div key={scout.id} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Scout {index + 1}</h4>
                  <p className="text-sm text-gray-600">
                    {scout.nombres} {scout.apellidos}
                  </p>
                  <p className="text-sm text-gray-500">
                    {scout.tipo_documento}: {scout.numero_documento}
                  </p>
                  {scout.distrito && (
                    <p className="text-sm text-gray-500">
                      📍 {scout.distrito}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {scouts.length > 2 && (
              <p className="text-center text-gray-500 mt-4">
                Y {scouts.length - 2} scouts más disponibles para usar en documentos
              </p>
            )}
          </div>
        )}

        {/* Editor Visual */}
        {showDesigner && (
          <div className="bg-white rounded-lg shadow-lg">
            <VisualDocumentDesigner
              scouts={scouts}
              onClose={() => setShowDesigner(false)}
              onSave={(design) => {
                console.log('Template guardado:', design);
                alert('Template guardado correctamente');
              }}
              onGenerate={(design, format) => {
                console.log('Generando documento:', { design, format });
                alert(`Generando documento en formato ${format}`);
              }}
            />
          </div>
        )}

        {/* Footer */}
        {!showDesigner && (
          <div className="text-center text-gray-500 mt-8">
            <p>Sistema de Gestión Scout - Universidad del Escultismo</p>
            <p className="text-sm">Grupo Scout Lima 12 | 2024</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualDocumentDesignerDemo;