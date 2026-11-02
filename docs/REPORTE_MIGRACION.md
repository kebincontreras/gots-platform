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
- **Paso de elección de profesor**, como en GOTS_LAB: la misma lista de 6 profesores y en el mismo orden (`lib/lab-group-professors.ts`). Cada tarjeta muestra la foto del profesor. Al elegir a Rafael Torres, que es el único con inventario cargado, se abre su catálogo con un botón "Cambiar de profesor" y el título "Inventario a cargo de ...". Los otros cinco muestran "Próximamente" y, al pulsarlos, "Inventario en construcción", igual que el original. La estética es la de la plataforma nueva (las mismas tarjetas, bordes y colores del resto de Labs), no una copia del azul de GOTS_LAB. En el detalle de cada equipo también aparece "Inventario a cargo de".
- **Importación del inventario.** Escribí `scripts/import-gots-lab-inventory.mjs` (`npm run import-lab-inventory`). Lee `Inventario equipo Rafael.xlsx` y aplica las mismas reglas que los cuatro scripts originales de GOTS_LAB, para que el resultado sea el mismo y no una interpretación mía: columnas Cantidad / Referencia / Categoría / Descripción de cada cajón y armario, las cajas de Armario #2 (filas separadoras "Caja #1 de Lentes", etc., incluida la excepción de "Caja acromáticos"), y el desglose de los kits Thorlabs LSC01-A (10 lentes) y LSB04-A (35 lentes) en piezas sueltas. Los ids son deterministas, así que se puede reimportar sin duplicar.
- Genera `data/inventario_completo.json` en el mismo formato que ya espera `scripts/prepare-lab-inventory-import.mjs` (el que Kebin dejó preparado para producción), y con `--load-local` lo carga en la base local de Labs.
- Un cambio pequeño en `lib/lab-local-fixture-store.mjs`: si ya hay inventario real cargado, el almacén local deja de añadir sus 4 equipos de demostración, para que no se mezclen.
- Dejé la base local en un archivo persistente (`data/lab-fixture.sqlite`) en vez de `/tmp`, que el sistema puede borrar al reiniciar.

**Resultado de esta primera pasada (desde el Excel):** 231 equipos principales y 45 piezas de kit. Esta versión quedó superada por la entrada 6: después comparé con la base viva y el Excel estaba desactualizado.

**Observaciones sobre los datos (primera pasada):**
- Las categorías del Excel tenían variantes de escritura ("Laseres", "láseres", "lásers", "Opto mecáncia"...), 38 en total. En la base viva ya están corregidas (ver entrada 6).
- **Fotos de los profesores.** Uso las mismas que la página de Equipo (`public/team/<carpeta>/`). Hay foto para cinco de los seis; Jader Guerrero no tiene carpeta, así que su tarjeta lleva un icono. Ojo con un detalle que me cogió en una primera versión: `public/equipo.json` apunta la foto de Rafael a `/team/Rafael.JPG`, pero ese archivo no existe (está en `/team/Rafael torres amaris/Rafael.JPG`). La página de Equipo no se rompe porque resuelve las fotos con una tabla de alias en el código, pero el JSON tiene la ruta mal.

**Lo que NO hice, a propósito:** no toqué producción (Neon). La lista de profesores es una constante en el código, no una tabla, porque el esquema de producción de Labs no tiene tabla de profesores ni profesor por ubicación, y cambiar el esquema de producción no es algo que deba decidir yo solo. Para llevar este inventario a producción, el camino es el que dejó preparado Kebin: `inventario_completo.json` + imágenes, a través de `prepare-lab-inventory-import.mjs`. El JSON ya está listo para eso.

**Pendiente en este módulo:** el catálogo sigue siendo la versión compacta de la plataforma. GOTS_LAB tiene una cuadrícula con fotos, un modal con porcentaje de disponibilidad y un aviso de reservas activas, que aquí todavía no están.

### 6. Inventario desde la base viva de GOTS_LAB, con imágenes (rama `feat/inventario-desde-supabase`)

**Contexto:** como tengo autorización sobre el proyecto de Supabase de GOTS_LAB, comparé lo que había sacado del Excel con la base viva. Lo hice solo con lecturas (`GET` a la API REST), sin escribir nada allí. Las credenciales las toma el script en el momento desde `GOTS_LAB/.env.local`; no se copian a este repo ni se imprimen.

**Lo que encontré al comparar:**
- La base viva tiene **278 registros** (233 equipos principales + 45 piezas de kit, 815 unidades). El Excel daba 276, así que **estaba desactualizado**: hay equipos y ajustes de nombre y referencia posteriores. En los equipos que coinciden, las cantidades y las cajas son idénticas.
- Las **categorías ya están corregidas** en la base viva: 29, frente a las 38 que salían del Excel con erratas. Con esto, el problema que anoté en la entrada 5 queda resuelto sin tener que normalizar nada.
- **152 equipos tienen imagen** (WebP, 1 MB en total, ninguna pasa de 22 KB).
- **Dos filas tienen la URL de imagen corrupta** en la base viva: `image_url` empieza con `upload:200 https://...`, un resto de un script de subida. Las imágenes existen y se descargan extrayendo la URL, pero conviene limpiar esas dos filas en Supabase.
- Los 6 profesores están en `group_professors` en el mismo orden que usé (Rafael activo, los otros 5 inactivos). Ninguno tiene `image_url` en esa tabla, así que las fotos siguen saliendo de la página de Equipo.

**Qué hice:**
- `scripts/export-gots-lab-supabase.mjs` (`npm run export-lab-supabase`): exporta profesores, ubicaciones e inventario a `data/supabase-export/` y descarga las imágenes. Solo lectura.
- `scripts/import-gots-lab-inventory.mjs` ahora toma por defecto ese export (`--source supabase`), conserva **los ids originales** y las imágenes, y deja el Excel como respaldo (`--source excel`). Al cargar en local reemplaza lo importado antes, para no duplicar.
- Las imágenes se sirven en local desde una carpeta (`GOTS_LAB_LOCAL_INVENTORY_IMAGES`), solo en modo desarrollo, solo con sesión (sin ella devuelve 403) y validando que el id sea un UUID, para que no se pueda pedir otra ruta. El catálogo ya las muestra.
- Validé el `inventario_completo.json` resultante con `prepare-lab-inventory-import.mjs`, el script de Kebin para producción: acepta las 278 filas, 7 ubicaciones y 152 imágenes. Generé el SQL solo como archivo temporal para comprobarlo; no lo ejecuté contra ninguna base.

**Resultado:** el catálogo local muestra los 233 equipos con sus 29 categorías, las cajas, los dos kits (10 y 35 piezas) y 152 fotos.

**Pendiente / para decidir:**
- Producción sigue sin tocarse. Cuando el grupo decida llevar el inventario a Neon, el paquete (`data/inventario_completo.json` + `data/supabase-export/imagenes`) ya está listo para el script de Kebin.
- Limpiar en Supabase las dos `image_url` corruptas, si GOTS_LAB sigue en uso.
- Conviene rotar la clave `service_role` de Supabase cuando termine la migración, por higiene, ya que se ha usado desde varias herramientas.

### 7. Cuadrícula con fotos y modal de disponibilidad (rama `feat/inventario-cuadricula-modal`)

**Qué pasaba:** el catálogo de Labs era una lista compacta: una miniatura de 64 px junto a una línea de texto. GOTS_LAB tiene tarjetas con la foto arriba y un modal con la disponibilidad completa. Además había dos detalles que desentonaban:
- Todos los equipos decían "kit con 0 piezas". El motivo es que Postgres devuelve los conteos como texto (`"0"`), y en JavaScript el texto `"0"` cuenta como verdadero, así que la condición `kit_children_count ? ...` siempre se cumplía. En el almacén local de pruebas el valor llega vacío y no se nota, pero en producción sí.
- Los equipos sin foto quedaban sin nada en ese espacio.

**Qué hice** (`components/laboratory/lab-catalogue-workspace.tsx`, que de paso reescribí en un formato legible; antes era una sola línea por función):
- **Cuadrícula de tarjetas** (1, 2 o 3 columnas según el ancho), con la misma estructura que GOTS_LAB: foto arriba, nombre, referencia, categoría, descripción corta, ubicación con el edificio, "Disponible: x/y" y el botón "Ver disponibilidad". Estética de la plataforma nueva (sus tarjetas, bordes y colores). Las fotos se muestran completas sobre fondo blanco (`object-contain`) y no recortadas, porque son fotos de producto con fondo blanco y recortarlas cortaría los equipos. Si el equipo tiene unidades reservadas aparece una insignia.
- **Marcador "No hay imagen"** para los equipos sin foto (en este momento 81 de 233) y un esqueleto de carga mientras llegan los datos.
- **Modal de disponibilidad**, también como el original: foto, categoría, caja, descripción, piezas del kit con su estado (Disponible/Reservada), "Inventario a cargo de", ubicación, y los cuatro números (cantidad total, disponible, reservado y porcentaje disponible) con avisos cuando no queda nada o hay unidades reservadas. Mantuve lo que ya tenía la plataforma y GOTS_LAB no: el historial de reservas y el botón "Seleccionar para préstamo". Lo hice con el componente `Dialog` de la plataforma, que gestiona el foco, el cierre con Escape y la accesibilidad.
- El conteo de piezas del kit ahora se convierte a número antes de usarlo, y la etiqueta solo sale en los kits de verdad ("Kit · 10 piezas").
- Buscar con Enter, además del botón.

**Ajuste posterior (rama `fix/inventario-estilo-lista`):** al enseñarle la cuadrícula al responsable del proyecto prefirió el estilo de lista compacta que ya tenía la plataforma (la captura de referencia): dos columnas, miniatura de 64 px a la izquierda y tres líneas de texto (nombre; referencia · ubicación · categoría; "x/y disponibles · n reservadas"). Los equipos sin foto no llevan marcador, el texto simplemente empieza en el borde. Volví a ese estilo y conservé el modal de disponibilidad, que se abre al pulsar un equipo. La cuadrícula grande con fotos arriba ya no está en el código. En ese estilo "kit con N piezas" solo aparece cuando el equipo es un kit de verdad: la captura de referencia lo mostraba en todos ("kit con 0 piezas"), que era el bug del conteo como texto descrito arriba.

**Segundo ajuste (rama `fix/inventario-lista-mas-grande`):** la lista compacta quedaba pequeña para la cantidad de información que lleva cada equipo. Agrandé los elementos: miniatura de 112 px (antes 64) que ahora se ve completa sobre fondo blanco y no recortada, nombre en 20 px, la línea de referencia/ubicación/categoría en 16 px, la de disponibilidad en 18 px, más relleno y esquinas más redondeadas, con una altura mínima para que las tarjetas con y sin foto queden parejas. Sigue en dos columnas.

**Lo que comprobé:** `tsc` sin errores, lint sin errores, 50/50 tests, y desde la API: 152 equipos con foto y 81 sin ella, los dos kits con sus 10 y 35 piezas, y el detalle del kit con ubicación y historial.

**Lo que NO pude comprobar:** no he visto la pantalla renderizada. Este equipo no tiene Chrome y la captura automática con Brave se cuelga. Falta que alguien revise a ojo cómo queda en escritorio y en móvil, sobre todo el modal con un kit largo.

**Pendiente:** que se vea el estado de reservas de verdad. En el almacén local no hay solicitudes, así que la insignia "reservado" y los avisos del modal no se han visto con datos reales.

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
