// Script de prueba para verificar la conexión con la base de datos
import { createClient } from '@supabase/supabase-js';

// Configuración temporal para pruebas
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Probando conexión con Supabase...');
  
  try {
    // Verificar conexión básica
    console.log('📊 Verificando conexión...');
    const { data, error } = await supabase.from('scouts').select('count(*)').limit(1);
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      
      // Intentar crear tabla básica si no existe
      console.log('🔧 Intentando crear tabla scouts...');
      const { error: createError } = await supabase.rpc('create_scouts_table');
      
      if (createError) {
        console.log('⚠️ No se pudo crear la tabla, pero eso es normal si ya existe');
      }
    } else {
      console.log('✅ Conexión exitosa!');
      console.log('📊 Datos:', data);
    }
    
    // Probar funciones RPC
    console.log('🔍 Probando funciones RPC...');
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('api_buscar_scouts', {
      p_filtros: { estado: 'ACTIVO' }
    });
    
    if (rpcError) {
      console.log('⚠️ Función api_buscar_scouts no disponible:', rpcError.message);
      console.log('💡 Esto es normal, usaremos consultas directas');
    } else {
      console.log('✅ Función RPC funcionando!');
      console.log('📊 Resultado:', rpcData);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testConnection();