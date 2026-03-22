// src/lib/supabase.js
// Re-exporta desde supabaseClient para que todos los imports apunten
// a la misma instancia. Evita dos clientes Supabase con sesiones desincronizadas.
export { supabase } from './supabaseClient'
