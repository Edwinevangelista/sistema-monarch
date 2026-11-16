# FinGuide en iPhone — guía para la Mac

Esta carpeta `ios/` es el proyecto de FinGuide para iPhone. La app es la misma
que la web: se empaqueta con Capacitor. Nombre visible: **FinGuide**,
identificador `com.finguide.financeapp`, versión **2.4** (igual que Android).

> Lo que NO se hizo aquí: esta parte se preparó en Linux, que no tiene Xcode.
> Nadie compiló para iPhone todavía ni se probó en un teléfono. Los pasos de
> abajo son lo que falta para verla correr en tu iPhone 12 Pro Max.

## Lo que necesitas

- Una Mac con **Xcode** instalado (gratis en la App Store; usa la versión más
  nueva que puedas).
- **CocoaPods**: en la Terminal de la Mac, `sudo gem install cocoapods`
  (solo la primera vez).
- **Node.js** (el mismo que usas para la web) y tu **Apple ID** (el de siempre).
- Con tu Apple ID **gratis** puedes instalar la app en tu propio teléfono.
  Los **$99 al año** de Apple Developer solo hacen falta para TestFlight
  (probarla con otras personas) o para publicarla en la App Store.

## Pasos

### 1. Bajar el código

En la Terminal de la Mac:

```bash
git clone --branch security/fase-0 https://github.com/Edwinevangelista/sistema-monarch.git
cd sistema-monarch
npm install
```

### 2. Generar el icono y la pantalla de inicio

Los archivos de imagen (PNG) no viajaron con el código, así que se generan
aquí mismo a partir del logo que ya tiene el proyecto:

```bash
pip3 install Pillow   # solo si te dice que falta Pillow
python3 scripts/ios-icons.py
```

Esto crea el icono de la app y la pantalla de inicio (splash) con el logo de
FinGuide.

### 3. Armar la web e instalar las librerías de iOS

```bash
npm run build
npx cap sync ios
cd ios/App && pod install && cd ../..
```

### 4. Abrir el proyecto en Xcode

```bash
open ios/App/App.xcworkspace
```

> Abre el archivo `.xcworkspace`, no el `.xcodeproj`. Si abres el otro,
> las librerías (Pods) no cargan y el proyecto no compila.

### 5. Firmar con tu Apple ID

En Xcode, a la izquierda elige **App** (arriba del todo), luego la pestaña
**Signing & Capabilities**:

- Marca **Automatically manage signing**.
- En **Team** elige tu Apple ID (si no sale, Xcode → Settings → Accounts →
  pulsa `+` y entra con tu Apple ID).

### 6. Conectar tu iPhone y correrla

1. Conecta tu iPhone 12 Pro Max a la Mac con el cable.
2. En el iPhone, si pregunta, pulsa **Confiar** en la computadora.
3. En Xcode, arriba junto al botón de play (▶), elige tu iPhone.
4. Pulsa el botón de play (▶) o `Cmd + R`.
5. La primera vez el iPhone dirá que no confía en el desarrollador: ve a
   **Ajustes → General → VPN y gestión de dispositivos**, toca tu Apple ID
   y pulsa **Confiar**. Después abre FinGuide en el teléfono.

## Qué probar en el iPhone

1. Que la app abre y se ve el logo de FinGuide al arrancar.
2. Iniciar sesión y ver tus cuentas, gastos y deudas.
3. El lector de estados de cuenta (OCR): al elegir una foto debe pedirte
   permiso para la cámara o la fototeca, en español.
4. Que llegue un aviso de un pago próximo y que el botón **Marcar pagado**
   funcione con la app cerrada.
5. Cerrar un modal arrastrándolo hacia abajo y abrir el menú lateral con la
   hamburguesa.

## Cada vez que cambies el código web

```bash
npm run build
npx cap sync ios
```

Y vuelve a pulsar play en Xcode. No vuelvas a correr `npx cap add ios`:
la carpeta `ios/` ya existe y ese comando es solo para crearla la primera vez.

## Lo que todavía falta (no bloquea probarla en tu teléfono)

- **Notificaciones push remotas (APNs):** la app usa avisos locales, que
  funcionan sin nada más. Para que los avisos lleguen desde el servidor
  aunque la app lleve días cerrada hace falta una llave APNs de Apple.
  Eso se configura cuando se publique, no ahora.
- **Compras en iOS (RevenueCat):** la clave de iOS es todavía un texto
  provisional. Como todo en la app es gratis ahora, no bloquea nada. Cuando
  se quiera cobrar algo en iOS habrá que poner la clave real de RevenueCat.
- **Publicar en App Store:** hacen falta la cuenta Apple Developer ($99/año),
  el manifiesto de privacidad (qué datos recoge la app: tus datos financieros
  viven en Supabase) y las etiquetas de privacidad en App Store Connect.
  También hay que quitar el bloque `server` comentado de
  `capacitor.config.ts` antes de enviarla (ya está comentado, solo hay que
  no activarlo).
- **Detalle técnico:** el CLI de Capacitor instalado es 7.6 y el resto es
  8.2. Funciona, pero se recomienda igualarlo en algún momento con
  `npm install -D @capacitor/cli@^8.2.0`.

## Datos del proyecto

- iOS mínimo: **14.0**. Versión: **2.4** (build 15), igual que Android.
- Plugins instalados: App, Local Notifications, Push Notifications,
  Splash Screen, Status Bar y RevenueCat.
- Permisos que pide la app (en español, en `ios/App/App/Info.plist`):
  cámara y fototeca, solo para el lector de estados de cuenta (OCR).
  No pide ubicación, contactos ni micrófono.
