/**
 * Plantilla PDF para Formato de Registro Institucional DNGI-02
 * Documento oficial para registro de Adultos Voluntarios
 * Diseñado con @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Dirigente, CARGOS_LABELS, TIPOS_MEMBRESIA_LABELS } from '../../../../types/dirigente';

// Estilos del documento
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  
  // HEADER
  headerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  
  logoSection: {
    width: '20%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logoText: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
  
  titleSection: {
    width: '55%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  title: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#666',
  },
  
  infoSection: {
    width: '25%',
    padding: 5,
  },
  
  infoText: {
    fontSize: 7,
    color: '#666',
    marginBottom: 1,
  },
  
  // INSTRUCCIONES
  instructions: {
    fontSize: 8,
    marginBottom: 6,
    lineHeight: 1.3,
    textAlign: 'justify',
  },
  
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },
  
  // SECCIÓN TITLE
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 6,
  },
  
  // TABLAS - Más compactas
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 4,
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
    backgroundColor: '#999',
    padding: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6,
    color: '#000',
    textAlign: 'center',
  },
  
  tableCell: {
    padding: 3,
    fontSize: 8,
    minHeight: 12,
  },
  
  tableCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  
  // TEXTO
  normalText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 4,
    textAlign: 'justify',
  },
  
  // LISTA DECLARACIONES
  declarationItem: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 8,
    lineHeight: 1.3,
  },
  
  declarationNumber: {
    width: 15,
    fontFamily: 'Helvetica-Bold',
  },
  
  declarationContent: {
    flex: 1,
    textAlign: 'justify',
  },
  
  // BOX ANTECEDENTES
  antecedentesBox: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
    minHeight: 35,
    marginBottom: 6,
  },
  
  // FIRMA
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  
  signatureBox: {
    width: '55%',
  },
  
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
    height: 50,
  },
  
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  
  fingerprintBox: {
    width: '25%',
    borderWidth: 1,
    borderColor: '#000',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  fingerprintLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  
  footer: {
    fontSize: 7,
    color: '#999',
    marginTop: 'auto',
    paddingTop: 10,
  },
});

interface DNGI02TemplateProps {
  dirigente: Dirigente;
  metadata?: {
    fechaGeneracion?: string;
  };
}

export const DNGI02Template: React.FC<DNGI02TemplateProps> = ({
  dirigente,
  metadata = {},
}) => {
  const fechaActual = metadata.fechaGeneracion || new Date().toLocaleDateString('es-PE');
  const sexoTexto = dirigente.persona.sexo === 'M' ? 'M' : dirigente.persona.sexo === 'F' ? 'F' : '';
  const fechaNac = dirigente.persona.fecha_nacimiento 
    ? new Date(dirigente.persona.fecha_nacimiento).toLocaleDateString('es-PE') 
    : '';
  const cargoLabel = CARGOS_LABELS[dirigente.cargo as keyof typeof CARGOS_LABELS] || dirigente.cargo || '';
  const membresiaLabel = TIPOS_MEMBRESIA_LABELS[dirigente.tipo_membresia as keyof typeof TIPOS_MEMBRESIA_LABELS] || 'Registro Anual Regular';

  // Helper para renderizar el header
  const renderHeader = (pageNumber: number, totalPages: number = 3) => (
    <View style={styles.headerContainer}>
      <View style={styles.logoSection}>
        <Text style={styles.logoText}>Scouts del Perú</Text>
        <Text style={[styles.logoText, { fontSize: 6 }]}>Jóvenes con Futuro</Text>
      </View>
      
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          FORMATO DE REGISTRO INSTITUCIONAL{'\n'}
          PARA ADULTOS VOLUNTARIOS
        </Text>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Código: DNGI-02</Text>
        <Text style={styles.infoText}>Fecha: {fechaActual}</Text>
        <Text style={styles.infoText}>Versión: 2.1</Text>
        <Text style={styles.infoText}>Páginas: Página {pageNumber} de {totalPages}</Text>
      </View>
    </View>
  );

  // Helper para footer
  const renderFooter = () => (
    <Text style={styles.footer}>
      * Publicado en la página web de la Asociación de Scouts del Perú.
    </Text>
  );

  return (
    <Document>
      {/* PÁGINA 1: Datos Personales */}
      <Page size="A4" style={styles.page}>
        {renderHeader(1)}
        
        <Text style={styles.instructions}>
          <Text style={styles.boldText}>Estimado Adulto Voluntario – Miembro Colaborador</Text>
          {' '}es necesario que todos los datos estén llenos y con información exacta, una vez completo, 
          deberá hacérselo llegar a su Jefe de Grupo junto con los anexos solicitados, así como con su 
          documento de identidad (DNI o Carné de Extranjería) para el proceso de inscripción.
        </Text>
        
        {/* Tabla: Apellidos y Nombres */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>APELLIDOS COMPLETOS</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>NOMBRES COMPLETOS</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{dirigente.persona.apellidos || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{dirigente.persona.nombres || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Sexo, Fecha Nac, Tipo Doc, Número Doc */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>SEXO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>FECHA DE NACIMIENTO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>TIPO DE DOCUMENTO</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>NÚMERO DE DOCUMENTO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
              <Text>{sexoTexto}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{fechaNac}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '30%' }]}>
              <Text>{dirigente.persona.tipo_documento || 'DNI'}</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%' }]}>
              <Text>{dirigente.persona.numero_documento || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Religión, Correos */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>RELIGIÓN O CREDO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO INSTITUCIONAL</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CORREO ELECTRÓNICO PERSONAL</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{dirigente.persona.religion || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{dirigente.persona.correo_institucional || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{dirigente.persona.correo || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Región, Localidad, Numeral, Unidad, Cargo */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>REGIÓN</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>LOCALIDAD</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>NUMERAL</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>UNIDAD</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CARGO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>{dirigente.region_scout || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>{dirigente.localidad_scout || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '15%' }]}>
              <Text>{dirigente.numeral_grupo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '20%' }]}>
              <Text>{dirigente.unidad || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{cargoLabel}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Dirección, Código Postal */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '75%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>DIRECCIÓN</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CÓDIGO POSTAL</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '75%' }]}>
              <Text>{dirigente.persona.direccion || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{dirigente.persona.codigo_postal || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Departamento, Provincia, Distrito */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>DEPARTAMENTO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>PROVINCIA</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>DISTRITO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{dirigente.persona.departamento || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{dirigente.persona.provincia || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{dirigente.persona.distrito || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: CONADIS, Discapacidad, Profesión */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CARNÉ CONADIS</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>TIPO DE DISCAPACIDAD</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>PROFESIÓN U OCUPACIÓN</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '33%' }]}>
              <Text>{dirigente.persona.carnet_conadis || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '34%' }]}>
              <Text>{dirigente.persona.tipo_discapacidad || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '33%' }]}>
              <Text>{''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Grupo Sanguíneo, Factor, Seguro, Teléfono */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>GRUPO SANGUÍNEO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>FACTOR SANGUÍNEO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>SEGURO MÉDICO</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>TELÉFONO MÓVIL</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{dirigente.persona.grupo_sanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{dirigente.persona.factor_sanguineo || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{dirigente.persona.seguro_medico || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{dirigente.persona.celular || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Discapacidad descripción - altura 3cm = ~85 puntos */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: '100%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, { width: '100%', minHeight: 85 }]}>
              <Text>{dirigente.persona.descripcion_discapacidad || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Centro de Estudios */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '80%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CENTRO DE ESTUDIOS</Text>
            </View>
            <View style={[styles.tableCell, { width: '20%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CICLO O AÑO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '80%' }]}>
              <Text>{dirigente.centro_estudios || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '20%' }]}>
              <Text>{dirigente.ciclo_anio_estudios || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Centro Laboral */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CENTRO LABORAL</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CARGO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{dirigente.centro_laboral || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>{dirigente.cargo_laboral || ''}</Text>
            </View>
          </View>
        </View>

        {/* Tabla: Contacto Emergencia */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>CONTACTO DE EMERGENCIA – NOMBRE Y APELLIDO</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>TELÉFONO</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%', backgroundColor: '#999' }]}>
              <Text style={styles.tableHeader}>PARENTESCO</Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '50%' }]}>
              <Text>{dirigente.contacto_emergencia?.nombre || ''}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellBorder, { width: '25%' }]}>
              <Text>{dirigente.contacto_emergencia?.telefono || ''}</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>{dirigente.contacto_emergencia?.parentesco || ''}</Text>
            </View>
          </View>
        </View>

        {renderFooter()}
      </Page>

      {/* PÁGINA 2: Declaraciones */}
      <Page size="A4" style={styles.page}>
        {renderHeader(2)}
        
        <Text style={styles.sectionTitle}>Como Adulto Voluntario:</Text>
        
        <View style={styles.declarationItem}>
          <Text style={styles.declarationNumber}>1.</Text>
          <Text style={styles.declarationContent}>
            Declaro haber leído y entendido la{' '}
            <Text style={styles.boldText}>Política para la Protección de los Miembros Juveniles de la Asociación de Scouts del Perú*</Text>
            , así como comprometerme a cumplirla y velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.declarationItem}>
          <Text style={styles.declarationNumber}>2.</Text>
          <Text style={styles.declarationContent}>
            Declaro haber leído y entendido el{' '}
            <Text style={styles.boldText}>Código de Conducta de Adultos de la Asociación de Scouts del Perú*</Text>
            , así como comprometerme a cumplirlo y velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.declarationItem}>
          <Text style={styles.declarationNumber}>3.</Text>
          <Text style={styles.declarationContent}>
            Declaro haber aprobado el{' '}
            <Text style={styles.boldText}>SfH1: Aprendizajes Fundamentales de Safe from Harm 1</Text>
            , así como comprometerme a cumplirlo y velar por su cumplimiento.
          </Text>
        </View>
        
        <View style={styles.declarationItem}>
          <Text style={styles.declarationNumber}>4.</Text>
          <Text style={styles.declarationContent}>
            Autorizo se me asigne una{' '}
            <Text style={styles.boldText}>cuenta institucional</Text>
            {' '}(en caso de no tenerla aun) y me comprometo al cumplimiento de las Reglas de Uso de las Cuentas Office 365*.
          </Text>
        </View>
        
        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Asimismo:</Text>
        
        <Text style={styles.normalText}>Declaro bajo juramento No tener Antecedentes Policiales;</Text>
        <Text style={styles.normalText}>Declaro bajo juramento No tener Antecedentes Judiciales;</Text>
        <Text style={styles.normalText}>Declaro bajo juramento No tener Antecedentes Penales.</Text>
        
        <Text style={[styles.normalText, { marginTop: 10 }]}>
          En caso de contar con algún antecedente policial, judicial o penal, explique las circunstancias y precise número de expediente:
        </Text>
        
        <View style={styles.antecedentesBox}>
          <Text>{dirigente.detalle_antecedentes || ''}</Text>
        </View>
        
        <Text style={styles.normalText}>
          Autorizo a la Asociación de Scouts del Perú (ASP) el uso de imágenes fotográficas o videos en los que aparezco, 
          en medios de comunicación físicos y virtuales, conforme a lo señalado en las leyes de nuestro país, con la finalidad 
          de difundir las actividades y eventos scout que realizan, sin recibir ningún tipo de retribución o contraprestación por ello.
        </Text>
        
        <Text style={[styles.normalText, { marginTop: 10 }]}>
          <Text style={styles.boldText}>Plan de membresía: </Text>
          {membresiaLabel}
        </Text>

        {renderFooter()}
      </Page>

      {/* PÁGINA 3: Firma y Anexos */}
      <Page size="A4" style={styles.page}>
        {renderHeader(3)}
        
        <Text style={styles.normalText}>
          Con este documento, declaro bajo juramento que la información contenida en este{' '}
          <Text style={styles.boldText}>FORMATO DE REGISTRO INSTITUCIONAL</Text>
          {' '}y la documentación adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará bajo la responsabilidad de quien declara.
        </Text>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Anexo:</Text>
        
        <Text style={styles.normalText}>• Copia del documento de identidad por ambas caras.</Text>
        <Text style={styles.normalText}>• Certificado curso SFH1 para Adultos Voluntarios.</Text>
        
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>FIRMA (igual que en su documento de identidad)</Text>
          </View>
          
          <View style={styles.fingerprintBox}>
            <Text style={styles.fingerprintLabel}>Huella Digital</Text>
          </View>
        </View>

        {renderFooter()}
      </Page>
    </Document>
  );
};

export default DNGI02Template;
