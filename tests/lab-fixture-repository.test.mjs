import test from "node:test"
import assert from "node:assert/strict"
import { LabAccessScope } from "../lib/common-auth-contract.mjs"
import { createFixtureLabRepository, LOCAL_APPROVED_FIXTURE_IDENTITY } from "../lib/lab-fixture-repository.mjs"

const now = 1_800_000_000_000

test("approved synthetic GOTS member can list and request an available inventory fixture", async () => {
  const repo = createFixtureLabRepository()
  const items = await repo.listInventory(LOCAL_APPROVED_FIXTURE_IDENTITY, now)
  assert.equal(items.length, 2)
  assert.deepEqual(await repo.reserveInventory(LOCAL_APPROVED_FIXTURE_IDENTITY, "fixture-laser-01", now), {
    reservationId: "local-local-approved-lab-member-fixture-laser-01", itemId: "fixture-laser-01", status: "requested",
  })
})

test("unapproved synthetic user cannot read or reserve inventory", async () => {
  const repo = createFixtureLabRepository()
  const identity = { subject: "local-no-grant", sessionExpiresAt: now + 1000, labAccessScope: LabAccessScope.NONE }
  await assert.rejects(repo.listInventory(identity, now), /lab-access-denied/)
  await assert.rejects(repo.reserveInventory(identity, "fixture-laser-01", now), /lab-access-denied/)
})

test("fixture inventory rejects unavailable equipment", async () => {
  const repo = createFixtureLabRepository()
  await assert.rejects(repo.reserveInventory(LOCAL_APPROVED_FIXTURE_IDENTITY, "fixture-lens-02", now), /inventory-item-unavailable/)
})
