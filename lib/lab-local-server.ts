import path from "node:path"
import os from "node:os"
import { createLocalLabFixtureStore } from "./lab-local-fixture-store.mjs"
export function getLocalLabServerStore() {
  const store = createLocalLabFixtureStore(process.env.GOTS_LAB_LOCAL_FIXTURE_DB ?? path.join(os.tmpdir(), "gots-labs-preview.sqlite"))
  try { for (const [userId, scope] of Object.entries(JSON.parse(process.env.GOTS_LAB_LOCAL_FIXTURE_GRANTS ?? "{}"))) if (scope === "approved" || scope === "external") store.grantMembership({ userId, scope }) } catch {}
  try { for (const userId of JSON.parse(process.env.GOTS_LAB_LOCAL_FIXTURE_PROFESSOR_IDS ?? "[]")) if (typeof userId === "string") store.grantLoanResponsible({ userId }) } catch {}
  try { for (const userId of JSON.parse(process.env.GOTS_LAB_LOCAL_FIXTURE_ADMIN_IDS ?? "[]")) if (typeof userId === "string") store.grantLabAdmin({ userId }) } catch {}
  return store
}
