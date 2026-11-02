#!/usr/bin/env node
/**
 * Importa el inventario de GOTS_LAB a la plataforma. Dos fuentes posibles:
 *
 *   --source supabase (por defecto si existe data/supabase-export/)
 *       Lee el export de la base viva hecho con export-gots-lab-supabase.mjs.
 *       Es la fuente de verdad: conserva los ids originales, las categorías ya
 *       corregidas, las cajas, los kits y las imágenes.
 *   --source excel
 *       Reconstruye el inventario desde "Inventario equipo Rafael.xlsx" con las
 *       mismas reglas que los scripts originales de GOTS_LAB (seed-inventory,
 *       update-inventory-from-excel, assign-inventory-boxes y seed-lens-kits).
 *       Solo es un respaldo: el Excel quedó atrás respecto a la base viva.
 *
 * Reglas del Excel:
 *
 *   - Hoja "Cajones": cajones 1-3. Hoja "Armarios": armarios 1-4.
 *   - Cada sub-tabla: Cantidad, Referencia, Categoría, Imagen, Descripción.
 *   - Armario #2 trae filas separadoras "Caja ..." que agrupan piezas (cajas).
 *   - Los kits Thorlabs LSC01-A y LSB04-A se desglosan en lentes sueltas.
 *
 * Qué hace:
 *   1. Escribe un JSON canónico (mismo formato que consume
 *      scripts/prepare-lab-inventory-import.mjs) en --out.
 *   2. Con --load-local, además lo carga (upsert idempotente) en la base
 *      SQLite local de Labs (GOTS_LAB_LOCAL_FIXTURE_DB).
 *
 * No abre ninguna conexión a Supabase, Neon ni producción (el export de
 * Supabase es un paso aparte). Las URLs remotas de imagen se ignoran a propósito:
 * el import privado de la plataforma usa imágenes WebP locales.
 *
 * Uso:
 *   node scripts/import-gots-lab-inventory.mjs [--source supabase|excel] [--export-dir dir]
 *        [--xlsx ruta.xlsx] [--out data/inventario_completo.json] [--load-local]
 */
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ExcelJS from "exceljs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback
}
const xlsxPath = path.resolve(flag("--xlsx", path.join(root, "..", "GOTS_LAB", "Inventario equipo Rafael.xlsx")))
const outPath = path.resolve(flag("--out", path.join(root, "data", "inventario_completo.json")))
const loadLocal = args.includes("--load-local")
const exportDir = path.resolve(flag("--export-dir", path.join(root, "data", "supabase-export")))
const source = flag("--source", existsSync(path.join(exportDir, "inventory_items.json")) ? "supabase" : "excel")

const BUILDING = "EDIC 001"
const PROFESSOR = "Rafael Ángel Torres Amaris"

// Mismos grupos de columnas que scripts/update-inventory-from-excel.ts
const CAJONES = [
  { number: 1, cantidad: "C", ref: "D", cat: "E", desc: "G" },
  { number: 2, cantidad: "H", ref: "I", cat: "J", desc: "L" },
  { number: 3, cantidad: "M", ref: "N", cat: "O", desc: "Q" },
]
const ARMARIOS = [
  { number: 1, cantidad: "B", ref: "C", cat: "D", desc: "F" },
  { number: 2, cantidad: "G", ref: "H", cat: "I", desc: "K" },
  { number: 3, cantidad: "L", ref: "M", cat: "N", desc: "P" },
  { number: 4, cantidad: "Q", ref: "R", cat: "S", desc: "U" },
]

function cellText(value) {
  if (value === null || value === undefined) return null
  if (typeof value === "string") return value.trim() || null
  if (typeof value === "object") {
    if (typeof value.hyperlink === "string") return value.hyperlink.trim() || null
    if (typeof value.text === "string") return value.text.trim() || null
    if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("").trim() || null
    if (value.result !== undefined) return cellText(value.result)
  }
  return String(value).trim() || null
}
const cellNumber = (value) => {
  const raw = value && typeof value === "object" && "result" in value ? value.result : value
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null
}

// UUID determinista: reimportar produce siempre los mismos ids.
function stableId(...parts) {
  const h = createHash("sha1").update(["gots-lab-inventory", ...parts].join("|")).digest("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

function normalizeBoxCategory(text) {
  const t = text.toLowerCase()
  if (t.includes("retardador")) return "Retardadores"
  if (t.includes("lente")) return "Lentes"
  if (t.includes("espejo")) return "Espejos"
  if (t.includes("beam-splitter") || t.includes("beam splitter")) return "Divisores de haz"
  if (t.includes("acromátic") || t.includes("acromatic")) return "Lentes"
  return null
}

function readSheet(sheet, groups, firstRow, lastRow, tipo) {
  const rows = []
  for (const g of groups) {
    // Las cajas solo existen en Armario #2 (scripts/assign-inventory-boxes.ts).
    let box = null
    for (let r = firstRow; r <= lastRow; r++) {
      const cantidadRaw = sheet.getCell(`${g.cantidad}${r}`).value
      const quantityText = cellText(cantidadRaw)
      const reference = cellText(sheet.getCell(`${g.ref}${r}`).value)
      const category = cellText(sheet.getCell(`${g.cat}${r}`).value)
      const desc = cellText(sheet.getCell(`${g.desc}${r}`).value)
      if (!quantityText && !reference && !category && !desc) continue

      const isDivider = tipo === "armario" && g.number === 2 && quantityText === desc && desc === category && /^caja/i.test(desc || "")
      if (isDivider) {
        const boxCategory = normalizeBoxCategory(desc)
        box = boxCategory ? { label: desc, category: boxCategory } : null
        continue
      }
      let caja = null
      if (tipo === "armario" && g.number === 2 && box) {
        if (category === box.category) caja = box.label
        else box = null // ruptura estricta de la racha contigua
      }
      const quantity = cellNumber(cantidadRaw)
      if (!quantity || quantity <= 0) continue
      rows.push({ tipo, numero: g.number, fila: r, cantidad_total: quantity, referencia: reference, categoria: category, caja, nombre: desc || `Ítem en ${tipo === "cajon" ? "Cajón" : "Armario"} #${g.number}` })
    }
  }
  return rows
}

// Excepción documentada en GOTS_LAB: "Caja acromáticos" tiene dos filas ajenas
// intercaladas, así que sus dos lentes se asignan por referencia.
const ACROMATICOS = { label: "Caja acromáticos", references: ["AC254-040-B-ML", "AC127-030-B-ML"] }

// Referencias leídas de las tablas "Kit Components" de Thorlabs (seed-lens-kits.ts).
const FOCALS = ["25.4", "35", "50", "75", "100", "125", "150", "200", "250", "300", "400", "500", "750", "1000"]
const PX = ["LA1951-A", "LA1027-A", "LA1131-A", "LA1608-A", "LA1509-A", "LA1986-A", "LA1433-A", "LA1708-A", "LA1461-A", "LA1172-A", "LA1908-A", "LA1978-A", "LA1464-A", "LA1484-A"]
const BX = ["LB1761-A", "LB1811-A", "LB1471-A", "LB1901-A", "LB1676-A", "LB1904-A", "LB1437-A", "LB1945-A", "LB1056-A", "LB1779-A", "LB1391-A", "LB1869-A", "LB1475-A", "LB1409-A"]
const KITS = {
  "LSC01-A": [
    ["LA1145-A", "75"], ["LA1050-A", "100"], ["LA1384-A", "125"], ["LA1417-A", "150"], ["LA1979-A", "200"],
    ["LA1256-A", "300"], ["LA1725-A", "400"], ["LA1380-A", "500"], ["LA1727-A", "750"], ["LA1779-A", "1000"],
  ].map(([reference, f]) => ({ reference, label: `Lente plano-convexa Ø2" f=${f}mm` })),
  "LSB04-A": [
    ...FOCALS.map((f, i) => ({ reference: PX[i], label: `Lente plano-convexa Ø1" f=${f}mm` })),
    ...FOCALS.map((f, i) => ({ reference: BX[i], label: `Lente bi-convexa Ø1" f=${f}mm` })),
    ...[["LC2679-A", "-30"], ["LC1715-A", "-50"], ["LC1582-A", "-75"], ["LC1120-A", "-100"]].map(([reference, f]) => ({ reference, label: `Lente plano-cóncava Ø1" f=${f}mm` })),
    ...[["LD2297-A", "-25"], ["LD1464-A", "-50"], ["LD1170-A", "-75"]].map(([reference, f]) => ({ reference, label: `Lente bi-cóncava Ø1" f=${f}mm` })),
  ],
}

export async function parseInventory(file) {
  if (!existsSync(file)) throw new Error(`No encuentro el Excel en ${file}. Usa --xlsx para indicar la ruta.`)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file)
  const cajones = workbook.getWorksheet("Cajones")
  const armarios = workbook.getWorksheet("Armarios")
  if (!cajones || !armarios) throw new Error('El Excel debe tener las hojas "Cajones" y "Armarios".')
  const rows = [
    ...readSheet(cajones, CAJONES, 4, 40, "cajon"),
    ...readSheet(armarios, ARMARIOS, 5, 155, "armario"),
  ]
  for (const row of rows) if (row.referencia && ACROMATICOS.references.includes(row.referencia) && row.tipo === "armario" && row.numero === 2) row.caja = ACROMATICOS.label

  const warnings = []
  const records = rows.map((row) => {
    const ubicacion = { tipo: row.tipo, numero: row.numero, etiqueta: `${row.tipo === "cajon" ? "Cajón" : "Armario"} #${row.numero}`, edificio: BUILDING }
    return {
      id: stableId(row.tipo, row.numero, row.fila),
      nombre: row.nombre.slice(0, 255),
      referencia: row.referencia,
      descripcion: null,
      cantidad_total: row.cantidad_total,
      categoria: row.categoria,
      caja: row.caja,
      ubicacion,
      profesor: PROFESSOR,
      imagen_local: null,
    }
  })
  for (const [kitRef, children] of Object.entries(KITS)) {
    const parent = records.find((r) => r.referencia === kitRef)
    if (!parent) { warnings.push(`No encontré el kit ${kitRef} en el Excel; se omiten sus ${children.length} piezas.`); continue }
    parent.elementos_del_kit = children.map((c) => ({
      id: stableId("kit", kitRef, c.reference),
      nombre: c.label,
      referencia: c.reference,
      descripcion: null,
      cantidad_total: 1,
      categoria: "Lentes",
      caja: parent.caja,
      ubicacion: parent.ubicacion,
      profesor: PROFESSOR,
      imagen_local: null,
    }))
  }
  return { records, warnings }
}

/** Convierte el export de la base viva (JSON de Supabase) al formato canónico. */
export async function parseSupabaseExport(dir) {
  const read = async (name) => JSON.parse(await readFile(path.join(dir, name), "utf8"))
  const [items, locations, professors] = await Promise.all([read("inventory_items.json"), read("locations.json"), read("group_professors.json")])
  const locById = new Map(locations.map((l) => [l.id, l]))
  const profById = new Map(professors.map((p) => [p.id, p.full_name]))
  const warnings = []
  const toRecord = (item) => {
    const loc = locById.get(item.location_id)
    if (!loc) throw new Error(`Ubicación desconocida para ${item.id}`)
    const hasImage = existsSync(path.join(dir, "imagenes", `${item.id}.webp`))
    if (item.image_url && !hasImage) warnings.push(`Sin imagen descargada para ${item.id} (${item.name})`)
    return {
      id: item.id,
      nombre: item.name,
      referencia: item.reference?.trim() || null,
      descripcion: item.description?.trim() || null,
      cantidad_total: item.quantity_total,
      categoria: item.category || null,
      caja: item.box_label || null,
      ubicacion: { tipo: loc.type, numero: loc.number, etiqueta: loc.label, edificio: loc.building ?? null },
      profesor: profById.get(loc.professor_id) ?? null,
      imagen_local: hasImage ? `imagenes/${item.id}.webp` : null,
      creado_en: item.created_at,
      actualizado_en: item.updated_at,
    }
  }
  const parents = items.filter((i) => !i.kit_parent_id).map(toRecord)
  const byId = new Map(parents.map((p) => [p.id, p]))
  for (const child of items.filter((i) => i.kit_parent_id)) {
    const parent = byId.get(child.kit_parent_id)
    if (!parent) { warnings.push(`Pieza de kit sin padre: ${child.id}`); continue }
    ;(parent.elementos_del_kit ??= []).push(toRecord(child))
  }
  return { records: parents, warnings }
}

function summarize(records) {
  const all = records.flatMap((r) => [r, ...(r.elementos_del_kit ?? [])])
  const byLoc = new Map()
  for (const r of records) byLoc.set(r.ubicacion.etiqueta, (byLoc.get(r.ubicacion.etiqueta) ?? 0) + 1)
  return {
    filas_principales: records.length,
    piezas_de_kit: all.length - records.length,
    ubicaciones: Object.fromEntries([...byLoc].sort()),
    categorias: [...new Set(all.map((r) => r.categoria).filter(Boolean))].sort(),
    cajas: [...new Set(all.map((r) => r.caja).filter(Boolean))].sort(),
    con_imagen: all.filter((r) => r.imagen_local).length,
    unidades: all.reduce((n, r) => n + r.cantidad_total, 0),
  }
}

async function loadIntoLocalStore(records) {
  const { default: Database } = await import("better-sqlite3")
  const { createLocalLabFixtureStore } = await import("../lib/lab-local-fixture-store.mjs")
  const dbFile = process.env.GOTS_LAB_LOCAL_FIXTURE_DB
  if (!dbFile) throw new Error("Define GOTS_LAB_LOCAL_FIXTURE_DB (por ejemplo en .env.local) para --load-local.")
  const file = path.resolve(root, dbFile)
  await mkdir(path.dirname(file), { recursive: true })
  createLocalLabFixtureStore(file) // crea/actualiza el esquema
  const db = new Database(file)
  const upsertLocation = db.prepare(`INSERT INTO lab_fixture_locations (id,type,number,label,building,professor_name) VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET label=excluded.label, building=excluded.building, professor_name=excluded.professor_name`)
  const upsertItem = db.prepare(`INSERT INTO lab_fixture_inventory (id,name,location,available,quantity_total,reference,description,image_url,location_id,category,box_label,kit_parent_id)
    VALUES (?,?,?,1,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, location=excluded.location, quantity_total=excluded.quantity_total, reference=excluded.reference,
      description=excluded.description, image_url=excluded.image_url, location_id=excluded.location_id, category=excluded.category, box_label=excluded.box_label, kit_parent_id=excluded.kit_parent_id`)
  const locId = (u) => `gots-lab-${u.tipo}-${u.numero}`
  let items = 0
  const keep = new Set(records.flatMap((r) => [r.id, ...(r.elementos_del_kit ?? []).map((c) => c.id)]))
  let pruned = 0
  db.transaction(() => {
    // Quita lo importado antes con otra fuente (p. ej. ids del Excel) para no duplicar.
    const stale = db.prepare("SELECT id, kit_parent_id FROM lab_fixture_inventory WHERE id NOT LIKE 'fixture-%'").all().filter((row) => !keep.has(row.id))
    for (const row of stale.filter((r) => r.kit_parent_id).concat(stale.filter((r) => !r.kit_parent_id))) {
      db.prepare("DELETE FROM lab_fixture_inventory WHERE id=?").run(row.id); pruned++
    }
    for (const r of records) {
      upsertLocation.run(locId(r.ubicacion), r.ubicacion.tipo, r.ubicacion.numero, r.ubicacion.etiqueta, r.ubicacion.edificio, r.profesor)
      upsertItem.run(r.id, r.nombre, r.ubicacion.etiqueta, r.cantidad_total, r.referencia, r.descripcion, r.imagen_local ? `database:${r.id}` : null, locId(r.ubicacion), r.categoria, r.caja, null)
      items++
      for (const c of r.elementos_del_kit ?? []) {
        upsertItem.run(c.id, c.nombre, c.ubicacion.etiqueta, c.cantidad_total, c.referencia, c.descripcion, c.imagen_local ? `database:${c.id}` : null, locId(c.ubicacion), c.categoria, c.caja, r.id)
        items++
      }
    }
  })()
  db.close()
  return { file, items, eliminados_por_reemplazo: pruned }
}

const { records, warnings } = source === "supabase" ? await parseSupabaseExport(exportDir) : await parseInventory(xlsxPath)
await mkdir(path.dirname(outPath), { recursive: true })
await writeFile(outPath, JSON.stringify(records, null, 2) + "\n")
console.log(JSON.stringify({ fuente: source, origen: source === "supabase" ? exportDir : xlsxPath, json: outPath, ...summarize(records), avisos: warnings }, null, 2))
if (loadLocal) console.log("Base local:", JSON.stringify(await loadIntoLocalStore(records)))
