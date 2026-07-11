/**
 * Plantilla PDF - Personas e Ingresos (landscape A4)
 * Lista de personas con sus movimientos (ingresos/egresos) de
 * Finanzas > Cuenta por Persona, con cards gerenciales de resumen.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { SaldoPersona } from '../../../../services/finanzasService';
import { ReportMetadata } from '../../types/reportTypes';

const PAD = 20;
const NAME_W = 210;
const DOC_W = 100;
const NUM_W = 110;
const MOV_W = 70;
const FECHA_W = 90;
const ROW_H = 18;
const ROWS_PER_PAGE = 24;

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
    saldos: SaldoPersona[];
    saldoGlobal: number;
  };
  metadata: ReportMetadata;
}

const PersonasIngresosTemplate: React.FC<Props> = ({ data, metadata }) => {
  const { saldos, saldoGlobal } = data;

  const totalIngresos = saldos.reduce((s, p) => s + Number(p.total_ingresos || 0), 0);
  const totalEgresos = saldos.reduce((s, p) => s + Number(p.total_egresos || 0), 0);
  const totalMovimientos = saldos.reduce((s, p) => s + Number(p.movimientos_count || 0), 0);
  const promedioPorPersona = saldos.length > 0 ? saldoGlobal / saldos.length : 0;

  const chunks: SaldoPersona[][] = [];
  for (let i = 0; i < Math.max(saldos.length, 1); i += ROWS_PER_PAGE) {
    chunks.push(saldos.slice(i, i + ROWS_PER_PAGE));
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
              <Text style={S.headerTitle}>Personas e Ingresos — Cuenta por Persona</Text>
              <Text style={S.headerSub}>
                {`Generado: ${genDate} | Pag ${pageIdx + 1}/${totalPages}`}
              </Text>
            </View>

            {isFirst && (
              <Text style={S.subtitleNote}>
                {`Acumulado de TODOS los conceptos registrados en Finanzas > Cuenta por Persona a la fecha de generación (no corresponde a una sola actividad).`}
              </Text>
            )}

            {isFirst && (
              <View style={S.kpiRow}>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Personas con Movimientos</Text>
                  <Text style={S.kpiValue}>{`${saldos.length}`}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Ingresos</Text>
                  <Text style={[S.kpiValue, { color: '#15803d' }]}>{money(totalIngresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Total Egresos</Text>
                  <Text style={[S.kpiValue, { color: '#b91c1c' }]}>{money(totalEgresos)}</Text>
                </View>
                <View style={S.kpiCard}>
                  <Text style={S.kpiLabel}>Saldo Global</Text>
                  <Text style={[S.kpiValue, { color: saldoGlobal >= 0 ? '#15803d' : '#b91c1c' }]}>
                    {money(saldoGlobal)}
                  </Text>
                </View>
                <View style={S.kpiCardLast}>
                  <Text style={S.kpiLabel}>Promedio por Persona</Text>
                  <Text style={S.kpiValue}>{money(promedioPorPersona)}</Text>
                </View>
              </View>
            )}

            <View style={S.tableHeader}>
              <Text style={[S.thLeft, { width: NAME_W }]}>Persona</Text>
              <Text style={[S.th, { width: DOC_W }]}>N° Documento</Text>
              <Text style={[S.th, { width: NUM_W }]}>Ingresos</Text>
              <Text style={[S.th, { width: NUM_W }]}>Egresos</Text>
              <Text style={[S.th, { width: NUM_W }]}>Saldo</Text>
              <Text style={[S.th, { width: MOV_W }]}>N° Mov.</Text>
              <Text style={[S.th, { width: FECHA_W, borderRightWidth: 0 }]}>Última Fecha</Text>
            </View>

            {pageRows.map((p, rowIdx) => {
              const absIdx = pageIdx * ROWS_PER_PAGE + rowIdx;
              const rowStyle = absIdx % 2 === 0 ? S.trEven : S.trOdd;
              return (
                <View key={p.persona_id} style={rowStyle}>
                  <Text style={[S.tdName, { width: NAME_W, height: ROW_H }]} numberOfLines={1}>
                    {`${p.apellidos}, ${p.nombres}`}
                  </Text>
                  <Text style={[S.tdCenter, { width: DOC_W, height: ROW_H }]}>
                    {p.numero_documento || '—'}
                  </Text>
                  <Text style={[S.tdMonto, { width: NUM_W, height: ROW_H, color: '#15803d' }]}>
                    {money(p.total_ingresos)}
                  </Text>
                  <Text style={[S.tdMonto, { width: NUM_W, height: ROW_H, color: '#b91c1c' }]}>
                    {money(p.total_egresos)}
                  </Text>
                  <Text style={[S.tdMonto, { width: NUM_W, height: ROW_H, color: p.saldo >= 0 ? '#15803d' : '#b91c1c' }]}>
                    {money(p.saldo)}
                  </Text>
                  <Text style={[S.tdCenter, { width: MOV_W, height: ROW_H }]}>
                    {`${p.movimientos_count}`}
                  </Text>
                  <Text style={[S.tdCenter, { width: FECHA_W, height: ROW_H, borderRightWidth: 0 }]}>
                    {fmtFecha(p.ultima_fecha)}
                  </Text>
                </View>
              );
            })}

            {isFirst && saldos.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>
                  No se encontraron movimientos registrados por persona.
                </Text>
              </View>
            )}

            {isLast && saldos.length > 0 && (
              <View style={S.totalsRow}>
                <Text style={[S.tdTotalLabel, { width: NAME_W + DOC_W }]}>TOTALES</Text>
                <Text style={[S.tdTotalMonto, { width: NUM_W, color: '#15803d' }]}>{money(totalIngresos)}</Text>
                <Text style={[S.tdTotalMonto, { width: NUM_W, color: '#b91c1c' }]}>{money(totalEgresos)}</Text>
                <Text style={[S.tdTotalMonto, { width: NUM_W, color: saldoGlobal >= 0 ? '#15803d' : '#b91c1c' }]}>
                  {money(saldoGlobal)}
                </Text>
                <Text style={[S.tdTotalMonto, { width: MOV_W }]}>{`${totalMovimientos}`}</Text>
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

export default PersonasIngresosTemplate;
