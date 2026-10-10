/**
 * PDF del Anexo 4 para el Portal de Padres: el mismo PDF del reporte
 * "Autorización del Padre o Apoderado" (scout, apoderado y firma desde el
 * step Familiar del módulo Juvenil), con los datos de la actividad tomados
 * del módulo Aire Libre en lugar de escribirse a mano. Se importa de forma
 * diferida (import()) para no cargar @react-pdf/renderer hasta abrirlo.
 */

import { fechaHoraActividad, staffAnexo4 } from '@/modules/reports/services/anexosAireLibreService';
import { armarAutorizacionApoderadoData } from '@/modules/reports/services/reportDataService';
import { generarAutorizacionApoderadoBlob } from '@/modules/reports/services/autorizacionApoderadoExportService';
import { fechaLarga } from '@/components/GestionDocumentos/CartaOficialDocumento';
import type { AutorizacionApoderadoReportData } from '@/modules/reports/types/reportTypes';
import { PortalPadresService, type ActividadHijo } from '@/services/portalPadresService';

/** Datos de la actividad desde Aire Libre (en el reporte se escriben a mano). */
function actividadAireLibre(a: ActividadHijo): AutorizacionApoderadoReportData['actividad'] {
  const staff = staffAnexo4(a.staff);
  return {
    nombreActividad: a.nombre,
    lugar: a.lugar || '',
    fechaHora: fechaHoraActividad(a),
    cuota: `S/. ${Number(a.costo_por_participante || 0).toFixed(2)}`,
    director: staff.director || '',
    dirigenteResponsable: staff.dirigenteResponsable || '',
    acompanantes: staff.adultosAcompanantes || '',
    colaborador: staff.colaborador || '',
  };
}

export async function generarAnexo4Padre(a: ActividadHijo): Promise<Blob> {
  // Mismo registro que usa el reporte, validando que el scout sea hijo del usuario
  const hijo = await PortalPadresService.getHijoCompleto(a.scout_id);
  if (!hijo) throw new Error('No se pudo obtener los datos del scout');

  const data = await armarAutorizacionApoderadoData(hijo, a.scout_id);
  data.actividad = actividadAireLibre(a);

  if (a.autorizacion_aceptada_at) {
    const d = new Date(a.autorizacion_aceptada_at);
    data.aceptacion = {
      fecha: `${fechaLarga(d)}, ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
    };
  }

  return generarAutorizacionApoderadoBlob(data);
}
