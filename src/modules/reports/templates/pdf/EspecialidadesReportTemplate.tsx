/**
 * Plantilla PDF para reporte de Especialidades Scout
 * Dashboard atractivo para dirigentes y padres
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { EspecialidadesReportData, ReportMetadata } from '../../types/reportTypes';

// Colores por área de especialidad
const areaColors: Record<string, string> = {
  'Ciencia y Tecnología': '#3B82F6',
  'Vida en la Naturaleza': '#10B981',
  'Arte, Expresión y Cultura': '#8B5CF6',
  'Deportes': '#F59E0B',
  'Servicio a los Demás': '#EC4899',
  'Institucional': '#6366F1',
  default: '#6B7280',
};

// Estilos específicos para este reporte
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  // Header con degradado visual
  header: {
    backgroundColor: '#1E3A5F',
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
  },
  headerBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 10,
  },
  headerBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  // Dashboard KPIs
  dashboardContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
  },
  kpiPercent: {
    fontSize: 10,
    color: '#10B981',
    marginTop: 2,
  },
  // Gráfico de barras por área
  chartContainer: {
    marginBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 120,
    fontSize: 9,
    color: '#374151',
  },
  barContainer: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barValue: {
    width: 40,
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
  },
  // Tarjetas de rama
  ramaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  ramaCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    margin: '1%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ramaTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  ramaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ramaStat: {
    alignItems: 'center',
  },
  ramaStatValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
  },
  ramaStatLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  // Top especialidades
  topList: {
    marginBottom: 20,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    marginBottom: 6,
    borderRadius: 6,
  },
  topRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topRankText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  topInfo: {
    flex: 1,
  },
  topName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
  },
  topArea: {
    fontSize: 8,
    color: '#64748B',
  },
  topStats: {
    alignItems: 'flex-end',
  },
  topStatValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#10B981',
  },
  topStatLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  // Scouts destacados
  scoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  scoutCard: {
    width: '31%',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    margin: '1%',
    alignItems: 'center',
  },
  scoutMedal: {
    fontSize: 20,
    marginBottom: 4,
  },
  scoutName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
    textAlign: 'center',
  },
  scoutRama: {
    fontSize: 8,
    color: '#64748B',
  },
  scoutCount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#F59E0B',
    marginTop: 4,
  },
  // Tabla de detalle
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E3A5F',
    padding: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  // Progress bar mini
  progressMini: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 4,
  },
  progressFillMini: {
    height: '100%',
    borderRadius: 3,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  // Página de detalle
  detailSection: {
    marginBottom: 15,
  },
  scoutDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  scoutDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoutDetailName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
  },
  scoutDetailRama: {
    fontSize: 10,
    color: '#64748B',
  },
  especialidadMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 6,
    marginBottom: 4,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  especialidadMiniName: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  estadoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  estadoBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Texto en negrita
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },
});

interface EspecialidadesReportTemplateProps {
  data: EspecialidadesReportData;
  metadata: ReportMetadata;
}

// Helper para formatear fecha
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Helper para obtener color de área
const getAreaColor = (area: string): string => {
  return areaColors[area] || areaColors.default;
};

// Helper para obtener color de estado
const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'completada': return '#10B981';
    case 'desafio': return '#F59E0B';
    case 'taller': return '#3B82F6';
    case 'exploracion': return '#8B5CF6';
    default: return '#6B7280';
  }
};

// Helper para obtener texto de estado
const getEstadoText = (estado: string): string => {
  switch (estado) {
    case 'completada': return 'Completada';
    case 'desafio': return 'Desafío';
    case 'taller': return 'Taller';
    case 'exploracion': return 'Exploración';
    default: return estado;
  }
};

// Obtener color de rama
const getRamaColor = (rama: string): string => {
  switch (rama.toLowerCase()) {
    case 'manada': return '#F59E0B';
    case 'tropa': return '#10B981';
    case 'comunidad': return '#3B82F6';
    case 'clan': return '#8B5CF6';
    default: return '#6B7280';
  }
};

export const EspecialidadesReportTemplate: React.FC<EspecialidadesReportTemplateProps> = ({
  data,
  metadata,
}) => {
  const { dashboard, scouts } = data;

  return (
    <Document>
      {/* Página 1: Dashboard Principal */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REPORTE DE ESPECIALIDADES SCOUT</Text>
          <Text style={styles.headerSubtitle}>
            {data.filtroRama ? `Rama: ${data.filtroRama}` : 'Todas las Ramas'} • {metadata.organizacion}
          </Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              Generado: {formatDate(data.fechaGeneracion)}
            </Text>
          </View>
        </View>

        {/* KPIs Principales */}
        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>RESUMEN GENERAL</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: '#3B82F6' }]}>
              <Text style={styles.kpiValue}>{dashboard.totalScouts}</Text>
              <Text style={styles.kpiLabel}>Scouts con Especialidades</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.kpiValue}>{dashboard.especialidadesCompletadas}</Text>
              <Text style={styles.kpiLabel}>Especialidades Completadas</Text>
              <Text style={styles.kpiPercent}>{dashboard.tasaCompletado.toFixed(1)}% tasa de exito</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.kpiValue}>{dashboard.especialidadesEnProgreso}</Text>
              <Text style={styles.kpiLabel}>En Progreso</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#8B5CF6' }]}>
              <Text style={styles.kpiValue}>{dashboard.promedioEspecialidadesPorScout.toFixed(1)}</Text>
              <Text style={styles.kpiLabel}>Promedio por Scout</Text>
            </View>
          </View>
        </View>

        {/* Distribución por Área */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>DISTRIBUCION POR AREA DE CONOCIMIENTO</Text>
          {dashboard.porArea.map((area, index) => (
            <View key={index} style={styles.barRow}>
              <Text style={styles.barLabel}>{area.area}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(area.porcentaje, 100)}%`,
                      backgroundColor: getAreaColor(area.area),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>
                {area.completadas}/{area.total}
              </Text>
            </View>
          ))}
        </View>

        {/* Estadísticas por Rama */}
        <View>
          <Text style={styles.sectionTitle}>AVANCE POR RAMA</Text>
          <View style={styles.ramaContainer}>
            {dashboard.porRama.map((rama, index) => (
              <View key={index} style={[styles.ramaCard, { borderColor: getRamaColor(rama.rama) }]}>
                <Text style={[styles.ramaTitle, { color: getRamaColor(rama.rama) }]}>
                  {rama.rama}
                </Text>
                <View style={styles.ramaStats}>
                  <View style={styles.ramaStat}>
                    <Text style={styles.ramaStatValue}>{rama.scouts}</Text>
                    <Text style={styles.ramaStatLabel}>Scouts</Text>
                  </View>
                  <View style={styles.ramaStat}>
                    <Text style={styles.ramaStatValue}>{rama.especialidades}</Text>
                    <Text style={styles.ramaStatLabel}>Asignadas</Text>
                  </View>
                  <View style={styles.ramaStat}>
                    <Text style={[styles.ramaStatValue, { color: '#10B981' }]}>{rama.completadas}</Text>
                    <Text style={styles.ramaStatLabel}>Completadas</Text>
                  </View>
                  <View style={styles.ramaStat}>
                    <Text style={[styles.ramaStatValue, { color: '#F59E0B' }]}>{rama.porcentaje.toFixed(0)}%</Text>
                    <Text style={styles.ramaStatLabel}>Avance</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Grupo Scout Lima 12 • Sistema de Gestión Scout
          </Text>
          <Text style={styles.footerText}>Página 1</Text>
        </View>
      </Page>

      {/* Página 2: Top Especialidades y Scouts Destacados */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LOGROS Y DESTACADOS</Text>
          <Text style={styles.headerSubtitle}>
            Especialidades más populares y scouts con mejor desempeño
          </Text>
        </View>

        {/* Top Especialidades */}
        <View style={styles.topList}>
          <Text style={styles.sectionTitle}>TOP 10 ESPECIALIDADES MAS POPULARES</Text>
          {dashboard.topEspecialidades.slice(0, 10).map((esp, index) => (
            <View key={index} style={styles.topItem}>
              <View style={[styles.topRank, { backgroundColor: index < 3 ? '#F59E0B' : '#94A3B8' }]}>
                <Text style={styles.topRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topInfo}>
                <Text style={styles.topName}>{esp.nombre}</Text>
                <Text style={styles.topArea}>{esp.area}</Text>
              </View>
              <View style={styles.topStats}>
                <Text style={styles.topStatValue}>{esp.completadas}</Text>
                <Text style={styles.topStatLabel}>de {esp.asignaciones} completadas</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scouts Destacados */}
        <View>
          <Text style={styles.sectionTitle}>SCOUTS DESTACADOS</Text>
          <View style={styles.scoutsGrid}>
            {dashboard.scoutsDestacados.slice(0, 9).map((scout, index) => (
              <View key={index} style={styles.scoutCard}>
                <Text style={styles.scoutMedal}>
                  {index === 0 ? '1ro' : index === 1 ? '2do' : index === 2 ? '3ro' : `${index + 1}to`}
                </Text>
                <Text style={styles.scoutName}>{scout.nombre}</Text>
                <Text style={styles.scoutRama}>{scout.rama}</Text>
                <Text style={styles.scoutCount}>{scout.especialidadesCompletadas}</Text>
                <Text style={styles.ramaStatLabel}>especialidades</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Grupo Scout Lima 12 • Sistema de Gestión Scout
          </Text>
          <Text style={styles.footerText}>Página 2</Text>
        </View>
      </Page>

      {/* Página 3+: Detalle por Scout */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DETALLE POR SCOUT</Text>
          <Text style={styles.headerSubtitle}>
            Progreso individual de cada scout en sus especialidades
          </Text>
        </View>

        <View style={styles.detailSection}>
          {scouts.slice(0, 6).map((scout, scoutIndex) => (
            <View
              key={scoutIndex}
              style={[styles.scoutDetailCard, { borderLeftColor: getRamaColor(scout.rama) }]}
            >
              <View style={styles.scoutDetailHeader}>
                <View>
                  <Text style={styles.scoutDetailName}>{scout.nombreCompleto}</Text>
                  <Text style={styles.scoutDetailRama}>
                    {scout.rama} {scout.patrulla && `• ${scout.patrulla}`} • {scout.codigoScout}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.kpiValue, { fontSize: 18 }]}>
                    {scout.resumen.completadas}/{scout.resumen.total}
                  </Text>
                  <Text style={styles.ramaStatLabel}>completadas</Text>
                </View>
              </View>
              
              {/* Lista de especialidades */}
              {scout.especialidades.slice(0, 4).map((esp, espIndex) => (
                <View
                  key={espIndex}
                  style={[styles.especialidadMini, { borderLeftColor: getAreaColor(esp.especialidadArea) }]}
                >
                  <Text style={styles.especialidadMiniName}>{esp.especialidadNombre}</Text>
                  <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(esp.estado) }]}>
                    <Text style={styles.estadoBadgeText}>{getEstadoText(esp.estado)}</Text>
                  </View>
                </View>
              ))}
              {scout.especialidades.length > 4 && (
                <Text style={[styles.footerText, { marginTop: 4 }]}>
                  +{scout.especialidades.length - 4} especialidades más...
                </Text>
              )}
            </View>
          ))}
        </View>

        {scouts.length > 6 && (
          <Text style={[styles.footerText, { textAlign: 'center', marginTop: 10 }]}>
            ... y {scouts.length - 6} scouts más. Ver reporte completo en Excel para todos los detalles.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Grupo Scout Lima 12 • Sistema de Gestión Scout
          </Text>
          <Text style={styles.footerText}>Página 3</Text>
        </View>
      </Page>

      {/* Página Final: Mensaje para Padres */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MENSAJE PARA PADRES DE FAMILIA</Text>
        </View>

        <View style={{ padding: 20, backgroundColor: '#FEF3C7', borderRadius: 12, marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { borderBottomColor: '#F59E0B' }]}>
            ¿Qué son las Especialidades Scout?
          </Text>
          <Text style={[styles.tableCell, { lineHeight: 1.8, marginBottom: 10 }]}>
            Las especialidades son áreas de conocimiento y habilidades que los scouts desarrollan 
            de manera voluntaria según sus intereses personales. Cada especialidad tiene tres fases:
          </Text>
          <View style={{ marginLeft: 10, marginBottom: 15 }}>
            <Text style={[styles.tableCell, { marginBottom: 5 }]}>
              1. <Text style={styles.textBold}>Exploracion:</Text> Investigacion y aprendizaje teorico
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 5 }]}>
              2. <Text style={styles.textBold}>Taller:</Text> Practica y desarrollo de habilidades
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 5 }]}>
              3. <Text style={styles.textBold}>Desafio:</Text> Aplicacion real y demostracion de competencia
            </Text>
          </View>
        </View>

        <View style={{ padding: 20, backgroundColor: '#ECFDF5', borderRadius: 12, marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { borderBottomColor: '#10B981' }]}>
            ¿Cómo pueden apoyar en casa?
          </Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.tableCell, { marginBottom: 8 }]}>
              - Pregunten sobre las especialidades que estan trabajando
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 8 }]}>
              - Ayuden a investigar y conseguir materiales si los necesitan
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 8 }]}>
              - Celebren sus logros cuando completen una fase
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 8 }]}>
              - Motivenlos a elegir especialidades segun sus intereses genuinos
            </Text>
            <Text style={[styles.tableCell, { marginBottom: 8 }]}>
              - Conecten las especialidades con actividades familiares
            </Text>
          </View>
        </View>

        <View style={{ padding: 20, backgroundColor: '#EFF6FF', borderRadius: 12 }}>
          <Text style={[styles.sectionTitle, { borderBottomColor: '#3B82F6' }]}>
            ¿Tienen preguntas?
          </Text>
          <Text style={[styles.tableCell, { lineHeight: 1.8 }]}>
            No duden en contactar a los dirigentes para más información sobre el progreso 
            de su hijo/a en las especialidades. ¡Estamos para apoyarlos!
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Grupo Scout Lima 12 • "Siempre Listos" • {formatDate(new Date())}
          </Text>
          <Text style={styles.footerText}>Página Final</Text>
        </View>
      </Page>
    </Document>
  );
};

export default EspecialidadesReportTemplate;
