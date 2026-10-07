/**
 * REPORTE FINANCIERO - Actividad de Aire Libre
 * Ingresos (cuotas de participantes), egresos (ítems planificados comprados
 * + compras directas) y saldo de caja. Los cálculos están documentados en
 * AIRE_LIBRE_CALCULOS_FINANCIEROS.md.
 *
 * @react-pdf/renderer - No soporta emojis, usar texto plano.
 */

import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { AnexoHeader } from './AnexoHeader';
import { anexoStyles, colors } from './anexoPdfStyles';
import { ReporteFinancieroData, ReporteFinancieroItem } from '../../../types/anexoTypes';

interface ReporteFinancieroTemplateProps {
  data: ReporteFinancieroData;
}

interface Columna {
  label: string;
  width: string;
  align?: 'left' | 'right' | 'center';
}

const formatMonto = (valor: number) => `S/ ${Number(valor || 0).toFixed(2)}`;

const formatDiferencia = (valor: number) =>
  valor === 0 ? '—' : `${valor > 0 ? '+' : '-'}${formatMonto(Math.abs(valor))}`;

// Tablas sin borde exterior: cada fila lleva sus propios bordes, así al
// partirse entre páginas la tabla queda cerrada en ambas hojas, y el
// encabezado (fixed) se repite en cada página que ocupa la tabla.
const tablaStyles = StyleSheet.create({
  tabla: {
    width: '100%',
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    minHeight: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.dark,
  },
  filaEncabezado: {
    borderTopWidth: 1,
    minHeight: 22,
  },
  vacio: {
    padding: 6,
    fontSize: 8,
    fontStyle: 'italic',
  },
});

function Tabla({
  columnas,
  filas,
  total,
  vacio,
}: {
  columnas: Columna[];
  filas: string[][];
  total?: string[];
  vacio: string;
}) {
  const ultima = columnas.length - 1;
  const celda = (valor: string, i: number, extra: Style = {}, negrita = false) => (
    <View
      key={i}
      style={[
        i === ultima ? anexoStyles.valueCellLast : anexoStyles.dataTableCell,
        { width: columnas[i].width },
        extra,
      ]}
    >
      <Text style={[{ textAlign: columnas[i].align || 'left' }, negrita ? anexoStyles.textBold : {}]}>{valor}</Text>
    </View>
  );

  return (
    <View style={tablaStyles.tabla}>
      <View style={[tablaStyles.fila, tablaStyles.filaEncabezado]} fixed>
        {columnas.map((c, i) => (
          <View
            key={c.label}
            style={[anexoStyles.dataTableHeaderCell, { width: c.width }, i === ultima ? { borderRightWidth: 0 } : {}]}
          >
            <Text>{c.label}</Text>
          </View>
        ))}
      </View>
      {filas.map((fila, r) => (
        <View key={r} wrap={false} style={tablaStyles.fila}>
          {fila.map((valor, i) => celda(valor, i))}
        </View>
      ))}
      {filas.length === 0 && (
        <View style={tablaStyles.fila}>
          <Text style={tablaStyles.vacio}>{vacio}</Text>
        </View>
      )}
      {total && filas.length > 0 && (
        <View style={[tablaStyles.fila, { backgroundColor: colors.light }]} wrap={false}>
          {total.map((valor, i) => celda(valor, i, { backgroundColor: colors.light }, true))}
        </View>
      )}
    </View>
  );
}

function filaResumen(label: string, valor: string, opciones: { color?: string; destacado?: boolean; ultima?: boolean } = {}) {
  return (
    <View style={opciones.ultima ? anexoStyles.tableRowLast : anexoStyles.tableRow} key={label}>
      <View style={[anexoStyles.labelCell, { width: '60%' }]}>
        <Text>{label}</Text>
      </View>
      <View style={[anexoStyles.valueCellLast, { width: '40%' }]}>
        <Text
          style={[
            { textAlign: 'right', color: opciones.color || colors.dark },
            opciones.destacado ? { fontFamily: 'Helvetica-Bold', fontSize: 10 } : {},
          ]}
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

const COLS_INGRESOS: Columna[] = [
  { label: '#', width: '6%', align: 'center' },
  { label: 'Participante', width: '52%' },
  { label: 'Cuota', width: '14%', align: 'right' },
  { label: 'Pagado', width: '14%', align: 'right' },
  { label: 'Pendiente', width: '14%', align: 'right' },
];

const COLS_CATEGORIAS: Columna[] = [
  { label: 'Categoría', width: '40%' },
  { label: 'Estimado', width: '20%', align: 'right' },
  { label: 'Gastado', width: '20%', align: 'right' },
  { label: 'Diferencia', width: '20%', align: 'right' },
];

const COLS_ITEMS: Columna[] = [
  { label: 'Categoría', width: '13%' },
  { label: 'Origen', width: '14%' },
  { label: 'Concepto', width: '22%' },
  { label: 'Cant.', width: '9%', align: 'right' },
  { label: 'P. Unit.', width: '10%', align: 'right' },
  { label: 'Estimado', width: '10%', align: 'right' },
  { label: 'Gastado', width: '10%', align: 'right' },
  { label: 'Proveedor', width: '12%' },
];

const COLS_COMPRAS: Columna[] = [
  { label: 'Fecha', width: '12%' },
  { label: 'Concepto', width: '28%' },
  { label: 'Categoría', width: '14%' },
  { label: 'Proveedor', width: '16%' },
  { label: 'Comprobante', width: '17%' },
  { label: 'Monto', width: '13%', align: 'right' },
];

const COLS_PENDIENTES: Columna[] = [
  { label: 'Categoría', width: '18%' },
  { label: 'Origen', width: '20%' },
  { label: 'Concepto', width: '35%' },
  { label: 'Cant.', width: '12%', align: 'right' },
  { label: 'Estimado', width: '15%', align: 'right' },
];

const cantidad = (item: ReporteFinancieroItem) =>
  `${Number(item.cantidad || 0)}${item.unidad ? ` ${item.unidad}` : ''}`;

const sumar = <T,>(lista: T[], fn: (x: T) => number) => lista.reduce((acc, x) => acc + (fn(x) || 0), 0);

export const ReporteFinancieroTemplate: React.FC<ReporteFinancieroTemplateProps> = ({ data }) => {
  const rangoFechas = data.fechaInicio === data.fechaFin
    ? data.fechaInicio
    : `${data.fechaInicio} - ${data.fechaFin}`;

  const pendienteCobro = Math.max(data.cuotasEsperadas - data.recaudado, 0);
  const diferenciaPlan = data.totalGastado - data.totalEstimado;
  const saldo = data.recaudado - data.totalGastado;
  const saldoProyectado = saldo - data.totalPendienteCompra;

  const colorSigno = (valor: number) => (valor >= 0 ? colors.success : colors.error);

  return (
    <Document>
      <Page size="A4" style={anexoStyles.page}>
        <AnexoHeader titulo="REPORTE FINANCIERO DE ACTIVIDAD" subtitulo={`Generado el ${data.fechaDocumento}`} />

        <View style={anexoStyles.table}>
          <View style={anexoStyles.tableRow}>
            <View style={[anexoStyles.labelCell, { width: '15%' }]}><Text>Actividad:</Text></View>
            <View style={[anexoStyles.valueCell, { width: '50%' }]}><Text>{data.nombreActividad}</Text></View>
            <View style={[anexoStyles.labelCell, { width: '12%' }]}><Text>Estado:</Text></View>
            <View style={[anexoStyles.valueCellLast, { width: '23%' }]}><Text>{data.estado}</Text></View>
          </View>
          <View style={anexoStyles.tableRow}>
            <View style={[anexoStyles.labelCell, { width: '15%' }]}><Text>Lugar:</Text></View>
            <View style={[anexoStyles.valueCell, { width: '50%' }]}><Text>{data.lugar || '—'}</Text></View>
            <View style={[anexoStyles.labelCell, { width: '12%' }]}><Text>Fecha:</Text></View>
            <View style={[anexoStyles.valueCellLast, { width: '23%' }]}><Text>{rangoFechas}</Text></View>
          </View>
          <View style={anexoStyles.tableRowLast}>
            <View style={[anexoStyles.labelCell, { width: '15%' }]}><Text>Participantes:</Text></View>
            <View style={[anexoStyles.valueCell, { width: '50%' }]}><Text>{data.ingresos.length}</Text></View>
            <View style={[anexoStyles.labelCell, { width: '12%' }]}><Text>Cuota:</Text></View>
            <View style={[anexoStyles.valueCellLast, { width: '23%' }]}><Text>{formatMonto(data.costoPorParticipante)}</Text></View>
          </View>
        </View>

        {/* Resumen */}
        <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>RESUMEN</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[anexoStyles.table, { width: '50%' }]}>
            {filaResumen('Cuotas esperadas', formatMonto(data.cuotasEsperadas))}
            {filaResumen('Recaudado', formatMonto(data.recaudado), { color: colors.success })}
            {filaResumen('Pendiente de cobro', formatMonto(pendienteCobro), {
              color: pendienteCobro > 0 ? colors.warning : colors.dark,
              ultima: true,
            })}
          </View>
          <View style={[anexoStyles.table, { width: '50%' }]}>
            {filaResumen('Presupuesto estimado', formatMonto(data.totalEstimado))}
            {filaResumen('Total gastado', formatMonto(data.totalGastado))}
            {data.totalPendienteCompra > 0
              // Con compras pendientes, la diferencia no es ahorro: es estimado aún sin ejecutar
              ? filaResumen('Estimado por ejecutar', formatMonto(Math.max(-diferenciaPlan, 0)), { ultima: true })
              : filaResumen(
                diferenciaPlan > 0 ? 'Sobrecosto vs estimado' : 'Ahorro vs estimado',
                diferenciaPlan === 0 ? '—' : formatMonto(Math.abs(diferenciaPlan)),
                { color: diferenciaPlan > 0 ? colors.error : diferenciaPlan < 0 ? colors.success : colors.dark, ultima: true },
              )}
          </View>
        </View>
        <View style={anexoStyles.table}>
          {filaResumen(
            saldo >= 0 ? 'SALDO A FAVOR (Recaudado - Gastado)' : 'SALDO EN CONTRA (Recaudado - Gastado)',
            formatMonto(Math.abs(saldo)),
            { color: colorSigno(saldo), destacado: true, ultima: data.totalPendienteCompra === 0 },
          )}
          {data.totalPendienteCompra > 0 && filaResumen('Pendiente por comprar (estimado)', formatMonto(data.totalPendienteCompra))}
          {data.totalPendienteCompra > 0 && filaResumen(
            'Saldo proyectado (si se compra lo pendiente)',
            `${saldoProyectado < 0 ? '-' : ''}${formatMonto(Math.abs(saldoProyectado))}`,
            { color: colorSigno(saldoProyectado), ultima: true },
          )}
        </View>

        {/* Egresos por categoría */}
        <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>EGRESOS POR CATEGORÍA</Text>
        <Tabla
          columnas={COLS_CATEGORIAS}
          vacio="Sin egresos registrados"
          filas={data.categorias.map((c) => [
            c.categoria,
            formatMonto(c.estimado),
            formatMonto(c.real),
            c.estimado === 0 && c.real > 0 ? 'Sin presupuesto' : formatDiferencia(c.real - c.estimado),
          ])}
          total={[
            'TOTAL',
            formatMonto(sumar(data.categorias, (c) => c.estimado)),
            formatMonto(sumar(data.categorias, (c) => c.real)),
            formatDiferencia(sumar(data.categorias, (c) => c.real - c.estimado)),
          ]}
        />

        {/* Ingresos */}
        <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>INGRESOS - CUOTAS DE PARTICIPANTES</Text>
        <Tabla
          columnas={COLS_INGRESOS}
          vacio="Sin participantes inscritos"
          filas={data.ingresos.map((p, i) => [
            String(i + 1),
            p.nombre,
            formatMonto(p.cuota),
            formatMonto(p.pagado),
            formatMonto(Math.max(p.cuota - p.pagado, 0)),
          ])}
          total={[
            '',
            'TOTAL',
            formatMonto(sumar(data.ingresos, (p) => p.cuota)),
            formatMonto(sumar(data.ingresos, (p) => p.pagado)),
            formatMonto(sumar(data.ingresos, (p) => Math.max(p.cuota - p.pagado, 0))),
          ]}
        />

        {/* Egresos: ítems planificados comprados */}
        <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>EGRESOS - ÍTEMS PLANIFICADOS COMPRADOS (MENÚ, MATERIALES, LOGÍSTICA)</Text>
        <Tabla
          columnas={COLS_ITEMS}
          vacio="Sin ítems planificados comprados"
          filas={data.itemsComprados.map((it) => [
            it.categoria,
            it.origen || '—',
            it.concepto,
            cantidad(it),
            formatMonto(it.precioUnitario),
            formatMonto(it.subtotalEstimado),
            formatMonto(it.subtotalReal),
            it.proveedor || '—',
          ])}
          total={[
            'TOTAL', '', '', '', '',
            formatMonto(sumar(data.itemsComprados, (it) => it.subtotalEstimado)),
            formatMonto(sumar(data.itemsComprados, (it) => it.subtotalReal)),
            '',
          ]}
        />

        {/* Egresos: compras directas */}
        <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>EGRESOS - COMPRAS DIRECTAS</Text>
        <Tabla
          columnas={COLS_COMPRAS}
          vacio="Sin compras directas registradas"
          filas={data.comprasDirectas.map((c) => [
            c.fecha,
            c.concepto,
            c.categoria || '—',
            c.proveedor || '—',
            c.comprobante || '—',
            formatMonto(c.monto),
          ])}
          total={['TOTAL', '', '', '', '', formatMonto(sumar(data.comprasDirectas, (c) => c.monto))]}
        />

        {/* Pendientes */}
        {data.itemsPendientes.length > 0 && (
          <>
            <Text style={anexoStyles.sectionBanner} minPresenceAhead={70}>PENDIENTES POR COMPRAR</Text>
            <Tabla
              columnas={COLS_PENDIENTES}
              vacio=""
              filas={data.itemsPendientes.map((it) => [
                it.categoria,
                it.origen || '—',
                it.concepto,
                cantidad(it),
                formatMonto(it.subtotalEstimado),
              ])}
              total={['TOTAL', '', '', '', formatMonto(data.totalPendienteCompra)]}
            />
          </>
        )}

        {/* Firmas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 }} wrap={false}>
          <View style={{ alignItems: 'center' }}>
            <View style={[anexoStyles.firmaLinea, { width: 200 }]} />
            <Text style={anexoStyles.text}>Responsable de la actividad</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={[anexoStyles.firmaLinea, { width: 200 }]} />
            <Text style={anexoStyles.text}>Tesorería del Grupo</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
