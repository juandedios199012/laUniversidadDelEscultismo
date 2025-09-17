// ===== DATOS DE UBICACIÓN (PERÚ) =====
const locationData = {
    departamentos: [
        {
            id: 'amazonas',
            nombre: 'Amazonas',
            provincias: [
                {
                    id: 'chachapoyas',
                    nombre: 'Chachapoyas',
                    distritos: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquín', 'Chuquibamba', 'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena', 'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca', 'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche']
                },
                {
                    id: 'bagua',
                    nombre: 'Bagua',
                    distritos: ['Bagua', 'Aramango', 'Copallin', 'El Parco', 'Imaza', 'La Peca']
                }
            ]
        },
        {
            id: 'ancash',
            nombre: 'Áncash',
            provincias: [
                {
                    id: 'huaraz',
                    nombre: 'Huaraz',
                    distritos: ['Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Independencia', 'Jangas', 'La Libertad', 'Olleros', 'Pampas Grande', 'Pariacoto', 'Pira', 'Tarica']
                },
                {
                    id: 'santa',
                    nombre: 'Santa',
                    distritos: ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Samanco', 'Santa', 'Nuevo Chimbote']
                }
            ]
        },
        {
            id: 'lima',
            nombre: 'Lima',
            provincias: [
                {
                    id: 'lima',
                    nombre: 'Lima',
                    distritos: [
                        'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Magdalena Vieja', 'Miraflores', 'Pachacámac', 'Pucusana', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
                    ]
                },
                {
                    id: 'callao',
                    nombre: 'Callao',
                    distritos: ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla']
                }
            ]
        },
        {
            id: 'arequipa',
            nombre: 'Arequipa',
            provincias: [
                {
                    id: 'arequipa',
                    nombre: 'Arequipa',
                    distritos: [
                        'Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'José Luis Bustamante y Rivero', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandia', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura'
                    ]
                }
            ]
        },
        {
            id: 'cusco',
            nombre: 'Cusco',
            provincias: [
                {
                    id: 'cusco',
                    nombre: 'Cusco',
                    distritos: [
                        'Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'
                    ]
                }
            ]
        },
        {
            id: 'piura',
            nombre: 'Piura',
            provincias: [
                {
                    id: 'piura',
                    nombre: 'Piura',
                    distritos: [
                        'Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande'
                    ]
                }
            ]
        }
    ]
};

// ===== DATOS DE RAMAS SCOUT =====
const ramaData = {
    manada: {
        nombre: 'Manada',
        edadMin: 7,
        edadMax: 10,
        color: '#8BC34A',
        icon: 'fas fa-paw',
        campos: {
            seisena: {
                label: 'Seisena',
                tipo: 'select',
                opciones: [
                    'Seisena de Akela',
                    'Seisena de Baloo',
                    'Seisena de Bagheera',
                    'Seisena de Kaa',
                    'Seisena de Raksha',
                    'Seisena de Hathi'
                ]
            },
            nombramiento: {
                label: 'Nombramiento',
                tipo: 'select',
                opciones: [
                    'Seisenero',
                    'Seisenera',
                    'Lobato',
                    'Lobata'
                ]
            }
        }
    },
    tropa: {
        nombre: 'Tropa',
        edadMin: 11,
        edadMax: 14,
        color: '#FF9800',
        icon: 'fas fa-hiking',
        campos: {
            patrulla: {
                label: 'Patrulla',
                tipo: 'select',
                opciones: [
                    'Patrulla del Águila',
                    'Patrulla del León',
                    'Patrulla del Búho',
                    'Patrulla del Lobo',
                    'Patrulla del Ciervo',
                    'Patrulla del Zorro',
                    'Patrulla del Castor',
                    'Patrulla del Cóndor'
                ]
            },
            nombramiento: {
                label: 'Nombramiento',
                tipo: 'select',
                opciones: [
                    'Guía',
                    'Subguía',
                    'Primer Scout',
                    'Segundo Scout',
                    'Scout'
                ]
            },
            cargo: {
                label: 'Cargo en la Patrulla',
                tipo: 'select',
                opciones: [
                    'Guía de Patrulla',
                    'Subguía de Patrulla',
                    'Secretario',
                    'Tesorero',
                    'Intendente',
                    'Enfermero',
                    'Explorador',
                    'Sin cargo específico'
                ]
            }
        }
    },
    caminante: {
        nombre: 'Caminante',
        edadMin: 15,
        edadMax: 17,
        color: '#2196F3',
        icon: 'fas fa-compass',
        campos: {
            nombramiento: {
                label: 'Nombramiento',
                tipo: 'select',
                opciones: [
                    'Primer Caminante',
                    'Segundo Caminante',
                    'Caminante'
                ]
            }
        }
    },
    clan: {
        nombre: 'Clan',
        edadMin: 18,
        edadMax: 21,
        color: '#9C27B0',
        icon: 'fas fa-mountain',
        campos: {
            nombramiento: {
                label: 'Nombramiento',
                tipo: 'select',
                opciones: [
                    'Presidente',
                    'Tesorero',
                    'Secretario',
                    'Rover'
                ]
            }
        }
    }
};

// ===== DATOS DE FAMILIARES (MOCK DATA) =====
const familiaresMock = [
    {
        id: 1,
        nombres: 'María Elena',
        apellidos: 'García López',
        celular: '987654321',
        telefono: '014567890'
    },
    {
        id: 2,
        nombres: 'Carlos Antonio',
        apellidos: 'Rodríguez Mendoza',
        celular: '965432187',
        telefono: '014876543'
    },
    {
        id: 3,
        nombres: 'Ana Patricia',
        apellidos: 'Silva Vargas',
        celular: '976543210',
        telefono: '015432109'
    },
    {
        id: 4,
        nombres: 'José Manuel',
        apellidos: 'Torres Castillo',
        celular: '987123456',
        telefono: '016789012'
    },
    {
        id: 5,
        nombres: 'Carmen Rosa',
        apellidos: 'Flores Herrera',
        celular: '965789123',
        telefono: '017654321'
    }
];

// ===== OPCIONES DE PARENTESCO =====
const parentescoOpciones = [
    { value: 'papa', label: 'Papá' },
    { value: 'mama', label: 'Mamá' },
    { value: 'hermano', label: 'Hermano' },
    { value: 'hermana', label: 'Hermana' },
    { value: 'primo', label: 'Primo' },
    { value: 'prima', label: 'Prima' },
    { value: 'tio', label: 'Tío' },
    { value: 'tia', label: 'Tía' },
    { value: 'hijo', label: 'Hijo' },
    { value: 'hija', label: 'Hija' },
    { value: 'abuelo', label: 'Abuelo' },
    { value: 'abuela', label: 'Abuela' }
];

// ===== VALIDACIONES =====
const validaciones = {
    nombres: {
        required: true,
        minLength: 2,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message: 'Los nombres solo pueden contener letras y espacios'
    },
    apellidos: {
        required: true,
        minLength: 2,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message: 'Los apellidos solo pueden contener letras y espacios'
    },
    celular: {
        required: true,
        pattern: /^9\d{8}$/,
        message: 'El celular debe tener 9 dígitos y comenzar con 9'
    },
    telefono: {
        required: false,
        pattern: /^0?\d{6,8}$/,
        message: 'El teléfono debe tener entre 6 y 8 dígitos'
    },
    direccion: {
        required: true,
        minLength: 10,
        message: 'La dirección debe tener al menos 10 caracteres'
    }
};

// ===== MENSAJES DE LA APLICACIÓN =====
const mensajes = {
    errores: {
        campoRequerido: 'Este campo es obligatorio',
        formatoInvalido: 'El formato no es válido',
        edadInvalida: 'La edad no corresponde a la rama seleccionada',
        fechaInvalida: 'La fecha no es válida',
        archivoInvalido: 'El archivo no es válido'
    },
    exito: {
        registroCompleto: 'Scout registrado exitosamente',
        datosGuardados: 'Datos guardados correctamente',
        archivoSubido: 'Archivo subido correctamente'
    },
    confirmacion: {
        cambiarRama: '¿Estás seguro de cambiar de rama? Se perderán los datos específicos de la rama actual.',
        salirFormulario: '¿Estás seguro de salir? Se perderán los datos no guardados.'
    }
};

// ===== CONFIGURACIÓN DE LA APLICACIÓN =====
const config = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    debounceTime: 300, // ms para búsquedas
    animationDuration: 300, // ms para animaciones
    dateFormat: 'DD-MM-YYYY',
    maxAge: 25,
    minAge: 6
};

// Exportar datos para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        locationData,
        ramaData,
        familiaresMock,
        parentescoOpciones,
        validaciones,
        mensajes,
        config
    };
}
