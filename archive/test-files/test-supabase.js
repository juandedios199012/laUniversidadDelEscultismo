// Test de conexión con Supabase
// Ejecutar con: node test-supabase.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Credenciales directas (para prueba)
const supabaseUrl = 'https://bbvbthspmemszazhiefy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmJ0aHNwbWVtc3phemhpZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDcxMzgsImV4cCI6MjA3NjEyMzEzOH0.ybMxMmS12f-I0y-n2_w9brkkjqmzqaQncQFFbsF0ro4';

console.log('🔍 Probando conexión con Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'No encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📋 Probando consulta a la tabla inventario...');
    
    // Primero, una consulta simple para verificar conexión
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error en la consulta:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Primer item encontrado:`, data[0] ? data[0].nombre : 'No hay items');
    
    // Probar consulta de conteo
    console.log('\n🧪 Probando consulta de conteo...');
    const { data: countData, error: countError } = await supabase
      .from('inventario')
      .select('id');
    
    if (countError) {
      console.error('❌ Error en conteo:', countError.message);
      return false;
    }
    
    console.log('✅ Datos de ejemplo encontrados:');
    console.log(`📊 Total de items: ${countData.length}`);
    
    countData.slice(0, 3).forEach(item => {
      console.log(`  - ID: ${item.id.substring(0, 8)}...`);
    });
    
    return true;
    
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 ¡Supabase configurado correctamente!');
    console.log('🚀 Tu aplicación está lista para usar la base de datos real.');
  } else {
    console.log('\n💡 Verifica:');
    console.log('1. Las credenciales en .env.local');
    console.log('2. Que el script SQL se ejecutó correctamente');
    console.log('3. Las políticas RLS en Supabase');
  }
  process.exit(success ? 0 : 1);
});