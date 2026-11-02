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
- Dos perfiles de prueba, ver la sección siguiente.

### Perfiles de prueba

Los creé con los scripts que ya trae el repo (`create-demo-user` y `create-professor`). Solo existen en mi base local (`data/app.db`, que git ignora), así que no hay nada de esto en producción. Usan el dominio `.local` a propósito: el registro público solo acepta correos de la UIS, y así nadie los confunde con cuentas reales.

| | Estudiante | Profesor |
|---|---|---|
| Nombre | Estudiante Prueba | Profesor Prueba |
| Correo | `estudiante.prueba@gots.local` | `profesor.prueba@gots.local` |
| Contraseña | `GotsPrueba2026!` | `GotsPrueba2026!` |
| Rol en la web | `STUDENT` | `PROFESSOR` |
| Panel propio | `/dashboard` | `/profesor` |
| Labs (inventario, experimentos) | Sí, como miembro aprobado | Sí, como miembro aprobado |
| Labs: decide préstamos | No | Sí (responsable de préstamos) |
| Labs: administración | No | Sí |

Lo que comprobé: los dos inician sesión, cada uno entra a su panel y es redirigido si intenta entrar al del otro (el estudiante no puede abrir `/profesor`, y el profesor no abre `/dashboard`). Los permisos de Labs de la tabla los doy con variables de `.env.local` (`GOTS_LAB_LOCAL_FIXTURE_GRANTS`, `_PROFESSOR_IDS`, `_ADMIN_IDS`), que solo funcionan en modo desarrollo. Si se borra `data/app.db` hay que recrear los usuarios y actualizar esos ids.

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

### 5. Módulo de inventario: profesores primero y datos reales de GOTS-Lab (rama `feat/inventario-gots-lab`)

**Qué pasaba:**
1. En GOTS_LAB, entrar a Inventario te pide primero elegir el profesor del grupo, y solo entonces ves su inventario. En la plataforma se caía directo en un catálogo vacío-ish.
2. La base local del módulo solo tenía 4 equipos inventados (un láser, un kit de lentes con dos piezas), que es lo que traía el entorno de pruebas del repo. Nada de la distribución real de cajones y armarios.

**Qué hice:**
- **Paso de elección de profesor**, como en GOTS_LAB: la misma lista de 6 profesores y en el mismo orden (`lib/lab-group-professors.ts`). Al elegir a Rafael Torres, que es el único con inventario cargado, se abre su catálogo con un botón "Cambiar de profesor" y el título "Inventario a cargo de ...". Los otros cinco muestran "Próximamente" y, al pulsarlos, "Inventario en construcción", igual que el original. La estética es la de la plataforma nueva (las mismas tarjetas, bordes y colores del resto de Labs), no una copia del azul de GOTS_LAB. En el detalle de cada equipo también aparece "Inventario a cargo de".
- **Importación del inventario.** Escribí `scripts/import-gots-lab-inventory.mjs` (`npm run import-lab-inventory`). Lee `Inventario equipo Rafael.xlsx` y aplica las mismas reglas que los cuatro scripts originales de GOTS_LAB, para que el resultado sea el mismo y no una interpretación mía: columnas Cantidad / Referencia / Categoría / Descripción de cada cajón y armario, las cajas de Armario #2 (filas separadoras "Caja #1 de Lentes", etc., incluida la excepción de "Caja acromáticos"), y el desglose de los kits Thorlabs LSC01-A (10 lentes) y LSB04-A (35 lentes) en piezas sueltas. Los ids son deterministas, así que se puede reimportar sin duplicar.
- Genera `data/inventario_completo.json` en el mismo formato que ya espera `scripts/prepare-lab-inventory-import.mjs` (el que Kebin dejó preparado para producción), y con `--load-local` lo carga en la base local de Labs.
- Un cambio pequeño en `lib/lab-local-fixture-store.mjs`: si ya hay inventario real cargado, el almacén local deja de añadir sus 4 equipos de demostración, para que no se mezclen.
- Dejé la base local en un archivo persistente (`data/lab-fixture.sqlite`) en vez de `/tmp`, que el sistema puede borrar al reiniciar.

**Resultado:** 231 equipos principales y 45 piezas de kit (276 registros, 811 unidades en total), repartidos así: Armario #1 (23), Armario #2 (106), Armario #3 (33), Armario #4 (25), Cajón #1 (10), Cajón #2 (14), Cajón #3 (20). Las 7 ubicaciones, 38 categorías y las cajas de Lentes, Retardadores, Espejos y Divisores de haz salen en el catálogo. Lo comprobé desde la API con los dos usuarios de prueba, y los 50 tests siguen pasando.

**Observaciones sobre los datos:**
- **Las categorías del Excel tienen variantes de escritura.** Hay "Laseres", "Láseres", "láseres" y "lásers"; "Micro Desplazamientos", "Micro desplazamientos" y "Miro desplazamientos"; "Kits dilvulgación" y "Kits divulgativos"; "Opto mecáncia" y "Opto mecánica"; y fuentes/Fuentes. GOTS_LAB las muestra tal cual, y yo las respeté para que los dos sitios coincidan. Al filtrar por categoría, un mismo tipo de equipo queda partido en varias entradas. Lo ideal es corregir el Excel (o normalizarlas al importar), pero es decisión del grupo.
- **Esto sale del Excel, no de la base viva de GOTS_LAB.** No me conecté a Supabase (los propios documentos de la migración piden no tocarlo). Si en GOTS_LAB alguien cambió cantidades o añadió equipos directamente en la base después de importar el Excel, eso no está aquí. Vale la pena que alguien con acceso compare totales.
- **Sin fotos.** El Excel solo trae enlaces remotos (Thorlabs y similares) y la plataforma, a propósito, no usa enlaces remotos: espera imágenes WebP locales. Los equipos aparecen sin imagen hasta que se genere ese paquete de imágenes.
- **Solo Rafael tiene foto de perfil** en la tarjeta de profesor; para los otros usé un icono, como hace GOTS_LAB cuando no hay foto.

**Lo que NO hice, a propósito:** no toqué producción (Neon). La lista de profesores es una constante en el código, no una tabla, porque el esquema de producción de Labs no tiene tabla de profesores ni profesor por ubicación, y cambiar el esquema de producción no es algo que deba decidir yo solo. Para llevar este inventario a producción, el camino es el que dejó preparado Kebin: `inventario_completo.json` + imágenes, a través de `prepare-lab-inventory-import.mjs`. El JSON ya está listo para eso.

**Pendiente en este módulo:** el catálogo sigue siendo la versión compacta de la plataforma. GOTS_LAB tiene una cuadrícula con fotos, un modal con porcentaje de disponibilidad y un aviso de reservas activas, que aquí todavía no están.

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
