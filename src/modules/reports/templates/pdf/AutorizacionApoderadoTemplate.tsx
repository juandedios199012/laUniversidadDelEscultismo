/**
 * Plantilla PDF para "Autorización del Padre o Apoderado" (ANEXO 4)
 * Se autocompleta la identificación del Scout, la de su Apoderado Legal y
 * los datos de la actividad (nombre, lugar, fecha, cuota, etc.) recibidos
 * en `data.actividad`.
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
} from '@react-pdf/renderer';
import { AutorizacionApoderadoReportData } from '../../types/reportTypes';
import { anexoAspStyles, MarcaAguaAsp, TablaAsp, FirmaAsp, formatFechaLargaAsp } from './anexoAspPdf';

const styles = { ...anexoAspStyles, ...StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000000',
    marginLeft: 4,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMark: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
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
  aceptacion: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    textAlign: 'center',
    marginTop: 8,
  },
}) };

const DECLARACIONES = [
  'Que acepto la normativa y condiciones de la actividad, reconociendo expresamente que mi representado se encuentra en condiciones físicas adecuadas para el desarrollo de las diferentes acciones de la actividad.',
  'Que conozco y acepto íntegramente la Metodología Scout para el desarrollo de las actividades donde participarán mis representados.',
  'Que, si mi representado padeciera, algún tipo de lesión, habilidad diferente o cualquier otra circunstancia que pudiera agravarse o perjudicar gravemente la salud y/o desarrollo de la actividad, lo pondré en conocimiento de la Organización, aceptando las decisiones que al respecto se adopten por los/as responsables de la Actividad.',
  'Autorizo a la Organización de la Actividad para usar cualquier fotografía, filmación, grabación o cualquier otra forma de archivo de mi participación o la de mis representados/as, en este evento, sin derecho a contraprestación económica.',
  'Reconozco que la participación de mi menor hijo, en esta actividad, conlleva riesgos conocidos, anticipables y/o no anticipables que podrían resultar en lesiones de diversa índole, por lo que expresamente asumo todas las amenazas que se puedan generar por su participación; quedando exonerada, la Asociación de Scouts del Perú, de cualquier responsabilidad ante cualquier evento no deseado que pudiera surgir.',
];

function actividadFilas(actividad?: AutorizacionApoderadoReportData['actividad']): [string, string][] {
  return [
    ['Nombre de la Actividad:', actividad?.nombreActividad || ''],
    ['Lugar de la Actividad:', actividad?.lugar || ''],
    ['Fecha(s) y hora de la Actividad:', actividad?.fechaHora || ''],
    ['Cuota de participación:', actividad?.cuota || ''],
    ['Director:', actividad?.director || ''],
    ['Dirigente Responsable:', actividad?.dirigenteResponsable || ''],
    ['Dirigente(s) Acompañante(s)', actividad?.acompanantes || ''],
    ['Colaborador:', actividad?.colaborador || ''],
  ];
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

/**
 * Página con el contenido del ANEXO 4 para una sola persona. Sin envoltorio
 * `<Document>` para poder reutilizarse tanto en el PDF individual como en el
 * PDF consolidado (varias páginas, una por persona, en un mismo `<Document>`).
 */
export const AutorizacionApoderadoPage: React.FC<AutorizacionApoderadoTemplateProps> = ({ data }) => {
  const sexoNorm = (data.sexo || '').toUpperCase();
  const esNina = sexoNorm === 'F' || sexoNorm === 'FEMENINO';
  const esNino = sexoNorm === 'M' || sexoNorm === 'MASCULINO';

  const tipoApoderado = data.apoderado?.tipo;

  return (
    <Page size="A4" style={styles.page}>
      <MarcaAguaAsp />

      <Text style={styles.mainTitle}>ANEXO 4 - AUTORIZACIÓN DE PARTICIPACIÓN</Text>
      <Text style={styles.subTitle}>Para Miembros Juveniles Menores de Edad</Text>

      <View style={styles.checkboxRow}>
        <Text style={styles.paragraph}>
          Yo: {data.apoderado?.nombre || ''} identificado con DNI: {data.apoderado?.numeroDocumento || ''}
        </Text>
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

      <TablaAsp filas={actividadFilas(data.actividad)} />

      <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Bold' }]}>Asimismo, declaro:</Text>
      {DECLARACIONES.map((texto, idx) => (
        <View style={styles.declaracionRow} key={idx}>
          <Text style={styles.declaracionNum}>{idx + 1}.</Text>
          <Text style={styles.declaracionText}>{texto}</Text>
        </View>
      ))}

      <Text style={styles.fechaDocumento}>
        Lima, {formatFechaLargaAsp(data.fechaDocumento)}
      </Text>

      <FirmaAsp
        firmaBase64={data.apoderado?.firmaBase64}
        datos={[
          `Nombre y Apellidos: ${data.apoderado?.nombre || ''}`,
          `DNI: ${data.apoderado?.numeroDocumento || ''}`,
        ]}
      />
      {data.aceptacion && (
        <Text style={styles.aceptacion}>
          ACEPTADO DIGITALMENTE EN EL PORTAL DE PADRES - {data.aceptacion.fecha}
        </Text>
      )}
    </Page>
  );
};

export const AutorizacionApoderadoTemplate: React.FC<AutorizacionApoderadoTemplateProps> = ({ data }) => (
  <Document>
    <AutorizacionApoderadoPage data={data} />
  </Document>
);

interface AutorizacionApoderadoConsolidadoTemplateProps {
  datas: AutorizacionApoderadoReportData[];
}

/**
 * PDF consolidado: una página del ANEXO 4 por cada persona seleccionada
 * manualmente, dentro de un único documento descargable.
 */
export const AutorizacionApoderadoConsolidadoTemplate: React.FC<AutorizacionApoderadoConsolidadoTemplateProps> = ({ datas }) => (
  <Document>
    {datas.map((data, index) => (
      <AutorizacionApoderadoPage key={data.scoutId || index} data={data} />
    ))}
  </Document>
);

export default AutorizacionApoderadoTemplate;
