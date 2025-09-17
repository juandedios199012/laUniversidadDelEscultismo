// ===== VALIDACIONES DE FORMULARIO =====
class FormValidator {
    constructor() {
        this.form = document.getElementById('registrationForm');
        this.init();
    }
    
    init() {
        this.setupRealTimeValidation();
    }
    
    setupRealTimeValidation() {
        if (!this.form) return;
        
        // Validación en tiempo real para todos los campos
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            // Validar al perder el foco
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            // Limpiar errores al escribir
            field.addEventListener('input', () => {
                this.clearFieldError(field);
            });
            
            // Validaciones específicas por tipo de campo
            this.setupSpecificValidations(field);
        });
    }
    
    setupSpecificValidations(field) {
        const fieldName = field.name;
        
        switch (fieldName) {
            case 'fechaNacimiento':
                field.addEventListener('change', () => {
                    this.validateBirthDate(field);
                });
                break;
                
            case 'celular':
            case 'familiarCelular':
                field.addEventListener('input', () => {
                    this.formatPhoneNumber(field);
                });
                break;
                
            case 'nombres':
            case 'apellidos':
            case 'familiarNombres':
            case 'familiarApellidos':
                field.addEventListener('input', () => {
                    this.formatName(field);
                });
                break;
                
            case 'foto':
                field.addEventListener('change', () => {
                    this.validateFile(field);
                });
                break;
        }
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const validation = validaciones[fieldName];
        
        // Limpiar errores previos
        this.clearFieldError(field);
        
        // Campo requerido
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, mensajes.errores.campoRequerido);
            return false;
        }
        
        // Si no hay valor y no es requerido, no validar más
        if (!value && !field.hasAttribute('required')) {
            return true;
        }
        
        // Validaciones específicas
        if (validation) {
            // Longitud mínima
            if (validation.minLength && value.length < validation.minLength) {
                this.showFieldError(field, `Mínimo ${validation.minLength} caracteres`);
                return false;
            }
            
            // Patrón regex
            if (validation.pattern && !validation.pattern.test(value)) {
                this.showFieldError(field, validation.message);
                return false;
            }
        }
        
        return true;
    }
    
    validateBirthDate(field) {
        const value = field.value;
        if (!value) return;
        
        const birthDate = new Date(value);
        const today = new Date();
        const age = this.calculateAge(value);
        
        // Verificar que no sea una fecha futura
        if (birthDate > today) {
            this.showFieldError(field, 'La fecha de nacimiento no puede ser futura');
            return false;
        }
        
        // Verificar edad mínima y máxima
        if (age < config.minAge) {
            this.showFieldError(field, `La edad mínima es ${config.minAge} años`);
            return false;
        }
        
        if (age > config.maxAge) {
            this.showFieldError(field, `La edad máxima es ${config.maxAge} años`);
            return false;
        }
        
        return true;
    }
    
    validateFile(field) {
        const file = field.files[0];
        if (!file) return true;
        
        // Validar tipo de archivo
        if (!config.allowedFileTypes.includes(file.type)) {
            this.showFieldError(field, 'Solo se permiten archivos JPG, PNG o GIF');
            return false;
        }
        
        // Validar tamaño
        if (file.size > config.maxFileSize) {
            const maxSizeMB = config.maxFileSize / (1024 * 1024);
            this.showFieldError(field, `El archivo no puede superar ${maxSizeMB}MB`);
            return false;
        }
        
        // Mostrar preview
        this.showFilePreview(file);
        return true;
    }
    
    showFilePreview(file) {
        const preview = document.getElementById('filePreview');
        if (!preview) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <div style="margin-top: 8px; font-size: 14px; color: #666;">
                    ${file.name} (${this.formatFileSize(file.size)})
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatPhoneNumber(field) {
        let value = field.value.replace(/\D/g, ''); // Solo números
        
        // Limitar longitud según el tipo
        if (field.name.includes('celular')) {
            if (value.length > 9) value = value.substring(0, 9);
        } else {
            if (value.length > 8) value = value.substring(0, 8);
        }
        
        field.value = value;
    }
    
    formatName(field) {
        let value = field.value;
        
        // Eliminar números y caracteres especiales excepto espacios y acentos
        value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        
        // Capitalizar primera letra de cada palabra
        value = value.replace(/\b\w/g, char => char.toUpperCase());
        
        field.value = value;
    }
    
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Crear o actualizar mensaje de error
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.cssText = `
                color: #f44336;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            `;
            errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i><span></span>`;
            field.parentNode.appendChild(errorElement);
        }
        errorElement.querySelector('span').textContent = message;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Validar todo el formulario
    validateForm() {
        if (!this.form) return false;
        
        let isValid = true;
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Validar un paso específico
    validateStep(stepNumber) {
        const stepElement = document.getElementById(`step${stepNumber}`);
        if (!stepElement) return false;
        
        let isValid = true;
        const fields = stepElement.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Limpiar todos los errores
    clearAllErrors() {
        const errorElements = this.form?.querySelectorAll('.field-error');
        errorElements?.forEach(element => element.remove());
        
        const errorFields = this.form?.querySelectorAll('.error');
        errorFields?.forEach(field => field.classList.remove('error'));
    }
    
    // Obtener campos con errores
    getFieldsWithErrors() {
        return this.form?.querySelectorAll('.error') || [];
    }
    
    // Scroll al primer campo con error
    scrollToFirstError() {
        const firstError = this.form?.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstError.focus();
        }
    }
}

// ===== MANEJO DE ARCHIVOS =====
class FileHandler {
    constructor() {
        this.fileInput = document.getElementById('foto');
        this.fileUploadDisplay = document.querySelector('.file-upload-display');
        this.filePreview = document.getElementById('filePreview');
        
        this.init();
    }
    
    init() {
        this.setupDragAndDrop();
        this.setupFileInput();
    }
    
    setupDragAndDrop() {
        if (!this.fileUploadDisplay) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.fileUploadDisplay.addEventListener(eventName, this.preventDefaults);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.fileUploadDisplay.addEventListener(eventName, () => {
                this.fileUploadDisplay.classList.add('dragover');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.fileUploadDisplay.addEventListener(eventName, () => {
                this.fileUploadDisplay.classList.remove('dragover');
            });
        });
        
        this.fileUploadDisplay.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }
    
    setupFileInput() {
        if (!this.fileInput) return;
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleFile(file) {
        if (this.validateFile(file)) {
            this.showPreview(file);
            // Simular la selección en el input
            if (this.fileInput) {
                const dt = new DataTransfer();
                dt.items.add(file);
                this.fileInput.files = dt.files;
            }
        }
    }
    
    validateFile(file) {
        // Validar tipo
        if (!config.allowedFileTypes.includes(file.type)) {
            this.showError('Solo se permiten archivos JPG, PNG o GIF');
            return false;
        }
        
        // Validar tamaño
        if (file.size > config.maxFileSize) {
            const maxSizeMB = config.maxFileSize / (1024 * 1024);
            this.showError(`El archivo no puede superar ${maxSizeMB}MB`);
            return false;
        }
        
        return true;
    }
    
    showPreview(file) {
        if (!this.filePreview) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.filePreview.innerHTML = `
                <div style="text-align: center;">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="margin-top: 8px; font-size: 14px; color: #666;">
                        <strong>${file.name}</strong><br>
                        ${this.formatFileSize(file.size)}
                    </div>
                    <button type="button" onclick="window.fileHandler.clearFile()" style="margin-top: 8px; padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    clearFile() {
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        if (this.filePreview) {
            this.filePreview.innerHTML = '';
        }
    }
    
    showError(message) {
        // Crear toast de error
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
        `;
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        document.body.appendChild(toast);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Inicializar validadores cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.formValidator = new FormValidator();
    window.fileHandler = new FileHandler();
});
