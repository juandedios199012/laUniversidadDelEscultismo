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

const styles = StyleSheet.create({
  ...baseStyles,
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
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
    marginTop: 15,
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
    marginTop: 20,
    padding: 15,
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
});

const RankingPatrullasReportTemplate: React.FC<RankingPatrullasReportProps> = ({
  data,
  metadata,
  dateRange,
}) => {
  const top3 = data.slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ranking de Patrullas</Text>
          {dateRange && (
            <Text style={styles.subtitle}>
              Del {new Date(dateRange.from).toLocaleDateString('es-PE')} al{' '}
              {new Date(dateRange.to).toLocaleDateString('es-PE')}
            </Text>
          )}
          <Text style={styles.date}>
            Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}
          </Text>
        </View>

        {/* Podio Top 3 */}
        {top3.length >= 3 && (
          <View style={styles.podium}>
            {/* Segundo lugar */}
            <View style={styles.podiumItem}>
              <View style={[styles.medal, styles.silver]}>
                <Text style={styles.medalText}>2</Text>
              </View>
              <Text style={styles.patrullaName}>{top3[1]?.patrullaNombre}</Text>
              <Text style={styles.patrullaPoints}>{top3[1]?.totalPuntos} pts</Text>
            </View>

            {/* Primer lugar */}
            <View style={[styles.podiumItem, { marginTop: -20 }]}>
              <View style={[styles.medal, styles.gold, { width: 60, height: 60 }]}>
                <Text style={[styles.medalText, { fontSize: 28 }]}>1</Text>
              </View>
              <Text style={[styles.patrullaName, { fontSize: 14 }]}>
                {top3[0]?.patrullaNombre}
              </Text>
              <Text style={[styles.patrullaPoints, { fontSize: 16 }]}>
                {top3[0]?.totalPuntos} pts
              </Text>
            </View>

            {/* Tercer lugar */}
            <View style={styles.podiumItem}>
              <View style={[styles.medal, styles.bronze]}>
                <Text style={styles.medalText}>3</Text>
              </View>
              <Text style={styles.patrullaName}>{top3[2]?.patrullaNombre}</Text>
              <Text style={styles.patrullaPoints}>{top3[2]?.totalPuntos} pts</Text>
            </View>
          </View>
        )}

        {/* Tabla Completa */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, styles.position]}>Pos</Text>
            <Text style={[styles.tableCol, { flex: 3 }]}>Patrulla</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>Rama</Text>
            <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Puntos</Text>
          </View>

          {/* Rows */}
          {data.map((patrulla, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.position]}>{patrulla.posicion}</Text>
              <Text style={[styles.tableCol, { flex: 3 }]}>{patrulla.patrullaNombre}</Text>
              <Text style={[styles.tableCol, { flex: 1 }]}>{patrulla.rama}</Text>
              <Text
                style={[
                  styles.tableCol,
                  { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#2563eb' },
                ]}
              >
                {patrulla.totalPuntos}
              </Text>
            </View>
          ))}
        </View>

        {/* Detalles del Top 1 */}
        {data[0] && data[0].puntajes.length > 0 && (
          <View style={styles.detailSection} break>
            <Text style={styles.detailTitle}>
              Detalle de puntos - {data[0].patrullaNombre}
            </Text>
            {data[0].puntajes.slice(0, 10).map((puntaje: any, idx: number) => (
              <View key={idx} style={styles.detailRow}>
                <Text style={{ flex: 2 }}>{puntaje.concepto}</Text>
                <Text style={{ flex: 1 }}>
                  {new Date(puntaje.fecha).toLocaleDateString('es-PE')}
                </Text>
                <Text style={{ flex: 0.5, textAlign: 'right', fontWeight: 'bold' }}>
                  +{puntaje.puntos}
                </Text>
              </View>
            ))}
            {data[0].puntajes.length > 10 && (
              <Text style={{ fontSize: 8, marginTop: 5, fontStyle: 'italic', color: '#6b7280' }}>
                ... y {data[0].puntajes.length - 10} registros más
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {metadata.organizacion} | {metadata.version}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default RankingPatrullasReportTemplate;
