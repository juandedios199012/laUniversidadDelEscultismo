/**
 * Plantilla PDF para Reporte de Inscripciones Anuales
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { baseStyles } = commonStyles;

interface InscripcionesReportProps {
  data: any[];
  metadata: ReportMetadata;
  ano: number;
}

const styles = StyleSheet.create({
  ...baseStyles,
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
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  tableCol: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    fontSize: 8,
    textAlign: 'center',
  },
  statusPagado: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  statusPendiente: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 11,
    color: '#2563eb',
  },
});

const InscripcionesReportTemplate: React.FC<InscripcionesReportProps> = ({
  data,
  metadata,
  ano,
}) => {
  const totalInscritos = data.length;
  const totalPagados = data.filter((d) => d.estadoPago === 'PAGADO').length;
  const totalPendientes = totalInscritos - totalPagados;
  const totalRecaudado = data
    .filter((d) => d.estadoPago === 'PAGADO')
    .reduce((sum, d) => sum + d.montoInscripcion, 0);
  const totalPorRecaudar = data
    .filter((d) => d.estadoPago !== 'PAGADO')
    .reduce((sum, d) => sum + d.montoInscripcion, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Inscripciones Anuales</Text>
          <Text style={styles.subtitle}>Año {ano}</Text>
          <Text style={styles.date}>
            Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}
          </Text>
        </View>

        {/* Resumen */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Inscritos:</Text>
            <Text style={styles.summaryValue}>{totalInscritos}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pagados:</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{totalPagados}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pendientes:</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{totalPendientes}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, paddingTop: 8, marginTop: 8 }]}>
            <Text style={styles.summaryLabel}>Total Recaudado:</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              S/ {totalRecaudado.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Por Recaudar:</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              S/ {totalPorRecaudar.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, { flex: 0.8 }]}>Código</Text>
            <Text style={[styles.tableCol, { flex: 2 }]}>Nombre</Text>
            <Text style={[styles.tableCol, { flex: 0.8 }]}>Rama</Text>
            <Text style={[styles.tableCol, { flex: 0.8 }]}>Monto</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>Estado</Text>
            <Text style={[styles.tableCol, { flex: 0.5, textAlign: 'center' }]}>Docs</Text>
          </View>

          {/* Rows */}
          {data.map((inscripcion, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 0.8 }]}>
                {inscripcion.codigoScout}
              </Text>
              <Text style={[styles.tableCol, { flex: 2 }]}>
                {inscripcion.nombreCompleto}
              </Text>
              <Text style={[styles.tableCol, { flex: 0.8 }]}>
                {inscripcion.rama}
              </Text>
              <Text style={[styles.tableCol, { flex: 0.8 }]}>
                S/ {inscripcion.montoInscripcion.toFixed(2)}
              </Text>
              <View style={[styles.tableCol, { flex: 1 }]}>
                <View
                  style={[
                    styles.statusBadge,
                    inscripcion.estadoPago === 'PAGADO'
                      ? styles.statusPagado
                      : styles.statusPendiente,
                  ]}
                >
                  <Text>{inscripcion.estadoPago}</Text>
                </View>
              </View>
              <Text style={[styles.tableCol, { flex: 0.5, textAlign: 'center' }]}>
                {inscripcion.documentosCompletos && 
                 inscripcion.certificadoMedico && 
                 inscripcion.autorizacionPadres ? '✓' : '✗'}
              </Text>
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

export default InscripcionesReportTemplate;
