import test from "node:test"
import assert from "node:assert/strict"
import { REGISTRATION_EMAIL_EXCEPTIONS, isApprovedInstitutionalEmail } from "../lib/institutional-email-contract.mjs"

test("accepts exactly the two existing UIS institutional domains", () => {
  assert.equal(isApprovedInstitutionalEmail("student@correo.uis.edu.co"), true)
  assert.equal(isApprovedInstitutionalEmail("professor@uis.edu.co"), true)
  assert.equal(isApprovedInstitutionalEmail("  staff@UIS.EDU.CO  "), true)
})

test("allows only the explicitly approved registration exception", () => {
  assert.deepEqual(REGISTRATION_EMAIL_EXCEPTIONS, ["jafgofu1s@gmail.com"])
  assert.equal(isApprovedInstitutionalEmail("  JAFGOFU1S@GMAIL.COM  "), true)
  for (const email of [
    "jafgofu1@gmail.com",
    "jafgofu1s+other@gmail.com",
    "jafgofu1s@gmail.com.evil.example",
    "other@gmail.com",
  ]) {
    assert.equal(isApprovedInstitutionalEmail(email), false, email)
  }
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
