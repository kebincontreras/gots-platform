import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

export const LabModuleSection = Object.freeze({
  INVENTORY: "inventory",
  EXPERIMENTS: "experiments",
  LOANS: "loans",
})

/**
 * A data/access boundary for the embedded laboratory module.
 *
 * Disabled is deliberately the production default until an approved mapping
 * is implemented. `mock` exists only for local contract tests; it never reads
 * Supabase or grants access based on a user's email address or GOTS role.
 */
export function createLabModuleGateway({ mode = "disabled", grants = {} } = {}) {
  return {
    mode: mode === "mock" ? "mock" : "disabled",
    async getIdentity(subject, sessionExpiresAt) {
      if (mode !== "mock") return { subject, sessionExpiresAt, labAccessScope: LabAccessScope.NONE }
      const grant = grants[subject]
      return {
        subject,
        sessionExpiresAt,
        labAccessScope: grant?.labAccessScope ?? LabAccessScope.NONE,
      }
    },
    async listInventory() {
      return []
    },
    async listExperiments() {
      return []
    },
    async listLoans() {
      return []
    },
  }
}

export function authorizeLabSection(identity, section, now = Date.now()) {
  const resource = section === LabModuleSection.LOANS ? "loan-request" : "laboratory"
  return authorizeGotsLab(identity, resource, now)
}
