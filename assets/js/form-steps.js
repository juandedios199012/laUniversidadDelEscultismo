// ===== MANEJO DE PASOS DEL FORMULARIO =====
class FormStepManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.stepElements = document.querySelectorAll('.form-step');
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateStepDisplay();
    }
    
    setupEventListeners() {
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevStep();
            });
        }
        
        // Permitir navegación directa haciendo clic en los pasos del progreso
        this.progressSteps.forEach((step, index) => {
            step.addEventListener('click', () => {
                if (this.canNavigateToStep(index + 1)) {
                    this.goToStep(index + 1);
                }
            });
        });
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                this.animateStepTransition();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.animateStepTransition();
        }
    }
    
    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.currentStep = stepNumber;
            this.updateStepDisplay();
            this.animateStepTransition();
        }
    }
    
    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Validaciones específicas por paso
        if (this.currentStep === 1) {
            isValid = this.validateStep1() && isValid;
        } else if (this.currentStep === 2) {
            isValid = this.validateStep2() && isValid;
        } else if (this.currentStep === 3) {
            isValid = this.validateStep3() && isValid;
        }
        
        return isValid;
    }
    
    validateStep1() {
        // Validar edad calculada
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        if (fechaNacimiento) {
            const edad = this.calculateAge(fechaNacimiento);
            if (edad < config.minAge || edad > config.maxAge) {
                this.showError('fechaNacimiento', `La edad debe estar entre ${config.minAge} y ${config.maxAge} años`);
                return false;
            }
        }
        return true;
    }
    
    validateStep2() {
        // Validar que se haya seleccionado o ingresado un familiar
        const familiarNombres = document.getElementById('familiarNombres').value;
        const parentesco = document.getElementById('parentesco').value;
        
        if (!familiarNombres || !parentesco) {
            this.showError('familiarNombres', 'Debe completar los datos del familiar');
            return false;
        }
        return true;
    }
    
    validateStep3() {
        // Validar que la rama sea apropiada para la edad
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        const rama = document.getElementById('rama').value;
        
        if (fechaNacimiento && rama) {
            const edad = this.calculateAge(fechaNacimiento);
            const ramaInfo = ramaData[rama];
            
            if (edad < ramaInfo.edadMin || edad > ramaInfo.edadMax) {
                this.showAgeAlert(edad, ramaInfo);
                return false;
            }
        }
        return true;
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
        
        // Validaciones específicas si hay valor
        if (value && validation) {
            // Longitud mínima
            if (validation.minLength && value.length < validation.minLength) {
                this.showFieldError(field, `Mínimo ${validation.minLength} caracteres`);
                return false;
            }
            
            // Patrón
            if (validation.pattern && !validation.pattern.test(value)) {
                this.showFieldError(field, validation.message);
                return false;
            }
        }
        
        return true;
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Crear o actualizar mensaje de error
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            this.showFieldError(field, message);
        }
    }
    
    showAgeAlert(edad, ramaInfo) {
        const alertElement = document.getElementById('ageAlert');
        const alertText = document.getElementById('ageAlertText');
        
        if (alertElement && alertText) {
            alertElement.className = 'age-alert error';
            alertText.textContent = `La edad actual (${edad} años) no corresponde a la rama ${ramaInfo.nombre} (${ramaInfo.edadMin}-${ramaInfo.edadMax} años)`;
            alertElement.style.display = 'flex';
        }
    }
    
    hideAgeAlert() {
        const alertElement = document.getElementById('ageAlert');
        if (alertElement) {
            alertElement.style.display = 'none';
        }
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
    
    canNavigateToStep(stepNumber) {
        // Solo permitir navegar a pasos anteriores o al siguiente si el actual es válido
        return stepNumber <= this.currentStep || (stepNumber === this.currentStep + 1 && this.validateCurrentStep());
    }
    
    updateStepDisplay() {
        // Actualizar pasos del formulario
        this.stepElements.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        // Actualizar indicador de progreso
        this.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber === this.currentStep);
            step.classList.toggle('completed', stepNumber < this.currentStep);
        });
        
        // Actualizar botones de navegación
        this.updateNavigationButtons();
        
        // Scroll al top del formulario
        document.querySelector('.form-container').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    updateNavigationButtons() {
        // Botón anterior
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        // Botón siguiente
        if (this.nextBtn) {
            this.nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
        }
        
        // Botón enviar
        if (this.submitBtn) {
            this.submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
        }
    }
    
    animateStepTransition() {
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            activeStep.style.opacity = '0';
            activeStep.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                activeStep.style.opacity = '1';
                activeStep.style.transform = 'translateY(0)';
            }, 50);
        }
    }
    
    // Método para obtener todos los datos del formulario
    getFormData() {
        const formData = new FormData(document.getElementById('registrationForm'));
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Agregar datos calculados
        if (data.fechaNacimiento) {
            data.edadCalculada = this.calculateAge(data.fechaNacimiento);
        }
        
        return data;
    }
    
    // Método para resetear el formulario
    reset() {
        this.currentStep = 1;
        this.updateStepDisplay();
        document.getElementById('registrationForm').reset();
        this.hideAgeAlert();
        
        // Limpiar errores
        document.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });
        document.querySelectorAll('.field-error').forEach(element => {
            element.remove();
        });
    }
}

// Inicializar el gestor de pasos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.formStepManager = new FormStepManager();
});
