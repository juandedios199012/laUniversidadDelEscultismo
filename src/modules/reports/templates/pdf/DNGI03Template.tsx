/**
 * Plantilla PDF para Formato de Registro Institucional DNGI-03
 * Documento oficial de 4 páginas para registro de miembros juveniles
 * Diseñado completamente con código @react-pdf/renderer
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
import { ScoutReportData, ReportMetadata, FamiliarReportData } from '../../types/reportTypes';

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

/**
 * Formatea fecha de YYYY-MM-DD a DD-MM-YYYY
 */
const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return '';
  // Si ya tiene formato DD-MM-YYYY, retornar tal cual
  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return fecha;
  // Si tiene formato YYYY-MM-DD, convertir a DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [year, month, day] = fecha.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  }
  return fecha;
};

// =============================================================================
// REGISTRO DE FUENTES
// =============================================================================

// Registrar fuente Open Sans para el cuerpo del documento
Font.register({
  family: 'OpenSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 'bold' },
  ],
});

// Estilos del documento
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'OpenSans',
    fontSize: 10,
  },
  
  // Marca de agua - cubre toda la página A4
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 596,
    height: 843,
    zIndex: -1,
  },
  
  // HEADER (sin cuadro, solo texto)
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 5,
  },
  
  infoText: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  
  // INSTRUCCIONES
  instructions: {
    fontSize: 10,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  
  boldText: {
    fontWeight: 'bold',
  },
  
  // SECCIÓN TITLE
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  
  // TABLAS
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
  
  // Celda compacta para headers de una línea
  tableCellCompact: {
    padding: 2,
    fontSize: 10,
    minHeight: 14,
    justifyContent: 'center',
  },
  
  tableCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  
  // TEXTO
  normalText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'justify',
  },
  
  // LISTA
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 9,
    lineHeight: 1.4,
  },
  
  listNumber: {
    width: 20,
    fontWeight: 'bold',
  },
  
  listContent: {
    flex: 1,
  },
  
  // FIRMA
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
  
  fingerprintLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  
  footer: {
    fontSize: 7,
    color: '#999',
    marginTop: 10,
  },
});

interface DNGI03TemplateProps {
  scout: ScoutReportData;
  metadata: ReportMetadata;
  additionalData?: {
    padre?: any;
    madre?: any;
    tipoRegistro?: string;
    fechaRegistro?: string;
  };
}

export const DNGI03Template: React.FC<DNGI03TemplateProps> = ({
  scout,
  metadata,
  additionalData = {},
}) => {
  // Calcular apoderados y total de páginas
  const apoderados = scout.familiares?.filter(f => f.esApoderado) || [];
  const totalPaginas = 2 + Math.max(0, apoderados.length - 1) + 2; // 1 (scout) + 1 (primer apoderado) + (apoderados adicionales) + 2 (declaración + firma)
  
  // Helper para renderizar el header
  const renderHeader = (pageNumber: number) => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerLine1}>ASOCIACIÓN DE SCOUTS DEL PERÚ</Text>
      <Text style={styles.headerLine2}>JEFATURA SCOUT NACIONAL</Text>
      <Text style={styles.headerLine3}>DIRECCIÓN NACIONAL DE GESTIÓN INSTITUCIONAL</Text>
      {pageNumber === 1 && (
        <>
          <Text style={styles.headerSubtitle}>FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES</Text>
          <Text style={styles.headerSubtitle}>MENORES DE EDAD - 2026</Text>
        </>
      )}
    </View>
  );

  // Helper para renderizar cada familiar dinámicamente
  // Si el familiar no tiene dirección propia, usa la del scout
  const renderFamiliar = (familiar: FamiliarReportData, index: number) => {
    // Verificar si el familiar tiene dirección propia
    const tienePropiaDireccion = !!(familiar.direccion || familiar.departamento || familiar.provincia || familiar.distrito);
    
    // Usar dirección del familiar o del scout como fallback
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
          <Text>{familiar.tipoDocumento || ''}</Text>
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

  return (
    <Document>
      {/* PÁGINA 1: Datos del Miembro Juvenil */}
      <Page size="A4" style={styles.page}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(1)}
        
        <Text style={styles.instructions}>
          <Text>Estimado Padre de Familia, apoderado o tutor,</Text>
          {' '}es necesario que todos los datos estén llenos y con información exacta. 
          Una vez completo, deberá hacérselo llegar a su Jefe de Grupo junto con su documento 
          de identidad (DNI o Carné de Extranjería) y del de su menor hijo o apoderado para el 
          proceso de inscripción.
        </Text>
        
        <Text style={styles.sectionTitle}>Datos del Miembro Juvenil (menor de edad)</Text>
        
        {/* Tabla principal */}
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
              <Text>{scout.tipoDocumento || ''}</Text>
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
          
          {/* Fila 4: Dirección y Código Postal */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '75%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>DIRECCIÓN</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CÓDIGO POSTAL</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '75%' }]}>
              <Text>{scout.direccion || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{''}</Text>
            </View>
          </View>
          
          {/* Fila 5: Departamento, Provincia, Distrito */}
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
          
          {/* Fila 6: Correos electrónicos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO INSTITUCIONAL</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO PERSONAL</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{scout.correoInstitucional || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{scout.email || ''}</Text>
            </View>
          </View>
          
          {/* Fila 7: Celular, Teléfono, Religión */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CELULAR</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>TELÉFONO DEL DOMICILIO</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>RELIGIÓN O CREDO</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{scout.telefono || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{scout.telefonoSecundario || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{scout.religion || ''}</Text>
            </View>
          </View>
          
          {/* Fila 8: Centro de estudios y Año */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '70%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CENTRO DE ESTUDIOS</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>AÑO DE ESTUDIOS</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '70%' }]}>
              <Text>{scout.centroEstudio || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%' }]}>
              <Text>{scout.anioEstudios || ''}</Text>
            </View>
          </View>
          
          {/* Fila 9: Datos médicos */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCellCompact, styles.tableCellBorder, { width: '15%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>GRUPO SANGUÍNEO</Text>
            </View>
            <View style={[styles.tableCellCompact, styles.tableCellBorder, { width: '18%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>FACTOR SANGUÍNEO</Text>
            </View>
            <View style={[styles.tableCellCompact, styles.tableCellBorder, { width: '27%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>SEGURO MÉDICO</Text>
            </View>
            <View style={[styles.tableCellCompact, styles.tableCellBorder, { width: '20%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>TIPO DE DISCAPACIDAD</Text>
            </View>
            <View style={[styles.tableCellCompact, { width: '20%', backgroundColor: '#808080' }]}>
              <Text style={styles.tableHeader}>CARNÉ CONADIS</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
              <Text>{scout.grupoSanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '18%' }]}>
              <Text>{scout.factorSanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '27%' }]}>
              <Text>{scout.seguroMedico || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>{scout.tipoDiscapacidad || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '20%' }]}>
              <Text>{scout.carnetConadis || ''}</Text>
            </View>
          </View>
          
          {/* Fila 10: Especificación de discapacidad */}
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, { width: '100%', backgroundColor: '#808080' }]}>
              <Text style={[styles.tableHeader, { textAlign: 'left' }]}>
                SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO
              </Text>
            </View>
          </View>
          
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, { width: '100%', minHeight: 40 }]}>
              <Text>{scout.descripcionDiscapacidad || ''}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2: Datos de los Padres (Primer Apoderado) */}
      <Page size="A4" style={styles.page}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(2)}
        
        <Text style={styles.sectionTitle}>
          Datos de los Padres de Familia (Tutores o Apoderados)
        </Text>
        
        {/* Renderizar solo el primer familiar que sea apoderado */}
        {(() => {
          const apoderados = scout.familiares?.filter(f => f.esApoderado) || [];
          const primerApoderado = apoderados[0];
          if (primerApoderado) {
            return renderFamiliar(primerApoderado, 0);
          }
          return (
            <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 20, color: '#999' }}>
              No hay apoderados registrados
            </Text>
          );
        })()}
      </Page>

      {/* PÁGINAS ADICIONALES: Otros Apoderados (uno por página) */}
      {(() => {
        const apoderados = scout.familiares?.filter(f => f.esApoderado) || [];
        const apoderadosAdicionales = apoderados.slice(1);
        return apoderadosAdicionales.map((apoderado, index) => (
          <Page key={`apoderado-page-${index + 2}`} size="A4" style={styles.page}>
            <Image src={fondoAnualBase64} style={styles.watermark} fixed />
            {renderHeader(3 + index)}
            
            <Text style={styles.sectionTitle}>
              Datos de los Padres de Familia (Tutores o Apoderados)
            </Text>
            
            {renderFamiliar(apoderado, index + 1)}
          </Page>
        ));
      })()}

      {/* PÁGINA DE DECLARACIÓN: Declaración del Apoderado */}
      <Page size="A4" style={styles.page}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(totalPaginas - 1)}
        
        <Text style={styles.normalText}>
          Yo, <Text style={styles.boldText}>{apoderados[0] ? `${apoderados[0].nombres || ''} ${apoderados[0].apellidos || ''}`.trim() || '______________________' : '______________________'}</Text>
          {' '}como adulto apoderado (padre, madre o tutor) y que suscribe y declara el presente documento, identificado con 
          <Text style={styles.boldText}> DNI N° {apoderados[0]?.numeroDocumento || '___________'}</Text>, comprendo que el movimiento 
          Scout contribuye a la educación de niños y jóvenes para que participen en un mundo mejor, 
          donde las personas se desarrollen plenamente y jueguen un papel constructivo en la sociedad, 
          también declaro que he leído detenidamente cuales son los derechos y deberes de los padres de 
          Familia de acuerdo a los artículos 181, 182 y 183 del{' '}
          <Text style={styles.boldText}>REGLAMENTO DE LA ASOCIACIÓN DE SCOUTS DEL PERÚ</Text>, por lo 
          cual me comprometo a cumplir todos mis deberes para con el{' '}
          <Text style={styles.boldText}>GRUPO SCOUT</Text> y la{' '}
          <Text style={styles.boldText}>ASOCIACIÓN DE SCOUTS DEL PERÚ</Text>, a los que estoy brindando 
          la confianza y autorización para que mi menor hijo (a) participe en sus actividades. Me comprometo 
          también a participar en todas las reuniones, asambleas y/o actividades que se programe en su beneficio.
        </Text>
        
        <Text style={[styles.normalText, { marginTop: 10 }]}>
          <Text style={styles.boldText}>Asimismo:</Text>
        </Text>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>1.</Text>
          <Text style={styles.listContent}>
            Declaro tener conocimiento de la{' '}
            <Text style={styles.boldText}>
              Política para la Protección de los Miembros Juveniles de la Asociación de Scouts del Perú*
            </Text>
            , así como comprometerme a velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>2.</Text>
          <Text style={styles.listContent}>
            Declaro tener conocimiento del{' '}
            <Text style={styles.boldText}>
              Código de Conducta de Adultos de la Asociación de Scouts del Perú*
            </Text>
            , así como comprometerme a velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>3.</Text>
          <Text style={styles.listContent}>
            Declaro tener conocimiento de la{' '}
            <Text style={styles.boldText}>Política Mundial de A Salvo del Peligro*</Text> de la 
            Organización Mundial del Movimiento Scout, así como comprometerme a velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>4.</Text>
          <Text style={styles.listContent}>
            Declaro tener conocimiento de las{' '}
            <Text style={styles.boldText}>Normas para Actividades Scouts*</Text> de la Asociación de 
            Scouts del Perú, así como comprometerme a velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>5.</Text>
          <Text style={styles.listContent}>
            Declaro tener conocimiento de las{' '}
            <Text style={styles.boldText}>Normas para Actividades Scouts*</Text> de la Asociación de 
            Scouts del Perú, así como comprometerme a velar por su cumplimiento
          </Text>
        </View>
        
        <View style={styles.listItem}>
          <Text style={styles.listNumber}>6.</Text>
          <Text style={styles.listContent}>
            Autorizo asignar a mi menor hijo (a) una{' '}
            <Text style={styles.boldText}>cuenta institucional Office 365</Text> (en caso de no tenerla 
            aún) y me comprometo al cumplimiento de las Reglas de Uso de las Cuentas Office 365*.
          </Text>
        </View>
        
        <Text style={[styles.normalText, { marginTop: 15 }]}>
          Autorizo a la Asociación de Scouts del Perú (ASP) el uso de imágenes fotográficas o videos en 
          los que aparece mi menor, en medios de comunicación físicos y virtuales, conforme a lo señalado 
          en las leyes de nuestro país, con la finalidad de difundir las actividades y eventos scout que 
          realizan, sin recibir ningún tipo de retribución o contraprestación por ello.
        </Text>
      </Page>

      {/* PÁGINA FINAL: Firma y Declaración Final */}
      <Page size="A4" style={styles.page}>
        <Image src={fondoAnualBase64} style={styles.watermark} fixed />
        {renderHeader(totalPaginas)}
        
        <Text style={styles.normalText}>
          Con la firma de este documento declaro bajo juramento que la información contenida en este{' '}
          <Text style={styles.boldText}>FORMATO DE REGISTRO INSTITUCIONAL</Text> y la documentación 
          adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará baja la 
          responsabilidad de quién declara y firma.
        </Text>
        
        <Text style={[styles.normalText, { marginTop: 10, marginBottom: 10 }]}>
          <Text style={styles.boldText}>Anexo:</Text>
        </Text>
        
        <View style={{ marginLeft: 20, marginBottom: 15 }}>
          <Text style={styles.normalText}>
            Copia del documento de identidad del menor
          </Text>
          <Text style={styles.normalText}>
            Copia de documento de identidad del declarante para validar la firma
          </Text>
          <Text style={styles.normalText}>
            En caso de ser tutor: Copia del documento que lo acredite como tal
          </Text>
        </View>
        
        {/* Sección de firma - mostrar imagen si existe */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            {/* Mostrar imagen de firma del primer apoderado si existe */}
            {apoderados[0]?.firmaUrl ? (
              <View style={{ height: 60, justifyContent: 'flex-end' }}>
                <Image 
                  src={apoderados[0].firmaUrl} 
                  style={{ height: 55, objectFit: 'contain' }} 
                />
              </View>
            ) : (
              <View style={styles.signatureLine} />
            )}
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
            <Text style={styles.signatureLabel}>
              FIRMA (igual que en su documento de identidad)
            </Text>
            <Text style={{ fontSize: 10, marginTop: 15 }}>
              Fecha: {additionalData.fechaRegistro || '_'.repeat(20)}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center', marginLeft: 70 }}>
            <View style={[styles.fingerprintBox, { justifyContent: 'center', alignItems: 'center' }]}>
              {/* Mostrar imagen de huella digital del primer apoderado si existe */}
              {apoderados[0]?.huellaDigitalUrl ? (
                <Image 
                  src={apoderados[0].huellaDigitalUrl} 
                  style={{ width: 80, height: 100, objectFit: 'contain' }} 
                />
              ) : (
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Huella Digital</Text>
              )}
            </View>
            {!apoderados[0]?.huellaDigitalUrl && (
              <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 5 }}>Huella Digital</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default DNGI03Template;
