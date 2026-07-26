# Tracking · Manuel

App de seguimiento nutricional y de entrenamiento, construida con React + Vite. Registra comidas (en plan / off con severidad y postre), sueño, entrenamientos, y genera insights de compensación de fin de semana más un informe para el nutricionista.

Los datos se guardan localmente en el navegador (`localStorage`), no hay backend ni servidor: todo queda en tu dispositivo.

## Correr en local

Necesitás [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (normalmente `http://localhost:5173`).

## Build de producción

```bash
npm run build      # genera la carpeta dist/
npm run preview    # previsualiza el build localmente
```

## Subir a GitHub y publicar

### 1. Crear el repositorio

```bash
git init
git add .
git commit -m "Primera versión de la app de tracking"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/tracking-manuel.git
git push -u origin main
```

### 2. Ajustar el nombre del repo (importante)

El archivo `vite.config.js` tiene `base: '/tracking-manuel/'`. Ese valor **debe coincidir con el nombre exacto de tu repositorio**. Si lo llamaste distinto, editalo:

```js
base: '/NOMBRE-DE-TU-REPO/',
```

### 3. Activar GitHub Pages

En GitHub, andá a **Settings → Pages → Build and deployment** y elegí **GitHub Actions** como fuente. El workflow incluido (`.github/workflows/deploy.yml`) se encarga del resto: cada `push` a `main` compila y publica automáticamente.

Tu app va a quedar en:

```
https://TU-USUARIO.github.io/tracking-manuel/
```

### Alternativa manual (sin Actions)

Si preferís publicar a mano:

```bash
npm run deploy
```

Esto usa el paquete `gh-pages` para subir la carpeta `dist/` a la rama `gh-pages`. Después, en **Settings → Pages**, elegí esa rama como fuente.

## Estructura

```
src/
  main.jsx              punto de entrada
  App.jsx               shell + navegación por tabs
  styles.css            design system (tokens, componentes)
  components/
    Icon.jsx            íconos Font Awesome
    common.jsx          ProgressRing, helpers de UI
  data/
    plan.js             plan de Federico, escalas de comida/postre, ejercicios
  lib/
    helpers.js          fechas, estado, semáforo, insights
  screens/
    TodayScreen.jsx     registro diario + insight de finde
    CalendarScreen.jsx  vista semanal + semáforo por día
    GoalsScreen.jsx     metas de la semana
    GuideScreen.jsx     guía del plan nutricional
    SettingsScreen.jsx  plan de entrenos, ejercicios, informe
```

## Notas

- **Privacidad:** los registros viven solo en tu navegador. Si borrás los datos del sitio o cambiás de dispositivo, no se transfieren. Podés exportar el informe desde Ajustes.
- **Los insights son orientativos**, no reemplazan las indicaciones de tu nutricionista.
