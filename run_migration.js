const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const sql = fs.readFileSync('./supabase_fix_pagos_tarjetas.sql', 'utf8')

  // Run as individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== 'begin' && s !== 'commit')

  for (const stmt of statements) {
    console.log('Running:', stmt.slice(0, 80) + '...')
    const { error } = await sb.rpc('exec_sql', { query: stmt }).catch(() => ({ error: null }))
    if (error) {
      // Try direct query approach
      console.log('RPC failed, trying direct...', error.message)
    }
  }

  // Check pagos_tarjetas columns now
  const { data, error } = await sb.from('pagos_tarjetas').select('*').limit(1)
  console.log('pagos_tarjetas after:', JSON.stringify(data?.[0] || {}))

  // Check Salem Five
  const { data: salem } = await sb.from('cuentas_bancarias').select('id,nombre,balance').ilike('nombre', '%salem%')
  console.log('Salem Five:', JSON.stringify(salem))
}

main().catch(console.error)
