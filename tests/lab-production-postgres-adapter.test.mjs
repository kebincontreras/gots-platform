import test from "node:test"
import assert from "node:assert/strict"
import { createGotsPostgresLabAdapter } from "../lib/lab-production-postgres-adapter.mjs"
import { createGotsPostgresLabWorkflowAdapter } from "../lib/lab-production-postgres-adapter.mjs"

test("Postgres adapter is executor-injected and parameterizes GOTS identity",async()=>{
  const calls=[];const adapter=createGotsPostgresLabAdapter({query:async(sql,args)=>{calls.push({sql,args});return []}})
  await adapter.getMembership("11111111-1111-4111-8111-111111111111")
  assert.match(calls[0].sql,/lab_memberships/);assert.deepEqual(calls[0].args,["11111111-1111-4111-8111-111111111111"])
  await assert.rejects(adapter.getMembership("not-a-uuid"),/invalid/)
})

test("workflow adapter uses injected transaction for stock-reserving writes",async()=>{
  const calls=[];const q=async(sql,args)=>{calls.push({sql,args});return sql.includes("quantity_total FROM lab_inventory_items")?[{id:"44444444-4444-4444-8444-444444444444",quantity_total:2}]:sql.includes("COALESCE(SUM")?[{reserved:0}]:sql.includes("RETURNING id")?[{id:"11111111-1111-4111-8111-111111111111"}]:[]};const adapter=createGotsPostgresLabWorkflowAdapter({query:q,transaction:work=>work(q)})
  await adapter.createLoan({id:"11111111-1111-4111-8111-111111111111",requesterId:"22222222-2222-4222-8222-222222222222",responsibleId:"33333333-3333-4333-8333-333333333333",items:[{inventoryItemId:"44444444-4444-4444-8444-444444444444",quantity:1}],purpose:"Uso",usageStart:"2026-01-01",usageEnd:"2026-01-02",createdAt:"2026-01-01"})
  assert.match(calls[0].sql,/FOR UPDATE/);assert.match(calls[3].sql,/INSERT INTO lab_loans/)
})

test("workflow adapter exposes catalogue filter values as strings",async()=>{
  const a=createGotsPostgresLabWorkflowAdapter({
    query:async sql=>sql.includes("DISTINCT category")?[{category:"Óptica"}]:[{box_label:"A-1"}],
    transaction:work=>work(async()=>[]),
  })
  assert.deepEqual(await a.categories(),["Óptica"])
  assert.deepEqual(await a.boxes("Óptica"),["A-1"])
})

test("sensitive workflow writes bind actor authorization in SQL",async()=>{
  const calls=[];const q=async(sql,args)=>{calls.push({sql,args});return []};const a=createGotsPostgresLabWorkflowAdapter({query:q,transaction:work=>work(q)})
  await a.addAttachment({id:"11111111-1111-4111-8111-111111111111",experimentId:"22222222-2222-4222-8222-222222222222",actorId:"33333333-3333-4333-8333-333333333333",path:"x",mediaType:"image/png",at:"now"})
  await a.setAdminMembership({actorId:"33333333-3333-4333-8333-333333333333",userId:"44444444-4444-4444-8444-444444444444",scope:"approved",at:"now"})
  assert.match(calls[0].sql,/owner_id=.*\$6/);assert.match(calls[1].sql,/lab_admins/)
})
