import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://loluismsoljdsoksuiei.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbHVpc21zb2xqZHNva3N1aWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NjU5NjksImV4cCI6MjA4MjU0MTk2OX0.VVw4acoZZayYs7ONe88-XjUXxXmFcyjPy2hJuq_-rDs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Obtener user_id del usuario autenticado desde localStorage
export const getCurrentUserId = () => {
  const user = localStorage.getItem('supabase_user')
  if (user) {
    try {
      const userData = JSON.parse(user)
      return userData.id
    } catch (e) {
      console.error('Error parsing user:', e)
    }
  }
  
  // Fallback para desarrollo (solo si no hay usuario)
  return '550e8400-e29b-41d4-a716-446655440000'
}
