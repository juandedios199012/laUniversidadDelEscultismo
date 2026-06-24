/**
 * Generador de PDF DNGI-02 para Dirigentes
 * Formato oficial: Registro Institucional para Adultos Voluntarios
 * Usa @react-pdf/renderer igual que DNGI-03
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Dirigente, CARGOS_LABELS, TIPOS_MEMBRESIA_LABELS } from '../../types/dirigente';
import DNGI02Template from '../../modules/reports/templates/pdf/DNGI02Template';

// ============================================================================
// FUNCIÓN PRINCIPAL - Genera PDF formato oficial DNGI-02
// ============================================================================

export async function generarPDFDirigente(dirigente: Dirigente): Promise<Blob> {
  const metadata = {
    fechaGeneracion: new Date().toLocaleDateString('es-PE'),
  };
  
  const doc = <DNGI02Template dirigente={dirigente} metadata={metadata} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  
  return blob;
}

// ============================================================================
// FUNCIÓN PARA DESCARGAR PDF
// ============================================================================

export async function descargarPDFDirigente(dirigente: Dirigente) {
  try {
    const blob = await generarPDFDirigente(dirigente);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `DNGI02_${dirigente.persona.apellidos}_${dirigente.persona.nombres}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================================
// GENERADOR WORD - Formato HTML compatible
// ============================================================================

// Logo Scouts del Perú en base64 para embeber en Word
const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAACACAYAAAC7gW9qAAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABgAAAAAQAAAGAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAECgAwAEAAAAAQAAAIAAAAAAsyMrrwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAMxZJREFUeAHtfQeQncdxZv/x5bc5YrEBu8iZAEGABIhEggTADIESScmWZYuSxZPOOtt19lW5DrqqK7vO9kmiZEkMsijLSoQYAJIAAygCBEnkHBY5LDZgc3rxj/f1vPcWC2CxAVxQvrqbqrfvf/8/09PdM9Pd093zL9EfqMTj8UrHdetsx7nE138gNP4w3ZqmuRTE2+aJ06554pQrrnHvD4PN';

export async function generarWordDirigente(dirigente: Dirigente): Promise<Blob> {
  const fechaActual = new Date().toLocaleDateString('es-PE');
  const sexoTextoWord = dirigente.persona.sexo === 'M' ? 'M' : dirigente.persona.sexo === 'F' ? 'F' : '';
  const fechaNacWord = dirigente.persona.fecha_nacimiento ? new Date(dirigente.persona.fecha_nacimiento).toLocaleDateString('es-PE') : '';
  const cargoLabel = CARGOS_LABELS[dirigente.cargo as keyof typeof CARGOS_LABELS] || dirigente.cargo || '';
  const membresiaLabel = TIPOS_MEMBRESIA_LABELS[dirigente.tipo_membresia as keyof typeof TIPOS_MEMBRESIA_LABELS] || 'Registro Anual Regular';

  // Crear contenido HTML que Word puede interpretar con formato oficial
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>DNGI-02 - ${dirigente.persona.apellidos}, ${dirigente.persona.nombres}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: Calibri, sans-serif; font-size: 12pt; margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { background: #999; color: #000; padding: 4px; font-size: 9pt; text-align: center; border: 1px solid #000; font-weight: bold; }
        td { padding: 5px; border: 1px solid #000; font-size: 12pt; }
        .header-table { margin-bottom: 15px; }
        .header-table td { vertical-align: middle; }
        .header-left { width: 20%; text-align: center; font-size: 10pt; color: #666; }
        .header-center { width: 55%; text-align: center; }
        .header-right { width: 25%; font-size: 10pt; color: #666; }
        .header-title { font-size: 14pt; font-weight: bold; color: #666; margin: 0; }
        .intro { font-size: 12pt; margin-bottom: 12px; text-align: justify; }
        .section-title { font-size: 14pt; font-weight: bold; margin: 15px 0 8px 0; }
        .declaration { margin: 6px 0; font-size: 12pt; line-height: 1.4; text-align: justify; }
        .declaration-num { font-weight: bold; }
        .box { border: 1px solid #000; padding: 8px; min-height: 50px; margin: 10px 0; }
        .discapacidad-box { height: 3cm; }
        .footer { font-size: 9pt; color: #999; font-style: italic; margin-top: 20px; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <!-- PÁGINA 1 -->
      <table class="header-table">
        <tr>
          <td class="header-left">
            Scouts del Perú<br><span style="font-size: 8pt;">Jóvenes con Futuro</span>
          </td>
          <td class="header-center">
            <span class="header-title">FORMATO DE REGISTRO INSTITUCIONAL<br>PARA ADULTOS VOLUNTARIOS</span>
          </td>
          <td class="header-right">
            Código: DNGI-02<br>
            Fecha: ${fechaActual}<br>
            Versión: 2.1<br>
            Páginas: Página 1 de 3
          </td>
        </tr>
      </table>

      <p class="intro">
        <b>Estimado Adulto Voluntario – Miembro Colaborador</b> es necesario que todos los datos estén llenos y con información exacta, una vez completo, deberá hacérselo llegar a su Jefe de Grupo junto con los anexos solicitados, así como con su documento de identidad (DNI o Carné de Extranjería) para el proceso de inscripción.
      </p>

      <table>
        <tr><th style="width:50%">APELLIDOS COMPLETOS</th><th style="width:50%">NOMBRES COMPLETOS</th></tr>
        <tr><td>${dirigente.persona.apellidos || ''}</td><td>${dirigente.persona.nombres || ''}</td></tr>
      </table>

      <table>
        <tr><th style="width:15%">SEXO</th><th style="width:25%">FECHA DE NACIMIENTO</th><th style="width:30%">TIPO DE DOCUMENTO</th><th style="width:30%">NÚMERO DE DOCUMENTO</th></tr>
        <tr><td>${sexoTextoWord}</td><td>${fechaNacWord}</td><td>${dirigente.persona.tipo_documento || 'DNI'}</td><td>${dirigente.persona.numero_documento || ''}</td></tr>
      </table>

      <table>
        <tr><th>RELIGIÓN O CREDO</th><th>CORREO ELECTRÓNICO INSTITUCIONAL</th><th>CORREO ELECTRÓNICO PERSONAL</th></tr>
        <tr><td>${dirigente.persona.religion || ''}</td><td>${dirigente.persona.correo_institucional || ''}</td><td>${dirigente.persona.correo || ''}</td></tr>
      </table>

      <table>
        <tr><th>REGIÓN</th><th>LOCALIDAD</th><th>NUMERAL</th><th>UNIDAD</th><th>CARGO</th></tr>
        <tr><td>${dirigente.region_scout || ''}</td><td>${dirigente.localidad_scout || ''}</td><td>${dirigente.numeral_grupo || ''}</td><td>${dirigente.unidad || ''}</td><td>${cargoLabel}</td></tr>
      </table>

      <table>
        <tr><th style="width:75%">DIRECCIÓN</th><th style="width:25%">CÓDIGO POSTAL</th></tr>
        <tr><td>${dirigente.persona.direccion || ''}</td><td>${dirigente.persona.codigo_postal || ''}</td></tr>
      </table>

      <table>
        <tr><th>DEPARTAMENTO</th><th>PROVINCIA</th><th>DISTRITO</th></tr>
        <tr><td>${dirigente.persona.departamento || ''}</td><td>${dirigente.persona.provincia || ''}</td><td>${dirigente.persona.distrito || ''}</td></tr>
      </table>

      <table>
        <tr><th>CARNÉ CONADIS</th><th>TIPO DE DISCAPACIDAD</th><th>PROFESIÓN U OCUPACIÓN</th></tr>
        <tr><td>${dirigente.persona.carnet_conadis || ''}</td><td>${dirigente.persona.tipo_discapacidad || ''}</td><td></td></tr>
      </table>

      <table>
        <tr><th>GRUPO SANGUÍNEO</th><th>FACTOR SANGUÍNEO</th><th>SEGURO MÉDICO</th><th>TELÉFONO MÓVIL</th></tr>
        <tr><td>${dirigente.persona.grupo_sanguineo || ''}</td><td>${dirigente.persona.factor_sanguineo || ''}</td><td>${dirigente.persona.seguro_medico || ''}</td><td>${dirigente.persona.celular || ''}</td></tr>
      </table>

      <table>
        <tr><th>SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO</th></tr>
        <tr><td class="discapacidad-box">${dirigente.persona.descripcion_discapacidad || ''}</td></tr>
      </table>

      <table>
        <tr><th style="width:80%">CENTRO DE ESTUDIOS</th><th style="width:20%">CICLO O AÑO</th></tr>
        <tr><td>${dirigente.centro_estudios || ''}</td><td>${dirigente.ciclo_anio_estudios || ''}</td></tr>
      </table>

      <table>
        <tr><th style="width:50%">CENTRO LABORAL</th><th style="width:50%">CARGO</th></tr>
        <tr><td>${dirigente.centro_laboral || ''}</td><td>${dirigente.cargo_laboral || ''}</td></tr>
      </table>

      <table>
        <tr><th style="width:50%">CONTACTO DE EMERGENCIA – NOMBRE Y APELLIDO</th><th style="width:25%">TELÉFONO</th><th style="width:25%">PARENTESCO</th></tr>
        <tr><td>${dirigente.contacto_emergencia?.nombre || ''}</td><td>${dirigente.contacto_emergencia?.telefono || ''}</td><td>${dirigente.contacto_emergencia?.parentesco || ''}</td></tr>
      </table>

      <p class="footer">* Publicado en la página web de la Asociación de Scouts del Perú.</p>

      <!-- PÁGINA 2 -->
      <div style="page-break-before: always;"></div>
      
      <table class="header-table">
        <tr>
          <td class="header-left">
            Scouts del Perú<br><span style="font-size: 8pt;">Jóvenes con Futuro</span>
          </td>
          <td class="header-center">
            <span class="header-title">FORMATO DE REGISTRO INSTITUCIONAL<br>PARA ADULTOS VOLUNTARIOS</span>
          </td>
          <td class="header-right">
            Código: DNGI-02<br>
            Fecha: ${fechaActual}<br>
            Versión: 2.1<br>
            Páginas: Página 2 de 3
          </td>
        </tr>
      </table>

      <p class="section-title">Como Adulto Voluntario:</p>

      <p class="declaration">
        <span class="declaration-num">1.</span> Declaro haber leído y entendido la <b>Política para la Protección de los Miembros Juveniles de la Asociación de Scouts del Perú*</b>, así como comprometerme a cumplirla y velar por su cumplimiento.
      </p>

      <p class="declaration">
        <span class="declaration-num">2.</span> Declaro haber leído y entendido el <b>Código de Conducta de Adultos de la Asociación de Scouts del Perú*</b>, así como comprometerme a cumplirlo y velar por su cumplimiento.
      </p>

      <p class="declaration">
        <span class="declaration-num">3.</span> Declaro haber aprobado el <b>SfH1: Aprendizajes Fundamentales de Safe from Harm 1</b>, así como comprometerme a cumplirlo y velar por su cumplimiento.
      </p>

      <p class="declaration">
        <span class="declaration-num">4.</span> Autorizo se me asigne una <b>cuenta institucional</b> (en caso de no tenerla aun) y me comprometo al cumplimiento de las Reglas de Uso de las Cuentas Office 365*.
      </p>

      <p class="section-title">Asimismo:</p>

      <p class="declaration">Declaro bajo juramento No tener Antecedentes Policiales;</p>
      <p class="declaration">Declaro bajo juramento No tener Antecedentes Judiciales;</p>
      <p class="declaration">Declaro bajo juramento No tener Antecedentes Penales.</p>

      <p class="declaration" style="margin-top: 15px;">En caso de contar con algún antecedente policial, judicial o penal, explique las circunstancias y precise número de expediente:</p>
      <div class="box">
        ${dirigente.detalle_antecedentes || ''}
      </div>

      <p class="declaration">
        Autorizo a la Asociación de Scouts del Perú (ASP) el uso de imágenes fotográficas o videos en los que aparezco, en medios de comunicación físicos y virtuales, conforme a lo señalado en las leyes de nuestro país, con la finalidad de difundir las actividades y eventos scout que realizan, sin recibir ningún tipo de retribución o contraprestación por ello.
      </p>

      <p class="declaration" style="margin-top: 15px;"><b>Plan de membresía:</b> ${membresiaLabel}</p>

      <p class="footer">* Publicado en la página web de la Asociación de Scouts del Perú.</p>

      <!-- PÁGINA 3 -->
      <div style="page-break-before: always;"></div>
      
      <table class="header-table">
        <tr>
          <td class="header-left">
            Scouts del Perú<br><span style="font-size: 8pt;">Jóvenes con Futuro</span>
          </td>
          <td class="header-center">
            <span class="header-title">FORMATO DE REGISTRO INSTITUCIONAL<br>PARA ADULTOS VOLUNTARIOS</span>
          </td>
          <td class="header-right">
            Código: DNGI-02<br>
            Fecha: ${fechaActual}<br>
            Versión: 2.1<br>
            Páginas: Página 3 de 3
          </td>
        </tr>
      </table>

      <p class="declaration" style="margin-top: 20px;">
        Con este documento, declaro bajo juramento que la información contenida en este <b>FORMATO DE REGISTRO INSTITUCIONAL</b> y la documentación adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará bajo la responsabilidad de quien declara.
      </p>

      <p class="section-title">Anexo:</p>
      <p class="declaration">• Copia del documento de identidad por ambas caras.</p>
      <p class="declaration">• Certificado curso SFH1 para Adultos Voluntarios.</p>

      <div class="firma-section">
        <div class="firma-box">
          <div class="firma-line"></div>
          <p style="font-size: 8pt;">FIRMA (igual que en su documento de identidad)</p>
        </div>
        <div class="huella-box">
          <div class="huella">Huella Digital</div>
        </div>
      </div>

      <p class="footer">* Publicado en la página web de la Asociación de Scouts del Perú.</p>

    </body>
    </html>
  `;

  // Convertir HTML a Blob Word
  const blob = new Blob(
    ['\ufeff', html],
    { type: 'application/msword' }
  );

  return blob;
}

// ============================================================================
// FUNCIÓN PARA DESCARGAR WORD
// ============================================================================

export async function descargarWordDirigente(dirigente: Dirigente) {
  try {
    const blob = await generarWordDirigente(dirigente);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `DNGI02_${dirigente.persona.apellidos}_${dirigente.persona.nombres}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error al generar Word:', error);
    return { success: false, error: (error as Error).message };
  }
}
