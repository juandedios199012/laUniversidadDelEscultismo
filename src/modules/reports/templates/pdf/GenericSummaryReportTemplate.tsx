import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';

interface GenericSummaryReportTemplateProps {
  title: string;
  subtitle?: string;
  metadata: ReportMetadata;
  summary?: Array<{ label: string; value: string | number }>;
  rows?: Array<{ label: string; value: string | number }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#4B5563',
  },
  section: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 10,
    color: '#374151',
    flex: 2,
  },
  rowValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
});

const GenericSummaryReportTemplate: React.FC<GenericSummaryReportTemplateProps> = ({
  title,
  subtitle,
  metadata,
  summary = [],
  rows = [],
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.subtitle}>
            Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}
          </Text>
        </View>

        {summary.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            {summary.map((item, idx) => (
              <View style={styles.row} key={`s-${idx}`}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{String(item.value)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {rows.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle</Text>
            {rows.map((item, idx) => (
              <View style={styles.row} key={`r-${idx}`}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{String(item.value)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>
          {metadata.organizacion} | {metadata.version}
        </Text>
      </Page>
    </Document>
  );
};

export default GenericSummaryReportTemplate;
