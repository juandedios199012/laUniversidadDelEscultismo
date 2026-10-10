/**
 * Piezas compartidas de los Anexos ASP en formato oficial (Anexo 1 y
 * Anexo 4 - Autorización del Padre o Apoderado): marca de agua de página
 * completa, título, tabla de datos (etiqueta azul / valor) y bloque de firma.
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import { marcaAguaFichaMedicaBase64 } from '../../../../assets/images/marcaAguaFichaMedicaBase64';

const COLORS = {
  primary: '#4F81BD',
  border: '#000000',
};

export const anexoAspStyles = StyleSheet.create({
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
  fechaDocumento: {
    textAlign: 'right',
    fontSize: 9,
    marginTop: 12,
    marginBottom: 30,
  },
  firmaLinea: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: 260,
    alignSelf: 'center',
    marginBottom: 4,
  },
  firmaImagen: {
    width: 180,
    height: 45,
    alignSelf: 'center',
    marginBottom: 2,
    objectFit: 'contain',
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

/** Marca de agua de página completa (va como primer hijo de cada <Page>). */
export const MarcaAguaAsp: React.FC = () => (
  <Image src={marcaAguaFichaMedicaBase64} style={anexoAspStyles.watermark} fixed />
);

interface TablaAspProps {
  filas: [string, string][];
  /** Ancho de la tabla (centrada), ej. '75%'. Por defecto 100%. */
  ancho?: string;
  /** Filas pares del valor con fondo gris (formato del Anexo 1). */
  cebra?: boolean;
  /** Etiquetas en texto normal en lugar de negrita. */
  etiquetaNormal?: boolean;
}

/** Tabla de dos columnas: etiqueta (fondo azul) y valor. */
export const TablaAsp: React.FC<TablaAspProps> = ({ filas, ancho, cebra, etiquetaNormal }) => (
  <View style={[anexoAspStyles.table, ancho ? { width: ancho, alignSelf: 'center' } : {}]}>
    {filas.map(([label, valor], idx) => (
      <View key={label} style={idx === filas.length - 1 ? anexoAspStyles.tableRowLast : anexoAspStyles.tableRow}>
        <View style={[anexoAspStyles.labelCell, etiquetaNormal ? { fontFamily: 'Helvetica' } : {}]}>
          <Text>{label}</Text>
        </View>
        <View style={[anexoAspStyles.valueCell, cebra && idx % 2 === 0 ? { backgroundColor: '#F2F2F2' } : {}]}>
          <Text>{valor}</Text>
        </View>
      </View>
    ))}
  </View>
);

/** Imagen de firma (si hay), línea, "Firma" y los datos del firmante. */
export const FirmaAsp: React.FC<{ firmaBase64?: string; datos: string[] }> = ({ firmaBase64, datos }) => (
  <>
    {firmaBase64 && <Image src={firmaBase64} style={anexoAspStyles.firmaImagen} />}
    <View style={anexoAspStyles.firmaLinea} />
    <Text style={anexoAspStyles.firmaLabel}>Firma</Text>
    {datos.map((dato) => (
      <Text key={dato} style={anexoAspStyles.firmaDato}>{dato}</Text>
    ))}
  </>
);

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026-06-16" → "16 de junio del 2026" */
export function formatFechaLargaAsp(fechaStr?: string): string {
  if (!fechaStr) return '';
  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (isNaN(fecha.getTime())) return fechaStr;
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}
