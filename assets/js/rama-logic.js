// ===== LÓGICA DE RAMAS SCOUT =====
class RamaManager {
    constructor() {
        this.ramaSelect = document.getElementById('rama');
        this.ramaSpecificFields = document.getElementById('ramaSpecificFields');
        this.fechaNacimiento = document.getElementById('fechaNacimiento');
        this.ramaTimeline = document.getElementById('ramaTimeline');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeTimeline();
    }
    
    setupEventListeners() {
        if (this.ramaSelect) {
            this.ramaSelect.addEventListener('change', () => {
                this.handleRamaChange();
            });
        }
        
        if (this.fechaNacimiento) {
            this.fechaNacimiento.addEventListener('change', () => {
                this.handleBirthDateChange();
            });
        }
    }
    
    handleRamaChange() {
        const selectedRama = this.ramaSelect.value;
        
        if (selectedRama && ramaData[selectedRama]) {
            this.generateRamaFields(selectedRama);
            this.updateTimelineActive(selectedRama);
            this.validateAgeForRama(selectedRama);
        } else {
            this.clearRamaFields();
            this.clearTimelineActive();
        }
    }
    
    handleBirthDateChange() {
        const fechaNacimiento = this.fechaNacimiento.value;
        if (fechaNacimiento) {
            const edad = this.calculateAge(fechaNacimiento);
            const recommendedRama = this.getRecommendedRama(edad);
            
            // Actualizar edad calculada en el paso 1
            this.updateCalculatedAge(edad);
            
            // Sugerir rama apropiada
            if (recommendedRama) {
                this.suggestRama(recommendedRama, edad);
            }
            
            // Validar rama actual si hay una seleccionada
            if (this.ramaSelect.value) {
                this.validateAgeForRama(this.ramaSelect.value);
            }
        }
    }
    
    generateRamaFields(ramaKey) {
        const rama = ramaData[ramaKey];
        
        if (!rama || !rama.campos) {
            this.clearRamaFields();
            return;
        }
        
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'rama-fields';
        fieldsContainer.innerHTML = `
            <div class="rama-fields-title">
                <i class="${rama.icon}"></i>
                Campos específicos para ${rama.nombre}
            </div>
            <div class="form-grid">
                ${this.generateFieldsHTML(rama.campos, ramaKey)}
            </div>
        `;
        
        this.ramaSpecificFields.innerHTML = '';
        this.ramaSpecificFields.appendChild(fieldsContainer);
        
        // Configurar eventos para los campos generados
        this.setupRamaFieldEvents(fieldsContainer);
    }
    
    generateFieldsHTML(campos, ramaKey) {
        let html = '';
        
        Object.entries(campos).forEach(([fieldKey, fieldConfig]) => {
            const fieldId = `${ramaKey}_${fieldKey}`;
            const fieldName = `${ramaKey}_${fieldKey}`;
            
            if (fieldConfig.tipo === 'select') {
                html += `
                    <div class="form-group">
                        <label for="${fieldId}" class="form-label">
                            <i class="fas fa-tag"></i>
                            ${fieldConfig.label} *
                        </label>
                        <select id="${fieldId}" name="${fieldName}" class="form-select" required>
                            <option value="">Seleccionar ${fieldConfig.label.toLowerCase()}</option>
                            ${fieldConfig.opciones.map(opcion => 
                                `<option value="${opcion}">${opcion}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else if (fieldConfig.tipo === 'input') {
                html += `
                    <div class="form-group">
                        <label for="${fieldId}" class="form-label">
                            <i class="fas fa-edit"></i>
                            ${fieldConfig.label} *
                        </label>
                        <input type="text" id="${fieldId}" name="${fieldName}" class="form-input" required>
                    </div>
                `;
            }
        });
        
        return html;
    }
    
    setupRamaFieldEvents(container) {
        // Configurar validaciones y eventos específicos para los campos de rama
        const selects = container.querySelectorAll('select');
        const inputs = container.querySelectorAll('input');
        
        [...selects, ...inputs].forEach(element => {
            element.addEventListener('change', () => {
                this.validateRamaField(element);
            });
        });
    }
    
    validateRamaField(field) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Este campo es obligatorio');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }
    
    clearRamaFields() {
        if (this.ramaSpecificFields) {
            this.ramaSpecificFields.innerHTML = '';
        }
    }
    
    initializeTimeline() {
        if (!this.ramaTimeline) return;
        
        const timelineItems = this.ramaTimeline.querySelectorAll('.timeline-item');
        
        timelineItems.forEach((item, index) => {
            const ramaKeys = ['manada', 'tropa', 'caminante', 'clan'];
            const ramaKey = ramaKeys[index];
            
            if (ramaKey) {
                item.addEventListener('click', () => {
                    if (this.ramaSelect) {
                        this.ramaSelect.value = ramaKey;
                        this.handleRamaChange();
                    }
                });
            }
        });
    }
    
    updateTimelineActive(selectedRama) {
        if (!this.ramaTimeline) return;
        
        const timelineItems = this.ramaTimeline.querySelectorAll('.timeline-item');
        const ramaKeys = ['manada', 'tropa', 'caminante', 'clan'];
        
        timelineItems.forEach((item, index) => {
            const ramaKey = ramaKeys[index];
            item.classList.toggle('active', ramaKey === selectedRama);
        });
    }
    
    clearTimelineActive() {
        if (!this.ramaTimeline) return;
        
        const timelineItems = this.ramaTimeline.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            item.classList.remove('active');
        });
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
    
    updateCalculatedAge(age) {
        const ageDisplay = document.getElementById('edadCalculada');
        if (ageDisplay) {
            const ageNumber = ageDisplay.querySelector('.age-number');
            if (ageNumber) {
                ageNumber.textContent = age;
            }
        }
    }
    
    getRecommendedRama(age) {
        for (const [key, rama] of Object.entries(ramaData)) {
            if (age >= rama.edadMin && age <= rama.edadMax) {
                return key;
            }
        }
        return null;
    }
    
    suggestRama(recommendedRama, age) {
        const rama = ramaData[recommendedRama];
        const alertElement = document.getElementById('ageAlert');
        const alertText = document.getElementById('ageAlertText');
        
        if (alertElement && alertText) {
            alertElement.className = 'age-alert success';
            alertText.textContent = `Edad: ${age} años. Se recomienda la rama ${rama.nombre} (${rama.edadMin}-${rama.edadMax} años)`;
            alertElement.style.display = 'flex';
            
            // Auto-seleccionar la rama recomendada si no hay una seleccionada
            if (this.ramaSelect && !this.ramaSelect.value) {
                setTimeout(() => {
                    this.ramaSelect.value = recommendedRama;
                    this.handleRamaChange();
                }, 1000);
            }
        }
    }
    
    validateAgeForRama(ramaKey) {
        const fechaNacimiento = this.fechaNacimiento?.value;
        if (!fechaNacimiento) return true;
        
        const edad = this.calculateAge(fechaNacimiento);
        const rama = ramaData[ramaKey];
        
        if (!rama) return true;
        
        const alertElement = document.getElementById('ageAlert');
        const alertText = document.getElementById('ageAlertText');
        
        if (edad < rama.edadMin || edad > rama.edadMax) {
            if (alertElement && alertText) {
                alertElement.className = 'age-alert error';
                alertText.textContent = `La edad actual (${edad} años) no corresponde a la rama ${rama.nombre} (${rama.edadMin}-${rama.edadMax} años)`;
                alertElement.style.display = 'flex';
            }
            return false;
        } else {
            if (alertElement && alertText) {
                alertElement.className = 'age-alert success';
                alertText.textContent = `Edad: ${edad} años. Corresponde correctamente a la rama ${rama.nombre}`;
                alertElement.style.display = 'flex';
            }
            return true;
        }
    }
    
    hideAgeAlert() {
        const alertElement = document.getElementById('ageAlert');
        if (alertElement) {
            alertElement.style.display = 'none';
        }
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
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
    
    // Método para obtener todos los datos de rama
    getRamaData() {
        const selectedRama = this.ramaSelect?.value;
        if (!selectedRama) return null;
        
        const ramaInfo = ramaData[selectedRama];
        const data = {
            rama: selectedRama,
            ramaInfo: ramaInfo,
            camposEspecificos: {}
        };
        
        // Recopilar datos de campos específicos
        if (ramaInfo && ramaInfo.campos) {
            Object.keys(ramaInfo.campos).forEach(fieldKey => {
                const fieldElement = document.getElementById(`${selectedRama}_${fieldKey}`);
                if (fieldElement) {
                    data.camposEspecificos[fieldKey] = fieldElement.value;
                }
            });
        }
        
        return data;
    }
    
    // Método para validar todos los campos de rama
    validateRamaData() {
        const selectedRama = this.ramaSelect?.value;
        if (!selectedRama) return false;
        
        const ramaInfo = ramaData[selectedRama];
        if (!ramaInfo || !ramaInfo.campos) return true;
        
        let isValid = true;
        
        Object.keys(ramaInfo.campos).forEach(fieldKey => {
            const fieldElement = document.getElementById(`${selectedRama}_${fieldKey}`);
            if (fieldElement && !this.validateRamaField(fieldElement)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Método para resetear la selección de rama
    reset() {
        if (this.ramaSelect) {
            this.ramaSelect.value = '';
        }
        this.clearRamaFields();
        this.clearTimelineActive();
        this.hideAgeAlert();
    }
}

// Inicializar gestor de ramas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.ramaManager = new RamaManager();
});
