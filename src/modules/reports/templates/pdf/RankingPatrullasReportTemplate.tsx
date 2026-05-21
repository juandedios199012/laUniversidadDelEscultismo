/**
 * Plantilla PDF para Reporte de Ranking de Patrullas
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { baseStyles } = commonStyles;

interface RankingPatrullasReportProps {
  data: any[];
  metadata: ReportMetadata;
  dateRange?: { from: string; to: string };
}

interface PuntajeItem {
  fecha?: string;
  concepto?: string;
  puntos?: number;
  motivo?: string;
}

interface PatrullaRow {
  patrullaId?: string;
  patrullaNombre: string;
  rama?: string;
  totalPuntos: number;
  posicion?: number;
  puntajes: PuntajeItem[];
}

const styles = StyleSheet.create({
  ...baseStyles,
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 24,
  },
  podiumItem: {
    width: 150,
    alignItems: 'center',
  },
  medal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gold: {
    backgroundColor: '#ffd700',
  },
  silver: {
    backgroundColor: '#c0c0c0',
  },
  bronze: {
    backgroundColor: '#cd7f32',
  },
  medalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  patrullaName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  patrullaPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  tableCol: {
    fontSize: 10,
    paddingHorizontal: 4,
  },
  position: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailSection: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
  },
  dashboardHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  dashboardIntro: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 1.45,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCard: {
    width: '24%',
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#1e40af',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  trendLabel: {
    width: 56,
    fontSize: 8,
    color: '#4b5563',
  },
  trendTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    marginRight: 6,
  },
  trendFill: {
    height: 10,
    backgroundColor: '#2563eb',
    borderRadius: 5,
  },
  trendValue: {
    width: 34,
    textAlign: 'right',
    fontSize: 8,
    color: '#111827',
    fontWeight: 'bold',
  },
  grid2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  panel: {
    width: '49%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  histogramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  histogramLabel: {
    width: 72,
    fontSize: 8,
    color: '#4b5563',
  },
  histogramValue: {
    fontSize: 8,
    color: '#111827',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.35,
  },
  topBottomHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 4,
  },
  topBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4,
  },
  sparkTrack: {
    width: 64,
    height: 7,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  sparkFill: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
  },
  alertBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  legendBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
});

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizePuntajes(value: unknown): PuntajeItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((p: any) => ({
    fecha: p?.fecha,
    concepto: p?.concepto || p?.motivo || 'Actividad',
    puntos: toNumber(p?.puntos),
    motivo: p?.motivo,
  }));
}

function monthKey(dateValue?: string): string {
  if (!dateValue) return 'Sin fecha';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
}

function getMonthIndex(dateValue?: string): number {
  if (!dateValue) return -1;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return -1;
  return d.getFullYear() * 12 + d.getMonth();
}

function getTrendForPatrulla(row: PatrullaRow): { prev: number; curr: number; delta: number } {
  const byMonth = new Map<number, number>();
  row.puntajes.forEach((p) => {
    const m = getMonthIndex(p.fecha);
    if (m >= 0) byMonth.set(m, (byMonth.get(m) || 0) + toNumber(p.puntos));
  });
  const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0]);
  const curr = sorted.length > 0 ? sorted[sorted.length - 1][1] : 0;
  const prev = sorted.length > 1 ? sorted[sorted.length - 2][1] : 0;
  return { prev, curr, delta: curr - prev };
}

function pctDelta(prev: number, curr: number): number {
  if (prev <= 0 && curr > 0) return 100;
  if (prev <= 0 && curr <= 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

const RankingPatrullasReportTemplate: React.FC<RankingPatrullasReportProps> = ({
  data,
  metadata,
  dateRange,
}) => {
  const enrichedData: PatrullaRow[] = (data || []).map((item) => ({
    patrullaId: item?.patrullaId,
    patrullaNombre: item?.patrullaNombre || 'Patrulla',
    rama: item?.rama || 'Sin rama',
    totalPuntos: toNumber(item?.totalPuntos),
    posicion: toNumber(item?.posicion) || undefined,
    puntajes: normalizePuntajes(item?.puntajes),
  }));

  const top3 = enrichedData.slice(0, 3);
  const totalPatrullas = enrichedData.length;
  const totalPuntos = enrichedData.reduce((acc, row) => acc + row.totalPuntos, 0);
  const promedioPuntos = totalPatrullas > 0 ? Math.round(totalPuntos / totalPatrullas) : 0;
  const maxPuntos = Math.max(...enrichedData.map((row) => row.totalPuntos), 0);
  const minPuntos = enrichedData.length > 0 ? Math.min(...enrichedData.map((row) => row.totalPuntos)) : 0;
  const brechaTopBottom = Math.max(0, maxPuntos - minPuntos);

  const topPatrullaConDetalle = enrichedData.find((row) => row.puntajes.length > 0) || enrichedData[0];

  const monthlyMap = new Map<string, number>();
  enrichedData.forEach((row) => {
    row.puntajes.forEach((p) => {
      const key = monthKey(p.fecha);
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + toNumber(p.puntos));
    });
  });

  const trendData = Array.from(monthlyMap.entries())
    .map(([periodo, puntos]) => ({ periodo, puntos }))
    .slice(-6);
  const maxTrend = Math.max(...trendData.map((t) => t.puntos), 1);

  const highThreshold = Math.max(promedioPuntos + 10, 1);
  const midThreshold = Math.max(promedioPuntos - 10, 0);

  const histo = {
    alto: enrichedData.filter((row) => row.totalPuntos >= highThreshold).length,
    medio: enrichedData.filter((row) => row.totalPuntos < highThreshold && row.totalPuntos >= midThreshold).length,
    bajo: enrichedData.filter((row) => row.totalPuntos < midThreshold).length,
  };

  const top3Points = top3.reduce((acc, r) => acc + r.totalPuntos, 0);
  const top3Share = totalPuntos > 0 ? Math.round((top3Points / totalPuntos) * 100) : 0;

  const statusFor = (puntos: number): { label: string; color: string } => {
    if (puntos >= highThreshold) return { label: 'Muy bien', color: '#16a34a' };
    if (puntos >= midThreshold) return { label: 'En progreso', color: '#f59e0b' };
    return { label: 'A reforzar', color: '#ef4444' };
  };

  const top5 = enrichedData.slice(0, 5);
  const bottom5 = [...enrichedData].slice(-5).reverse();

  const alertCandidates = enrichedData
    .map((row) => {
      const tr = getTrendForPatrulla(row);
      return {
        nombre: row.patrullaNombre,
        total: row.totalPuntos,
        prev: tr.prev,
        curr: tr.curr,
        delta: tr.delta,
        deltaPct: pctDelta(tr.prev, tr.curr),
      };
    })
    .filter((a) => a.prev > 0 || a.curr > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);

  const strongestUp = [...alertCandidates].sort((a, b) => b.delta - a.delta)[0];
  const strongestDown = [...alertCandidates].sort((a, b) => a.delta - b.delta)[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ranking de Patrullas</Text>
          {dateRange && (
            <Text style={styles.subtitle}>
              Del {new Date(dateRange.from).toLocaleDateString('es-PE')} al {new Date(dateRange.to).toLocaleDateString('es-PE')}
            </Text>
          )}
          <Text style={styles.date}>Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}</Text>
        </View>

        {top3.length >= 3 && (
          <View style={styles.podium}>
            <View style={styles.podiumItem}>
              <View style={[styles.medal, styles.silver]}>
                <Text style={styles.medalText}>2</Text>
              </View>
              <Text style={styles.patrullaName}>{top3[1]?.patrullaNombre}</Text>
              <Text style={styles.patrullaPoints}>{top3[1]?.totalPuntos} pts</Text>
            </View>

            <View style={[styles.podiumItem, { marginTop: -20 }]}>
              <View style={[styles.medal, styles.gold, { width: 60, height: 60, borderRadius: 30 }]}>
                <Text style={[styles.medalText, { fontSize: 28 }]}>1</Text>
              </View>
              <Text style={[styles.patrullaName, { fontSize: 14 }]}>{top3[0]?.patrullaNombre}</Text>
              <Text style={[styles.patrullaPoints, { fontSize: 16 }]}>{top3[0]?.totalPuntos} pts</Text>
            </View>

            <View style={styles.podiumItem}>
              <View style={[styles.medal, styles.bronze]}>
                <Text style={styles.medalText}>3</Text>
              </View>
              <Text style={styles.patrullaName}>{top3[2]?.patrullaNombre}</Text>
              <Text style={styles.patrullaPoints}>{top3[2]?.totalPuntos} pts</Text>
            </View>
          </View>
        )}

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, styles.position]}>Pos</Text>
            <Text style={[styles.tableCol, { flex: 3 }]}>Patrulla</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>Rama</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Puntos</Text>
          </View>

          {enrichedData.map((patrulla, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.position]}>{patrulla.posicion || index + 1}</Text>
              <Text style={[styles.tableCol, { flex: 3 }]}>{patrulla.patrullaNombre}</Text>
              <Text style={[styles.tableCol, { flex: 1 }]}>{patrulla.rama}</Text>
              <Text style={[styles.tableCol, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }]}>
                {patrulla.totalPuntos}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>{metadata.organizacion} | {metadata.version}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard Visual - Hoja 2</Text>
          <Text style={styles.subtitle}>Lectura simple con tendencias y alertas</Text>
          <Text style={styles.date}>Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}</Text>
        </View>

        <Text style={styles.dashboardHeader}>1) Resumen rápido</Text>
        <Text style={styles.dashboardIntro}>
          Si tienes 11 años o más, léelo así: primero mira los cuadros azules, después la tendencia,
          luego Top 5 vs Bottom 5 y al final las alertas. En 1 minuto entiendes qué equipo va mejor
          y cuál necesita apoyo.
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Patrullas evaluadas</Text>
            <Text style={styles.kpiValue}>{totalPatrullas}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Puntos totales</Text>
            <Text style={styles.kpiValue}>{totalPuntos}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Promedio por patrulla</Text>
            <Text style={styles.kpiValue}>{promedioPuntos}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Brecha Top-Último</Text>
            <Text style={styles.kpiValue}>{brechaTopBottom}</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>2) Tendencia de puntos por mes</Text>
        {trendData.length > 0 ? (
          trendData.map((t, idx) => (
            <View key={idx} style={styles.trendRow}>
              <Text style={styles.trendLabel}>{t.periodo}</Text>
              <View style={styles.trendTrack}>
                <View style={[styles.trendFill, { width: `${Math.max(4, Math.round((t.puntos / maxTrend) * 100))}%` }]} />
              </View>
              <Text style={styles.trendValue}>{t.puntos}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.smallText}>No hay suficiente detalle mensual para graficar tendencia.</Text>
        )}

        <View style={styles.grid2}>
          <View style={styles.panel}>
            <Text style={styles.blockTitle}>3) Histograma de desempeño</Text>
            <View style={styles.histogramRow}>
              <Text style={styles.histogramLabel}>Alto (verde)</Text>
              <View style={[styles.trendTrack, { maxWidth: 120 }]}>
                <View style={[styles.trendFill, { backgroundColor: '#16a34a', width: `${Math.max(4, (histo.alto / Math.max(totalPatrullas, 1)) * 100)}%` }]} />
              </View>
              <Text style={styles.histogramValue}>{histo.alto}</Text>
            </View>
            <View style={styles.histogramRow}>
              <Text style={styles.histogramLabel}>Medio (amarillo)</Text>
              <View style={[styles.trendTrack, { maxWidth: 120 }]}>
                <View style={[styles.trendFill, { backgroundColor: '#f59e0b', width: `${Math.max(4, (histo.medio / Math.max(totalPatrullas, 1)) * 100)}%` }]} />
              </View>
              <Text style={styles.histogramValue}>{histo.medio}</Text>
            </View>
            <View style={styles.histogramRow}>
              <Text style={styles.histogramLabel}>Bajo (rojo)</Text>
              <View style={[styles.trendTrack, { maxWidth: 120 }]}>
                <View style={[styles.trendFill, { backgroundColor: '#ef4444', width: `${Math.max(4, (histo.bajo / Math.max(totalPatrullas, 1)) * 100)}%` }]} />
              </View>
              <Text style={styles.histogramValue}>{histo.bajo}</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.blockTitle}>4) Top 5 vs Bottom 5</Text>
            <Text style={[styles.smallText, { marginBottom: 6, color: '#64748b', fontSize: 7, lineHeight: 1.4 }]}>
              Comparacion de los mejores y los que necesitan apoyo:{"\n"}
              • TOP = Los 5 equipos con mas puntos (barra azul){"\n"}
              • BOT = Los 5 equipos con menos puntos (barra naranja){"\n"}
              • Pts = Puntos totales acumulados{"\n"}
              • Var % = Cambio comparado con el mes anterior (verde mejora, rojo retroceso){"\n"}
              TIP: Si un equipo BOT tiene +% verde, significa que esta mejorando aunque este en ultimos lugares.
            </Text>
            <View style={styles.topBottomHeader}>
              <Text style={{ flex: 2, fontSize: 8, fontWeight: 'bold' }}>Patrulla</Text>
              <Text style={{ flex: 1, fontSize: 8, textAlign: 'right', fontWeight: 'bold' }}>Pts</Text>
              <Text style={{ flex: 1, fontSize: 8, textAlign: 'right', fontWeight: 'bold' }}>Var %</Text>
            </View>
            {top5.map((row, idx) => {
              const tr = getTrendForPatrulla(row);
              const varPct = pctDelta(tr.prev, tr.curr);
              const sparkWidth = Math.max(5, Math.round((row.totalPuntos / Math.max(maxPuntos, 1)) * 100));
              return (
                <View key={`t-${idx}`} style={styles.topBottomRow}>
                  <Text style={{ flex: 2, fontSize: 8 }}>TOP: {row.patrullaNombre}</Text>
                  <View style={styles.sparkTrack}>
                    <View style={[styles.sparkFill, { width: `${sparkWidth}%`, backgroundColor: '#0ea5e9' }]} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>{row.totalPuntos}</Text>
                  <Text style={{ flex: 1, fontSize: 8, textAlign: 'right', color: varPct >= 0 ? '#16a34a' : '#ef4444' }}>
                    {varPct >= 0 ? '+' : ''}{varPct}%
                  </Text>
                </View>
              );
            })}
            {bottom5.map((row, idx) => {
              const tr = getTrendForPatrulla(row);
              const varPct = pctDelta(tr.prev, tr.curr);
              const sparkWidth = Math.max(5, Math.round((row.totalPuntos / Math.max(maxPuntos, 1)) * 100));
              return (
                <View key={`b-${idx}`} style={styles.topBottomRow}>
                  <Text style={{ flex: 2, fontSize: 8 }}>BOT: {row.patrullaNombre}</Text>
                  <View style={styles.sparkTrack}>
                    <View style={[styles.sparkFill, { width: `${sparkWidth}%`, backgroundColor: '#f97316' }]} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>{row.totalPuntos}</Text>
                  <Text style={{ flex: 1, fontSize: 8, textAlign: 'right', color: varPct >= 0 ? '#16a34a' : '#ef4444' }}>
                    {varPct >= 0 ? '+' : ''}{varPct}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.alertBox}>
          <Text style={[styles.blockTitle, { marginTop: 0 }]}>5) Alertas automáticas</Text>
          {strongestUp ? (
            <View style={styles.alertRow}>
              <Text style={styles.smallText}>Patrulla que más sube:</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#16a34a' }}>
                {strongestUp.nombre} ({strongestUp.delta >= 0 ? '+' : ''}{strongestUp.delta} pts, {strongestUp.deltaPct >= 0 ? '+' : ''}{strongestUp.deltaPct}%)
              </Text>
            </View>
          ) : (
            <Text style={styles.smallText}>No hay suficientes datos para calcular subidas.</Text>
          )}

          {strongestDown ? (
            <View style={styles.alertRow}>
              <Text style={styles.smallText}>Patrulla que más baja:</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#ef4444' }}>
                {strongestDown.nombre} ({strongestDown.delta >= 0 ? '+' : ''}{strongestDown.delta} pts, {strongestDown.deltaPct >= 0 ? '+' : ''}{strongestDown.deltaPct}%)
              </Text>
            </View>
          ) : (
            <Text style={styles.smallText}>No hay suficientes datos para calcular bajadas.</Text>
          )}
        </View>

        <View style={styles.legendBox}>
          <Text style={[styles.blockTitle, { marginTop: 0 }]}>Leyenda simple</Text>
          <Text style={styles.smallText}>- Verde: desempeño alto. Amarillo: desempeño medio. Rojo: necesita apoyo.</Text>
          <Text style={styles.smallText}>- Var % compara el último mes contra el mes anterior.</Text>
          <Text style={styles.smallText}>- Concentración Top 3: {top3Share}% de los puntos totales.</Text>
          <Text style={styles.smallText}>
            - Buena práctica ejecutiva: pocas métricas clave, comparación con promedio, tendencia y alerta accionable.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>{metadata.organizacion} | {metadata.version}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default RankingPatrullasReportTemplate;
