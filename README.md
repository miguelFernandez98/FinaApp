# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # FinanzApp — Desarrollo y Build

    Aplicación híbrida PWA / Capacitor para gestión de finanzas personales (Ionic + React + TypeScript + Vite).

    Requisitos locales:
    - Node.js (v18+ recomendado)
    - npm
    - Android Studio (si vas a compilar para Android)

    Instalación inicial:

    ```bash
    npm install
    ```

    Modo desarrollo (Vite):

    ```bash
    npm run dev
    # Abre http://localhost:5173/
    # Para acceder desde otro dispositivo en la misma red:
    npm run dev -- --host
    ```

    Build web (producción):

    ```bash
    npm run build
    ```

    Capacitor — preparar Android (desde la raíz del proyecto):

    1) Inicializar Capacitor (si no lo hiciste):

    ```bash
    npx cap init FinanzApp com.finanzapp.app --web-dir=dist
    ```

    2) Construir la app web y copiar a la plataforma:

    ```bash
    npm run build
    npx cap copy
    npx cap sync
    ```

    3) Abrir proyecto Android en Android Studio:

    ```bash
    npx cap open android
    ```

    Desde Android Studio puedes ejecutar en un emulador AVD o dispositivo físico.

    Probar en Chrome (modo "móvil"):
    - Abre `http://localhost:5173/` en Chrome.
    - Abre DevTools (F12) y activa "Toggle device toolbar" (Ctrl+Shift+M) para emular un dispositivo móvil.

    Notas sobre `@capacitor/storage` y entorno de desarrollo:
    - Durante desarrollo la app usa `localStorage` como fallback si no hay plugin nativo.
    - Si quieres usar `@capacitor/storage` nativo instala la versión compatible con tu Capacitor (`npm install @capacitor/storage`) y ejecuta `npx cap sync`.

    Consejos de depuración y problemas comunes:
    - Si `vite` no se encuentra: asegúrate de haber corrido `npm install`.
    - Errores relacionados con `@capacitor/storage`: instala la versión compatible o usa el fallback `localStorage` en dev.
    - CORS al pedir tasas: usa una API que permita CORS o un proxy local durante desarrollo.

    Próximos pasos sugeridos (puedo implementarlos ahora):
    - Export / Import de datos (backup JSON).
    - Pulir estilos (Tailwind CSS o CSS Modules).
    - Preparar scripts de `package.json` para `cap:copy`, `cap:open`.

    Si quieres que prepare ahora el flujo de export/import o que añada scripts útiles en `package.json`, dime y lo hago.

    *** Fin de instrucciones ***

## Binance P2P / CORS (dev & production)

Binance P2P does not set CORS headers for browser requests, so direct calls from the web can be blocked.

- Development: the project includes a Vite dev-server proxy. When running locally (`npm run dev`) requests to `/binance-proxy/...` are forwarded to `https://p2p.binance.com/...` and avoid the browser CORS restriction.

- Production: you must use a server-side proxy or serverless function that forwards the request to Binance and returns the response with appropriate CORS headers. Below are quick options.

### Configure proxy in-app (Settings)

In `Settings` you can set a proxy URL that the app will use when not running on `localhost`. The app supports:

- A template containing `{"{url}"}` which will be replaced by the encoded target URL.
- A prefix that accepts the encoded target URL appended to it (for example `https://my-proxy.example.com/?url=`).

Example proxy value for a deployed function that forwards to Binance:

`https://your-deployed-proxy.example.com/api/binance-proxy`

After saving the proxy in Settings, use the "Actualizar tasas" button to test.

### Example: simple serverless proxy (Vercel / Netlify)

Create a serverless endpoint that forwards the POST body to Binance and sets CORS headers. Example for Vercel (create `api/binance-proxy.js` in a Vercel project):

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')
  try {
    const target = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'
    const r = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const data = await r.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(r.status).send(data)
  } catch (err) {
    console.error('proxy error', err)
    return res.status(500).json({ error: 'proxy failed' })
  }
}
```

Deployment notes:

- Vercel: put the file under `api/binance-proxy.js` in your repo and deploy to Vercel; the endpoint will be `https://<your-deployment>/api/binance-proxy`.
- Netlify: use Netlify Functions or a small lambda to forward the request similarly.
- Self-hosted: a tiny Express app with the same handler also works.

Security note: Do not enable unrestricted public proxies for general use. Restrict origins or add usage limits if exposing a public proxy.

If you want, I can add a ready-to-deploy Vercel function file to this repository and a short walkthrough for deploying it — tell me and I will add it.
