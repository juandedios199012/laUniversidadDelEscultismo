/**
 * Template masivo para DNGI-03 de todos los scouts
 * Genera un documento PDF con múltiples fichas de registro
 * SIN incluir la página del documento de identidad (solo hasta la hoja de firma/huella)
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { fondoAnualBase64 } from '../../../../assets/images/fondoAnualBase64';
import { ScoutReportData, FamiliarReportData } from '../../types/reportTypes';
import { getTipoDocumentoLabel } from '../../../../data/constants';

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return fecha;
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [year, month, day] = fecha.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  }
  return fecha;
};

// =============================================================================
// REGISTRO DE FUENTES
// =============================================================================

Font.register({
  family: 'OpenSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 'bold' },
  ],
});

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingRight: 30,
    paddingBottom: 30,
    paddingLeft: 44,
    fontFamily: 'OpenSans',
    fontSize: 10,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 596,
    height: 843,
    zIndex: -1,
  },
  headerContainer: {
    marginBottom: 15,
  },
  headerLine1: {
    fontFamily: 'OpenSans',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  headerLine2: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  headerLine3: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 5,
  },
  instructions: {
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#808080',
    padding: 3,
    fontWeight: 'bold',
    fontSize: 7,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableCell: {
    padding: 4,
    fontSize: 10,
    minHeight: 16,
  },
  tableCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  normalText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'justify',
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
    height: 60,
  },
  signatureLabel: {
    fontSize: 9,
    textAlign: 'left',
  },
  fingerprintBox: {
    width: 100,
    borderWidth: 1,
    borderColor: '#000',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutSeparator: {
    borderBottomWidth: 3,
    borderBottomColor: '#1e3a5f',
    marginVertical: 20,
    paddingBottom: 10,
  },
  scoutNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
});

// =============================================================================
// INTERFACES
// =============================================================================

interface DNGI03MasivoTemplateProps {
  scouts: ScoutReportData[];
  metadata: {
    organizacion: string;
    fechaGeneracion: string;
  };
  showAlert?: boolean;
  alertMessage?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const DNGI03MasivoTemplate: React.FC<DNGI03MasivoTemplateProps> = ({
  scouts,
  metadata,
  showAlert = false,
  alertMessage = '',
}) => {
  // Helper para renderizar el header
  const renderHeader = (_pageNumber: number, isFirstPage: boolean) => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerLine1}>ASOCIACIÓN DE SCOUTS DEL PERÚ</Text>
      <Text style={styles.headerLine2}>JEFATURA SCOUT NACIONAL</Text>
      <Text style={styles.headerLine3}>DIRECCIÓN NACIONAL DE GESTIÓN INSTITUCIONAL</Text>
      {isFirstPage && (
        <>
          <Text style={styles.headerSubtitle}>FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES</Text>
          <Text style={styles.headerSubtitle}>MENORES DE EDAD - 2026</Text>
        </>
      )}
    </View>
  );

  // Helper para renderizar un familiar
  const renderFamiliar = (familiar: FamiliarReportData, scout: ScoutReportData, index: number) => {
    const tienePropiaDireccion = !!(familiar.direccion || familiar.departamento || familiar.provincia || familiar.distrito);
    const direccionMostrar = tienePropiaDireccion ? familiar.direccion : scout.direccion;
    const departamentoMostrar = tienePropiaDireccion ? familiar.departamento : scout.departamento;
    const provinciaMostrar = tienePropiaDireccion ? familiar.provincia : scout.provincia;
    const distritoMostrar = tienePropiaDireccion ? familiar.distrito : scout.distrito;
    
    return (
      <View style={styles.table} key={`familiar-${index}`}>
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>APELLIDOS COMPLETOS</Text>
          </View>
          <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>NOMBRES COMPLETOS</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
            <Text>{familiar.apellidos || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '50%' }]}>
            <Text>{familiar.nombres || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>SEXO</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>TIPO DE DOCUMENTO</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>NÚMERO DE DOCUMENTO</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>PARENTESCO</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
            <Text>{familiar.sexo || ''}</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%' }]}>
            <Text>{getTipoDocumentoLabel(familiar.tipoDocumento)}</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%' }]}>
            <Text>{familiar.numeroDocumento || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%' }]}>
            <Text>{familiar.parentesco || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CORREO ELECTRÓNICO 1</Text>
          </View>
          <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CORREO ELECTRÓNICO 2</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
            <Text>{familiar.correo || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '50%' }]}>
            <Text>{familiar.correoSecundario || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: '100%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>DIRECCIÓN</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: '100%' }]}>
            <Text>{direccionMostrar || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>DEPARTAMENTO</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>PROVINCIA</Text>
          </View>
          <View style={[styles.tableCell, { width: '33%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>DISTRITO</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
            <Text>{departamentoMostrar || ''}</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
            <Text>{provinciaMostrar || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '33%' }]}>
            <Text>{distritoMostrar || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '40%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>PROFESIÓN U OCUPACIÓN</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '35%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CENTRO LABORAL</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CARGO</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '40%' }]}>
            <Text>{familiar.profesion || ''}</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '35%' }]}>
            <Text>{familiar.centroLaboral || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '25%' }]}>
            <Text>{familiar.cargo || ''}</Text>
          </View>
        </View>
        
        <View style={styles.tableRowLast}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CELULAR 1</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>CELULAR 2</Text>
          </View>
          <View style={[styles.tableCell, { width: '33%', backgroundColor: '#808080' }]}>
            <Text style={styles.tableHeader}>TELÉFONO DEL DOMICILIO</Text>
          </View>
        </View>
        
        <View style={styles.tableRowLast}>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
            <Text>{familiar.celular || ''}</Text>
          </View>
          <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
            <Text>{familiar.celularSecundario || ''}</Text>
          </View>
          <View style={[styles.tableCell, { width: '33%' }]}>
            <Text>{familiar.telefono || ''}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Generar páginas para cada scout
  const renderScoutPages = (scout: ScoutReportData, scoutIndex: number) => {
    const apoderados = scout.familiares?.filter(f => f.esApoderado) || [];
    const fechaRegistro = new Date().toLocaleDateString('es-PE');
    
    const pages: React.ReactNode[] = [];
    
    // PÁGINA 1: Datos del Scout
    pages.push(
      <Page size="A4" style={styles.page} key={`scout-${scoutIndex}-p1`}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(1, true)}
        
        {/* Identificador del Scout en impresión masiva */}
        <View style={{ backgroundColor: '#e0e7ff', padding: 8, marginBottom: 10, borderRadius: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#3730a3' }}>
            Scout #{scoutIndex + 1} de {scouts.length}: {scout.nombre} {scout.apellido}
            {scout.rama && ` • ${scout.rama}`}
          </Text>
        </View>
        
        <Text style={styles.instructions}>
          <Text>Estimado Padre de Familia, apoderado o tutor,</Text>
          {' '}es necesario que todos los datos estén llenos y con información exacta.
        </Text>
        
        <Text style={styles.sectionTitle}>Datos del Miembro Juvenil (menor de edad)</Text>
        
        {/* Tabla principal del Scout */}
        <View style={styles.table}>
          {/* Fila 1: Apellidos y Nombres */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>APELLIDOS COMPLETOS</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>NOMBRES COMPLETOS</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{scout.apellido || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{scout.nombre || ''}</Text>
            </View>
          </View>
          
          {/* Fila 2: Sexo, Fecha Nac, Tipo Doc, Número Doc */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>SEXO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>FECHA DE NACIMIENTO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>TIPO DE DOCUMENTO</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>NÚMERO DE DOCUMENTO</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
              <Text>{scout.sexo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{formatearFecha(scout.fechaNacimiento)}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%' }]}>
              <Text>{getTipoDocumentoLabel(scout.tipoDocumento)}</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%' }]}>
              <Text>{scout.numeroDocumento || scout.numeroRegistro || ''}</Text>
            </View>
          </View>
          
          {/* Fila 3: Región, Localidad, Numeral, Unidad */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>REGIÓN</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '35%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>LOCALIDAD</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>NUMERAL</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>UNIDAD</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>XVIII</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '35%' }]}>
              <Text>LIMA</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>12</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{(scout.rama || 'TROPA').toUpperCase()}</Text>
            </View>
          </View>
          
          {/* Dirección */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '100%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>DIRECCIÓN</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '100%' }]}>
              <Text>{scout.direccion || ''}</Text>
            </View>
          </View>
          
          {/* Departamento, Provincia, Distrito */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>DEPARTAMENTO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>PROVINCIA</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>DISTRITO</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{scout.departamento || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{scout.provincia || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{scout.distrito || ''}</Text>
            </View>
          </View>
          
          {/* Teléfonos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CELULAR 1</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CELULAR 2</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>TELÉFONO FIJO</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{scout.celular || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{scout.celularSecundario || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{scout.telefonoSecundario || ''}</Text>
            </View>
          </View>
          
          {/* Correos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO 1</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO 2</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{scout.email || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{scout.correoSecundario || ''}</Text>
            </View>
          </View>
          
          {/* Centro de Estudio y Datos Médicos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CENTRO DE ESTUDIOS</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>AÑO DE ESTUDIOS</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{scout.centroEstudio || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{scout.anioEstudios || ''}</Text>
            </View>
          </View>
          
          {/* Datos médicos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '18%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>GRUPO SANGUÍNEO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '12%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>FACTOR</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '36%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>SEGURO MÉDICO</Text>
            </View>
            <View style={[styles.tableCell, { width: '34%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>RELIGIÓN</Text>
            </View>
          </View>
          
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '18%' }]}>
              <Text>{scout.grupoSanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '12%' }]}>
              <Text>{scout.factorSanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '36%' }]}>
              <Text>{scout.seguroMedico || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '34%' }]}>
              <Text>{scout.religion || ''}</Text>
            </View>
          </View>
        </View>
        
        {/* Primer apoderado si existe */}
        {apoderados[0] && (
          <>
            <Text style={styles.sectionTitle}>Datos del Padre, Madre o Apoderado</Text>
            {renderFamiliar(apoderados[0], scout, 0)}
          </>
        )}
      </Page>
    );
    
    // PÁGINAS de apoderados adicionales
    apoderados.slice(1).forEach((apoderado, idx) => {
      pages.push(
        <Page size="A4" style={styles.page} key={`scout-${scoutIndex}-apod-${idx}`}>
          <Image src={fondoAnualBase64} style={styles.watermark} fixed />
          {renderHeader(2 + idx, false)}
          
          <Text style={styles.sectionTitle}>
            Datos del Apoderado #{idx + 2} - {scout.nombre} {scout.apellido}
          </Text>
          {renderFamiliar(apoderado, scout, idx + 1)}
        </Page>
      );
    });
    
    // PÁGINA FINAL: Declaración y Firma
    pages.push(
      <Page size="A4" style={styles.page} key={`scout-${scoutIndex}-firma`}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(3, false)}
        
        <View style={{ backgroundColor: '#e0e7ff', padding: 8, marginBottom: 15, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#3730a3' }}>
            Declaración para: {scout.nombre} {scout.apellido}
          </Text>
        </View>
        
        <Text style={styles.normalText}>
          Con la firma de este documento declaro bajo juramento que la información contenida en este{' '}
          <Text style={styles.boldText}>FORMATO DE REGISTRO INSTITUCIONAL</Text> y la documentación 
          adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará bajo la 
          responsabilidad de quién declara y firma.
        </Text>
        
        <Text style={[styles.normalText, { marginTop: 10, marginBottom: 10 }]}>
          <Text style={styles.boldText}>Anexo:</Text>
        </Text>
        
        <View style={{ marginLeft: 20, marginBottom: 15 }}>
          <Text style={styles.normalText}>
            • Copia del documento de identidad del menor
          </Text>
          <Text style={styles.normalText}>
            • Copia de documento de identidad del declarante para validar la firma
          </Text>
          <Text style={styles.normalText}>
            • En caso de ser tutor: Copia del documento que lo acredite como tal
          </Text>
        </View>
        
        {/* Sección de firma y huella - para firma y huella manual física */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              FIRMA (igual que en su documento de identidad)
            </Text>
            <Text style={{ fontSize: 10, marginTop: 15 }}>
              Fecha: {fechaRegistro}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center', marginLeft: 70 }}>
            <View style={[styles.fingerprintBox, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 }]}>
              <Text style={{ fontSize: 9 }}>Huella Digital</Text>
            </View>
          </View>
        </View>
      </Page>
    );
    
    return pages;
  };

  return (
    <Document>
      {/* Alerta de tamaño si aplica */}
      {showAlert && (
        <Page size="A4" style={styles.page}>
          <View style={{ 
            backgroundColor: '#fef3c7', 
            padding: 20, 
            marginTop: 50,
            borderWidth: 2,
            borderColor: '#f59e0b',
            borderRadius: 8
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#92400e', marginBottom: 10 }}>
              ⚠️ ADVERTENCIA
            </Text>
            <Text style={{ fontSize: 11, color: '#92400e' }}>
              {alertMessage}
            </Text>
          </View>
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 12 }}>
              Total de scouts a imprimir: {scouts.length}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 5 }}>
              Generado el: {metadata.fechaGeneracion}
            </Text>
          </View>
        </Page>
      )}
      
      {/* Páginas de cada scout */}
      {scouts.flatMap((scout, index) => renderScoutPages(scout, index))}
    </Document>
  );
};

export default DNGI03MasivoTemplate;
