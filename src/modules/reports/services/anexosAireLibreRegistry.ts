/**
 * Registro de Anexos disponibles para el módulo Aire Libre.
 * Agregar un anexo nuevo es: nuevo template + nueva función de generación
 * en `anexosAireLibreService.ts` + una entrada aquí — el consumidor de UI
 * (ReportesTab.tsx) no cambia.
 */

import { ReportGenerationResult } from '../types/reportTypes';
import { generarAnexo1, generarAnexo3, generarAnexo4 } from './anexosAireLibreService';

export interface AnexoAireLibreRegistroItem {
  id: string;
  label: string;
  generar: (actividadId: string) => Promise<ReportGenerationResult>;
}

export const ANEXOS_AIRE_LIBRE: AnexoAireLibreRegistroItem[] = [
  { id: 'anexo1', label: 'Anexo 1 - Solicitud de Aprobación', generar: generarAnexo1 },
  { id: 'anexo3', label: 'Anexo 3 - Lista de Participantes', generar: generarAnexo3 },
  { id: 'anexo4', label: 'Anexo 4 - Autorización de Participación', generar: generarAnexo4 },
];
