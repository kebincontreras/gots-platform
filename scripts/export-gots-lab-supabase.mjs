#!/usr/bin/env node
/**
 * Exporta, SOLO LECTURA, el inventario vivo de GOTS_LAB desde Supabase:
 * group_professors, locations e inventory_items, y descarga las imágenes de los
 * equipos (bucket público inventory-images).
 *
 * - Solo hace peticiones GET a la API REST de Supabase. No escribe nada allí.
 * - Las credenciales se leen en el momento de `GOTS_LAB/.env.local` (o de la
 *   ruta que se indique con --env). No se copian ni se imprimen.
 * - La salida va a data/supabase-export/ (ignorada por git).
 *
 * Uso: node scripts/export-gots-lab-supabase.mjs [--env ruta/.env.local] [--out dir] [--no-images]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback
}
const envPath = path.resolve(flag("--env", path.join(root, "..", "GOTS_LAB", ".env.local")))
const outDir = path.resolve(flag("--out", path.join(root, "data", "supabase-export")))
const withImages = !args.includes("--no-images")

const env = Object.fromEntries(
  (await readFile(envPath, "utf8")).split(/\r?\n/)
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")] }),
)
const base = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!base || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en " + envPath)
const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function fetchAll(table, order) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${base}/rest/v1/${table}?select=*&order=${order}`, { headers: { ...headers, Range: `${from}-${from + 999}`, "Range-Unit": "items" } })
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

await mkdir(path.join(outDir, "imagenes"), { recursive: true })
const professors = await fetchAll("group_professors", "display_order")
const locations = await fetchAll("locations", "type,number")
const items = await fetchAll("inventory_items", "created_at")
await writeFile(path.join(outDir, "group_professors.json"), JSON.stringify(professors, null, 2))
await writeFile(path.join(outDir, "locations.json"), JSON.stringify(locations, null, 2))
await writeFile(path.join(outDir, "inventory_items.json"), JSON.stringify(items, null, 2))

let downloaded = 0
const failed = []
if (withImages) {
  for (const item of items.filter((i) => i.image_url)) {
    try {
      // Dos filas de la base viva tienen image_url con el prefijo "upload:200 "
      // (resto de un script de subida); se extrae solo la URL.
      const url = item.image_url.match(/https?:\/\/\S+/)?.[0]
      if (!url) throw new Error("image_url sin URL válida")
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await writeFile(path.join(outDir, "imagenes", `${item.id}.webp`), Buffer.from(await res.arrayBuffer()))
      downloaded++
    } catch (e) { failed.push({ id: item.id, error: String(e.message ?? e) }) }
  }
}
console.log(JSON.stringify({
  profesores: professors.length, ubicaciones: locations.length, items: items.length,
  hijos_de_kit: items.filter((i) => i.kit_parent_id).length,
  con_imagen: items.filter((i) => i.image_url).length,
  image_url_corruptas: items.filter((i) => i.image_url && !/^https?:\/\//.test(i.image_url)).length, imagenes_descargadas: downloaded, imagenes_fallidas: failed.length,
  salida: outDir,
}, null, 2))
if (failed.length) console.log("Fallos de imagen:", JSON.stringify(failed.slice(0, 5)))
