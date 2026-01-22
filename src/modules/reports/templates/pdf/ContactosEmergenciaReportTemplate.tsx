/**
 * Plantilla PDF para Reporte de Contactos de Emergencia
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReportMetadata } from '../../types/reportTypes';
import commonStyles from '../../styles/pdfStyles';

const { baseStyles } = commonStyles;

interface ContactosEmergenciaReportProps {
  data: any[];
  metadata: ReportMetadata;
  rama?: string;
}

const styles = StyleSheet.create({
  ...baseStyles,
  scoutCard: {
    marginBottom: 15,
    padding: 12,
    border: '1pt solid #e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  scoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
  },
  scoutName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoutCode: {
    fontSize: 10,
    color: '#6b7280',
  },
  contactSection: {
    marginBottom: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  badge: {
    padding: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 7,
    marginLeft: 6,
  },
  badgePrimary: {
    backgroundColor: '#dc2626',
    color: 'white',
  },
  badgeAutorizado: {
    backgroundColor: '#16a34a',
    color: 'white',
  },
  contactDetail: {
    flexDirection: 'row',
    fontSize: 9,
    marginBottom: 2,
    paddingLeft: 10,
  },
  contactLabel: {
    width: 100,
    color: '#6b7280',
  },
  contactValue: {
    flex: 1,
    color: '#1f2937',
  },
  medicalSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    border: '1pt solid #fca5a5',
  },
  medicalTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  medicalDetail: {
    flexDirection: 'row',
    fontSize: 8,
    marginBottom: 2,
  },
  medicalLabel: {
    width: 80,
    color: '#991b1b',
  },
  medicalValue: {
    flex: 1,
    color: '#7f1d1d',
  },
});

const ContactosEmergenciaReportTemplate: React.FC<ContactosEmergenciaReportProps> = ({
  data,
  metadata,
  rama,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contactos de Emergencia</Text>
          {rama && <Text style={styles.subtitle}>Rama: {rama}</Text>}
          <Text style={styles.date}>
            Generado: {new Date(metadata.generatedAt).toLocaleDateString('es-PE')}
          </Text>
        </View>

        {/* Scouts */}
        {data.map((scout, index) => (
          <View key={index} style={styles.scoutCard} wrap={false}>
            {/* Scout Header */}
            <View style={styles.scoutHeader}>
              <View>
                <Text style={styles.scoutName}>
                  {scout.nombreScout} {scout.apellidoScout}
                </Text>
                <Text style={styles.scoutCode}>
                  {scout.codigoScout} | {scout.rama}
                </Text>
              </View>
            </View>

            {/* Contactos */}
            {scout.contactos && scout.contactos.length > 0 ? (
              scout.contactos.map((contacto: any, idx: number) => (
                <View key={idx} style={styles.contactSection}>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactName}>
                      {contacto.nombre} {contacto.apellido}
                    </Text>
                    {contacto.esPrincipal && (
                      <View style={[styles.badge, styles.badgePrimary]}>
                        <Text>EMERGENCIA</Text>
                      </View>
                    )}
                    {contacto.autorizadoRecoger && (
                      <View style={[styles.badge, styles.badgeAutorizado]}>
                        <Text>AUTORIZADO</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.contactDetail}>
                    <Text style={styles.contactLabel}>Parentesco:</Text>
                    <Text style={styles.contactValue}>{contacto.parentesco}</Text>
                  </View>

                  {contacto.celular && (
                    <View style={styles.contactDetail}>
                      <Text style={styles.contactLabel}>Celular:</Text>
                      <Text style={styles.contactValue}>{contacto.celular}</Text>
                    </View>
                  )}

                  {contacto.celularSecundario && (
                    <View style={styles.contactDetail}>
                      <Text style={styles.contactLabel}>Celular 2:</Text>
                      <Text style={styles.contactValue}>{contacto.celularSecundario}</Text>
                    </View>
                  )}

                  {contacto.telefono && (
                    <View style={styles.contactDetail}>
                      <Text style={styles.contactLabel}>Teléfono:</Text>
                      <Text style={styles.contactValue}>{contacto.telefono}</Text>
                    </View>
                  )}

                  {contacto.correo && (
                    <View style={styles.contactDetail}>
                      <Text style={styles.contactLabel}>Correo:</Text>
                      <Text style={styles.contactValue}>{contacto.correo}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 9, color: '#ef4444', fontStyle: 'italic' }}>
                ⚠️ Sin contactos de emergencia registrados
              </Text>
            )}

            {/* Datos Médicos */}
            {scout.datosMedicos && (
              <View style={styles.medicalSection}>
                <Text style={styles.medicalTitle}>Información Médica</Text>

                {scout.datosMedicos.grupoSanguineo && (
                  <View style={styles.medicalDetail}>
                    <Text style={styles.medicalLabel}>Grupo Sanguíneo:</Text>
                    <Text style={styles.medicalValue}>
                      {scout.datosMedicos.grupoSanguineo} {scout.datosMedicos.factorSanguineo}
                    </Text>
                  </View>
                )}

                {scout.datosMedicos.seguroMedico && (
                  <View style={styles.medicalDetail}>
                    <Text style={styles.medicalLabel}>Seguro Médico:</Text>
                    <Text style={styles.medicalValue}>{scout.datosMedicos.seguroMedico}</Text>
                  </View>
                )}

                {scout.datosMedicos.tipoDiscapacidad && (
                  <View style={styles.medicalDetail}>
                    <Text style={styles.medicalLabel}>Discapacidad:</Text>
                    <Text style={styles.medicalValue}>{scout.datosMedicos.tipoDiscapacidad}</Text>
                  </View>
                )}

                {scout.datosMedicos.alergias && (
                  <View style={styles.medicalDetail}>
                    <Text style={styles.medicalLabel}>Alergias:</Text>
                    <Text style={styles.medicalValue}>{scout.datosMedicos.alergias}</Text>
                  </View>
                )}

                {!scout.datosMedicos.grupoSanguineo &&
                  !scout.datosMedicos.seguroMedico &&
                  !scout.datosMedicos.tipoDiscapacidad &&
                  !scout.datosMedicos.alergias && (
                    <Text style={{ fontSize: 8, color: '#991b1b', fontStyle: 'italic' }}>
                      Sin información médica registrada
                    </Text>
                  )}
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {metadata.organizacion} | {metadata.version} | Total: {data.length} scouts
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContactosEmergenciaReportTemplate;
