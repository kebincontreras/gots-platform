import test from "node:test"; import assert from "node:assert/strict"
import { LabAccessScope } from "../lib/common-auth-contract.mjs"
import { createFixtureLoanRepository } from "../lib/lab-loans-fixture-repository.mjs"
const now=1_800_000_000_000
const member={subject:"member",sessionExpiresAt:now+99_999,labAccessScope:LabAccessScope.APPROVED_LAB_MEMBER}
const professor={subject:"prof",sessionExpiresAt:now+99_999,labAccessScope:LabAccessScope.APPROVED_LAB_MEMBER}
const external={subject:"legacy",sessionExpiresAt:now+99_999,labAccessScope:LabAccessScope.EXTERNAL}
test("member creates and professor approves pending loan",async()=>{const r=createFixtureLoanRepository({professorIds:["prof"]}); const l=await r.create(member,{itemId:"fixture-laser-01",usageStart:"2026-11-01",usageEnd:"2026-11-02"},now); assert.equal((await r.decide(professor,l.id,"approved",now)).status,"approved"); assert.equal((await r.list(member,now)).length,1)})
test("external requester may create/read own request but cannot decide",async()=>{const r=createFixtureLoanRepository({professorIds:["prof"]}); const l=await r.create(external,{itemId:"fixture",usageStart:"a",usageEnd:"b"},now); assert.equal((await r.list(external,now))[0].id,l.id); await assert.rejects(r.decide(external,l.id,"approved",now),/forbidden/)})
test("only pending loans can transition",async()=>{const r=createFixtureLoanRepository({professorIds:["prof"]}); const l=await r.create(member,{itemId:"x",usageStart:"a",usageEnd:"b"},now); await r.decide(professor,l.id,"rejected",now); await assert.rejects(r.decide(professor,l.id,"approved",now),/transition-not-allowed/)})
