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
3. **Supabase — rotate the `service_role` key** (it was shared in chat in
   Oct 2026). Update it in Vercel and in Edge Functions afterwards.
4. **Anthropic — check usage** for unexpected calls from the previously open
   scan endpoint, and set a usage limit.
5. **RevenueCat — set `REACT_APP_RC_API_KEY_ANDROID`** in the build
   environment, and add the iOS app/key when the iOS project exists.

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
