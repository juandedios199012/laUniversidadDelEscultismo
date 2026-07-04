/**
 * Estilos compartidos por los Anexos del módulo Aire Libre (Anexo 1, 3, 4).
 * Extiende la paleta/tamaños/espaciado ya definidos en pdfStyles.ts en vez
 * de duplicarlos — solo agrega lo específico de la maquetación tipo
 * "formulario oficial ASP" (tablas con encabezado azul, casillas en blanco).
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import { StyleSheet } from '@react-pdf/renderer';
import { colors, fontSizes, spacing } from '../../../styles/pdfStyles';

export { colors, fontSizes, spacing };

export const anexoStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: fontSizes.small,
    color: colors.dark,
  },

  // Cabecera: logo redondo + título del anexo (AnexoHeader.tsx)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 55,
    marginRight: spacing.md,
  },
  logoImage: {
    width: 55,
    height: 55,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.subheading,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  headerSubtitle: {
    fontSize: fontSizes.tiny,
    fontStyle: 'italic',
    color: colors.gray,
    marginTop: 2,
  },

  // Tabla con encabezado azul (estilo formulario ASP)
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.dark,
    marginBottom: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
    minHeight: 20,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 20,
  },
  labelCell: {
    backgroundColor: colors.primary,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: fontSizes.tiny,
    color: colors.white,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.dark,
  },
  valueCell: {
    backgroundColor: colors.white,
    padding: 4,
    fontSize: fontSizes.tiny,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.dark,
  },
  valueCellLast: {
    backgroundColor: colors.white,
    padding: 4,
    fontSize: fontSizes.tiny,
    justifyContent: 'center',
  },

  // Tabla de participantes (filas de datos, no label/value)
  dataTableHeaderCell: {
    backgroundColor: colors.primary,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: fontSizes.tiny,
    color: colors.white,
    textAlign: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.dark,
  },
  dataTableCell: {
    padding: 4,
    fontSize: fontSizes.tiny,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.dark,
  },
  sectionBanner: {
    backgroundColor: colors.primary,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: fontSizes.small,
    color: colors.white,
    textAlign: 'center',
  },

  text: {
    fontSize: fontSizes.small,
    lineHeight: 1.5,
  },
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },
  paragraph: {
    fontSize: fontSizes.small,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: spacing.sm,
  },
  blankLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark,
    minWidth: 120,
  },
  firmaContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: colors.dark,
    width: 260,
    marginBottom: spacing.xs,
  },
});
