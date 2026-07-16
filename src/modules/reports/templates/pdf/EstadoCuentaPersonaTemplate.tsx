/**
 * Plantilla PDF - Estado de Cuenta por Persona (portrait A4)
 * Documento pensado para entregar a la persona/familia: sus movimientos
 * de Finanzas > Cuenta por Persona (ingresos y egresos, con el concepto
 * de cada uno), su saldo a favor y su deuda pendiente por cobrar.
 * No incluye ganancia neta ni inversión (margen interno del grupo scout).
 * Modelada sobre IngresosPorConceptoTemplate.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { MovimientoPersona } from '../../../../services/finanzasService';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 24;
const CONCEPTO_W = 200;
const TIPO_W = 60;
const MONTO_W = 85;
const DEUDA_W = 85;
const FECHA_W = 70;
const ROW_H = 18;
const ROWS_PER_PAGE = 30;

const money = (n: number): string => `S/ ${Number(n || 0).toFixed(2)}`;

const fmtFecha = (iso?: string): string => {
  if (!iso) return '—';
  const p = iso.split('T')[0].split('-');
  if (p.length < 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
};

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

  personCard: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 4, paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
    marginBottom: 8,
  },
  personName: { fontSize: 12, color: '#111827', fontFamily: 'Helvetica-Bold' },
  personDoc: { fontSize: 8, color: '#6b7280', marginTop: 2 },

  subtitleNote: { fontSize: 7, color: '#6b7280', marginBottom: 6 },
  sectionTitle: { fontSize: 9, color: '#1e3a8a', fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 4 },

  kpiRow: { flexDirection: 'row', marginBottom: 10 },
  kpiCard: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8, marginRight: 6,
  },
  kpiCardLast: {
    flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 4, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 8,
  },
  kpiLabel: { fontSize: 7, color: '#1e40af' },
  kpiValue: { fontSize: 15, color: '#111827', fontFamily: 'Helvetica-Bold', marginTop: 3 },

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
  tdLeft: {
    fontSize: 7.5, color: '#111827', paddingTop: 4, paddingBottom: 4, paddingLeft: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb',
    borderRightWidth: 0.5, borderRightColor: '#e5e7eb',
  },
  tdCenter: {
    fontSize: 7, color: '#4b5563', textAlign: 'center', paddingTop: 4, paddingBottom: 4,
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
    persona: {
      persona_id: string;
      nombres: string;
      apellidos: string;
      numero_documento?: string;
    };
    movimientos: MovimientoPersona[];
    totalIngresos: number;
    totalEgresos: number;
    saldo: number;
    totalDeuda: number;
  };
  metadata: ReportMetadata;
}

const EstadoCuentaPersonaTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { persona, movimientos, totalIngresos, totalEgresos, saldo, totalDeuda } = data;

  const chunks: MovimientoPersona[][] = [];
  for (let i = 0; i < Math.max(movimientos.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(movimientos.slice(i, i + ROWS_PER_PAGE));
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
          <Page key={pageIdx} size="A4" orientation="portrait" style={S.page}>
            <View style={S.headerBar}>
              <Text style={S.headerTitle}>Estado de Cuenta</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <View style={S.personCard}>
                <Text style={S.personName}>{`${persona.apellidos}, ${persona.nombres}`}</Text>
                {persona.numero_documento && (
                  <Text style={S.personDoc}>{`Documento: ${persona.numero_documento}`}</Text>
                )}
              </View>
            )}

            {isFirst && (
              <Text style={S.subtitleNote}>
                Detalle de movimientos de tu cuenta con el Grupo Scout: ingresos (pagos y cobros a tu favor) y egresos, junto con el concepto de cada uno.
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Ingresos</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalIngresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Egresos</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>{money(totalEgresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Saldo a Favor</Text>
                  <Text style={[S.kpiValue, { color: saldo >= 0 ? '#15803d' : '#b91c1c' }]}>{money(saldo)}</Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Deuda Pendiente</Text>
                  <Text style={[S.kpiValue, { color: '#d97706' }]}>{money(totalDeuda)}</Text>
                </View>
              </View>
            )}

            {isFirst && <Text style={S.sectionTitle}>Detalle de Movimientos</Text>}

            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: CONCEPTO_W }]}>Concepto</Text>
              <Text style={[S.th, { width: TIPO_W }]}>Tipo</Text>
              <Text style={[S.th, { width: MONTO_W }]}>Monto</Text>
              <Text style={[S.th, { width: DEUDA_W }]}>Deuda</Text>
              <Text style={[S.th, { width: FECHA_W, borderRightWidth: 0 }]}>Fecha</Text>
            </View>

            {pageRows.map((m, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              const esIngreso = m.tipo_movimiento === 'INGRESO';
              const meta = m.cantidad != null && m.precio_unitario != null ? m.cantidad * m.precio_unitario : undefined;
              const deuda = esIngreso && meta != null && m.monto < meta ? meta - m.monto : undefined;
              return (
                <View key={m.id} style={rowStyle}>
                  <Text style={[S.tdLeft, { width: CONCEPTO_W, height: ROW_H }]} numberOfLines={1}>
                    {m.concepto}
                  </Text>
                  <Text style={[S.tdCenter, { width: TIPO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c' }]}>
                    {esIngreso ? 'Ingreso' : 'Egreso'}
                  </Text>
                  <Text style={[S.tdMonto, { width: MONTO_W, height: ROW_H, color: esIngreso ? '#15803d' : '#b91c1c' }]}>
                    {money(m.monto)}
                  </Text>
                  <Text style={[S.tdMonto, { width: DEUDA_W, height: ROW_H, color: '#d97706' }]}>
                    {deuda != null ? money(deuda) : '—'}
                  </Text>
                  <Text style={[S.tdCenter, { width: FECHA_W, height: ROW_H, borderRightWidth: 0 }]}>
                    {fmtFecha(m.fecha)}
                  </Text>
                </View>
              );
            })}

            {isFirst && movimientos.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron movimientos registrados para esta persona.
                </Text>
              </View>
            )}

            {isLast && movimientos.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: CONCEPTO_W + TIPO_W }]}>SALDO A FAVOR</Text>
                <Text style={[S.tdTotalMonto, { width: MONTO_W, color: saldo >= 0 ? '#15803d' : '#b91c1c' }]}>
                  {money(saldo)}
                </Text>
                <Text style={[S.tdTotalMonto, { width: DEUDA_W, color: '#d97706' }]}>{money(totalDeuda)}</Text>
                <View style={{ width: FECHA_W }} />
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

export default EstadoCuentaPersonaTemplate;
