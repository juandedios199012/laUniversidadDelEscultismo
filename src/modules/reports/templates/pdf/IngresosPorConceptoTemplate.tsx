/**
 * Plantilla PDF - Ingresos por Concepto (landscape A4)
 * Seguimiento de Ingresos de Finanzas > Cuenta por Persona agrupados
 * por Concepto: cuánto genera cada concepto en bruto (lo cobrado) y
 * en neto (ya descontada la inversión, vía Ganancia Unitaria del
 * catálogo de Conceptos). Modelada sobre MovimientosPorTipoTemplate,
 * sin la columna "N° Documento".
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { IngresoPorConceptoDetalle, IngresoPorConceptoResumen } from '../../../../services/finanzasService';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 20;
const NAME_W = 155;
const CONCEPTO_W = 170;
const CANTIDAD_W = 50;
const MONTO_W = 70;
const NETO_W = 70;
const INV_W = 70;
const DEUDA_W = 70;
const FECHA_W = 60;
const ROW_H = 18;
const ROWS_PER_PAGE = 24;

const RES_CONCEPTO_W = 180;
const RES_COUNT_W = 65;
const RES_CANTIDAD_W = 65;
const RES_BRUTO_W = 90;
const RES_NETO_W = 90;
const RES_INV_W = 90;
const RES_DEUDA_W = 90;

const money = (n: number): string => `S/ ${Number(n || 0).toFixed(2)}`;

const fmtFecha = (iso?: string): string => {
  if (!iso) return '—';
  const p = iso.split('T')[0].split('-');
  if (p.length < 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
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
  sectionTitle: { fontSize: 9, color: '#1e3a8a', fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 4 },

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
    detalle: IngresoPorConceptoDetalle[];
    resumen: IngresoPorConceptoResumen[];
    totalIngresos: number;
    totalGananciaNeta: number;
    totalInversion: number;
    totalDeuda: number;
    conceptoFiltro?: string;
  };
  metadata: ReportMetadata;
}

const IngresosPorConceptoTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { detalle, resumen, totalIngresos, totalGananciaNeta, totalInversion, totalDeuda, conceptoFiltro } = data;

  const chunks: IngresoPorConceptoDetalle[][] = [];
  for (let i = 0; i < Math.max(detalle.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(detalle.slice(i, i + ROWS_PER_PAGE));
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
              <Text style={S.headerTitle}>Ingresos por Concepto — Cuenta por Persona</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <Text style={S.subtitleNote}>
                {`Seguimiento de ingresos de Finanzas > Cuenta por Persona agrupados por Concepto (bruto = cobrado, neto = ganancia ya descontada la inversión) | Filtro: ${conceptoFiltro || 'Todos'}`}
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Conceptos</Text>
                  <Text style={S.kpiValue}>{`${resumen.length}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Movimientos</Text>
                  <Text style={S.kpiValue}>{`${detalle.length}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Ingresos Brutos</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalIngresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Ganancia Neta</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalGananciaNeta)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Inversión</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>{money(totalInversion)}</Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Deuda por Cobrar</Text>
                  <Text style={[S.kpiValue, { color: '#d97706' }]}>{money(totalDeuda)}</Text>
                </View>
              </View>
            )}

            {isFirst && (
              <>
                <Text style={S.sectionTitle}>Resumen por Concepto</Text>
                <View style={S.tableHeader}>
                  <Text style={[S.thLeft, { width: RES_CONCEPTO_W }]}>Concepto</Text>
                  <Text style={[S.th, { width: RES_COUNT_W }]}>Movimientos</Text>
                  <Text style={[S.th, { width: RES_CANTIDAD_W }]}>Cantidad</Text>
                  <Text style={[S.th, { width: RES_BRUTO_W }]}>Ingreso Bruto</Text>
                  <Text style={[S.th, { width: RES_NETO_W }]}>Ganancia Neta</Text>
                  <Text style={[S.th, { width: RES_INV_W }]}>Inversión</Text>
                  <Text style={[S.th, { width: RES_DEUDA_W, borderRightWidth: 0 }]}>Deuda</Text>
                </View>
                {resumen.map((r, idx) => (
                  <View key={r.concepto} style={idx % 2 === 0 ? S.trEven : S.trOdd}>
                    <Text style={[S.tdName, { width: RES_CONCEPTO_W, height: ROW_H }]} numberOfLines={1}>
                      {r.concepto}
                    </Text>
                    <Text style={[S.tdCenter, { width: RES_COUNT_W, height: ROW_H }]}>{r.movimientos_count}</Text>
                    <Text style={[S.tdCenter, { width: RES_CANTIDAD_W, height: ROW_H }]}>{r.total_cantidad ?? '—'}</Text>
                    <Text style={[S.tdMonto, { width: RES_BRUTO_W, height: ROW_H, color: '#15803d' }]}>
                      {money(r.total_monto)}
                    </Text>
                    <Text style={[S.tdMonto, { width: RES_NETO_W, height: ROW_H, color: '#15803d' }]}>
                      {money(r.total_ganancia_neta)}
                    </Text>
                    <Text style={[S.tdMonto, { width: RES_INV_W, height: ROW_H, color: '#b91c1c' }]}>
                      {money(r.total_inversion)}
                    </Text>
                    <Text style={[S.tdMonto, { width: RES_DEUDA_W, height: ROW_H, color: '#d97706', borderRightWidth: 0 }]}>
                      {money(r.total_deuda)}
                    </Text>
                  </View>
                ))}
                {resumen.length === 0 && (
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#6b7280' }}>Sin ingresos registrados.</Text>
                  </View>
                )}

                <Text style={S.sectionTitle}>Detalle de Movimientos</Text>
              </>
            )}

            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NAME_W }]}>Persona</Text>
              <Text style={[S.thLeft, { width: CONCEPTO_W }]}>Concepto</Text>
              <Text style={[S.th, { width: CANTIDAD_W }]}>Cantidad</Text>
              <Text style={[S.th, { width: MONTO_W }]}>Monto (Bruto)</Text>
              <Text style={[S.th, { width: NETO_W }]}>Ganancia Neta</Text>
              <Text style={[S.th, { width: INV_W }]}>Inversión</Text>
              <Text style={[S.th, { width: DEUDA_W }]}>Deuda</Text>
              <Text style={[S.th, { width: FECHA_W, borderRightWidth: 0 }]}>Fecha</Text>
            </View>

            {pageRows.map((m, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              const neto = m.cantidad != null && m.ganancia_unitaria != null ? m.cantidad * m.ganancia_unitaria : undefined;
              const inv = m.cantidad != null && m.precio_unitario != null && m.ganancia_unitaria != null
                ? m.cantidad * (m.precio_unitario - m.ganancia_unitaria)
                : undefined;
              const meta = m.cantidad != null && m.precio_unitario != null ? m.cantidad * m.precio_unitario : undefined;
              const deuda = meta != null && m.monto < meta ? meta - m.monto : undefined;
              return (
                <View key={m.id} style={rowStyle}>
                  <Text style={[S.tdName, { width: NAME_W, height: ROW_H }]} numberOfLines={1}>
                    {`${m.apellidos}, ${m.nombres}`}
                  </Text>
                  <Text style={[S.tdLeft, { width: CONCEPTO_W, height: ROW_H }]} numberOfLines={1}>
                    {m.concepto}
                  </Text>
                  <Text style={[S.tdCenter, { width: CANTIDAD_W, height: ROW_H }]}>
                    {m.cantidad ?? '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: MONTO_W, height: ROW_H, color: '#15803d' }]}>
                    {money(m.monto)}
                  </Text>
                  <Text style={[S.tdMonto, { width: NETO_W, height: ROW_H, color: '#15803d' }]}>
                    {neto != null ? money(neto) : '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: INV_W, height: ROW_H, color: '#b91c1c' }]}>
                    {inv != null ? money(inv) : '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: DEUDA_W, height: ROW_H, color: '#d97706' }]}>
                    {deuda != null ? money(deuda) : '—'}
                  </Text>
                  <Text style={[S.tdCenter, { width: FECHA_W, height: ROW_H, borderRightWidth: 0 }]}>
                    {fmtFecha(m.fecha)}
                  </Text>
                </View>
              );
            })}

            {isFirst && detalle.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron ingresos registrados.
                </Text>
              </View>
            )}

            {isLast && detalle.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: NAME_W + CONCEPTO_W + CANTIDAD_W }]}>TOTALES</Text>
                <Text style={[S.tdTotalMonto, { width: MONTO_W, color: '#15803d' }]}>{money(totalIngresos)}</Text>
                <Text style={[S.tdTotalMonto, { width: NETO_W, color: '#15803d' }]}>{money(totalGananciaNeta)}</Text>
                <Text style={[S.tdTotalMonto, { width: INV_W, color: '#b91c1c' }]}>{money(totalInversion)}</Text>
                <Text style={[S.tdTotalMonto, { width: DEUDA_W, color: '#d97706' }]}>{money(totalDeuda)}</Text>
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

export default IngresosPorConceptoTemplate;
