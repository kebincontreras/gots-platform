import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"
import { createGotsPostgresLabWorkflowAdapter } from "../lib/lab-production-postgres-adapter.mjs"

// PGlite embeds the PostgreSQL engine in WASM. It validates DDL and SQL
// semantics more closely than pg-mem, but it is still not a production
// PostgreSQL service and cannot prove multi-connection MVCC behaviour.
const ids = {
  admin: "11111111-1111-4111-8111-111111111111",
  owner: "22222222-2222-4222-8222-222222222222",
  member: "33333333-3333-4333-8333-333333333333",
  responsible: "55555555-5555-4555-8555-555555555555",
  intruder: "66666666-6666-4666-8666-666666666666",
  item: "77777777-7777-4777-8777-777777777777",
  location: "88888888-8888-4888-8888-888888888888",
}

async function harness() {
  const db = new PGlite()
  await db.waitReady
  const q = async (sql, args = []) => (await db.query(sql, args)).rows
  const transaction = async (work) => {
    await db.query("BEGIN")
    try {
      const result = await work(q)
      await db.query("COMMIT")
      return result
    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }
  }
  await q("CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL, password_hash text NOT NULL, role text NOT NULL, created_at text NOT NULL, updated_at text NOT NULL)")
  const schema = await fs.readFile(new URL("../migrations/labs/0002_empty_labs_schema.sql", import.meta.url), "utf8")
  const inventoryImagesSchema = await fs.readFile(new URL("../migrations/labs/0003_private_inventory_images.sql", import.meta.url), "utf8")
  // PGlite's parameterised protocol accepts one statement at a time, like a
  // normal driver prepared query. The production migration was executed by
  // Neon as individual DDL statements.
  for (const statement of schema.split(/;\s*(?:\r?\n|$)/)) if (statement.trim()) await q(statement)
  for (const statement of inventoryImagesSchema.split(/;\s*(?:\r?\n|$)/)) if (statement.trim()) await q(statement)
  for (const id of Object.values(ids)) await q("INSERT INTO users VALUES ($1,$2,'Test','x','STUDENT','now','now')", [id, `${id}@example.test`])
  await q("INSERT INTO lab_memberships(gots_user_id,scope,approved_by,approved_at) VALUES ($1,'approved',$2,'now'),($3,'approved',$2,'now'),($4,'approved',$2,'now')", [ids.owner, ids.admin, ids.member, ids.responsible])
  await q("INSERT INTO lab_admins(user_id) VALUES ($1)", [ids.admin])
  await q("INSERT INTO lab_loan_responsibles(user_id) VALUES ($1)", [ids.responsible])
  await q("INSERT INTO lab_locations(id,type,number,label,created_at) VALUES ($1,'cajon',1,'Cajón 1','now')", [ids.location])
  await q("INSERT INTO lab_inventory_items(id,location_id,name,quantity_total,created_at,updated_at) VALUES ($1,$2,'Láser',2,'now','now')", [ids.item, ids.location])
  return { db, q, adapter: createGotsPostgresLabWorkflowAdapter({ query: q, transaction }) }
}

test("PGlite PostgreSQL engine accepts the reviewed schema and rolls back a failed stock reservation", async () => {
  const { db, q, adapter } = await harness()
  try {
    await assert.rejects(adapter.createLoan({
      id: "99999999-9999-4999-8999-999999999991", requesterId: ids.member, responsibleId: ids.intruder,
      items: [{ inventoryItemId: ids.item, quantity: 1 }], purpose: "uso", usageStart: "2027-01-01", usageEnd: "2027-01-02", createdAt: "now",
    }), /responsible-required/)
    assert.equal((await q("SELECT count(*)::integer AS count FROM lab_loans"))[0].count, 0)

    const loan = (await adapter.createLoan({
      id: "99999999-9999-4999-8999-999999999992", requesterId: ids.member, responsibleId: ids.responsible,
      items: [{ inventoryItemId: ids.item, quantity: 2 }], purpose: "uso", usageStart: "2027-01-01", usageEnd: "2027-01-02", createdAt: "now",
    }))[0]
    assert.equal(loan.status, "pending")
    await assert.rejects(adapter.reserveExperimentItem({
      id: "99999999-9999-4999-8999-999999999993", experimentId: "99999999-9999-4999-8999-999999999994",
      actorId: ids.owner, inventoryItemId: ids.item, quantity: 1, at: "now",
    }), /insufficient/)
    assert.equal((await q("SELECT count(*)::integer AS count FROM lab_experiment_items"))[0].count, 0)
  } finally {
    await db.close()
  }
})

test("PGlite private inventory images are keyed to a real item and retrieved through the adapter", async () => {
  const { db, q, adapter } = await harness()
  try {
    const bytes = Buffer.from("RIFF....WEBPfixture")
    await q("INSERT INTO lab_inventory_images(inventory_item_id,media_type,size_bytes,sha256,content,created_at) VALUES($1,'image/webp',$2,'fixture',$3,'now')", [ids.item, bytes.length, bytes])
    const image = (await adapter.getInventoryImage({ inventoryItemId: ids.item }))[0]
    assert.equal(image.media_type, "image/webp")
    assert.deepEqual(Buffer.from(image.content), bytes)
    assert.throws(() => adapter.getInventoryImage({ inventoryItemId: "not-a-uuid" }), /invalid/)
  } finally { await db.close() }
})

test("PGlite reserves a selected kit component by quantity and rejects a competing request", async () => {
  const { db, q, adapter } = await harness()
  const kit = "99999999-9999-4999-8999-999999999997", piece = "99999999-9999-4999-8999-999999999998"
  try {
    await q("INSERT INTO lab_inventory_items(id,location_id,name,quantity_total,created_at,updated_at) VALUES($1,$2,'Kit de lentes',1,'now','now')", [kit, ids.location])
    await q("INSERT INTO lab_inventory_items(id,location_id,name,quantity_total,kit_parent_id,created_at,updated_at) VALUES($1,$2,'Lente seleccionada',2,$3,'now','now')", [piece, ids.location, kit])
    await adapter.createLoan({ id: "99999999-9999-4999-8999-999999999996", requesterId: ids.member, responsibleId: ids.responsible, items: [{ inventoryItemId: piece, quantity: 2 }], purpose: "óptica", usageStart: "2027-01-01", usageEnd: "2027-01-02", createdAt: "now" })
    await assert.rejects(adapter.createLoan({ id: "99999999-9999-4999-8999-999999999995", requesterId: ids.owner, responsibleId: ids.responsible, items: [{ inventoryItemId: piece, quantity: 1 }], purpose: "óptica", usageStart: "2027-01-01", usageEnd: "2027-01-02", createdAt: "now" }), /insufficient/)
    assert.equal((await q("SELECT count(*)::integer AS count FROM lab_loan_items WHERE inventory_item_id=$1", [piece]))[0].count, 1)
  } finally { await db.close() }
})
