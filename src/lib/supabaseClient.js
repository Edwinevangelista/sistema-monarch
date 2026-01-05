// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Faltan las variables de entorno de Supabase')
  console.error('Verifica que existan en tu archivo .env:')
  console.error('- REACT_APP_SUPABASE_URL')
  console.error('- REACT_APP_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})

// Log solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Supabase Client inicializado correctamente')
}