/**
 * Plantilla PDF para reporte de asistencia individual por scout
 * Diseñada para padres de familia
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatDate } from '../../services/pdfService';

interface AsistenciaDetalle {
  fecha: string;
  titulo: string;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  tipo_actividad?: string;
}

interface ScoutInfo {
  nombres: string;
  apellidos: string;
  codigo_scout: string;
  rama_actual: string;
}

interface Estadisticas {
  total_reuniones: number;
  total_presente: number;
  total_ausente: number;
  total_tardanza: number;
  total_justificado: number;
  porcentaje_asistencia: number;
  racha_actual: number;
  tendencia: string;
}

interface AttendanceByScoutTemplateProps {
  scout: ScoutInfo;
  asistencias: AsistenciaDetalle[];
  estadisticas: Estadisticas;
  periodo: { fecha_inicio: string; fecha_fin: string };
  generatedAt?: string;
}

// Estilos específicos
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  scoutInfo: {
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
  },
  scoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#475569',
    width: 100,
  },
  infoValue: {
    color: '#334155',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    border: 1,
    borderColor: '#e2e8f0',
    width: '23%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  percentageBox: {
    backgroundColor: '#dbeafe',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  percentageLabel: {
    fontSize: 11,
    color: '#1e40af',
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: 1,
    borderBottomColor: '#cbd5e1',
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 9,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  presente: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  ausente: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  tardanza: {
    backgroundColor: '#fef3c7',
    color: '#854d0e',
  },
  justificado: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: '#cbd5e1',
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  noteBox: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    border: 1,
    borderColor: '#93c5fd',
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 9,
    color: '#1e3a8a',
    lineHeight: 1.5,
  },
});

export const AttendanceByScoutTemplate: React.FC<AttendanceByScoutTemplateProps> = ({
  scout,
  asistencias,
  estadisticas,
  periodo,
  generatedAt = new Date().toISOString(),
}) => {
  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'presente': return styles.presente;
      case 'ausente': return styles.ausente;
      case 'tardanza': return styles.tardanza;
      case 'justificado': return styles.justificado;
      default: return styles.presente;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'presente': return 'PRESENTE';
      case 'ausente': return 'AUSENTE';
      case 'tardanza': return 'TARDANZA';
      case 'justificado': return 'JUSTIFICADO';
      default: return estado.toUpperCase();
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Asistencia</Text>
          <Text style={styles.subtitle}>Grupo Scout Lima 12 - La Universidad del Escultismo</Text>
        </View>

        {/* Información del Scout */}
        <View style={styles.scoutInfo}>
          <Text style={styles.scoutName}>{scout.nombres} {scout.apellidos}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Código:</Text>
            <Text style={styles.infoValue}>{scout.codigo_scout}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rama:</Text>
            <Text style={styles.infoValue}>{scout.rama_actual}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Período:</Text>
            <Text style={styles.infoValue}>
              {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
            </Text>
          </View>
        </View>

        {/* Porcentaje Principal */}
        <View style={styles.percentageBox}>
          <Text style={styles.percentageValue}>
            {estadisticas.porcentaje_asistencia.toFixed(1)}%
          </Text>
          <Text style={styles.percentageLabel}>Porcentaje de Asistencia</Text>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>
              {estadisticas.total_reuniones}
            </Text>
            <Text style={styles.statLabel}>Total Reuniones</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>
              {estadisticas.total_presente}
            </Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>
              {estadisticas.total_ausente}
            </Text>
            <Text style={styles.statLabel}>Ausencias</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ca8a04' }]}>
              {estadisticas.racha_actual}
            </Text>
            <Text style={styles.statLabel}>Racha Actual</Text>
          </View>
        </View>

        {/* Historial de Asistencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Asistencias</Text>
          
          {asistencias.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
              No hay registros de asistencia en este período
            </Text>
          ) : (
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>Fecha</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>Actividad</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'center' }]}>Estado</Text>
              </View>

              {/* Rows */}
              {asistencias.map((asistencia, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {formatDate(asistencia.fecha)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {asistencia.titulo}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View style={[styles.statusBadge, getEstadoStyle(asistencia.estado)]}>
                      <Text>{getEstadoLabel(asistencia.estado)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Nota Importante */}
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Nota Importante para Padres de Familia</Text>
          <Text style={styles.noteText}>
            Este reporte muestra la asistencia de su hijo/a a las actividades del Grupo Scout. 
            Una asistencia regular es fundamental para el desarrollo de las habilidades y el avance 
            en las etapas de progresión. Para cualquier consulta, no dude en contactar a los 
            dirigentes de la rama.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado el {formatDate(generatedAt)} • Grupo Scout Lima 12 "La Universidad del Escultismo"
          </Text>
          <Text style={styles.footerText}>
            Este documento es informativo y no tiene validez oficial sin la firma del dirigente responsable
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default AttendanceByScoutTemplate;
