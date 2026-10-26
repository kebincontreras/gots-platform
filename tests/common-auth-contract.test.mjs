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
})

test("lab roles follow least privilege", () => {
  assert.deepEqual(authorizeGotsLab(LabAccessScope.UIS, "inventory"), { allowed: true, reason: "uis-lab-member" })
  assert.deepEqual(authorizeGotsLab(LabAccessScope.EXTERNAL, "inventory"), { allowed: false, reason: "uis-lab-membership-required" })
  assert.deepEqual(authorizeGotsLab(LabAccessScope.EXTERNAL, "loan-request"), { allowed: true, reason: "loan-request" })
  assert.deepEqual(authorizeGotsLab(LabAccessScope.NONE, "loan-request"), { allowed: false, reason: "lab-access-required" })
})

test("mock logout is local-only and uses a safe return route", () => {
  const adapter = createCommonAuthAdapter({
    mode: "mock",
    mockIdentity: { subject: "mock-subject", labAccessScope: LabAccessScope.UIS },
  })
  assert.equal(adapter.getIdentity().subject, "mock-subject")
  assert.deepEqual(adapter.signOut({ returnTo: "//attacker.example" }), {
    cleared: ["gots-local-mock-session"],
    returnTo: "/",
    sharedProviderSignOut: false,
  })
})
