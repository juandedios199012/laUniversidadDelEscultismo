/**
 * Plantilla PDF - Finanzas Operativas / Rama (landscape A4)
 * Detalle de transacciones del módulo Finanzas (transacciones_financieras)
 * por período. Modelada sobre PersonasIngresosTemplate.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Transaccion } from '../../../../services/finanzasService';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 20;
const FECHA_W = 70;
const DESC_W = 250;
const CAT_W = 110;
const TIPO_W = 70;
const MONTO_W = 90;
const RESP_W = 140;
const ROW_H = 18;
const ROWS_PER_PAGE = 22;

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
    transacciones: Transaccion[];
    total: number;
    totalIngresos: number;
    totalEgresos: number;
    periodo: string;
  };
  metadata: ReportMetadata;
}

const FinancieroRamaTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { transacciones, total, totalIngresos, totalEgresos, periodo } = data;
  const balance = totalIngresos - totalEgresos;

  const chunks: Transaccion[][] = [];
  for (let i = 0; i < Math.max(transacciones.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(transacciones.slice(i, i + ROWS_PER_PAGE));
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
              <Text style={S.headerTitle}>Finanzas Operativas (Rama)</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <Text style={S.subtitleNote}>
                {`Detalle de transacciones del módulo Finanzas | Periodo: ${periodo}${transacciones.length < total ? ` | Mostrando ${transacciones.length} de ${total}` : ''}`}
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Transacciones</Text>
                  <Text style={S.kpiValue}>{`${total}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Ingresos</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalIngresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Egresos</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>{money(totalEgresos)}</Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Balance</Text>
                  <Text style={[S.kpiValue, { color: balance >= 0 ? '#15803d' : '#b91c1c' }]}>
                    {money(balance)}
                  </Text>
                </View>
              </View>
            )}

            <View style={S.tableHeader}>
              <Text style={[S.th, { width: FECHA_W }]}>Fecha</Text>
              <Text style={[S.thLeft, { width: DESC_W }]}>Concepto</Text>
              <Text style={[S.th, { width: CAT_W }]}>Categoría</Text>
              <Text style={[S.th, { width: TIPO_W }]}>Tipo</Text>
              <Text style={[S.th, { width: MONTO_W }]}>Monto</Text>
              <Text style={[S.thLeft, { width: RESP_W, borderRightWidth: 0 }]}>Responsable</Text>
            </View>

            {pageRows.map((t, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              const esIngreso = t.tipo === 'INGRESO';
              return (
                <View key={t.id} style={rowStyle}>
                  <Text style={[S.tdCenter, { width: FECHA_W, height: ROW_H }]}>
                    {fmtFecha(t.fecha_transaccion)}
                  </Text>
                  <Text style={[S.tdLeft, { width: DESC_W, height: ROW_H }]} numberOfLines={1}>
                    {t.descripcion || t.concepto || '—'}
                  </Text>
                  <Text style={[S.tdCenter, { width: CAT_W, height: ROW_H }]} numberOfLines={1}>
                    {t.categoria}
                  </Text>
                  <Text style={[S.tdCenter, { width: TIPO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c', fontFamily: 'Helvetica-Bold' }]}>
                    {esIngreso ? 'Ingreso' : 'Egreso'}
                  </Text>
                  <Text style={[S.tdMonto, { width: MONTO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c' }]}>
                    {money(t.monto)}
                  </Text>
                  <Text style={[S.tdLeft, { width: RESP_W, height: ROW_H, borderRightWidth: 0 }]} numberOfLines={1}>
                    {t.responsable_nombre || '—'}
                  </Text>
                </View>
              );
            })}

            {isFirst && transacciones.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron transacciones para el período seleccionado.
                </Text>
              </View>
            )}

            {isLast && transacciones.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: FECHA_W + DESC_W + CAT_W + TIPO_W }]}>TOTALES</Text>
                <Text style={[S.tdTotalMonto, { width: MONTO_W, color: balance >= 0 ? '#15803d' : '#b91c1c' }]}>{money(balance)}</Text>
                <View style={{ width: RESP_W }} />
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

export default FinancieroRamaTemplate;
