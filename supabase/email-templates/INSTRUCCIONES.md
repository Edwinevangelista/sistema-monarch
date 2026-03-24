# Configurar templates de email en Supabase

## Paso 1 — Abrir el dashboard de Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto FinGuide
3. En el menú lateral: **Authentication** → **Email Templates**

---

## Paso 2 — Configurar cada template

### Template: "Confirm signup" (confirmación al registrarse)
1. Selecciona "Confirm signup" en el menú
2. Borra todo el contenido del editor HTML
3. Pega el contenido de `confirm-signup.html`
4. En "Subject" escribe: `Confirma tu cuenta — FinGuide`
5. Clic en **Save**

### Template: "Reset password" (olvidé mi contraseña)
1. Selecciona "Reset Password" en el menú
2. Borra todo el contenido del editor HTML
3. Pega el contenido de `reset-password.html`
4. En "Subject" escribe: `Restablecer tu contraseña — FinGuide`
5. Clic en **Save**

---

## Paso 3 — Email de bienvenida (requiere Edge Function)

El `welcome.html` se envía DESPUÉS de que el usuario confirma su cuenta.
Para activarlo, necesitas crear una Edge Function en Supabase:

### 3a — Crear la Edge Function
En el dashboard: **Edge Functions** → **New Function** → nombre: `send-welcome-email`

### 3b — Configurar un webhook de base de datos
En el dashboard: **Database** → **Webhooks** → **Create a new hook**
- Nombre: `on_user_confirmed`
- Tabla: `auth.users`
- Eventos: `UPDATE` (cuando se confirma el email)
- URL: `https://[tu-proyecto].supabase.co/functions/v1/send-welcome-email`

### 3c — Variables de entorno necesarias
En **Settings** → **Edge Functions** → **Environment Variables**:
```
RESEND_API_KEY=re_xxxx   (obtén una API key gratis en resend.com)
APP_URL=https://tu-dominio.com
```

---

## Paso 4 — Configurar SMTP personalizado (recomendado)

Para que los emails lleguen desde `noreply@finguide.app` en lugar de `noreply@mail.supabase.io`:

1. **Authentication** → **SMTP Settings**
2. Activa "Custom SMTP"
3. Usa Resend (resend.com) o SendGrid:
   - Resend: SMTP Host: `smtp.resend.com`, Port: `465`, User: `resend`, Pass: [tu API key]
4. "Sender name": `FinGuide`
5. "Sender email": `noreply@finguide.app` (debe estar verificado en tu dominio)

---

## Variables disponibles en los templates

| Variable | Descripción |
|----------|-------------|
| `{{ .Name }}` | Nombre del usuario |
| `{{ .Email }}` | Email del usuario |
| `{{ .ConfirmationURL }}` | URL de confirmación/reset |
| `{{ .SiteURL }}` | URL base de la app |
| `{{ .Token }}` | Token de verificación |
