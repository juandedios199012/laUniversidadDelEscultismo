/**
 * Plantilla PDF para reporte de progreso
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import { ProgressData, ReportMetadata } from '../../types/reportTypes';
import {
  baseStyles,
  progressStyles,
  colors,
} from '../../styles/pdfStyles';
import { formatDate } from '../../services/pdfService';

interface ProgressReportTemplateProps {
  data: ProgressData[];
  metadata: ReportMetadata;
  scoutName?: string;
}

export const ProgressReportTemplate: React.FC<ProgressReportTemplateProps> = ({
  data,
  metadata,
  scoutName,
}) => {
  // Calcular estadísticas
  const totalItems = data.length;
  const completedItems = data.filter((d) => d.estado === 'completado').length;
  const inProgressItems = data.filter((d) => d.estado === 'en_progreso').length;
  const pendingItems = data.filter((d) => d.estado === 'pendiente').length;
  const averageProgress =
    totalItems > 0
      ? data.reduce((sum, item) => sum + item.porcentaje, 0) / totalItems
      : 0;

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>Reporte de Progreso</Text>
          <Text style={baseStyles.subtitle}>
            {scoutName || metadata.organizacion}
          </Text>
        </View>

        {/* Metadata */}
        <View style={baseStyles.metadata}>
          <Text style={baseStyles.metadataItem}>
            Generado: {formatDate(metadata.generatedAt)}
          </Text>
          <Text style={baseStyles.metadataItem}>
            Total Especialidades: {totalItems}
          </Text>
        </View>

        {/* Resumen estadístico */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Resumen General</Text>
          
          <View style={baseStyles.row}>
            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.success }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  Completadas
                </Text>
                <Text style={[baseStyles.title, { color: colors.success }]}>
                  {completedItems}
                </Text>
              </View>
            </View>

            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.warning }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  En Progreso
                </Text>
                <Text style={[baseStyles.title, { color: colors.warning }]}>
                  {inProgressItems}
                </Text>
              </View>
            </View>

            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.gray }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  Pendientes
                </Text>
                <Text style={[baseStyles.title, { color: colors.gray }]}>
                  {pendingItems}
                </Text>
              </View>
            </View>
          </View>

          {/* Progreso promedio */}
          <View style={baseStyles.infoBox}>
            <Text style={[baseStyles.text, baseStyles.textBold]}>
              Progreso Promedio General
            </Text>
            <View style={progressStyles.progressBar}>
              <View
                style={[
                  progressStyles.progressFill,
                  { width: `${averageProgress}%` },
                ]}
              />
              <Text style={progressStyles.progressText}>
                {Math.round(averageProgress)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Detalle por especialidad */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Detalle de Especialidades</Text>

          {data.map((item, index) => (
            <View
              key={`${item.scoutId}-${item.especialidad}-${index}`}
              style={baseStyles.sectionCard}
            >
              {/* Nombre de especialidad y Scout */}
              <View style={baseStyles.row}>
                <View style={baseStyles.col3}>
                  <Text style={[baseStyles.text, baseStyles.textBold]}>
                    {item.especialidad}
                  </Text>
                  <Text style={baseStyles.textSmall}>{item.scoutNombre}</Text>
                </View>
                <View style={baseStyles.col}>
                  <View
                    style={[
                      baseStyles.badge,
                      item.estado === 'completado'
                        ? baseStyles.badgeSuccess
                        : item.estado === 'en_progreso'
                        ? baseStyles.badgeWarning
                        : baseStyles.badgeError,
                    ]}
                  >
                    <Text>
                      {item.estado === 'completado'
                        ? 'Completado'
                        : item.estado === 'en_progreso'
                        ? 'En Progreso'
                        : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Información adicional */}
              <View style={baseStyles.row}>
                <View style={baseStyles.col}>
                  <Text style={baseStyles.textSmall}>Nivel: {item.nivel}</Text>
                </View>
                <View style={baseStyles.col}>
                  <Text style={baseStyles.textSmall}>
                    Inicio: {formatDate(item.fechaInicio)}
                  </Text>
                </View>
                <View style={baseStyles.col}>
                  <Text style={baseStyles.textSmall}>
                    Fin:{' '}
                    {item.fechaFinalizacion
                      ? formatDate(item.fechaFinalizacion)
                      : 'En curso'}
                  </Text>
                </View>
              </View>

              {/* Barra de progreso */}
              <View style={progressStyles.progressBar}>
                <View
                  style={[
                    progressStyles.progressFill,
                    { width: `${item.porcentaje}%` },
                  ]}
                />
                <Text style={progressStyles.progressText}>
                  {item.porcentaje}%
                </Text>
              </View>
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

export default ProgressReportTemplate;
