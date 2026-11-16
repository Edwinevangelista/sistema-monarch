// api/marcar-pagado.js
// POST /api/marcar-pagado — marca un pago como pagado desde una
// notificación push, CON LA APP CERRADA (Fase 2).
//
// REGLA ROJA: la app NUNCA mueve dinero. Esto solo ANOTA en la base
// de datos que Edwin ya pagó (en el banco / con autopay). No debita
// ninguna cuenta, no llama a Plaid, no crea un débito.
//
// Autenticación: SIN sesión (la app está cerrada, no hay JWT). La
// única credencial es el token firmado que el cron mete en el push
// (ver api/lib/marcarPagadoToken.js): HMAC-SHA256, atado a un solo
// pago (usuario, tipo, ítem, vencimiento, monto) y con expiración
// corta (vence + 3 días, máx 7 días desde la emisión). El endpoint:
//   1. verifica firma y expiración,
//   2. vuelve a leer el ítem en Supabase y comprueba que el usuario,
//      la fecha de vencimiento y el monto coinciden con el token,
//   3. re-chequea el estado (si ya está pagado, devuelve ok sin
//      duplicar),
//   4. marca con un UPDATE CONDICIONAL (solo si el estado previo
//      sigue siendo el del token): la atomicidad del UPDATE es la
//      idempotencia — tocar dos veces el botón no crea dos pagos.
//      Además se registra la huella del token en pagos_marcados_token
//      (migración supabase_marcar_pagado.sql) como auditoría; si esa
//      tabla aún no existe, se sigue con los chequeos de estado.
//
// Por qué NO se usa el RPC pagar_tarjeta para deudas: ese RPC exige
// auth.uid() = usuario (sesión) y una cuenta bancaria con fondos, y
// descuenta el saldo de esa cuenta. Aquí no hay sesión ni cuenta
// elegida. Se usa el flujo SIN CUENTA que la app ya tiene (el de
// Efectivo en DashboardCompleto.handleRegistrarPagoTarjeta): actualizar
// saldo/vence/ultimo_pago de la deuda y registrar en pagos_tarjetas
// con metodo 'Notificación'. Mismas fórmulas (calcularPagoMinimo y
// calcularProximoCorte, copiadas de src/utils/tarjetasCalculos.js).
//
// Suscripción: solo se avanza proximo_pago (lógica de
// useMonthlyTransition.calcularProximoPago). A diferencia del pago
// manual en la app, NO se descuenta el saldo de ninguna cuenta:
// desde la notificación no se sabe de qué cuenta se pagó, y la
// anotación es lo que importa. El saldo de la cuenta lo sigue
// manejando Edwin a mano, como hoy.
// Gasto fijo: solo estado 'Pagado', igual que onMarcarPagadoFijo.
//
// Errores genéricos a propósito: un token inválido, un ítem que no
// existe y un monto que no coincide devuelven el mismo 401, para no
// filtrar si un ítem existe o no.
//
// Rate-limit: en memoria, por huella de token (10 intentos/min) y por
// IP (30/min). Es best-effort por instancia (Vercel serverless no
// comparte memoria entre instancias); un límite distribuido queda
// pendiente y está documentado en SECURITY.md.
//
// ENV vars needed in Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY (como el resto de api/)
//   MARCAR_PAGADO_SECRET → valor aleatorio largo, solo en Vercel.
//     Si no está, se usa CRON_SECRET como fallback (se registra el
//     fallback en los logs, sin registrar el valor). Poner la variable
//     dedicada es lo recomendado (ver SECURITY.md).

const { createClient } = require('@supabase/supabase-js');
const {
  getMarcarPagadoSecret,
  verifyMarcarPagadoToken,
  tokenFingerprint,
  redondearMonto,
} = require('./lib/marcarPagadoToken');

// ── Fechas en America/New_York (misma copia mínima que cron) ─────────
const hoyNY = (fecha = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(fecha);
// ─────────────────────────────────────────────────────────────────────

// ── Fórmulas copiadas de src/utils/tarjetasCalculos.js (no inventadas) ─
const roundMoney = (n) => Math.round(Number(n || 0) * 100) / 100;

const calcularPagoMinimo = (saldo, apr = 0) => {
  const saldoNum = Number(saldo || 0);
  if (saldoNum <= 0) return 0;
  const aprDecimal = Number(apr || 0) > 1 ? Number(apr) / 100 : Number(apr || 0);
  const interesMes = saldoNum * (aprDecimal / 12);
  return roundMoney(Math.max(saldoNum * 0.02 + interesMes, 25));
};

const parseFechaLocal = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('T')[0].split(' ')[0].split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toISODateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calcularProximoCorte = (venceActual) => {
  if (!venceActual) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const corte = parseFechaLocal(venceActual);
  if (!corte) return null;
  corte.setHours(0, 0, 0, 0);
  while (corte <= hoy) corte.setMonth(corte.getMonth() + 1);
  return toISODateLocal(corte);
};

// Copiado de src/hooks/useMonthlyTransition.js (calcularProximoPago).
const calcularProximoPago = (fechaActual, ciclo) => {
  const fecha = new Date(String(fechaActual).split('T')[0] + 'T00:00:00');
  switch (ciclo) {
    case 'Mensual': fecha.setMonth(fecha.getMonth() + 1); break;
    case 'Anual': fecha.setFullYear(fecha.getFullYear() + 1); break;
    case 'Semanal': fecha.setDate(fecha.getDate() + 7); break;
    default: fecha.setMonth(fecha.getMonth() + 1);
  }
  return toISODateLocal(fecha);
};
// ─────────────────────────────────────────────────────────────────────

// Rate-limit en memoria (best-effort por instancia, ver cabecera).
const intentos = new Map(); // clave -> [timestamps ms]
const rateLimitOk = (clave, max, ventanaMs) => {
  const ahora = Date.now();
  const lista = (intentos.get(clave) || []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= max) return false;
  lista.push(ahora);
  intentos.set(clave, lista);
  // Limpieza ocasional para no crecer sin límite.
  if (intentos.size > 1000) {
    for (const [k, v] of intentos) {
      if (v.length === 0 || ahora - v[v.length - 1] > ventanaMs) intentos.delete(k);
    }
  }
  return true;
};

const montoCoincide = (a, b) => Math.abs(redondearMonto(a) - redondearMonto(b)) < 0.011;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate-limit antes de cualquier otra cosa.
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconocida')
    .toString().split(',')[0].trim();
  if (!rateLimitOk(`ip:${ip}`, 30, 60 * 1000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Inténtalo más tarde.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const token = body?.token;
  if (typeof token !== 'string' || !token) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  // Forma mínima del token (dos partes base64url) antes de mirar el
  // secreto: un token malformado es 401 aunque el servidor esté mal
  // configurado (eso es 500 y no debe filtrarse al cliente).
  const partesToken = token.split('.');
  if (partesToken.length !== 2 || !partesToken[0] || !partesToken[1]) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  if (!rateLimitOk(`token:${tokenFingerprint(token)}`, 10, 60 * 1000)) {
    return res.status(429).json({ error: 'Demasiados intentos. Inténtalo más tarde.' });
  }

  const secreto = getMarcarPagadoSecret();
  if (!secreto) {
    console.error('marcar-pagado: falta MARCAR_PAGADO_SECRET (y CRON_SECRET) en el entorno');
    return res.status(500).json({ error: 'No se pudo marcar el pago' });
  }
  if (secreto.source !== 'MARCAR_PAGADO_SECRET') {
    console.warn('marcar-pagado: usando CRON_SECRET como fallback; pon MARCAR_PAGADO_SECRET en Vercel');
  }

  const verificado = verifyMarcarPagadoToken(secreto.secret, token);
  if (!verificado.ok) {
    // Mismo error para firma mala, expirado o malformado: no filtrar.
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  const { u: userId, t: tipoItem, i: itemId, v: venceFecha, m: monto } = verificado.payload;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('marcar-pagado: faltan SUPABASE_URL / SUPABASE_SERVICE_KEY');
    return res.status(500).json({ error: 'No se pudo marcar el pago' });
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const hoyStr = hoyNY();

  try {
    let nombre = null;
    let yaProcesado = false;

    if (tipoItem === 'fijo') {
      const { data } = await supabase
        .from('gastos_fijos')
        .select('id, nombre, monto, estado, dia_venc, fecha_vencimiento')
        .eq('id', itemId).eq('user_id', userId).single();
      if (!data || !montoCoincide(data.monto, monto)) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      nombre = data.nombre;
      if (data.estado === 'Pagado') {
        yaProcesado = true;
      } else {
        // UPDATE condicional: solo si sigue Pendiente. Si otro intento
        // ya lo marcó, este update toca 0 filas.
        const { data: actualizado, error } = await supabase
          .from('gastos_fijos')
          .update({ estado: 'Pagado' })
          .eq('id', itemId).eq('user_id', userId).eq('estado', 'Pendiente')
          .select('id');
        if (error) throw error;
        yaProcesado = !actualizado || actualizado.length === 0;
      }
    } else if (tipoItem === 'suscripciones') {
      const { data } = await supabase
        .from('suscripciones')
        .select('id, servicio, costo, estado, proximo_pago, ciclo')
        .eq('id', itemId).eq('user_id', userId).single();
      if (!data || !montoCoincide(data.costo, monto)) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      nombre = data.servicio;
      const venceActual = String(data.proximo_pago).slice(0, 10);
      if (venceActual !== venceFecha) {
        // La fecha ya avanzó: alguien (o la app) ya lo marcó.
        yaProcesado = true;
      } else {
        const nuevoProximoPago = calcularProximoPago(data.proximo_pago, data.ciclo);
        const { data: actualizado, error } = await supabase
          .from('suscripciones')
          .update({ proximo_pago: nuevoProximoPago })
          .eq('id', itemId).eq('user_id', userId).eq('proximo_pago', data.proximo_pago)
          .select('id');
        if (error) throw error;
        yaProcesado = !actualizado || actualizado.length === 0;
      }
    } else if (tipoItem === 'deuda') {
      const { data } = await supabase
        .from('deudas')
        .select('id, cuenta, saldo, pago_minimo, vence, estado, apr')
        .eq('id', itemId).eq('user_id', userId).single();
      if (!data || !montoCoincide(data.pago_minimo, monto)) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      nombre = data.cuenta;
      const venceActual = String(data.vence).slice(0, 10);
      if (data.estado !== 'Activa' || Number(data.saldo || 0) <= 0 || venceActual !== venceFecha) {
        yaProcesado = true;
      } else {
        // Flujo sin cuenta (Efectivo) de la app: el pago mínimo reduce
        // el saldo y avanza el corte. NO se descuenta de ninguna cuenta
        // bancaria: desde la notificación no se sabe de cuál se pagó.
        const total = redondearMonto(monto);
        const esPagoCompleto = total >= Number(data.saldo || 0);
        const nuevoSaldo = esPagoCompleto ? 0 : roundMoney(Math.max(0, Number(data.saldo || 0) - total));
        const nuevoPagoMinimo = calcularPagoMinimo(nuevoSaldo, data.apr);
        const nuevoVence = esPagoCompleto ? data.vence : calcularProximoCorte(data.vence);

        const { data: actualizado, error: errorUpdate } = await supabase
          .from('deudas')
          .update({ saldo: nuevoSaldo, pago_minimo: nuevoPagoMinimo, ultimo_pago: hoyStr, vence: nuevoVence || data.vence })
          .eq('id', itemId).eq('user_id', userId).eq('vence', data.vence)
          .select('id');
        if (errorUpdate) throw errorUpdate;
        if (!actualizado || actualizado.length === 0) {
          yaProcesado = true;
        } else {
          // Registrar el pago (mismo insert que el flujo sin cuenta de
          // la app). Solo si no existe ya uno idéntico hoy.
          const { data: existente } = await supabase
            .from('pagos_tarjetas')
            .select('id')
            .eq('deuda_id', itemId).eq('user_id', userId)
            .eq('fecha', hoyStr).eq('monto_total', total).eq('metodo', 'Notificación')
            .limit(1);
          if (!existente || existente.length === 0) {
            const { error: errorPago } = await supabase.from('pagos_tarjetas').insert({
              user_id: userId,
              deuda_id: itemId,
              tarjeta: data.cuenta,
              monto: total,
              monto_total: total,
              a_principal: total,
              intereses: 0,
              metodo: 'Notificación',
              fecha: hoyStr,
              notas: 'Marcado desde notificación',
            });
            if (errorPago) throw errorPago;
          }
        }
      }
    } else {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Auditoría: registrar la huella del token (nunca el token). Si la
    // tabla aún no existe (migración sin correr), se sigue: los
    // chequeos de estado y los UPDATE condicionales ya impiden duplicar.
    try {
      const { error: errorAudit } = await supabase.from('pagos_marcados_token').insert({
        token_hash: tokenFingerprint(token),
        user_id: userId,
        tipo_item: tipoItem,
        item_id: itemId,
        vence_fecha: venceFecha,
        monto: redondearMonto(monto),
      });
      if (errorAudit) {
        if (errorAudit.code === '23505') yaProcesado = true;
        else console.warn('marcar-pagado: no se pudo auditar el token:', errorAudit.message);
      }
    } catch (e) {
      console.warn('marcar-pagado: auditoría no disponible:', e?.message);
    }

    return res.status(200).json({ ok: true, yaProcesado, nombre, monto: redondearMonto(monto), tipoItem });
  } catch (e) {
    console.error('marcar-pagado: error:', e?.message);
    return res.status(500).json({ error: 'No se pudo marcar el pago' });
  }
};
