/**
 * Plantilla PDF - Matriz de Asistencia (landscape A4)
 * Scout x Sesion con estado P / F / FJ / NA y % rendimiento real
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AttendanceMatrixData, CellStatus, MatrixScout } from '../../services/attendanceMatrixService';
import { ReportMetadata } from '../../types/reportTypes';

// ─── layout constants ──────────────────────────────────────────────────────
// A4 landscape: 841 x 595 pt, padding 20pt = usable 801 x 555 pt
const PAD = 20;
const PAGE_W = 841 - PAD * 2; // 801
const NAME_W = 145;
const INGRESO_W = 62;
const REND_W = 80;
const SESSION_POOL = PAGE_W - NAME_W - INGRESO_W - REND_W; // 514
const ROW_H = 17;
const ROWS_PER_PAGE = 22; // leaves room for header, KPIs, totals

function sessionColW(n: number): number {
  return Math.min(120, Math.max(36, Math.floor(SESSION_POOL / Math.max(n, 1))));
}

// ─── cell definitions ──────────────────────────────────────────────────────
const CELL: Record<CellStatus, { bg: string; fg: string; label: string }> = {
  'P':  { bg: '#dcfce7', fg: '#15803d', label: 'P' },
  'F':  { bg: '#fee2e2', fg: '#b91c1c', label: 'F' },
  'FJ': { bg: '#fef9c3', fg: '#92400e', label: 'FJ' },
  'NA': { bg: '#f3f4f6', fg: '#9ca3af', label: 'N/A' },
  '-':  { bg: '#fff7ed', fg: '#d97706', label: 'S/R' }, // sin registro
};

function rendColor(r: number): string {
  if (r >= 80) return '#15803d';
  if (r >= 60) return '#d97706';
  return '#b91c1c';
}

// ─── date helpers ──────────────────────────────────────────────────────────
const MN = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtISO(iso: string | null): string {
  if (!iso) return 'Sin dato';
  const p = iso.split('T')[0].split('-');
  if (p.length < 3) return iso;
  return `${p[2]} ${MN[parseInt(p[1], 10) - 1] ?? ''} ${p[0].slice(2)}`;
}

// ─── styles ────────────────────────────────────────────────────────────────
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

  // header bar
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

  // KPI row (page 1 only)
  kpiRow: { flexDirection: 'row', marginBottom: 7 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 4,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    marginRight: 6,
  },
  kpiCardLast: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 4,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
  },
  kpiLabel: { fontSize: 6.5, color: '#1e40af' },
  kpiValue: { fontSize: 14, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 2 },

  // table header row
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a' },
  th: {
    fontSize: 7,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#3b82f6',
  },
  thLeft: {
    fontSize: 7,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#3b82f6',
  },

  // data row
  trEven: { flexDirection: 'row', backgroundColor: '#ffffff' },
  trOdd:  { flexDirection: 'row', backgroundColor: '#f8fafc' },

  tdName: {
    fontSize: 7,
    color: '#111827',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5,
    borderRightColor: '#e5e7eb',
  },
  tdDate: {
    fontSize: 6.5,
    color: '#4b5563',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5,
    borderRightColor: '#e5e7eb',
  },
  tdRend: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },

  // cell (status)
  cellOuter: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  // totals row
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1.5,
    borderTopColor: '#94a3b8',
  },
  tdTotalLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
  },
  tdTotalCell: {
    paddingTop: 2,
    paddingBottom: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tdTotalText: { fontSize: 6, textAlign: 'center' },

  // legend
  legendBox: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 2 },
  legendSwatch: { width: 11, height: 11, borderRadius: 2, marginRight: 3 },
  legendText: { fontSize: 6.5, color: '#374151' },

  // formula note
  formulaNote: {
    marginTop: 5,
    fontSize: 6.5,
    color: '#6b7280',
    textAlign: 'center',
  },

  // footer
  footer: {
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: '#9ca3af' },
});

// ─── component ─────────────────────────────────────────────────────────────

interface Props {
  data: AttendanceMatrixData;
  metadata: ReportMetadata;
}

const AttendanceMatrixTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { sessions, scouts, globalRendimiento, sessionTotals, dateFrom, dateTo, rama } = data;
  const nSess = sessions.length;
  const colW = sessionColW(nSess);

  // Chunk scouts into pages
  const chunks: MatrixScout[][] = [];
  for (let i = 0; i < Math.max(scouts.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(scouts.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const totalPages = chunks.length;
  const ramaLabel = rama ? ` | Rama: ${rama}` : '';
  const genDate = new Date(metadata.generatedAt).toLocaleDateString('es-PE');

  return (
    <Document>
      {chunks.map((pageScouts, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast  = pageIdx === totalPages - 1;

        return (
          <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>

            {/* ── header ── */}
            <View style={S.headerBar}>
              <Text style={S.headerTitle}>Matriz de Asistencia por Scout</Text>
              <Text style={S.headerSub}>
                {`${fmtISO(dateFrom)} al ${fmtISO(dateTo)}${ramaLabel} | Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {/* ── KPIs (page 1 only) ── */}
            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Rendimiento Global</Text>
                  <Text style={[S.kpiValue, { color: rendColor(globalRendimiento) }]}>
                    {`${globalRendimiento}%`}
                  </Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Scouts Evaluados</Text>
                  <Text style={S.kpiValue}>{`${scouts.length}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Sesiones en Periodo</Text>
                  <Text style={S.kpiValue}>{`${nSess}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Con rendimiento alto</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>
                    {`${scouts.filter(s => s.rendimiento >= 80).length}`}
                  </Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Con rendimiento bajo</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>
                    {`${scouts.filter(s => s.rendimiento < 60 && s.totalEvaluadas > 0).length}`}
                  </Text>
                </View>
              </View>
            )}

            {/* ── table header ── */}
            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NAME_W }]}>Scout</Text>
              <Text style={[S.th, { width: INGRESO_W }]}>F. Ingreso</Text>
              {sessions.map(sess => (
                <Text key={sess.id} style={[S.th, { width: colW }]}>{sess.label}</Text>
              ))}
              <Text style={[S.th, { width: REND_W, borderRightWidth: 0 }]}>% Rend.</Text>
            </View>

            {/* ── scout rows ── */}
            {pageScouts.map((scout, rowIdx) => {
              const absoluteIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absoluteIdx % 2 === 0 ? S.trEven : S.trOdd;
              return (
                <View key={scout.id} style={rowStyle}>
                  <Text style={[S.tdName, { width: NAME_W, height: ROW_H }]} numberOfLines={1}>
                    {`${scout.apellidos}, ${scout.nombres}`}
                  </Text>
                  <Text style={[S.tdDate, { width: INGRESO_W, height: ROW_H }]}>
                    {fmtISO(scout.fecha_ingreso)}
                  </Text>
                  {sessions.map(sess => {
                    const st: CellStatus = scout.statuses[sess.id] ?? '-';
                    const cc = CELL[st];
                    return (
                      <View
                        key={sess.id}
                        style={[S.cellOuter, { width: colW, height: ROW_H, backgroundColor: cc.bg }]}
                      >
                        <Text style={[S.cellText, { color: cc.fg }]}>{cc.label}</Text>
                      </View>
                    );
                  })}
                  <Text style={[S.tdRend, { width: REND_W, height: ROW_H, color: rendColor(scout.rendimiento) }]}>
                    {`${scout.rendimiento}%`}
                  </Text>
                </View>
              );
            })}

            {/* ── totals row (last page) ── */}
            {isLast && scouts.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: NAME_W + INGRESO_W }]}>TOTALES POR SESION</Text>
                {sessions.map(sess => {
                  const t = sessionTotals[sess.id] ?? { P: 0, F: 0, FJ: 0, NA: 0, total: 0 };
                  return (
                    <View key={sess.id} style={[S.tdTotalCell, { width: colW }]}>
                      <Text style={[S.tdTotalText, { color: '#15803d' }]}>{`${t.P}P`}</Text>
                      <Text style={[S.tdTotalText, { color: '#b91c1c' }]}>{`${t.F}F`}</Text>
                      {t.FJ > 0 && <Text style={[S.tdTotalText, { color: '#92400e' }]}>{`${t.FJ}FJ`}</Text>}
                    </View>
                  );
                })}
                <View style={[S.tdTotalCell, { width: REND_W, borderRightWidth: 0 }]}>
                  <Text style={[S.tdTotalText, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: rendColor(globalRendimiento) }]}>
                    {`${globalRendimiento}%`}
                  </Text>
                </View>
              </View>
            )}

            {/* ── empty state ── */}
            {isFirst && scouts.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron scouts activos en este periodo.
                </Text>
              </View>
            )}

            {/* ── legend (last page) ── */}
            {isLast && (
              <>
                <View style={S.legendBox}>
                  {(Object.entries(CELL) as [CellStatus, typeof CELL[CellStatus]][]).map(([key, val]) => (
                    <View key={key} style={S.legendItem}>
                      <View style={[S.legendSwatch, { backgroundColor: val.bg, borderWidth: 1, borderColor: val.fg }]} />
                      <Text style={S.legendText}>
                        {key === 'P'  ? `${val.label}: Presente` :
                         key === 'F'  ? `${val.label}: Falta injustif.` :
                         key === 'FJ' ? `${val.label}: Justificada` :
                         key === 'NA' ? `${val.label}: No activo aun` :
                                        `${val.label}: Sin registro`}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={S.formulaNote}>
                  {`Formula % Rendimiento = Presentes / (Sesiones activas - Justificadas) x 100`}
                </Text>
              </>
            )}

            {/* ── footer ── */}
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

export default AttendanceMatrixTemplate;
