/**
 * Plantilla PDF - Matriz de Asistencia (landscape A4)
 * Scout x Sesion: P / F / FJ / NA / S/R + pagina de analisis con graficos
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AttendanceMatrixData, CellStatus, MatrixScout } from '../../services/attendanceMatrixService';
import { ReportMetadata } from '../../types/reportTypes';

// ─── layout constants ──────────────────────────────────────────────────────
const PAD = 20;
const PAGE_W = 841 - PAD * 2;   // A4 landscape usable width: 801pt
const NAME_W = 145;
const INGRESO_W = 62;
const REND_W = 80;
const SESSION_POOL = PAGE_W - NAME_W - INGRESO_W - REND_W; // 514pt para sesiones
const ROW_H = 17;
const ROWS_PER_PAGE = 22;

function sessionColW(n: number): number {
  return Math.min(120, Math.max(36, Math.floor(SESSION_POOL / Math.max(n, 1))));
}

// ─── cell color map ────────────────────────────────────────────────────────
const CELL: Record<CellStatus, { bg: string; fg: string; label: string }> = {
  'P':  { bg: '#dcfce7', fg: '#15803d', label: 'P' },
  'F':  { bg: '#fee2e2', fg: '#b91c1c', label: 'F' },
  'FJ': { bg: '#fef9c3', fg: '#92400e', label: 'FJ' },
  'NA': { bg: '#f3f4f6', fg: '#9ca3af', label: 'N/A' },
  '-':  { bg: '#fff7ed', fg: '#d97706', label: 'S/R' },
};

function rendColor(r: number): string {
  if (r >= 80) return '#15803d';
  if (r >= 60) return '#d97706';
  return '#b91c1c';
}

function rankColor(rank: number): string {
  if (rank === 1) return '#d97706'; // oro
  if (rank === 2) return '#64748b'; // plata
  if (rank === 3) return '#b45309'; // bronce
  return '#6b7280';
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
  headerSub:   { fontSize: 7.5, color: '#bfdbfe', textAlign: 'right' },

  // KPI row
  kpiRow:     { flexDirection: 'row', marginBottom: 7 },
  kpiCard:    {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, marginRight: 6,
  },
  kpiCardLast: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8,
  },
  kpiLabel: { fontSize: 6.5, color: '#1e40af' },
  kpiValue: { fontSize: 14, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 2 },

  // table header
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

  // data rows
  trEven: { flexDirection: 'row', backgroundColor: '#ffffff' },
  trOdd:  { flexDirection: 'row', backgroundColor: '#f8fafc' },
  tdName: {
    fontSize: 7, color: '#111827', paddingTop: 3, paddingBottom: 3, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdDate: {
    fontSize: 6.5, color: '#4b5563', textAlign: 'center', paddingTop: 3, paddingBottom: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdRend: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center',
    paddingTop: 3, paddingBottom: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
  },
  cellOuter: {
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  cellText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  // totals row
  totalsRow: {
    flexDirection: 'row', backgroundColor: '#f1f5f9',
    borderTopWidth: 1.5, borderTopColor: '#94a3b8',
  },
  tdTotalLabel: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#374151',
    paddingTop: 3, paddingBottom: 3, paddingLeft: 4,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
  },
  tdTotalCell: {
    paddingTop: 2, paddingBottom: 2,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center',
  },
  tdTotalText: { fontSize: 6, textAlign: 'center' },

  // legend
  legendBox: {
    marginTop: 8, flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4,
    paddingTop: 5, paddingBottom: 5, paddingLeft: 8, paddingRight: 8,
  },
  legendItem:   { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 2 },
  legendSwatch: { width: 11, height: 11, borderRadius: 2, marginRight: 3 },
  legendText:   { fontSize: 6.5, color: '#374151' },
  formulaNote:  { marginTop: 5, fontSize: 6.5, color: '#6b7280', textAlign: 'center' },

  // footer
  footer: {
    marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 4,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: '#9ca3af' },

  // ── analysis page ──────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1f2937',
    marginBottom: 6, marginTop: 2,
  },
  panel: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 5,
    paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
    backgroundColor: '#ffffff',
  },

  // horizontal bars (bar chart & pie legend)
  barRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  barLabel: { fontSize: 7.5, color: '#374151' },
  barTrack: { flex: 1, height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, marginLeft: 8, marginRight: 8 },
  barFill:  { height: 10, borderRadius: 5 },
  barPct:   { width: 32, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // pie simulation (stacked horizontal bar)
  stackedBar: { flexDirection: 'row', height: 18, borderRadius: 4, marginBottom: 6, marginTop: 4 },
  pieRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pieSwatch:  { width: 13, height: 13, borderRadius: 3, marginRight: 6 },
  pieLabel:   { flex: 1, fontSize: 7.5, color: '#374151' },
  pieCount:   { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111827', marginLeft: 6 },

  // vertical bar chart (tendencia por sesion)
  vBarArea:  { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  vBarCol:   { flex: 1, alignItems: 'center' },
  vBarPct:   { fontSize: 5.5, color: '#374151', textAlign: 'center', marginBottom: 2 },
  vBarBlock: { width: 26 },
  vBarLbl:   { fontSize: 5.5, color: '#4b5563', textAlign: 'center', marginTop: 3 },

  // alerts
  alertBox: {
    borderWidth: 1, borderColor: '#fde68a', borderRadius: 5,
    backgroundColor: '#fffbeb', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
  },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  alertName: { fontSize: 7.5, color: '#374151', flex: 3 },
  alertBadge: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#b91c1c' },
});

// ─── component ─────────────────────────────────────────────────────────────

interface Props {
  data: AttendanceMatrixData;
  metadata: ReportMetadata;
  minSessions?: number;
}

const AttendanceMatrixTemplate: React.FC<Props> = ({ data, metadata, minSessions = 4 }) => {
  const { sessions, scouts, globalRendimiento, sessionTotals, dateFrom, dateTo, rama } = data;
  const nSess = sessions.length;
  const colW = sessionColW(nSess);

  // Paginar scouts
  const chunks: MatrixScout[][] = [];
  for (let i = 0; i < Math.max(scouts.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(scouts.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  // +1 para la pagina de analisis
  const matrixPages = chunks.length;
  const totalPages  = matrixPages + 1;

  const ramaLabel = rama ? ` | Rama: ${rama}` : '';
  const genDate   = new Date(metadata.generatedAt).toLocaleDateString('es-PE');

  // ── datos derivados para graficos ────────────────────────────────────────
  const totalP  = scouts.reduce((s, x) => s + x.presente, 0);
  const totalF  = scouts.reduce((s, x) => s + x.falta, 0);
  const totalFJ = scouts.reduce((s, x) => s + x.justificado, 0);
  const grandTotal = totalP + totalF + totalFJ; // excluye NA

  const pctP  = grandTotal > 0 ? Math.round((totalP  / grandTotal) * 100) : 0;
  const pctF  = grandTotal > 0 ? Math.round((totalF  / grandTotal) * 100) : 0;
  const pctFJ = grandTotal > 0 ? Math.round((totalFJ / grandTotal) * 100) : 0;

  // TOP 5 con empates: incluye TODOS los que alcancen el rendimiento del puesto 5
  const eligible = scouts.filter(s => s.totalEvaluadas >= minSessions);
  const top5Threshold = eligible.length >= 5 ? eligible[4].rendimiento : -1;
  const topScouts = eligible.length <= 5
    ? eligible
    : eligible.filter(s => s.rendimiento >= top5Threshold);
  const hasTies = topScouts.length > 5;
  const maxRendTop = Math.max(...topScouts.map(s => s.rendimiento), 1);

  // Standard competition ranking: 1, 2, 3, 3, 5 ... (saltea rangos al romper empate)
  const rankMap = new Map<string, number>();
  let currentRank = 1;
  topScouts.forEach((s, i) => {
    if (i > 0 && s.rendimiento < topScouts[i - 1].rendimiento) currentRank = i + 1;
    rankMap.set(s.id, currentRank);
  });
  // Detectar rangos compartidos por >1 scout
  const rankCounts = new Map<number, number>();
  rankMap.forEach(r => rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1));

  // Tendencia por sesion: % presentes de cada sesion
  const sessionTrend = sessions.map(sess => {
    const t = sessionTotals[sess.id] ?? { P: 0, F: 0, FJ: 0, NA: 0, total: 0 };
    const denom = t.P + t.F + t.FJ;
    return { label: sess.label, pct: denom > 0 ? Math.round((t.P / denom) * 100) : 0, P: t.P, F: t.F };
  });
  const maxTrend = Math.max(...sessionTrend.map(s => s.pct), 1);
  const VBAR_MAX_H = 90; // altura maxima en puntos para la barra mas alta

  // Alertas: rendimiento < 60% con >= minSessions sesiones activas
  const alerts = scouts.filter(s => s.rendimiento < 60 && s.totalEvaluadas >= minSessions);

  // Estado general
  const estado = globalRendimiento >= 80 ? 'CUMPLIDA' : globalRendimiento >= 60 ? 'EN RIESGO' : 'INCUMPLIDA';
  const estadoColor = globalRendimiento >= 80 ? '#15803d' : globalRendimiento >= 60 ? '#d97706' : '#b91c1c';

  return (
    <Document>

      {/* ═══════════════ PAGINAS DE MATRIZ ═══════════════ */}
      {chunks.map((pageScouts, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast  = pageIdx === matrixPages - 1;

        return (
          <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>

            <View style={S.headerBar}>
              <Text style={S.headerTitle}>Matriz de Asistencia por Scout</Text>
              <Text style={S.headerSub}>
                {`${fmtISO(dateFrom)} al ${fmtISO(dateTo)}${ramaLabel} | Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {/* KPIs solo pagina 1 */}
            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Rendimiento Global</Text>
                  <Text style={[S.kpiValue, { color: rendColor(globalRendimiento) }]}>{`${globalRendimiento}%`}</Text>
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
                  <Text style={S.kpiLabel}>{`Rendimiento alto (>=80%)`}</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>
                    {`${scouts.filter(s => s.rendimiento >= 80).length}`}
                  </Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>{`Rendimiento bajo (<60%)`}</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>
                    {`${scouts.filter(s => s.rendimiento < 60 && s.totalEvaluadas > 0).length}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Cabecera de tabla */}
            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NAME_W }]}>Scout</Text>
              <Text style={[S.th, { width: INGRESO_W }]}>F. Ingreso</Text>
              {sessions.map(sess => (
                <Text key={sess.id} style={[S.th, { width: colW }]}>{sess.label}</Text>
              ))}
              <Text style={[S.th, { width: REND_W, borderRightWidth: 0 }]}>% Rend.</Text>
            </View>

            {/* Filas de scouts */}
            {pageScouts.map((scout, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
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
                      <View key={sess.id} style={[S.cellOuter, { width: colW, height: ROW_H, backgroundColor: cc.bg }]}>
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

            {/* Fila de totales (ultima pagina de matriz) */}
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

            {isFirst && scouts.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>No se encontraron scouts activos en este periodo.</Text>
              </View>
            )}

            {/* Leyenda (ultima pagina de matriz) */}
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

            <View style={S.footer}>
              <Text style={S.footerText}>{`${metadata.organizacion} | ${metadata.version}`}</Text>
              <Text style={S.footerText}>{`Pag ${pageIdx + 1}/${totalPages}`}</Text>
            </View>

          </Page>
        );
      })}

      {/* ═══════════════ PAGINA DE ANALISIS (GRAFICOS) ═══════════════ */}
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* Header */}
        <View style={S.headerBar}>
          <Text style={S.headerTitle}>Analisis de Asistencia — Graficos y Tendencias</Text>
          <Text style={S.headerSub}>
            {`${fmtISO(dateFrom)} al ${fmtISO(dateTo)}${ramaLabel} | Pag ${totalPages}/${totalPages}`}
          </Text>
        </View>

        {/* ── Fila 1: Distribucion global + TOP 5 ── */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>

          {/* Panel izquierdo: Grafico de Pastel (simulado) */}
          <View style={[S.panel, { width: 260, marginRight: 10 }]}>
            <Text style={S.sectionTitle}>Distribucion Global del Periodo</Text>

            {/* Barra apilada: P | FJ | F */}
            {grandTotal > 0 ? (
              <View style={S.stackedBar}>
                {pctP  > 0 && <View style={{ width: `${pctP}%`,  height: 18, backgroundColor: '#16a34a' }} />}
                {pctFJ > 0 && <View style={{ width: `${pctFJ}%`, height: 18, backgroundColor: '#d97706' }} />}
                {pctF  > 0 && <View style={{ width: `${pctF}%`,  height: 18, backgroundColor: '#b91c1c' }} />}
              </View>
            ) : (
              <View style={[S.stackedBar, { backgroundColor: '#e5e7eb' }]} />
            )}

            {/* Leyenda del pastel */}
            {[
              { label: 'Presentes (P)',     value: totalP,  pct: pctP,  color: '#16a34a' },
              { label: 'Justificadas (FJ)', value: totalFJ, pct: pctFJ, color: '#d97706' },
              { label: 'Faltas (F)',         value: totalF,  pct: pctF,  color: '#b91c1c' },
            ].map(item => (
              <View key={item.label} style={S.pieRow}>
                <View style={[S.pieSwatch, { backgroundColor: item.color }]} />
                <Text style={S.pieLabel}>{item.label}</Text>
                <Text style={[S.pieCount, { color: item.color }]}>{`${item.value} (${item.pct}%)`}</Text>
              </View>
            ))}

            {/* Badge de estado */}
            <View style={{
              marginTop: 8, paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10,
              backgroundColor: globalRendimiento >= 80 ? '#dcfce7' : globalRendimiento >= 60 ? '#fef9c3' : '#fee2e2',
              borderRadius: 4, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 8, color: estadoColor, fontFamily: 'Helvetica-Bold' }}>
                {`META 80% — ${estado}  |  Rendimiento: ${globalRendimiento}%`}
              </Text>
            </View>
          </View>

          {/* Panel derecho: TOP 5 Ranking — Barras horizontales */}
          <View style={[S.panel, { flex: 1 }]}>
            <Text style={S.sectionTitle}>
              {hasTies ? 'Top 5 (Con Empates) — Mayor Rendimiento Real' : 'Top 5 Scout — Mayor Rendimiento Real'}
            </Text>
            <Text style={{ fontSize: 6.5, color: '#6b7280', marginBottom: 8 }}>
              {`Solo scouts con >= ${minSessions} sesion${minSessions !== 1 ? 'es' : ''} activa${minSessions !== 1 ? 's' : ''} en el periodo.${hasTies ? ' Se muestran todos los empatados en el puesto 5.' : ''}`}
            </Text>

            {topScouts.length > 0 ? topScouts.map((s) => {
              const rank = rankMap.get(s.id) ?? 1;
              const empate = (rankCounts.get(rank) ?? 1) > 1;
              return (
                <View key={s.id} style={S.barRow}>
                  {/* Numero de posicion con color de medalla */}
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: rankColor(rank), width: 18, textAlign: 'right', marginRight: 4 }}>
                    {`${rank}.`}
                  </Text>
                  {/* Nombre */}
                  <Text style={[S.barLabel, { width: 130 }]} numberOfLines={1}>
                    {`${s.apellidos}, ${s.nombres}`}
                  </Text>
                  {/* Badge empate */}
                  {empate ? (
                    <View style={{ backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde047', borderRadius: 3, paddingLeft: 3, paddingRight: 3, marginRight: 4 }}>
                      <Text style={{ fontSize: 5.5, color: '#92400e', fontFamily: 'Helvetica-Bold' }}>EMPATE</Text>
                    </View>
                  ) : <View style={{ width: 0 }} />}
                  {/* Barra */}
                  <View style={S.barTrack}>
                    <View style={[S.barFill, {
                      backgroundColor: rendColor(s.rendimiento),
                      width: `${Math.max(4, Math.round((s.rendimiento / maxRendTop) * 100))}%`,
                    }]} />
                  </View>
                  {/* Porcentaje */}
                  <Text style={[S.barPct, { color: rendColor(s.rendimiento) }]}>
                    {`${s.rendimiento}%`}
                  </Text>
                  {/* Detalle */}
                  <Text style={{ fontSize: 6.5, color: '#9ca3af', width: 55, textAlign: 'right' }}>
                    {`${s.presente}P / ${s.falta}F / ${s.justificado}FJ`}
                  </Text>
                </View>
              );
            }) : (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 10 }}>
                {`No hay scouts con >= ${minSessions} sesiones activas en este periodo.`}
              </Text>
            )}
          </View>

        </View>

        {/* ── Fila 2: Tendencia por sesion — Barras verticales ── */}
        <View style={[S.panel, { marginBottom: 10 }]}>
          <Text style={S.sectionTitle}>Tendencia de Asistencia por Sesion (% presentes)</Text>

          {sessionTrend.length > 0 ? (
            <View style={[S.vBarArea, { height: VBAR_MAX_H + 30 }]}>
              {sessionTrend.map((sess, i) => {
                const barH = Math.max(4, Math.round((sess.pct / maxTrend) * VBAR_MAX_H));
                const color = rendColor(sess.pct);
                return (
                  <View key={i} style={S.vBarCol}>
                    {/* Spacer empuja la barra hacia abajo */}
                    <View style={{ flex: 1 }} />
                    <Text style={[S.vBarPct, { color }]}>{`${sess.pct}%`}</Text>
                    <View style={[S.vBarBlock, { height: barH, backgroundColor: color }]} />
                    <Text style={S.vBarLbl} numberOfLines={1}>{sess.label}</Text>
                    <Text style={[S.vBarLbl, { color: '#15803d' }]}>{`${sess.P}P`}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 8, color: '#9ca3af' }}>Sin datos de sesiones para graficar.</Text>
          )}
        </View>

        {/* ── Fila 3: Alertas automaticas ── */}
        <View style={S.alertBox}>
          <Text style={[S.sectionTitle, { color: '#92400e', marginTop: 0 }]}>
            {`Alertas Automaticas — Scouts con rendimiento critico (<60%, min. ${minSessions} sesion${minSessions !== 1 ? 'es' : ''} activa${minSessions !== 1 ? 's' : ''})`}
          </Text>

          {alerts.length > 0 ? alerts.slice(0, 8).map(s => (
            <View key={s.id} style={S.alertRow}>
              <Text style={S.alertName}>{`${s.apellidos}, ${s.nombres} (${s.codigo})`}</Text>
              <Text style={[S.alertBadge, { color: rendColor(s.rendimiento) }]}>
                {`${s.rendimiento}%  —  ${s.presente}P / ${s.falta}F / ${s.justificado}FJ de ${s.totalEvaluadas} sesiones activas`}
              </Text>
            </View>
          )) : (
            <Text style={{ fontSize: 8, color: '#15803d' }}>
              {`Sin alertas criticas. Todos los scouts con >= ${minSessions} sesiones activas superan el 60% de rendimiento.`}
            </Text>
          )}
        </View>

        <View style={S.footer}>
          <Text style={S.footerText}>{`${metadata.organizacion} | ${metadata.version}`}</Text>
          <Text style={S.footerText}>{`Formula: % Rend = Presentes / (Sesiones activas - Justificadas) x 100`}</Text>
          <Text style={S.footerText}>{`Pag ${totalPages}/${totalPages}`}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default AttendanceMatrixTemplate;
