/**
 * Plantilla PDF para Reporte de Documentación Pendiente
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { baseStyles } = commonStyles;

interface DocumentacionPendienteReportProps {
  data: any[];
  metadata: ReportMetadata;
  ano: number;
}

const styles = StyleSheet.create({
  ...baseStyles,
  alert: {
    padding: 12,
    backgroundColor: '#fef2f2',
    border: '2pt solid #dc2626',
    borderRadius: 8,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 10,
    color: '#7f1d1d',
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
  },
  tableHeader: {
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  tableCol: {
    fontSize: 9,
    paddingHorizontal: 4,
  },
  pendingList: {
    fontSize: 8,
    color: '#991b1b',
  },
  checkIcon: {
    color: '#16a34a',
    fontSize: 12,
  },
  crossIcon: {
    color: '#dc2626',
    fontSize: 12,
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
});

const DocumentacionPendienteReportTemplate: React.FC<DocumentacionPendienteReportProps> = ({
  data,
  metadata,
  ano,
}) => {
  const totalScouts = data.length;
  const sinCertificado = data.filter((d) => !d.certificadoMedico).length;
  const sinAutorizacion = data.filter((d) => !d.autorizacionPadres).length;
  const conPagoPendiente = data.filter((d) => d.estadoPago !== 'PAGADO').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Documentación Pendiente</Text>
          <Text style={styles.subtitle}>Año {ano}</Text>
          <Text style={styles.date}>
            Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}
          </Text>
        </View>

        {/* Alerta */}
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>⚠️ Atención Requerida</Text>
          <Text style={styles.alertText}>
            Existen {totalScouts} scouts con documentación o pagos pendientes. Es necesario
            regularizar estos casos para mantener la inscripción activa.
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total con pendientes:</Text>
            <Text style={styles.summaryValue}>{totalScouts}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sin certificado médico:</Text>
            <Text style={styles.summaryValue}>{sinCertificado}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sin autorización de padres:</Text>
            <Text style={styles.summaryValue}>{sinAutorizacion}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Con pago pendiente:</Text>
            <Text style={styles.summaryValue}>{conPagoPendiente}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, { flex: 0.8 }]}>Código</Text>
            <Text style={[styles.tableCol, { flex: 2 }]}>Nombre</Text>
            <Text style={[styles.tableCol, { flex: 0.8 }]}>Rama</Text>
            <Text style={[styles.tableCol, { flex: 0.5, textAlign: 'center' }]}>Cert</Text>
            <Text style={[styles.tableCol, { flex: 0.5, textAlign: 'center' }]}>Aut</Text>
            <Text style={[styles.tableCol, { flex: 0.8, textAlign: 'center' }]}>Pago</Text>
            <Text style={[styles.tableCol, { flex: 2 }]}>Pendientes</Text>
          </View>

          {/* Rows */}
          {data.map((doc, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCol, { flex: 0.8 }]}>{doc.codigoScout}</Text>
              <Text style={[styles.tableCol, { flex: 2 }]}>{doc.nombreCompleto}</Text>
              <Text style={[styles.tableCol, { flex: 0.8 }]}>{doc.rama}</Text>
              <Text
                style={[
                  styles.tableCol,
                  { flex: 0.5, textAlign: 'center' },
                  doc.certificadoMedico ? styles.checkIcon : styles.crossIcon,
                ]}
              >
                {doc.certificadoMedico ? '✓' : '✗'}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  { flex: 0.5, textAlign: 'center' },
                  doc.autorizacionPadres ? styles.checkIcon : styles.crossIcon,
                ]}
              >
                {doc.autorizacionPadres ? '✓' : '✗'}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  { flex: 0.8, textAlign: 'center' },
                  doc.estadoPago === 'PAGADO' ? styles.checkIcon : styles.crossIcon,
                ]}
              >
                {doc.estadoPago === 'PAGADO' ? '✓' : doc.estadoPago}
              </Text>
              <View style={[styles.tableCol, { flex: 2 }]}>
                {doc.documentosFaltantes.map((faltante: string, idx: number) => (
                  <Text key={idx} style={styles.pendingList}>
                    • {faltante}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

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

export default DocumentacionPendienteReportTemplate;
