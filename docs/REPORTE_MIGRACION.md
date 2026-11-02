# Reporte de revisión: migración de GOTS_LAB a gots-platform

Responsable: Jafert Serrano
Rama de trabajo: `Jafert_Pruebas` (un arreglo = una rama pequeña, que luego se fusiona aquí)
Inicio de la revisión: 2 de noviembre de 2026

Este documento es la bitácora de lo que voy encontrando y arreglando. La idea es que cualquiera del grupo pueda leerlo y entender qué cambió, por qué, y qué todavía está pendiente. Voy añadiendo entradas a medida que avanzo.

---

## Cómo está montado el entorno de pruebas

- El repo está clonado en `Desktop/U/gots-platform`, al lado de `GOTS_LAB`, que uso como referencia de cómo debe verse y comportarse la web.
- La web corre en local con `npm run dev` en http://localhost:3000.
- Node: con la versión 26 que tenía instalada no compila `better-sqlite3`, así que uso Node 22 (instalado con Homebrew, sin reemplazar el Node global). El CI del proyecto usa Node 20.
- Base de datos local: SQLite (`data/app.db`, ignorada por git). No toco la base de producción de Neon.
- Dos usuarios de prueba, solo existen en mi base local:

| Rol | Correo | Contraseña |
|---|---|---|
| Estudiante | `estudiante.prueba@gots.local` | `GotsPrueba2026!` |
| Profesor | `profesor.prueba@gots.local` | `GotsPrueba2026!` |

  Usan dominio `.local` a propósito: el registro público solo acepta correos de la UIS, y así no se confunden con cuentas reales. Se crearon con los scripts `create-demo-user` y `create-professor` que ya trae el repo.

---

## Cambios realizados

### 1. Logo animado de GOTS-Lab en la cabecera
**Qué pasaba:** GOTS_LAB tiene un logo animado (video) en la cabecera. En la plataforma, en ese mismo sitio solo había el texto "GOTS Group Research".
**Qué hice:** copié `logo.mp4` desde GOTS_LAB a `public/videos/` y lo puse en `components/header.tsx`, justo donde estaba el texto.
**Detalle a tener en cuenta:** el video tiene fondo blanco y no es transparente. En las páginas con cabecera sólida se ve limpio; sobre el hero oscuro de la portada se ve como un recuadro blanco (le puse las esquinas redondeadas para que parezca una insignia). Si en algún momento se quiere más pulido, habría que exportarlo con fondo transparente.

### 2. Título "Labs" cambiado por el logo animado
**Qué pasaba:** la portada de `/laboratorio` mostraba el texto "Labs" como título.
**Qué hice:** en `components/laboratory/lab-overview.tsx` cambié ese texto por el mismo logo animado. Dejé un `h1` oculto ("GOTS-Lab") para que lectores de pantalla y buscadores sigan encontrando el título.

---

## Hallazgos pendientes

Lo que encontré en la primera pasada, ordenado más o menos por prioridad:

1. **Errores de TypeScript escondidos.** `next.config.mjs` tiene `ignoreBuildErrors: true`, así que el build pasa aunque `tsc` reporta 38 errores (21 en `lib/store.ts`, el resto en rutas `/api/*`, `noticias` y `news-section`). Es lo que voy a atacar primero.
2. **`npm run lint` no funciona.** Falta la configuración que pide ESLint 9.
3. **Páginas de GOTS_LAB que no existen todavía en la plataforma:** `/prestamos/solicitar`, `/prestamos/detalle`, `/experiments/new` (el wizard de 6 pasos), `/accompany`, `/profile`, `/report` y `/forgot-password`. Hay que decidir con el grupo cuáles son imprescindibles.
4. **`/ramas` devuelve 404.** Solo existe `/ramas/time-reverse-imaging`. Probablemente es normal, pero hay que confirmar que ningún enlace apunte a `/ramas`.
5. **Documentación desactualizada.** `README.md` y `DEPLOY.md` hablan de GitHub Pages, pero el sitio real está en Vercel.
6. **Dos lockfiles** (`package-lock.json` y `pnpm-lock.yaml`) y `package.json` declara `pnpm`. Hay que acordar uno solo, y fijar la versión de Node.
7. **Sin revisar todavía:** el aspecto en móvil y tablet, y los flujos de Labs con sesión iniciada (ahora que ya hay usuarios de prueba).
