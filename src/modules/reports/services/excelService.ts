/**
 * Excel Service - Generación de reportes Excel profesionales
 * 
 * @fileoverview
 * Servicio para generar archivos Excel (.xlsx) con múltiples hojas
 * organizadas según los 7 pasos del registro de scouts.
 * 
 * Estructura de hojas (8 en total):
 * 1. Resumen - KPIs y estadísticas
 * 2. Datos Personales - Información básica (Step 1)
 * 3. Contacto - Teléfonos y dirección (Step 2)
 * 4. Familiar - Padre/Madre/Tutor (Step 3)
 * 5. Educación - Estudios y trabajo (Step 4)
 * 6. Religión - Información religiosa (Step 5)
 * 7. Salud - Datos médicos (Step 6)
 * 8. Scout - Rama y código (Step 7)
 * 
 * Principios aplicados:
 * - SOLID: Single Responsibility (cada función una tarea)
 * - DRY: Estilos y helpers reutilizables
 * - Clean Code: Funciones claras y documentadas
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ============================================
// Types
// ============================================

export interface ScoutExcelData {
  // Identificación
  id: string;
  codigo_scout: string;
  estado: string;
  
  // Datos Personales (Step 1)
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  tipo_documento: string;
  numero_documento: string;
  
  // Contacto Scout (Step 2)
  celular: string;
  celular_secundario?: string;
  telefono?: string;
  correo?: string;
  correo_secundario?: string;
  correo_institucional?: string;
  
  // Ubicación (Step 2)
  direccion?: string;
  direccion_completa?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  codigo_postal?: string;
  ubicacion_latitud?: number | null;
  ubicacion_longitud?: number | null;
  
  // Educación (Step 4)
  centro_estudio?: string;
  anio_estudios?: string;
  ocupacion?: string;
  centro_laboral?: string;
  
  // Religión (Step 5)
  religion?: string;
  
  // Salud (Step 6)
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carnet_conadis?: string;
  descripcion_discapacidad?: string;
  
  // Scout/Academia (Step 7)
  rama_actual?: string;
  patrulla?: string;
  cargo_patrulla?: string;
  fecha_ingreso?: string;
  codigo_asociado?: string;
  
  // Familiares (array dinámico) (Step 3)
  familiares?: FamiliarExcelData[];
}

export interface FamiliarExcelData {
  id?: string;
  nombres: string;
  apellidos: string;
  parentesco: string;
  celular?: string;
  celular_secundario?: string;
  telefono?: string;
  correo?: string;
  correo_secundario?: string;
  profesion?: string;
  centro_laboral?: string;
  cargo?: string;
  es_contacto_emergencia?: boolean;
  es_autorizado_recoger?: boolean;
  es_apoderado?: boolean;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface ExcelGenerationResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

// ============================================
// Color Scheme (UX - Visual Hierarchy by Step)
// ============================================

const COLORS = {
  header: {
    resumen: 'FF4CAF50',     // Verde - Resumen
    personal: 'FF2196F3',    // Azul - Datos Personales (Step 1)
    contacto: 'FF9C27B0',    // Púrpura - Contacto (Step 2)
    familiar: 'FF00BCD4',    // Cyan - Familiar (Step 3)
    educacion: 'FFFF9800',   // Naranja - Educación (Step 4)
    religion: 'FF795548',    // Marrón - Religión (Step 5)
    salud: 'FFF44336',       // Rojo - Salud (Step 6)
    scout: 'FF3F51B5',       // Indigo - Scout (Step 7)
  },
  headerText: 'FFFFFFFF',   // Blanco para texto sobre colores oscuros
  border: 'FFE0E0E0',
  alternateRow: 'FFFAFAFA',
};

// ============================================
// Style Helpers (DRY Principle)
// ============================================

/**
 * Aplica estilo de encabezado a una celda
 */
function applyHeaderStyle(cell: ExcelJS.Cell, bgColor: string): void {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: bgColor },
  };
  cell.font = {
    bold: true,
    size: 11,
    color: { argb: COLORS.headerText },
  };
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };
}

/**
 * Aplica estilo de celda de datos
 */
function applyDataStyle(cell: ExcelJS.Cell, isAlternate: boolean = false): void {
  if (isAlternate) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.alternateRow },
    };
  }
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
  };
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };
}

/**
 * Formatea fecha para Excel (evita problemas de zona horaria)
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    // Parsear la fecha como local, no UTC
    // "2012-04-01" -> partes [2012, 04, 01]
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[2].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[0];
      return `${day}/${month}/${year}`;
    }
    // Fallback: si el formato es diferente
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Calcula la edad a partir de fecha de nacimiento
 */
function calculateAge(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ============================================
// Excel Generation Functions
// ============================================

/**
 * Genera archivo Excel completo con todos los scouts
 * Organizado en 8 hojas según los steps del registro
 */
export async function generateScoutsExcel(
  scouts: ScoutExcelData[],
  options?: {
    includeResumen?: boolean;
    includeDatosPersonales?: boolean;
    includeContacto?: boolean;
    includeFamiliar?: boolean;
    includeEducacion?: boolean;
    includeReligion?: boolean;
    includeSalud?: boolean;
    includeScout?: boolean;
  }
): Promise<ExcelGenerationResult> {
  const {
    includeResumen = true,
    includeDatosPersonales = true,
    includeContacto = true,
    includeFamiliar = true,
    includeEducacion = true,
    includeReligion = true,
    includeSalud = true,
    includeScout = true,
  } = options || {};

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Grupo Scout Lima 12';
    workbook.created = new Date();
    
    // Hoja 1: Resumen (KPIs)
    if (includeResumen) {
      createResumenSheet(workbook, scouts);
    }
    
    // Hoja 2: Datos Personales (Step 1)
    if (includeDatosPersonales) {
      createDatosPersonalesSheet(workbook, scouts);
    }
    
    // Hoja 3: Contacto (Step 2)
    if (includeContacto) {
      createContactoSheet(workbook, scouts);
    }
    
    // Hoja 4: Familiar (Step 3)
    if (includeFamiliar) {
      createFamiliarSheet(workbook, scouts);
    }
    
    // Hoja 5: Educación (Step 4)
    if (includeEducacion) {
      createEducacionSheet(workbook, scouts);
    }
    
    // Hoja 6: Religión (Step 5)
    if (includeReligion) {
      createReligionSheet(workbook, scouts);
    }
    
    // Hoja 7: Salud (Step 6)
    if (includeSalud) {
      createSaludSheet(workbook, scouts);
    }
    
    // Hoja 8: Scout (Step 7)
    if (includeScout) {
      createScoutSheet(workbook, scouts);
    }
    
    // Generar archivo y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const fileName = `Scouts_GrupoLima12_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error generando Excel:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// ============================================
// Sheet Creation Functions (One per Step)
// ============================================

/**
 * Hoja 1: Resumen - KPIs y estadísticas
 */
function createResumenSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('Resumen', {
    properties: { tabColor: { argb: COLORS.header.resumen } },
  });
  
  // Título
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Reporte de Scouts - Grupo Scout Lima 12';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };
  
  // Fecha de generación
  sheet.mergeCells('A2:D2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Generado: ${new Date().toLocaleString('es-PE')}`;
  dateCell.font = { italic: true, size: 10 };
  dateCell.alignment = { horizontal: 'center' };
  
  // Espacio
  sheet.addRow([]);
  
  // KPIs
  const kpis = [
    { label: 'Total Scouts', value: scouts.length },
    { label: 'Scouts Activos', value: scouts.filter(s => s.estado === 'ACTIVO').length },
    { label: 'Scouts Inactivos', value: scouts.filter(s => s.estado !== 'ACTIVO').length },
    { label: '', value: '' },
    { label: 'Por Rama:', value: '' },
    ...Object.entries(
      scouts.reduce((acc, s) => {
        const rama = s.rama_actual || 'Sin Rama';
        acc[rama] = (acc[rama] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([rama, count]) => ({ label: `  - ${rama}`, value: count })),
    { label: '', value: '' },
    { label: 'Por Sexo:', value: '' },
    ...Object.entries(
      scouts.reduce((acc, s) => {
        const sexo = s.sexo || 'No especificado';
        acc[sexo] = (acc[sexo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([sexo, count]) => ({ label: `  - ${sexo}`, value: count })),
    { label: '', value: '' },
    { label: 'Total Familiares Registrados', value: scouts.reduce((acc, s) => acc + (s.familiares?.length || 0), 0) },
    { label: 'Contactos de Emergencia', value: scouts.reduce((acc, s) => 
      acc + (s.familiares?.filter(f => f.es_contacto_emergencia)?.length || 0), 0) },
  ];
  
  kpis.forEach((kpi) => {
    const row = sheet.addRow([kpi.label, kpi.value]);
    if (kpi.label && !kpi.label.startsWith('  ')) {
      row.font = { bold: true };
    }
  });
  
  // Ajustar anchos
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 15;
}

/**
 * Hoja 2: Datos Personales (Step 1) - Información básica
 */
function createDatosPersonalesSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('1. Datos Personales', {
    properties: { tabColor: { argb: COLORS.header.personal } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Estado', key: 'estado', width: 10 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Fecha Nacimiento', key: 'fecha_nacimiento', width: 15 },
    { header: 'Edad', key: 'edad', width: 6 },
    { header: 'Sexo', key: 'sexo', width: 12 },
    { header: 'Tipo Documento', key: 'tipo_documento', width: 15 },
    { header: 'Nro. Documento', key: 'numero_documento', width: 15 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.personal);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      estado: scout.estado,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      fecha_nacimiento: formatDate(scout.fecha_nacimiento),
      edad: scout.edad || calculateAge(scout.fecha_nacimiento),
      sexo: scout.sexo,
      tipo_documento: scout.tipo_documento,
      numero_documento: scout.numero_documento,
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 9 },
  };
}

/**
 * Hoja 3: Contacto (Step 2) - Teléfonos y dirección
 */
function createContactoSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('2. Contacto', {
    properties: { tabColor: { argb: COLORS.header.contacto } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    // Teléfonos
    { header: 'Celular', key: 'celular', width: 12 },
    { header: 'Cel. Secundario', key: 'celular_secundario', width: 12 },
    { header: 'Teléfono Fijo', key: 'telefono', width: 12 },
    // Correos
    { header: 'Email', key: 'correo', width: 28 },
    { header: 'Email Secundario', key: 'correo_secundario', width: 28 },
    { header: 'Email Institucional', key: 'correo_institucional', width: 28 },
    // Dirección
    { header: 'Dirección', key: 'direccion', width: 35 },
    { header: 'Dir. Completa', key: 'direccion_completa', width: 45 },
    { header: 'Departamento', key: 'departamento', width: 15 },
    { header: 'Provincia', key: 'provincia', width: 15 },
    { header: 'Distrito', key: 'distrito', width: 15 },
    { header: 'Cód. Postal', key: 'codigo_postal', width: 10 },
    // Ubicación GPS
    { header: 'Latitud', key: 'ubicacion_latitud', width: 14 },
    { header: 'Longitud', key: 'ubicacion_longitud', width: 14 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.contacto);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      celular: scout.celular,
      celular_secundario: scout.celular_secundario,
      telefono: scout.telefono,
      correo: scout.correo,
      correo_secundario: scout.correo_secundario,
      correo_institucional: scout.correo_institucional,
      direccion: scout.direccion,
      direccion_completa: scout.direccion_completa,
      departamento: scout.departamento,
      provincia: scout.provincia,
      distrito: scout.distrito,
      codigo_postal: scout.codigo_postal,
      ubicacion_latitud: scout.ubicacion_latitud,
      ubicacion_longitud: scout.ubicacion_longitud,
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 17 },
  };
}

/**
 * Hoja 4: Familiar (Step 3) - Padre/Madre/Tutor
 * Formato normalizado: 1 fila por familiar
 */
function createFamiliarSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('3. Familiar', {
    properties: { tabColor: { argb: COLORS.header.familiar } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    // Identificación del Scout
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Scout', key: 'nombre_scout', width: 28 },
    { header: 'Rama', key: 'rama', width: 12 },
    // Nro de familiar (FAM1, FAM2, etc.)
    { header: 'Nº', key: 'num_familiar', width: 5 },
    // Datos del Familiar
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Parentesco', key: 'parentesco', width: 12 },
    // Contacto
    { header: 'Celular', key: 'celular', width: 12 },
    { header: 'Cel. Secundario', key: 'celular_secundario', width: 12 },
    { header: 'Teléfono', key: 'telefono', width: 12 },
    { header: 'Email', key: 'correo', width: 28 },
    { header: 'Email Sec.', key: 'correo_secundario', width: 28 },
    // Datos laborales
    { header: 'Profesión', key: 'profesion', width: 20 },
    { header: 'Centro Laboral', key: 'centro_laboral', width: 22 },
    { header: 'Cargo', key: 'cargo', width: 15 },
    // Permisos
    { header: '¿Emergencia?', key: 'es_contacto_emergencia', width: 12 },
    { header: '¿Autorizado?', key: 'es_autorizado_recoger', width: 12 },
    { header: '¿Apoderado?', key: 'es_apoderado', width: 12 },
    // Dirección familiar
    { header: 'Dirección', key: 'direccion', width: 30 },
    { header: 'Departamento', key: 'departamento', width: 15 },
    { header: 'Provincia', key: 'provincia', width: 15 },
    { header: 'Distrito', key: 'distrito', width: 15 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.familiar);
  });
  
  // Agregar datos (1 fila por familiar)
  let rowIndex = 0;
  scouts.forEach(scout => {
    (scout.familiares || []).forEach((fam, famIndex) => {
      const row = sheet.addRow({
        codigo_scout: scout.codigo_scout,
        nombre_scout: `${scout.nombres} ${scout.apellidos}`,
        rama: scout.rama_actual,
        num_familiar: famIndex + 1,
        nombres: fam.nombres,
        apellidos: fam.apellidos,
        parentesco: fam.parentesco,
        celular: fam.celular,
        celular_secundario: fam.celular_secundario,
        telefono: fam.telefono,
        correo: fam.correo,
        correo_secundario: fam.correo_secundario,
        profesion: fam.profesion,
        centro_laboral: fam.centro_laboral,
        cargo: fam.cargo,
        es_contacto_emergencia: fam.es_contacto_emergencia ? 'Sí' : 'No',
        es_autorizado_recoger: fam.es_autorizado_recoger ? 'Sí' : 'No',
        es_apoderado: fam.es_apoderado ? 'Sí' : 'No',
        direccion: fam.direccion,
        departamento: fam.departamento,
        provincia: fam.provincia,
        distrito: fam.distrito,
      });
      
      row.eachCell((cell) => {
        applyDataStyle(cell, rowIndex % 2 === 1);
      });
      rowIndex++;
    });
  });
  
  // Filtros
  if (rowIndex > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rowIndex + 1, column: 22 },
    };
  }
}

/**
 * Hoja 5: Educación (Step 4) - Estudios y trabajo
 */
function createEducacionSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('4. Educación', {
    properties: { tabColor: { argb: COLORS.header.educacion } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Rama', key: 'rama_actual', width: 12 },
    // Educación
    { header: 'Centro de Estudio', key: 'centro_estudio', width: 35 },
    { header: 'Año de Estudios', key: 'anio_estudios', width: 15 },
    // Trabajo
    { header: 'Ocupación', key: 'ocupacion', width: 20 },
    { header: 'Centro Laboral', key: 'centro_laboral', width: 30 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.educacion);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      rama_actual: scout.rama_actual,
      centro_estudio: scout.centro_estudio,
      anio_estudios: scout.anio_estudios,
      ocupacion: scout.ocupacion,
      centro_laboral: scout.centro_laboral,
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 8 },
  };
}

/**
 * Hoja 6: Religión (Step 5) - Información religiosa
 */
function createReligionSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('5. Religión', {
    properties: { tabColor: { argb: COLORS.header.religion } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Rama', key: 'rama_actual', width: 12 },
    { header: 'Religión', key: 'religion', width: 25 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.religion);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      rama_actual: scout.rama_actual,
      religion: scout.religion || 'No especificada',
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 5 },
  };
  
  // Resumen de religiones al final
  const religionCounts = scouts.reduce((acc, s) => {
    const religion = s.religion || 'No especificada';
    acc[religion] = (acc[religion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  sheet.addRow([]);
  sheet.addRow([]);
  
  const summaryRow = sheet.addRow(['Resumen de Religiones']);
  summaryRow.font = { bold: true, size: 12 };
  
  Object.entries(religionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([religion, count]) => {
      sheet.addRow([religion, '', '', '', count]);
    });
}

/**
 * Hoja 7: Salud (Step 6) - Datos médicos
 */
function createSaludSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('6. Salud', {
    properties: { tabColor: { argb: COLORS.header.salud } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Edad', key: 'edad', width: 6 },
    { header: 'Rama', key: 'rama_actual', width: 12 },
    // Sangre
    { header: 'Grupo Sanguíneo', key: 'grupo_sanguineo', width: 15 },
    { header: 'Factor RH', key: 'factor_sanguineo', width: 10 },
    { header: 'Tipo Sangre', key: 'tipo_sangre_completo', width: 12 },
    // Seguro
    { header: 'Seguro Médico', key: 'seguro_medico', width: 20 },
    // Discapacidad
    { header: 'Tipo Discapacidad', key: 'tipo_discapacidad', width: 18 },
    { header: 'Carnet CONADIS', key: 'carnet_conadis', width: 15 },
    { header: 'Descripción Discapacidad', key: 'descripcion_discapacidad', width: 35 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.salud);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    const tipoSangreCompleto = scout.grupo_sanguineo && scout.factor_sanguineo 
      ? `${scout.grupo_sanguineo}${scout.factor_sanguineo}` 
      : '';
    
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      edad: scout.edad || calculateAge(scout.fecha_nacimiento),
      rama_actual: scout.rama_actual,
      grupo_sanguineo: scout.grupo_sanguineo,
      factor_sanguineo: scout.factor_sanguineo,
      tipo_sangre_completo: tipoSangreCompleto,
      seguro_medico: scout.seguro_medico,
      tipo_discapacidad: scout.tipo_discapacidad,
      carnet_conadis: scout.carnet_conadis,
      descripcion_discapacidad: scout.descripcion_discapacidad,
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 12 },
  };
}

/**
 * Hoja 8: Scout (Step 7) - Rama y código
 */
function createScoutSheet(workbook: ExcelJS.Workbook, scouts: ScoutExcelData[]): void {
  const sheet = workbook.addWorksheet('7. Scout', {
    properties: { tabColor: { argb: COLORS.header.scout } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  
  // Columnas
  sheet.columns = [
    { header: 'Código Scout', key: 'codigo_scout', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Estado', key: 'estado', width: 10 },
    // Datos Scout
    { header: 'Rama Actual', key: 'rama_actual', width: 12 },
    { header: 'Patrulla', key: 'patrulla', width: 18 },
    { header: 'Cargo en Patrulla', key: 'cargo_patrulla', width: 15 },
    { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 14 },
    { header: 'Código Asociado', key: 'codigo_asociado', width: 18 },
    // Antigüedad
    { header: 'Años Scout', key: 'anios_scout', width: 12 },
  ];
  
  // Estilos de encabezado
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyHeaderStyle(cell, COLORS.header.scout);
  });
  
  // Agregar datos
  scouts.forEach((scout, rowIndex) => {
    // Calcular años como scout
    let aniosScout = 0;
    if (scout.fecha_ingreso) {
      const fechaIngreso = new Date(scout.fecha_ingreso);
      const hoy = new Date();
      aniosScout = hoy.getFullYear() - fechaIngreso.getFullYear();
      if (hoy.getMonth() < fechaIngreso.getMonth() || 
          (hoy.getMonth() === fechaIngreso.getMonth() && hoy.getDate() < fechaIngreso.getDate())) {
        aniosScout--;
      }
    }
    
    const row = sheet.addRow({
      codigo_scout: scout.codigo_scout,
      nombres: scout.nombres,
      apellidos: scout.apellidos,
      estado: scout.estado,
      rama_actual: scout.rama_actual,
      patrulla: scout.patrulla || 'Sin patrulla',
      cargo_patrulla: scout.cargo_patrulla || 'MIEMBRO',
      fecha_ingreso: formatDate(scout.fecha_ingreso),
      codigo_asociado: scout.codigo_asociado,
      anios_scout: aniosScout > 0 ? aniosScout : '',
    });
    
    row.eachCell((cell) => {
      applyDataStyle(cell, rowIndex % 2 === 1);
    });
  });
  
  // Filtros
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: scouts.length + 1, column: 10 },
  };
}

export default {
  generateScoutsExcel,
};
