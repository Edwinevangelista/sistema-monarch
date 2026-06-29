import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const A = {
  email: process.env.RLS_TEST_A_EMAIL || 'test_a@monarch.test',
  password: process.env.RLS_TEST_A_PASSWORD,
};

const B = {
  email: process.env.RLS_TEST_B_EMAIL || 'test_b@monarch.test',
  password: process.env.RLS_TEST_B_PASSWORD,
};

const TEST_RUN = `rls-${Date.now()}`;

const tables = [
  {
    name: 'cuentas_bancarias',
    update: { balance: 0 },
    row: () => ({
      nombre: `cuenta-de-B-${TEST_RUN}`,
      tipo: 'checking',
      balance: 999,
    }),
  },
  {
    name: 'deudas',
    update: { saldo: 0 },
    row: () => ({
      cuenta: `tarjeta-de-B-${TEST_RUN}`,
      tipo: 'Tarjeta de Crédito',
      saldo: 999,
      apr: 0.24,
      pago_minimo: 25,
    }),
  },
  {
    name: 'gastos_variables',
    update: { monto: 0 },
    row: () => ({
      descripcion: `transaccion-de-B-${TEST_RUN}`,
      categoria: 'Prueba RLS',
      monto: 99,
      fecha: new Date().toISOString().slice(0, 10),
    }),
  },
  {
    name: 'movimientos_bancarios',
    update: { monto: 0 },
    row: () => ({
      tipo: 'gasto',
      monto: 88,
      descripcion: `movimiento-de-B-${TEST_RUN}`,
      cuenta_nombre: 'Cuenta prueba RLS',
    }),
  },
  {
    name: 'metas',
    update: { monto_actual: 0 },
    row: () => ({
      nombre: `meta-de-B-${TEST_RUN}`,
      tipo: 'ahorro',
      monto_objetivo: 1000,
      monto_actual: 100,
    }),
  },
  {
    name: 'suscripciones',
    update: { costo: 0 },
    row: () => ({
      servicio: `suscripcion-de-B-${TEST_RUN}`,
      categoria: '📦 Suscripciones',
      costo: 19.99,
      ciclo: 'Mensual',
      estado: 'Activo',
      proximo_pago: new Date().toISOString().slice(0, 10),
    }),
  },
  {
    name: 'gastos_fijos',
    update: { monto: 0 },
    row: () => ({
      nombre: `gasto-fijo-de-B-${TEST_RUN}`,
      categoria: 'Prueba RLS',
      monto: 199,
      estado: 'Pendiente',
      dia_venc: 15,
      recurrente: true,
    }),
  },
  {
    name: 'pagos_tarjetas',
    update: { monto: 0 },
    row: async ({ b, userId }) => {
      const { data: deuda, error: deudaError } = await b
        .from('deudas')
        .insert({
          user_id: userId,
          cuenta: `tarjeta-para-pago-B-${TEST_RUN}`,
          tipo: 'Tarjeta de Crédito',
          saldo: 300,
          apr: 0.24,
          pago_minimo: 25,
        })
        .select()
        .single();

      if (deudaError) throw deudaError;

      return {
        deuda_id: deuda.id,
        tarjeta: deuda.cuenta,
        monto: 50,
        principal: 50,
        interes: 0,
        metodo: 'Débito',
        fecha: new Date().toISOString().slice(0, 10),
        notas: `pago-de-B-${TEST_RUN}`,
      };
    },
  },
];

function requireEnv() {
  const missing = [];
  if (!URL) missing.push('REACT_APP_SUPABASE_URL or VITE_SUPABASE_URL');
  if (!ANON) missing.push('REACT_APP_SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
  if (!A.password) missing.push('RLS_TEST_A_PASSWORD');
  if (!B.password) missing.push('RLS_TEST_B_PASSWORD');
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
}

async function clientFor(creds) {
  const client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword(creds);
  if (error) throw new Error(`Login falló para ${creds.email}: ${error.message}`);
  return { client, user: data.user };
}

async function insertAsB(table, b, bUserId) {
  const rawRow = typeof table.row === 'function'
    ? await table.row({ b, userId: bUserId })
    : table.row;

  const row = { ...rawRow, user_id: bUserId };
  const { data, error } = await b.from(table.name).insert(row).select().single();
  if (error) throw error;
  if (!data?.id) throw new Error(`Insert en ${table.name} no devolvió id`);
  return data;
}

async function expectNoRows(label, promise) {
  const { data, error } = await promise;

  if (error) {
    return { ok: true, blockedByError: true, error: error.message };
  }

  const rowCount = Array.isArray(data) ? data.length : data ? 1 : 0;
  if (rowCount > 0) {
    return { ok: false, error: `${label} devolvió ${rowCount} fila(s)` };
  }

  return { ok: true, blockedByError: false };
}

async function cleanupB(tableName, b, id) {
  await b.from(tableName).delete().eq('id', id);
}

async function testTable(table, a, b, bUserId) {
  const result = {
    table: table.name,
    insertB: 'pending',
    read: 'pending',
    update: 'pending',
    delete: 'pending',
    errors: [],
  };

  let inserted;
  try {
    inserted = await insertAsB(table, b, bUserId);
    result.insertB = 'ok';
  } catch (error) {
    result.insertB = 'failed';
    result.errors.push(`B no pudo crear fixture: ${error.message}`);
    return result;
  }

  const attacks = [
    {
      key: 'read',
      run: () => expectNoRows(
        'SELECT cross-user',
        a.from(table.name).select('*').eq('id', inserted.id)
      ),
    },
    {
      key: 'update',
      run: () => expectNoRows(
        'UPDATE cross-user',
        a.from(table.name).update(table.update).eq('id', inserted.id).select()
      ),
    },
    {
      key: 'delete',
      run: () => expectNoRows(
        'DELETE cross-user',
        a.from(table.name).delete().eq('id', inserted.id).select()
      ),
    },
  ];

  for (const attack of attacks) {
    const attackResult = await attack.run();
    result[attack.key] = attackResult.ok ? 'pass' : 'fail';
    if (!attackResult.ok) result.errors.push(attackResult.error);
  }

  await cleanupB(table.name, b, inserted.id);
  return result;
}

function printReport(results) {
  console.table(results.map((r) => ({
    tabla: r.table,
    fixture_B: r.insertB,
    leer_A_B: r.read,
    modificar_A_B: r.update,
    borrar_A_B: r.delete,
  })));

  const failed = results.filter((r) =>
    r.insertB !== 'ok' || r.read !== 'pass' || r.update !== 'pass' || r.delete !== 'pass'
  );

  if (failed.length) {
    console.error('\n❌ RLS falló o no pudo probarse en:');
    for (const r of failed) {
      console.error(`- ${r.table}: ${r.errors.join('; ')}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('\n✅ RLS resistió todos los ataques');
}

async function run() {
  requireEnv();

  const { client: a } = await clientFor(A);
  const { client: b, user: userB } = await clientFor(B);

  const results = [];
  for (const table of tables) {
    results.push(await testTable(table, a, b, userB.id));
  }

  printReport(results);
}

run().catch((error) => {
  console.error('❌ Error ejecutando prueba RLS:', error.message);
  process.exit(1);
});
