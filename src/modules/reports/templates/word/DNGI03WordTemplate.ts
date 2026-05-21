import {
	AlignmentType,
	BorderStyle,
	Document,
	Footer,
	Header,
	HeightRule,
	HorizontalPositionRelativeFrom,
	ImageRun,
	Paragraph,
	Packer,
	ShadingType,
	Table,
	TableCell,
	TableLayoutType,
	TableRow,
	TextRun,
	VerticalPositionRelativeFrom,
	WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { fondoAnualBase64 } from '../../../../assets/images/fondoAnualBase64';
import { ScoutReportData, FamiliarReportData } from '../../types/reportTypes';
import { getTipoDocumentoLabel } from '../../../../data/constants';

const FONT_FAMILY = 'Calibri';
const SIZE_11PT = 22;
const SIZE_10PT = 20;
const HEADER_BG = '808080';
const BORDER_COLOR = '000000';
const WATERMARK_OFFSET_X = 0;
const WATERMARK_OFFSET_Y = 0;

function formatearFecha(fecha: string | null | undefined): string {
	if (!fecha) return '';
	if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return fecha;
	if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
		const [year, month, day] = fecha.split('T')[0].split('-');
		return `${day}-${month}-${year}`;
	}
	return fecha;
}

function base64ToUint8Array(base64: string): Uint8Array {
	const b64 = base64.replace(/^data:image\/\w+;base64,/, '');
	const binaryString = atob(b64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

function detectImageType(base64: string): 'png' | 'jpg' | 'gif' | 'bmp' {
	const normalized = (base64 || '').toLowerCase();
	if (normalized.startsWith('data:image/jpeg') || normalized.startsWith('data:image/jpg')) return 'jpg';
	if (normalized.startsWith('data:image/gif')) return 'gif';
	if (normalized.startsWith('data:image/bmp')) return 'bmp';
	return 'png';
}

function text(value: string, options?: { bold?: boolean; size?: number; italics?: boolean; color?: string }): TextRun {
	return new TextRun({
		text: value,
		font: FONT_FAMILY,
		size: options?.size ?? SIZE_11PT,
		bold: options?.bold ?? false,
		italics: options?.italics ?? false,
		color: options?.color ?? '000000',
	});
}

function noBorderCell(children: Paragraph[], widthPercentage: number): TableCell {
	return new TableCell({
		children,
		width: { size: widthPercentage, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.NONE, size: 0, color: BORDER_COLOR },
			bottom: { style: BorderStyle.NONE, size: 0, color: BORDER_COLOR },
			left: { style: BorderStyle.NONE, size: 0, color: BORDER_COLOR },
			right: { style: BorderStyle.NONE, size: 0, color: BORDER_COLOR },
		},
	});
}

function headerCell(content: string, span = 1): TableCell {
	return new TableCell({
		children: [
			new Paragraph({
				alignment: AlignmentType.CENTER,
				children: [text(content, { bold: true, size: SIZE_10PT, color: 'FFFFFF' })],
			}),
		],
		columnSpan: span,
		width: { size: span, type: WidthType.PERCENTAGE },
		shading: { type: ShadingType.SOLID, fill: HEADER_BG, color: HEADER_BG },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			bottom: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			left: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			right: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
		},
		margins: { top: 50, bottom: 50, left: 50, right: 50 },
	});
}

function dataCell(content: string, span = 1, heightTwips?: number): TableCell {
	return new TableCell({
		children: [
			new Paragraph({
				children: [text(content || '', { size: SIZE_11PT })],
				alignment: AlignmentType.LEFT,
			}),
		],
		columnSpan: span,
		width: { size: span, type: WidthType.PERCENTAGE },
		borders: {
			top: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			bottom: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			left: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
			right: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
		},
		margins: { top: 50, bottom: 50, left: 50, right: 50 },
		...(heightTwips ? { height: { value: heightTwips, rule: HeightRule.EXACT } } : {}),
	});
}

function watermarkHeader(): Header {
	const imageData = base64ToUint8Array(fondoAnualBase64);
	const imageType = detectImageType(fondoAnualBase64);
	return new Header({
		children: [
			new Paragraph({
				children: [
					new ImageRun({
						data: imageData,
						type: imageType,
						transformation: { width: 794, height: 1123 },
						floating: {
							horizontalPosition: {
								relative: HorizontalPositionRelativeFrom.PAGE,
								offset: WATERMARK_OFFSET_X,
							},
							verticalPosition: {
								relative: VerticalPositionRelativeFrom.PAGE,
								offset: WATERMARK_OFFSET_Y,
							},
							allowOverlap: true,
							lockAnchor: false,
							behindDocument: true,
						},
					}),
				],
			}),
		],
	});
}

function pageFooter(): Footer {
	return new Footer({
		children: [
			new Paragraph({ children: [] }),
		],
	});
}

function createTable(rows: TableRow[]): Table {
	return new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		columnWidths: new Array(100).fill(50),
		layout: TableLayoutType.FIXED,
		rows,
	});
}

const sectionLayout = {
	page: {
		margin: {
			top: 600,
			right: 600,
			bottom: 600,
			left: 880,
			header: 0,
			footer: 0,
			gutter: 0,
		},
	},
} as const;

function institutionalHeader(includeMainTitle = false): Paragraph[] {
	const paragraphs: Paragraph[] = [
		new Paragraph({ children: [text('ASOCIACIÓN DE SCOUTS DEL PERÚ', { bold: true, size: SIZE_10PT, color: '666666' })], spacing: { after: 25 } }),
		new Paragraph({ children: [text('JEFATURA SCOUT NACIONAL', { bold: true, size: SIZE_11PT, color: '666666' })], spacing: { after: 25 } }),
		new Paragraph({ children: [text('DIRECCIÓN NACIONAL DE GESTIÓN INSTITUCIONAL', { bold: true, size: SIZE_11PT, color: '666666' })], spacing: { after: includeMainTitle ? 110 : 120 } }),
	];

	if (includeMainTitle) {
		paragraphs.push(
			new Paragraph({ children: [text('FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES', { bold: true, size: SIZE_11PT, color: '666666' })], alignment: AlignmentType.LEFT, spacing: { after: 30 } }),
			new Paragraph({ children: [text('MENORES DE EDAD - 2026', { bold: true, size: SIZE_11PT, color: '666666' })], alignment: AlignmentType.LEFT, spacing: { after: 170 } }),
		);
	}

	return paragraphs;
}

function scoutMainTable(scout: ScoutReportData): Table {
	return createTable([
		new TableRow({ children: [headerCell('APELLIDOS COMPLETOS', 50), headerCell('NOMBRES COMPLETOS', 50)] }),
		new TableRow({ children: [dataCell(scout.apellido || '', 50), dataCell(scout.nombre || '', 50)] }),
		new TableRow({ children: [headerCell('SEXO', 15), headerCell('FECHA DE NACIMIENTO', 25), headerCell('TIPO DE DOCUMENTO', 30), headerCell('NÚMERO DE DOCUMENTO', 30)] }),
		new TableRow({ children: [dataCell(scout.sexo || '', 15), dataCell(formatearFecha(scout.fechaNacimiento), 25), dataCell(getTipoDocumentoLabel(scout.tipoDocumento), 30), dataCell(scout.numeroDocumento || scout.numeroRegistro || '', 30)] }),
		new TableRow({ children: [headerCell('REGIÓN', 20), headerCell('LOCALIDAD', 35), headerCell('NUMERAL', 20), headerCell('UNIDAD', 25)] }),
		new TableRow({ children: [dataCell('XVIII', 20), dataCell('LIMA', 35), dataCell('12', 20), dataCell((scout.rama || 'TROPA').toUpperCase(), 25)] }),
		new TableRow({ children: [headerCell('DIRECCIÓN', 85), headerCell('CÓDIGO POSTAL', 15)] }),
		new TableRow({ children: [dataCell(scout.direccion || '', 85), dataCell(scout.codigoPostal || '', 15)] }),
		new TableRow({ children: [headerCell('DEPARTAMENTO', 33), headerCell('PROVINCIA', 34), headerCell('DISTRITO', 33)] }),
		new TableRow({ children: [dataCell(scout.departamento || '', 33), dataCell(scout.provincia || '', 34), dataCell(scout.distrito || '', 33)] }),
		new TableRow({ children: [headerCell('CORREO ELECTRÓNICO INSTITUCIONAL', 50), headerCell('CORREO ELECTRÓNICO PERSONAL', 50)] }),
		new TableRow({ children: [dataCell(scout.correoInstitucional || '', 50), dataCell(scout.email || '', 50)] }),
		new TableRow({ children: [headerCell('CELULAR', 33), headerCell('TELÉFONO DEL DOMICILIO', 34), headerCell('RELIGIÓN O CREDO', 33)] }),
		new TableRow({ children: [dataCell(scout.celular || '', 33), dataCell(scout.telefono || '', 34), dataCell(scout.religion || '', 33)] }),
		new TableRow({ children: [headerCell('CENTRO DE ESTUDIOS', 70), headerCell('AÑO DE ESTUDIOS', 30)] }),
		new TableRow({ children: [dataCell(scout.centroEstudio || '', 70), dataCell(scout.anioEstudios || '', 30)] }),
		new TableRow({ children: [headerCell('GRUPO SANGUÍNEO', 18), headerCell('FACTOR SANGUÍNEO', 18), headerCell('SEGURO MÉDICO', 24), headerCell('TIPO DE DISCAPACIDAD', 20), headerCell('CARNÉ CONADIS', 20)] }),
		new TableRow({ children: [dataCell(scout.grupoSanguineo || '', 18), dataCell(scout.factorSanguineo || '', 18), dataCell(scout.seguroMedico || '', 24), dataCell(scout.tipoDiscapacidad || '', 20), dataCell(scout.carnetConadis || '', 20)] }),
		new TableRow({ children: [headerCell('SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO', 100)] }),
		new TableRow({ children: [dataCell(scout.descripcionDiscapacidad || '', 100, 900)] }),
	]);
}

function familiarTable(scout: ScoutReportData, familiar: FamiliarReportData): Table {
	const tienePropiaDireccion = !!(familiar.direccion || familiar.departamento || familiar.provincia || familiar.distrito);
	const direccionMostrar = tienePropiaDireccion ? familiar.direccion : scout.direccion;
	const departamentoMostrar = tienePropiaDireccion ? familiar.departamento : scout.departamento;
	const provinciaMostrar = tienePropiaDireccion ? familiar.provincia : scout.provincia;
	const distritoMostrar = tienePropiaDireccion ? familiar.distrito : scout.distrito;

	return createTable([
		new TableRow({ children: [headerCell('APELLIDOS COMPLETOS', 50), headerCell('NOMBRES COMPLETOS', 50)] }),
		new TableRow({ children: [dataCell(familiar.apellidos || '', 50), dataCell(familiar.nombres || '', 50)] }),
		new TableRow({ children: [headerCell('SEXO', 25), headerCell('TIPO DE DOCUMENTO', 25), headerCell('NÚMERO DE DOCUMENTO', 25), headerCell('PARENTESCO', 25)] }),
		new TableRow({ children: [dataCell(familiar.sexo || '', 25), dataCell(getTipoDocumentoLabel(familiar.tipoDocumento), 25), dataCell(familiar.numeroDocumento || '', 25), dataCell(familiar.parentesco || '', 25)] }),
		new TableRow({ children: [headerCell('CORREO ELECTRÓNICO 1', 50), headerCell('CORREO ELECTRÓNICO 2', 50)] }),
		new TableRow({ children: [dataCell(familiar.correo || '', 50), dataCell(familiar.correoSecundario || '', 50)] }),
		new TableRow({ children: [headerCell('DIRECCIÓN', 100)] }),
		new TableRow({ children: [dataCell(direccionMostrar || '', 100)] }),
		new TableRow({ children: [headerCell('DEPARTAMENTO', 33), headerCell('PROVINCIA', 34), headerCell('DISTRITO', 33)] }),
		new TableRow({ children: [dataCell(departamentoMostrar || '', 33), dataCell(provinciaMostrar || '', 34), dataCell(distritoMostrar || '', 33)] }),
		new TableRow({ children: [headerCell('PROFESIÓN U OCUPACIÓN', 33), headerCell('CENTRO LABORAL', 33), headerCell('CARGO', 34)] }),
		new TableRow({ children: [dataCell(familiar.profesion || '', 33), dataCell(familiar.centroLaboral || '', 33), dataCell(familiar.cargo || '', 34)] }),
		new TableRow({ children: [headerCell('CELULAR 1', 33), headerCell('CELULAR 2', 34), headerCell('TELÉFONO DEL DOMICILIO', 33)] }),
		new TableRow({ children: [dataCell(familiar.celular || '', 33), dataCell(familiar.celularSecundario || '', 34), dataCell(familiar.telefono || '', 33)] }),
	]);
}

function declarationParagraphs(apoderadoPrincipal?: FamiliarReportData) {
	const nombreApoderado = apoderadoPrincipal ? `${apoderadoPrincipal.nombres || ''} ${apoderadoPrincipal.apellidos || ''}`.trim() || '______________________' : '______________________';
	const dniApoderado = apoderadoPrincipal?.numeroDocumento || '___________';

	return [
		new Paragraph({
			children: [
				text('Yo, '),
				text(nombreApoderado, { bold: true }),
				text(' como adulto apoderado (padre, madre o tutor) y que suscribe y declara el presente documento, identificado con '),
				text(`DNI N° ${dniApoderado}`, { bold: true }),
				text(', comprendo que el movimiento Scout contribuye a la educación de niños y jóvenes para que participen en un mundo mejor, donde las personas se desarrollen plenamente y jueguen un papel constructivo en la sociedad, también declaro que he leído detenidamente cuales son los derechos y deberes de los padres de Familia de acuerdo a los artículos 181, 182 y 183 del '),
				text('REGLAMENTO DE LA ASOCIACIÓN DE SCOUTS DEL PERÚ', { bold: true }),
				text(', por lo cual me comprometo a cumplir todos mis deberes para con el '),
				text('GRUPO SCOUT', { bold: true }),
				text(' y la '),
				text('ASOCIACIÓN DE SCOUTS DEL PERÚ', { bold: true }),
				text(', a los que estoy brindando la confianza y autorización para que mi menor hijo (a) participe en sus actividades. Me comprometo también a participar en todas las reuniones, asambleas y/o actividades que se programe en su beneficio.'),
			],
			alignment: AlignmentType.JUSTIFIED,
			spacing: { after: 200 },
		}),
		new Paragraph({ children: [text('Asimismo:', { bold: true })], spacing: { before: 120, after: 120 } }),
		new Paragraph({ children: [text('1. Declaro tener conocimiento de la '), text('Política para la Protección de los Miembros Juveniles de la Asociación de Scouts del Perú*', { bold: true }), text(', así como comprometerme a velar por su cumplimiento.')], bullet: { level: 0 } }),
	];
}

function declarationRemainingParagraphs() {
	return [
		new Paragraph({ children: [text('2. Declaro tener conocimiento del '), text('Código de Conducta de Adultos de la Asociación de Scouts del Perú*', { bold: true }), text(', así como comprometerme a velar por su cumplimiento.')], bullet: { level: 0 } }),
		new Paragraph({ children: [text('3. Declaro tener conocimiento de la '), text('Política Mundial de A Salvo del Peligro*', { bold: true }), text(' de la Organización Mundial del Movimiento Scout, así como comprometerme a velar por su cumplimiento.')], bullet: { level: 0 } }),
		new Paragraph({ children: [text('4. Declaro tener conocimiento de las '), text('Normas para Actividades Scouts*', { bold: true }), text(' de la Asociación de Scouts del Perú, así como comprometerme a velar por su cumplimiento.')], bullet: { level: 0 } }),
		new Paragraph({ children: [text('5. Declaro tener conocimiento de las '), text('Normas para Actividades Scouts*', { bold: true }), text(' de la Asociación de Scouts del Perú, así como comprometerme a velar por su cumplimiento.')], bullet: { level: 0 } }),
		new Paragraph({ children: [text('6. Autorizo asignar a mi menor hijo (a) una '), text('cuenta institucional Office 365', { bold: true }), text(' (en caso de no tenerla aún) y me comprometo al cumplimiento de las Reglas de Uso de las Cuentas Office 365*.')], bullet: { level: 0 } }),
		new Paragraph({ children: [text('Autorizo a la Asociación de Scouts del Perú (ASP) el uso de imágenes fotográficas o videos en los que aparece mi menor, en medios de comunicación físicos y virtuales, conforme a lo señalado en las leyes de nuestro país, con la finalidad de difundir las actividades y eventos scout que realizan, sin recibir ningún tipo de retribución o contraprestación por ello.')], alignment: AlignmentType.JUSTIFIED, spacing: { before: 160 } }),
	];
}

function signatureTable(fechaRegistro?: string): Table {
	return new Table({
		width: { size: 82, type: WidthType.PERCENTAGE },
		alignment: AlignmentType.LEFT,
		rows: [
			new TableRow({
				height: { value: 2800, rule: HeightRule.EXACT },
				children: [
					noBorderCell([
						new Paragraph({ children: [], spacing: { after: 520 } }),
						new Paragraph({ children: [text('____________________________________', { size: 22 })], spacing: { after: 10 } }),
						new Paragraph({ children: [text('FIRMA (igual que en su documento de identidad)', { size: 22 })], spacing: { before: 120, after: 0 } }),
						new Paragraph({ children: [] }),
						new Paragraph({ children: [] }),
						new Paragraph({ children: [] }),
						new Paragraph({ children: [text(`Fecha: ${fechaRegistro || '__________________'}`, { size: 22 })] }),
					], 74),
					new TableCell({
						children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text('Huella Digital', { size: 22 })], spacing: { before: 980, after: 80 } })],
						width: { size: 26, type: WidthType.PERCENTAGE },
						verticalAlign: 'bottom',
						borders: {
							top: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
							bottom: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
							left: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
							right: { style: BorderStyle.SINGLE, size: 8, color: BORDER_COLOR },
						},
						margins: { top: 100, bottom: 140, left: 100, right: 100 },
					}),
				],
			}),
		],
	});
}

function annexTable(): Table {
	return new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [
			new TableRow({
				children: [
					noBorderCell([new Paragraph({ children: [text('Anexo:', { bold: true, size: SIZE_11PT })] })], 18),
					noBorderCell([new Paragraph({ children: [text('Copia del documento de identidad del menor', { size: SIZE_11PT })] })], 82),
				],
			}),
			new TableRow({
				children: [
					noBorderCell([new Paragraph({ children: [] })], 18),
					noBorderCell([new Paragraph({ children: [text('Copia de documento de identidad del declarante para validar la firma', { size: SIZE_11PT })] })], 82),
				],
			}),
			new TableRow({
				children: [
					noBorderCell([new Paragraph({ children: [] })], 18),
					noBorderCell([new Paragraph({ children: [text('En caso de ser tutor: Copia del documento que lo acredite como tal', { size: SIZE_11PT })] })], 82),
				],
			}),
		],
	});
}

function identityImagesParagraphs(
	scout: ScoutReportData,
	additionalData: { documentoIdentidadAnverso?: string; documentoIdentidadReverso?: string }
): Paragraph[] {
	const paragraphs: Paragraph[] = [
		new Paragraph({ children: [text('Copia del Documento de Identidad del Menor', { bold: true, size: SIZE_11PT })], spacing: { after: 120 } }),
		new Paragraph({ children: [text(`A continuación se adjuntan las copias del documento de identidad de ${scout.nombre} ${scout.apellido}.`, { size: SIZE_11PT })], spacing: { after: 160 } }),
	];

	if (additionalData.documentoIdentidadAnverso) {
		const anversoType = detectImageType(additionalData.documentoIdentidadAnverso);
		paragraphs.push(
			new Paragraph({ children: [text('ANVERSO (Cara Frontal)', { bold: true, size: SIZE_10PT })], spacing: { after: 80 } }),
			new Paragraph({
				alignment: AlignmentType.CENTER,
				children: [new ImageRun({ data: base64ToUint8Array(additionalData.documentoIdentidadAnverso), type: anversoType, transformation: { width: 450, height: 250 } })],
				spacing: { after: 160 },
			}),
		);
	}

	if (additionalData.documentoIdentidadReverso) {
		const reversoType = detectImageType(additionalData.documentoIdentidadReverso);
		paragraphs.push(
			new Paragraph({ children: [text('REVERSO (Cara Posterior)', { bold: true, size: SIZE_10PT })], spacing: { after: 80 } }),
			new Paragraph({
				alignment: AlignmentType.CENTER,
				children: [new ImageRun({ data: base64ToUint8Array(additionalData.documentoIdentidadReverso), type: reversoType, transformation: { width: 450, height: 250 } })],
				spacing: { after: 160 },
			}),
		);
	}

	return paragraphs;
}

export function createDNGI03WordDocument(
	scout: ScoutReportData,
	additionalData?: Partial<ScoutReportData> & {
		padre?: any;
		madre?: any;
		tipoRegistro?: string;
		fechaRegistro?: string;
		documentoIdentidadAnverso?: string;
		documentoIdentidadReverso?: string;
	}
): Document {
	const apoderados = scout.familiares?.filter(f => f.esApoderado) || [];
	const primerApoderado = apoderados[0];
	const apoderadosAdicionales = apoderados.slice(1);

	const sections = [
		{
			properties: sectionLayout,
			headers: { default: watermarkHeader() },
			footers: { default: pageFooter() },
			children: [
				...institutionalHeader(true),
				new Paragraph({ children: [text('Estimado Padre de Familia, apoderado o tutor, es necesario que todos los datos estén llenos y con información exacta. Una vez completo, deberá hacérselo llegar a su Jefe de Grupo junto con su documento de identidad (DNI o Carné de Extranjería) y del de su menor hijo o apoderado para el proceso de inscripción.', { size: SIZE_11PT })], spacing: { after: 160 } }),
				new Paragraph({ children: [text('Datos del Miembro Juvenil (menor de edad)', { bold: true, size: SIZE_11PT })], spacing: { after: 100 } }),
				scoutMainTable(scout),
			],
		},
		{
			properties: sectionLayout,
			headers: { default: watermarkHeader() },
			footers: { default: pageFooter() },
			children: [
				...institutionalHeader(false),
				new Paragraph({ children: [text('Datos de los Padres de Familia (Tutores o Apoderados)', { bold: true, size: SIZE_11PT })], spacing: { after: 100 } }),
				...(primerApoderado ? [familiarTable(scout, primerApoderado)] : [new Paragraph({ children: [text('No hay apoderados registrados', { size: SIZE_11PT })], alignment: AlignmentType.CENTER })]),
				...declarationParagraphs(primerApoderado),
			],
		},
		...apoderadosAdicionales.map((apoderado) => ({
			properties: sectionLayout,
			headers: { default: watermarkHeader() },
			footers: { default: pageFooter() },
			children: [
				...institutionalHeader(false),
				new Paragraph({ children: [text('Datos de los Padres de Familia (Tutores o Apoderados)', { bold: true, size: SIZE_11PT })], spacing: { after: 100 } }),
				familiarTable(scout, apoderado),
			],
		})),
		{
			properties: sectionLayout,
			headers: { default: watermarkHeader() },
			footers: { default: pageFooter() },
			children: [
				...institutionalHeader(false),
				...declarationRemainingParagraphs(),
				new Paragraph({
					children: [
						text('Con la firma de este documento declaro bajo juramento que la información contenida en este '),
						text('FORMATO DE REGISTRO INSTITUCIONAL', { bold: true, size: SIZE_11PT }),
						text(' y la documentación adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará bajo la responsabilidad de quién declara y firma.', { size: SIZE_11PT }),
					],
					spacing: { after: 120 },
				}),
				annexTable(),
				new Paragraph({ children: [], spacing: { after: 120 } }),
				signatureTable(additionalData?.fechaRegistro),
			],
		},
		...((additionalData?.documentoIdentidadAnverso || additionalData?.documentoIdentidadReverso) ? [{
			properties: sectionLayout,
			headers: { default: watermarkHeader() },
			footers: { default: pageFooter() },
			children: identityImagesParagraphs(scout, {
				documentoIdentidadAnverso: additionalData?.documentoIdentidadAnverso,
				documentoIdentidadReverso: additionalData?.documentoIdentidadReverso,
			}),
		}] : []),
	];

	return new Document({ sections });
}

export async function downloadDNGI03Word(
	scout: ScoutReportData,
	additionalData?: Partial<ScoutReportData> & {
		padre?: any;
		madre?: any;
		tipoRegistro?: string;
		fechaRegistro?: string;
		documentoIdentidadAnverso?: string;
		documentoIdentidadReverso?: string;
	}
): Promise<void> {
	const doc = createDNGI03WordDocument(scout, additionalData);
	const blob = await Packer.toBlob(doc);
	const safeName = `${scout.apellido || 'Scout'}_${scout.nombre || ''}`.trim().replace(/\s+/g, '_');
	const filename = `DNGI03_${safeName || 'documento'}.docx`;
	saveAs(blob, filename);
}

export class DNGI03WordTemplate {
	static createDocument(
		scout: ScoutReportData,
		additionalData?: Partial<ScoutReportData> & {
			padre?: any;
			madre?: any;
			tipoRegistro?: string;
			fechaRegistro?: string;
			documentoIdentidadAnverso?: string;
			documentoIdentidadReverso?: string;
		}
	): Document {
		return createDNGI03WordDocument(scout, additionalData);
	}

	static async download(
		scout: ScoutReportData,
		additionalData?: Partial<ScoutReportData> & {
			padre?: any;
			madre?: any;
			tipoRegistro?: string;
			fechaRegistro?: string;
			documentoIdentidadAnverso?: string;
			documentoIdentidadReverso?: string;
		}
	): Promise<void> {
		return downloadDNGI03Word(scout, additionalData);
	}
}
