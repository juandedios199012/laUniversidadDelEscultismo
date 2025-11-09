import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        console.log('🔍 Verificando esquema de la tabla scouts...');
        
        // Intentar obtener información de la tabla scouts
        const { data, error } = await supabase
            .from('scouts')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Error al acceder a la tabla scouts:', error);
            
            // Verificar si es problema de cache del schema
            if (error.code === 'PGRST204') {
                console.log('🔄 Problema de cache del schema detectado');
                console.log('📋 Mensaje:', error.message);
            }
        } else {
            console.log('✅ Tabla scouts accessible');
            console.log('📊 Datos de prueba:', data);
        }
        
        // Verificar función api_registrar_scout
        console.log('🔍 Verificando función api_registrar_scout...');
        
        const { data: functionData, error: functionError } = await supabase.rpc('api_registrar_scout', {
            p_data: {
                nombres: 'TEST',
                apellidos: 'PRUEBA',
                fecha_nacimiento: '2010-01-01',
                documento_identidad: '12345678',
                sexo: 'MASCULINO'
            }
        });
        
        if (functionError) {
            console.error('❌ Error en función api_registrar_scout:', functionError);
        } else {
            console.log('✅ Función api_registrar_scout funciona');
            console.log('📊 Respuesta:', functionData);
        }
        
    } catch (err) {
        console.error('❌ Error general:', err);
    }
}

checkSchema();