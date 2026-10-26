import test from "node:test"
import assert from "node:assert/strict"
import {
  DEFAULT_GOTS_LAB_URL,
  LabAccessScope,
  authorizeGotsLab,
  buildGotsLabHref,
  createCommonAuthAdapter,
  safeReturnPath,
} from "../lib/common-auth-contract.mjs"

test("only local return paths are accepted", () => {
  assert.equal(safeReturnPath("/dashboard?tab=inicio"), "/dashboard?tab=inicio")
  assert.equal(safeReturnPath("https://attacker.example"), "/")
  assert.equal(safeReturnPath("//attacker.example"), "/")
  assert.equal(safeReturnPath("javascript:alert(1)"), "/")
  assert.equal(safeReturnPath("data:text/html,hello"), "/")
  assert.equal(safeReturnPath("/%2f%2fattacker.example"), "/")
  assert.equal(safeReturnPath("/%5cattacker.example"), "/")
  assert.equal(safeReturnPath("/%0aSet-Cookie: bad"), "/")
  assert.equal(safeReturnPath("/ok\nSet-Cookie: bad"), "/")
})

test("GOTS_LAB link never contains identity data and has a safe return route", () => {
  const href = buildGotsLabHref({
    baseUrl: "https://preview.example/GOTS_LAB/?email=user@example.com#fragment",
    returnPath: "https://attacker.example",
  })
  const url = new URL(href)
  assert.equal(url.origin, "https://preview.example")
  assert.equal(url.pathname, "/GOTS_LAB/")
  assert.equal(url.searchParams.get("returnTo"), "/")
  assert.equal(url.searchParams.has("email"), false)
  assert.equal(url.hash, "")
  assert.equal(buildGotsLabHref({ baseUrl: "http://not-allowed.example", returnPath: "/dashboard" }).startsWith(DEFAULT_GOTS_LAB_URL), true)
  assert.equal(buildGotsLabHref({ baseUrl: "javascript:alert(1)", returnPath: "/dashboard" }).startsWith(DEFAULT_GOTS_LAB_URL), true)
  assert.equal(buildGotsLabHref({ baseUrl: "data:text/html,hello", returnPath: "/dashboard" }).startsWith(DEFAULT_GOTS_LAB_URL), true)
  assert.equal(buildGotsLabHref({ baseUrl: "//attacker.example", returnPath: "/dashboard" }).startsWith(DEFAULT_GOTS_LAB_URL), true)
})

test("lab access requires an explicit approved-member claim, not email affiliation", () => {
  const now = 1_800_000_000_000
  const approved = { subject: "mock-uis", email: "member@uis.edu.co", labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER, sessionExpiresAt: now + 60_000 }
  const uisWithoutApproval = { subject: "mock-uis-unapproved", email: "student@correo.uis.edu.co", labAccessScope: LabAccessScope.NONE, sessionExpiresAt: now + 60_000 }
  const external = { subject: "mock-external", email: "visitor@example.com", labAccessScope: LabAccessScope.EXTERNAL, sessionExpiresAt: now + 60_000 }
  assert.deepEqual(authorizeGotsLab(approved, "inventory", now), { allowed: true, reason: "approved-lab-member" })
  assert.deepEqual(authorizeGotsLab(uisWithoutApproval, "inventory", now), { allowed: false, reason: "approved-lab-membership-required" })
  assert.deepEqual(authorizeGotsLab(external, "inventory", now), { allowed: false, reason: "approved-lab-membership-required" })
  assert.deepEqual(authorizeGotsLab(external, "loan-request", now), { allowed: true, reason: "loan-request" })
})

test("missing claims and expired sessions deny non-public access", () => {
  const now = 1_800_000_000_000
  assert.deepEqual(authorizeGotsLab(null, "inventory", now), { allowed: false, reason: "missing-identity-claim" })
  assert.deepEqual(authorizeGotsLab({ subject: "only-subject" }, "inventory", now), { allowed: false, reason: "expired-or-missing-session" })
  assert.deepEqual(authorizeGotsLab({ subject: "expired", labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER, sessionExpiresAt: now - 1 }, "inventory", now), { allowed: false, reason: "expired-or-missing-session" })
})

test("mock logout is local-only and uses a safe return route", () => {
  const adapter = createCommonAuthAdapter({
    mode: "mock",
    mockIdentity: { subject: "mock-subject", labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER, sessionExpiresAt: Date.now() + 60_000 },
  })
  assert.equal(adapter.getIdentity().subject, "mock-subject")
  assert.deepEqual(adapter.signOut({ returnTo: "//attacker.example" }), {
    cleared: ["gots-local-mock-session"],
    returnTo: "/",
    sharedProviderSignOut: false,
  })
})
