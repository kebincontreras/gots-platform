// Keep this exact allowlist aligned with the existing GOTS_LAB database trigger.
// It is eligibility for registration only; it is never a laboratory permission.
export const INSTITUTIONAL_EMAIL_PATTERN = /^[^@\s]+@(correo\.)?uis\.edu\.co$/i

export function isApprovedInstitutionalEmail(value) {
  return typeof value === "string" && INSTITUTIONAL_EMAIL_PATTERN.test(value.trim())
}
