// ================================================================
// 📄 Template: Anexo-3 Formato de Datos Personales
// ================================================================

import { DocumentTemplate, DocumentType, SectionType, FieldType, DocumentCategory } from '../../domain/entities/DocumentTemplate';

export const ANEXO3_PERSONAL_DATA_TEMPLATE: DocumentTemplate = {
  id: 'anexo-3-datos-personales',
  name: 'Anexo-3 Formato de Datos Personales',
  type: DocumentType.PERSONAL_DATA_FORMAT,
  version: '1.0',
  header: {
    logo: {
      url: '/assets/images/scout-logo.png',
      alt: 'Logo Scout Lima 12',
      width: 80,
      height: 80,
      position: 'left'
    },
    title: 'FORMATO DE DATOS PERSONALES',
    subtitle: 'ANEXO 3',
    organizationInfo: {
      name: 'GRUPO SCOUT LIMA 12',
      address: 'Lima, Perú',
      phone: '+51 999 999 999',
      email: 'contacto@scoutlima12.org.pe',
      website: 'www.scoutlima12.org.pe'
    },
    isFixed: true
  },
  sections: [
    {
      id: 'datos-personales',
      title: 'I. DATOS PERSONALES',
      order: 1,
      type: SectionType.PERSONAL_INFO,
      layout: {
        columns: 2,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'nombres',
          name: 'nombres',
          label: 'Nombres',
          type: FieldType.TEXT,
          dataSource: 'scout.nombres',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 0, y: 0, width: 50 }
        },
        {
          id: 'apellidos',
          name: 'apellidos',
          label: 'Apellidos',
          type: FieldType.TEXT,
          dataSource: 'scout.apellidos',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 50, y: 0, width: 50 }
        },
        {
          id: 'fecha-nacimiento',
          name: 'fechaNacimiento',
          label: 'Fecha de Nacimiento',
          type: FieldType.DATE,
          dataSource: 'scout.fechaNacimiento',
          format: { dateFormat: 'dd/MM/yyyy' },
          validation: { required: true },
          position: { x: 0, y: 1, width: 33 }
        },
        {
          id: 'edad',
          name: 'edad',
          label: 'Edad',
          type: FieldType.NUMBER,
          dataSource: 'scout.edad',
          validation: { required: true },
          position: { x: 33, y: 1, width: 17 }
        },
        {
          id: 'sexo',
          name: 'sexo',
          label: 'Sexo',
          type: FieldType.TEXT,
          dataSource: 'scout.sexo',
          validation: { required: true },
          position: { x: 50, y: 1, width: 50 }
        },
        {
          id: 'tipo-documento',
          name: 'tipoDocumento',
          label: 'Tipo de Documento',
          type: FieldType.TEXT,
          dataSource: 'scout.tipoDocumento',
          validation: { required: true },
          position: { x: 0, y: 2, width: 33 }
        },
        {
          id: 'numero-documento',
          name: 'numeroDocumento',
          label: 'Número de Documento',
          type: FieldType.TEXT,
          dataSource: 'scout.numeroDocumento',
          validation: { required: true },
          position: { x: 33, y: 2, width: 67 }
        },
        {
          id: 'celular',
          name: 'celular',
          label: 'Teléfono/Celular',
          type: FieldType.PHONE,
          dataSource: 'scout.celular',
          validation: { required: false },
          position: { x: 0, y: 3, width: 50 }
        },
        {
          id: 'correo',
          name: 'correo',
          label: 'Correo Electrónico',
          type: FieldType.EMAIL,
          dataSource: 'scout.correo',
          validation: { required: false },
          position: { x: 50, y: 3, width: 50 }
        }
      ]
    },
    {
      id: 'direccion-residencia',
      title: 'II. DIRECCIÓN DE RESIDENCIA',
      order: 2,
      type: SectionType.CONTACT_INFO,
      layout: {
        columns: 2,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'departamento',
          name: 'departamento',
          label: 'Departamento',
          type: FieldType.TEXT,
          dataSource: 'scout.departamento',
          validation: { required: false },
          position: { x: 0, y: 0, width: 33 }
        },
        {
          id: 'provincia',
          name: 'provincia',
          label: 'Provincia',
          type: FieldType.TEXT,
          dataSource: 'scout.provincia',
          validation: { required: false },
          position: { x: 33, y: 0, width: 33 }
        },
        {
          id: 'distrito',
          name: 'distrito',
          label: 'Distrito',
          type: FieldType.TEXT,
          dataSource: 'scout.distrito',
          validation: { required: false },
          position: { x: 66, y: 0, width: 34 }
        },
        {
          id: 'direccion',
          name: 'direccion',
          label: 'Dirección Completa',
          type: FieldType.TEXTAREA,
          dataSource: 'scout.direccion',
          validation: { required: false },
          position: { x: 0, y: 1, width: 100 }
        }
      ]
    },
    {
      id: 'informacion-educativa',
      title: 'III. INFORMACIÓN EDUCATIVA/LABORAL',
      order: 3,
      type: SectionType.EDUCATION_INFO,
      layout: {
        columns: 1,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: false,
      fields: [
        {
          id: 'centro-estudio',
          name: 'centroEstudio',
          label: 'Centro de Estudios',
          type: FieldType.TEXT,
          dataSource: 'scout.centroEstudio',
          validation: { required: false },
          position: { x: 0, y: 0, width: 100 }
        },
        {
          id: 'ocupacion',
          name: 'ocupacion',
          label: 'Ocupación',
          type: FieldType.TEXT,
          dataSource: 'scout.ocupacion',
          validation: { required: false },
          position: { x: 0, y: 1, width: 50 }
        },
        {
          id: 'centro-laboral',
          name: 'centroLaboral',
          label: 'Centro Laboral',
          type: FieldType.TEXT,
          dataSource: 'scout.centroLaboral',
          validation: { required: false },
          position: { x: 50, y: 1, width: 50 }
        }
      ]
    },
    {
      id: 'informacion-scout',
      title: 'IV. INFORMACIÓN SCOUT',
      order: 4,
      type: SectionType.SCOUT_HISTORY,
      layout: {
        columns: 2,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'codigo-scout',
          name: 'codigoScout',
          label: 'Código Scout',
          type: FieldType.TEXT,
          dataSource: 'scout.codigoScout',
          validation: { required: true },
          position: { x: 0, y: 0, width: 33 }
        },
        {
          id: 'rama-actual',
          name: 'ramaActual',
          label: 'Rama Actual',
          type: FieldType.TEXT,
          dataSource: 'scout.ramaActual',
          validation: { required: true },
          position: { x: 33, y: 0, width: 33 }
        },
        {
          id: 'estado',
          name: 'estado',
          label: 'Estado',
          type: FieldType.TEXT,
          dataSource: 'scout.estado',
          validation: { required: true },
          position: { x: 66, y: 0, width: 34 }
        },
        {
          id: 'fecha-ingreso',
          name: 'fechaIngreso',
          label: 'Fecha de Ingreso',
          type: FieldType.DATE,
          dataSource: 'scout.fechaIngreso',
          format: { dateFormat: 'dd/MM/yyyy' },
          validation: { required: true },
          position: { x: 0, y: 1, width: 50 }
        },
        {
          id: 'tiempo-movimiento',
          name: 'tiempoMovimiento',
          label: 'Tiempo en el Movimiento',
          type: FieldType.TEXT,
          dataSource: 'scout.tiempoEnMovimiento',
          validation: { required: false },
          position: { x: 50, y: 1, width: 50 }
        },
        {
          id: 'patrulla',
          name: 'patrulla',
          label: 'Patrulla',
          type: FieldType.TEXT,
          dataSource: 'scout.patrulla.nombre',
          validation: { required: false },
          position: { x: 0, y: 2, width: 50 }
        },
        {
          id: 'cargo-patrulla',
          name: 'cargoPatrulla',
          label: 'Cargo en Patrulla',
          type: FieldType.TEXT,
          dataSource: 'scout.patrulla.cargo',
          validation: { required: false },
          position: { x: 50, y: 2, width: 50 }
        }
      ]
    },
    {
      id: 'contacto-emergencia',
      title: 'V. CONTACTO DE EMERGENCIA',
      order: 5,
      type: SectionType.EMERGENCY_CONTACT,
      layout: {
        columns: 2,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'contacto-nombre',
          name: 'contactoNombre',
          label: 'Nombre Completo',
          type: FieldType.TEXT,
          dataSource: 'scout.contactoEmergencia.nombre',
          validation: { required: true },
          position: { x: 0, y: 0, width: 60 }
        },
        {
          id: 'contacto-parentesco',
          name: 'contactoParentesco',
          label: 'Parentesco',
          type: FieldType.TEXT,
          dataSource: 'scout.contactoEmergencia.parentesco',
          validation: { required: true },
          position: { x: 60, y: 0, width: 40 }
        },
        {
          id: 'contacto-celular',
          name: 'contactoCelular',
          label: 'Teléfono/Celular',
          type: FieldType.PHONE,
          dataSource: 'scout.contactoEmergencia.celular',
          validation: { required: true },
          position: { x: 0, y: 1, width: 50 }
        },
        {
          id: 'contacto-celular-alt',
          name: 'contactoCelularAlt',
          label: 'Teléfono Alternativo',
          type: FieldType.PHONE,
          dataSource: 'scout.contactoEmergencia.celularAlternativo',
          validation: { required: false },
          position: { x: 50, y: 1, width: 50 }
        },
        {
          id: 'contacto-direccion',
          name: 'contactoDireccion',
          label: 'Dirección',
          type: FieldType.TEXTAREA,
          dataSource: 'scout.contactoEmergencia.direccion',
          validation: { required: false },
          position: { x: 0, y: 2, width: 100 }
        }
      ]
    },
    {
      id: 'observaciones',
      title: 'VI. OBSERVACIONES',
      order: 6,
      type: SectionType.CUSTOM,
      layout: {
        columns: 1,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: false,
      fields: [
        {
          id: 'observaciones-generales',
          name: 'observaciones',
          label: 'Observaciones Generales',
          type: FieldType.TEXTAREA,
          dataSource: 'scout.observaciones',
          validation: { required: false },
          position: { x: 0, y: 0, width: 100, height: 100 }
        }
      ]
    }
  ],
  footer: {
    text: 'Este documento contiene información personal confidencial del scout registrado.',
    includeDate: true,
    includePageNumbers: true,
    signatures: [
      {
        label: 'Firma del Scout/Padre/Tutor',
        type: 'text',
        position: { x: 20, y: 80, width: 30 }
      },
      {
        label: 'Firma del Dirigente Responsable',
        type: 'text',
        position: { x: 70, y: 80, width: 30 }
      }
    ]
  },
  metadata: {
    category: DocumentCategory.FORM,
    tags: ['registro', 'datos-personales', 'scout', 'anexo-3'],
    language: 'es-PE',
    formatVersion: '1.0',
    isActive: true,
    permissions: {
      canEdit: ['dirigente', 'admin'],
      canView: ['dirigente', 'admin', 'padre'],
      canGenerate: ['dirigente', 'admin'],
      isPublic: false
    }
  },
  createdAt: new Date('2025-11-01'),
  updatedAt: new Date('2025-11-01')
};