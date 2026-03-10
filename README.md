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
