// api/lib/marcarPagadoToken.test.js
// Tests del token firmado (node:test, sin dependencias).
// Correr: node --test api/lib/marcarPagadoToken.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMarcarPagadoToken,
  verifyMarcarPagadoToken,
  tokenFingerprint,
  getMarcarPagadoSecret,
} = require('./marcarPagadoToken');

const SECRET = 'secreto-de-prueba-largo-123456';
const OTRO_SECRETO = 'otro-secreto-largo-diferente-1';
const BASE = {
  userId: '11111111-1111-1111-1111-111111111111',
  tipoItem: 'deuda',
  itemId: '22222222-2222-2222-2222-222222222222',
  venceFecha: '2026-11-20',
  monto: 43,
};
// 18 nov 2026 12:00 UTC: antes del vencimiento.
const AHORA = Date.parse('2026-11-18T12:00:00Z');

test('token válido verifica y devuelve el payload exacto', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const r = verifyMarcarPagadoToken(SECRET, token, AHORA);
  assert.equal(r.ok, true);
  assert.equal(r.payload.u, BASE.userId);
  assert.equal(r.payload.t, 'deuda');
  assert.equal(r.payload.i, BASE.itemId);
  assert.equal(r.payload.v, '2026-11-20');
  assert.equal(r.payload.m, 43);
});

test('token expirado (después de vence + 3 días) se rechaza', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  // 24 nov 2026: vence 20 + 3 días = 23; el 24 ya expiró.
  const r = verifyMarcarPagadoToken(SECRET, token, Date.parse('2026-11-24T12:00:00Z'));
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'expirado');
});

test('token todavía válido en vence + 3 días', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const r = verifyMarcarPagadoToken(SECRET, token, Date.parse('2026-11-23T12:00:00Z'));
  assert.equal(r.ok, true);
});

test('nunca vive más de 7 días desde la emisión', () => {
  // Vence dentro de 30 días: sin tope viviría 33 días.
  const token = createMarcarPagadoToken(SECRET, { ...BASE, venceFecha: '2026-12-18' }, AHORA);
  const r = verifyMarcarPagadoToken(SECRET, token, AHORA + 7 * 24 * 60 * 60 * 1000 + 1000);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'expirado');
});

test('manipular el monto invalida el token', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const [payloadB64, firma] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  payload.m = 9999;
  const manipulado = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${firma}`;
  assert.equal(verifyMarcarPagadoToken(SECRET, manipulado, AHORA).ok, false);
});

test('manipular el ítem invalida el token', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const [payloadB64, firma] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  payload.i = '33333333-3333-3333-3333-333333333333';
  const manipulado = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${firma}`;
  assert.equal(verifyMarcarPagadoToken(SECRET, manipulado, AHORA).ok, false);
});

test('cambiar el usuario invalida el token', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const [payloadB64, firma] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  payload.u = '99999999-9999-9999-9999-999999999999';
  const manipulado = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${firma}`;
  assert.equal(verifyMarcarPagadoToken(SECRET, manipulado, AHORA).ok, false);
});

test('verificar con otro secreto falla', () => {
  const token = createMarcarPagadoToken(SECRET, BASE, AHORA);
  assert.equal(verifyMarcarPagadoToken(OTRO_SECRETO, token, AHORA).ok, false);
});

test('token malformado se rechaza sin romper', () => {
  for (const malo of ['', 'abc', 'a.b.c', '....', null, undefined, 123]) {
    assert.equal(verifyMarcarPagadoToken(SECRET, malo, AHORA).ok, false);
  }
});

test('mismo token = misma huella; token distinto = huella distinta', () => {
  const t1 = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const t2 = createMarcarPagadoToken(SECRET, BASE, AHORA);
  const t3 = createMarcarPagadoToken(SECRET, { ...BASE, monto: 50 }, AHORA);
  assert.equal(tokenFingerprint(t1), tokenFingerprint(t2));
  assert.notEqual(tokenFingerprint(t1), tokenFingerprint(t3));
  assert.equal(tokenFingerprint(t1).length, 64);
});

test('crear token con tipo, fecha o monto inválido lanza error', () => {
  assert.throws(() => createMarcarPagadoToken(SECRET, { ...BASE, tipoItem: 'otro' }, AHORA));
  assert.throws(() => createMarcarPagadoToken(SECRET, { ...BASE, venceFecha: '20-11-2026' }, AHORA));
  assert.throws(() => createMarcarPagadoToken(SECRET, { ...BASE, monto: 0 }, AHORA));
  assert.throws(() => createMarcarPagadoToken('corto', BASE, AHORA));
});

test('el secreto se lee de MARCAR_PAGADO_SECRET, con fallback a CRON_SECRET', () => {
  const r1 = getMarcarPagadoSecret({ MARCAR_PAGADO_SECRET: 'secreto-dedicado-123456', CRON_SECRET: 'secreto-cron-123456789' });
  assert.equal(r1.source, 'MARCAR_PAGADO_SECRET');
  const r2 = getMarcarPagadoSecret({ CRON_SECRET: 'secreto-cron-123456789' });
  assert.equal(r2.source, 'CRON_SECRET (fallback)');
  assert.equal(getMarcarPagadoSecret({}), null);
});

test('el monto se redondea a 2 decimales dentro del token', () => {
  const token = createMarcarPagadoToken(SECRET, { ...BASE, monto: 43.005 }, AHORA);
  const r = verifyMarcarPagadoToken(SECRET, token, AHORA);
  assert.equal(r.ok, true);
  assert.equal(r.payload.m, 43.01);
});
