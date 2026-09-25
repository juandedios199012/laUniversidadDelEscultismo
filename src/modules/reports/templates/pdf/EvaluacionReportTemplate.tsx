/**
 * Plantilla PDF para el Reporte de Evaluación (módulo Evaluación).
 *
 * Estructura pensada para dirigentes NO técnicos, estilo resumen
 * ejecutivo primero / detalle al final (como un informe de UNESCO,
 * ONU o una consultora): conclusiones en una página, después los
 * rankings y gráficos, y todo el detalle crudo (todas las respuestas
 * de texto, todos los enunciados) al final como anexo — no se omite
 * ningún dato, solo se reordena.
 *
 * El "análisis de sentimiento" y las "menciones de dirigentes" son
 * clasificación por palabras clave (ver src/utils/analisisTextoLibre.ts),
 * no un modelo de IA — se lo aclara explícitamente en el propio PDF.
 */
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { colors, spacing, fontSizes } = commonStyles;

export interface RankingItem {
  codigo?: string;
  etiqueta: string;
  promedio: number;
  colorSemaforo: string;
  emojiSemaforo: string;
}

export interface MencionPersonaPdf {
  nombre: string;
  menciones: number;
  positivas: number;
  negativas: number;
  neutras: number;
}

export interface RespuestaAbiertaPdf {
  enunciado: string;
  respuestas: Array<{ texto: string; respondiente: string }>;
}

export interface EvaluacionReportData {
  titulo: string;
  descripcion?: string;
  escalaMin: number;
  escalaMax: number;
  totalRespuestas: number;
  promedioGeneral: number | null;
  colorSemaforoGeneral: string;
  emojiSemaforoGeneral: string;
  labelSemaforoGeneral: string;
  categorias: RankingItem[]; // ranked mejor -> peor
  enunciados: RankingItem[]; // ranked peor -> mejor
  patrullas: RankingItem[];
  sentimiento: { positivas: number; negativas: number; neutras: number; total: number };
  palabrasFrecuentes: Array<{ palabra: string; frecuencia: number }>;
  mencionesJefes: MencionPersonaPdf[];
  conclusiones: string[];
  respuestasAbiertas: RespuestaAbiertaPdf[];
}

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: fontSizes.body, color: colors.dark },
  header: { marginBottom: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 2, borderBottomColor: colors.primary },
  kicker: { fontSize: fontSizes.tiny, color: colors.gray, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.primary, marginTop: 2 },
  meta: { fontSize: fontSizes.small, color: colors.gray, marginTop: 4 },

  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.dark, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionCaption: { fontSize: fontSizes.tiny, color: colors.gray, marginBottom: spacing.sm },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  kpiCard: { flex: 1, padding: spacing.sm, backgroundColor: colors.light, borderRadius: 4 },
  kpiLabel: { fontSize: fontSizes.tiny, color: colors.gray },
  kpiValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.dark, marginTop: 2 },

  conclusionBox: { padding: spacing.md, backgroundColor: '#EFF6FF', borderLeftWidth: 4, borderLeftColor: colors.primary, borderRadius: 2, marginBottom: spacing.md },
  conclusionItem: { flexDirection: 'row', marginBottom: 5 },
  conclusionBullet: { width: 12, fontSize: fontSizes.body, color: colors.primary },
  conclusionText: { flex: 1, fontSize: fontSizes.small, lineHeight: 1.4, color: colors.dark },

  rankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  rankBadge: { width: 22, fontSize: fontSizes.small, textAlign: 'center' },
  rankLabel: { flex: 1, fontSize: fontSizes.small, color: colors.dark },
  rankBarTrack: { width: 130, height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, marginHorizontal: 6, overflow: 'hidden' },
  rankBarFill: { height: 7, borderRadius: 4 },
  rankValue: { width: 26, fontSize: fontSizes.small, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  sentimentRow: { flexDirection: 'row', height: 18, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  sentimentLegendRow: { flexDirection: 'row', gap: 12 },
  sentimentLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentimentDot: { width: 8, height: 8, borderRadius: 4 },
  sentimentLegendText: { fontSize: fontSizes.tiny, color: colors.gray },

  wordCloudBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs },
  wordChip: { fontSize: fontSizes.small, color: colors.primary, fontFamily: 'Helvetica-Bold' },

  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 5, paddingHorizontal: 6, borderRadius: 3 },
  tableHeaderCell: { fontSize: fontSizes.tiny, color: colors.white, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableCell: { fontSize: fontSizes.small, color: colors.dark },

  quoteBox: { marginBottom: 6, padding: 6, backgroundColor: colors.light, borderRadius: 3 },
  quoteText: { fontSize: fontSizes.small, color: colors.dark, fontStyle: 'italic' },
  quoteAuthor: { fontSize: fontSizes.tiny, color: colors.gray, marginTop: 2 },

  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: fontSizes.tiny, color: colors.gray },

  disclaimer: { fontSize: fontSizes.tiny, color: colors.gray, marginTop: spacing.sm, lineHeight: 1.4 },
});

function RankingList({ items, mostrarCodigo }: { items: RankingItem[]; mostrarCodigo?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.promedio));
  return (
    <View>
      {items.map((it, idx) => (
        <View key={`${it.etiqueta}-${idx}`} style={styles.rankRow} wrap={false}>
          {mostrarCodigo && <Text style={styles.rankBadge}>{it.codigo}</Text>}
          <Text style={styles.rankLabel}>{it.emojiSemaforo} {it.etiqueta}</Text>
          <View style={styles.rankBarTrack}>
            <View style={[styles.rankBarFill, { width: `${Math.max(4, (it.promedio / max) * 100)}%`, backgroundColor: it.colorSemaforo }]} />
          </View>
          <Text style={styles.rankValue}>{it.promedio}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ metadata }: { metadata: ReportMetadata }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{metadata.organizacion} · Reporte de Evaluación</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export default function EvaluacionReportTemplate({ data, metadata }: { data: EvaluacionReportData; metadata: ReportMetadata }) {
  const {
    titulo, descripcion, escalaMin, escalaMax, totalRespuestas, promedioGeneral,
    colorSemaforoGeneral, emojiSemaforoGeneral, labelSemaforoGeneral,
    categorias, enunciados, patrullas, sentimiento, palabrasFrecuentes, mencionesJefes,
    conclusiones, respuestasAbiertas,
  } = data;

  const totalSentimiento = sentimiento.total || 1;
  const maxFrecuencia = palabrasFrecuentes[0]?.frecuencia || 1;
  const jefesPositivos = [...mencionesJefes].sort((a, b) => b.positivas - a.positivas).filter((m) => m.positivas > 0).slice(0, 5);
  const jefesNegativos = [...mencionesJefes].sort((a, b) => b.negativas - a.negativas).filter((m) => m.negativas > 0).slice(0, 5);

  return (
    <Document>
      {/* ================= PÁGINA 1: RESUMEN EJECUTIVO ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Reporte de evaluación · resumen ejecutivo</Text>
          <Text style={styles.title}>{titulo}</Text>
          {descripcion ? <Text style={styles.meta}>{descripcion}</Text> : null}
          <Text style={styles.meta}>
            Generado el {new Date(metadata.generatedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {totalRespuestas} respuesta(s) · Escala {escalaMin} a {escalaMax}
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Respuestas</Text>
            <Text style={styles.kpiValue}>{totalRespuestas}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: `${colorSemaforoGeneral}1A` }]}>
            <Text style={styles.kpiLabel}>Estado general</Text>
            <Text style={[styles.kpiValue, { color: colorSemaforoGeneral }]}>{emojiSemaforoGeneral} {labelSemaforoGeneral}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Promedio general</Text>
            <Text style={styles.kpiValue}>{promedioGeneral ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.conclusionBox}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>En resumen</Text>
          {conclusiones.map((c, idx) => (
            <View key={idx} style={styles.conclusionItem}>
              <Text style={styles.conclusionBullet}>•</Text>
              <Text style={styles.conclusionText}>{c}</Text>
            </View>
          ))}
        </View>

        {categorias.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Categorías mejor calificadas</Text>
            <Text style={styles.sectionCaption}>De mejor a peor promedio.</Text>
            <RankingList items={categorias} />
          </View>
        )}

        {patrullas.length > 1 && (
          <View>
            <Text style={styles.sectionTitle}>Comparativo por patrulla</Text>
            <RankingList items={patrullas} />
          </View>
        )}

        <Footer metadata={metadata} />
      </Page>

      {/* ================= PÁGINA 2: CLIMA / COMENTARIOS ================= */}
      {(sentimiento.total > 0 || palabrasFrecuentes.length > 0 || mencionesJefes.length > 0) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Clima del equipo — respuestas abiertas</Text>
          <Text style={styles.sectionCaption}>
            Clasificación por palabras clave (léxico positivo/negativo curado a mano) — no es un modelo de inteligencia artificial. No detecta sarcasmo ni negaciones complejas.
          </Text>

          {sentimiento.total > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { fontSize: 11, marginTop: 4 }]}>Tono de los comentarios</Text>
              <View style={styles.sentimentRow}>
                <View style={{ width: `${(sentimiento.positivas / totalSentimiento) * 100}%`, backgroundColor: colors.success }} />
                <View style={{ width: `${(sentimiento.neutras / totalSentimiento) * 100}%`, backgroundColor: '#CBD5E1' }} />
                <View style={{ width: `${(sentimiento.negativas / totalSentimiento) * 100}%`, backgroundColor: colors.error }} />
              </View>
              <View style={styles.sentimentLegendRow}>
                <View style={styles.sentimentLegendItem}><View style={[styles.sentimentDot, { backgroundColor: colors.success }]} /><Text style={styles.sentimentLegendText}>Positivo {sentimiento.positivas} ({Math.round((sentimiento.positivas / totalSentimiento) * 100)}%)</Text></View>
                <View style={styles.sentimentLegendItem}><View style={[styles.sentimentDot, { backgroundColor: '#CBD5E1' }]} /><Text style={styles.sentimentLegendText}>Neutro {sentimiento.neutras}</Text></View>
                <View style={styles.sentimentLegendItem}><View style={[styles.sentimentDot, { backgroundColor: colors.error }]} /><Text style={styles.sentimentLegendText}>Negativo {sentimiento.negativas}</Text></View>
              </View>
            </View>
          )}

          {palabrasFrecuentes.length >= 3 && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { fontSize: 11, marginTop: 4 }]}>Palabras más usadas</Text>
              <View style={styles.wordCloudBox}>
                {palabrasFrecuentes.slice(0, 20).map((p) => (
                  <Text key={p.palabra} style={[styles.wordChip, { fontSize: 8 + (p.frecuencia / maxFrecuencia) * 8 }]}>{p.palabra}</Text>
                ))}
              </View>
            </View>
          )}

          {mencionesJefes.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { fontSize: 11 }]}>Dirigentes mencionados en los comentarios</Text>
              <Text style={styles.sectionCaption}>Por nombre de pila detectado en el texto — puede haber falsos positivos con nombres comunes.</Text>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nombre</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Menciones</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Positivas</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Negativas</Text>
                </View>
                {mencionesJefes.map((m) => (
                  <View key={m.nombre} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{m.nombre}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{m.menciones}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: colors.success }]}>{m.positivas}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: colors.error }]}>{m.negativas}</Text>
                  </View>
                ))}
              </View>
              {jefesPositivos.length > 0 && (
                <Text style={[styles.meta, { marginTop: 6 }]}>Más mencionado en positivo: {jefesPositivos[0].nombre} ({jefesPositivos[0].positivas} menciones positivas).</Text>
              )}
              {jefesNegativos.length > 0 && (
                <Text style={styles.meta}>Con más menciones a mejorar: {jefesNegativos[0].nombre} ({jefesNegativos[0].negativas} menciones negativas).</Text>
              )}
            </View>
          )}

          <Footer metadata={metadata} />
        </Page>
      )}

      {/* ================= ANEXO: enunciados completos ================= */}
      {enunciados.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Anexo 1 — Todos los enunciados de escala</Text>
          <Text style={styles.sectionCaption}>De menor a mayor promedio. 🟢 Bien (≥70%) · 🟡 A mejorar (40-70%) · 🔴 Atención (&lt;40%) — umbral fijo, no un diagnóstico.</Text>
          <RankingList items={enunciados} mostrarCodigo />
          <Footer metadata={metadata} />
        </Page>
      )}

      {/* ================= ANEXO: respuestas completas de texto libre ================= */}
      {respuestasAbiertas.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Anexo 2 — Todas las respuestas abiertas</Text>
          {respuestasAbiertas.map((grupo, idx) => (
            <View key={idx} style={{ marginBottom: spacing.md }} wrap={false}>
              <Text style={[styles.sectionTitle, { fontSize: 11, marginTop: idx === 0 ? 0 : spacing.sm }]}>{grupo.enunciado}</Text>
              {grupo.respuestas.length === 0 ? (
                <Text style={styles.meta}>Sin respuestas.</Text>
              ) : (
                grupo.respuestas.map((r, i) => (
                  <View key={i} style={styles.quoteBox}>
                    <Text style={styles.quoteText}>"{r.texto}"</Text>
                    <Text style={styles.quoteAuthor}>— {r.respondiente}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
          <Text style={styles.disclaimer}>
            Metodología: el "estado general" y los semáforos son un umbral fijo sobre el promedio de la escala (no un modelo predictivo). El análisis de comentarios usa clasificación por palabras clave curadas a mano, no inteligencia artificial — es un punto de partida para conversar, no un diagnóstico.
          </Text>
          <Footer metadata={metadata} />
        </Page>
      )}
    </Document>
  );
}
