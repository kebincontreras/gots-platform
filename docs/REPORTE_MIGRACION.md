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

### 3. Errores de TypeScript (rama `fix/typescript-errors`)
**Qué pasaba:** `next.config.mjs` tenía `ignoreBuildErrors: true`, así que el build salía bien aunque `npx tsc --noEmit` daba 38 errores. Eso es peligroso: no sabíamos si había bugs reales escondidos debajo.
**Causas (eran pocas):**
- Faltaban los paquetes de tipos `@types/bcryptjs` y `@types/better-sqlite3`, y `vaul` (que usa `components/ui/drawer.tsx`) ni siquiera estaba en `package.json`, aunque el componente lo importa.
- En `lib/store.ts`, las consultas a Postgres usaban `sql<Tipo>\`...\``, pero la versión actual del cliente de Neon no acepta genéricos ahí. Envolví el cliente en un tipo propio (`PgSql`); es solo de tipos, el comportamiento no cambia.
- `createNotification` obligaba a pasar `body`, `url` y `meta` aunque varios llamadores no los envían. Los hice opcionales. Además, en la rama de Postgres pasaba `undefined` directo a la consulta; ahora se convierte a `null`, como ya hacía la rama de SQLite. Este sí podía fallar en producción.
- `getUserIdsByEmails` recibía `string[]` pero se le pasaba una lista de solo lectura; ahora acepta `readonly string[]`.
- `localizeNewsItem` pedía `T & NewsFields`, y la interfaz local de noticias chocaba con eso. Bastaba con pedir `T`.
- Dos funciones de Labs en archivos `.mjs` tenían tipos mal inferidos (valores por defecto `null`); las anoté con JSDoc.
**Resultado:** `tsc` pasa de 38 errores a 0, el `build` de producción compila sin `ignoreBuildErrors` (lo quité para que no vuelva a esconderse nada), y los 50 tests siguen pasando.
**Ojo:** `package-lock.json` cambió bastante (varios cientos de líneas) porque mi versión de npm lo reescribe distinto a como estaba. Y `pnpm-lock.yaml` quedó desactualizado respecto a las tres dependencias nuevas. Hay que decidir qué gestor se usa de verdad (ver hallazgo 6).

### 4. `npm run lint` no funcionaba (rama `fix/eslint-config`)
**Qué pasaba:** el script `lint` existía, pero ESLint no estaba instalado como dependencia y no había archivo de configuración. `npx` descargaba la versión 10 sobre la marcha y se quejaba de que faltaba la migración a la configuración nueva. En la práctica, el proyecto nunca pasó un lint.
**Qué hice:** instalé `eslint@9` y `eslint-config-next@16.2.6` (la misma versión que Next) y creé `eslint.config.mjs`.
**Lo que apareció:** al ejecutarlo por primera vez salieron 361 problemas acumulados: 251 usos de `any`, 25 `setState` dentro de efectos, 25 `<img>` en lugar de `<Image>`, 23 `require()` en los scripts de Node, y poco más. Casi todo es estilo heredado de código generado, no bugs. Revisé a mano los pocos casos que podían serlo (los `<a>` del header, los `@ts-ignore` de katex, y el `Math.random` de `ui/sidebar.tsx`) y son intencionales o vienen de la plantilla de shadcn.
**Decisión:** dejé esas reglas como *aviso* en vez de error, y apagué `no-require-imports` en `scripts/` y en los `.mjs` de Labs, que son CommonJS por diseño. Resultado: 0 errores y 338 avisos que siguen a la vista. La idea es limpiarlos por tandas más adelante y endurecer las reglas cuando toque. No me pareció razonable tocar 300 sitios en esta ronda sin poder probar cada uno.

---

## Hallazgos pendientes

Lo que encontré en la primera pasada, ordenado más o menos por prioridad:

1. ~~Errores de TypeScript escondidos.~~ Resuelto, ver el punto 3 arriba.
2. ~~`npm run lint` no funciona.~~ Resuelto, ver el punto 4. Quedan 338 avisos por limpiar poco a poco.
3. **Páginas de GOTS_LAB que no existen todavía en la plataforma:** `/prestamos/solicitar`, `/prestamos/detalle`, `/experiments/new` (el wizard de 6 pasos), `/accompany`, `/profile`, `/report` y `/forgot-password`. Hay que decidir con el grupo cuáles son imprescindibles.
4. **`/ramas` devuelve 404.** Solo existe `/ramas/time-reverse-imaging`. Probablemente es normal, pero hay que confirmar que ningún enlace apunte a `/ramas`.
5. **Documentación desactualizada.** `README.md` y `DEPLOY.md` hablan de GitHub Pages, pero el sitio real está en Vercel.
6. **Dos lockfiles** (`package-lock.json` y `pnpm-lock.yaml`) y `package.json` declara `pnpm`. Hay que acordar uno solo, y fijar la versión de Node.
7. **Sin revisar todavía:** el aspecto en móvil y tablet, y los flujos de Labs con sesión iniciada (ahora que ya hay usuarios de prueba).
