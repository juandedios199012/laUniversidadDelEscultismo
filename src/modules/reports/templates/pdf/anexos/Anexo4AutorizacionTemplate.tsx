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
import { DECLARACIONES_ANEXO4 } from './anexo4Declaraciones';

interface Anexo4AutorizacionTemplateProps {
  data: Anexo4Data;
}

const Checkbox: React.FC<{ label: string; checked?: boolean }> = ({ label, checked }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
    <View
      style={{
        width: 8,
        height: 8,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 3,
        backgroundColor: checked ? '#000' : undefined,
      }}
    />
    <Text>{label}</Text>
  </View>
);

const enBlanco = (valor: string | undefined, lineas: string) => valor || lineas;

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
  // Mismo día: "fecha • hora inicio - hora fin". Varios días: "inicio hora - fin hora".
  const formatearFechaHoraActividad = (): string => {
    const mismoDia = data.fechaInicio === data.fechaFin;
    const horaInicio = (data.horaConcentracion || '').slice(0, 5);
    const horaFin = (data.horaFin || '').slice(0, 5);

    if (mismoDia) {
      const parteFecha = data.fechaInicio || '';
      const parteHora = horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : horaInicio || horaFin;
      return parteHora ? `${parteFecha} • ${parteHora}` : parteFecha;
    }

    const parteInicio = horaInicio ? `${data.fechaInicio} ${horaInicio}` : data.fechaInicio;
    const parteFin = horaFin ? `${data.fechaFin} ${horaFin}` : data.fechaFin;
    return `${parteInicio} - ${parteFin}`;
  };

  const itemsQueLlevar = [
    ...dividirEnLineas(data.equipamientoObligatorio),
    ...dividirEnLineas(data.equipamientoOpcional),
    ...dividirEnLineas(data.recomendaciones),
  ];
  const itemsDefault = data.itemsQueLlevarDefault?.length ? data.itemsQueLlevarDefault : ITEMS_QUE_LLEVAR_FALLBACK;
  const itemsAMostrar = itemsQueLlevar.length > 0 ? itemsQueLlevar : itemsDefault;
  const declaraciones = data.declaraciones?.length ? data.declaraciones : DECLARACIONES_ANEXO4;
  const { firmante, menor, aceptacion } = data;
  const formatMonto = (valor?: number) => `S/. ${Number(valor ?? 0).toFixed(2)}`;

  return (
    <Document>
      {/* Página 1: Autorización de Participación */}
      <Page size="A4" style={anexoStyles.page}>
        <AnexoHeader
          titulo="ANEXO 4 - AUTORIZACIÓN DE PARTICIPACIÓN"
          subtitulo="Participación Actividades Miembros Juveniles Menores de Edad"
        />

        <Text style={anexoStyles.paragraph}>
          Yo {enBlanco(firmante?.nombre, '________________________')} identificado con DNI: {enBlanco(firmante?.dni, '_________')}
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Checkbox label="Padre" checked={firmante?.parentesco === 'Padre'} />
          <Checkbox label="Madre" checked={firmante?.parentesco === 'Madre'} />
          <Checkbox label="Apoderado" checked={firmante?.parentesco === 'Apoderado'} />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Checkbox label="niño" checked={menor?.tipo === 'niño'} />
          <Checkbox label="niña" checked={menor?.tipo === 'niña'} />
          <Checkbox label="joven" checked={menor?.tipo === 'joven'} />
          <Text>
            : {enBlanco(menor?.nombre, '________________________')} identificado con DNI: {enBlanco(menor?.dni, '_________')}
          </Text>
        </View>
        <Text style={anexoStyles.paragraph}>
          y código de asociado N° {enBlanco(menor?.codigoAsociado, '_______')} por medio de la presente, autorizo la participación de mi menor hijo(a) en la Actividad organizada por el Grupo Scout Lima 12 que tiene las siguientes características:
        </Text>

        <View style={anexoStyles.table}>
          {fila('Nombre de la Actividad:', data.nombreActividad)}
          {fila('Lugar de la Actividad:', data.lugar)}
          {fila('Fecha(s) y hora de la Actividad:', formatearFechaHoraActividad())}
          {fila('Director:', data.director || '—')}
          {fila('Dirigente Responsable:', data.dirigenteResponsable || '—')}
          {fila('Dirigente(s) Acompañante(s):', data.adultosAcompanantes || '—')}
          {fila('Cuota de participación:', formatMonto(data.costoPorParticipante))}
          {typeof data.presupuestoReal === 'number' && fila('Presupuesto Ejecutado:', formatMonto(data.presupuestoReal))}
          {fila('Colaborador:', data.colaborador || '—')}
        </View>

        <Text style={[anexoStyles.text, { marginBottom: 4 }]}>Asimismo, declaro:</Text>
        {declaraciones.map((texto, i) => (
          <View style={{ flexDirection: 'row', marginBottom: 6 }} key={i}>
            <Text style={{ width: 16, fontSize: 8 }}>{i + 1}.</Text>
            <Text style={[anexoStyles.text, { flex: 1, textAlign: 'justify' }]}>{texto}</Text>
          </View>
        ))}

        <Text style={[anexoStyles.text, { textAlign: 'right', marginTop: 10, marginBottom: 20 }]}>
          {data.fechaDocumento}
        </Text>

        {aceptacion ? (
          <View style={[anexoStyles.firmaContainer, { borderWidth: 1, borderColor: '#15803d', padding: 6 }]}>
            <Text style={[anexoStyles.text, anexoStyles.textBold, { color: '#15803d' }]}>
              ACEPTADO DIGITALMENTE - Portal de Padres
            </Text>
            <Text style={anexoStyles.text}>{aceptacion.fecha}</Text>
            <Text style={anexoStyles.text}>Nombre y Apellidos: {aceptacion.nombre || firmante?.nombre || '—'}</Text>
            <Text style={anexoStyles.text}>DNI: {aceptacion.dni || firmante?.dni || '—'}</Text>
          </View>
        ) : (
          <View style={anexoStyles.firmaContainer}>
            <View style={anexoStyles.firmaLinea} />
            <Text style={[anexoStyles.text, anexoStyles.textBold]}>Firma</Text>
            <Text style={anexoStyles.text}>Nombre y Apellidos: {enBlanco(firmante?.nombre, '________________________')}</Text>
            <Text style={anexoStyles.text}>DNI: {enBlanco(firmante?.dni, '________________________')}</Text>
          </View>
        )}
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
