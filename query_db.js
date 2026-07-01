const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const { data, error } = await sb.from('pagos_tarjetas').select('*').limit(2)
  console.log('pagos_tarjetas sample:', JSON.stringify(data?.[0] || {}))
  console.log('error:', JSON.stringify(error))

  const { data: salem } = await sb.from('cuentas_bancarias').select('id,nombre,balance').ilike('nombre', '%salem%')
  console.log('Salem Five:', JSON.stringify(salem))
}
main().catch(console.error)
