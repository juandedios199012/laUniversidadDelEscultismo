/**
 * Ensambla los datos de una actividad de Aire Libre + identidad del grupo
 * (plantilla de carta, Comisionado Local) en los tipos de `anexoTypes.ts`,
 * y genera/descarga el PDF de cada Anexo. Mismo idioma que
 * `historiaMedicaExportService.ts`: React.createElement + generateAndDownloadPDF.
 */

import React from 'react';
import { generateAndDownloadPDF, formatDate } from './pdfService';
import { ReportGenerationResult, ReportStatus } from '../types/reportTypes';
import {
  ActividadesExteriorService,
  ActividadExteriorCompleta,
  StaffActividad,
} from '@/services/actividadesExteriorService';
import { DocumentosService } from '@/services/documentosService';
import { ComisionadoLocalService } from '@/services/comisionadoLocalService';
import { fechaLarga } from '@/components/GestionDocumentos/CartaOficialDocumento';
import { Anexo1SolicitudAprobacionTemplate } from '../templates/pdf/anexos/Anexo1SolicitudAprobacionTemplate';
import { Anexo3ListaParticipantesTemplate } from '../templates/pdf/anexos/Anexo3ListaParticipantesTemplate';
import { Anexo4AutorizacionTemplate } from '../templates/pdf/anexos/Anexo4AutorizacionTemplate';
import { Anexo1Data, Anexo3Data, Anexo4Data } from '../types/anexoTypes';

function buscarStaffPorRol(staff: StaffActividad[], keywords: string[]): StaffActividad | undefined {
  return staff.find((s) => keywords.some((k) => s.rol?.toUpperCase().includes(k)));
}

function rangoFechas(actividad: ActividadExteriorCompleta): { inicio: string; fin: string } {
  return {
    inicio: formatDate(actividad.fecha_inicio),
    fin: formatDate(actividad.fecha_fin),
  };
}

function nombreArchivo(prefijo: string, actividad: ActividadExteriorCompleta): string {
  const slug = actividad.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${prefijo}_${slug}_${new Date().toISOString().split('T')[0]}`;
}

async function obtenerActividadYFirmante(actividadId: string) {
  const [actividad, plantilla] = await Promise.all([
    ActividadesExteriorService.obtenerActividad(actividadId),
    DocumentosService.obtenerPlantilla(),
  ]);
  return { actividad, plantilla };
}

/**
 * ANEXO 1 - Solicitud de Aprobación de Actividad
 */
export async function generarAnexo1(actividadId: string): Promise<ReportGenerationResult> {
  try {
    const [{ actividad, plantilla }, comisionadoLocal] = await Promise.all([
      obtenerActividadYFirmante(actividadId),
      ComisionadoLocalService.obtener(),
    ]);

    const { inicio, fin } = rangoFechas(actividad);
    const staff = actividad.staff || [];

    const data: Anexo1Data = {
      nombreActividad: actividad.nombre,
      tipoActividad: actividad.tipo,
      ramas: actividad.ramas_participantes?.join(', '),
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      horaConcentracion: actividad.hora_concentracion,
      costoPorParticipante: actividad.costo_por_participante || 0,
      adultoResponsable: buscarStaffPorRol(staff, ['JEFE', 'DIRIGENTE'])?.nombre,
      responsableSalud: buscarStaffPorRol(staff, ['ENFERMERO', 'MEDICO', 'SALUD'])?.nombre,
      responsableSFH: buscarStaffPorRol(staff, ['SFH'])?.nombre,
      jefeGrupo: {
        nombre: plantilla?.firma_nombre,
        cargo: plantilla?.firma_cargo,
        dni: plantilla?.firma_dni,
      },
      comisionadoLocal: comisionadoLocal || undefined,
      fechaDocumento: fechaLarga(),
    };

    const Component = React.createElement(Anexo1SolicitudAprobacionTemplate, { data });
    return await generateAndDownloadPDF(Component, nombreArchivo('Anexo1_Solicitud_Aprobacion', actividad));
  } catch (error) {
    console.error('Error generando Anexo 1:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'anexo1.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar el Anexo 1',
    };
  }
}

/**
 * ANEXO 3 - Lista de Participantes
 */
export async function generarAnexo3(actividadId: string): Promise<ReportGenerationResult> {
  try {
    const actividad = await ActividadesExteriorService.obtenerActividad(actividadId);
    const { inicio, fin } = rangoFechas(actividad);

    const data: Anexo3Data = {
      nombreActividad: actividad.nombre,
      fecha: inicio === fin ? inicio : `${inicio} - ${fin}`,
      rama: actividad.ramas_participantes?.join(', '),
      miembrosJuveniles: (actividad.participantes || []).map((p) => ({
        nombreCompleto: p.scout_nombre,
        dni: p.dni,
        edad: p.edad,
        codigoAsociado: p.codigo_asociado,
        contactoEmergencia: p.contacto_emergencia_telefono,
        numeroContacto: p.celular,
      })),
      adultosVoluntarios: (actividad.staff || []).map((s) => ({
        nombreCompleto: s.nombre,
        dni: s.dni,
        edad: s.edad,
        rol: s.rol,
        codigoAsociado: s.codigo_asociado,
        telefono: s.telefono_contacto,
      })),
    };

    const Component = React.createElement(Anexo3ListaParticipantesTemplate, { data });
    return await generateAndDownloadPDF(Component, nombreArchivo('Anexo3_Lista_Participantes', actividad));
  } catch (error) {
    console.error('Error generando Anexo 3:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'anexo3.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar el Anexo 3',
    };
  }
}

/**
 * ANEXO 4 - Autorización de Participación (2 páginas)
 */
export async function generarAnexo4(actividadId: string): Promise<ReportGenerationResult> {
  try {
    const actividad = await ActividadesExteriorService.obtenerActividad(actividadId);
    const { inicio, fin } = rangoFechas(actividad);
    const staff = actividad.staff || [];
    const adultoResponsable = buscarStaffPorRol(staff, ['JEFE', 'DIRIGENTE']);

    const data: Anexo4Data = {
      nombreActividad: actividad.nombre,
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      horaConcentracion: actividad.hora_concentracion,
      costoPorParticipante: actividad.costo_por_participante || 0,
      adultoResponsable: adultoResponsable?.nombre,
      adultosAcompanantes: staff
        .filter((s) => s.id !== adultoResponsable?.id)
        .map((s) => s.nombre)
        .join(', '),
      fechaDocumento: fechaLarga(),
      equipamientoObligatorio: actividad.equipamiento_obligatorio,
      equipamientoOpcional: actividad.equipamiento_opcional,
      recomendaciones: actividad.recomendaciones,
    };

    const Component = React.createElement(Anexo4AutorizacionTemplate, { data });
    return await generateAndDownloadPDF(Component, nombreArchivo('Anexo4_Autorizacion', actividad));
  } catch (error) {
    console.error('Error generando Anexo 4:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'anexo4.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar el Anexo 4',
    };
  }
}
