// Insertar datos de ejemplo en Supabase
// Ejecutar con: node insert-sample-data.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbvbthspmemszazhiefy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidmJ0aHNwbWVtc3phemhpZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDcxMzgsImV4cCI6MjA3NjEyMzEzOH0.ybMxMmS12f-I0y-n2_w9brkkjqmzqaQncQFFbsF0ro4';

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleData = [
  {
    nombre: 'Carpa 4 personas',
    categoria: 'camping',
    descripcion: 'Carpa impermeable para 4 personas, ideal para campamentos',
    cantidad: 5,
    cantidad_minima: 2,
    estado: 'disponible',
    ubicacion: 'Almacén Principal - Estante A',
    costo: 150.00
  },
  {
    nombre: 'Pañoleta Scout',
    categoria: 'ceremonial',
    descripcion: 'Pañoleta oficial del grupo scout',
    cantidad: 25,
    cantidad_minima: 10,
    estado: 'disponible',
    ubicacion: 'Oficina - Armario',
    costo: 15.00
  },
  {
    nombre: 'Botiquín Primeros Auxilios',
    categoria: 'primeros_auxilios',
    descripcion: 'Botiquín completo para emergencias',
    cantidad: 1,
    cantidad_minima: 2,
    estado: 'prestado',
    ubicacion: 'Con patrulla Águilas',
    costo: 80.00
  },
  {
    nombre: 'Balón de Fútbol',
    categoria: 'deportivo',
    descripcion: 'Balón oficial para actividades deportivas',
    cantidad: 3,
    cantidad_minima: 2,
    estado: 'disponible',
    ubicacion: 'Almacén Deportivo',
    costo: 45.00
  },
  {
    nombre: 'Cuerdas dinámicas 10mm',
    categoria: 'material_scout',
    descripcion: 'Cuerdas de escalada certificadas para actividades de altura',
    cantidad: 8,
    cantidad_minima: 5,
    estado: 'disponible',
    ubicacion: 'Almacén Secundario - Caja B3',
    costo: 180.00
  },
  {
    nombre: 'Cocina portátil a gas',
    categoria: 'camping',
    descripcion: 'Cocina de dos hornillas con regulador de gas',
    cantidad: 2,
    cantidad_minima: 1,
    estado: 'mantenimiento',
    ubicacion: 'Taller',
    costo: 85.00
  },
  {
    nombre: 'Insignias de Ramas',
    categoria: 'ceremonial',
    descripcion: 'Conjunto de insignias para diferentes ramas scout',
    cantidad: 50,
    cantidad_minima: 20,
    estado: 'disponible',
    ubicacion: 'Oficina - Cajón 1',
    costo: 8.00
  },
  {
    nombre: 'Kit de Supervivencia',
    categoria: 'material_scout',
    descripcion: 'Kit básico de supervivencia para actividades outdoor',
    cantidad: 4,
    cantidad_minima: 3,
    estado: 'disponible',
    ubicacion: 'Almacén Principal - Estante B',
    costo: 95.00
  }
];

async function insertSampleData() {
  console.log('🚀 Insertando datos de ejemplo en Supabase...');
  
  try {
    // Verificar si ya existen datos - consulta simple
    const { data: existingData, error: checkError } = await supabase
      .from('inventario')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error verificando datos existentes:', checkError.message);
      // Continuar de todas formas
    } else {
      console.log(`📊 Items actuales en la tabla: ${existingData?.length || 0}`);
      
      if (existingData && existingData.length > 0) {
        console.log('⚠️ Ya existen datos en la tabla. Procediendo con la inserción...');
      }
    }
    
    // Insertar datos de ejemplo
    console.log('📝 Insertando datos...');
    const { data, error } = await supabase
      .from('inventario')
      .insert(sampleData)
      .select();
    
    if (error) {
      console.error('❌ Error insertando datos:', error.message);
      console.error('Detalles:', error);
      return;
    }
    
    console.log('✅ Datos insertados exitosamente!');
    console.log(`📋 Se insertaron ${data.length} items:`);
    
    data.forEach(item => {
      console.log(`  ✓ ${item.nombre} (${item.categoria})`);
    });
    
    console.log('\n🎉 ¡Base de datos lista para usar!');
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
}

insertSampleData();