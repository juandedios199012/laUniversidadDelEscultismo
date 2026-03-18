/**
 * Plantilla PDF para Historia Medica
 * Documento de Ficha Medica Scout
 * Basado en ANEXO 10/11 - Asociacion de Scouts del Peru
 * 
 * @react-pdf/renderer - No soporta emojis, usar texto plano
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { HistoriaMedicaReportData, ReportMetadata } from '../../types/reportTypes';

// Colores oficiales del documento
const COLORS = {
  primary: '#2E5A8B', // Azul principal headers
  secondary: '#4A90C2', // Azul secundario
  lightBlue: '#E8F4FC', // Fondo claro
  text: '#333333',
  lightGray: '#F5F5F5',
  border: '#000000',
  red: '#CC0000',
};

// Estilos del documento
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  
  // HEADER con logo
  header: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  
  logoContainer: {
    width: 70,
    marginRight: 15,
  },
  
  logoImage: {
    width: 60,
    height: 70,
  },
  
  logoPlaceholder: {
    width: 60,
    height: 70,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  titleContainer: {
    flex: 1,
  },
  
  mainTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 20,
  },
  
  // SECCIONES
  section: {
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 8,
    textDecoration: 'underline',
  },
  
  // TABLA ESTILO ANEXO 10
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 22,
  },
  
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 22,
  },
  
  // Header azul de tabla
  tableHeaderCell: {
    backgroundColor: COLORS.primary,
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    justifyContent: 'center',
  },
  
  // Celda de label azul
  labelCell: {
    backgroundColor: COLORS.primary,
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  
  // Celda de valor
  valueCell: {
    backgroundColor: '#FFFFFF',
    padding: 5,
    fontSize: 9,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  
  valueCellLast: {
    backgroundColor: '#FFFFFF',
    padding: 5,
    fontSize: 9,
    justifyContent: 'center',
  },
  
  // Tabla de condiciones (SI/NO)
  checkboxCell: {
    width: 30,
    padding: 3,
    fontSize: 8,
    textAlign: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  
  condicionCell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  
  fechaCell: {
    width: 120,
    padding: 5,
    fontSize: 8,
  },
  
  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#666',
  },
  
  footerTitle: {
    color: COLORS.primary,
    fontSize: 7,
  },
  
  // AVISO CONFIDENCIAL
  confidencialBox: {
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 10,
    marginTop: 15,
    marginBottom: 15,
  },
  
  confidencialText: {
    color: COLORS.primary,
    fontSize: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // FIRMAS
  firmaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  
  firmaBox: {
    width: '45%',
  },
  
  firmaLinea: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 5,
    height: 40,
  },
  
  firmaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  
  firmaSubLabel: {
    fontSize: 7,
    marginTop: 2,
  },
  
  // Nota responsabilidad
  responsabilidadBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginTop: 15,
  },
  
  responsabilidadText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  
  // Empty state
  emptyText: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    padding: 5,
  },
});

// Función para formatear fecha
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Función para obtener prescriptores de medicamentos concatenados
const getPrescriptores = (medicamentos: { prescritoPor?: string }[]): string => {
  const prescriptores = medicamentos
    .map(m => m.prescritoPor)
    .filter((p): p is string => !!p && p.trim() !== '')
    .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados
  
  if (prescriptores.length === 0) return '';
  return prescriptores.join('; ');
};

// Función para formatear grupo sanguíneo con factor
const formatGrupoSanguineo = (grupo?: string, factor?: string): string => {
  if (!grupo) return '';
  const grupoStr = grupo.toUpperCase();
  const factorStr = factor ? (factor.includes('+') || factor.includes('-') ? factor : `${factor}`) : '';
  return `${grupoStr}${factorStr ? ' ' + factorStr : ''}`;
};

interface HistoriaMedicaReportTemplateProps {
  data: HistoriaMedicaReportData;
  metadata: ReportMetadata;
  logoUrl?: string;
}

export const HistoriaMedicaReportTemplate: React.FC<HistoriaMedicaReportTemplateProps> = ({
  data,
  metadata,
  logoUrl,
}) => {
  return (
    <Document>
      {/* PÁGINA 1: Información General / Historial de Salud */}
      <Page size="A4" style={styles.page}>
        {/* Header con Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 6, color: '#999', textAlign: 'center' }}>
                  Scouts{'\n'}del Peru
                </Text>
              </View>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>
              ANEXO 10 - FICHA MEDICA: INFORMACION GENERAL / HISTORIAL DE SALUD
            </Text>
          </View>
        </View>

        {/* Tabla Datos Personales */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '25%' }]}>
              <Text>Fecha de llenado:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '75%' }]}>
              <Text>{formatDate(data.fechaLlenado)}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '25%' }]}>
              <Text>Nombre Completo:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '75%' }]}>
              <Text>{data.nombreCompleto || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '25%' }]}>
              <Text>Lugar y Fecha de Nacimiento:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '75%' }]}>
              <Text>{data.lugarNacimiento || ''} - {formatDate(data.fechaNacimiento)}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Edad:</Text>
            </View>
            <View style={[styles.valueCell, { width: '21%' }]}>
              <Text>{data.edad} años</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>DNI:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '55%' }]}>
              <Text>{data.numeroDocumento || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '15%' }]}>
              <Text>Estatura (m):</Text>
            </View>
            <View style={[styles.valueCell, { width: '18%' }]}>
              <Text>{data.estaturaCm ? data.estaturaCm.toFixed(2) : ''}</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Peso (kg):</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '55%' }]}>
              <Text>{data.pesoKg || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '25%' }]}>
              <Text>Grupo sanguineo y Rh:</Text>
            </View>
            <View style={[styles.valueCell, { width: '25%' }]}>
              <Text>{formatGrupoSanguineo(data.grupoSanguineo, data.factorSanguineo)}</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Genero:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '38%' }]}>
              <Text>{data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Femenino' : data.sexo || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '15%' }]}>
              <Text>Direccion:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '85%' }]}>
              <Text>{data.direccion || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Distrito:</Text>
            </View>
            <View style={[styles.valueCell, { width: '21%' }]}>
              <Text>{data.distrito || ''}</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Provincia:</Text>
            </View>
            <View style={[styles.valueCell, { width: '21%' }]}>
              <Text>{data.provincia || ''}</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>Region:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '22%' }]}>
              <Text>{data.departamento || ''}</Text>
            </View>
          </View>
          
          <View style={styles.tableRowLast}>
            <View style={[styles.labelCell, { width: '25%' }]}>
              <Text>Compania de Seguros:</Text>
            </View>
            <View style={[styles.valueCell, { width: '25%' }]}>
              <Text>{data.seguroMedico || ''}</Text>
            </View>
            <View style={[styles.labelCell, { width: '12%' }]}>
              <Text>N Poliza:</Text>
            </View>
            <View style={[styles.valueCellLast, { width: '38%' }]}>
              <Text>{data.numeroPoliza || ''}</Text>
            </View>
          </View>
        </View>

        {/* Contacto de Emergencia */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={[styles.sectionTitle, { textDecoration: 'none', fontFamily: 'Helvetica-Bold' }]}>
            EN CASO DE EMERGENCIA NOTIFICAR A LA SIGUIENTE PERSONA:
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Nombre:</Text>
              </View>
              <View style={[styles.valueCell, { width: '45%' }]}>
                <Text>{data.contactoEmergencia?.nombre || ''}</Text>
              </View>
              <View style={[styles.labelCell, { width: '15%' }]}>
                <Text>Parentesco:</Text>
              </View>
              <View style={[styles.valueCellLast, { width: '20%' }]}>
                <Text>{data.contactoEmergencia?.parentesco || ''}</Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Direccion:</Text>
              </View>
              <View style={[styles.valueCellLast, { width: '80%' }]}>
                <Text>{data.direccion || ''}</Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Telefono casa:</Text>
              </View>
              <View style={[styles.valueCell, { width: '30%' }]}>
                <Text>{data.telefonoCasa || ''}</Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Telefono movil:</Text>
              </View>
              <View style={[styles.valueCellLast, { width: '30%' }]}>
                <Text>{data.contactoEmergencia?.celular || ''}</Text>
              </View>
            </View>
            
            <View style={styles.tableRow}>
              <View style={[styles.labelCell, { width: '35%' }]}>
                <Text>Nombre de contacto alternativo:</Text>
              </View>
              <View style={[styles.valueCellLast, { width: '65%' }]}>
                <Text>{data.contactoAlternativo?.nombre || ''}</Text>
              </View>
            </View>
            
            <View style={styles.tableRowLast}>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Parentesco:</Text>
              </View>
              <View style={[styles.valueCell, { width: '30%' }]}>
                <Text>{data.contactoAlternativo?.parentesco || ''}</Text>
              </View>
              <View style={[styles.labelCell, { width: '20%' }]}>
                <Text>Telefono movil:</Text>
              </View>
              <View style={[styles.valueCellLast, { width: '30%' }]}>
                <Text>{data.contactoAlternativo?.celular || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Historial de Salud */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={[styles.sectionTitle, { textDecoration: 'underline' }]}>
            HISTORIAL DE SALUD
          </Text>
          <Text style={{ fontSize: 8, marginBottom: 5 }}>
            Actualmente recibe o ha recibido tratamiento para alguna de las siguientes condiciones?
          </Text>
          
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { width: 30 }]}>
                <Text>SI</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 30, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>NO</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>CONDICION</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 120 }]}>
                <Text>Fecha de Atencion</Text>
              </View>
            </View>
            
            {/* Mapear condiciones por nombre a las filas del cuadro */}
            {[
              { fila: 'Diabetes Mellitus', nombres: ['diabetes'] },
              { fila: 'Hipertension Arterial', nombres: ['hipertension', 'hipertensión'] },
              { fila: 'Asma', nombres: ['asma'] },
              { fila: 'Convulsiones', nombres: ['convulsion', 'epilepsia'] },
              { fila: 'Lesion traumatica', nombres: ['lesion', 'lesión', 'traumatic', 'trauma'] },
              { fila: 'Tratamiento psicologico o psiquiatrico', nombres: ['psicolog', 'psiquiat'] },
              { fila: 'Cirugias y hospitalizaciones', nombres: ['cirug', 'hospital'] },
            ].map((item, idx) => {
              const condicionEncontrada = data.condiciones.find(c => 
                item.nombres.some(n => c.nombre?.toLowerCase().includes(n))
              );
              const tieneSI = !!condicionEncontrada;
              
              return (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.checkboxCell}>
                    <Text>{tieneSI ? 'X' : ''}</Text>
                  </View>
                  <View style={styles.checkboxCell}>
                    <Text>{!tieneSI ? 'X' : ''}</Text>
                  </View>
                  <View style={styles.condicionCell}>
                    <Text>{item.fila}</Text>
                  </View>
                  <View style={styles.fechaCell}>
                    <Text>{condicionEncontrada?.fechaDiagnostico ? formatDate(condicionEncontrada.fechaDiagnostico) : ''}</Text>
                  </View>
                </View>
              );
            })}
            
            {/* Otra condición no mencionada en la presente lista */}
            {(() => {
              const otraCondicion = data.condiciones.find(c => 
                c.nombre?.toLowerCase().includes('otra condici')
              );
              const tieneOtra = !!otraCondicion;
              
              return (
                <View style={styles.tableRowLast}>
                  <View style={styles.checkboxCell}>
                    <Text>{tieneOtra ? 'X' : ''}</Text>
                  </View>
                  <View style={styles.checkboxCell}>
                    <Text>{!tieneOtra ? 'X' : ''}</Text>
                  </View>
                  <View style={styles.condicionCell}>
                    <Text>Otra condicion no mencionada en la presente lista:</Text>
                    {tieneOtra && otraCondicion?.tratamiento && (
                      <Text style={{ fontSize: 7, marginTop: 2 }}>
                        {otraCondicion.tratamiento}
                      </Text>
                    )}
                  </View>
                  <View style={styles.fechaCell}>
                    <Text>{tieneOtra && otraCondicion?.fechaDiagnostico ? formatDate(otraCondicion.fechaDiagnostico) : ''}</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTitle}>ANEXO 11 - Ficha Medica ({metadata.organizacion})</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* PÁGINA 2: Alergias y Medicamentos */}
      <Page size="A4" style={styles.page}>
        {/* Header con Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 6, color: '#999', textAlign: 'center' }}>
                  Scouts{'\n'}del Peru
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Alergias */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textDecoration: 'underline' }]}>
            ALERGIAS O REACCIONES ADVERSAS
          </Text>
          <Text style={{ fontSize: 8, marginBottom: 5 }}>
            Tiene alergias, o presenta reaccion adversa a alguno de los siguientes?
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { width: 30 }]}>
                <Text>SI</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 30, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>NO</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 150, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>ALERGIAS O REACCIONES</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>MENCIONAR</Text>
              </View>
            </View>
            
            {/* Mapear alergias por nombre a las filas del cuadro */}
            {[
              { fila: 'Medicamentos', nombres: ['medicamentos', 'medicamento', 'penicilina', 'aspirina', 'ibuprofeno', 'sulfas', 'anestésico', 'anestesico', 'otros medicamentos'] },
              { fila: 'Alimentos', nombres: ['alimentos', 'alimento', 'maní', 'mani', 'mariscos', 'pescado', 'huevo', 'leche', 'lácteos', 'lacteos', 'gluten', 'trigo', 'soya', 'frutos secos', 'otros alimentos'] },
              { fila: 'Plantas', nombres: ['plantas', 'planta', 'polen', 'ácaros', 'acaros', 'moho', 'pelo de animales', 'ambiental'] },
              { fila: 'Picaduras / mordeduras de insectos', nombres: ['picaduras', 'insectos', 'mordeduras', 'insecto', 'picadura'] },
              { fila: 'Sustancias u otros', nombres: ['sustancias', 'otros', 'otra', 'látex', 'latex', 'níquel', 'niquel', 'cosméticos', 'cosmeticos', 'contacto'] },
            ].map((item, idx) => {
              const alergiasEnFila = data.alergias.filter(a => 
                item.nombres.some(n => a.nombre?.toLowerCase().includes(n))
              );
              const tieneSI = alergiasEnFila.length > 0;
              const mencionar = alergiasEnFila.map(a => a.mencionar || '').filter(Boolean).join(', ');
              
              return (
                <View key={idx} style={idx === 4 ? styles.tableRowLast : styles.tableRow}>
                  <View style={styles.checkboxCell}>
                    <Text>{tieneSI ? 'X' : ''}</Text>
                  </View>
                  <View style={styles.checkboxCell}>
                    <Text>{!tieneSI ? 'X' : ''}</Text>
                  </View>
                  <View style={{ width: 150, padding: 5, fontSize: 8, borderRightWidth: 1, borderRightColor: COLORS.border }}>
                    <Text>{item.fila}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 5, fontSize: 8 }}>
                    <Text>{mencionar}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Medicamentos */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={[styles.sectionTitle, { textDecoration: 'underline' }]}>
            REGISTRE LOS MEDICAMENTOS ADMINISTRADOS ACTUALMENTE, INCLUYENDO MEDICAMENTOS SIN RECETA MEDICA
          </Text>
          
          {data.medicamentos.filter(m => m.activo).length === 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: '#000', marginRight: 5, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 8 }}>X</Text>
              </View>
              <Text style={{ fontSize: 8 }}>MARQUE AQUI SI NO SE TOMAN MEDICAMENTOS RUTINARIAMENTE</Text>
            </View>
          )}
          
          <Text style={{ fontSize: 7, marginBottom: 5, fontStyle: 'italic' }}>
            Si necesita espacio adicional, por favor indiquelo en una hoja aparte, firmela y anexela.
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { width: '25%', borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>MEDICAMENTO</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '15%', borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>DOSIS</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '20%', borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>FRECUENCIA</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '40%' }]}>
                <Text>FECHA DE INICIO Y DURACION</Text>
              </View>
            </View>
            
            {data.medicamentos.filter(m => m.activo).length > 0 ? (
              data.medicamentos.filter(m => m.activo).map((med, idx, arr) => (
                <View key={idx} style={idx === arr.length - 1 ? styles.tableRowLast : styles.tableRow}>
                  <View style={[styles.valueCell, { width: '25%' }]}>
                    <Text>{med.nombre}</Text>
                  </View>
                  <View style={[styles.valueCell, { width: '15%' }]}>
                    <Text>{med.dosis}</Text>
                  </View>
                  <View style={[styles.valueCell, { width: '20%' }]}>
                    <Text>{med.frecuencia}</Text>
                  </View>
                  <View style={[styles.valueCellLast, { width: '40%' }]}>
                    <Text>{med.fechaInicio ? formatDate(med.fechaInicio) : ''}</Text>
                  </View>
                </View>
              ))
            ) : (
              // Filas vacías para llenar a mano
              [1, 2, 3].map((_, idx) => (
                <View key={idx} style={idx === 2 ? styles.tableRowLast : styles.tableRow}>
                  <View style={[styles.valueCell, { width: '25%', minHeight: 20 }]}><Text></Text></View>
                  <View style={[styles.valueCell, { width: '15%' }]}><Text></Text></View>
                  <View style={[styles.valueCell, { width: '20%' }]}><Text></Text></View>
                  <View style={[styles.valueCellLast, { width: '40%' }]}><Text></Text></View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Caja de autorización */}
        <View style={{ borderWidth: 1, borderColor: COLORS.border, padding: 8, marginTop: 15 }}>
          <Text style={{ fontSize: 8 }}>
            La administracion de medicamentos indicados para el menor esta aprobada por (colocar nombres, apellidos y documento de identidad): {getPrescriptores(data.medicamentos)}
          </Text>
          <View style={{ height: 20 }} />
        </View>

        {/* Nota de responsabilidad */}
        <View style={styles.responsabilidadBox}>
          <Text style={styles.responsabilidadText}>
            ES RESPONSABILIDAD DEL PADRE O TUTOR INFORMAR A LOS ADULTOS RESPONSABLES DEL GRUPO SCOUT, SI EXISTIESE ALGUNA CONDICION MEDICA POSTERIOR A LO DECLARADO EN EL PRESENTE DOCUMENTO, QUE PUEDA AFECTAR, AFECTE O PRESENTE UN RIESGO LATENTE, AL NORMAL DESARROLLO DE LAS ACTIVIDADES DE SU HIJO O HIJA EN EL MOVIMIENTO SCOUT.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTitle}>ANEXO 11 - Ficha Medica (Normas para Actividades Externas y/o al Aire Libre de la ASP)</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* PÁGINA 3: Vacunas y Firmas */}
      <Page size="A4" style={styles.page}>
        {/* Header con Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 6, color: '#999', textAlign: 'center' }}>
                  Scouts{'\n'}del Peru
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Vacunas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textDecoration: 'underline' }]}>
            INMUNIZACIONES (VACUNAS)
          </Text>
          <Text style={{ fontSize: 8, marginBottom: 5 }}>
            Ha recibido alguna de las siguientes vacunas?
          </Text>
          
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableHeaderCell, { width: 30 }]}>
                <Text>SI</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 30, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>NO</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: 180, borderRightWidth: 1, borderRightColor: '#fff' }]}>
                <Text>VACUNA</Text>
              </View>
              <View style={[styles.tableHeaderCell, { flex: 1 }]}>
                <Text>FECHA (ULTIMA DOSIS)</Text>
              </View>
            </View>
            
            {[
              { nombre: 'Antiamarilica (fiebre amarilla)', vacuna: data.vacunas.find(v => v.nombre.toLowerCase().includes('amaril') || v.nombre.toLowerCase().includes('fiebre')) },
              { nombre: 'Hepatitis B', vacuna: data.vacunas.find(v => v.nombre.toLowerCase().includes('hepatitis')) },
              { nombre: 'Influenza', vacuna: data.vacunas.find(v => v.nombre.toLowerCase().includes('influenza') || v.nombre.toLowerCase().includes('gripe')) },
              { nombre: 'COVID - 19', vacuna: data.vacunas.find(v => v.nombre.toLowerCase().includes('covid')) },
              { nombre: 'Neumococo', vacuna: data.vacunas.find(v => v.nombre.toLowerCase().includes('neumococo') || v.nombre.toLowerCase().includes('neumonia')) },
            ].map((item, idx) => (
              <View key={idx} style={idx === 4 ? styles.tableRowLast : styles.tableRow}>
                <View style={styles.checkboxCell}>
                  <Text>{item.vacuna ? 'X' : ''}</Text>
                </View>
                <View style={styles.checkboxCell}>
                  <Text>{!item.vacuna ? 'X' : ''}</Text>
                </View>
                <View style={{ width: 180, padding: 5, fontSize: 8, borderRightWidth: 1, borderRightColor: COLORS.border }}>
                  <Text>{item.nombre}</Text>
                </View>
                <View style={{ flex: 1, padding: 5, fontSize: 8 }}>
                  <Text>{item.vacuna?.fechaAplicacion ? formatDate(item.vacuna.fechaAplicacion) : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Restricciones */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <View style={{ borderWidth: 1, borderColor: COLORS.border, padding: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>
              Restriccion fisica, psicologica, neurologica u otra del participante, si existiese, en:
            </Text>
            <Text style={{ fontSize: 9, minHeight: 50 }}>
              {data.observacionesGenerales || ''}
            </Text>
          </View>
        </View>

        {/* Box Confidencial */}
        <View style={styles.confidencialBox}>
          <Text style={styles.confidencialText}>
            La informacion contenida en esta ficha medica es estrictamente confidencial. Sera vista unicamente por el Equipo de Adultos Voluntarios Responsables, el personal de salud y otros que comprendan el caracter reservado de la presente informacion.
          </Text>
        </View>

        {/* Firmas de Consentimiento */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 20 }}>
            FIRMAS DE CONSENTIMIENTO INFORMADO (firmar la que corresponda)
          </Text>
          
          <View style={styles.firmaContainer}>
            <View style={styles.firmaBox}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaLabel}>Firma del participante mayor de edad</Text>
              <Text style={styles.firmaSubLabel}>Nombres y Apellidos: {data.nombreCompleto || '_____________________'}</Text>
              <Text style={styles.firmaSubLabel}>DNI: {data.numeroDocumento || '_____________________'}</Text>
            </View>
            
            <View style={styles.firmaBox}>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaLabel}>Firma del padre o tutor del participante menor de edad</Text>
              <Text style={styles.firmaSubLabel}>Nombres y Apellidos: {data.contactoEmergencia?.nombre || '_____________________'}</Text>
              <Text style={styles.firmaSubLabel}>DNI: {data.contactoEmergencia?.numeroDocumento || '_____________________'}</Text>
              <Text style={[styles.firmaSubLabel, { marginTop: 5 }]}>Nombres y Apellidos del menor: {data.nombreCompleto || '_____________________'}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerTitle}>ANEXO 11 - Ficha Medica (Normas para Actividades Externas y/o al Aire Libre de la ASP)</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default HistoriaMedicaReportTemplate;
