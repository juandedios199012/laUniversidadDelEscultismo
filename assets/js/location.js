// ===== MANEJO DE UBICACIONES (DEPARTAMENTOS, PROVINCIAS, DISTRITOS) =====
class LocationManager {
    constructor() {
        this.departamentoSelect = document.getElementById('departamento');
        this.provinciaSelect = document.getElementById('provincia');
        this.distritoSelect = document.getElementById('distrito');
        
        this.init();
    }
    
    init() {
        this.loadDepartamentos();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.departamentoSelect) {
            this.departamentoSelect.addEventListener('change', () => {
                this.loadProvincias();
            });
        }
        
        if (this.provinciaSelect) {
            this.provinciaSelect.addEventListener('change', () => {
                this.loadDistritos();
            });
        }
    }
    
    loadDepartamentos() {
        if (!this.departamentoSelect) return;
        
        // Limpiar opciones existentes (excepto la primera)
        this.departamentoSelect.innerHTML = '<option value="">Seleccionar departamento</option>';
        
        // Agregar departamentos
        locationData.departamentos.forEach(departamento => {
            const option = document.createElement('option');
            option.value = departamento.id;
            option.textContent = departamento.nombre;
            this.departamentoSelect.appendChild(option);
        });
    }
    
    loadProvincias() {
        if (!this.provinciaSelect || !this.distritoSelect) return;
        
        const departamentoId = this.departamentoSelect.value;
        
        // Limpiar provincias y distritos
        this.provinciaSelect.innerHTML = '<option value="">Seleccionar provincia</option>';
        this.distritoSelect.innerHTML = '<option value="">Seleccionar distrito</option>';
        
        if (!departamentoId) {
            this.provinciaSelect.disabled = true;
            this.distritoSelect.disabled = true;
            return;
        }
        
        // Encontrar el departamento seleccionado
        const departamento = locationData.departamentos.find(d => d.id === departamentoId);
        
        if (departamento && departamento.provincias) {
            // Habilitar select de provincia
            this.provinciaSelect.disabled = false;
            
            // Agregar provincias
            departamento.provincias.forEach(provincia => {
                const option = document.createElement('option');
                option.value = provincia.id;
                option.textContent = provincia.nombre;
                this.provinciaSelect.appendChild(option);
            });
        }
        
        // Mantener distrito deshabilitado hasta que se seleccione provincia
        this.distritoSelect.disabled = true;
    }
    
    loadDistritos() {
        if (!this.distritoSelect) return;
        
        const departamentoId = this.departamentoSelect.value;
        const provinciaId = this.provinciaSelect.value;
        
        // Limpiar distritos
        this.distritoSelect.innerHTML = '<option value="">Seleccionar distrito</option>';
        
        if (!departamentoId || !provinciaId) {
            this.distritoSelect.disabled = true;
            return;
        }
        
        // Encontrar el departamento y provincia seleccionados
        const departamento = locationData.departamentos.find(d => d.id === departamentoId);
        const provincia = departamento?.provincias.find(p => p.id === provinciaId);
        
        if (provincia && provincia.distritos) {
            // Habilitar select de distrito
            this.distritoSelect.disabled = false;
            
            // Agregar distritos
            provincia.distritos.forEach(distrito => {
                const option = document.createElement('option');
                option.value = distrito;
                option.textContent = distrito;
                this.distritoSelect.appendChild(option);
            });
        }
    }
    
    // Método para obtener la ubicación completa seleccionada
    getSelectedLocation() {
        const departamentoId = this.departamentoSelect?.value;
        const provinciaId = this.provinciaSelect?.value;
        const distritoValue = this.distritoSelect?.value;
        
        if (!departamentoId) return null;
        
        const departamento = locationData.departamentos.find(d => d.id === departamentoId);
        const provincia = departamento?.provincias.find(p => p.id === provinciaId);
        
        return {
            departamento: {
                id: departamento?.id,
                nombre: departamento?.nombre
            },
            provincia: {
                id: provincia?.id,
                nombre: provincia?.nombre
            },
            distrito: distritoValue
        };
    }
    
    // Método para precargar ubicación (útil para edición)
    setLocation(departamentoId, provinciaId, distrito) {
        if (this.departamentoSelect && departamentoId) {
            this.departamentoSelect.value = departamentoId;
            this.loadProvincias();
            
            setTimeout(() => {
                if (this.provinciaSelect && provinciaId) {
                    this.provinciaSelect.value = provinciaId;
                    this.loadDistritos();
                    
                    setTimeout(() => {
                        if (this.distritoSelect && distrito) {
                            this.distritoSelect.value = distrito;
                        }
                    }, 100);
                }
            }, 100);
        }
    }
    
    // Método para resetear la selección de ubicación
    reset() {
        if (this.departamentoSelect) {
            this.departamentoSelect.value = '';
        }
        if (this.provinciaSelect) {
            this.provinciaSelect.value = '';
            this.provinciaSelect.disabled = true;
        }
        if (this.distritoSelect) {
            this.distritoSelect.value = '';
            this.distritoSelect.disabled = true;
        }
    }
    
    // Método para validar que se haya seleccionado una ubicación completa
    validate() {
        const location = this.getSelectedLocation();
        return location && 
               location.departamento.id && 
               location.provincia.id && 
               location.distrito;
    }
}

// ===== BÚSQUEDA DE FAMILIARES =====
class FamiliarSearch {
    constructor() {
        this.searchInput = document.getElementById('buscarFamiliar');
        this.searchResults = document.getElementById('searchResults');
        this.familiarNombres = document.getElementById('familiarNombres');
        this.familiarApellidos = document.getElementById('familiarApellidos');
        this.familiarCelular = document.getElementById('familiarCelular');
        this.familiarTelefono = document.getElementById('familiarTelefono');
        
        this.debounceTimer = null;
        this.selectedFamiliar = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });
            
            this.searchInput.addEventListener('blur', () => {
                // Ocultar resultados después de un pequeño delay para permitir clics
                setTimeout(() => {
                    this.hideResults();
                }, 200);
            });
        }
        
        // Limpiar búsqueda cuando se modifica manualmente los campos
        [this.familiarNombres, this.familiarApellidos, this.familiarCelular, this.familiarTelefono].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.clearSearch();
                });
            }
        });
        
        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.searchInput?.contains(e.target) && !this.searchResults?.contains(e.target)) {
                this.hideResults();
            }
        });
    }
    
    debounceSearch(query) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, config.debounceTime);
    }
    
    search(query) {
        if (!query || query.length < 2) {
            this.hideResults();
            return;
        }
        
        const results = this.searchFamiliares(query);
        this.displayResults(results);
    }
    
    searchFamiliares(query) {
        const lowerQuery = query.toLowerCase();
        return familiaresMock.filter(familiar => {
            const nombreCompleto = `${familiar.nombres} ${familiar.apellidos}`.toLowerCase();
            return nombreCompleto.includes(lowerQuery) ||
                   familiar.nombres.toLowerCase().includes(lowerQuery) ||
                   familiar.apellidos.toLowerCase().includes(lowerQuery);
        });
    }
    
    displayResults(results) {
        if (!this.searchResults) return;
        
        this.searchResults.innerHTML = '';
        
        if (results.length === 0) {
            this.hideResults();
            return;
        }
        
        results.forEach(familiar => {
            const resultItem = this.createResultItem(familiar);
            this.searchResults.appendChild(resultItem);
        });
        
        this.showResults();
    }
    
    createResultItem(familiar) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-name">${familiar.nombres} ${familiar.apellidos}</div>
            <div class="search-result-info">Celular: ${familiar.celular}</div>
        `;
        
        item.addEventListener('click', () => {
            this.selectFamiliar(familiar);
        });
        
        return item;
    }
    
    selectFamiliar(familiar) {
        this.selectedFamiliar = familiar;
        
        // Rellenar campos con datos del familiar seleccionado
        if (this.familiarNombres) this.familiarNombres.value = familiar.nombres;
        if (this.familiarApellidos) this.familiarApellidos.value = familiar.apellidos;
        if (this.familiarCelular) this.familiarCelular.value = familiar.celular;
        if (this.familiarTelefono) this.familiarTelefono.value = familiar.telefono || '';
        
        // Limpiar búsqueda
        if (this.searchInput) this.searchInput.value = `${familiar.nombres} ${familiar.apellidos}`;
        this.hideResults();
        
        // Marcar campos como solo lectura para indicar que es un familiar existente
        this.setFieldsReadonly(true);
    }
    
    clearSearch() {
        this.selectedFamiliar = null;
        if (this.searchInput) this.searchInput.value = '';
        this.hideResults();
        this.setFieldsReadonly(false);
    }
    
    setFieldsReadonly(readonly) {
        [this.familiarNombres, this.familiarApellidos, this.familiarCelular, this.familiarTelefono].forEach(input => {
            if (input) {
                input.readOnly = readonly;
                input.classList.toggle('readonly', readonly);
            }
        });
    }
    
    showResults() {
        if (this.searchResults) {
            this.searchResults.classList.add('show');
        }
    }
    
    hideResults() {
        if (this.searchResults) {
            this.searchResults.classList.remove('show');
        }
    }
    
    // Método para obtener el familiar seleccionado o los datos ingresados
    getFamiliarData() {
        return {
            id: this.selectedFamiliar?.id || null,
            nombres: this.familiarNombres?.value || '',
            apellidos: this.familiarApellidos?.value || '',
            celular: this.familiarCelular?.value || '',
            telefono: this.familiarTelefono?.value || '',
            esExistente: !!this.selectedFamiliar
        };
    }
    
    // Método para resetear la búsqueda
    reset() {
        this.clearSearch();
        [this.familiarNombres, this.familiarApellidos, this.familiarCelular, this.familiarTelefono].forEach(input => {
            if (input) input.value = '';
        });
    }
}

// Inicializar gestores cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.locationManager = new LocationManager();
    window.familiarSearch = new FamiliarSearch();
});
