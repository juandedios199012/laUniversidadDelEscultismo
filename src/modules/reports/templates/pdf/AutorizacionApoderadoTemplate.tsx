/**
 * Plantilla PDF para "Autorización del Padre o Apoderado" (ANEXO 4)
 * Se autocompleta la identificación del Scout y de su Apoderado Legal;
 * la tabla de datos de la actividad queda en blanco para llenarla a mano
 * en cada actividad.
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
import { AutorizacionApoderadoReportData } from '../../types/reportTypes';
import { marcaAguaFichaMedicaBase64 } from '../../../../assets/images/marcaAguaFichaMedicaBase64';

const COLORS = {
  primary: '#4F81BD',
  border: '#000000',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 595,
    height: 842,
    zIndex: -1,
  },
  mainTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
  },
  subTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-BoldOblique',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 4,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 20,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 20,
  },
  labelCell: {
    width: '35%',
    backgroundColor: COLORS.primary,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  valueCell: {
    width: '65%',
    padding: 4,
    fontSize: 8,
    justifyContent: 'center',
  },
  declaracionRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  declaracionNum: {
    width: 14,
    fontSize: 8,
  },
  declaracionText: {
    flex: 1,
    fontSize: 8,
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  fechaDocumento: {
    textAlign: 'right',
    fontSize: 9,
    marginTop: 12,
    marginBottom: 24,
  },
  firmaLinea: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: 260,
    alignSelf: 'center',
    marginBottom: 4,
  },
  firmaLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  firmaDato: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
});

const DECLARACIONES = [
  'Que acepto la normativa y condiciones de la actividad, reconociendo expresamente que mi representado se encuentra en condiciones físicas adecuadas para el desarrollo de las diferentes acciones de la actividad.',
  'Que conozco y acepto íntegramente la Metodología Scout para el desarrollo de las actividades donde participarán mis representados.',
  'Que, si mi representado padeciera, algún tipo de lesión, habilidad diferente o cualquier otra circunstancia que pudiera agravarse o perjudicar gravemente la salud y/o desarrollo de la actividad, lo pondré en conocimiento de la Organización, aceptando las decisiones que al respecto se adopten por los/as responsables de la Actividad.',
  'Autorizo a la Organización de la Actividad para usar cualquier fotografía, filmación, grabación o cualquier otra forma de archivo de mi participación o la de mis representados/as, en este evento, sin derecho a contraprestación económica.',
  'Reconozco que la participación de mi menor hijo, en esta actividad, conlleva riesgos conocidos, anticipables y/o no anticipables que podrían resultar en lesiones de diversa índole, por lo que expresamente asumo todas las amenazas que se puedan generar por su participación; quedando exonerada, la Asociación de Scouts del Perú, de cualquier responsabilidad ante cualquier evento no deseado que pudiera surgir.',
];

const ACTIVIDAD_FILAS = [
  'Nombre de la Actividad:',
  'Lugar de la Actividad:',
  'Fecha(s) y hora de la Actividad:',
  'Cuota de participación:',
  'Director:',
  'Dirigente Responsable:',
  'Dirigente(s) Acompañante(s)',
  'Colaborador:',
];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatFechaLarga(fechaStr?: string): string {
  if (!fechaStr) return '';
  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (isNaN(fecha.getTime())) return fechaStr;
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}

const Checkbox: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={styles.checkbox}>
      {checked && <Text style={styles.checkboxMark}>X</Text>}
    </View>
    <Text>{label}</Text>
  </View>
);

interface AutorizacionApoderadoTemplateProps {
  data: AutorizacionApoderadoReportData;
}

export const AutorizacionApoderadoTemplate: React.FC<AutorizacionApoderadoTemplateProps> = ({ data }) => {
  const sexoNorm = (data.sexo || '').toUpperCase();
  const esNina = sexoNorm === 'F' || sexoNorm === 'FEMENINO';
  const esNino = sexoNorm === 'M' || sexoNorm === 'MASCULINO';

  const tipoApoderado = data.apoderado?.tipo;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={marcaAguaFichaMedicaBase64} style={styles.watermark} fixed />

        <Text style={styles.mainTitle}>ANEXO 4 - AUTORIZACIÓN DE PARTICIPACIÓN</Text>
        <Text style={styles.subTitle}>Para Miembros Juveniles Menores de Edad</Text>

        <Text style={styles.paragraph}>
          Yo: {data.apoderado?.nombre || ''} identificado con DNI: {data.apoderado?.numeroDocumento || ''}
        </Text>
        <View style={styles.checkboxRow}>
          <Checkbox label="Padre" checked={tipoApoderado === 'PADRE'} />
          <Checkbox label="Madre" checked={tipoApoderado === 'MADRE'} />
          <Checkbox label="Apoderado" checked={tipoApoderado === 'APODERADO'} />
        </View>

        <View style={styles.checkboxRow}>
          <Text>del</Text>
          <Checkbox label="niño" checked={esNino} />
          <Checkbox label="niña" checked={esNina} />
          <Checkbox label="joven" checked={false} />
          <Text>: {data.nombreCompleto || ''} identificado con DNI: {data.numeroDocumento || ''}</Text>
        </View>

        <Text style={styles.paragraph}>
          y código de asociado N° {data.codigoScout || ''} por medio de la presente, autorizo la participación de mi menor hijo(a) en la Actividad organizada por el Grupo Scout Lima 12, que tiene las siguientes características:
        </Text>

        <View style={styles.table}>
          {ACTIVIDAD_FILAS.map((fila, idx) => (
            <View key={fila} style={idx === ACTIVIDAD_FILAS.length - 1 ? styles.tableRowLast : styles.tableRow}>
              <View style={styles.labelCell}>
                <Text>{fila}</Text>
              </View>
              <View style={styles.valueCell}>
                <Text></Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Bold' }]}>Asimismo, declaro:</Text>
        {DECLARACIONES.map((texto, idx) => (
          <View style={styles.declaracionRow} key={idx}>
            <Text style={styles.declaracionNum}>{idx + 1}.</Text>
            <Text style={styles.declaracionText}>{texto}</Text>
          </View>
        ))}

        <Text style={styles.fechaDocumento}>
          Lima, {formatFechaLarga(data.fechaDocumento)}
        </Text>

        <View style={styles.firmaLinea} />
        <Text style={styles.firmaLabel}>Firma</Text>
        <Text style={styles.firmaDato}>Nombre y Apellidos: {data.apoderado?.nombre || ''}</Text>
        <Text style={styles.firmaDato}>DNI: {data.apoderado?.numeroDocumento || ''}</Text>
      </Page>
    </Document>
  );
};

export default AutorizacionApoderadoTemplate;
