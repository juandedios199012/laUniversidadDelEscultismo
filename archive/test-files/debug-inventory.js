// Debug: Verificar datos en Supabase vs React
// Ejecutar con: node debug-inventory.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbvbthspmemszazhiefy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmJ0aHNwbWVtc3phemhpZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDcxMzgsImV4cCI6MjA3NjEyMzEzOH0.ybMxMmS12f-I0y-n2_w9brkkjqmzqaQncQFFbsF0ro4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInventory() {
  console.log('🔍 Diagnosticando inventario...\n');
  
  try {
    // 1. Contar todos los registros
    console.log('📊 1. Contando todos los registros:');
    const { data: allItems, error: allError } = await supabase
      .from('inventario')
      .select('*');
    
    if (allError) {
      console.error('❌ Error:', allError.message);
      return;
    }
    
    console.log(`✅ Total registros en BD: ${allItems.length}`);
    
    // 2. Mostrar todos los registros
    console.log('\n📋 2. Lista completa de registros:');
    allItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.nombre} (${item.categoria}) - ${item.estado}`);
    });
    
    // 3. Probar la consulta que usa el componente React
    console.log('\n🔄 3. Probando consulta del componente React:');
    const { data: componentData, error: componentError } = await supabase
      .from('inventario')
      .select(`
        id,
        nombre,
        categoria,
        descripcion,
        cantidad,
        cantidad_minima,
        estado,
        ubicacion,
        costo,
        created_at,
        updated_at
      `);
    
    if (componentError) {
      console.error('❌ Error en consulta del componente:', componentError.message);
      return;
    }
    
    console.log(`✅ Registros devueltos por consulta React: ${componentData.length}`);
    
    // 4. Verificar diferencias
    if (allItems.length !== componentData.length) {
      console.log('\n⚠️ 4. DIFERENCIA DETECTADA:');
      console.log(`   - Consulta simple: ${allItems.length} registros`);
      console.log(`   - Consulta React: ${componentData.length} registros`);
      
      const missingItems = allItems.filter(item => 
        !componentData.some(compItem => compItem.id === item.id)
      );
      
      if (missingItems.length > 0) {
        console.log('\n🔍 Registros faltantes en consulta React:');
        missingItems.forEach(item => {
          console.log(`   - ${item.nombre}: ${JSON.stringify(item, null, 2)}`);
        });
      }
    } else {
      console.log('\n✅ 4. No hay diferencias - ambas consultas devuelven el mismo número');
    }
    
    // 5. Verificar políticas RLS
    console.log('\n🔒 5. Verificando posibles problemas de RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('inventario')
      .select('count');
    
    if (rlsError) {
      console.log(`⚠️ Posible problema RLS: ${rlsError.message}`);
    } else {
      console.log('✅ RLS funcionando correctamente');
    }
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

debugInventory();