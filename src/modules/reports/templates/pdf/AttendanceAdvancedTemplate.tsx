/**
 * Plantilla PDF avanzada para Reporte de Asistencia
 * KPIs · Tendencia mensual · Ranking por scout · Alertas
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AttendanceData, ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { baseStyles } = commonStyles;

interface Props {
  data: AttendanceData[];
  metadata: ReportMetadata;
  dateRange: { from: string; to: string };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '?';
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
}

function monthIndex(iso: string): number {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? -1 : d.getFullYear() * 12 + d.getMonth();
}

// ─── derivar datos ───────────────────────────────────────────────────────────

interface ScoutStat {
  id: string;
  nombre: string;
  total: number;
  presente: number;
  ausente: number;
  justificado: number;
  tasa: number;
}

function buildStats(data: AttendanceData[]) {
  const total = data.length;
  const presente = data.filter((d) => d.presente).length;
  const justificado = data.filter((d) => !d.presente && d.justificado).length;
  const ausente = data.filter((d) => !d.presente && !d.justificado).length;
  const tasa = total > 0 ? Math.round((presente / total) * 100) : 0;

  // Por scout
  const byScout = new Map<string, ScoutStat>();
  data.forEach((row) => {
    const key = row.scoutId;
    if (!byScout.has(key)) {
      byScout.set(key, { id: key, nombre: row.scoutNombre, total: 0, presente: 0, ausente: 0, justificado: 0, tasa: 0 });
    }
    const s = byScout.get(key)!;
    s.total++;
    if (row.presente) s.presente++;
    else if (row.justificado) s.justificado++;
    else s.ausente++;
  });
  byScout.forEach((s) => { s.tasa = s.total > 0 ? Math.round((s.presente / s.total) * 100) : 0; });

  const scouts = Array.from(byScout.values()).sort((a, b) => b.tasa - a.tasa);
  const totalScouts = scouts.length;

  // Sesiones únicas
  const sesiones = new Set(data.map((d) => d.fecha)).size;

  // Tendencia mensual
  const monthMap = new Map<number, { key: string; presente: number; total: number }>();
  data.forEach((row) => {
    const idx = monthIndex(row.fecha);
    if (idx < 0) return;
    if (!monthMap.has(idx)) monthMap.set(idx, { key: monthKey(row.fecha), presente: 0, total: 0 });
    const m = monthMap.get(idx)!;
    m.total++;
    if (row.presente) m.presente++;
  });
  const tendencia = Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-6)
    .map(([, v]) => ({ mes: v.key, tasa: v.total > 0 ? Math.round((v.presente / v.total) * 100) : 0, total: v.total }));

  return { total, presente, ausente, justificado, tasa, scouts, totalScouts, sesiones, tendencia };
}

// ─── estilos ─────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  ...baseStyles,
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  kpiCard: {
    width: '23%', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#eff6ff',
  },
  kpiLabel: { fontSize: 8, color: '#1e40af', marginBottom: 3 },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  kpiSub: { fontSize: 7, color: '#6b7280', marginTop: 2 },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1f2937', marginTop: 10, marginBottom: 6 },
  smallText: { fontSize: 8, color: '#4b5563' },

  // barras horizontales
  barTrack: { flex: 1, height: 9, backgroundColor: '#e5e7eb', borderRadius: 5, marginHorizontal: 6 },
  barFill: { height: 9, borderRadius: 5 },

  // tendencia
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  trendLabel: { width: 54, fontSize: 8, color: '#4b5563' },
  trendValue: { width: 40, textAlign: 'right', fontSize: 8, fontWeight: 'bold', color: '#111827' },

  // tabla scouts
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#1e40af',
    paddingVertical: 5, paddingHorizontal: 4, borderRadius: 4, marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  thText: { fontSize: 8, fontWeight: 'bold', color: '#fff' },
  tdText: { fontSize: 8, color: '#111827' },

  // torta simulada (leyenda de colores)
  pieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  pieBlock: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
  pieLabel: { fontSize: 9, color: '#374151' },
  pieValue: { fontSize: 9, fontWeight: 'bold', color: '#111827' },

  alertBox: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, backgroundColor: '#fefce8', marginTop: 8 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },

  legendBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, backgroundColor: '#f9fafb', marginTop: 8 },
  grid2: { flexDirection: 'row', justifyContent: 'space-between' },
  panel: { width: '49%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, backgroundColor: '#fff' },
});

// ─── componente ──────────────────────────────────────────────────────────────

const AttendanceAdvancedTemplate: React.FC<Props> = ({ data, metadata, dateRange }) => {
  const st = buildStats(data);
  const maxTrend = Math.max(...st.tendencia.map((t) => t.tasa), 1);
  const top7 = st.scouts.slice(0, 7);
  const bot7 = [...st.scouts].slice(-7).reverse();
  const maxScoutTotal = Math.max(...st.scouts.map((s) => s.total), 1);

  const tasaColor = st.tasa >= 80 ? '#16a34a' : st.tasa >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <Document>
      {/* ══════════════════════════ PÁGINA 1 ══════════════════════════ */}
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Reporte Avanzado de Asistencia</Text>
          <Text style={S.subtitle}>
            {fmtDate(dateRange.from)} – {fmtDate(dateRange.to)} · {metadata.organizacion}
          </Text>
          <Text style={S.date}>Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}</Text>
        </View>

        {/* KPIs */}
        <View style={S.kpiRow}>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Tasa de asistencia</Text>
            <Text style={[S.kpiValue, { color: tasaColor }]}>{st.tasa}%</Text>
            <Text style={S.kpiSub}>{st.sesiones} sesión(es) evaluada(s)</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Presentes</Text>
            <Text style={[S.kpiValue, { color: '#16a34a' }]}>{st.presente}</Text>
            <Text style={S.kpiSub}>de {st.total} registros</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Ausentes</Text>
            <Text style={[S.kpiValue, { color: '#ef4444' }]}>{st.ausente}</Text>
            <Text style={S.kpiSub}>sin justificar</Text>
          </View>
          <View style={S.kpiCard}>
            <Text style={S.kpiLabel}>Justificados</Text>
            <Text style={[S.kpiValue, { color: '#f59e0b' }]}>{st.justificado}</Text>
            <Text style={S.kpiSub}>scouts evaluados: {st.totalScouts}</Text>
          </View>
        </View>

        {/* Distribución de asistencia (leyenda tipo pastel) */}
        <View style={S.grid2}>
          <View style={S.panel}>
            <Text style={S.sectionTitle}>Distribución global</Text>
            {[
              { label: 'Presentes', value: st.presente, color: '#16a34a' },
              { label: 'Ausentes', value: st.ausente, color: '#ef4444' },
              { label: 'Justificados', value: st.justificado, color: '#f59e0b' },
            ].map((item) => (
              <View key={item.label} style={S.pieRow}>
                <View style={[S.pieBlock, { backgroundColor: item.color }]} />
                <Text style={[S.pieLabel, { flex: 1 }]}>{item.label}</Text>
                <View style={[S.barTrack, { maxWidth: 80 }]}>
                  <View style={[S.barFill, {
                    backgroundColor: item.color,
                    width: `${Math.max(4, st.total > 0 ? Math.round((item.value / st.total) * 100) : 0)}%`
                  }]} />
                </View>
                <Text style={[S.pieValue, { marginLeft: 4 }]}>
                  {item.value} ({st.total > 0 ? Math.round((item.value / st.total) * 100) : 0}%)
                </Text>
              </View>
            ))}
            <Text style={[S.smallText, { marginTop: 6 }]}>
              Meta: 80% asistencia. Estado actual: {st.tasa >= 80 ? 'CUMPLIDA' : st.tasa >= 60 ? 'EN RIESGO' : 'INCUMPLIDA'}
            </Text>
          </View>

          <View style={S.panel}>
            <Text style={S.sectionTitle}>Tendencia mensual (%)</Text>
            {st.tendencia.length > 0 ? (
              st.tendencia.map((t, i) => (
                <View key={i} style={S.trendRow}>
                  <Text style={S.trendLabel}>{t.mes}</Text>
                  <View style={S.barTrack}>
                    <View style={[S.barFill, {
                      backgroundColor: t.tasa >= 80 ? '#16a34a' : t.tasa >= 60 ? '#f59e0b' : '#ef4444',
                      width: `${Math.max(4, Math.round((t.tasa / maxTrend) * 100))}%`
                    }]} />
                  </View>
                  <Text style={S.trendValue}>{t.tasa}%</Text>
                </View>
              ))
            ) : (
              <Text style={S.smallText}>No hay detalle mensual disponible.</Text>
            )}
          </View>
        </View>

        {/* Tabla de scouts — TOP 7 */}
        <Text style={S.sectionTitle}>Top 7 mayor asistencia</Text>
        <View style={S.tableHeader}>
          <Text style={[S.thText, { flex: 3 }]}>Scout</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Sesiones</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Pres.</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Aus.</Text>
          <Text style={[S.thText, { width: 80 }]}>Tasa</Text>
          <Text style={[S.thText, { width: 36, textAlign: 'right' }]}>%</Text>
        </View>
        {top7.map((s, i) => (
          <View key={s.id} style={[S.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }]}>
            <Text style={[S.tdText, { flex: 3 }]} numberOfLines={1}>{s.nombre}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center' }]}>{s.total}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center', color: '#16a34a' }]}>{s.presente}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center', color: '#ef4444' }]}>{s.ausente}</Text>
            <View style={[S.barTrack, { width: 80, flex: 0, margin: 0 }]}>
              <View style={[S.barFill, {
                backgroundColor: s.tasa >= 80 ? '#16a34a' : s.tasa >= 60 ? '#f59e0b' : '#ef4444',
                width: `${Math.max(4, s.tasa)}%`
              }]} />
            </View>
            <Text style={[S.tdText, { width: 36, textAlign: 'right', fontWeight: 'bold' }]}>{s.tasa}%</Text>
          </View>
        ))}

        <View style={S.footer}>
          <Text>{metadata.organizacion} | {metadata.version} | Pág. 1/2</Text>
        </View>
      </Page>

      {/* ══════════════════════════ PÁGINA 2 ══════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.title}>Reporte Avanzado de Asistencia — Análisis Detallado</Text>
          <Text style={S.date}>Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}</Text>
        </View>

        {/* Bottom 7 */}
        <Text style={S.sectionTitle}>Scouts que necesitan seguimiento (menor asistencia)</Text>
        <View style={S.tableHeader}>
          <Text style={[S.thText, { flex: 3 }]}>Scout</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Sesiones</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Pres.</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Aus.</Text>
          <Text style={[S.thText, { width: 40, textAlign: 'center' }]}>Just.</Text>
          <Text style={[S.thText, { width: 80 }]}>Tasa</Text>
          <Text style={[S.thText, { width: 36, textAlign: 'right' }]}>%</Text>
        </View>
        {bot7.map((s, i) => (
          <View key={s.id} style={[S.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#fef2f2' }]}>
            <Text style={[S.tdText, { flex: 3 }]} numberOfLines={1}>{s.nombre}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center' }]}>{s.total}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center', color: '#16a34a' }]}>{s.presente}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center', color: '#ef4444' }]}>{s.ausente}</Text>
            <Text style={[S.tdText, { width: 40, textAlign: 'center', color: '#f59e0b' }]}>{s.justificado}</Text>
            <View style={[S.barTrack, { width: 80, flex: 0, margin: 0 }]}>
              <View style={[S.barFill, {
                backgroundColor: s.tasa >= 80 ? '#16a34a' : s.tasa >= 60 ? '#f59e0b' : '#ef4444',
                width: `${Math.max(4, s.tasa)}%`
              }]} />
            </View>
            <Text style={[S.tdText, { width: 36, textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }]}>{s.tasa}%</Text>
          </View>
        ))}

        {/* Frecuencia de sesiones por scout */}
        <Text style={S.sectionTitle}>Frecuencia de participación por scout (sesiones totales)</Text>
        {st.scouts.slice(0, 12).map((s, i) => (
          <View key={s.id} style={[S.trendRow, { marginBottom: 4 }]}>
            <Text style={[S.trendLabel, { width: 120 }]} numberOfLines={1}>{s.nombre}</Text>
            <View style={S.barTrack}>
              <View style={[S.barFill, {
                backgroundColor: '#2563eb',
                width: `${Math.max(4, Math.round((s.total / maxScoutTotal) * 100))}%`
              }]} />
            </View>
            <Text style={S.trendValue}>{s.total}</Text>
          </View>
        ))}

        {/* Alertas */}
        <View style={S.alertBox}>
          <Text style={[S.sectionTitle, { marginTop: 0, color: '#92400e' }]}>Alertas automáticas</Text>
          {st.scouts.filter((s) => s.tasa < 60 && s.total >= 2).slice(0, 5).length > 0 ? (
            st.scouts.filter((s) => s.tasa < 60 && s.total >= 2).slice(0, 5).map((s) => (
              <View key={s.id} style={S.alertRow}>
                <Text style={[S.smallText, { flex: 3 }]}>{s.nombre}</Text>
                <Text style={[S.smallText, { color: '#ef4444', fontWeight: 'bold' }]}>
                  {s.tasa}% — {s.ausente} ausencia(s) sin justificar
                </Text>
              </View>
            ))
          ) : (
            <Text style={S.smallText}>Sin alertas críticas en el período seleccionado.</Text>
          )}
        </View>

        {/* Leyenda */}
        <View style={S.legendBox}>
          <Text style={[S.sectionTitle, { marginTop: 0 }]}>Leyenda de colores</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { color: '#16a34a', label: 'Óptimo (≥80%)' },
              { color: '#f59e0b', label: 'En riesgo (60–79%)' },
              { color: '#ef4444', label: 'Crítico (<60%)' },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <View style={[S.pieBlock, { backgroundColor: item.color }]} />
                <Text style={S.smallText}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[S.smallText, { marginTop: 4 }]}>
            Criterio de seguimiento: scouts con menos de 60% y al menos 2 sesiones registradas.
          </Text>
        </View>

        <View style={S.footer}>
          <Text>{metadata.organizacion} | {metadata.version} | Pág. 2/2</Text>
        </View>
      </Page>
    </Document>
  );
};

export default AttendanceAdvancedTemplate;
