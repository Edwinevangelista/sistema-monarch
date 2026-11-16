// api/lib/marcarPagadoToken.js
// Token firmado para "Marcar pagado desde la notificación con la app
// cerrada" (Fase 2). CommonJS puro (Node crypto, sin dependencias nuevas)
// para que lo usen tanto api/marcar-pagado.js como api/cron-notifications.js.
//
// El token es una capacidad (bearer) atada a UN solo pago:
//   { u: user_id, t: tipoItem, i: itemId, v: vence 'YYYY-MM-DD',
//     m: monto, iat: emitido ms, exp: expira ms }
// Formato: base64url(JSON payload) + '.' + base64url(HMAC-SHA256(secret, payload))
// No lleva datos sensibles: solo ids, fecha y monto del aviso que el
// usuario ya recibió en la notificación.
//
// Seguridad:
// - El secreto NUNCA va en código ni en el token. Se lee de
//   MARCAR_PAGADO_SECRET, con fallback documentado a CRON_SECRET.
//   Sin ninguno, el cron manda el aviso sin token y sin acción.
// - Expiración corta: vence + 3 días, y nunca más de 7 días desde que
//   se emite (el que sea antes). Un token robado caduca solo.
// - La firma cubre TODOS los campos: cambiar el monto, el ítem, la
//   fecha o el usuario invalida el token.
// - El token NO es una sesión: no da acceso a nada más. El endpoint
//   vuelve a leer el ítem en Supabase y re-chequea estado, fecha y
//   monto antes de marcar; si algo cambió, no marca.

const crypto = require('crypto');

const TIPOS_VALIDOS = ['fijo', 'suscripciones', 'deuda'];
const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_VIDA_MS = 7 * DIA_MS; // nunca más de 7 días desde la emisión
const VALIDEZ_TRAS_VENCE_MS = 3 * DIA_MS; // vence + 3 días

const b64urlEncode = (buf) => Buffer.from(buf).toString('base64url');
const b64urlDecode = (str) => Buffer.from(str, 'base64url');

const redondearMonto = (monto) => Math.round(Number(monto) * 100) / 100;

const esFechaValida = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));

// Lee el secreto del entorno. Devuelve { secret, source } o null.
// Fallback a CRON_SECRET solo si MARCAR_PAGADO_SECRET no existe: el
// cron ya usa ese secreto para autenticarse, pero conviene separar
// ambos (ver SECURITY.md). Los llamadores deben registrar qué fuente
// se usó, sin registrar el valor.
const getMarcarPagadoSecret = (env = process.env) => {
  if (env.MARCAR_PAGADO_SECRET) return { secret: env.MARCAR_PAGADO_SECRET, source: 'MARCAR_PAGADO_SECRET' };
  if (env.CRON_SECRET) return { secret: env.CRON_SECRET, source: 'CRON_SECRET (fallback)' };
  return null;
};

// Crea un token para un pago concreto. `ahoraMs` es inyectable para tests.
const createMarcarPagadoToken = (secret, { userId, tipoItem, itemId, venceFecha, monto }, ahoraMs = Date.now()) => {
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    throw new Error('Se necesita un secreto de al menos 16 caracteres');
  }
  if (!userId || !itemId) throw new Error('Faltan userId o itemId');
  if (!TIPOS_VALIDOS.includes(tipoItem)) throw new Error(`tipoItem inválido: ${tipoItem}`);
  if (!esFechaValida(venceFecha)) throw new Error(`venceFecha inválida: ${venceFecha}`);
  const montoNum = redondearMonto(monto);
  if (!Number.isFinite(montoNum) || montoNum <= 0) throw new Error('Monto inválido');

  const venceMs = Date.parse(venceFecha + 'T00:00:00Z');
  // Válido hasta el final del día vence+3 (en UTC), con tope de 7 días
  // desde la emisión.
  const exp = Math.min(venceMs + VALIDEZ_TRAS_VENCE_MS + DIA_MS - 1, ahoraMs + MAX_VIDA_MS);

  const payload = {
    u: String(userId),
    t: tipoItem,
    i: String(itemId),
    v: venceFecha,
    m: montoNum,
    iat: ahoraMs,
    exp,
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const firma = crypto.createHmac('sha256', secret).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(firma)}`;
};

// Verifica un token. Devuelve { ok: true, payload } o
// { ok: false, reason } con reason genérico ('invalido' | 'expirado' |
// 'malformado'). No distingue entre firma mala y campos manipulados:
// cualquier cambio invalida la firma y se reporta igual.
const verifyMarcarPagadoToken = (secret, token, ahoraMs = Date.now()) => {
  try {
    if (!secret || typeof token !== 'string') return { ok: false, reason: 'malformado' };
    const partes = token.split('.');
    if (partes.length !== 2) return { ok: false, reason: 'malformado' };
    const [payloadB64, firmaB64] = partes;
    if (!payloadB64 || !firmaB64) return { ok: false, reason: 'malformado' };

    const firmaEsperada = crypto.createHmac('sha256', secret).update(payloadB64).digest();
    const firmaRecibida = b64urlDecode(firmaB64);
    if (firmaRecibida.length !== firmaEsperada.length
      || !crypto.timingSafeEqual(firmaRecibida, firmaEsperada)) {
      return { ok: false, reason: 'invalido' };
    }

    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
    if (!payload || typeof payload !== 'object') return { ok: false, reason: 'malformado' };
    if (!payload.u || !payload.i || !TIPOS_VALIDOS.includes(payload.t)
      || !esFechaValida(payload.v) || !Number.isFinite(Number(payload.m))
      || !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) {
      return { ok: false, reason: 'malformado' };
    }
    if (ahoraMs > payload.exp) return { ok: false, reason: 'expirado' };
    payload.m = redondearMonto(payload.m);
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'malformado' };
  }
};

// Huella del token (sha256) para idempotencia y registro, sin guardar
// el token mismo. Mismo token = misma huella = mismo pago.
const tokenFingerprint = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

module.exports = {
  TIPOS_VALIDOS,
  getMarcarPagadoSecret,
  createMarcarPagadoToken,
  verifyMarcarPagadoToken,
  tokenFingerprint,
  redondearMonto,
};
