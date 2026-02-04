/**
 * Punto de entrada del módulo de reportes
 * Exporta todos los componentes, servicios y tipos necesarios
 */

// Componentes
export { default as ReportManager } from './components/ReportManager';
export { default as ReportExportButton } from './components/ReportExportButton';
export { default as ReportPreview } from './components/ReportPreview';
export { default as ScoutsExcelReport } from './components/ScoutsExcelReport';

// Plantillas PDF
export { default as ScoutReportTemplate } from './templates/pdf/ScoutReportTemplate';
export { default as AttendanceReportTemplate } from './templates/pdf/AttendanceReportTemplate';
export { default as ProgressReportTemplate } from './templates/pdf/ProgressReportTemplate';
export { default as DNGI03Template } from './templates/pdf/DNGI03Template';

// Servicios
export * from './services/pdfService';
export * from './services/docxService';
export * from './services/reportDataService';
export * from './services/excelService';
export * from './services/scoutExcelDataService';

// Tipos
export * from './types/reportTypes';

// Estilos
export * from './styles/pdfStyles';

