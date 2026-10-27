import test from "node:test"
import assert from "node:assert/strict"
import { isApprovedInstitutionalEmail } from "../lib/institutional-email-contract.mjs"

test("accepts exactly the two existing UIS institutional domains", () => {
  assert.equal(isApprovedInstitutionalEmail("student@correo.uis.edu.co"), true)
  assert.equal(isApprovedInstitutionalEmail("professor@uis.edu.co"), true)
  assert.equal(isApprovedInstitutionalEmail("  staff@UIS.EDU.CO  "), true)
})

test("rejects lookalikes, external domains, and malformed addresses", () => {
  for (const email of [
    "student@gmail.com",
    "student@ugr.es",
    "student@uis.edu.co.evil.example",
    "student@eviluis.edu.co",
    "student@correo.uis.edu.co.evil.example",
    "student@@uis.edu.co",
    "@uis.edu.co",
    "student@correo.uis.edu.co\nattacker@example.com",
    "",
    null,
  ]) {
    assert.equal(isApprovedInstitutionalEmail(email), false, String(email))
  }
})
