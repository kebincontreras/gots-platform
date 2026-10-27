import test from "node:test"
import assert from "node:assert/strict"
import { LabAccessScope } from "../lib/common-auth-contract.mjs"
import { LabModuleSection, authorizeLabSection, createLabModuleGateway } from "../lib/lab-module-contract.mjs"

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
