// ================================================================
// 🛠️ Common Types & Utilities
// ================================================================

// ================================================================
// 📊 Result Pattern for Error Handling
// ================================================================

export abstract class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: string;

  protected constructor(isSuccess: boolean, error?: string) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot get value of failed result: ${this.error}`);
    }

    return (this as any).value;
  }

  public getError(): string {
    return this.error || '';
  }

  public static ok<U>(value?: U): Result<U> {
    return new Success<U>(value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Failure<U>(error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (let result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }
}

export class Success<T> extends Result<T> {
  private readonly _value?: T;

  constructor(value?: T) {
    super(true);
    this._value = value;
  }

  public getValue(): T {
    return this._value as T;
  }

  public static create<U>(value?: U): Success<U> {
    return new Success<U>(value);
  }
}

export class Failure<T> extends Result<T> {
  private readonly _error: string;
  private readonly _errorCode?: string;
  private readonly _context?: string;

  constructor(error: string, errorCode?: string, context?: string) {
    super(false, error);
    this._error = error;
    this._errorCode = errorCode;
    this._context = context;
  }

  public getError(): string {
    return this._error;
  }

  public getErrorCode(): string | undefined {
    return this._errorCode;
  }

  public getContext(): string | undefined {
    return this._context;
  }

  public static create<U>(errorCode: string, error: string, context?: string): Failure<U> {
    return new Failure<U>(error, errorCode, context);
  }
}

// ================================================================
// 🔍 Validation Types
// ================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class Validator {
  public static validateRequired(value: any, fieldName: string): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} es requerido`,
        code: 'FIELD_REQUIRED'
      };
    }
    return null;
  }

  public static validateEmail(email: string, fieldName: string = 'email'): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return {
        field: fieldName,
        message: `${fieldName} no tiene un formato válido`,
        code: 'INVALID_EMAIL_FORMAT'
      };
    }
    return null;
  }

  public static validatePhone(phone: string, fieldName: string = 'telefono'): ValidationError | null {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return {
        field: fieldName,
        message: `${fieldName} no tiene un formato válido`,
        code: 'INVALID_PHONE_FORMAT'
      };
    }
    return null;
  }

  public static validateDate(date: string | Date, fieldName: string = 'fecha'): ValidationError | null {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return {
        field: fieldName,
        message: `${fieldName} no es una fecha válida`,
        code: 'INVALID_DATE_FORMAT'
      };
    }
    return null;
  }

  public static validateAge(birthDate: Date, minAge: number = 0, maxAge: number = 120): ValidationError | null {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // age--;
    }

    if (age < minAge || age > maxAge) {
      return {
        field: 'edad',
        message: `La edad debe estar entre ${minAge} y ${maxAge} años`,
        code: 'INVALID_AGE_RANGE'
      };
    }
    return null;
  }

  public static combine(validations: (ValidationError | null)[]): ValidationResult {
    const errors = validations.filter((error): error is ValidationError => error !== null);
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ================================================================
// 🎯 Entity Base Classes
// ================================================================

export abstract class Entity<T> {
  protected readonly _id: T;

  constructor(id: T) {
    this._id = id;
  }

  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id === object._id;
  }

  get id(): T {
    return this._id;
  }
}

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }
}

// ================================================================
// 📢 Domain Events
// ================================================================

export interface DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventVersion: number;
  eventType: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;
  public readonly eventType: string;

  constructor(eventType: string) {
    this.eventId = this.generateUniqueId();
    this.occurredOn = new Date();
    this.eventVersion = 1;
    this.eventType = eventType;
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// ================================================================
// 🛠️ Utility Functions
// ================================================================

export class Utils {
  public static isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
  }

  public static isEmpty(value: string): boolean {
    return this.isNullOrUndefined(value) || value.trim().length === 0;
  }

  public static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public static formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    switch (format) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'MM/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      default:
        return date.toLocaleDateString();
    }
  }

  public static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  public static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    if (typeof obj === 'object') {
      const cloned = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }
}

// ================================================================
// 📊 Logging Interface
// ================================================================

export interface ILogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  debug(message: string, context?: any): void;
}

export class ConsoleLogger implements ILogger {
  info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, context || '');
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error, context?: any): void {
    console.error(`[ERROR] ${message}`, error?.message || '', context || '');
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${message}`, context || '');
  }
}