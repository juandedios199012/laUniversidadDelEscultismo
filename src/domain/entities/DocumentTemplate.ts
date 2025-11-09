// ================================================================
// 📄 Domain Entity: Document Template
// ================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  version: string;
  header: DocumentHeader;
  sections: DocumentSection[];
  footer?: DocumentFooter;
  metadata: TemplateMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogoConfig {
  url: string;
  alt: string;
  width: number;
  height: number;
  position: 'left' | 'center' | 'right';
}

export interface DocumentHeader {
  logo?: LogoConfig;
  title: string;
  subtitle?: string;
  organizationInfo?: OrganizationInfo;
  documentInfo?: {
    code?: string;
    date?: Date;
    version?: string;
    pages?: string;
  };
  isFixed: boolean;
}

export interface DocumentImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  position: 'left' | 'center' | 'right';
}

export interface OrganizationInfo {
  name: string;
  subtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  order: number;
  type: SectionType;
  layout: SectionLayout;
  fields: DocumentField[];
  isRequired: boolean;
  isRepeatable?: boolean;
}

export interface DocumentField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  dataSource: string;
  defaultValue?: string | number | boolean;
  format?: FieldFormat;
  validation?: FieldValidation;
  position: FieldPosition;
}

export interface DocumentFooter {
  text?: string;
  includeDate: boolean;
  includePageNumbers: boolean;
  pageNumberFormat?: string;
  signatures?: SignatureField[];
}

export interface SignatureField {
  label: string;
  type: 'text' | 'image' | 'digital';
  position: FieldPosition;
}

export interface TemplateMetadata {
  category: DocumentCategory;
  tags: string[];
  language: string;
  formatVersion: string;
  isActive: boolean;
  permissions: TemplatePermissions;
  documentCode?: string;
  institutionalStandard?: boolean;
  requiresDigitalSignature?: boolean;
  requiresFingerprint?: boolean;
}

// ================================================================
// 📋 Enums and Types
// ================================================================

export enum DocumentType {
  PERSONAL_DATA_FORMAT = 'PERSONAL_DATA_FORMAT',
  MEDICAL_FORM = 'MEDICAL_FORM',
  ACTIVITY_REPORT = 'ACTIVITY_REPORT',
  ATTENDANCE_RECORD = 'ATTENDANCE_RECORD',
  INVENTORY_FORM = 'INVENTORY_FORM',
  BUDGET_FORM = 'BUDGET_FORM',
  CUSTOM = 'CUSTOM',
  INSTITUTIONAL_REGISTRATION = 'INSTITUTIONAL_REGISTRATION',
  FAMILY_DATA_FORM = 'FAMILY_DATA_FORM'
}

export enum SectionType {
  PERSONAL_INFO = 'PERSONAL_INFO',
  CONTACT_INFO = 'CONTACT_INFO',
  FAMILY_INFO = 'FAMILY_INFO',
  MEDICAL_INFO = 'MEDICAL_INFO',
  EDUCATION_INFO = 'EDUCATION_INFO',
  SCOUT_HISTORY = 'SCOUT_HISTORY',
  EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
  ACTIVITY_DATA = 'ACTIVITY_DATA',
  INVENTORY_DATA = 'INVENTORY_DATA',
  BUDGET_DATA = 'BUDGET_DATA',
  SIGNATURES = 'SIGNATURES',
  LEGAL_DECLARATION = 'LEGAL_DECLARATION',
  CUSTOM = 'CUSTOM'
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TEXTAREA = 'TEXTAREA',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SIGNATURE = 'SIGNATURE',
  FINGERPRINT = 'FINGERPRINT',
  STATIC_TEXT = 'STATIC_TEXT',
  CALCULATED = 'CALCULATED'
}

export enum DocumentCategory {
  FORM = 'FORM',
  REPORT = 'REPORT',
  CERTIFICATE = 'CERTIFICATE',
  LETTER = 'LETTER',
  INSTITUTIONAL_FORM = 'INSTITUTIONAL_FORM',
  REGISTRATION = 'REGISTRATION',
  OTHER = 'OTHER'
}

export interface SectionLayout {
  columns: number;
  spacing: 'compact' | 'normal' | 'spacious' | 'wide';
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height?: number;
}

export interface FieldFormat {
  dateFormat?: string;
  numberFormat?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  maxLength?: number;
}

export interface FieldValidation {
  required: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface TemplatePermissions {
  canEdit: string[];
  canView: string[];
  canGenerate: string[];
  isPublic: boolean;
}