import React, { forwardRef } from 'react';
import type { PlantillaCarta, Institucion, EventoCarta } from '../../services/documentosService';

export interface CartaData {
  plantilla: PlantillaCarta | null;
  institucion: Institucion | null;
  evento: EventoCarta | null;
  numeroCarta: string;
  anio: string;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function fechaLarga(d = new Date()): string {
  return `Lima, ${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`;
}

// Estilos inline → garantizan fidelidad tanto en pantalla como al imprimir/PDF.
const S = {
  hoja: {
    boxSizing: 'border-box',
    width: '21cm',
    minHeight: '29.7cm',
    margin: '0 auto',
    padding: '2.5cm 2.5cm 2cm',
    background: '#ffffff',
    color: '#111827',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '12.5pt',
    lineHeight: 1.6,
  } as React.CSSProperties,
  logoWrap: { minHeight: '2.2cm', marginBottom: '0.4cm' } as React.CSSProperties,
  logo: { maxWidth: '4.5cm', maxHeight: '2.2cm', objectFit: 'contain' } as React.CSSProperties,
  fechaBlock: { textAlign: 'right', fontSize: '11pt', marginBottom: '0.6cm' } as React.CSSProperties,
  cartaNro: { fontWeight: 700, marginTop: '2px' } as React.CSSProperties,
  destinatario: { marginBottom: '0.5cm', lineHeight: 1.4 } as React.CSSProperties,
  asunto: {
    fontWeight: 700,
    textTransform: 'uppercase',
    borderBottom: '1px solid #cbd5e1',
    paddingBottom: '4px',
    marginBottom: '0.5cm',
    fontSize: '11.5pt',
  } as React.CSSProperties,
  parrafo: { textAlign: 'justify', textIndent: '1.2cm', margin: '0 0 0.45cm' } as React.CSSProperties,
  parrafoSin: { textAlign: 'justify', margin: '0 0 0.45cm' } as React.CSSProperties,
  datosBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.5cm 0.7cm',
    margin: '0.4cm 0',
  } as React.CSSProperties,
  datoLinea: { margin: '0 0 6px' } as React.CSSProperties,
  datoLabel: { fontWeight: 700, color: '#334155' } as React.CSSProperties,
  bold: { fontWeight: 700, textDecoration: 'underline' } as React.CSSProperties,
  fraseCierre: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: 600,
    color: '#334155',
    margin: '0.5cm 0',
  } as React.CSSProperties,
  firmaWrap: {
    marginTop: '1.6cm',
    width: '7cm',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  } as React.CSSProperties,
  firmaImg: { maxWidth: '4.5cm', maxHeight: '2.2cm', objectFit: 'contain', display: 'block', margin: '0 auto -6px' } as React.CSSProperties,
  firmaLinea: { borderTop: '1px solid #111827', margin: '4px 0' } as React.CSSProperties,
  firmaNombre: { fontWeight: 700, fontSize: '11pt' } as React.CSSProperties,
  firmaCargo: { fontSize: '10pt', color: '#475569' } as React.CSSProperties,
  firmaReg: { fontSize: '8.5pt', color: '#94a3b8', letterSpacing: '0.5px' } as React.CSSProperties,
  footer: {
    marginTop: '1.4cm',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
    textAlign: 'center',
    fontSize: '9pt',
    color: '#94a3b8',
    display: 'flex',
    justifyContent: 'center',
    gap: '1.4cm',
  } as React.CSSProperties,
};

const CartaOficialDocumento = forwardRef<HTMLDivElement, CartaData>(
  ({ plantilla, institucion, evento, numeroCarta, anio }, ref) => {
    const inst = institucion;
    const ev = evento;
    const p = plantilla;

    const actividad = ev?.dinamico_actividad || '________________';
    const nombreInst = inst?.nombre_institucion || '________________';
    const direccion = inst?.direccion || '';

    const nroCarta = [
      numeroCarta?.trim() || '000',
      anio?.trim() || String(new Date().getFullYear()),
      p?.carta_prefijo || 'ASL12',
    ].join(' – ');

    return (
      <div ref={ref} style={S.hoja}>
        {/* 1. Logo */}
        <div style={S.logoWrap}>
          {p?.logo_url ? <img src={p.logo_url} alt="Logo" style={S.logo} /> : null}
        </div>

        {/* 2. Fecha y numeración */}
        <div style={S.fechaBlock}>
          <div>{fechaLarga()}</div>
          <div style={S.cartaNro}>{`Carta Nro. ${nroCarta}`}</div>
        </div>

        {/* 3. Destinatario */}
        <div style={S.destinatario}>
          <div style={{ fontWeight: 700 }}>
            {inst?.encargado_cargo ? `${inst.encargado_cargo}: ` : 'Señor(a): '}
            {inst?.encargado_nombre || '________________'}
          </div>
          <div style={{ fontWeight: 600 }}>{nombreInst}</div>
          {direccion ? <div style={{ fontStyle: 'italic', color: '#475569', fontSize: '11pt' }}>{direccion}</div> : null}
        </div>

        {/* 4. Asunto */}
        <div style={S.asunto}>
          <span style={{ color: '#475569' }}>Asunto: </span>
          {actividad}
        </div>

        {/* 5. Párrafo presentación */}
        <p style={S.parrafo}>
          {p?.parrafo_presentacion ||
            'Por medio de la presente expreso mi saludo y parabienes a su gestión, a la vez comunicarle que nuestra institución, como parte de su ciclo de programa va a realizar una '}
          <strong style={S.bold}>{actividad}</strong>
          {' en las instalaciones del '}
          <strong style={S.bold}>{`${nombreInst}${direccion ? ` (${direccion})` : ''}`}</strong>
          {' que Ud. administra, y solicitarle nos brinde las facilidades del caso.'}
        </p>

        {/* 6. Bloque de datos dinámicos (verticales) */}
        <div style={S.datosBox}>
          <p style={S.datoLinea}>
            <span style={S.datoLabel}>Día: </span>
            {ev?.dinamico_dias || '—'}
          </p>
          <p style={S.datoLinea}>
            <span style={S.datoLabel}>Hora: </span>
            {ev?.dinamico_horas || '—'}
          </p>
          <p style={S.datoLinea}>
            <span style={S.datoLabel}>Punto de llegada y partida: </span>
            {ev?.dinamico_partida || '—'}
          </p>
          <p style={{ ...S.datoLinea, marginBottom: 0 }}>
            <span style={S.datoLabel}>Cantidad de jóvenes: </span>
            {ev?.dinamico_jovenes || '—'}
          </p>
        </div>

        {/* 7. Responsabilidad */}
        <p style={S.parrafo}>
          {'Los cuales estarán acompañados y bajo responsabilidad de '}
          <strong style={{ fontWeight: 700 }}>{ev?.dinamico_adultos || '—'}</strong>
          {' adultos voluntarios.'}
        </p>

        {/* 8. Despedida */}
        <p style={S.parrafoSin}>
          {p?.parrafo_despedida ||
            'Por tal motivo, se le hace partícipe para los fines correspondientes. Sin otro en particular me despido reiterando mi estima personal.'}
        </p>

        {/* 9. Frase de cierre */}
        <div style={S.fraseCierre}>{`"${p?.frase_cierre || 'Siempre listo para avanzar y servir'}"`}</div>

        {/* 10. Firma */}
        <div style={S.firmaWrap}>
          {p?.firma_url_imagen ? <img src={p.firma_url_imagen} alt="Firma" style={S.firmaImg} /> : null}
          <div style={S.firmaLinea} />
          {p?.firma_nombre ? <div style={S.firmaNombre}>{p.firma_nombre}</div> : null}
          {p?.firma_cargo ? <div style={S.firmaCargo}>{p.firma_cargo}</div> : null}
          {p?.firma_registro ? <div style={S.firmaReg}>{p.firma_registro}</div> : null}
        </div>

        {/* 11. Footer redes */}
        {(p?.instagram || p?.facebook) && (
          <div style={S.footer}>
            {p?.instagram ? <span>Instagram: {p.instagram}</span> : null}
            {p?.facebook ? <span>Facebook: {p.facebook}</span> : null}
          </div>
        )}
      </div>
    );
  }
);

CartaOficialDocumento.displayName = 'CartaOficialDocumento';
export default CartaOficialDocumento;
