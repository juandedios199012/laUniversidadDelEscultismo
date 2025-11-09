// ================================================================
// 🧪 TEST AUTOMATIZADO DE DATABASE FUNCTIONS - SISTEMA SCOUT
// ================================================================
// Archivo: test-database-functions.js
// Propósito: Validación automatizada de todas las Database Functions
// Ejecución: node test-database-functions.js
// ================================================================

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// ============= CONFIGURACIÓN SUPABASE =============
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// ============= COLORES PARA CONSOLA =============
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// ============= UTILIDADES DE TESTING =============
class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    this.log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`, 'cyan');
    
    try {
      await testFunction();
      this.testResults.passed++;
      this.logSuccess(`${testName} - PASSED`);
      return true;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
      this.logError(`${testName} - FAILED: ${error.message}`);
      return false;
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'magenta');
    this.log('📊 RESUMEN DE TESTS', 'magenta');
    this.log('='.repeat(60), 'magenta');
    this.log(`Total de tests: ${this.testResults.total}`, 'white');
    this.logSuccess(`Tests exitosos: ${this.testResults.passed}`);
    this.logError(`Tests fallidos: ${this.testResults.failed}`);
    
    if (this.testResults.failed > 0) {
      this.log('\n❌ ERRORES ENCONTRADOS:', 'red');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`, 'red');
      });
    }

    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(2);
    this.log(`\n📈 Tasa de éxito: ${successRate}%`, successRate > 90 ? 'green' : 'yellow');
  }
}

// ============= TESTS DE DATABASE FUNCTIONS =============

class DatabaseFunctionTests {
  constructor(supabase) {
    this.supabase = supabase;
    this.runner = new TestRunner();
  }

  // Test de funciones de inventario
  async testInventarioFunctions() {
    await this.runner.runTest('Inventario - Obtener inventario completo', async () => {
      const { data, error } = await this.supabase.rpc('obtener_inventario_completo');
      if (error) throw new Error(error.message);
      
      // Validar que la respuesta tenga la estructura correcta
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Inventario obtenido: ${data.length} items`);
    });

    await this.runner.runTest('Inventario - Obtener estadísticas', async () => {
      const { data, error } = await this.supabase.rpc('obtener_estadisticas_inventario');
      if (error) throw new Error(error.message);
      
      // Validar estructura de estadísticas
      if (!data || typeof data !== 'object') {
        throw new Error('Las estadísticas deben ser un objeto');
      }
      
      this.runner.logInfo(`Estadísticas obtenidas correctamente`);
    });
  }

  // Test de funciones de scouts
  async testScoutFunctions() {
    await this.runner.runTest('Scouts - Obtener scouts activos', async () => {
      const { data, error } = await this.supabase.rpc('obtener_scouts', '{}');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Scouts obtenidos: ${data.length} scouts`);
    });

    await this.runner.runTest('Scouts - Obtener estadísticas generales', async () => {
      const { data, error } = await this.supabase.rpc('obtener_estadisticas_scouts_generales');
      if (error) throw new Error(error.message);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Las estadísticas deben ser un objeto');
      }
      
      this.runner.logInfo(`Estadísticas de scouts obtenidas correctamente`);
    });
  }

  // Test de funciones de asistencia
  async testAsistenciaFunctions() {
    await this.runner.runTest('Asistencia - Obtener asistencias', async () => {
      const filtros = JSON.stringify({
        fecha_desde: '2024-01-01',
        fecha_hasta: '2024-12-31'
      });
      
      const { data, error } = await this.supabase.rpc('obtener_asistencias', { p_filtros: filtros });
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Asistencias obtenidas: ${data.length} registros`);
    });

    await this.runner.runTest('Asistencia - Obtener estadísticas', async () => {
      const { data, error } = await this.supabase.rpc('obtener_estadisticas_asistencia_general');
      if (error) throw new Error(error.message);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Las estadísticas deben ser un objeto');
      }
      
      this.runner.logInfo(`Estadísticas de asistencia obtenidas correctamente`);
    });
  }

  // Test de funciones de presupuestos
  async testPresupuestoFunctions() {
    await this.runner.runTest('Presupuestos - Obtener presupuestos', async () => {
      const { data, error } = await this.supabase.rpc('obtener_presupuestos', '{}');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Presupuestos obtenidos: ${data.length} presupuestos`);
    });

    await this.runner.runTest('Presupuestos - Obtener resumen financiero', async () => {
      const { data, error } = await this.supabase.rpc('obtener_resumen_financiero_general');
      if (error) throw new Error(error.message);
      
      if (!data || typeof data !== 'object') {
        throw new Error('El resumen financiero debe ser un objeto');
      }
      
      this.runner.logInfo(`Resumen financiero obtenido correctamente`);
    });
  }

  // Test de funciones de dirigentes
  async testDirigentesFunctions() {
    await this.runner.runTest('Dirigentes - Obtener dirigentes', async () => {
      const { data, error } = await this.supabase.rpc('obtener_dirigentes', '{}');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Dirigentes obtenidos: ${data.length} dirigentes`);
    });
  }

  // Test de funciones de patrullas
  async testPatrullasFunctions() {
    await this.runner.runTest('Patrullas - Obtener patrullas', async () => {
      const { data, error } = await this.supabase.rpc('obtener_patrullas', '{}');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Patrullas obtenidas: ${data.length} patrullas`);
    });

    await this.runner.runTest('Patrullas - Obtener ranking', async () => {
      const { data, error } = await this.supabase.rpc('obtener_ranking_patrullas');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Ranking de patrullas obtenido: ${data.length} patrullas`);
    });
  }

  // Test de funciones de actividades
  async testActividadesFunctions() {
    await this.runner.runTest('Actividades - Obtener actividades', async () => {
      const { data, error } = await this.supabase.rpc('obtener_actividades_scout', '{}');
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Actividades obtenidas: ${data.length} actividades`);
    });

    await this.runner.runTest('Actividades - Obtener calendario', async () => {
      const fechaDesde = '2024-10-01';
      const fechaHasta = '2024-12-31';
      
      const { data, error } = await this.supabase.rpc('obtener_calendario_actividades', {
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      });
      
      if (error) throw new Error(error.message);
      
      if (!Array.isArray(data)) {
        throw new Error('La respuesta debe ser un array');
      }
      
      this.runner.logInfo(`Calendario obtenido: ${data.length} actividades programadas`);
    });
  }

  // Test de funciones de reportes
  async testReportesFunctions() {
    await this.runner.runTest('Reportes - Generar reporte estadístico completo', async () => {
      const fechaDesde = '2024-01-01';
      const fechaHasta = '2024-12-31';
      
      const { data, error } = await this.supabase.rpc('generar_reporte_estadistico_completo', {
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      });
      
      if (error) throw new Error(error.message);
      
      if (!data || typeof data !== 'object') {
        throw new Error('El reporte debe ser un objeto JSON');
      }
      
      this.runner.logInfo(`Reporte estadístico generado correctamente`);
    });

    await this.runner.runTest('Reportes - Analizar tendencias participación', async () => {
      const { data, error } = await this.supabase.rpc('analizar_tendencias_participacion', {
        p_periodo_meses: 12
      });
      
      if (error) throw new Error(error.message);
      
      if (!data || typeof data !== 'object') {
        throw new Error('El análisis debe ser un objeto JSON');
      }
      
      this.runner.logInfo(`Análisis de tendencias generado correctamente`);
    });
  }

  // Test de conexión y configuración
  async testConnection() {
    await this.runner.runTest('Conexión a Supabase', async () => {
      const { data, error } = await this.supabase.from('scouts').select('count').limit(1);
      
      if (error) {
        throw new Error(`Error de conexión: ${error.message}`);
      }
      
      this.runner.logInfo('Conexión a Supabase establecida correctamente');
    });
  }

  // Ejecutar todos los tests
  async runAllTests() {
    this.runner.log('\n🚀 INICIANDO VALIDACIÓN AUTOMATIZADA DE DATABASE FUNCTIONS', 'magenta');
    this.runner.log('=' .repeat(70), 'magenta');

    // Test de conexión
    await this.testConnection();

    // Tests por módulo
    await this.testInventarioFunctions();
    await this.testScoutFunctions();
    await this.testAsistenciaFunctions();
    await this.testPresupuestoFunctions();
    await this.testDirigentesFunctions();
    await this.testPatrullasFunctions();
    await this.testActividadesFunctions();
    await this.testReportesFunctions();

    // Mostrar resumen
    this.runner.printSummary();

    // Determinar si la validación fue exitosa
    if (this.runner.testResults.failed === 0) {
      this.runner.log('\n🎉 ¡TODAS LAS DATABASE FUNCTIONS ESTÁN FUNCIONANDO CORRECTAMENTE!', 'green');
      return true;
    } else {
      this.runner.log('\n⚠️  ALGUNAS DATABASE FUNCTIONS NECESITAN ATENCIÓN', 'yellow');
      return false;
    }
  }
}

// ============= EJECUCIÓN PRINCIPAL =============
async function main() {
  try {
    const tester = new DatabaseFunctionTests(supabase);
    const success = await tester.runAllTests();
    
    // Salir con código apropiado
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error fatal en el testing:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DatabaseFunctionTests };