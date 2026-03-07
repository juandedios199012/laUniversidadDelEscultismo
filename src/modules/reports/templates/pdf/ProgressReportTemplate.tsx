/**
 * Plantilla PDF para reporte de progreso de ETAPAS
 * (Pista, Senda, Rumbo, Travesía)
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
  const totalScouts = data.length;
  const scoutsWithEtapa = data.filter((d) => d.etapa).length;
  const completedEtapas = data.filter((d) => d.estado === 'completado').length;
  const inProgressEtapas = data.filter((d) => d.estado === 'en_progreso').length;
  const averageProgress =
    totalScouts > 0
      ? data.reduce((sum, item) => sum + (item.porcentaje || 0), 0) / totalScouts
      : 0;

  // Contar scouts por etapa
  const etapaCounts: Record<string, number> = {};
  data.forEach((item) => {
    const etapa = item.etapa || 'Sin asignar';
    etapaCounts[etapa] = (etapaCounts[etapa] || 0) + 1;
  });

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>REPORTE DE PROGRESION SCOUT</Text>
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
            Total Scouts: {totalScouts}
          </Text>
        </View>

        {/* Resumen por etapas */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Distribucion por Etapas</Text>
          
          <View style={baseStyles.row}>
            {Object.entries(etapaCounts).map(([etapa, count]) => (
              <View key={etapa} style={baseStyles.col}>
                <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.primary }]}>
                  <Text style={[baseStyles.text, baseStyles.textBold]}>
                    {etapa}
                  </Text>
                  <Text style={[baseStyles.title, { color: colors.primary }]}>
                    {count}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Lista resumida: Nombre, Edad, Etapa */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Lista de Scouts - Resumen</Text>
          
          {/* Header de tabla */}
          <View style={[baseStyles.tableRow, { backgroundColor: colors.primary, borderRadius: 4 }]}>
            <View style={{ flex: 2, padding: 6 }}>
              <Text style={[baseStyles.textSmall, baseStyles.textBold, { color: '#FFFFFF' }]}>
                NOMBRE
              </Text>
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={[baseStyles.textSmall, baseStyles.textBold, { color: '#FFFFFF' }]}>
                EDAD
              </Text>
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={[baseStyles.textSmall, baseStyles.textBold, { color: '#FFFFFF' }]}>
                ETAPA
              </Text>
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={[baseStyles.textSmall, baseStyles.textBold, { color: '#FFFFFF' }]}>
                PROGRESO
              </Text>
            </View>
          </View>

          {/* Filas de datos */}
          {data.map((item, index) => (
            <View 
              key={`summary-${item.scoutId}-${index}`} 
              style={[
                baseStyles.tableRow, 
                { 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB'
                }
              ]}
            >
              <View style={{ flex: 2, padding: 6 }}>
                <Text style={baseStyles.textSmall}>
                  {item.scoutNombre}
                </Text>
              </View>
              <View style={{ flex: 1, padding: 6 }}>
                <Text style={baseStyles.textSmall}>
                  {item.edad || 'N/A'} años
                </Text>
              </View>
              <View style={{ flex: 1, padding: 6 }}>
                <Text style={[baseStyles.textSmall, baseStyles.textBold]}>
                  {item.etapa || 'Sin asignar'}
                </Text>
              </View>
              <View style={{ flex: 1, padding: 6 }}>
                <Text style={baseStyles.textSmall}>
                  {item.porcentaje || 0}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resumen estadístico */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Resumen General</Text>
          
          <View style={baseStyles.row}>
            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.success }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  Etapas Completadas
                </Text>
                <Text style={[baseStyles.title, { color: colors.success }]}>
                  {completedEtapas}
                </Text>
              </View>
            </View>

            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.warning }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  En Progreso
                </Text>
                <Text style={[baseStyles.title, { color: colors.warning }]}>
                  {inProgressEtapas}
                </Text>
              </View>
            </View>

            <View style={baseStyles.col}>
              <View style={[baseStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: colors.gray }]}>
                <Text style={[baseStyles.text, baseStyles.textBold]}>
                  Con Etapa Asignada
                </Text>
                <Text style={[baseStyles.title, { color: colors.gray }]}>
                  {scoutsWithEtapa}
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

        {/* Detalle por scout */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Detalle por Scout</Text>

          {data.map((item, index) => (
            <View
              key={`${item.scoutId}-${item.etapa}-${index}`}
              style={baseStyles.sectionCard}
            >
              {/* Nombre del scout y etapa */}
              <View style={baseStyles.row}>
                <View style={baseStyles.col3}>
                  <Text style={[baseStyles.text, baseStyles.textBold]}>
                    {item.scoutNombre}
                  </Text>
                  <Text style={baseStyles.textSmall}>
                    Etapa: {item.etapa || 'Sin asignar'}
                  </Text>
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
                  <Text style={baseStyles.textSmall}>
                    Inicio: {item.fechaInicio ? formatDate(item.fechaInicio) : 'N/A'}
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
                    { width: `${item.porcentaje || 0}%` },
                  ]}
                />
                <Text style={progressStyles.progressText}>
                  {item.porcentaje || 0}%
                </Text>
              </View>

              {/* Areas de crecimiento (si existen) */}
              {item.areas && item.areas.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[baseStyles.textSmall, baseStyles.textBold]}>
                    Areas de Crecimiento:
                  </Text>
                  <View style={[baseStyles.row, { flexWrap: 'wrap', marginTop: 4 }]}>
                    {item.areas.map((area, areaIdx) => (
                      <View key={areaIdx} style={{ width: '33%', padding: 2 }}>
                        <Text style={[baseStyles.textSmall, { fontSize: 7 }]}>
                          {area.area}: {area.completados}/{area.total}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={baseStyles.footer} fixed>
          <Text style={baseStyles.footerText}>{metadata.organizacion}</Text>
          <Text
            style={baseStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default ProgressReportTemplate;
