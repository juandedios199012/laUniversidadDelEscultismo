/**
 * Template Configuration Module
 * Follows Single Responsibility Principle (SRP) - Only handles template configuration
 * Follows Open/Closed Principle (OCP) - Extensible for new formats without modification
 */

export interface ITemplateConfig {
  font: FontConfig;
  margins: MarginConfig;
  table: TableConfig;
  colors: ColorConfig;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
}

export interface MarginConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
  unit: 'pt' | 'mm' | 'in';
}

export interface TableConfig {
  borderWidth: number;
  borderColor: string;
  cellPadding: number;
  layout: TableLayoutConfig;
}

export interface TableLayoutConfig {
  // Estructura específica para DNGI-03
  rows: RowConfig[];
}

export interface RowConfig {
  cells: CellConfig[];
  height?: number;
}

export interface CellConfig {
  width: number; // Porcentaje del ancho total
  colspan?: number;
  rowspan?: number;
  header: boolean;
  content: string;
  fieldKey?: string; // Para mapear datos del scout
}

export interface ColorConfig {
  headerBackground: string;
  headerText: string;
  cellBackground: string;
  cellText: string;
  borderColor: string;
}

/**
 * DNGI-03 Template Configuration
 * Configuración específica basada en los requerimientos del usuario
 */
export class DNGI03TemplateConfig implements ITemplateConfig {
  public readonly font: FontConfig = {
    family: 'Calibri',
    size: 10,
    weight: 'normal'
  };

  public readonly margins: MarginConfig = {
    top: 25.4, // 1 inch = 25.4mm
    bottom: 25.4,
    left: 25.4,
    right: 25.4,
    unit: 'mm'
  };

  public readonly colors: ColorConfig = {
    headerBackground: '#808080', // Gris
    headerText: '#FFFFFF',
    cellBackground: '#FFFFFF',
    cellText: '#000000',
    borderColor: '#000000'
  };

  public readonly table: TableConfig = {
    borderWidth: 1,
    borderColor: this.colors.borderColor,
    cellPadding: 4,
    layout: this.getTableLayout()
  };

  /**
   * Estructura de tabla específica para DNGI-03
   * Basada en los requerimientos:
   * - APELLIDOS COMPLETOS sobre SEXO + FECHA DE NACIMIENTO
   * - NOMBRES COMPLETOS sobre TIPO DE DOCUMENTO + NÚMERO DE DOCUMENTO
   */
  private getTableLayout(): TableLayoutConfig {
    return {
      rows: [
        // Fila 1: Apellidos y Nombres (cada uno sobre 2 columnas)
        {
          cells: [
            {
              width: 50,
              colspan: 2,
              header: true,
              content: 'APELLIDOS COMPLETOS',
              fieldKey: 'apellidos'
            },
            {
              width: 50,
              colspan: 2,
              header: true,
              content: 'NOMBRES COMPLETOS',
              fieldKey: 'nombres'
            }
          ]
        },
        // Fila 2: Datos de apellidos y nombres
        {
          cells: [
            {
              width: 50,
              colspan: 2,
              header: false,
              content: '',
              fieldKey: 'apellidos_data'
            },
            {
              width: 50,
              colspan: 2,
              header: false,
              content: '',
              fieldKey: 'nombres_data'
            }
          ]
        },
        // Fila 3: Headers de detalles (4 columnas)
        {
          cells: [
            {
              width: 25,
              header: true,
              content: 'SEXO',
              fieldKey: 'sexo'
            },
            {
              width: 25,
              header: true,
              content: 'FECHA DE NACIMIENTO',
              fieldKey: 'fecha_nacimiento'
            },
            {
              width: 25,
              header: true,
              content: 'TIPO DE\nDOCUMENTO',
              fieldKey: 'tipo_documento'
            },
            {
              width: 25,
              header: true,
              content: 'NÚMERO DE\nDOCUMENTO',
              fieldKey: 'numero_documento'
            }
          ]
        },
        // Fila 4: Datos de detalles
        {
          cells: [
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'sexo_data'
            },
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'fecha_nacimiento_data'
            },
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'tipo_documento_data'
            },
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'numero_documento_data'
            }
          ]
        },
        // Fila 5: Ubicación
        {
          cells: [
            {
              width: 25,
              header: true,
              content: 'REGIÓN',
              fieldKey: 'region'
            },
            {
              width: 25,
              header: true,
              content: 'LOCALIDAD',
              fieldKey: 'localidad'
            },
            {
              width: 25,
              header: true,
              content: 'NUMERAL',
              fieldKey: 'numeral'
            },
            {
              width: 25,
              header: true,
              content: 'UNIDAD',
              fieldKey: 'unidad'
            }
          ]
        },
        // Fila 6: Datos de ubicación
        {
          cells: [
            {
              width: 25,
              header: false,
              content: 'XVIII',
              fieldKey: 'region_data'
            },
            {
              width: 25,
              header: false,
              content: 'LIMA',
              fieldKey: 'localidad_data'
            },
            {
              width: 25,
              header: false,
              content: '12',
              fieldKey: 'numeral_data'
            },
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'unidad_data'
            }
          ]
        },
        // Fila 7: Dirección
        {
          cells: [
            {
              width: 75,
              colspan: 3,
              header: true,
              content: 'DIRECCIÓN',
              fieldKey: 'direccion'
            },
            {
              width: 25,
              header: true,
              content: 'CÓDIGO\nPOSTAL',
              fieldKey: 'codigo_postal'
            }
          ]
        },
        // Fila 8: Datos de dirección
        {
          cells: [
            {
              width: 75,
              colspan: 3,
              header: false,
              content: '',
              fieldKey: 'direccion_data'
            },
            {
              width: 25,
              header: false,
              content: '',
              fieldKey: 'codigo_postal_data'
            }
          ]
        },
        // Continuar con más filas según necesidad...
      ]
    };
  }
}

/**
 * Template Configuration Factory
 * Follows Factory Pattern for creating different template configurations
 */
export class TemplateConfigFactory {
  static createDNGI03Config(): ITemplateConfig {
    return new DNGI03TemplateConfig();
  }

  static createCustomConfig(config: Partial<ITemplateConfig>): ITemplateConfig {
    const defaultConfig = new DNGI03TemplateConfig();
    return {
      ...defaultConfig,
      ...config
    };
  }
}

/**
 * Configuration Validator
 * Follows Single Responsibility Principle
 */
export class TemplateConfigValidator {
  static validate(config: ITemplateConfig): boolean {
    if (!config.font || !config.margins || !config.table || !config.colors) {
      return false;
    }

    if (config.font.size <= 0) {
      return false;
    }

    if (config.margins.top < 0 || config.margins.bottom < 0 || 
        config.margins.left < 0 || config.margins.right < 0) {
      return false;
    }

    return true;
  }

  static validateRow(row: RowConfig): boolean {
    if (!row.cells || row.cells.length === 0) {
      return false;
    }

    const totalWidth = row.cells.reduce((sum, cell) => sum + cell.width, 0);
    return Math.abs(totalWidth - 100) < 0.01; // Permitir pequeñas diferencias de redondeo
  }
}