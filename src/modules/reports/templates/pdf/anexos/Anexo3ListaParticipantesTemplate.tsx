/**
 * ANEXO 3 - Lista de Participantes
 * Tabla de Miembros Juveniles, Adultos Voluntarios Acompañantes y
 * Adultos Acompañantes (esta última se genera vacía, ver anexosAireLibreService.ts).
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { AnexoHeader } from './AnexoHeader';
import { anexoStyles } from './anexoPdfStyles';
import { Anexo3Data, Anexo3Adulto, Anexo3Joven } from '../../../types/anexoTypes';

interface Anexo3ListaParticipantesTemplateProps {
  data: Anexo3Data;
}

const ADULTOS_ACOMPANANTES_FILAS_VACIAS = 5;

function celda(texto: string, width: string, esUltima = false) {
  return (
    <View style={[esUltima ? anexoStyles.valueCellLast : anexoStyles.dataTableCell, { width }]}>
      <Text>{texto}</Text>
    </View>
  );
}

function headerCelda(texto: string, width: string) {
  return (
    <View style={[anexoStyles.dataTableHeaderCell, { width }]}>
      <Text>{texto}</Text>
    </View>
  );
}

const MIEMBROS_COLS = [
  { label: '#', width: '5%' },
  { label: 'Nombre Completo', width: '28%' },
  { label: 'DNI/C.E.', width: '13%' },
  { label: 'Edad', width: '8%' },
  { label: 'Cod. Asociado', width: '14%' },
  { label: 'Contacto Emergencia', width: '16%' },
  { label: 'N° Contacto', width: '16%' },
];

const ADULTOS_VOLUNTARIOS_COLS = [
  { label: '#', width: '5%' },
  { label: 'Nombre Completo', width: '28%' },
  { label: 'DNI', width: '13%' },
  { label: 'Edad', width: '8%' },
  { label: 'Rol', width: '18%' },
  { label: 'Cod. Asociado', width: '14%' },
  { label: 'N° Teléfono', width: '14%' },
];

const ADULTOS_ACOMPANANTES_COLS = [
  { label: '#', width: '5%' },
  { label: 'Nombre Completo', width: '25%' },
  { label: 'DNI', width: '13%' },
  { label: 'Edad', width: '8%' },
  { label: 'Rol', width: '15%' },
  { label: 'Contacto Emergencia', width: '17%' },
  { label: 'N° Contacto', width: '17%' },
];

function TablaJovenes({ personas }: { personas: Anexo3Joven[] }) {
  return (
    <View style={anexoStyles.table}>
      <View style={[anexoStyles.tableRow, { minHeight: 24 }]}>
        {MIEMBROS_COLS.map((c) => headerCelda(c.label, c.width))}
      </View>
      {personas.map((p, i) => (
        <View style={anexoStyles.tableRow} key={i} wrap={false}>
          {celda(String(i + 1), MIEMBROS_COLS[0].width)}
          {celda(p.nombreCompleto, MIEMBROS_COLS[1].width)}
          {celda(p.dni || '—', MIEMBROS_COLS[2].width)}
          {celda(p.edad != null ? String(p.edad) : '—', MIEMBROS_COLS[3].width)}
          {celda(p.codigoAsociado || '—', MIEMBROS_COLS[4].width)}
          {celda(p.contactoEmergencia || '—', MIEMBROS_COLS[5].width)}
          {celda(p.numeroContacto || '—', MIEMBROS_COLS[6].width, true)}
        </View>
      ))}
      {personas.length === 0 && (
        <View style={anexoStyles.tableRowLast}>
          <Text style={{ padding: 6, fontSize: 8, fontStyle: 'italic' }}>Sin participantes inscritos</Text>
        </View>
      )}
    </View>
  );
}

function TablaVoluntarios({ personas }: { personas: Anexo3Adulto[] }) {
  return (
    <View style={anexoStyles.table}>
      <View style={[anexoStyles.tableRow, { minHeight: 24 }]}>
        {ADULTOS_VOLUNTARIOS_COLS.map((c) => headerCelda(c.label, c.width))}
      </View>
      {personas.map((p, i) => (
        <View style={anexoStyles.tableRow} key={i} wrap={false}>
          {celda(String(i + 1), ADULTOS_VOLUNTARIOS_COLS[0].width)}
          {celda(p.nombreCompleto, ADULTOS_VOLUNTARIOS_COLS[1].width)}
          {celda(p.dni || '—', ADULTOS_VOLUNTARIOS_COLS[2].width)}
          {celda(p.edad != null ? String(p.edad) : '—', ADULTOS_VOLUNTARIOS_COLS[3].width)}
          {celda(p.rol, ADULTOS_VOLUNTARIOS_COLS[4].width)}
          {celda(p.codigoAsociado || '—', ADULTOS_VOLUNTARIOS_COLS[5].width)}
          {celda(p.telefono || '—', ADULTOS_VOLUNTARIOS_COLS[6].width, true)}
        </View>
      ))}
      {personas.length === 0 && (
        <View style={anexoStyles.tableRowLast}>
          <Text style={{ padding: 6, fontSize: 8, fontStyle: 'italic' }}>Sin staff asignado</Text>
        </View>
      )}
    </View>
  );
}

function TablaAcompanantesEnBlanco() {
  return (
    <View style={anexoStyles.table}>
      <View style={[anexoStyles.tableRow, { minHeight: 24 }]}>
        {ADULTOS_ACOMPANANTES_COLS.map((c) => headerCelda(c.label, c.width))}
      </View>
      {Array.from({ length: ADULTOS_ACOMPANANTES_FILAS_VACIAS }).map((_, i) => (
        <View style={i === ADULTOS_ACOMPANANTES_FILAS_VACIAS - 1 ? anexoStyles.tableRowLast : anexoStyles.tableRow} key={i}>
          {ADULTOS_ACOMPANANTES_COLS.map((c) => celda(' ', c.width))}
        </View>
      ))}
    </View>
  );
}

export const Anexo3ListaParticipantesTemplate: React.FC<Anexo3ListaParticipantesTemplateProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={anexoStyles.page}>
      <AnexoHeader titulo="ANEXO 3 - LISTA DE PARTICIPANTES" />

      <View style={anexoStyles.table}>
        <View style={anexoStyles.tableRow}>
          <View style={[anexoStyles.labelCell, { width: '15%' }]}><Text>Actividad:</Text></View>
          <View style={[anexoStyles.valueCell, { width: '45%' }]}><Text>{data.nombreActividad}</Text></View>
          <View style={[anexoStyles.labelCell, { width: '12%' }]}><Text>Fecha:</Text></View>
          <View style={[anexoStyles.valueCellLast, { width: '28%' }]}><Text>{data.fecha}</Text></View>
        </View>
        <View style={anexoStyles.tableRowLast}>
          <View style={[anexoStyles.labelCell, { width: '15%' }]}><Text>Rama:</Text></View>
          <View style={[anexoStyles.valueCellLast, { width: '85%' }]}><Text>{data.rama || '—'}</Text></View>
        </View>
      </View>

      <Text style={anexoStyles.sectionBanner}>MIEMBROS JUVENILES</Text>
      <TablaJovenes personas={data.miembrosJuveniles} />

      <Text style={anexoStyles.sectionBanner}>ADULTOS VOLUNTARIOS ACOMPAÑANTES</Text>
      <TablaVoluntarios personas={data.adultosVoluntarios} />

      <Text style={anexoStyles.sectionBanner}>ADULTOS ACOMPAÑANTES</Text>
      <TablaAcompanantesEnBlanco />
    </Page>
  </Document>
);
