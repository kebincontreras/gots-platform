import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

const inventory = Object.freeze([
  Object.freeze({ id: "fixture-laser-01", name: "Láser He-Ne", location: "Banco de óptica A", available: true }),
  Object.freeze({ id: "fixture-lens-02", name: "Kit de lentes", location: "Gabinete 2", available: false }),
])

function assertLabMember(identity, now) {
  const decision = authorizeGotsLab(identity, "laboratory", now)
  if (!decision.allowed) throw new Error(`lab-access-denied:${decision.reason}`)
}

/** Local-test-only repository. It has no I/O, accounts, or persistent state. */
export function createFixtureLabRepository() {
  return {
    async listInventory(identity, now = Date.now()) {
      assertLabMember(identity, now)
      return inventory.map((item) => ({ ...item }))
    },
    async reserveInventory(identity, itemId, now = Date.now()) {
      assertLabMember(identity, now)
      const item = inventory.find((candidate) => candidate.id === itemId)
      if (!item) throw new Error("inventory-item-not-found")
      if (!item.available) throw new Error("inventory-item-unavailable")
      return { reservationId: `local-${identity.subject}-${itemId}`, itemId, status: "requested" }
    },
  }
}

export const LOCAL_APPROVED_FIXTURE_IDENTITY = Object.freeze({
  subject: "local-approved-lab-member",
  sessionExpiresAt: 1_900_000_000_000,
  labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER,
})
