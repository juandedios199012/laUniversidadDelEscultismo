/**
 * Plantilla PDF - Reporte de Inventario (landscape A4)
 * Detalle de items del inventario (tabla `inventario`). Modelada sobre
 * PersonasIngresosTemplate.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InventarioItem } from '../../../../lib/supabase';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 20;
const NOMBRE_W = 220;
const CAT_W = 140;
const CANT_W = 70;
const ESTADO_W = 100;
const UBIC_W = 150;
const COSTO_W = 90;
const ROW_H = 18;
const ROWS_PER_PAGE = 22;

const CATEGORIA_LABEL: Record<string, string> = {
  CAMPING: 'Camping / Material Scout',
  CEREMONIAL: 'Ceremonial',
  DEPORTE: 'Deportivo',
  SEGURIDAD: 'Primeros Auxilios',
  COCINA: 'Cocina / Alimentación',
  EDUCATIVO: 'Material Educativo',
  OTRO: 'Otro / Administrativo',
};

const ESTADO_LABEL: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  EN_MANTENIMIENTO: 'En Mantenimiento',
  DAÑADO: 'Dañado',
  PERDIDO: 'Perdido',
};

const ESTADO_COLOR: Record<string, string> = {
  DISPONIBLE: '#15803d',
  PRESTADO: '#b45309',
  EN_MANTENIMIENTO: '#1d4ed8',
  DAÑADO: '#c2410c',
  PERDIDO: '#b91c1c',
};

const money = (n?: number): string => `S/ ${Number(n || 0).toFixed(2)}`;

const S = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: PAD,
    paddingBottom: PAD,
    paddingLeft: PAD,
    paddingRight: PAD,
    fontFamily: 'Helvetica',
  },

  headerBar: {
    backgroundColor: '#1e3a8a',
    borderRadius: 5,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 13, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  headerSub: { fontSize: 7.5, color: '#bfdbfe', textAlign: 'right' },
  subtitleNote: { fontSize: 7, color: '#6b7280', marginBottom: 6 },

  kpiRow: { flexDirection: 'row', marginBottom: 7 },
  kpiCard: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, marginRight: 6,
  },
  kpiCardLast: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8,
  },
  kpiLabel: { fontSize: 6.5, color: '#1e40af' },
  kpiValue: { fontSize: 14, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 2 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a' },
  th: {
    fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold', textAlign: 'center',
    paddingTop: 4, paddingBottom: 4, borderRightWidth: 0.5, borderRightColor: '#3b82f6',
  },
  thLeft: {
    fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold',
    paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderRightWidth: 0.5, borderRightColor: '#3b82f6',
  },

  trEven: { flexDirection: 'row', backgroundColor: '#ffffff' },
  trOdd: { flexDirection: 'row', backgroundColor: '#f8fafc' },
  tdName: {
    fontSize: 7.5, color: '#111827', paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdCenter: {
    fontSize: 7, color: '#4b5563', textAlign: 'center', paddingTop: 4, paddingBottom: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdLeft: {
    fontSize: 7, color: '#4b5563', paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdMonto: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingTop: 4, paddingBottom: 4, paddingRight: 6,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },

  totalsRow: {
    flexDirection: 'row', backgroundColor: '#f1f5f9',
    borderTopWidth: 1.5, borderTopColor: '#94a3b8',
  },
  tdTotalLabel: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151',
    paddingTop: 5, paddingBottom: 5, paddingLeft: 4,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
  },
  tdTotalMonto: {
    fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'right',
    paddingTop: 5, paddingBottom: 5, paddingRight: 6,
    borderRightWidth: 0.5, borderRightColor: '#cbd5e1',
  },

  footer: {
    marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 4,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: '#9ca3af' },
});

interface Props {
  data: {
    items: InventarioItem[];
    total: number;
    disponibles: number;
    prestados: number;
    valorTotal: number;
  };
  metadata: ReportMetadata;
}

const InventarioReportTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { items, total, disponibles, prestados, valorTotal } = data;

  const chunks: InventarioItem[][] = [];
  for (let i = 0; i < Math.max(items.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(items.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);
  const totalPages = chunks.length;

  const genDate = new Date(metadata.generatedAt).toLocaleDateString('es-PE');

  return (
    <Document>
      {chunks.map((pageRows, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === totalPages - 1;

        return (
          <Page key={pageIdx} size="A4" orientation="landscape" style={S.page}>
            <View style={S.headerBar}>
              <Text style={S.headerTitle}>Reporte de Inventario</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <Text style={S.subtitleNote}>
                {'Estado actual de los items registrados en el módulo de Inventario'}
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Items Totales</Text>
                  <Text style={S.kpiValue}>{`${total}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Disponibles</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{`${disponibles}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Prestados</Text>
                  <Text style={[S.kpiValue, { color: '#b45309' }]}>{`${prestados}`}</Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Valor Total</Text>
                  <Text style={S.kpiValue}>{money(valorTotal)}</Text>
                </View>
              </View>
            )}

            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NOMBRE_W }]}>Nombre</Text>
              <Text style={[S.th, { width: CAT_W }]}>Categoría</Text>
              <Text style={[S.th, { width: CANT_W }]}>Cantidad</Text>
              <Text style={[S.th, { width: ESTADO_W }]}>Estado</Text>
              <Text style={[S.thLeft, { width: UBIC_W }]}>Ubicación</Text>
              <Text style={[S.th, { width: COSTO_W, borderRightWidth: 0 }]}>Valor Unitario</Text>
            </View>

            {pageRows.map((item, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              return (
                <View key={item.id} style={rowStyle}>
                  <Text style={[S.tdName, { width: NOMBRE_W, height: ROW_H }]} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={[S.tdCenter, { width: CAT_W, height: ROW_H }]} numberOfLines={1}>
                    {CATEGORIA_LABEL[item.categoria] || item.categoria}
                  </Text>
                  <Text style={[S.tdCenter, { width: CANT_W, height: ROW_H }]}>
                    {item.cantidad_disponible}
                  </Text>
                  <Text style={[S.tdCenter, { width: ESTADO_W, height: ROW_H, color: ESTADO_COLOR[item.estado_item] || '#4b5563', fontFamily: 'Helvetica-Bold' }]}>
                    {ESTADO_LABEL[item.estado_item] || item.estado_item}
                  </Text>
                  <Text style={[S.tdLeft, { width: UBIC_W, height: ROW_H }]} numberOfLines={1}>
                    {item.ubicacion || '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: COSTO_W, height: ROW_H, borderRightWidth: 0 }]}>
                    {item.valor_unitario != null ? money(item.valor_unitario) : '—'}
                  </Text>
                </View>
              );
            })}

            {isFirst && items.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron items registrados en el inventario.
                </Text>
              </View>
            )}

            {isLast && items.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: NOMBRE_W + CAT_W + CANT_W + ESTADO_W + UBIC_W }]}>TOTALES</Text>
                <Text style={[S.tdTotalMonto, { width: COSTO_W, borderRightWidth: 0 }]}>{money(valorTotal)}</Text>
              </View>
            )}

            <View style={S.footer}>
              <Text style={S.footerText}>{`${metadata.organizacion} | ${metadata.version}`}</Text>
              <Text style={S.footerText}>{`Pag ${pageIdx + 1}/${totalPages}`}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default InventarioReportTemplate;
