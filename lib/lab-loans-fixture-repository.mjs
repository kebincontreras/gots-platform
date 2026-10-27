import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

function requireLoanAccess(identity, now) {
  const result = authorizeGotsLab(identity, "loan-request", now)
  if (!result.allowed) throw new Error(`loan-access-denied:${result.reason}`)
}

/** Test-only in-memory analogue of GOTS_LAB's pending/approved/rejected flow. */
export function createFixtureLoanRepository({ professorIds = [] } = {}) {
  const loans = []
  return {
    async create(identity, { itemId, usageStart, usageEnd }, now = Date.now()) {
      requireLoanAccess(identity, now)
      if (!itemId || !usageStart || !usageEnd) throw new Error("loan-invalid-request")
      const loan = { id: `loan-${loans.length + 1}`, requesterId: identity.subject, itemId, usageStart, usageEnd, status: "pending", decidedBy: null }
      loans.push(loan)
      return { ...loan }
    },
    async list(identity, now = Date.now()) {
      requireLoanAccess(identity, now)
      const isProfessor = professorIds.includes(identity.subject)
      return loans.filter((loan) => loan.requesterId === identity.subject || (isProfessor && identity.labAccessScope === LabAccessScope.APPROVED_LAB_MEMBER)).map((loan) => ({ ...loan }))
    },
    async decide(identity, loanId, status, now = Date.now()) {
      requireLoanAccess(identity, now)
      if (!professorIds.includes(identity.subject) || identity.labAccessScope !== LabAccessScope.APPROVED_LAB_MEMBER) throw new Error("loan-decision-forbidden")
      if (!['approved','rejected'].includes(status)) throw new Error("loan-invalid-transition")
      const loan = loans.find((item) => item.id === loanId)
      if (!loan) throw new Error("loan-not-found")
      if (loan.status !== "pending") throw new Error("loan-transition-not-allowed")
      loan.status = status; loan.decidedBy = identity.subject
      return { ...loan }
    },
  }
}
