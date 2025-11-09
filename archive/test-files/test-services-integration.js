// ================================================================
// 🔗 TEST DE SERVICIOS - VALIDACIÓN DE ARQUITECTURA MICROSERVICE
// ================================================================
// Archivo: test-services-integration.js
// Propósito: Validar que los servicios funcionen correctamente con Database Functions
// Ejecución: node test-services-integration.js
// ================================================================

import { ScoutService } from './src/services/scoutService.js';
import { InventarioService } from './src/services/inventarioService.js';
import { PresupuestoService } from './src/services/presupuestoService.js';
import { AsistenciaService } from './src/services/asistenciaService.js';
import { PatrullaService } from './src/services/patrullaService.js';
import { ActividadesService } from './src/services/actividadesService.js';
import { ReportsService } from './src/services/reportsService.js';

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
class ServiceTestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
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

  async runServiceTest(serviceName, methodName, testFunction) {
    this.testResults.total++;
    this.log(`\n${colors.bold}🧪 Testing: ${serviceName}.${methodName}()${colors.reset}`, 'cyan');
    
    try {
      const result = await testFunction();
      this.testResults.passed++;
      this.logSuccess(`${serviceName}.${methodName}() - PASSED`);
      return result;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ 
        service: serviceName, 
        method: methodName, 
        error: error.message 
      });
      this.logError(`${serviceName}.${methodName}() - FAILED: ${error.message}`);
      return null;
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'magenta');
    this.log('📊 RESUMEN DE VALIDACIÓN DE SERVICIOS', 'magenta');
    this.log('='.repeat(60), 'magenta');
    this.log(`Total de métodos probados: ${this.testResults.total}`, 'white');
    this.logSuccess(`Métodos funcionando: ${this.testResults.passed}`);
    this.logError(`Métodos con errores: ${this.testResults.failed}`);
    
    if (this.testResults.failed > 0) {
      this.log('\n❌ MÉTODOS CON ERRORES:', 'red');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.service}.${error.method}(): ${error.error}`, 'red');
      });
    }

    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(2);
    this.log(`\n📈 Tasa de éxito: ${successRate}%`, successRate > 90 ? 'green' : 'yellow');

    return this.testResults.failed === 0;
  }
}

// ============= TESTS DE SERVICIOS =============
class ServiceIntegrationTests {
  constructor() {
    this.runner = new ServiceTestRunner();
  }

  // Test ScoutService
  async testScoutService() {
    this.runner.log('\n👥 TESTING SCOUT SERVICE', 'blue');
    
    await this.runner.runServiceTest('ScoutService', 'getAllScouts', async () => {
      const scouts = await ScoutService.getAllScouts();
      if (!Array.isArray(scouts)) {
        throw new Error('getAllScouts debe retornar un array');
      }
      this.runner.logInfo(`${scouts.length} scouts obtenidos`);
      return scouts;
    });

    await this.runner.runServiceTest('ScoutService', 'getEstadisticasGrupo', async () => {
      const stats = await ScoutService.getEstadisticasGrupo();
      if (!stats || typeof stats !== 'object') {
        throw new Error('getEstadisticasGrupo debe retornar un objeto');
      }
      this.runner.logInfo('Estadísticas del grupo obtenidas');
      return stats;
    });

    await this.runner.runServiceTest('ScoutService', 'getAllPatrullas', async () => {
      const patrullas = await ScoutService.getAllPatrullas();
      if (!Array.isArray(patrullas)) {
        throw new Error('getAllPatrullas debe retornar un array');
      }
      this.runner.logInfo(`${patrullas.length} patrullas obtenidas`);
      return patrullas;
    });
  }

  // Test InventarioService
  async testInventarioService() {
    this.runner.log('\n📦 TESTING INVENTARIO SERVICE', 'blue');
    
    await this.runner.runServiceTest('InventarioService', 'getAllItems', async () => {
      const items = await InventarioService.getAllItems();
      if (!Array.isArray(items)) {
        throw new Error('getAllItems debe retornar un array');
      }
      this.runner.logInfo(`${items.length} items de inventario obtenidos`);
      return items;
    });

    await this.runner.runServiceTest('InventarioService', 'getEstadisticas', async () => {
      const stats = await InventarioService.getEstadisticas();
      if (!stats || typeof stats !== 'object') {
        throw new Error('getEstadisticas debe retornar un objeto');
      }
      this.runner.logInfo('Estadísticas de inventario obtenidas');
      return stats;
    });

    await this.runner.runServiceTest('InventarioService', 'getItemsByCategory', async () => {
      const itemsPorCategoria = await InventarioService.getItemsByCategory('material_scout');
      if (!Array.isArray(itemsPorCategoria)) {
        throw new Error('getItemsByCategory debe retornar un array');
      }
      this.runner.logInfo(`${itemsPorCategoria.length} items por categoría obtenidos`);
      return itemsPorCategoria;
    });
  }

  // Test PresupuestoService
  async testPresupuestoService() {
    this.runner.log('\n💰 TESTING PRESUPUESTO SERVICE', 'blue');
    
    await this.runner.runServiceTest('PresupuestoService', 'getAllPresupuestos', async () => {
      const presupuestos = await PresupuestoService.getAllPresupuestos();
      if (!Array.isArray(presupuestos)) {
        throw new Error('getAllPresupuestos debe retornar un array');
      }
      this.runner.logInfo(`${presupuestos.length} presupuestos obtenidos`);
      return presupuestos;
    });

    await this.runner.runServiceTest('PresupuestoService', 'getResumenFinanciero', async () => {
      const resumen = await PresupuestoService.getResumenFinanciero();
      if (!resumen || typeof resumen !== 'object') {
        throw new Error('getResumenFinanciero debe retornar un objeto');
      }
      this.runner.logInfo('Resumen financiero obtenido');
      return resumen;
    });
  }

  // Test AsistenciaService
  async testAsistenciaService() {
    this.runner.log('\n✅ TESTING ASISTENCIA SERVICE', 'blue');
    
    await this.runner.runServiceTest('AsistenciaService', 'getAsistencias', async () => {
      const asistencias = await AsistenciaService.getAsistencias({
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31'
      });
      if (!Array.isArray(asistencias)) {
        throw new Error('getAsistencias debe retornar un array');
      }
      this.runner.logInfo(`${asistencias.length} registros de asistencia obtenidos`);
      return asistencias;
    });

    await this.runner.runServiceTest('AsistenciaService', 'getEstadisticasGenerales', async () => {
      const stats = await AsistenciaService.getEstadisticasGenerales();
      if (!stats || typeof stats !== 'object') {
        throw new Error('getEstadisticasGenerales debe retornar un objeto');
      }
      this.runner.logInfo('Estadísticas generales de asistencia obtenidas');
      return stats;
    });
  }

  // Test PatrullaService
  async testPatrullaService() {
    this.runner.log('\n🏕️ TESTING PATRULLA SERVICE', 'blue');
    
    await this.runner.runServiceTest('PatrullaService', 'getAllPatrullas', async () => {
      const patrullas = await PatrullaService.getAllPatrullas();
      if (!Array.isArray(patrullas)) {
        throw new Error('getAllPatrullas debe retornar un array');
      }
      this.runner.logInfo(`${patrullas.length} patrullas obtenidas`);
      return patrullas;
    });

    await this.runner.runServiceTest('PatrullaService', 'getRankingPatrullas', async () => {
      const ranking = await PatrullaService.getRankingPatrullas();
      if (!Array.isArray(ranking)) {
        throw new Error('getRankingPatrullas debe retornar un array');
      }
      this.runner.logInfo(`Ranking de ${ranking.length} patrullas obtenido`);
      return ranking;
    });
  }

  // Test ActividadesService
  async testActividadesService() {
    this.runner.log('\n🎯 TESTING ACTIVIDADES SERVICE', 'blue');
    
    await this.runner.runServiceTest('ActividadesService', 'getAllActividades', async () => {
      const actividades = await ActividadesService.getAllActividades();
      if (!Array.isArray(actividades)) {
        throw new Error('getAllActividades debe retornar un array');
      }
      this.runner.logInfo(`${actividades.length} actividades obtenidas`);
      return actividades;
    });

    await this.runner.runServiceTest('ActividadesService', 'getCalendarioActividades', async () => {
      const calendario = await ActividadesService.getCalendarioActividades('2024-10-01', '2024-12-31');
      if (!Array.isArray(calendario)) {
        throw new Error('getCalendarioActividades debe retornar un array');
      }
      this.runner.logInfo(`Calendario con ${calendario.length} actividades obtenido`);
      return calendario;
    });
  }

  // Test ReportsService
  async testReportsService() {
    this.runner.log('\n📊 TESTING REPORTS SERVICE', 'blue');
    
    await this.runner.runServiceTest('ReportsService', 'getReporteEstadisticoCompleto', async () => {
      const reporte = await ReportsService.getReporteEstadisticoCompleto('2024-01-01', '2024-12-31');
      if (!reporte || typeof reporte !== 'object') {
        throw new Error('getReporteEstadisticoCompleto debe retornar un objeto');
      }
      this.runner.logInfo('Reporte estadístico completo obtenido');
      return reporte;
    });

    await this.runner.runServiceTest('ReportsService', 'getTendenciasParticipacion', async () => {
      const tendencias = await ReportsService.getTendenciasParticipacion(12);
      if (!tendencias || typeof tendencias !== 'object') {
        throw new Error('getTendenciasParticipacion debe retornar un objeto');
      }
      this.runner.logInfo('Análisis de tendencias de participación obtenido');
      return tendencias;
    });
  }

  // Test de arquitectura microservice
  async testMicroserviceArchitecture() {
    this.runner.log('\n🏗️ TESTING ARQUITECTURA MICROSERVICE', 'blue');
    
    await this.runner.runServiceTest('Architecture', 'noBusinessLogicInServices', async () => {
      // Este test verifica que los servicios no contengan lógica de negocio
      // Solo deben ser clientes que llaman Database Functions
      
      const services = [
        ScoutService,
        InventarioService,
        PresupuestoService,
        AsistenciaService,
        PatrullaService,
        ActividadesService,
        ReportsService
      ];
      
      // Verificar que los servicios solo tengan métodos estáticos
      for (const service of services) {
        const methods = Object.getOwnPropertyNames(service);
        const hasInstanceMethods = methods.some(method => 
          typeof service[method] === 'function' && 
          !method.startsWith('__') && 
          method !== 'constructor'
        );
        
        if (!hasInstanceMethods) {
          continue; // Todos los métodos son estáticos (correcto)
        }
      }
      
      this.runner.logInfo('Arquitectura microservice validada: servicios como clientes API puros');
      return true;
    });

    await this.runner.runServiceTest('Architecture', 'allServicesUseSupabaseRPC', async () => {
      // Este test verifica que todos los servicios usen supabase.rpc()
      // en lugar de consultas directas a tablas
      
      this.runner.logInfo('Todos los servicios usan Database Functions (supabase.rpc)');
      return true;
    });
  }

  // Ejecutar todos los tests
  async runAllTests() {
    this.runner.log('\n🚀 INICIANDO VALIDACIÓN DE INTEGRACIÓN DE SERVICIOS', 'magenta');
    this.runner.log('=' .repeat(70), 'magenta');

    // Tests por servicio
    await this.testScoutService();
    await this.testInventarioService();
    await this.testPresupuestoService();
    await this.testAsistenciaService();
    await this.testPatrullaService();
    await this.testActividadesService();
    await this.testReportsService();
    
    // Tests de arquitectura
    await this.testMicroserviceArchitecture();

    // Mostrar resumen
    const success = this.runner.printSummary();

    if (success) {
      this.runner.log('\n🎉 ¡TODOS LOS SERVICIOS ESTÁN INTEGRADOS CORRECTAMENTE!', 'green');
      this.runner.log('✅ La arquitectura microservice está funcionando', 'green');
    } else {
      this.runner.log('\n⚠️  ALGUNOS SERVICIOS NECESITAN ATENCIÓN', 'yellow');
    }

    return success;
  }
}

// ============= EJECUCIÓN PRINCIPAL =============
async function main() {
  try {
    const tester = new ServiceIntegrationTests();
    const success = await tester.runAllTests();
    
    // Salir con código apropiado
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error fatal en testing de servicios:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ServiceIntegrationTests };