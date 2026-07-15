/**
 * Plantilla PDF - Movimientos por Tipo (landscape A4)
 * Detalle de movimientos (INGRESO/EGRESO) de Finanzas > Cuenta por
 * Persona, filtrable por tipo, para seguimiento más específico que
 * el resumen agregado de "Personas e Ingresos".
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { MovimientoPersonaConTitular } from '../../../../services/finanzasService';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 20;
const NAME_W = 145;
const DOC_W = 65;
const TIPO_W = 55;
const CONCEPTO_W = 135;
const MONTO_W = 70;
const NETO_W = 70;
const INV_W = 70;
const FALTANTE_W = 70;
const FECHA_W = 60;
const ROW_H = 18;
const ROWS_PER_PAGE = 24;

const money = (n: number): string => `S/ ${Number(n || 0).toFixed(2)}`;

const fmtFecha = (iso?: string): string => {
  if (!iso) return '—';
  const p = iso.split('T')[0].split('-');
  if (p.length < 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
};

const TIPO_LABEL: Record<string, string> = {
  TODOS: 'Todos',
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
};

const S = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: PAD,
    paddingBottom: PAD,
    paddingLeft: PAD,
    paddingRight: PAD,
    fontFamily: 'Helvetica',
  },

  headerBar: {
    backgroundColor: '#1e3a8a',
    borderRadius: 5,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 13, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  headerSub: { fontSize: 7.5, color: '#bfdbfe', textAlign: 'right' },
  subtitleNote: { fontSize: 7, color: '#6b7280', marginBottom: 6 },

  kpiRow: { flexDirection: 'row', marginBottom: 7 },
  kpiCard: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, marginRight: 6,
  },
  kpiCardLast: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8,
  },
  kpiLabel: { fontSize: 6.5, color: '#1e40af' },
  kpiValue: { fontSize: 14, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 2 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a' },
  th: {
    fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold', textAlign: 'center',
    paddingTop: 4, paddingBottom: 4, borderRightWidth: 0.5, borderRightColor: '#3b82f6',
  },
  thLeft: {
    fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold',
    paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderRightWidth: 0.5, borderRightColor: '#3b82f6',
  },

  trEven: { flexDirection: 'row', backgroundColor: '#ffffff' },
  trOdd: { flexDirection: 'row', backgroundColor: '#f8fafc' },
  tdName: {
    fontSize: 7.5, color: '#111827', paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdCenter: {
    fontSize: 7, color: '#4b5563', textAlign: 'center', paddingTop: 4, paddingBottom: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdLeft: {
    fontSize: 7, color: '#4b5563', paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdMonto: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingTop: 4, paddingBottom: 4, paddingRight: 6,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },

  totalsRow: {
    flexDirection: 'row', backgroundColor: '#f1f5f9',
    borderTopWidth: 1.5, borderTopColor: '#94a3b8',
  },
  tdTotalLabel: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151',
    paddingTop: 5, paddingBottom: 5, paddingLeft: 4,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
  },
  tdTotalMonto: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right',
    paddingTop: 5, paddingBottom: 5, paddingRight: 6,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
  },

  footer: {
    marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 4,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: '#9ca3af' },
});

interface Props {
  data: {
    movimientos: MovimientoPersonaConTitular[];
    totalIngresos: number;
    totalEgresos: number;
    totalGananciaNeta: number;
    totalInversion: number;
    totalDeuda: number;
    tipoFiltro: 'TODOS' | 'INGRESO' | 'EGRESO';
  };
  metadata: ReportMetadata;
}

const MovimientosPorTipoTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { movimientos, totalIngresos, totalEgresos, totalGananciaNeta, totalInversion, totalDeuda, tipoFiltro } = data;
  const neto = totalIngresos - totalEgresos;

  const chunks: MovimientoPersonaConTitular[][] = [];
  for (let i = 0; i < Math.max(movimientos.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(movimientos.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);
  const totalPages = chunks.length;

  const genDate = new Date(metadata.generatedAt).toLocaleDateString('es-PE');

  return (
    <Document>
      {chunks.map((pageRows, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === totalPages - 1;

        return (
          <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
            <View style={S.headerBar}>
              <Text style={S.headerTitle}>Movimientos por Tipo — Cuenta por Persona</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <Text style={S.subtitleNote}>
                {`Detalle de movimientos individuales de Finanzas > Cuenta por Persona | Filtro: ${TIPO_LABEL[tipoFiltro]}`}
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Movimientos</Text>
                  <Text style={S.kpiValue}>{`${movimientos.length}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Ingresos</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalIngresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Egresos</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>{money(totalEgresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Neto (Ingresos - Egresos)</Text>
                  <Text style={[S.kpiValue, { color: neto >= 0 ? '#15803d' : '#b91c1c' }]}>
                    {money(neto)}
                  </Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Ganancia Neta</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>
                    {money(totalGananciaNeta)}
                  </Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Inversión</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>
                    {money(totalInversion)}
                  </Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Deuda por Cobrar</Text>
                  <Text style={[S.kpiValue, { color: '#d97706' }]}>
                    {money(totalDeuda)}
                  </Text>
                </View>
              </View>
            )}

            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NAME_W }]}>Persona</Text>
              <Text style={[S.th, { width: DOC_W }]}>N° Documento</Text>
              <Text style={[S.th, { width: TIPO_W }]}>Tipo</Text>
              <Text style={[S.thLeft, { width: CONCEPTO_W }]}>Concepto</Text>
              <Text style={[S.th, { width: MONTO_W }]}>Monto</Text>
              <Text style={[S.th, { width: NETO_W }]}>Ganancia Neta</Text>
              <Text style={[S.th, { width: INV_W }]}>Inversión</Text>
              <Text style={[S.th, { width: FALTANTE_W }]}>Faltante</Text>
              <Text style={[S.th, { width: FECHA_W, borderRightWidth: 0 }]}>Fecha</Text>
            </View>

            {pageRows.map((m, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              const esIngreso = m.tipo_movimiento === 'INGRESO';
              const ganNeta = m.cantidad != null && m.ganancia_unitaria != null ? m.cantidad * m.ganancia_unitaria : undefined;
              const inv = m.cantidad != null && m.precio_unitario != null && m.ganancia_unitaria != null
                ? m.cantidad * (m.precio_unitario - m.ganancia_unitaria)
                : undefined;
              const meta = m.cantidad != null && m.precio_unitario != null ? m.cantidad * m.precio_unitario : undefined;
              const faltante = meta != null && m.monto < meta ? meta - m.monto : undefined;
              return (
                <View key={m.id} style={rowStyle}>
                  <Text style={[S.tdName, { width: NAME_W, height: ROW_H }]} numberOfLines={1}>
                    {`${m.apellidos}, ${m.nombres}`}
                  </Text>
                  <Text style={[S.tdCenter, { width: DOC_W, height: ROW_H }]}>
                    {m.numero_documento || '—'}
                  </Text>
                  <Text style={[S.tdCenter, { width: TIPO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c', fontFamily: 'Helvetica-Bold' }]}>
                    {esIngreso ? 'Ingreso' : 'Egreso'}
                  </Text>
                  <Text style={[S.tdLeft, { width: CONCEPTO_W, height: ROW_H }]} numberOfLines={1}>
                    {m.concepto}
                  </Text>
                  <Text style={[S.tdMonto, { width: MONTO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c' }]}>
                    {money(m.monto)}
                  </Text>
                  <Text style={[S.tdMonto, { width: NETO_W, height: ROW_H, color: '#15803d' }]}>
                    {ganNeta != null ? money(ganNeta) : '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: INV_W, height: ROW_H, color: '#b91c1c' }]}>
                    {inv != null ? money(inv) : '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: FALTANTE_W, height: ROW_H, color: '#d97706' }]}>
                    {faltante != null ? money(faltante) : '—'}
                  </Text>
                  <Text style={[S.tdCenter, { width: FECHA_W, height: ROW_H, borderRightWidth: 0 }]}>
                    {fmtFecha(m.fecha)}
                  </Text>
                </View>
              );
            })}

            {isFirst && movimientos.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron movimientos para el filtro seleccionado.
                </Text>
              </View>
            )}

            {isLast && movimientos.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: NAME_W + DOC_W + TIPO_W + CONCEPTO_W }]}>TOTALES</Text>
                <Text style={[S.tdTotalMonto, { width: MONTO_W, color: neto >= 0 ? '#15803d' : '#b91c1c' }]}>{money(neto)}</Text>
                <Text style={[S.tdTotalMonto, { width: NETO_W, color: '#15803d' }]}>{money(totalGananciaNeta)}</Text>
                <Text style={[S.tdTotalMonto, { width: INV_W, color: '#b91c1c' }]}>{money(totalInversion)}</Text>
                <Text style={[S.tdTotalMonto, { width: FALTANTE_W, color: '#d97706' }]}>{money(totalDeuda)}</Text>
                <View style={{ width: FECHA_W }} />
              </View>
            )}

            <View style={S.footer}>
              <Text style={S.footerText}>{`${metadata.organizacion} | ${metadata.version}`}</Text>
              <Text style={S.footerText}>{`Pag ${pageIdx + 1}/${totalPages}`}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default MovimientosPorTipoTemplate;
