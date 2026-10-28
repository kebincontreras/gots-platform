#!/usr/bin/env node
/**
 * Produces a single, reversible PostgreSQL transaction for the canonical
 * inventory export. It never opens a database connection and deliberately
 * ignores professor/profile fields and remote image URLs.
 *
 * Usage:
 *   node scripts/prepare-lab-inventory-import.mjs <inventario_completo.json> <imagenes-dir> <archive-sha256> <out.sql>
 */
import { createHash } from "node:crypto"
import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

const [jsonPath,imagesDir,archiveSha256,outPath]=process.argv.slice(2)
if(!jsonPath||!imagesDir||!archiveSha256||!outPath)throw new Error("usage: <inventario_completo.json> <imagenes-dir> <archive-sha256> <out.sql>")
if(!/^[a-f0-9]{64}$/i.test(archiveSha256))throw new Error("archive-sha256-invalid")

const quote=(value)=>value===null||value===undefined?"NULL":`'${String(value).replaceAll("'","''")}'`
const locationId=(location)=>`inventory-location-${location.tipo}-${location.numero}`
const webp=(bytes)=>bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP"
const records=JSON.parse(await readFile(jsonPath,"utf8"))
if(!Array.isArray(records))throw new Error("inventory-json-array-required")
const rows=[]
for(const parent of records){
  rows.push({...parent,kit_parent_id:null})
  for(const child of parent.elementos_del_kit??[])rows.push({...child,ubicacion:child.ubicacion??parent.ubicacion,kit_parent_id:parent.id})
}
const ids=new Set()
for(const row of rows){
  if(!/^[0-9a-f-]{36}$/i.test(row.id)||ids.has(row.id))throw new Error("inventory-id-invalid-or-duplicate")
  ids.add(row.id)
  if(typeof row.nombre!=="string"||!row.nombre.trim())throw new Error(`inventory-name-invalid:${row.id}`)
  if(!Number.isInteger(row.cantidad_total)||row.cantidad_total<0)throw new Error(`inventory-quantity-invalid:${row.id}`)
  if(!row.ubicacion||!['armario','cajon'].includes(row.ubicacion.tipo)||!Number.isInteger(row.ubicacion.numero))throw new Error(`inventory-location-invalid:${row.id}`)
}
const locations=[...new Map(rows.map(row=>{const location=row.ubicacion;return [`${location.tipo}:${location.numero}`,location]})).values()]
const imageNames=new Set(await readdir(imagesDir))
const images=[]
for(const row of rows){
  const local=row.imagen_local
  if(!local)continue
  const fileName=path.basename(local)
  if(fileName!==local.replace(/^imagenes\//,"")||!imageNames.has(fileName))throw new Error(`inventory-image-path-invalid:${row.id}`)
  const bytes=await readFile(path.join(imagesDir,fileName))
  if(!webp(bytes)||bytes.length>5*1024*1024)throw new Error(`inventory-image-invalid:${row.id}`)
  images.push({id:row.id,bytes,sha256:createHash("sha256").update(bytes).digest("hex")})
}
const importedAt=new Date().toISOString()
const sql=[
  "-- Generated from canonical inventario_completo.json. Do not edit or run against another database.",
  "BEGIN;",
  "LOCK TABLE lab_locations, lab_inventory_items, lab_inventory_images, lab_inventory_imports IN SHARE ROW EXCLUSIVE MODE;",
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM lab_inventory_imports WHERE source_sha256 <> ${quote(archiveSha256.toLowerCase())}) THEN RAISE EXCEPTION 'another inventory import is already registered'; END IF; END $$;`,
]
for(const location of locations)sql.push(`INSERT INTO lab_locations(id,type,number,label,building,created_at) VALUES(${quote(locationId(location))},${quote(location.tipo)},${location.numero},${quote(location.etiqueta)},${quote(location.edificio??null)},${quote(importedAt)}) ON CONFLICT(type,number) DO NOTHING;`)
for(const row of rows){
  const image=images.find(value=>value.id===row.id)
  sql.push(`INSERT INTO lab_inventory_items(id,location_id,reference,name,description,quantity_total,image_path,category,box_label,kit_parent_id,created_at,updated_at) VALUES(${quote(row.id)},${quote(locationId(row.ubicacion))},${quote(row.referencia??null)},${quote(row.nombre)},${quote(row.descripcion??null)},${row.cantidad_total},${quote(image?`database:${row.id}`:null)},${quote(row.categoria??null)},${quote(row.caja??null)},${quote(row.kit_parent_id)},${quote(row.creado_en??importedAt)},${quote(row.actualizado_en??row.creado_en??importedAt)}) ON CONFLICT(id) DO NOTHING;`)
}
for(const image of images)sql.push(`INSERT INTO lab_inventory_images(inventory_item_id,media_type,size_bytes,sha256,content,created_at) VALUES(${quote(image.id)},'image/webp',${image.bytes.length},${quote(image.sha256)},decode(${quote(image.bytes.toString("base64"))},'base64'),${quote(importedAt)}) ON CONFLICT(inventory_item_id) DO NOTHING;`)
sql.push(`INSERT INTO lab_inventory_imports(source_sha256,source_file_name,inventory_row_count,image_row_count,imported_at) VALUES(${quote(archiveSha256.toLowerCase())},'inventario_GOTS_LAB_export.zip',${rows.length},${images.length},${quote(importedAt)}) ON CONFLICT(source_sha256) DO NOTHING;`)
sql.push("COMMIT;","")
await writeFile(outPath,sql.join("\n"),{mode:0o600})
console.log(JSON.stringify({rows:rows.length,locations:locations.length,images:images.length,archiveSha256:archiveSha256.toLowerCase(),outPath}))
