import test from "node:test"
import assert from "node:assert/strict"
import { LabAccessScope } from "../lib/common-auth-contract.mjs"
import { LabModuleSection, authorizeLabSection, createLabModuleGateway, getLabSectionPath, getLocalFixtureGateway } from "../lib/lab-module-contract.mjs"
import { createDisabledLabProductionAdapter, validateLabIdentityMapping } from "../lib/lab-production-adapter.mjs"

const now = 1_800_000_000_000

test("a valid GOTS identity enters Labs even without legacy membership metadata", async () => {
  const gateway = createLabModuleGateway()
  const identity = await gateway.getIdentity("gots-user", now + 60_000)
  assert.equal(identity.labAccessScope, LabAccessScope.NONE)
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.INVENTORY, now), { allowed: true, reason: "authenticated-gots-user" })
})

test("legacy grants do not change ordinary authenticated access", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { "approved-user": { labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER } },
  })
  const approved = await gateway.getIdentity("approved-user", now + 60_000)
  const unapproved = await gateway.getIdentity("uis-email-is-not-a-grant", now + 60_000)
  assert.deepEqual(authorizeLabSection(approved, LabModuleSection.EXPERIMENTS, now), { allowed: true, reason: "authenticated-gots-user" })
  assert.deepEqual(authorizeLabSection(unapproved, LabModuleSection.EXPERIMENTS, now), { allowed: true, reason: "authenticated-gots-user" })
})

test("legacy external metadata does not limit authenticated users", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { external: { labAccessScope: LabAccessScope.EXTERNAL } },
  })
  const identity = await gateway.getIdentity("external", now + 60_000)
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.LOANS, now), { allowed: true, reason: "authenticated-gots-user" })
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.INVENTORY, now), { allowed: true, reason: "authenticated-gots-user" })
})

test("a normal authenticated GOTS identity can request access without external metadata", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { "legacy-external-record": { labAccessScope: LabAccessScope.EXTERNAL } },
  })
  const institutional = await gateway.getIdentity("student@correo.uis.edu.co", now + 60_000)
  const legacyExternal = await gateway.getIdentity("legacy-external-record", now + 60_000)
  assert.deepEqual(authorizeLabSection(institutional, LabModuleSection.LOANS, now), { allowed: true, reason: "authenticated-gots-user" })
  assert.deepEqual(authorizeLabSection(legacyExternal, LabModuleSection.LOANS, now), { allowed: true, reason: "authenticated-gots-user" })
})

test("laboratory callback paths use the public Spanish routes", () => {
  assert.equal(getLabSectionPath(LabModuleSection.INVENTORY), "/laboratorio/inventario")
  assert.equal(getLabSectionPath(LabModuleSection.EXPERIMENTS), "/laboratorio/experimentos")
  assert.equal(getLabSectionPath(LabModuleSection.LOANS), "/laboratorio/prestamos")
  assert.equal(getLabSectionPath("not-a-section"), "/laboratorio")
})

test("local fixtures require an explicit development user-id grant", async () => {
  const enabled = getLocalFixtureGateway({ NODE_ENV: "development", GOTS_LAB_LOCAL_FIXTURE_GRANTS: '{"local-user":"approved"}' })
  const noGrant = getLocalFixtureGateway({ NODE_ENV: "development" })
  assert.equal((await enabled.getIdentity("local-user", now + 1)).labAccessScope, LabAccessScope.APPROVED_LAB_MEMBER)
  assert.equal((await enabled.getIdentity("student@correo.uis.edu.co", now + 1)).labAccessScope, LabAccessScope.NONE)
  assert.equal((await noGrant.getIdentity("local-user", now + 1)).labAccessScope, LabAccessScope.NONE)
})

test("production adapter remains inert and requires an exact one-to-one UUID mapping", () => {
  const adapter=createDisabledLabProductionAdapter();assert.equal(adapter.enabled,false);assert.throws(()=>adapter.connect(),/disabled/)
  assert.equal(validateLabIdentityMapping([{gotsUserId:"11111111-1111-4111-8111-111111111111",labProfileId:"22222222-2222-4222-8222-222222222222",scope:"approved"}])[0].scope,"approved")
  assert.throws(()=>validateLabIdentityMapping([{gotsUserId:"not-a-uuid",labProfileId:"22222222-2222-4222-8222-222222222222",scope:"approved"}]),/invalid-uuid/)
})
