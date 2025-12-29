import { createClient } from '@supabase/supabase-js'

// DEPURACIÓN: Vamos a ver qué está leyendo
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log("--- DEBUGGING SUPABASE ---");
console.log("URL:", supabaseUrl); // ¿Muestra undefined o la URL real?
console.log("KEY:", supabaseAnonKey); // ¿Muestra undefined o la Key?
console.log("-------------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Las variables de entorno no se cargaron. Verifica tu archivo .env");
}

export const supabase = createClient(supabaseUrl || 'https://temporal.com', supabaseAnonKey || 'temporal-key');

export const getCurrentUserId = async () => {
  return 'usuario-temporal-123';
}