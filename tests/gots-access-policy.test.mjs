import test from "node:test"
import assert from "node:assert/strict"
import { GROUP_ADMIN_EMAILS, canManageOwnedContent, isGroupAdmin } from "../lib/gots-access-policy.mjs"

test("only Kebin and verified Rafael accounts are group membership administrators", () => {
  assert.deepEqual(GROUP_ADMIN_EMAILS, ["kebinandrescontreras@gmail.com", "rafael.torres@saber.uis.edu.co"])
  assert.equal(isGroupAdmin("KEBINANDRESCONTRERAS@GMAIL.COM"), true)
  assert.equal(isGroupAdmin("rafael.torres@saber.uis.edu.co"), true)
  assert.equal(isGroupAdmin("another.professor@uis.edu.co"), false)
  assert.equal(isGroupAdmin(undefined), false)
})

test("only the creator can modify or delete their news and publications", () => {
  assert.equal(canManageOwnedContent("owner-id", "owner-id"), true)
  assert.equal(canManageOwnedContent("other-id", "owner-id"), false)
  assert.equal(canManageOwnedContent(undefined, "owner-id"), false)
  assert.equal(canManageOwnedContent("owner-id", null), false)
})
