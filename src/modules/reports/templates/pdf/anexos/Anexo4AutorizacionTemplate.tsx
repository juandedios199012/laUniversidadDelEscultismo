/**
 * ANEXO 4 - Autorización de Participación (Menores de Edad)
 * Página 1: formulario de consentimiento para imprimir y llenar a mano
 * (checkboxes/líneas en blanco), con los datos de la actividad ya
 * completados. Página 2: "¿Qué debo llevar?" (equipamiento/recomendaciones).
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { AnexoHeader } from './AnexoHeader';
import { anexoStyles } from './anexoPdfStyles';
import { Anexo4Data } from '../../../types/anexoTypes';

interface Anexo4AutorizacionTemplateProps {
  data: Anexo4Data;
}

const Checkbox: React.FC<{ label: string }> = ({ label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
    <View style={{ width: 8, height: 8, borderWidth: 1, borderColor: '#000', marginRight: 3 }} />
    <Text>{label}</Text>
  </View>
);

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

const DECLARACIONES = [
  'Que acepto la normativa y condiciones de la actividad, reconociendo expresamente que mi representado se encuentra en condiciones físicas adecuadas para el desarrollo de las diferentes acciones de la actividad.',
  'Que conozco y acepto íntegramente la Metodología Scout para el desarrollo de las actividades donde participarán mis representados.',
  'Que, si mi representado padeciera algún tipo de lesión, defecto físico o cualquier otra circunstancia que pudiera agravarse o perjudicar gravemente la salud y/o desarrollo de la actividad, lo pondré en conocimiento de la Organización, aceptando las decisiones que al respecto se adopten por los/as responsables de la Actividad.',
  'Autorizo a la Organización de la Actividad para usar cualquier fotografía, filmación, grabación o cualquier otra forma de archivo de mi participación o la de mis representados/as, en este evento, sin derecho a contraprestación económica.',
];

const ITEMS_QUE_LLEVAR_FALLBACK = [
  'Rancho Frío (comida en tápers), de preferencia que no se perecible rápidamente.',
  'Tomatodo o botella de agua (con agua en su interior).',
  'Gorro o sombrero.',
  'Bloqueador solar.',
  'Muda de ropa (polo).',
  'Bolsa de plástico (para guardar la ropa húmeda o sucia).',
  'Lentes de sol (opcional).',
  'Medicamento (si tuviera alguna alergia).',
];

function dividirEnLineas(texto?: string): string[] {
  if (!texto) return [];
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export const Anexo4AutorizacionTemplate: React.FC<Anexo4AutorizacionTemplateProps> = ({ data }) => {
  const rangoFechas = data.fechaInicio === data.fechaFin
    ? data.fechaInicio
    : `${data.fechaInicio} - ${data.fechaFin}`;

  const itemsQueLlevar = [
    ...dividirEnLineas(data.equipamientoObligatorio),
    ...dividirEnLineas(data.equipamientoOpcional),
    ...dividirEnLineas(data.recomendaciones),
  ];
  const itemsAMostrar = itemsQueLlevar.length > 0 ? itemsQueLlevar : ITEMS_QUE_LLEVAR_FALLBACK;

  return (
    <Document>
      {/* Página 1: Autorización de Participación */}
      <Page size="A4" style={anexoStyles.page}>
        <AnexoHeader
          titulo="ANEXO 4 - AUTORIZACIÓN DE PARTICIPACIÓN"
          subtitulo="Participación Actividades Miembros Juveniles Menores de Edad"
        />

        <Text style={anexoStyles.paragraph}>
          Yo________________________ identificado con DNI: _________
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Checkbox label="Padre" />
          <Checkbox label="Madre" />
          <Checkbox label="Apoderado" />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Checkbox label="niño" />
          <Checkbox label="niña" />
          <Checkbox label="joven" />
          <Text>: ________________________ identificado con DNI: _________</Text>
        </View>
        <Text style={anexoStyles.paragraph}>
          y código de asociado N° _______ por medio de la presente, autorizo la participación de mi menor hijo(a) en la Actividad organizada por el Grupo Scout Lima 12 que tiene las siguientes características:
        </Text>

        <View style={anexoStyles.table}>
          {fila('Nombre de la Actividad:', data.nombreActividad)}
          {fila('Lugar de la Actividad:', data.lugar)}
          {fila('Fecha(s) de la Actividad:', `${rangoFechas}${data.horaConcentracion ? ` — ${data.horaConcentracion}` : ''}`)}
          {fila('Adulto Responsable:', data.adultoResponsable || '—')}
          {fila('Adulto(s) Acompañantes:', data.adultosAcompanantes || '—')}
          {fila('Costo del Evento', `S/. ${data.costoPorParticipante.toFixed(2)} nuevos soles`)}
        </View>

        <Text style={[anexoStyles.text, { marginBottom: 4 }]}>Asimismo, declaro:</Text>
        {DECLARACIONES.map((texto, i) => (
          <View style={{ flexDirection: 'row', marginBottom: 6 }} key={i}>
            <Text style={{ width: 16, fontSize: 8 }}>{i + 1}.</Text>
            <Text style={[anexoStyles.text, { flex: 1, textAlign: 'justify' }]}>{texto}</Text>
          </View>
        ))}

        <Text style={[anexoStyles.text, { textAlign: 'right', marginTop: 10, marginBottom: 20 }]}>
          {data.fechaDocumento}
        </Text>

        <View style={anexoStyles.firmaContainer}>
          <View style={anexoStyles.firmaLinea} />
          <Text style={[anexoStyles.text, anexoStyles.textBold]}>Firma</Text>
          <Text style={anexoStyles.text}>Nombre y Apellidos: ________________________</Text>
          <Text style={anexoStyles.text}>DNI: ________________________</Text>
        </View>
      </Page>

      {/* Página 2: ¿Qué debo llevar? */}
      <Page size="A4" style={anexoStyles.page}>
        <AnexoHeader titulo="¿QUÉ DEBO LLEVAR?" />
        {itemsAMostrar.map((item, i) => (
          <Text style={[anexoStyles.text, { marginBottom: 6 }]} key={i}>
            • {item}
          </Text>
        ))}
      </Page>
    </Document>
  );
};
