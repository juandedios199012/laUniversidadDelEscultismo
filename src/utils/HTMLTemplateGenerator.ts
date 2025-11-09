// ================================================================
// 🎨 Generador HTML/CSS para DNGI-03 con Diseño Perfecto
// ================================================================

export interface HTMLTemplateData {
  apellidos: string;
  nombres: string;
  sexo?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  region: string;
  localidad: string;
  numeral: string;
  unidad: string;
  direccion?: string;
  codigo_postal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  correo_institucional?: string;
  correo_personal?: string;
  celular?: string;
  telefono?: string;
  religion?: string;
  centro_estudios?: string;
  ano_estudios?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carne_conadis?: string;
  especificar_discapacidad?: string;
  fecha_actual: string;
}

export class HTMLTemplateGenerator {
  
  /**
   * Genera HTML completo del DNGI-03 con CSS embebido
   */
  static generateHTML(data: HTMLTemplateData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNGI-03 - ${data.nombres} ${data.apellidos}</title>
    <style>
        ${this.getCSS()}
    </style>
</head>
<body>
    <div class="document">
        ${this.getHeader()}
        ${this.getInstructions()}
        ${this.getScoutDataSection(data)}
        ${this.getParentsSection()}
        ${this.getDeclarationSection()}
        ${this.getSignatureSection()}
        ${this.getFooter()}
    </div>
</body>
</html>`;
  }

  /**
   * CSS para diseño profesional que coincide con DNGI-03
   */
  private static getCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
        }
        
        .document {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            margin-bottom: 15px;
        }
        
        .header-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: middle;
        }
        
        .header-logo {
            width: 20%;
            text-align: center;
            font-style: italic;
            font-size: 10px;
        }
        
        .header-title {
            width: 60%;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }
        
        .header-info {
            width: 20%;
            font-size: 10px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 12px;
            margin: 15px 0 10px 0;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            margin-bottom: 15px;
            table-layout: fixed; /* Fuerza el ancho de las columnas */
        }
        
        .data-table td, .data-table th {
            border: 1px solid #000;
            padding: 4px;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .header-cell {
            background-color: #808080;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 9px;
            padding: 3px;
            vertical-align: middle;
        }
        
        .data-cell {
            min-height: 20px;
            background-color: white;
            font-size: 10px;
            padding: 3px;
        }
        
        .filled-cell {
            font-weight: bold;
            text-align: center;
            background-color: white;
            font-size: 10px;
        }
        
        .instructions {
            text-align: justify;
            margin-bottom: 15px;
            font-size: 11px;
        }
        
        .declaration {
            text-align: justify;
            margin-bottom: 10px;
            font-size: 10px;
        }
        
        .signature-section {
            margin-top: 30px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin: 20px auto;
            text-align: center;
        }
        
        .footer {
            text-align: center;
            font-style: italic;
            font-size: 9px;
            margin-top: 20px;
        }
        
        @media print {
            .document {
                margin: 0;
                box-shadow: none;
            }
        }
    `;
  }

  /**
   * Encabezado del documento
   */
  private static getHeader(): string {
    return `
        <table class="header-table">
            <tr>
                <td class="header-logo">
                    [LOGOTIPO SCOUT]
                </td>
                <td class="header-title">
                    FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES
                </td>
                <td class="header-info">
                    Código: DNGI-03<br>
                    Fecha:<br>
                    Versión: 2.1<br>
                    Páginas: Página 4 de 4
                </td>
            </tr>
        </table>
    `;
  }

  /**
   * Instrucciones para padres
   */
  private static getInstructions(): string {
    return `
        <div class="instructions">
            Estimado Padre de Familia, apoderado o tutor, es necesario que todos los datos estén llenos y con información exacta. 
            Una vez completo, deberá hacérselo llegar a su Jefe de Grupo junto con su documento de identidad (DNI o Carné de Extranjería) 
            y del de su menor hijo o apoderado para el proceso de inscripción.
        </div>
    `;
  }

  /**
   * Sección de datos del scout con tabla perfecta que coincide con la imagen
   */
  private static getScoutDataSection(data: HTMLTemplateData): string {
    return `
        <div class="section-title">Datos del Miembro Juvenil (menor de edad)</div>
        
        <table class="data-table">
            <!-- Fila 1: Apellidos y Nombres (50% cada uno) -->
            <tr>
                <td class="header-cell" style="width: 50%;">APELLIDOS COMPLETOS</td>
                <td class="header-cell" style="width: 50%;">NOMBRES COMPLETOS</td>
            </tr>
            <tr>
                <td class="data-cell">${data.apellidos}</td>
                <td class="data-cell">${data.nombres}</td>
            </tr>
            
            <!-- Fila 2: Sexo, Fecha, Tipo Doc, Número Doc (25% cada uno) -->
            <tr>
                <td class="header-cell" style="width: 25%;">SEXO</td>
                <td class="header-cell" style="width: 25%;">FECHA DE NACIMIENTO</td>
                <td class="header-cell" style="width: 25%;">TIPO DE<br>DOCUMENTO</td>
                <td class="header-cell" style="width: 25%;">NÚMERO DE<br>DOCUMENTO</td>
            </tr>
            <tr>
                <td class="data-cell">${data.sexo || ''}</td>
                <td class="data-cell">${data.fecha_nacimiento || ''}</td>
                <td class="data-cell">${data.tipo_documento || ''}</td>
                <td class="data-cell">${data.numero_documento || ''}</td>
            </tr>
            
            <!-- Fila 3: Región, Localidad, Numeral, Unidad (25% cada uno) -->
            <tr>
                <td class="header-cell">REGIÓN</td>
                <td class="header-cell">LOCALIDAD</td>
                <td class="header-cell">NUMERAL</td>
                <td class="header-cell">UNIDAD</td>
            </tr>
            <tr>
                <td class="filled-cell">${data.region}</td>
                <td class="filled-cell">${data.localidad}</td>
                <td class="filled-cell">${data.numeral}</td>
                <td class="filled-cell">${data.unidad}</td>
            </tr>
            
            <!-- Fila 4: Dirección (75%) + Código Postal (25%) -->
            <tr>
                <td class="header-cell" style="width: 75%;" colspan="3">DIRECCIÓN</td>
                <td class="header-cell" style="width: 25%;">CÓDIGO<br>POSTAL</td>
            </tr>
            <tr>
                <td class="data-cell" colspan="3">${data.direccion || ''}</td>
                <td class="data-cell">${data.codigo_postal || ''}</td>
            </tr>
            
            <!-- Fila 5: Departamento (33%) + Provincia (33%) + Distrito (34%) -->
            <tr>
                <td class="header-cell" style="width: 33%;">DEPARTAMENTO</td>
                <td class="header-cell" style="width: 33%;">PROVINCIA</td>
                <td class="header-cell" style="width: 34%;" colspan="2">DISTRITO</td>
            </tr>
            <tr>
                <td class="data-cell">${data.departamento || ''}</td>
                <td class="data-cell">${data.provincia || ''}</td>
                <td class="data-cell" colspan="2">${data.distrito || ''}</td>
            </tr>
            
            <!-- Fila 6: Correo Institucional (50%) + Correo Personal (50%) -->
            <tr>
                <td class="header-cell" style="width: 50%;" colspan="2">CORREO ELECTRONICO INSTITUCIONAL</td>
                <td class="header-cell" style="width: 50%;" colspan="2">CORREO ELECTRÓNICO<br>PERSONAL</td>
            </tr>
            <tr>
                <td class="data-cell" colspan="2">${data.correo_institucional || ''}</td>
                <td class="data-cell" colspan="2">${data.correo_personal || ''}</td>
            </tr>
            
            <!-- Fila 7: Celular (33%) + Teléfono (33%) + Religión (34%) -->
            <tr>
                <td class="header-cell" style="width: 33%;">CELULAR</td>
                <td class="header-cell" style="width: 33%;">TELEFONO DEL DOMICILIO</td>
                <td class="header-cell" style="width: 34%;" colspan="2">RELIGIÓN O CREDO</td>
            </tr>
            <tr>
                <td class="data-cell">${data.celular || ''}</td>
                <td class="data-cell">${data.telefono || ''}</td>
                <td class="data-cell" colspan="2">${data.religion || ''}</td>
            </tr>
            
            <!-- Fila 8: Centro de Estudios (75%) + Año de Estudios (25%) -->
            <tr>
                <td class="header-cell" style="width: 75%;" colspan="3">CENTRO DE ESTUDIOS</td>
                <td class="header-cell" style="width: 25%;">AÑO DE<br>ESTUDIOS</td>
            </tr>
            <tr>
                <td class="data-cell" colspan="3">${data.centro_estudios || ''}</td>
                <td class="data-cell">${data.ano_estudios || ''}</td>
            </tr>
            
            <!-- Fila 9: Información médica (5 columnas de 20% cada una) -->
            <tr>
                <td class="header-cell" style="width: 20%;">GRUPO SANGUÍNEO</td>
                <td class="header-cell" style="width: 20%;">FACTOR SANGUÍNEO</td>
                <td class="header-cell" style="width: 20%;">SEGURO<br>MÉDICO</td>
                <td class="header-cell" style="width: 20%;">TIPO DE<br>DISCAPACIDAD</td>
                <td class="header-cell" style="width: 20%;">CARNÉ<br>CONADIS</td>
            </tr>
            <tr>
                <td class="data-cell">${data.grupo_sanguineo || ''}</td>
                <td class="data-cell">${data.factor_sanguineo || ''}</td>
                <td class="data-cell">${data.seguro_medico || ''}</td>
                <td class="data-cell">${data.tipo_discapacidad || ''}</td>
                <td class="data-cell">${data.carne_conadis || ''}</td>
            </tr>
        </table>
        
        <!-- Campo adicional para especificar discapacidad -->
        <table class="data-table" style="margin-top: 5px;">
            <tr>
                <td class="header-cell">SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO</td>
            </tr>
            <tr>
                <td class="data-cell" style="height: 40px;">${data.especificar_discapacidad || ''}</td>
            </tr>
        </table>
    `;
  }

  /**
   * Sección de padres (placeholder)
   */
  private static getParentsSection(): string {
    return `
        <div class="section-title">Datos de los Padres de Familia (Tutores o Apoderados)</div>
        <!-- Tablas de padres serían similares a la del scout -->
    `;
  }

  /**
   * Sección de declaración
   */
  private static getDeclarationSection(): string {
    return `
        <div class="declaration">
            <p>Yo, _________________________ como adulto apoderado (padre, madre o tutor)...</p>
            <!-- Resto del texto legal -->
        </div>
    `;
  }

  /**
   * Sección de firma
   */
  private static getSignatureSection(): string {
    return `
        <div class="signature-section">
            <p>Fecha: _________________________</p>
            <div class="signature-line"></div>
            <p style="text-align: center; font-weight: bold;">FIRMA (igual que en su documento de identidad)</p>
        </div>
    `;
  }

  /**
   * Pie de página
   */
  private static getFooter(): string {
    return `
        <div class="footer">
            * Publicado en la página web de la Asociación de Scouts del Perú.
        </div>
    `;
  }

  /**
   * Convierte datos del scout al formato HTML
   */
  static convertScoutToHTMLData(scout: any): HTMLTemplateData {
    return {
      apellidos: scout.apellidos || '',
      nombres: scout.nombres || '',
      sexo: scout.sexo || '',
      fecha_nacimiento: scout.fecha_nacimiento || '',
      tipo_documento: scout.tipo_documento || '',
      numero_documento: scout.numero_documento || '',
      region: 'XVIII',
      localidad: 'LIMA',
      numeral: '12',
      unidad: 'TROPA',
      direccion: scout.direccion || '',
      codigo_postal: scout.codigo_postal || '',
      departamento: scout.departamento || '',
      provincia: scout.provincia || '',
      distrito: scout.distrito || '',
      correo_institucional: scout.correo_institucional || '',
      correo_personal: scout.correo || '',
      celular: scout.celular || '',
      telefono: scout.telefono || '',
      religion: scout.religion || '',
      centro_estudios: scout.centro_estudio || '',
      ano_estudios: scout.ano_estudios || '',
      grupo_sanguineo: scout.grupo_sanguineo || '',
      factor_sanguineo: scout.factor_sanguineo || '',
      seguro_medico: scout.seguro_medico || '',
      tipo_discapacidad: scout.tipo_discapacidad || '',
      carne_conadis: scout.carne_conadis || '',
      especificar_discapacidad: scout.especificar_discapacidad || '',
      fecha_actual: new Date().toLocaleDateString('es-PE'),
    };
  }
}

export default HTMLTemplateGenerator;