/**
 * ANEXO 1 - Solicitud de Aprobación de Actividad
 * Carta al Comisionado Local pidiendo autorización para una actividad
 * de Aire Libre. Texto institucional fijo; solo los datos de la
 * actividad y de los firmantes son dinámicos.
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { AnexoHeader } from './AnexoHeader';
import { anexoStyles } from './anexoPdfStyles';
import { Anexo1Data } from '../../../types/anexoTypes';

interface Anexo1SolicitudAprobacionTemplateProps {
  data: Anexo1Data;
}

const fila = (label: string, valor: string) => (
  <View style={anexoStyles.tableRow} key={label}>
    <View style={[anexoStyles.labelCell, { width: '35%' }]}>
      <Text>{label}</Text>
    </View>
    <View style={[anexoStyles.valueCellLast, { width: '65%' }]}>
      <Text>{valor || '—'}</Text>
    </View>
  </View>
);

export const Anexo1SolicitudAprobacionTemplate: React.FC<Anexo1SolicitudAprobacionTemplateProps> = ({ data }) => {
  const rangoFechas = data.fechaInicio === data.fechaFin
    ? data.fechaInicio
    : `${data.fechaInicio} - ${data.fechaFin}`;

  return (
    <Document>
      <Page size="A4" style={anexoStyles.page}>
        <AnexoHeader titulo="ANEXO 1 - SOLICITUD DE APROBACIÓN DE ACTIVIDAD" />

        <Text style={[anexoStyles.text, { textAlign: 'right', marginBottom: 12 }]}>
          {data.fechaDocumento}
        </Text>

        <Text style={anexoStyles.text}>Sr.</Text>
        <Text style={[anexoStyles.text, anexoStyles.textBold]}>{data.comisionadoLocal || '________________________'}</Text>
        <Text style={anexoStyles.text}>Comisionado Local</Text>
        <Text style={[anexoStyles.text, { marginBottom: 8 }]}>Presente. -</Text>

        <Text style={anexoStyles.paragraph}>
          Yo, {data.jefeGrupo.nombre || '________________'}, identificado con DNI N° {data.jefeGrupo.dni || '__________'}, {data.jefeGrupo.cargo || 'Jefe del Grupo Scout Lima 12'}, me es grato dirigirme a usted para solicitar autorización para la actividad descrita a continuación:
        </Text>

        <View style={anexoStyles.table}>
          {fila('Nombre de la Actividad:', data.nombreActividad)}
          {fila('Tipo de Actividad:', data.tipoActividad)}
          {fila('Rama(s) que participa(n):', data.ramas || '—')}
          {fila('Lugar de la Actividad:', data.lugar)}
          {fila('Fecha(s) de la Actividad:', `${rangoFechas}${data.horaConcentracion ? ` — ${data.horaConcentracion}` : ''}`)}
          {fila('Adulto Voluntario Responsable:', data.adultoResponsable || '—')}
          {fila('Costo Total de la Actividad:', `S/. ${data.costoPorParticipante.toFixed(2)}`)}
        </View>

        <View style={anexoStyles.table}>
          {fila('Responsable de Salud:', data.responsableSalud || '—')}
          {fila('Responsable de SFH:', data.responsableSFH || '—')}
        </View>

        <Text style={anexoStyles.paragraph}>
          Asimismo, nos comprometemos a cumplir con los requisitos, documentación y plazos que indica el documento de Normas para Actividades Presenciales de la ASP.
        </Text>

        <Text style={[anexoStyles.text, { marginBottom: 24 }]}>
          Sin otro particular nos despedimos agradeciendo su apoyo.
        </Text>

        <View style={anexoStyles.firmaContainer}>
          <View style={anexoStyles.firmaLinea} />
          <Text style={[anexoStyles.text, anexoStyles.textBold]}>Firma</Text>
          <Text style={anexoStyles.text}>Nombre y Apellidos: {data.jefeGrupo.nombre || '—'}</Text>
          <Text style={anexoStyles.text}>DNI: {data.jefeGrupo.dni || '—'}</Text>
          <Text style={anexoStyles.text}>Cargo Institucional: {data.jefeGrupo.cargo || 'Jefe de Grupo'}</Text>
        </View>
      </Page>
    </Document>
  );
};
