import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

const categories = new Set(["Polarización", "Interferencia", "Óptica no lineal", "Óptica cuántica", "Birrefringencia", "Óptica geométrica", "Difracción", "Formación de imágenes"])

function requireMember(identity, now) {
  const result = authorizeGotsLab(identity, "laboratory", now)
  if (!result.allowed) throw new Error(`experiment-access-denied:${result.reason}`)
}
function copy(value) { return JSON.parse(JSON.stringify(value)) }

/**
 * Local-only, in-memory analogue of the original experiment queries.  It
 * deliberately has no database, Supabase client, storage, notifications, or
 * legal acceptance side effects.  Its transitions mirror the original owner,
 * approved-participant, session, reservation and finish guards.
 */
export function createFixtureExperimentRepository() {
  const experiments = []
  const participantRows = []
  const sessions = []
  const items = []
  let sequence = 0
  const id = (kind) => `${kind}-${++sequence}`
  const get = (experimentId) => {
    const experiment = experiments.find((row) => row.id === experimentId)
    if (!experiment) throw new Error("experiment-not-found")
    return experiment
  }
  const isParticipant = (subject, experimentId) => participantRows.some((row) => row.experimentId === experimentId && row.userId === subject && row.status === "approved")
  const requireOwner = (identity, experimentId, now) => {
    requireMember(identity, now)
    const experiment = get(experimentId)
    if (experiment.ownerId !== identity.subject) throw new Error("experiment-owner-required")
    return experiment
  }
  const requireEditor = (identity, experimentId, now) => {
    requireMember(identity, now)
    const experiment = get(experimentId)
    if (experiment.ownerId !== identity.subject && !isParticipant(identity.subject, experimentId)) throw new Error("experiment-owner-or-approved-participant-required")
    return experiment
  }
  return {
    async create(identity, { title, category, description = "", itemId }, now = Date.now()) {
      requireMember(identity, now)
      if (!title || title.trim().length < 3) throw new Error("experiment-invalid-title")
      if (!categories.has(category)) throw new Error("experiment-invalid-category")
      const experiment = { id: id("experiment"), title: title.trim(), category, description, ownerId: identity.subject, status: "draft", createdAt: new Date(now).toISOString(), finishedAt: null }
      experiments.push(experiment)
      if (itemId) items.push({ id: id("item"), experimentId: experiment.id, inventoryItemId: itemId, status: "active", addedBy: identity.subject })
      return copy(experiment)
    },
    async list(identity, now = Date.now()) {
      requireMember(identity, now)
      return experiments.filter((row) => row.ownerId === identity.subject || isParticipant(identity.subject, row.id)).map((row) => ({ ...copy(row), items: copy(items.filter((item) => item.experimentId === row.id)), sessions: copy(sessions.filter((session) => session.experimentId === row.id)), participants: copy(participantRows.filter((participant) => participant.experimentId === row.id)) }))
    },
    async addParticipant(identity, experimentId, userId, now = Date.now()) {
      requireOwner(identity, experimentId, now)
      if (!userId || userId === identity.subject) throw new Error("experiment-invalid-participant")
      if (participantRows.some((row) => row.experimentId === experimentId && row.userId === userId)) throw new Error("experiment-participant-exists")
      const row = { id: id("participant"), experimentId, userId, status: "pending", source: "owner" }
      participantRows.push(row); return copy(row)
    },
    async resolveParticipant(identity, participantId, status, now = Date.now()) {
      requireMember(identity, now)
      if (!['approved', 'rejected'].includes(status)) throw new Error("experiment-invalid-participant-transition")
      const participant = participantRows.find((row) => row.id === participantId)
      if (!participant) throw new Error("experiment-participant-not-found")
      requireOwner(identity, participant.experimentId, now)
      if (participant.status !== "pending") throw new Error("experiment-participant-transition-not-allowed")
      participant.status = status; return copy(participant)
    },
    async addItem(identity, experimentId, inventoryItemId, now = Date.now()) {
      const experiment = requireEditor(identity, experimentId, now)
      if (!['draft', 'in_progress'].includes(experiment.status)) throw new Error("experiment-not-editable")
      if (!inventoryItemId) throw new Error("experiment-invalid-item")
      const row = { id: id("item"), experimentId, inventoryItemId, status: "active", addedBy: identity.subject }
      items.push(row); return copy(row)
    },
    async start(identity, experimentId, startedAt, endsAt, now = Date.now()) {
      const experiment = requireOwner(identity, experimentId, now)
      if (experiment.status === "draft") experiment.status = "in_progress"
      if (experiment.status !== "in_progress") throw new Error("experiment-session-not-allowed")
      if (sessions.some((row) => row.experimentId === experimentId && !row.endedAt)) throw new Error("experiment-open-session-exists")
      if (new Date(endsAt) < new Date(startedAt)) throw new Error("experiment-session-invalid-dates")
      const row = { id: id("session"), experimentId, startedAt, endsAtPlanned: endsAt, endedAt: null, createdBy: identity.subject }
      sessions.push(row); return copy(row)
    },
    async close(identity, sessionId, endedAt, now = Date.now()) {
      requireMember(identity, now)
      const session = sessions.find((row) => row.id === sessionId)
      if (!session) throw new Error("experiment-session-not-found")
      requireOwner(identity, session.experimentId, now)
      if (session.endedAt) throw new Error("experiment-session-already-closed")
      if (new Date(endedAt) < new Date(session.startedAt)) throw new Error("experiment-session-invalid-end")
      session.endedAt = endedAt; return copy(session)
    },
    async finish(identity, experimentId, now = Date.now()) {
      const experiment = requireOwner(identity, experimentId, now)
      if (experiment.status === "finished") throw new Error("experiment-already-finished")
      if (sessions.some((row) => row.experimentId === experimentId && !row.endedAt)) throw new Error("experiment-open-session-exists")
      experiment.status = "finished"; experiment.finishedAt = new Date(now).toISOString()
      for (const item of items.filter((row) => row.experimentId === experimentId && row.status === "active")) item.status = "returned"
      return copy(experiment)
    },
  }
}

export const LOCAL_EXPERIMENT_FIXTURE_IDENTITY = Object.freeze({ subject: "local-approved-lab-member", sessionExpiresAt: 1_900_000_000_000, labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER })
