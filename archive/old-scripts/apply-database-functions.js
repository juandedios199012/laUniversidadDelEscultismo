/**
 * =====================================================
 * 🚀 Script de Aplicación de Database Functions
 * =====================================================
 * 
 * Este script aplica las Database Functions necesarias
 * usando la conexión Supabase directamente desde Node.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = 'https://bbvbthspmemszazhiefy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmJ0aHNwbWVtc3phemhpZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDcxMzgsImV4cCI6MjA3NjEyMzEzOH0.ybMxMmS12f-I0y-n2_w9brkkjqmzqaQncQFFbsF0ro4';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Configurando Database Functions del Sistema Scout Lima 12...');

/**
 * Ejecutar un archivo SQL
 */
async function executeSQLFile(filePath, description) {
    try {
        console.log(`📋 Ejecutando: ${description}...`);
        
        // Leer el archivo SQL
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Dividir en statements individuales (aproximado)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT '))
            .slice(0, -1); // Remover último statement vacío
        
        console.log(`   📊 ${statements.length} statements encontrados`);
        
        // Ejecutar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE TYPE')) {
                console.log(`   🔧 Ejecutando statement ${i + 1}/${statements.length}...`);
                
                const { error } = await supabase.rpc('exec_sql', { 
                    sql_statement: statement + ';' 
                });
                
                if (error) {
                    console.log(`   ⚠️  Error en statement ${i + 1}: ${error.message}`);
                    // Continuar con el siguiente statement
                } else {
                    console.log(`   ✅ Statement ${i + 1} ejecutado correctamente`);
                }
            }
        }
        
        console.log(`✅ ${description} completado`);
        return true;
        
    } catch (error) {
        console.error(`❌ Error en ${description}:`, error.message);
        return false;
    }
}

/**
 * Aplicar esquema usando statements SQL básicos
 */
async function applyBasicSchema() {
    console.log('📋 Aplicando tipos enum básicos...');
    
    const basicTypes = [
        // Tipos de inventario
        `CREATE TYPE categoria_inventario_enum AS ENUM (
            'EQUIPOS_CAMPAMENTO',
            'MATERIAL_DEPORTIVO', 
            'HERRAMIENTAS',
            'MATERIAL_EDUCATIVO',
            'UNIFORMES_DISTINTIVOS',
            'COCINA_ALIMENTACION',
            'PRIMEROS_AUXILIOS',
            'MATERIAL_ARTISTICO',
            'MOBILIARIO',
            'ELECTRONICA',
            'LIMPIEZA_MANTENIMIENTO',
            'OFICINA_ADMINISTRACION',
            'OTROS'
        )`,
        
        `CREATE TYPE estado_item_enum AS ENUM (
            'DISPONIBLE',
            'PRESTADO',
            'EN_MANTENIMIENTO',
            'DAÑADO',
            'PERDIDO',
            'ELIMINADO'
        )`,
        
        `CREATE TYPE tipo_movimiento_enum AS ENUM (
            'ENTRADA',
            'SALIDA',
            'AJUSTE',
            'DEVOLUCION',
            'PERDIDA',
            'DAÑO',
            'MANTENIMIENTO'
        )`,
        
        `CREATE TYPE estado_prestamo_enum AS ENUM (
            'ACTIVO',
            'DEVUELTO',
            'PARCIAL',
            'VENCIDO',
            'PERDIDO'
        )`,
        
        // Tipos de scouts
        `CREATE TYPE rama_enum AS ENUM (
            'CASTORES',
            'LOBATOS',
            'SCOUTS',
            'VENTURES',
            'ROVERS'
        )`,
        
        `CREATE TYPE estado_scout_enum AS ENUM (
            'ACTIVO',
            'INACTIVO',
            'EGRESADO',
            'RETIRADO'
        )`
    ];
    
    for (const typeSQL of basicTypes) {
        try {
            const { error } = await supabase.rpc('exec_sql', { 
                sql_statement: typeSQL 
            });
            
            if (error && !error.message.includes('already exists')) {
                console.log(`   ⚠️  Error al crear tipo: ${error.message}`);
            } else {
                console.log(`   ✅ Tipo enum creado/verificado`);
            }
        } catch (error) {
            console.log(`   ⚠️  Error: ${error.message}`);
        }
    }
}

/**
 * Aplicar funciones directamente via Supabase Admin
 */
async function applyFunctionsDirectly() {
    console.log('🔧 Aplicando funciones de inventario directamente...');
    
    // Función básica de prueba
    const testFunction = `
        CREATE OR REPLACE FUNCTION test_database_connection()
        RETURNS JSON AS $$
        BEGIN
            RETURN json_build_object(
                'success', true,
                'message', 'Conexión a base de datos funcionando',
                'timestamp', NOW()
            );
        END;
        $$ LANGUAGE plpgsql;
    `;
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql_statement: testFunction 
        });
        
        if (error) {
            console.log(`❌ No se puede ejecutar SQL directamente: ${error.message}`);
            return false;
        } else {
            console.log(`✅ Función de prueba creada correctamente`);
            return true;
        }
    } catch (error) {
        console.log(`❌ Error al aplicar funciones: ${error.message}`);
        return false;
    }
}

/**
 * Verificar funciones existentes
 */
async function verifyExistingFunctions() {
    console.log('🔍 Verificando funciones existentes...');
    
    try {
        // Intentar llamar una función de prueba
        const { data, error } = await supabase.rpc('test_database_connection');
        
        if (error) {
            console.log(`❌ Error al verificar: ${error.message}`);
            return false;
        } else {
            console.log(`✅ Verificación exitosa:`, data);
            return true;
        }
    } catch (error) {
        console.log(`❌ Error en verificación: ${error.message}`);
        return false;
    }
}

/**
 * Script principal
 */
async function main() {
    console.log('🔗 Conectando a Supabase...');
    
    // 1. Verificar conexión básica
    try {
        const { data, error } = await supabase.from('scouts').select('count').limit(1);
        if (error) {
            console.log('⚠️  Tabla scouts no existe, aplicando esquema básico...');
        } else {
            console.log('✅ Conexión a Supabase establecida');
        }
    } catch (error) {
        console.log('⚠️  Error de conexión:', error.message);
    }
    
    // 2. Aplicar tipos básicos
    await applyBasicSchema();
    
    // 3. Intentar aplicar funciones directamente
    const canExecuteSQL = await applyFunctionsDirectly();
    
    if (canExecuteSQL) {
        // 4. Aplicar archivos de funciones
        const databasePath = path.join(__dirname, 'database');
        
        // Aplicar funciones de inventario
        const inventoryPath = path.join(databasePath, '05_functions_inventario.sql');
        if (fs.existsSync(inventoryPath)) {
            await executeSQLFile(inventoryPath, 'Funciones de Inventario');
        }
        
        // Aplicar funciones de scouts
        const scoutsPath = path.join(databasePath, '06_functions_scouts.sql');
        if (fs.existsSync(scoutsPath)) {
            await executeSQLFile(scoutsPath, 'Funciones de Scouts');
        }
    } else {
        console.log('ℹ️  No se pueden aplicar funciones via SQL directo');
        console.log('ℹ️  Usar Dashboard de Supabase para aplicar manualmente');
    }
    
    // 5. Verificar resultado
    await verifyExistingFunctions();
    
    console.log('');
    console.log('🎉 Proceso completado!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Abrir Dashboard de Supabase: https://supabase.com/dashboard');
    console.log('2. Ir a SQL Editor');
    console.log('3. Aplicar manualmente los archivos de Database Functions');
    console.log('4. Empezar con: database/01_schema.sql');
    console.log('5. Seguir con: database/05_functions_inventario.sql');
    console.log('6. Continuar con: database/06_functions_scouts.sql');
    console.log('');
    console.log('✅ El servidor web sigue ejecutándose en http://localhost:3000');
}

// Ejecutar script
main().catch(console.error);