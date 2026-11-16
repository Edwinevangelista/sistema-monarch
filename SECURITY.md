# FinTrack / FinGuide — Security notes (Fase 0)

## What was fixed in `security/fase-0`
- Removed committed secrets from code comments (cron secret, project URL).
  Rotate them anyway: anything once in git history must be treated as known.
- `api/scan-statement.js` now requires a Supabase session token, restricts
  CORS to the app origin, and rejects files over ~10 MB. It previously
  accepted calls from anyone, spending Anthropic credits.
- `api/create-checkout-session.js` now verifies the caller's Supabase JWT
  and checks that the token user matches `userId`/`userEmail`, and rejects
  redirect URLs outside the app. The frontend (`ModalUpgrade.jsx`) now sends
  the session token.
- `android/app/build.gradle` no longer contains keystore passwords in plain
  text. Signing reads `android/keystore.properties` (git-ignored) or
  environment variables. See `android/keystore.properties.example`.
- `src/hooks/useRevenueCat.js` no longer falls back to a hardcoded Android
  public key. Set `REACT_APP_RC_API_KEY_ANDROID` in the environment.
  The iOS key is still a placeholder until the iOS app exists in RevenueCat.
- The old Android keystore files are deleted in this branch
  (`android/app/finguide-release.keystore`, `.OLD`). They were in a public
  repo, so they are treated as compromised.

## Marcar pagado desde la notificación (Fase 2)
- `api/lib/marcarPagadoToken.js`: token HMAC-SHA256 atado a un solo pago
  (usuario, tipo, ítem, vencimiento, monto), expira a vence + 3 días y
  nunca vive más de 7 días. Lo firma el cron al armar cada push y lo
  verifica `api/marcar-pagado.js` (POST, sin sesión porque la app está
  cerrada). El endpoint vuelve a leer el ítem en Supabase, comprueba
  usuario/fecha/monto, y marca con un UPDATE condicional (la atomicidad
  es la idempotencia: tocar dos veces no duplica). La huella del token
  queda en `pagos_marcados_token` (migración `supabase_marcar_pagado.sql`).
- La app NUNCA mueve dinero: esto solo anota que Edwin ya pagó (en el
  banco / autopay). En deuda marca el pago mínimo con el flujo SIN
  CUENTA que la app ya tiene (el de Efectivo): reduce el saldo y avanza
  el corte, sin descontar de ninguna cuenta bancaria. El RPC
  `pagar_tarjeta` NO se puede usar aquí: exige sesión de usuario
  (auth.uid()) y una cuenta con fondos, y el service worker no tiene ni
  una ni otra. En suscripción solo avanza `proximo_pago`, sin descontar
  saldo de cuenta (a diferencia del pago manual en la app).
- Rate-limit en memoria en el endpoint (10 intentos/min por token,
  30/min por IP): best-effort por instancia de Vercel, no distribuido.
- **Variable nueva en Vercel: `MARCAR_PAGADO_SECRET`** (valor aleatorio
  largo, solo en Vercel, nunca en código). Si no está, se usa
  `CRON_SECRET` como fallback y queda registrado en los logs; sin
  ninguno, los avisos salen sin token ni botón de marcar pagado.

## What Edwin still has to do (in dashboards, never in chat)
1. **Android keystore — generate a NEW one** in Android Studio
   (Build > Generate Signed Bundle/APK > Create new) with new strong
   passwords. Save it outside the repo with a secure backup. If the app was
   never published to Google Play, the new keystore is safe to use. If it
   was already published with the old key, use Play Console key upgrade
   instead of just swapping files.
2. **Vercel — rotate `CRON_SECRET`** to a new long random value, and confirm
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` are set there.
   Also set the new **`MARCAR_PAGADO_SECRET`** (long random value, only in
   Vercel) for the "marcar pagado" tokens.
3. **Supabase — rotate the `service_role` key** (it was shared in chat in
   Oct 2026). Update it in Vercel and in Edge Functions afterwards.
4. **Anthropic — check usage** for unexpected calls from the previously open
   scan endpoint, and set a usage limit.
5. **RevenueCat — set `REACT_APP_RC_API_KEY_ANDROID`** in the build
   environment, and add the iOS app/key when the iOS project exists.
6. **Supabase — run 3 SQL files** in Dashboard → SQL Editor, in order:
   `supabase_remove_free_tier_limits.sql` (Fase 1: borra los triggers que
   bloquean la 3ª cuenta/deuda), `supabase_add_aviso_dias.sql` (Fase 1:
   columna aviso_dias) and `supabase_marcar_pagado.sql` (Fase 2: tabla de
   auditoría `pagos_marcados_token`).

## Notes
- Deleting the keystore files from this branch does NOT erase git history.
  The old keystore and old passwords remain in earlier commits. That is why
  rotation (new keystore + new passwords + new secrets) is the fix, not
  deletion alone.
- `supabase/functions/cron-alerts` and `send-push` (Edge Functions) were NOT
  changed in this branch. They still accept calls with CORS `*` and no
  shared-secret check. Review them separately before enabling them, or keep
  using the Vercel cron path (`api/cron-notifications.js`), which does check
  `CRON_SECRET`.
- `api/stripe-webhook.js` already verifies the Stripe signature — no change
  needed there.
