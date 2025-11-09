// ================================================================
// 📄 Template: DNGI-03 Formato de Registro Institucional 
// ================================================================

import { DocumentTemplate, DocumentType, SectionType, FieldType, DocumentCategory } from '../../domain/entities/DocumentTemplate';

export const DNGI03_INSTITUTIONAL_REGISTRATION_TEMPLATE: DocumentTemplate = {
  id: 'dngi-03-registro-institucional',
  name: 'DNGI-03 - Formato de Registro Institucional para Miembros Juveniles',
  type: DocumentType.INSTITUTIONAL_REGISTRATION,
  version: '2.1',
  header: {
    logo: {
      url: '/assets/images/scouts-peru-logo.png',
      alt: 'Scouts del Perú',
      width: 120,
      height: 120,
      position: 'left'
    },
    title: 'DNGI-03 - FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES',
    organizationInfo: {
      name: 'Scouts del Perú',
      subtitle: 'Sirviendo con Futuro'
    },
    documentInfo: {
      code: 'DNGI-03',
      date: new Date(),
      version: '2.1',
      pages: 'Página 1 de 4'
    },
    isFixed: true
  },
  sections: [
    {
      id: 'datos-padres-familia',
      title: 'Datos de los Padres de Familia (Tutores o Apoderados)',
      order: 1,
      type: SectionType.FAMILY_INFO,
      layout: {
        columns: 1,
        spacing: 'compact',
        alignment: 'left'
      },
      isRequired: true,
      isRepeatable: true,
      fields: [
        {
          id: 'padre-apellidos',
          name: 'padreApellidos',
          label: 'APELLIDOS COMPLETOS',
          type: FieldType.TEXT,
          dataSource: 'family.padre.apellidos',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 0, y: 0, width: 50 }
        },
        {
          id: 'padre-nombres',
          name: 'padreNombres', 
          label: 'NOMBRES COMPLETOS',
          type: FieldType.TEXT,
          dataSource: 'family.padre.nombres',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 50, y: 0, width: 50 }
        },
        {
          id: 'padre-sexo',
          name: 'padreSexo',
          label: 'SEXO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.sexo',
          validation: { required: true },
          position: { x: 0, y: 1, width: 25 }
        },
        {
          id: 'padre-tipo-documento',
          name: 'padreTipoDocumento',
          label: 'TIPO DE DOCUMENTO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.tipoDocumento',
          validation: { required: true },
          position: { x: 25, y: 1, width: 25 }
        },
        {
          id: 'padre-numero-documento',
          name: 'padreNumeroDocumento',
          label: 'NÚMERO DE DOCUMENTO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.numeroDocumento',
          validation: { required: true },
          position: { x: 50, y: 1, width: 25 }
        },
        {
          id: 'padre-parentesco',
          name: 'padreParentesco',
          label: 'PARENTESCO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.parentesco',
          validation: { required: true },
          position: { x: 75, y: 1, width: 25 }
        },
        {
          id: 'padre-correo1',
          name: 'padreCorreo1',
          label: 'CORREO ELECTRÓNICO 1',
          type: FieldType.EMAIL,
          dataSource: 'family.padre.correo1',
          validation: { required: false },
          position: { x: 0, y: 2, width: 50 }
        },
        {
          id: 'padre-correo2',
          name: 'padreCorreo2',
          label: 'CORREO ELECTRÓNICO 2',
          type: FieldType.EMAIL,
          dataSource: 'family.padre.correo2',
          validation: { required: false },
          position: { x: 50, y: 2, width: 50 }
        },
        {
          id: 'padre-direccion',
          name: 'padreDireccion',
          label: 'DIRECCIÓN',
          type: FieldType.TEXTAREA,
          dataSource: 'family.padre.direccion',
          validation: { required: false },
          position: { x: 0, y: 3, width: 100 }
        },
        {
          id: 'padre-departamento',
          name: 'padreDepartamento',
          label: 'DEPARTAMENTO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.departamento',
          validation: { required: false },
          position: { x: 0, y: 4, width: 33 }
        },
        {
          id: 'padre-provincia',
          name: 'padreProvincia',
          label: 'PROVINCIA',
          type: FieldType.TEXT,
          dataSource: 'family.padre.provincia',
          validation: { required: false },
          position: { x: 33, y: 4, width: 33 }
        },
        {
          id: 'padre-distrito',
          name: 'padreDistrito',
          label: 'DISTRITO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.distrito',
          validation: { required: false },
          position: { x: 66, y: 4, width: 34 }
        },
        {
          id: 'padre-profesion',
          name: 'padreProfesion',
          label: 'PROFESIÓN U OCUPACIÓN',
          type: FieldType.TEXT,
          dataSource: 'family.padre.profesion',
          validation: { required: false },
          position: { x: 0, y: 5, width: 33 }
        },
        {
          id: 'padre-centro-laboral',
          name: 'padreCentroLaboral',
          label: 'CENTRO LABORAL',
          type: FieldType.TEXT,
          dataSource: 'family.padre.centroLaboral',
          validation: { required: false },
          position: { x: 33, y: 5, width: 33 }
        },
        {
          id: 'padre-cargo',
          name: 'padreCargo',
          label: 'CARGO',
          type: FieldType.TEXT,
          dataSource: 'family.padre.cargo',
          validation: { required: false },
          position: { x: 66, y: 5, width: 34 }
        },
        {
          id: 'padre-celular1',
          name: 'padreCelular1',
          label: 'CELULAR 1',
          type: FieldType.PHONE,
          dataSource: 'family.padre.celular1',
          validation: { required: false },
          position: { x: 0, y: 6, width: 33 }
        },
        {
          id: 'padre-celular2',
          name: 'padreCelular2',
          label: 'CELULAR 2',
          type: FieldType.PHONE,
          dataSource: 'family.padre.celular2',
          validation: { required: false },
          position: { x: 33, y: 6, width: 33 }
        },
        {
          id: 'padre-telefono-domicilio',
          name: 'padreTelefonoDomicilio',
          label: 'TELÉFONO DEL DOMICILIO',
          type: FieldType.PHONE,
          dataSource: 'family.padre.telefonoDomicilio',
          validation: { required: false },
          position: { x: 66, y: 6, width: 34 }
        }
      ]
    },
    {
      id: 'datos-miembro-juvenil',
      title: 'Datos del Miembro Juvenil (menor de edad)',
      order: 2,
      type: SectionType.PERSONAL_INFO,
      layout: {
        columns: 1,
        spacing: 'compact',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'scout-apellidos',
          name: 'scoutApellidos',
          label: 'APELLIDOS COMPLETOS',
          type: FieldType.TEXT,
          dataSource: 'scout.apellidos',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 0, y: 0, width: 50 }
        },
        {
          id: 'scout-nombres',
          name: 'scoutNombres',
          label: 'NOMBRES COMPLETOS',
          type: FieldType.TEXT,
          dataSource: 'scout.nombres',
          format: { textTransform: 'uppercase' },
          validation: { required: true },
          position: { x: 50, y: 0, width: 50 }
        },
        {
          id: 'scout-sexo',
          name: 'scoutSexo',
          label: 'SEXO',
          type: FieldType.TEXT,
          dataSource: 'scout.sexo',
          validation: { required: true },
          position: { x: 0, y: 1, width: 25 }
        },
        {
          id: 'scout-fecha-nacimiento',
          name: 'scoutFechaNacimiento',
          label: 'FECHA DE NACIMIENTO',
          type: FieldType.DATE,
          dataSource: 'scout.fechaNacimiento',
          format: { dateFormat: 'dd/MM/yyyy' },
          validation: { required: true },
          position: { x: 25, y: 1, width: 25 }
        },
        {
          id: 'scout-tipo-documento',
          name: 'scoutTipoDocumento',
          label: 'TIPO DE DOCUMENTO',
          type: FieldType.TEXT,
          dataSource: 'scout.tipoDocumento',
          validation: { required: true },
          position: { x: 50, y: 1, width: 25 }
        },
        {
          id: 'scout-numero-documento',
          name: 'scoutNumeroDocumento',
          label: 'NÚMERO DE DOCUMENTO',
          type: FieldType.TEXT,
          dataSource: 'scout.numeroDocumento',
          validation: { required: true },
          position: { x: 75, y: 1, width: 25 }
        },
        {
          id: 'scout-region',
          name: 'scoutRegion',
          label: 'REGIÓN',
          type: FieldType.TEXT,
          dataSource: 'scout.region',
          defaultValue: 'XVIII',
          validation: { required: true },
          position: { x: 0, y: 2, width: 25 }
        },
        {
          id: 'scout-localidad',
          name: 'scoutLocalidad',
          label: 'LOCALIDAD',
          type: FieldType.TEXT,
          dataSource: 'scout.localidad',
          defaultValue: 'LIMA',
          validation: { required: true },
          position: { x: 25, y: 2, width: 25 }
        },
        {
          id: 'scout-numeral',
          name: 'scoutNumeral',
          label: 'NUMERAL',
          type: FieldType.TEXT,
          dataSource: 'scout.numeral',
          defaultValue: '12',
          validation: { required: true },
          position: { x: 50, y: 2, width: 25 }
        },
        {
          id: 'scout-unidad',
          name: 'scoutUnidad',
          label: 'UNIDAD',
          type: FieldType.TEXT,
          dataSource: 'scout.unidad',
          defaultValue: 'TROPA',
          validation: { required: true },
          position: { x: 75, y: 2, width: 25 }
        },
        {
          id: 'scout-direccion',
          name: 'scoutDireccion',
          label: 'DIRECCIÓN',
          type: FieldType.TEXTAREA,
          dataSource: 'scout.direccion',
          validation: { required: false },
          position: { x: 0, y: 3, width: 75 }
        },
        {
          id: 'scout-codigo-postal',
          name: 'scoutCodigoPostal',
          label: 'CÓDIGO POSTAL',
          type: FieldType.TEXT,
          dataSource: 'scout.codigoPostal',
          validation: { required: false },
          position: { x: 75, y: 3, width: 25 }
        },
        {
          id: 'scout-departamento',
          name: 'scoutDepartamento',
          label: 'DEPARTAMENTO',
          type: FieldType.TEXT,
          dataSource: 'scout.departamento',
          validation: { required: false },
          position: { x: 0, y: 4, width: 33 }
        },
        {
          id: 'scout-provincia',
          name: 'scoutProvincia',
          label: 'PROVINCIA',
          type: FieldType.TEXT,
          dataSource: 'scout.provincia',
          validation: { required: false },
          position: { x: 33, y: 4, width: 33 }
        },
        {
          id: 'scout-distrito',
          name: 'scoutDistrito',
          label: 'DISTRITO',
          type: FieldType.TEXT,
          dataSource: 'scout.distrito',
          validation: { required: false },
          position: { x: 66, y: 4, width: 34 }
        },
        {
          id: 'scout-correo-institucional',
          name: 'scoutCorreoInstitucional',
          label: 'CORREO ELECTRÓNICO INSTITUCIONAL',
          type: FieldType.EMAIL,
          dataSource: 'scout.correoInstitucional',
          validation: { required: false },
          position: { x: 0, y: 5, width: 50 }
        },
        {
          id: 'scout-correo-personal',
          name: 'scoutCorreoPersonal',
          label: 'CORREO ELECTRÓNICO PERSONAL',
          type: FieldType.EMAIL,
          dataSource: 'scout.correoPersonal',
          validation: { required: false },
          position: { x: 50, y: 5, width: 50 }
        },
        {
          id: 'scout-celular',
          name: 'scoutCelular',
          label: 'CELULAR',
          type: FieldType.PHONE,
          dataSource: 'scout.celular',
          validation: { required: false },
          position: { x: 0, y: 6, width: 33 }
        },
        {
          id: 'scout-telefono-domicilio',
          name: 'scoutTelefonoDomicilio',
          label: 'TELÉFONO DEL DOMICILIO',
          type: FieldType.PHONE,
          dataSource: 'scout.telefonoDomicilio',
          validation: { required: false },
          position: { x: 33, y: 6, width: 33 }
        },
        {
          id: 'scout-religion',
          name: 'scoutReligion',
          label: 'RELIGIÓN O CREDO',
          type: FieldType.TEXT,
          dataSource: 'scout.religion',
          validation: { required: false },
          position: { x: 66, y: 6, width: 34 }
        },
        {
          id: 'scout-centro-estudios',
          name: 'scoutCentroEstudios',
          label: 'CENTRO DE ESTUDIOS',
          type: FieldType.TEXT,
          dataSource: 'scout.centroEstudios',
          validation: { required: false },
          position: { x: 0, y: 7, width: 50 }
        },
        {
          id: 'scout-ano-estudios',
          name: 'scoutAnoEstudios',
          label: 'AÑO DE ESTUDIOS',
          type: FieldType.TEXT,
          dataSource: 'scout.anoEstudios',
          validation: { required: false },
          position: { x: 50, y: 7, width: 50 }
        }
      ]
    },
    {
      id: 'informacion-medica',
      title: 'Información Médica',
      order: 3,
      type: SectionType.MEDICAL_INFO,
      layout: {
        columns: 1,
        spacing: 'compact',
        alignment: 'left'
      },
      isRequired: false,
      fields: [
        {
          id: 'grupo-sanguineo',
          name: 'grupoSanguineo',
          label: 'GRUPO SANGUÍNEO',
          type: FieldType.TEXT,
          dataSource: 'scout.medico.grupoSanguineo',
          validation: { required: false },
          position: { x: 0, y: 0, width: 20 }
        },
        {
          id: 'factor-sanguineo',
          name: 'factorSanguineo',
          label: 'FACTOR SANGUÍNEO',
          type: FieldType.TEXT,
          dataSource: 'scout.medico.factorSanguineo',
          validation: { required: false },
          position: { x: 20, y: 0, width: 20 }
        },
        {
          id: 'seguro-medico',
          name: 'seguroMedico',
          label: 'SEGURO MÉDICO',
          type: FieldType.TEXT,
          dataSource: 'scout.medico.seguroMedico',
          validation: { required: false },
          position: { x: 40, y: 0, width: 20 }
        },
        {
          id: 'tipo-discapacidad',
          name: 'tipoDiscapacidad',
          label: 'TIPO DE DISCAPACIDAD',
          type: FieldType.TEXT,
          dataSource: 'scout.medico.tipoDiscapacidad',
          validation: { required: false },
          position: { x: 60, y: 0, width: 20 }
        },
        {
          id: 'carne-conadis',
          name: 'carneConadis',
          label: 'CARNÉ CONADIS',
          type: FieldType.TEXT,
          dataSource: 'scout.medico.carneConadis',
          validation: { required: false },
          position: { x: 80, y: 0, width: 20 }
        },
        {
          id: 'discapacidad-detalle',
          name: 'discapacidadDetalle',
          label: 'SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO',
          type: FieldType.TEXTAREA,
          dataSource: 'scout.medico.discapacidadDetalle',
          validation: { required: false },
          position: { x: 0, y: 1, width: 100, height: 100 }
        }
      ]
    },
    {
      id: 'declaracion-compromiso',
      title: 'Declaración y Compromiso',
      order: 4,
      type: SectionType.LEGAL_DECLARATION,
      layout: {
        columns: 1,
        spacing: 'normal',
        alignment: 'left'
      },
      isRequired: true,
      fields: [
        {
          id: 'texto-declaracion',
          name: 'textoDeclaracion',
          label: '',
          type: FieldType.STATIC_TEXT,
          dataSource: '',
          defaultValue: 'Yo, _________________ como adulto apoderado (padre, madre o tutor) y que suscribe y declara el presente documento, identificado con DNI N° _______, comprendo que el movimiento Scout contribuye a la educación',
          validation: { required: false },
          position: { x: 0, y: 0, width: 100 }
        },
        {
          id: 'nombre-apoderado-firma',
          name: 'nombreApoderadoFirma',
          label: 'Nombre del Apoderado (para firma)',
          type: FieldType.TEXT,
          dataSource: 'family.apoderado.nombreCompleto',
          validation: { required: true },
          position: { x: 0, y: 1, width: 50 }
        },
        {
          id: 'dni-apoderado-firma',
          name: 'dniApoderadoFirma',
          label: 'DNI del Apoderado',
          type: FieldType.TEXT,
          dataSource: 'family.apoderado.numeroDocumento',
          validation: { required: true },
          position: { x: 50, y: 1, width: 50 }
        }
      ]
    },
    {
      id: 'firmas-huellas',
      title: 'Firmas y Huellas Dactilares',
      order: 5,
      type: SectionType.SIGNATURES,
      layout: {
        columns: 2,
        spacing: 'wide',
        alignment: 'center'
      },
      isRequired: true,
      fields: [
        {
          id: 'firma-apoderado',
          name: 'firmaApoderado',
          label: 'FIRMA (igual que en su documento de identidad)',
          type: FieldType.SIGNATURE,
          dataSource: 'family.apoderado.firma',
          validation: { required: true },
          position: { x: 0, y: 0, width: 50, height: 100 }
        },
        {
          id: 'huella-digital',
          name: 'huellaDigital',
          label: 'Huella Digital',
          type: FieldType.FINGERPRINT,
          dataSource: 'family.apoderado.huellaDigital',
          validation: { required: true },
          position: { x: 50, y: 0, width: 50, height: 100 }
        }
      ]
    }
  ],
  footer: {
    text: '* Publicado en la página web de la Asociación de Scouts del Perú.',
    includeDate: false,
    includePageNumbers: true,
    pageNumberFormat: 'Página {current} de {total}',
    signatures: []
  },
  metadata: {
    category: DocumentCategory.INSTITUTIONAL_FORM,
    tags: ['dngi-03', 'registro', 'institucional', 'miembros-juveniles', 'formulario', 'scouts-peru'],
    language: 'es-PE',
    formatVersion: '2.1',
    documentCode: 'DNGI-03',
    isActive: true,
    permissions: {
      canEdit: ['dirigente', 'admin', 'secretario'],
      canView: ['dirigente', 'admin', 'secretario', 'padre'],
      canGenerate: ['dirigente', 'admin', 'secretario'],
      isPublic: false
    },
    institutionalStandard: true,
    requiresDigitalSignature: true,
    requiresFingerprint: true
  },
  createdAt: new Date('2025-11-01'),
  updatedAt: new Date('2025-11-01')
};