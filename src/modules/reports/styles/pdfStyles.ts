/**
 * Estilos reutilizables para reportes PDF
 * Compatible con @react-pdf/renderer
 */

import { StyleSheet } from '@react-pdf/renderer';

// Colores corporativos Scout
export const colors = {
  primary: '#0066CC',
  secondary: '#FF6B35',
  accent: '#4CAF50',
  dark: '#2C3E50',
  light: '#ECF0F1',
  white: '#FFFFFF',
  gray: '#7F8C8D',
  border: '#BDC3C7',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
};

// Tamaños de fuente
export const fontSizes = {
  title: 24,
  subtitle: 18,
  heading: 16,
  subheading: 14,
  body: 12,
  small: 10,
  tiny: 8,
};

// Espaciado
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Estilos base para documentos
export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: 'Helvetica',
  },
  
  // Header
  header: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  logo: {
    width: 60,
    height: 60,
  },
  
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  
  // Títulos
  title: {
    fontSize: fontSizes.title,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: fontSizes.subtitle,
    color: colors.dark,
    marginBottom: spacing.md,
  },
  
  heading: {
    fontSize: fontSizes.heading,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  
  subheading: {
    fontSize: fontSizes.subheading,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  
  // Texto
  text: {
    fontSize: fontSizes.body,
    color: colors.dark,
    lineHeight: 1.5,
  },
  
  textSmall: {
    fontSize: fontSizes.small,
    color: colors.gray,
    lineHeight: 1.4,
  },
  
  textBold: {
    fontFamily: 'Helvetica-Bold',
  },
  
  // Fecha
  date: {
    fontSize: fontSizes.small,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  
  // Metadata
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: 4,
  },
  
  metadataItem: {
    fontSize: fontSizes.small,
    color: colors.gray,
  },
  
  // Secciones
  section: {
    marginBottom: spacing.lg,
  },
  
  sectionCard: {
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  
  // Tablas
  table: {
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  
  tableHeaderCell: {
    fontSize: fontSizes.small,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    flex: 1,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.sm,
  },
  
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.sm,
    backgroundColor: colors.light,
  },
  
  tableCell: {
    fontSize: fontSizes.body,
    color: colors.dark,
    flex: 1,
  },
  
  // Listas
  list: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  
  listItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  
  listBullet: {
    width: 15,
    fontSize: fontSizes.body,
    color: colors.primary,
  },
  
  listContent: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.dark,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  footerText: {
    fontSize: fontSizes.small,
    color: colors.gray,
  },
  
  // Badges y etiquetas
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    fontSize: fontSizes.small,
    fontFamily: 'Helvetica-Bold',
  },
  
  badgeSuccess: {
    backgroundColor: colors.success,
    color: colors.white,
  },
  
  badgeWarning: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  
  badgeError: {
    backgroundColor: colors.error,
    color: colors.white,
  },
  
  // Divisores
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  
  // Boxes informativos
  infoBox: {
    padding: spacing.md,
    backgroundColor: colors.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
  },
  
  warningBox: {
    padding: spacing.md,
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  
  // Grid system
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  
  col: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  
  col2: {
    flex: 2,
    paddingHorizontal: spacing.xs,
  },
  
  col3: {
    flex: 3,
    paddingHorizontal: spacing.xs,
  },
});

// Estilos específicos para reportes de Scout
export const scoutReportStyles = StyleSheet.create({
  profileSection: {
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: 4,
    marginBottom: spacing.lg,
  },
  
  profileField: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  
  fieldLabel: {
    width: 120,
    fontSize: fontSizes.body,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray,
  },
  
  fieldValue: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.dark,
  },
  
  ramaTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent,
    color: colors.white,
    fontSize: fontSizes.small,
    fontFamily: 'Helvetica-Bold',
    borderRadius: 4,
  },
});

// Estilos para reportes de asistencia
export const attendanceStyles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: 4,
    marginBottom: spacing.lg,
  },
  
  summaryItem: {
    alignItems: 'center',
  },
  
  summaryValue: {
    fontSize: fontSizes.title,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  
  summaryLabel: {
    fontSize: fontSizes.small,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  
  attendanceCell: {
    width: 60,
    textAlign: 'center',
  },
  
  present: {
    color: colors.success,
    fontFamily: 'Helvetica-Bold',
  },
  
  absent: {
    color: colors.error,
    fontFamily: 'Helvetica-Bold',
  },
  
  justified: {
    color: colors.warning,
    fontFamily: 'Helvetica-Bold',
  },
});

// Estilos para reportes de progreso
export const progressStyles = StyleSheet.create({
  progressBar: {
    height: 20,
    backgroundColor: colors.light,
    borderRadius: 10,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: fontSizes.small,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    paddingTop: 4,
  },
  
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  milestoneIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  
  milestoneContent: {
    flex: 1,
  },
});

export default {
  baseStyles,
  scoutReportStyles,
  attendanceStyles,
  progressStyles,
  colors,
  fontSizes,
  spacing,
};
