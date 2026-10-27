import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

export const LabModuleSection = Object.freeze({
  INVENTORY: "inventory",
  EXPERIMENTS: "experiments",
  LOANS: "loans",
})

export const LabSectionPath = Object.freeze({
  [LabModuleSection.INVENTORY]: "/laboratorio/inventario",
  [LabModuleSection.EXPERIMENTS]: "/laboratorio/experimentos",
  [LabModuleSection.LOANS]: "/laboratorio/prestamos",
})

export function getLabSectionPath(section) {
  return LabSectionPath[section] ?? "/laboratorio"
}

/**
 * A data/access boundary for the embedded laboratory module.
 *
 * Disabled is deliberately the production default until an approved mapping
 * is implemented. `mock` exists only for local contract tests; it never reads
 * Supabase or grants access based on a user's email address or GOTS role.
 *
 * `external` mirrors the legacy GOTS_LAB loan-request scope only. This module
 * does not create external accounts, infer that scope, or make it available
 * through GOTS registration.
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
