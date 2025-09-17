// ===== APLICACIÓN PRINCIPAL =====
class ScoutRegistrationApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.initializeComponents();
        this.setupFormSubmission();
        this.loadInitialData();
        
        this.isInitialized = true;
        console.log('Scout Registration App initialized successfully');
    }
    
    setupEventListeners() {
        // Calcular edad automáticamente
        const fechaNacimiento = document.getElementById('fechaNacimiento');
        if (fechaNacimiento) {
            fechaNacimiento.addEventListener('change', this.updateCalculatedAge);
        }
        
        // Navegación del header
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavigation);
        });
        
        // Toggle switch para activo/inactivo
        const activoToggle = document.getElementById('activo');
        if (activoToggle) {
            activoToggle.addEventListener('change', this.handleActiveToggle);
        }
        
        // Prevenir envío del formulario con Enter
        const form = document.getElementById('registrationForm');
        if (form) {
            form.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            });
        }
        
        // Manejar cambios en campos de fecha
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso) {
            fechaIngreso.addEventListener('change', this.validateIngressDate);
        }
    }
    
    initializeComponents() {
        // Los componentes ya se inicializan en sus respectivos archivos
        // Aquí podemos hacer configuraciones adicionales si es necesario
        
        // Configurar fecha máxima para fecha de nacimiento (hoy)
        const fechaNacimiento = document.getElementById('fechaNacimiento');
        if (fechaNacimiento) {
            const today = new Date().toISOString().split('T')[0];
            fechaNacimiento.setAttribute('max', today);
        }
        
        // Configurar fecha mínima para fecha de ingreso (hace 10 años) y máxima (hoy)
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso) {
            const today = new Date();
            const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            
            fechaIngreso.setAttribute('min', tenYearsAgo.toISOString().split('T')[0]);
            fechaIngreso.setAttribute('max', today.toISOString().split('T')[0]);
        }
    }
    
    loadInitialData() {
        // Cargar datos iniciales si es necesario
        this.setDefaultValues();
    }
    
    setDefaultValues() {
        // Establecer país por defecto (Perú)
        const paisSelect = document.getElementById('pais');
        if (paisSelect) {
            paisSelect.value = 'peru';
        }
        
        // Establecer fecha de ingreso por defecto (hoy)
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso && !fechaIngreso.value) {
            const today = new Date().toISOString().split('T')[0];
            fechaIngreso.value = today;
        }
        
        // Establecer estado activo por defecto
        const activoToggle = document.getElementById('activo');
        if (activoToggle) {
            activoToggle.checked = true;
        }
    }
    
    updateCalculatedAge(event) {
        const birthDate = event.target.value;
        if (!birthDate) return;
        
        const age = window.scoutApp.calculateAge(birthDate);
        const ageDisplay = document.getElementById('edadCalculada');
        
        if (ageDisplay) {
            const ageNumber = ageDisplay.querySelector('.age-number');
            if (ageNumber) {
                ageNumber.textContent = age;
                
                // Agregar animación
                ageNumber.classList.add('pulse');
                setTimeout(() => {
                    ageNumber.classList.remove('pulse');
                }, 1000);
            }
        }
    }
    
    validateIngressDate(event) {
        const ingressDate = new Date(event.target.value);
        const birthDate = new Date(document.getElementById('fechaNacimiento').value);
        
        if (birthDate && ingressDate < birthDate) {
            window.formValidator.showFieldError(
                event.target,
                'La fecha de ingreso no puede ser anterior a la fecha de nacimiento'
            );
            return false;
        }
        
        return true;
    }
    
    handleNavigation(event) {
        event.preventDefault();
        
        // Remover clase active de todos los links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al link clickeado
        event.target.classList.add('active');
        
        // Aquí se podría implementar navegación entre secciones
        // Por ahora solo manejamos el highlight visual
    }
    
    handleActiveToggle(event) {
        const isActive = event.target.checked;
        const toggleText = event.target.parentNode.querySelector('.toggle-text');
        
        if (toggleText) {
            toggleText.textContent = isActive ? 'Activo' : 'Inactivo';
            toggleText.style.color = isActive ? '#4CAF50' : '#757575';
        }
    }
    
    setupFormSubmission() {
        const form = document.getElementById('registrationForm');
        const submitBtn = document.getElementById('submitBtn');
        
        if (form && submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
    }
    
    async handleFormSubmission() {
        try {
            // Mostrar loading
            this.showLoadingState();
            
            // Validar todo el formulario
            if (!this.validateCompleteForm()) {
                this.hideLoadingState();
                return;
            }
            
            // Recopilar todos los datos
            const formData = this.collectFormData();
            
            // Simular envío al servidor
            await this.simulateServerSubmission(formData);
            
            // Mostrar éxito
            this.showSuccessMessage();
            
            // Resetear formulario después de un momento
            setTimeout(() => {
                this.resetForm();
            }, 2000);
            
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            this.showErrorMessage('Ocurrió un error al registrar el scout. Por favor, inténtelo nuevamente.');
        } finally {
            this.hideLoadingState();
        }
    }
    
    validateCompleteForm() {
        let isValid = true;
        
        // Validar cada paso
        for (let i = 1; i <= 3; i++) {
            if (!window.formValidator.validateStep(i)) {
                isValid = false;
            }
        }
        
        // Validaciones adicionales específicas
        if (!window.locationManager.validate()) {
            this.showErrorMessage('Debe completar la información de ubicación (departamento, provincia, distrito)');
            isValid = false;
        }
        
        if (!window.ramaManager.validateRamaData()) {
            this.showErrorMessage('Debe completar todos los campos específicos de la rama seleccionada');
            isValid = false;
        }
        
        if (!isValid) {
            window.formValidator.scrollToFirstError();
        }
        
        return isValid;
    }
    
    collectFormData() {
        const basicData = window.formStepManager.getFormData();
        const locationData = window.locationManager.getSelectedLocation();
        const familiarData = window.familiarSearch.getFamiliarData();
        const ramaData = window.ramaManager.getRamaData();
        
        return {
            datosPersonales: {
                nombres: basicData.nombres,
                apellidos: basicData.apellidos,
                fechaNacimiento: basicData.fechaNacimiento,
                edadCalculada: basicData.edadCalculada,
                direccion: basicData.direccion,
                ubicacion: locationData,
                celular: basicData.celular,
                telefono: basicData.telefono,
                foto: basicData.foto,
                activo: basicData.activo === 'on'
            },
            datosFamiliares: familiarData,
            datosRama: {
                ...ramaData,
                fechaIngreso: basicData.fechaIngreso
            },
            fechaRegistro: new Date().toISOString(),
            registradoPor: 'Sistema Web' // En producción sería el usuario logueado
        };
    }
    
    async simulateServerSubmission(data) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular respuesta del servidor
        console.log('Datos del scout a registrar:', data);
        
        // En producción, aquí se haría el fetch al API
        /*
        const response = await fetch('/api/scouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Error en el servidor');
        }
        
        return await response.json();
        */
        
        return { success: true, id: Math.random().toString(36).substr(2, 9) };
    }
    
    showLoadingState() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Registrando...
            `;
        }
    }
    
    hideLoadingState() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <i class="fas fa-save"></i>
                Registrar Scout
            `;
        }
    }
    
    showSuccessMessage() {
        this.showToast(mensajes.exito.registroCompleto, 'success');
    }
    
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.style.backgroundColor = colors[type];
        toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
        
        document.body.appendChild(toast);
        
        // Eliminar después de 4 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }
    
    resetForm() {
        // Confirmar antes de resetear
        if (confirm('¿Está seguro de que desea limpiar el formulario para registrar un nuevo scout?')) {
            window.formStepManager.reset();
            window.locationManager.reset();
            window.familiarSearch.reset();
            window.ramaManager.reset();
            window.formValidator.clearAllErrors();
            window.fileHandler.clearFile();
            
            this.setDefaultValues();
            this.showToast('Formulario limpiado. Listo para nuevo registro.', 'info');
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
    
    // Método para exportar datos (útil para debugging)
    exportFormData() {
        const data = this.collectFormData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scout_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    // Agregar estilos de animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .field-error {
            color: #f44336 !important;
            font-size: 0.75rem !important;
            margin-top: 0.25rem !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.25rem !important;
        }
        
        .form-input.error,
        .form-select.error,
        .form-textarea.error {
            border-color: #f44336 !important;
            box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1) !important;
        }
        
        .readonly {
            background-color: #f5f5f5 !important;
            border-style: dashed !important;
        }
        
        .pulse {
            animation: pulse 0.6s ease-in-out !important;
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar aplicación principal
    window.scoutApp = new ScoutRegistrationApp();
    
    // Agregar event listener para debugging (Ctrl+Shift+E para exportar datos)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            window.scoutApp.exportFormData();
        }
    });
    
    console.log('🏕️ Sistema de Gestión Boy Scout - Grupo Lima 12 🏕️');
    console.log('✅ Aplicación cargada correctamente');
    console.log('💡 Presiona Ctrl+Shift+E para exportar datos del formulario');
});
