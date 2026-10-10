/**
 * ANEXO 1 - Solicitud de Aprobación de Actividad
 * Carta al Aprobador (ej. Comisionado Local) pidiendo autorización para
 * una actividad de Aire Libre, firmada por el Jefe de Grupo. Formato de la
 * plantilla oficial (plantilla_anexo_1.pdf); marca de agua y tabla
 * compartidas con el Anexo 4 en anexoAspPdf.tsx.
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { anexoAspStyles, MarcaAguaAsp, TablaAsp } from '../anexoAspPdf';
import { Anexo1Data } from '../../../types/anexoTypes';

interface Anexo1SolicitudAprobacionTemplateProps {
  data: Anexo1Data;
}

const GRIS = '#D9D9D9';

const styles = { ...anexoAspStyles, ...StyleSheet.create({
  titulo: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 14,
  },
  fechaFila: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
    fontSize: 9,
  },
  fechaCasilla: {
    backgroundColor: GRIS,
    paddingVertical: 3,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  fechaTexto: {
    marginHorizontal: 6,
  },
  resaltado: {
    backgroundColor: GRIS,
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
  },
  firmaBloque: {
    width: 220,
    alignSelf: 'center',
    marginTop: 4,
  },
  firmaFila: {
    flexDirection: 'row',
    marginTop: 2,
  },
  firmaEtiqueta: {
    width: 85,
    textAlign: 'right',
    paddingRight: 4,
    fontSize: 9,
  },
  firmaValor: {
    flex: 1,
    backgroundColor: GRIS,
    borderBottomWidth: 1,
    borderBottomColor: '#BFBFBF',
    paddingHorizontal: 3,
    paddingVertical: 1,
    fontSize: 9,
  },
}) };

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "2026-10-01" → { dia: '01', mes: 'Octubre', anio: '2026' } */
function partesFecha(iso: string): { dia: string; mes: string; anio: string } {
  const [anio, mes, dia] = iso.split('-');
  return { dia, mes: MESES[Number(mes) - 1] || '', anio };
}

const formatMonto = (valor?: number) => `S/. ${Number(valor ?? 0).toFixed(2)}`;

export const Anexo1SolicitudAprobacionTemplate: React.FC<Anexo1SolicitudAprobacionTemplateProps> = ({ data }) => {
  const { destinatario, jefeGrupo } = data;
  const fecha = partesFecha(data.fechaDocumento);

  const filas: [string, string][] = [
    ['Nombre de la Actividad:', data.nombreActividad],
    ['Tipo de Actividad:', data.tipoActividad],
    ['Rama(s) que participa(n):', data.ramas || ''],
    ['Lugar de la Actividad:', data.lugar],
    ['Fecha(s) de la Actividad:', data.fechaHora],
    ['Director:', data.director || ''],
    ['Dirigente Responsable:', data.dirigenteResponsable || ''],
    ['Dirigente (s) Acompañante (s):', data.adultosAcompanantes || ''],
    ['Colaborador (es):', data.colaborador || ''],
    ['Costo Total de la Actividad:', formatMonto(data.costoPorParticipante)],
    ['Responsable de Salud y Seguridad:', data.responsableSaludSeguridad || ''],
    // Sin fuente de datos por ahora: se deja en blanco
    ['Fecha de última certificación de PPAA:', ''],
    ['Responsable de SFH:', data.responsableSFH || ''],
  ];

  const firma: [string, string][] = [
    ['Nombre y Apellidos:', jefeGrupo.nombre || ''],
    ['DNI:', jefeGrupo.dni || ''],
    ['Cargo Institucional:', jefeGrupo.cargo || ''],
    ['Grupo Scout:', jefeGrupo.localidadNumeral || ''],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <MarcaAguaAsp />

        <Text style={styles.titulo}>ANEXO 1 - SOLICITUD DE APROBACIÓN DE ACTIVIDAD</Text>

        <View style={styles.fechaFila}>
          <Text style={[styles.fechaCasilla, { width: 80 }]}>{jefeGrupo.localidad || 'Lima'}</Text>
          <Text style={styles.fechaTexto}>,</Text>
          <Text style={[styles.fechaCasilla, { width: 30 }]}>{fecha.dia}</Text>
          <Text style={styles.fechaTexto}>de</Text>
          <Text style={[styles.fechaCasilla, { width: 80 }]}>{fecha.mes}</Text>
          <Text style={styles.fechaTexto}>del</Text>
          <Text style={[styles.fechaCasilla, { width: 40 }]}>{fecha.anio}</Text>
        </View>

        <Text style={styles.paragraph}>Sr. (a)(ta)</Text>
        <Text style={[styles.paragraph, styles.resaltado]}>{destinatario?.nombre || ' '}</Text>
        <Text style={styles.paragraph}>{destinatario?.cargo || ' '}</Text>
        <Text style={[styles.paragraph, { textDecoration: 'underline' }]}>Presente. -</Text>

        <Text style={styles.paragraph}>
          Yo, {jefeGrupo.nombre || '________________________'}, identificado con DNI N° {jefeGrupo.dni || '__________'} del {jefeGrupo.nombreGrupo || 'Grupo Scout'}, me es grato dirigirme a usted para solicitar autorización para la actividad descrita a continuación:
        </Text>

        <TablaAsp filas={filas} ancho="75%" cebra etiquetaNormal />

        <Text style={[styles.paragraph, { textAlign: 'justify' }]}>
          Asimismo, nos comprometemos a cumplir con los requisitos, documentación y plazos que indica el documento de Normas para Actividades Externas y/o al Aire Libre de la ASP.
        </Text>
        <Text style={[styles.paragraph, { marginBottom: 10 }]}>
          Sin otro particular nos despedimos agradeciendo su apoyo.
        </Text>

        {jefeGrupo.firmaBase64 ? (
          <Image src={jefeGrupo.firmaBase64} style={styles.firmaImagen} />
        ) : (
          <View style={{ height: 45 }} />
        )}
        <View style={[styles.firmaLinea, { width: 220 }]} />
        <Text style={styles.firmaLabel}>Firma</Text>
        <View style={styles.firmaBloque}>
          {firma.map(([etiqueta, valor]) => (
            <View key={etiqueta} style={styles.firmaFila}>
              <Text style={styles.firmaEtiqueta}>{etiqueta}</Text>
              <Text style={styles.firmaValor}>{valor}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
