/**
 * PDF del Anexo 4 prellenado para el Portal de Padres (padre, hijo y, si ya
 * aceptó, el sello de aceptación digital). Se importa de forma diferida
 * (import()) para no cargar @react-pdf/renderer en el portal hasta abrirlo.
 */

import { formatDate } from '@/modules/reports/services/pdfService';
import { generarAnexo4Blob, staffAnexo4 } from '@/modules/reports/services/anexosAireLibreService';
import { fechaLarga } from '@/components/GestionDocumentos/CartaOficialDocumento';
import type { Anexo4Data } from '@/modules/reports/types/anexoTypes';
import type { ActividadHijo } from '@/services/portalPadresService';
import type { ConfigAnexo4 } from '@/services/configAnexo4Service';

function parentescoAnexo(parentesco: string | null): 'Padre' | 'Madre' | 'Apoderado' {
  const p = (parentesco || '').toUpperCase();
  if (p === 'PADRE') return 'Padre';
  if (p === 'MADRE') return 'Madre';
  return 'Apoderado';
}

function tipoMenor(rama: string | null, sexo: string | null): 'niño' | 'niña' | 'joven' {
  const r = (rama || '').toLowerCase();
  if (r.includes('caminante') || r.includes('rover') || r.includes('clan') || r.includes('comunidad')) return 'joven';
  return (sexo || '').toUpperCase().startsWith('F') ? 'niña' : 'niño';
}

function fechaHoraAceptacion(iso: string): string {
  const d = new Date(iso);
  return `${fechaLarga(d)}, ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
}

export function construirAnexo4Padre(a: ActividadHijo, config: ConfigAnexo4): Anexo4Data {
  // Si ya aceptó, el PDF refleja exactamente las declaraciones que aceptó
  const declaraciones = Array.isArray(a.autorizacion_declaraciones) && a.autorizacion_declaraciones.length
    ? a.autorizacion_declaraciones
    : config.declaraciones;

  return {
    nombreActividad: a.nombre,
    lugar: a.lugar || '',
    fechaInicio: formatDate(a.fecha_inicio),
    fechaFin: formatDate(a.fecha_fin || a.fecha_inicio),
    horaConcentracion: a.hora_concentracion || undefined,
    horaFin: a.hora_fin || undefined,
    costoPorParticipante: a.costo_por_participante,
    ...staffAnexo4(a.staff),
    fechaDocumento: fechaLarga(),
    equipamientoObligatorio: a.equipamiento_obligatorio || undefined,
    equipamientoOpcional: a.equipamiento_opcional || undefined,
    recomendaciones: a.recomendaciones || undefined,
    declaraciones,
    itemsQueLlevarDefault: config.items_que_llevar,
    firmante: a.apoderado_nombre
      ? {
          nombre: a.apoderado_nombre,
          dni: a.apoderado_dni || undefined,
          parentesco: parentescoAnexo(a.apoderado_parentesco),
        }
      : undefined,
    menor: {
      nombre: a.scout_nombre,
      dni: a.scout_dni || undefined,
      tipo: tipoMenor(a.scout_rama, a.scout_sexo),
      codigoAsociado: a.scout_codigo_asociado || undefined,
    },
    aceptacion: a.autorizacion_aceptada_at
      ? {
          fecha: fechaHoraAceptacion(a.autorizacion_aceptada_at),
          nombre: a.autorizacion_aceptada_nombre || undefined,
          dni: a.autorizacion_aceptada_dni || undefined,
        }
      : undefined,
  };
}

export async function generarAnexo4Padre(a: ActividadHijo, config: ConfigAnexo4): Promise<Blob> {
  return generarAnexo4Blob(construirAnexo4Padre(a, config));
}
