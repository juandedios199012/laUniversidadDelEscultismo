/**
 * Plantilla PDF para reporte de Scout
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';
import { ScoutReportData, ReportMetadata } from '../../types/reportTypes';
import { baseStyles, scoutReportStyles } from '../../styles/pdfStyles';
import { formatDate } from '../../services/pdfService';

interface ScoutReportTemplateProps {
  scout: ScoutReportData;
  metadata: ReportMetadata;
  includeLogo?: boolean;
}

export const ScoutReportTemplate: React.FC<ScoutReportTemplateProps> = ({
  scout,
  metadata,
  includeLogo = false,
}) => {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* Header */}
        <View style={baseStyles.header}>
          <View style={baseStyles.headerRow}>
            {includeLogo && metadata.logo && (
              <Image src={metadata.logo} style={baseStyles.logo} />
            )}
            <View style={baseStyles.headerText}>
              <Text style={baseStyles.title}>Reporte de Scout</Text>
              <Text style={baseStyles.subtitle}>{metadata.organizacion}</Text>
            </View>
          </View>
        </View>

        {/* Metadata */}
        <View style={baseStyles.metadata}>
          <Text style={baseStyles.metadataItem}>
            Generado: {formatDate(metadata.generatedAt)}
          </Text>
          <Text style={baseStyles.metadataItem}>
            Versión: {metadata.version}
          </Text>
        </View>

        {/* Información Personal */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Información Personal</Text>
          
          <View style={scoutReportStyles.profileSection}>
            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>Nombre Completo:</Text>
              <Text style={scoutReportStyles.fieldValue}>
                {scout.nombre} {scout.apellido}
              </Text>
            </View>

            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>N° Registro:</Text>
              <Text style={scoutReportStyles.fieldValue}>
                {scout.numeroRegistro}
              </Text>
            </View>

            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>Fecha Nacimiento:</Text>
              <Text style={scoutReportStyles.fieldValue}>
                {formatDate(scout.fechaNacimiento)}
              </Text>
            </View>

            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>Edad:</Text>
              <Text style={scoutReportStyles.fieldValue}>{scout.edad} años</Text>
            </View>

            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>Rama:</Text>
              <Text style={[scoutReportStyles.fieldValue, scoutReportStyles.ramaTag]}>
                {scout.rama}
              </Text>
            </View>

            {scout.patrulla && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Patrulla:</Text>
                <Text style={scoutReportStyles.fieldValue}>{scout.patrulla}</Text>
              </View>
            )}

            <View style={scoutReportStyles.profileField}>
              <Text style={scoutReportStyles.fieldLabel}>Fecha Ingreso:</Text>
              <Text style={scoutReportStyles.fieldValue}>
                {formatDate(scout.fechaIngreso)}
              </Text>
            </View>
          </View>
        </View>

        {/* Información de Contacto */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Información de Contacto</Text>
          
          <View style={scoutReportStyles.profileSection}>
            {scout.direccion && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Dirección:</Text>
                <Text style={scoutReportStyles.fieldValue}>{scout.direccion}</Text>
              </View>
            )}

            {scout.telefono && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Teléfono:</Text>
                <Text style={scoutReportStyles.fieldValue}>{scout.telefono}</Text>
              </View>
            )}

            {scout.email && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Email:</Text>
                <Text style={scoutReportStyles.fieldValue}>{scout.email}</Text>
              </View>
            )}

            {scout.contactoEmergencia && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Emergencia:</Text>
                <Text style={scoutReportStyles.fieldValue}>
                  {scout.contactoEmergencia}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Información Familiar */}
        <View style={baseStyles.section}>
          <Text style={baseStyles.heading}>Información Familiar</Text>
          
          <View style={scoutReportStyles.profileSection}>
            {scout.nombrePadre && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Padre:</Text>
                <Text style={scoutReportStyles.fieldValue}>
                  {scout.nombrePadre}
                </Text>
              </View>
            )}

            {scout.nombreMadre && (
              <View style={scoutReportStyles.profileField}>
                <Text style={scoutReportStyles.fieldLabel}>Madre:</Text>
                <Text style={scoutReportStyles.fieldValue}>
                  {scout.nombreMadre}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Observaciones */}
        {scout.observaciones && (
          <View style={baseStyles.section}>
            <Text style={baseStyles.heading}>Observaciones</Text>
            <View style={baseStyles.infoBox}>
              <Text style={baseStyles.text}>{scout.observaciones}</Text>
            </View>
          </View>
        )}

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

export default ScoutReportTemplate;
