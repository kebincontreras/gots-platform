// Registration eligibility only; it is never a laboratory permission.
export const INSTITUTIONAL_EMAIL_PATTERN = /^[^@\s]+@(correo\.)?uis\.edu\.co$/i
export const REGISTRATION_EMAIL_EXCEPTIONS = Object.freeze([
  "jafgofu1s@gmail.com",
])

export function isApprovedInstitutionalEmail(value) {
  if (typeof value !== "string") return false
  const normalized = value.trim().toLowerCase()
  return INSTITUTIONAL_EMAIL_PATTERN.test(normalized) || REGISTRATION_EMAIL_EXCEPTIONS.includes(normalized)
}
