/**
 * ANEXO 1 - Solicitud de Aprobación de Actividad
 * Carta al Aprobador (ej. Comisionado Local) pidiendo
 * autorización para una actividad de Aire Libre, firmada por el Jefe de
 * Grupo. Mismo formato oficial que el Anexo 4 (marca de agua, tabla y
 * firma compartidas en anexoAspPdf.tsx).
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Page, Text } from '@react-pdf/renderer';
import { anexoAspStyles as styles, MarcaAguaAsp, TablaAsp, FirmaAsp, formatFechaLargaAsp } from '../anexoAspPdf';
import { Anexo1Data } from '../../../types/anexoTypes';

interface Anexo1SolicitudAprobacionTemplateProps {
  data: Anexo1Data;
}

const LINEA = '________________________';
const formatMonto = (valor?: number) => `S/. ${Number(valor ?? 0).toFixed(2)}`;

export const Anexo1SolicitudAprobacionTemplate: React.FC<Anexo1SolicitudAprobacionTemplateProps> = ({ data }) => {
  const { destinatario, jefeGrupo } = data;

  const filasActividad: [string, string][] = [
    ['Nombre de la Actividad:', data.nombreActividad],
    ['Tipo de Actividad:', data.tipoActividad],
    ['Rama(s) que participa(n):', data.ramas || ''],
    ['Lugar de la Actividad:', data.lugar],
    ['Fecha(s) de la Actividad:', data.fechaHora],
    ['Adulto Voluntario Responsable:', data.adultoResponsable || ''],
    ['Costo Total de la Actividad:', formatMonto(data.costoPorParticipante)],
  ];
  if (typeof data.presupuestoReal === 'number') {
    filasActividad.push(['Presupuesto Ejecutado:', formatMonto(data.presupuestoReal)]);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <MarcaAguaAsp />

        <Text style={[styles.mainTitle, { marginBottom: 6 }]}>ANEXO 1 - SOLICITUD DE APROBACIÓN DE ACTIVIDAD</Text>

        <Text style={[styles.paragraph, { textAlign: 'right', marginBottom: 14 }]}>
          {jefeGrupo.localidad || 'Lima'}, {formatFechaLargaAsp(data.fechaDocumento)}
        </Text>

        <Text style={styles.paragraph}>Sr.</Text>
        <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Bold' }]}>{destinatario?.nombre || LINEA}</Text>
        <Text style={styles.paragraph}>{destinatario?.cargo || LINEA}</Text>
        <Text style={[styles.paragraph, { textDecoration: 'underline', marginBottom: 8 }]}>Presente. -</Text>

        <Text style={styles.paragraph}>
          Yo, {jefeGrupo.nombre || LINEA}, identificado con DNI N° {jefeGrupo.dni || '__________'}, {jefeGrupo.cargo || 'Jefe de Grupo'} del {jefeGrupo.nombreGrupo || 'Grupo Scout'}, me es grato dirigirme a usted para solicitar autorización para la actividad descrita a continuación:
        </Text>

        <TablaAsp filas={filasActividad} />

        <TablaAsp
          filas={[
            ['Responsable de Salud:', data.responsableSalud || ''],
            ['Responsable de SFH:', data.responsableSFH || ''],
          ]}
        />

        <Text style={styles.paragraph}>
          Asimismo, nos comprometemos a cumplir con los requisitos, documentación y plazos que indica el documento de Normas para Actividades Presenciales de la ASP.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 8, marginBottom: 30 }]}>
          Sin otro particular nos despedimos agradeciendo su apoyo.
        </Text>

        <FirmaAsp
          firmaBase64={jefeGrupo.firmaBase64}
          datos={[
            `Nombre y Apellidos: ${jefeGrupo.nombre || ''}`,
            `DNI: ${jefeGrupo.dni || ''}`,
            `Cargo Institucional: ${jefeGrupo.cargo || ''}`,
            `Localidad y Numeral: ${jefeGrupo.localidadNumeral || ''}`,
          ]}
        />
      </Page>
    </Document>
  );
};
