/**
 * Plantilla PDF para reporte de asistencia
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import { AttendanceData, ReportMetadata } from '../../types/reportTypes';
import {
  baseStyles,
  attendanceStyles,
  colors,
} from '../../styles/pdfStyles';
import { formatDate, formatPercentage } from '../../services/pdfService';

interface AttendanceReportTemplateProps {
  data: AttendanceData[];
  metadata: ReportMetadata;
  dateRange: { from: string; to: string };
}

export const AttendanceReportTemplate: React.FC<AttendanceReportTemplateProps> = ({
  data,
  metadata,
  dateRange,
}) => {
  // Calcular estadísticas
  const totalRecords = data.length;
  const presentCount = data.filter((d) => d.presente).length;
  const absentCount = data.filter((d) => !d.presente && !d.justificado).length;
  const justifiedCount = data.filter((d) => d.justificado).length;
  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  return (
    <Document>
      <Page size="A4" style={baseStyles.page} orientation="landscape">
        {/* Header */}
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>Reporte de Asistencia</Text>
          <Text style={baseStyles.subtitle}>{metadata.organizacion}</Text>
        </View>

        {/* Metadata y Periodo */}
        <View style={baseStyles.metadata}>
          <Text style={baseStyles.metadataItem}>
            Periodo: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </Text>
          <Text style={baseStyles.metadataItem}>
            Generado: {formatDate(metadata.generatedAt)}
          </Text>
        </View>

        {/* Resumen estadístico */}
        <View style={attendanceStyles.summaryCard}>
          <View style={attendanceStyles.summaryItem}>
            <Text style={attendanceStyles.summaryValue}>{totalRecords}</Text>
            <Text style={attendanceStyles.summaryLabel}>Total Registros</Text>
          </View>

          <View style={attendanceStyles.summaryItem}>
            <Text style={[attendanceStyles.summaryValue, { color: colors.success }]}>
              {presentCount}
            </Text>
            <Text style={attendanceStyles.summaryLabel}>Presentes</Text>
          </View>

          <View style={attendanceStyles.summaryItem}>
            <Text style={[attendanceStyles.summaryValue, { color: colors.warning }]}>
              {justifiedCount}
            </Text>
            <Text style={attendanceStyles.summaryLabel}>Justificados</Text>
          </View>

          <View style={attendanceStyles.summaryItem}>
            <Text style={[attendanceStyles.summaryValue, { color: colors.error }]}>
              {absentCount}
            </Text>
            <Text style={attendanceStyles.summaryLabel}>Ausentes</Text>
          </View>

          <View style={attendanceStyles.summaryItem}>
            <Text style={[attendanceStyles.summaryValue, { color: colors.accent }]}>
              {formatPercentage(attendanceRate)}
            </Text>
            <Text style={attendanceStyles.summaryLabel}>Tasa Asistencia</Text>
          </View>
        </View>

        {/* Tabla de asistencia */}
        <View style={baseStyles.table}>
          {/* Header de tabla */}
          <View style={baseStyles.tableHeader}>
            <Text style={[baseStyles.tableHeaderCell, { flex: 1.5 }]}>Fecha</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 3 }]}>Scout</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 1.5 }]}>Estado</Text>
            <Text style={[baseStyles.tableHeaderCell, { flex: 3 }]}>
              Observaciones
            </Text>
          </View>

          {/* Filas de datos */}
          {data.map((record, index) => (
            <View
              key={`${record.scoutId}-${record.fecha}-${index}`}
              style={index % 2 === 0 ? baseStyles.tableRow : baseStyles.tableRowAlt}
            >
              <Text style={[baseStyles.tableCell, { flex: 1.5 }]}>
                {formatDate(record.fecha)}
              </Text>
              <Text style={[baseStyles.tableCell, { flex: 3 }]}>
                {record.scoutNombre}
              </Text>
              <Text
                style={[
                  baseStyles.tableCell,
                  { flex: 1.5 },
                  record.presente
                    ? attendanceStyles.present
                    : record.justificado
                    ? attendanceStyles.justified
                    : attendanceStyles.absent,
                ]}
              >
                {record.presente
                  ? '✓ Presente'
                  : record.justificado
                  ? '⚠ Justificado'
                  : '✗ Ausente'}
              </Text>
              <Text style={[baseStyles.tableCell, { flex: 3 }]}>
                {record.motivo || '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>{metadata.organizacion}</Text>
          <Text
            style={baseStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default AttendanceReportTemplate;
