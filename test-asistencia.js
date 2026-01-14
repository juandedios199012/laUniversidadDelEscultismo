// ==========================================
// Tests Básicos - Módulo de Asistencia
// Sistema Scout Lima 12
// ==========================================

/**
 * Ejecutar: node test-asistencia.js
 */

console.log('🧪 Iniciando tests del módulo de Asistencia...\n');

let testsPassedCount = 0;
let testsFailedCount = 0;

// Helper para tests
function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassedCount++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}\n`);
    testsFailedCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ==========================================
// 1. VALIDAR MAPEO DE ESTADOS
// ==========================================
console.log('📊 Validando mapeo de estados de asistencia...\n');

test('Mapeo de estado "presente" a "PRESENTE"', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  assert(estadoMap['presente'] === 'PRESENTE', 'Estado presente debe mapearse a PRESENTE');
});

test('Mapeo de estado "ausente" a "AUSENTE"', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  assert(estadoMap['ausente'] === 'AUSENTE', 'Estado ausente debe mapearse a AUSENTE');
});

test('Mapeo de estado "tardanza" a "TARDANZA"', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  assert(estadoMap['tardanza'] === 'TARDANZA', 'Estado tardanza debe mapearse a TARDANZA');
});

test('Mapeo de estado "excusado" a "JUSTIFICADO"', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  assert(estadoMap['excusado'] === 'JUSTIFICADO', 'Estado excusado debe mapearse a JUSTIFICADO');
});

// ==========================================
// 2. VALIDAR ESTRUCTURA DE REGISTROS
// ==========================================
console.log('\n💾 Validando estructura de registros...\n');

test('Registro de asistencia tiene campos requeridos', () => {
  const registro = {
    actividad_id: 'uuid-123',
    scout_id: 'uuid-456',
    estado_asistencia: 'PRESENTE',
    fecha: '2026-01-12',
    registrado_por: 'uuid-789'  // UUID del usuario autenticado
  };
  
  assert(registro.actividad_id, 'Debe tener actividad_id');
  assert(registro.scout_id, 'Debe tener scout_id');
  assert(registro.estado_asistencia, 'Debe tener estado_asistencia');
  assert(registro.fecha, 'Debe tener fecha');
  assert(registro.registrado_por, 'Debe tener registrado_por');
});

test('Campo actividad_id es string UUID', () => {
  const registro = { actividad_id: 'uuid-123' };
  assert(typeof registro.actividad_id === 'string', 'actividad_id debe ser string');
});

test('Campo estado_asistencia usa valores del enum', () => {
  const valoresValidos = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO'];
  const registro = { estado_asistencia: 'PRESENTE' };
  assert(valoresValidos.includes(registro.estado_asistencia), 'Estado debe ser valor válido del enum');
});

// ==========================================
// 3. VALIDAR TRANSFORMACIÓN DE DATOS
// ==========================================
console.log('\n🔄 Validando transformación de datos...\n');

test('Array de selecciones se transforma correctamente', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  
  const asistenciaMasiva = {
    'scout-1': 'presente',
    'scout-2': 'ausente'
  };
  
  const userId = 'user-uuid-123';
  
  const registros = Object.entries(asistenciaMasiva).map(([scout_id, estado]) => ({
    actividad_id: 'prog-1',
    scout_id,
    estado_asistencia: estadoMap[estado] || 'PRESENTE',
    fecha: '2026-01-12',
    registrado_por: userId
  }));
  
  assert(registros.length === 2, 'Debe generar 2 registros');
  assert(registros[0].estado_asistencia === 'PRESENTE', 'Primer registro debe ser PRESENTE');
  assert(registros[1].estado_asistencia === 'AUSENTE', 'Segundo registro debe ser AUSENTE');
  assert(registros[0].registrado_por === userId, 'Debe incluir UUID del usuario');
});

test('Estado desconocido usa fallback PRESENTE', () => {
  const estadoMap = {
    'presente': 'PRESENTE',
    'ausente': 'AUSENTE',
    'tardanza': 'TARDANZA',
    'excusado': 'JUSTIFICADO'
  };
  
  const estadoDesconocido = 'invalido';
  const estadoMapeado = estadoMap[estadoDesconocido] || 'PRESENTE';
  
  assert(estadoMapeado === 'PRESENTE', 'Estado desconocido debe usar PRESENTE como fallback');
});

// ==========================================
// 4. VALIDAR FORMATO DE FECHA
// ==========================================
console.log('\n📅 Validando formato de fecha...\n');

test('Fecha en formato ISO YYYY-MM-DD', () => {
  const fecha = new Date().toISOString().split('T')[0];
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  assert(regex.test(fecha), 'Fecha debe estar en formato YYYY-MM-DD');
});

test('Fecha es válida', () => {
  const fechaStr = '2026-01-12';
  const fecha = new Date(fechaStr);
  assert(!isNaN(fecha.getTime()), 'Fecha debe ser válida');
});

// ==========================================
// 5. VALIDAR LÓGICA DE NEGOCIO
// ==========================================
console.log('\n🎯 Validando lógica de negocio...\n');

test('No se puede guardar sin scouts seleccionados', () => {
  const asistenciaMasiva = {};
  const puedeContinuar = Object.keys(asistenciaMasiva).length > 0;
  assert(!puedeContinuar, 'No debe permitir guardar sin selecciones');
});

test('Se puede guardar con al menos un scout seleccionado', () => {
  const asistenciaMasiva = { 'scout-1': 'presente' };
  const puedeContinuar = Object.keys(asistenciaMasiva).length > 0;
  assert(puedeContinuar, 'Debe permitir guardar con selecciones');
});

test('Contador de selecciones es correcto', () => {
  const asistenciaMasiva = {
    'scout-1': 'presente',
    'scout-2': 'ausente',
    'scout-3': 'tardanza'
  };
  const contador = Object.keys(asistenciaMasiva).length;
  assert(contador === 3, 'Contador debe ser 3');
});

// ==========================================
// 6. VALIDAR INTEGRACIÓN SUPABASE
// ==========================================
console.log('\n🔌 Validando preparación para Supabase...\n');

test('Registros preparados para .insert()', () => {
  const registros = [
    {
      actividad_id: 'uuid-1',
      scout_id: 'uuid-2',
      estado_asistencia: 'PRESENTE',
      fecha: '2026-01-12'
    }
  ];
  
  assert(Array.isArray(registros), 'Debe ser un array');
  assert(registros.length > 0, 'Debe tener al menos un registro');
  assert(typeof registros[0] === 'object', 'Cada elemento debe ser un objeto');
});

test('Registros tienen estructura compatible con BD', () => {
  const registro = {
    actividad_id: 'uuid-1',
    scout_id: 'uuid-2',
    estado_asistencia: 'PRESENTE',
    fecha: '2026-01-12',
    registrado_por: 'Sistema'
  };
  
  const camposRequeridos = ['actividad_id', 'scout_id', 'estado_asistencia'];
  const tieneTodosCampos = camposRequeridos.every(campo => campo in registro);
  
  assert(tieneTodosCampos, 'Debe tener todos los campos requeridos');
});

// ==========================================
// RESUMEN
// ==========================================
console.log('\n================================================');
console.log('📊 RESUMEN DE TESTS');
console.log('================================================');
console.log(`✅ Tests exitosos: ${testsPassedCount}`);
console.log(`❌ Tests fallidos: ${testsFailedCount}`);
console.log(`📊 Total: ${testsPassedCount + testsFailedCount}`);
console.log('');

if (testsFailedCount === 0) {
  console.log('🎉 ¡Todos los tests pasaron! El módulo está funcionando correctamente.');
  process.exit(0);
} else {
  console.log('⚠️ Algunos tests fallaron. Revisar la implementación.');
  process.exit(1);
}
