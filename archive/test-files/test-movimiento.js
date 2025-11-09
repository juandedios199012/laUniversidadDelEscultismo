// Test simple para movimientos
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testMovimiento() {
  console.log('🧪 Probando movimientos...');
  
  // Obtener un item
  const { data: items } = await supabase.from('inventario').select('id, nombre').limit(1);
  const item = items[0];
  console.log('📦 Item:', item.nombre);
  
  // Intentar insertar movimiento
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .insert({
      item_id: item.id,
      tipo: 'prestamo',
      cantidad: 1,
      usuario_id: 'test-user',
      destinatario: 'Juan Prueba',
      observaciones: 'Movimiento de prueba'
    })
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Insertado:', data);
  }
}

testMovimiento();