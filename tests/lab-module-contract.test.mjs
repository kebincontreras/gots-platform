import test from "node:test"
import assert from "node:assert/strict"
import { LabAccessScope } from "../lib/common-auth-contract.mjs"
import { LabModuleSection, authorizeLabSection, createLabModuleGateway, getLabSectionPath } from "../lib/lab-module-contract.mjs"

const now = 1_800_000_000_000

test("disabled laboratory gateway denies every account by default", async () => {
  const gateway = createLabModuleGateway()
  const identity = await gateway.getIdentity("gots-user", now + 60_000)
  assert.equal(identity.labAccessScope, LabAccessScope.NONE)
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.INVENTORY, now), { allowed: false, reason: "approved-lab-membership-required" })
})

test("mock gateway grants only an explicit individual grant", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { "approved-user": { labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER } },
  })
  const approved = await gateway.getIdentity("approved-user", now + 60_000)
  const unapproved = await gateway.getIdentity("uis-email-is-not-a-grant", now + 60_000)
  assert.deepEqual(authorizeLabSection(approved, LabModuleSection.EXPERIMENTS, now), { allowed: true, reason: "approved-lab-member" })
  assert.deepEqual(authorizeLabSection(unapproved, LabModuleSection.EXPERIMENTS, now), { allowed: false, reason: "approved-lab-membership-required" })
})

test("an external grant is limited to loans", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { external: { labAccessScope: LabAccessScope.EXTERNAL } },
  })
  const identity = await gateway.getIdentity("external", now + 60_000)
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.LOANS, now), { allowed: true, reason: "loan-request" })
  assert.deepEqual(authorizeLabSection(identity, LabModuleSection.INVENTORY, now), { allowed: false, reason: "approved-lab-membership-required" })
})

test("a UIS-looking synthetic account never becomes an external requester by itself", async () => {
  const gateway = createLabModuleGateway({
    mode: "mock",
    grants: { "legacy-external-record": { labAccessScope: LabAccessScope.EXTERNAL } },
  })
  const institutional = await gateway.getIdentity("student@correo.uis.edu.co", now + 60_000)
  const legacyExternal = await gateway.getIdentity("legacy-external-record", now + 60_000)
  assert.deepEqual(authorizeLabSection(institutional, LabModuleSection.LOANS, now), { allowed: false, reason: "lab-access-required" })
  assert.deepEqual(authorizeLabSection(legacyExternal, LabModuleSection.LOANS, now), { allowed: true, reason: "loan-request" })
})

test("laboratory callback paths use the public Spanish routes", () => {
  assert.equal(getLabSectionPath(LabModuleSection.INVENTORY), "/laboratorio/inventario")
  assert.equal(getLabSectionPath(LabModuleSection.EXPERIMENTS), "/laboratorio/experimentos")
  assert.equal(getLabSectionPath(LabModuleSection.LOANS), "/laboratorio/prestamos")
  assert.equal(getLabSectionPath("not-a-section"), "/laboratorio")
})
