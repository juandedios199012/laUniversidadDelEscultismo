/**
 * Ensambla los datos de una actividad de Aire Libre + identidad del grupo
 * (Jefe de Grupo, Aprobadores) en los tipos de `anexoTypes.ts`,
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
import { DirigenteService } from '@/services/dirigenteService';
import { Aprobador } from '@/services/aprobadoresService';
import { scoutDocumentsService } from '@/services/scoutDocumentsService';
import { CARGOS_LABELS } from '@/types/dirigente';
import { ConfigAnexo4Service } from '@/services/configAnexo4Service';
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

type StaffConRol = Pick<StaffActividad, 'nombre' | 'rol'>;

function buscarStaffPorRol<T extends StaffConRol>(staff: T[], keywords: string[]): T | undefined {
  return staff.find((s) => keywords.some((k) => s.rol?.toUpperCase().includes(k)));
}

/**
 * Campos de responsables del Anexo 4, por rol exacto del step "Responsables":
 *   Director ← DIRECTOR · Dirigente Responsable ← RESPONSABLE
 *   Dirigente(s) Acompañante(s) ← DIRIGENTE · Colaborador ← COLABORADOR
 */
export function staffAnexo4(staff: StaffConRol[]): Pick<
  Anexo4Data,
  'director' | 'dirigenteResponsable' | 'adultosAcompanantes' | 'colaborador'
> {
  const nombresConRol = (codigo: string) =>
    staff
      .filter((s) => (s.rol || '').trim().toUpperCase() === codigo)
      .map((s) => s.nombre)
      .join(', ') || undefined;

  return {
    director: nombresConRol('DIRECTOR'),
    dirigenteResponsable: nombresConRol('RESPONSABLE'),
    adultosAcompanantes: nombresConRol('DIRIGENTE'),
    colaborador: nombresConRol('COLABORADOR'),
  };
}

/**
 * "Fecha(s) y hora" de la actividad, igual en el Anexo 1 y el Anexo 4.
 * Mismo día: "fecha • hora inicio - hora fin". Varios días: "inicio hora - fin hora".
 */
export function fechaHoraActividad(a: {
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  hora_concentracion?: string | null;
  hora_fin?: string | null;
}): string {
  const inicio = formatDate(a.fecha_inicio);
  const fin = formatDate(a.fecha_fin || a.fecha_inicio);
  const horaInicio = (a.hora_concentracion || '').slice(0, 5);
  const horaFin = (a.hora_fin || '').slice(0, 5);

  if (inicio === fin) {
    const horas = horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : horaInicio || horaFin;
    return horas ? `${inicio} • ${horas}` : inicio;
  }
  return `${horaInicio ? `${inicio} ${horaInicio}` : inicio} - ${horaFin ? `${fin} ${horaFin}` : fin}`;
}

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export interface OpcionesAnexo {
  /** Anexo 1: Aprobador a quien va dirigida la solicitud */
  aprobador?: Aprobador | null;
}

/**
 * ANEXO 1 - Solicitud de Aprobación de Actividad
 *   Destinatario ← Aprobadores · Firmante ← Jefe de Grupo (Dirigentes)
 *   Tabla ← Aire Libre (fechas/horas y responsables igual que el Anexo 4)
 */
export async function generarAnexo1(actividadId: string, opciones?: OpcionesAnexo): Promise<ReportGenerationResult> {
  try {
    const [actividad, jefe] = await Promise.all([
      ActividadesExteriorService.obtenerActividad(actividadId),
      DirigenteService.obtenerJefeGrupo(),
    ]);

    const firmaJefe = jefe?.dirigente_id
      ? await scoutDocumentsService.getDocumentForPdf('dirigente', jefe.dirigente_id, 'firma').catch(() => null)
      : null;

    const staff = actividad.staff || [];
    const aprobador = opciones?.aprobador;

    const data: Anexo1Data = {
      destinatario: aprobador
        ? { nombre: aprobador.nombre_completo, cargo: aprobador.cargo }
        : undefined,
      jefeGrupo: {
        nombre: jefe?.nombre_completo,
        dni: jefe?.numero_documento || undefined,
        cargo: jefe ? CARGOS_LABELS[jefe.cargo] || jefe.cargo : undefined,
        firmaBase64: firmaJefe || undefined,
        nombreGrupo: jefe?.nombre_grupo || undefined,
        localidad: jefe?.localidad || undefined,
        localidadNumeral: [jefe?.localidad, jefe?.numeral].filter(Boolean).join(' ') || undefined,
      },
      nombreActividad: actividad.nombre,
      tipoActividad: actividad.tipo,
      ramas: actividad.ramas_participantes?.join(', '),
      lugar: actividad.ubicacion,
      fechaHora: fechaHoraActividad(actividad),
      ...staffAnexo4(staff),
      costoPorParticipante: actividad.costo_por_participante || 0,
      responsableSaludSeguridad: buscarStaffPorRol(staff, ['ENFERMERO', 'MEDICO', 'SALUD', 'SEGURIDAD'])?.nombre,
      // Rol "Responsable de SFH" del step Responsables (catalogo_roles_staff)
      responsableSFH: staff
        .filter((s) => (s.rol || '').trim().toUpperCase() === 'RESPONSABLE_SFH')
        .map((s) => s.nombre)
        .join(', ') || undefined,
      fechaDocumento: hoyISO(),
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
    const [actividad, dashboard, config] = await Promise.all([
      ActividadesExteriorService.obtenerActividad(actividadId),
      ActividadesExteriorService.obtenerDashboardPresupuesto(actividadId),
      ConfigAnexo4Service.obtenerOVacio(),
    ]);
    const { inicio, fin } = rangoFechas(actividad);
    const presupuestoReal = Number(dashboard?.total_real ?? 0);

    const data: Anexo4Data = {
      nombreActividad: actividad.nombre,
      lugar: actividad.ubicacion,
      fechaInicio: inicio,
      fechaFin: fin,
      horaConcentracion: actividad.hora_concentracion,
      horaFin: actividad.hora_fin || undefined,
      costoPorParticipante: actividad.costo_por_participante || 0,
      presupuestoReal,
      ...staffAnexo4(actividad.staff || []),
      fechaDocumento: fechaLarga(),
      equipamientoObligatorio: actividad.equipamiento_obligatorio,
      equipamientoOpcional: actividad.equipamiento_opcional,
      recomendaciones: actividad.recomendaciones,
      declaraciones: config.declaraciones,
      itemsQueLlevarDefault: config.items_que_llevar,
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
