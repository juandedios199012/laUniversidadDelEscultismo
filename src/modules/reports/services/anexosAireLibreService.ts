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
  DetallePresupuestoItem,
  CATEGORIAS_PRESUPUESTO_ACTIVIDAD,
  ESTADOS_ACTIVIDAD_EXTERIOR,
} from '@/services/actividadesExteriorService';
import { DocumentosService } from '@/services/documentosService';
import { ComisionadoLocalService } from '@/services/comisionadoLocalService';
import { fechaLarga } from '@/components/GestionDocumentos/CartaOficialDocumento';
import { Anexo1SolicitudAprobacionTemplate } from '../templates/pdf/anexos/Anexo1SolicitudAprobacionTemplate';
import { Anexo3ListaParticipantesTemplate } from '../templates/pdf/anexos/Anexo3ListaParticipantesTemplate';
import { Anexo4AutorizacionTemplate } from '../templates/pdf/anexos/Anexo4AutorizacionTemplate';
import { ReporteFinancieroTemplate } from '../templates/pdf/anexos/ReporteFinancieroTemplate';
import {
  Anexo1Data,
  Anexo3Data,
  Anexo4Data,
  ReporteFinancieroCategoria,
  ReporteFinancieroData,
  ReporteFinancieroItem,
} from '../types/anexoTypes';

function buscarStaffPorRol(staff: StaffActividad[], keywords: string[]): StaffActividad | undefined {
  return staff.find((s) => keywords.some((k) => s.rol?.toUpperCase().includes(k)));
}

function buscarStaffsPorRol(staff: StaffActividad[], keywords: string[]): StaffActividad[] {
  return staff.filter((s) => keywords.some((k) => s.rol?.toUpperCase().includes(k)));
}

function obtenerHoraFinActividad(actividad: ActividadExteriorCompleta): string | undefined {
  const horas: string[] = [];

  if (actividad.programas?.length) {
    actividad.programas.forEach((programa) => {
      if (programa.hora_fin) horas.push(programa.hora_fin);
      (programa.bloques || []).forEach((bloque) => {
        if (bloque.hora_fin) horas.push(bloque.hora_fin);
      });
    });
  }

  if (actividad.hora_concentracion) {
    horas.push(actividad.hora_concentracion);
  }

  if (!horas.length) return undefined;

  const valor = horas
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .at(-1);

  return valor || undefined;
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
    const [{ actividad, plantilla }, comisionadoLocal, dashboard] = await Promise.all([
      obtenerActividadYFirmante(actividadId),
      ComisionadoLocalService.obtener(),
      ActividadesExteriorService.obtenerDashboardPresupuesto(actividadId),
    ]);

    const { inicio, fin } = rangoFechas(actividad);
    const staff = actividad.staff || [];
    const presupuestoReal = Number(dashboard?.total_real ?? 0);

    const data: Anexo1Data = {
      nombreActividad: actividad.nombre,
      tipoActividad: actividad.tipo,
      ramas: actividad.ramas_participantes?.join(', '),
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      horaConcentracion: actividad.hora_concentracion,
      costoPorParticipante: actividad.costo_por_participante || 0,
      presupuestoReal,
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
    const [actividad, dashboard] = await Promise.all([
      ActividadesExteriorService.obtenerActividad(actividadId),
      ActividadesExteriorService.obtenerDashboardPresupuesto(actividadId),
    ]);
    const { inicio, fin } = rangoFechas(actividad);
    const staff = actividad.staff || [];
    const director = buscarStaffPorRol(staff, ['DIRECTOR']) || buscarStaffPorRol(staff, ['JEFE', 'CAMPAMENTO']);
    const dirigenteResponsable = buscarStaffPorRol(staff, ['RESPONSABLE', 'DIRIGENTE']) || buscarStaffPorRol(staff, ['JEFE', 'CAMPAMENTO']);
    const colaboradores = buscarStaffsPorRol(staff, ['COLABORADOR']);
    const acompanantes = staff.filter((s) => {
      const nombre = (s.rol || '').toUpperCase();
      return s.id !== director?.id &&
        s.id !== dirigenteResponsable?.id &&
        !nombre.includes('COLABORADOR') &&
        !nombre.includes('DIRECTOR') &&
        !nombre.includes('RESPONSABLE') &&
        !nombre.includes('JEFE');
    });
    const presupuestoReal = Number(dashboard?.total_real ?? 0);

    const data: Anexo4Data = {
      nombreActividad: actividad.nombre,
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      horaConcentracion: actividad.hora_concentracion,
      horaFin: obtenerHoraFinActividad(actividad),
      costoPorParticipante: actividad.costo_por_participante || 0,
      presupuestoReal,
      adultosAcompanantes: acompanantes.map((s) => s.nombre).join(', '),
      colaborador: colaboradores.map((s) => s.nombre).join(', ') || undefined,
      adultoResponsable: director?.nombre || dirigenteResponsable?.nombre,
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

/**
 * Misma normalización que api_obtener_dashboard_presupuesto: une ítems
 * planificados y compras directas bajo una sola categoría.
 */
function normalizarCategoria(categoria?: string | null): string {
  const valor = (categoria || '').trim().toUpperCase() || 'OTROS';
  if (valor === 'MENU') return 'ALIMENTACION';
  if (valor === 'TRANSPORTE' || valor === 'ALQUILER') return 'LOGISTICA';
  return valor;
}

function etiquetaCategoria(categoria: string): string {
  if (categoria === 'LOGISTICA') return 'Logística';
  return CATEGORIAS_PRESUPUESTO_ACTIVIDAD.find((c) => c.value === categoria)?.label || categoria;
}

function aItemReporte(item: DetallePresupuestoItem, usarReal: boolean): ReporteFinancieroItem {
  return {
    categoria: etiquetaCategoria(normalizarCategoria(item.categoria)),
    origen: item.origen,
    concepto: item.concepto,
    cantidad: Number(usarReal ? item.cantidad_real : item.cantidad_estimada) || 0,
    unidad: item.unidad,
    precioUnitario: Number(usarReal ? item.precio_real : item.precio_estimado) || 0,
    subtotalEstimado: Number(item.subtotal_estimado) || 0,
    subtotalReal: usarReal ? Number(item.subtotal_real) || 0 : 0,
    proveedor: item.proveedor || item.lugar_compra,
  };
}

/**
 * REPORTE FINANCIERO - Ingresos, egresos y saldo de la actividad
 */
export async function generarReporteFinanciero(actividadId: string): Promise<ReportGenerationResult> {
  try {
    const [actividad, detalle] = await Promise.all([
      ActividadesExteriorService.obtenerActividad(actividadId),
      ActividadesExteriorService.obtenerDetallePresupuesto(actividadId),
    ]);
    const { inicio, fin } = rangoFechas(actividad);
    const participantes = actividad.participantes || [];
    const compras = actividad.compras || [];

    const comprados = detalle.filter((it) => it.comprado);
    const pendientes = detalle.filter((it) => it.estado === 'PENDIENTE');

    // Egresos por categoría: estimado de ítems planificados, real de comprados + compras directas
    const porCategoria = new Map<string, ReporteFinancieroCategoria>();
    const acumular = (categoria: string | undefined, estimado: number, real: number) => {
      const clave = normalizarCategoria(categoria);
      const actual = porCategoria.get(clave) || { categoria: etiquetaCategoria(clave), estimado: 0, real: 0 };
      actual.estimado += estimado;
      actual.real += real;
      porCategoria.set(clave, actual);
    };
    detalle.forEach((it) => acumular(
      it.categoria,
      Number(it.subtotal_estimado) || 0,
      it.comprado ? Number(it.subtotal_real) || 0 : 0,
    ));
    compras.forEach((c) => acumular(c.categoria, 0, Number(c.monto_total) || 0));

    const categorias = Array.from(porCategoria.values()).sort((a, b) => a.categoria.localeCompare(b.categoria));
    const itemsComprados = comprados.map((it) => aItemReporte(it, true));
    const itemsPendientes = pendientes.map((it) => aItemReporte(it, false));

    const data: ReporteFinancieroData = {
      nombreActividad: actividad.nombre,
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      estado: ESTADOS_ACTIVIDAD_EXTERIOR.find((e) => e.value === actividad.estado)?.label || actividad.estado,
      fechaDocumento: formatDate(new Date()),
      costoPorParticipante: actividad.costo_por_participante || 0,
      cuotasEsperadas: participantes.reduce(
        (acc, p) => acc + (p.monto_a_pagar ?? actividad.costo_por_participante ?? 0), 0,
      ),
      recaudado: participantes.reduce((acc, p) => acc + (p.monto_pagado || 0), 0),
      totalEstimado: detalle.reduce((acc, it) => acc + (Number(it.subtotal_estimado) || 0), 0),
      totalGastado: categorias.reduce((acc, c) => acc + c.real, 0),
      totalPendienteCompra: itemsPendientes.reduce((acc, it) => acc + it.subtotalEstimado, 0),
      ingresos: participantes
        .map((p) => ({
          nombre: p.scout_nombre,
          cuota: p.monto_a_pagar ?? actividad.costo_por_participante ?? 0,
          pagado: p.monto_pagado || 0,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      categorias,
      itemsComprados,
      comprasDirectas: compras
        .map((c) => ({
          fecha: formatDate(c.fecha_compra),
          concepto: c.concepto,
          categoria: c.categoria ? etiquetaCategoria(c.categoria.toUpperCase()) : undefined,
          proveedor: c.proveedor,
          comprobante: [c.tipo_comprobante, c.numero_comprobante].filter(Boolean).join(' ') || undefined,
          monto: Number(c.monto_total) || 0,
        })),
      itemsPendientes,
    };

    const Component = React.createElement(ReporteFinancieroTemplate, { data });
    return await generateAndDownloadPDF(Component, nombreArchivo('Reporte_Financiero', actividad));
  } catch (error) {
    console.error('Error generando Reporte Financiero:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'reporte_financiero.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar el Reporte Financiero',
    };
  }
}
