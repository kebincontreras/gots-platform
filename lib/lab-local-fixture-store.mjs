import Database from "better-sqlite3"

const SYNTHETIC_ATTACHMENTS = Object.freeze({
  "/labs-fixtures/laser.svg": { mediaType: "image/svg+xml", sizeBytes: 1391 },
})

/**
 * Isolated local preview storage. This is not the GOTS application database:
 * callers must provide a dedicated SQLite path (normally under /tmp).  It
 * stores only synthetic fixture records and never sends notifications or
 * accepts a real agreement.
 */
export function createLocalLabFixtureStore(filePath) {
  const db = new Database(filePath)
  db.pragma("journal_mode = WAL")
  db.exec(`
    CREATE TABLE IF NOT EXISTS lab_fixture_memberships (gots_user_id TEXT PRIMARY KEY, scope TEXT NOT NULL CHECK(scope IN ('approved', 'external')), approved_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lab_fixture_inventory (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, available INTEGER NOT NULL, quantity_total INTEGER NOT NULL DEFAULT 1 CHECK(quantity_total > 0));
    CREATE TABLE IF NOT EXISTS lab_fixture_memberships (
      gots_user_id TEXT PRIMARY KEY, scope TEXT NOT NULL CHECK(scope IN ('approved', 'external')),
      approved_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_experiments (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL,
      status TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_attachments (
      id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL, local_path TEXT NOT NULL,
      media_type TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
      body TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_acceptances (
      id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL, user_id TEXT NOT NULL,
      policy_version TEXT NOT NULL, simulated INTEGER NOT NULL CHECK(simulated = 1),
      accepted_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_loans (
      id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, professor_id TEXT NOT NULL,
      purpose_description TEXT NOT NULL, usage_start TEXT NOT NULL, usage_end TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'overdue', 'returned', 'lost_stolen')),
      requested_new_usage_end TEXT,
      simulated_acceptance INTEGER NOT NULL CHECK(simulated_acceptance = 1),
      rejection_reason TEXT, decided_at TEXT, decided_by TEXT, returned_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_loan_items (
      loan_id TEXT NOT NULL REFERENCES lab_fixture_loans(id) ON DELETE CASCADE,
      inventory_item_id TEXT NOT NULL REFERENCES lab_fixture_inventory(id),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      PRIMARY KEY (loan_id, inventory_item_id)
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_loan_responsibles (user_id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS lab_fixture_admins (user_id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS lab_fixture_experiment_items (
      id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL REFERENCES lab_fixture_experiments(id),
      inventory_item_id TEXT NOT NULL REFERENCES lab_fixture_inventory(id), quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0), status TEXT NOT NULL CHECK(status IN ('active','returned')),
      added_by TEXT NOT NULL, returned_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS lab_fixture_experiment_active_item ON lab_fixture_experiment_items(experiment_id, inventory_item_id) WHERE status = 'active';
    CREATE TABLE IF NOT EXISTS lab_fixture_experiment_sessions (
      id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL REFERENCES lab_fixture_experiments(id), started_at TEXT NOT NULL,
      ended_at_planned TEXT NOT NULL, ended_at_actual TEXT, created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lab_fixture_experiment_participants (
      id TEXT PRIMARY KEY, experiment_id TEXT NOT NULL REFERENCES lab_fixture_experiments(id), user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')), source TEXT NOT NULL CHECK(source IN ('invited_by_owner','requested_by_user')),
      requested_at TEXT NOT NULL, resolved_by TEXT, resolved_at TEXT, UNIQUE(experiment_id,user_id)
    );
  `)
  // Non-destructive migration from the original boolean fixture.  This local
  // store remains synthetic, but old preview files retain their rows.
  for (const sql of [
    "ALTER TABLE lab_fixture_inventory ADD COLUMN quantity_total INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE lab_fixture_experiment_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE lab_fixture_loans ADD COLUMN requested_new_usage_end TEXT",
  ]) try { db.exec(sql) } catch {}
  // SQLite cannot alter a CHECK constraint.  Preserve every local loan row
  // while rebuilding only the old one-unit join table on upgrade.
  const loanItemsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='lab_fixture_loan_items'").get()?.sql ?? ""
  if (loanItemsSql.includes("quantity = 1")) {
    db.exec(`ALTER TABLE lab_fixture_loan_items RENAME TO lab_fixture_loan_items_legacy;
      CREATE TABLE lab_fixture_loan_items (loan_id TEXT NOT NULL REFERENCES lab_fixture_loans(id) ON DELETE CASCADE, inventory_item_id TEXT NOT NULL REFERENCES lab_fixture_inventory(id), quantity INTEGER NOT NULL CHECK(quantity > 0), PRIMARY KEY (loan_id, inventory_item_id));
      INSERT INTO lab_fixture_loan_items (loan_id,inventory_item_id,quantity) SELECT loan_id,inventory_item_id,quantity FROM lab_fixture_loan_items_legacy;
      DROP TABLE lab_fixture_loan_items_legacy;`)
  }
  const now = () => new Date().toISOString()
  const normalizeItems = (items, itemIds) => {
    const source = Array.isArray(items) ? items : (Array.isArray(itemIds) ? itemIds.map((inventoryItemId) => ({ inventoryItemId, quantity: 1 })) : [])
    if (!source.length) throw new Error("inventory-items-required")
    const grouped = new Map()
    for (const row of source) {
      const inventoryItemId = String(row?.inventoryItemId ?? row?.id ?? "")
      const quantity = Number(row?.quantity)
      if (!inventoryItemId || !Number.isInteger(quantity) || quantity <= 0) throw new Error("inventory-invalid-quantity")
      grouped.set(inventoryItemId, (grouped.get(inventoryItemId) ?? 0) + quantity)
    }
    return [...grouped].map(([inventoryItemId, quantity]) => ({ inventoryItemId, quantity }))
  }
  const inventoryWithAvailability = (id) => {
    const item = db.prepare("SELECT id,name,location,quantity_total FROM lab_fixture_inventory WHERE id=?").get(id)
    if (!item) return null
    const loans = db.prepare("SELECT COALESCE(SUM(li.quantity),0) AS value FROM lab_fixture_loan_items li JOIN lab_fixture_loans l ON l.id=li.loan_id WHERE li.inventory_item_id=? AND l.status IN ('pending','approved','overdue','lost_stolen')").get(id).value
    const experiments = db.prepare("SELECT COALESCE(SUM(quantity),0) AS value FROM lab_fixture_experiment_items WHERE inventory_item_id=? AND status='active'").get(id).value
    const quantity_reserved = Number(loans) + Number(experiments)
    return { ...item, quantity_reserved, quantity_available: Math.max(0, item.quantity_total - quantity_reserved), available: item.quantity_total > quantity_reserved }
  }
  const requireStock = (items) => {
    for (const item of items) {
      const inventory = inventoryWithAvailability(item.inventoryItemId)
      if (!inventory) throw new Error("inventory-item-unavailable-or-not-found")
      if (item.quantity > inventory.quantity_available) throw new Error("inventory-insufficient-quantity")
    }
  }
  return {
    ensureInventoryFixtures() { const insert=db.prepare("INSERT OR IGNORE INTO lab_fixture_inventory (id,name,location,available,quantity_total) VALUES (?, ?, ?, 1, ?)"); insert.run("fixture-laser-01","Láser He-Ne","Banco de óptica A",5); insert.run("fixture-lens-02","Kit de lentes","Gabinete 2",3); db.prepare("UPDATE lab_fixture_inventory SET quantity_total=5 WHERE id='fixture-laser-01'").run(); db.prepare("UPDATE lab_fixture_inventory SET quantity_total=3 WHERE id='fixture-lens-02'").run() },
    listInventory() { return db.prepare("SELECT id FROM lab_fixture_inventory ORDER BY name").all().map((row)=>inventoryWithAvailability(row.id)) },
    reserveInventory({ id, quantity = 1 }) { const item = normalizeItems([{ inventoryItemId:id, quantity }])[0]; requireStock([item]); return inventoryWithAvailability(id) },
    grantMembership({ userId, scope = "approved" }) { if (!['approved','external'].includes(scope)) throw new Error("fixture-invalid-membership-scope"); db.prepare("INSERT INTO lab_fixture_memberships VALUES (?, ?, ?) ON CONFLICT(gots_user_id) DO UPDATE SET scope=excluded.scope, approved_at=excluded.approved_at").run(userId, scope, now()) },
    getMembership(userId) { return db.prepare("SELECT * FROM lab_fixture_memberships WHERE gots_user_id = ?").get(userId) ?? null },
    grantLoanResponsible({ userId }) { if (!userId) throw new Error("fixture-invalid-responsible"); db.prepare("INSERT OR IGNORE INTO lab_fixture_loan_responsibles (user_id) VALUES (?)").run(userId) },
    grantLabAdmin({ userId }) { if (!userId) throw new Error("fixture-invalid-admin"); db.prepare("INSERT OR IGNORE INTO lab_fixture_admins (user_id) VALUES (?)").run(userId) },
    isLabAdmin(userId) { return Boolean(db.prepare("SELECT 1 FROM lab_fixture_admins WHERE user_id=?").get(userId)) },
    listLabMemberships({ actorId }) { if(!this.isLabAdmin(actorId))throw new Error("lab-admin-required");return {memberships:db.prepare("SELECT gots_user_id,scope,approved_at FROM lab_fixture_memberships ORDER BY gots_user_id").all(),responsibles:this.listLoanResponsibles(),admins:db.prepare("SELECT user_id FROM lab_fixture_admins ORDER BY user_id").all().map(row=>row.user_id)} },
    setLabMembership({ actorId,userId,scope }) { if(!this.isLabAdmin(actorId))throw new Error("lab-admin-required");this.grantMembership({userId,scope});return this.getMembership(userId) },
    isLoanResponsible(userId) { return Boolean(db.prepare("SELECT 1 FROM lab_fixture_loan_responsibles WHERE user_id = ?").get(userId)) },
    listLoanResponsibles() { return db.prepare("SELECT user_id FROM lab_fixture_loan_responsibles ORDER BY user_id").all().map((row) => row.user_id) },
    grantMembership({ userId, scope = "approved" }) {
      if (!['approved', 'external'].includes(scope)) throw new Error("fixture-invalid-membership-scope")
      db.prepare("INSERT INTO lab_fixture_memberships VALUES (?, ?, ?) ON CONFLICT(gots_user_id) DO UPDATE SET scope=excluded.scope, approved_at=excluded.approved_at").run(userId, scope, now())
    },
    getMembership(userId) { return db.prepare("SELECT * FROM lab_fixture_memberships WHERE gots_user_id = ?").get(userId) ?? null },
    addExperiment({ id, ownerId, title, status = "draft" }) {
      db.prepare("INSERT INTO lab_fixture_experiments VALUES (?, ?, ?, ?, ?)").run(id, ownerId, title, status, now())
    },
    listExperiments(ownerId) { return db.prepare("SELECT * FROM lab_fixture_experiments WHERE owner_id = ? ORDER BY created_at").all(ownerId) },
    listDiscoverableExperiments(userId) { return db.prepare("SELECT id FROM lab_fixture_experiments WHERE status='in_progress' AND owner_id != ? ORDER BY created_at DESC").all(userId).map((row)=>{const experiment=this.getExperiment(row.id);const participation=experiment.participants.find((item)=>item.user_id===userId);return {...experiment,participation_status:participation?.status??"none"}}) },
    getExperiment(id) { const experiment=db.prepare("SELECT * FROM lab_fixture_experiments WHERE id=?").get(id); if(!experiment)return null; return {...experiment,items:db.prepare("SELECT * FROM lab_fixture_experiment_items WHERE experiment_id=? ORDER BY id").all(id),sessions:db.prepare("SELECT * FROM lab_fixture_experiment_sessions WHERE experiment_id=? ORDER BY created_at").all(id),participants:db.prepare("SELECT * FROM lab_fixture_experiment_participants WHERE experiment_id=? ORDER BY requested_at").all(id)} },
    canEditExperiment(experimentId, userId) { const experiment=db.prepare("SELECT owner_id FROM lab_fixture_experiments WHERE id=?").get(experimentId); return Boolean(experiment && (experiment.owner_id===userId || db.prepare("SELECT 1 FROM lab_fixture_experiment_participants WHERE experiment_id=? AND user_id=? AND status='approved'").get(experimentId,userId))) },
    requestExperimentAccess({ id, experimentId, userId }) { const experiment=this.getExperiment(experimentId);if(!experiment)throw new Error("experiment-not-found");if(experiment.status!=="in_progress")throw new Error("experiment-access-requires-in-progress");if(experiment.owner_id===userId)throw new Error("experiment-owner-cannot-request");db.prepare("INSERT INTO lab_fixture_experiment_participants VALUES (?, ?, ?, 'pending', 'requested_by_user', ?, NULL, NULL)").run(id,experimentId,userId,now());return this.getExperiment(experimentId) },
    resolveExperimentAccess({ participantId, ownerId, status }) { if(!['approved','rejected'].includes(status))throw new Error("experiment-invalid-participant-transition");const participant=db.prepare("SELECT * FROM lab_fixture_experiment_participants WHERE id=?").get(participantId);if(!participant)throw new Error("experiment-participant-not-found");const experiment=this.getExperiment(participant.experiment_id);if(experiment.owner_id!==ownerId)throw new Error("experiment-owner-required");if(participant.status!=="pending")throw new Error("experiment-participant-transition-not-allowed");db.prepare("UPDATE lab_fixture_experiment_participants SET status=?,resolved_by=?,resolved_at=? WHERE id=? AND status='pending'").run(status,ownerId,now(),participantId);return this.getExperiment(participant.experiment_id) },
    startExperiment({ experimentId, ownerId, simulatedAcceptance }) { const run=db.transaction(()=>{const experiment=this.getExperiment(experimentId);if(!experiment)throw new Error("experiment-not-found");if(experiment.owner_id!==ownerId)throw new Error("experiment-owner-required");if(experiment.status!=="draft")throw new Error("experiment-transition-not-allowed");if(!simulatedAcceptance)throw new Error("experiment-simulated-acceptance-required");db.prepare("INSERT INTO lab_fixture_acceptances VALUES (?, ?, ?, ?, 1, ?)").run(`accept-${experimentId}`,experimentId,ownerId,"fixture-1",now());db.prepare("UPDATE lab_fixture_experiments SET status='in_progress' WHERE id=?").run(experimentId)});run();return this.getExperiment(experimentId) },
    addExperimentItem({ id, experimentId, actorId, inventoryItemId, quantity = 1 }) { const run=db.transaction(()=>{const experiment=this.getExperiment(experimentId);if(!experiment)throw new Error("experiment-not-found");if(!this.canEditExperiment(experimentId,actorId))throw new Error("experiment-owner-or-approved-participant-required");if(!['draft','in_progress'].includes(experiment.status))throw new Error("experiment-items-not-editable");const item=normalizeItems([{inventoryItemId,quantity}])[0];requireStock([item]);db.prepare("INSERT INTO lab_fixture_experiment_items (id,experiment_id,inventory_item_id,quantity,status,added_by,returned_at) VALUES (?, ?, ?, ?, 'active', ?, NULL)").run(id,experimentId,item.inventoryItemId,item.quantity,actorId)});run();return this.getExperiment(experimentId) },
    openExperimentSession({ id, experimentId, ownerId, startedAt, plannedEnd }) { const run=db.transaction(()=>{const experiment=this.getExperiment(experimentId);if(!experiment)throw new Error("experiment-not-found");if(experiment.owner_id!==ownerId)throw new Error("experiment-owner-required");if(experiment.status!=="in_progress")throw new Error("experiment-session-requires-in-progress");if(!startedAt||!plannedEnd||new Date(plannedEnd)<new Date(startedAt))throw new Error("experiment-session-invalid-time");if(db.prepare("SELECT 1 FROM lab_fixture_experiment_sessions WHERE experiment_id=? AND ended_at_actual IS NULL").get(experimentId))throw new Error("experiment-open-session-exists");db.prepare("INSERT INTO lab_fixture_experiment_sessions VALUES (?, ?, ?, ?, NULL, ?, ?)").run(id,experimentId,startedAt,plannedEnd,ownerId,now())});run();return this.getExperiment(experimentId) },
    closeExperimentSession({ sessionId, ownerId, endedAt = now() }) { const run=db.transaction(()=>{const session=db.prepare("SELECT * FROM lab_fixture_experiment_sessions WHERE id=?").get(sessionId);if(!session)throw new Error("experiment-session-not-found");const experiment=this.getExperiment(session.experiment_id);if(experiment.owner_id!==ownerId)throw new Error("experiment-owner-required");if(session.ended_at_actual)throw new Error("experiment-session-already-closed");if(new Date(endedAt)<new Date(session.started_at))throw new Error("experiment-session-invalid-time");db.prepare("UPDATE lab_fixture_experiment_sessions SET ended_at_actual=? WHERE id=? AND ended_at_actual IS NULL").run(endedAt,sessionId)});run();return this.getExperiment(db.prepare("SELECT experiment_id FROM lab_fixture_experiment_sessions WHERE id=?").get(sessionId).experiment_id) },
    finishExperiment({ experimentId, ownerId }) { const run=db.transaction(()=>{const experiment=this.getExperiment(experimentId);if(!experiment)throw new Error("experiment-not-found");if(experiment.owner_id!==ownerId)throw new Error("experiment-owner-required");if(experiment.status==='finished'||experiment.status==='cancelled')throw new Error("experiment-transition-not-allowed");if(db.prepare("SELECT 1 FROM lab_fixture_experiment_sessions WHERE experiment_id=? AND ended_at_actual IS NULL").get(experimentId))throw new Error("experiment-open-session-exists");db.prepare("UPDATE lab_fixture_experiment_items SET status='returned',returned_at=? WHERE experiment_id=? AND status='active'").run(now(),experimentId);db.prepare("UPDATE lab_fixture_experiments SET status='finished' WHERE id=?").run(experimentId)});run();return this.getExperiment(experimentId) },
    addSyntheticImage({ id, experimentId, actorId, localPath, mediaType }) {
      const fixture = SYNTHETIC_ATTACHMENTS[localPath]
      if (!fixture || mediaType !== fixture.mediaType || fixture.sizeBytes > 2 * 1024 * 1024) throw new Error("fixture-image-not-allowed")
      if (!this.getExperiment(experimentId)) throw new Error("experiment-not-found")
      if (!this.canEditExperiment(experimentId, actorId)) throw new Error("experiment-owner-or-approved-participant-required")
      db.prepare("INSERT INTO lab_fixture_attachments VALUES (?, ?, ?, ?, ?)").run(id, experimentId, localPath, mediaType, now())
      return { id, experiment_id: experimentId, local_path: localPath, media_type: mediaType, size_bytes: fixture.sizeBytes }
    },
    listSyntheticImages({ experimentId, actorId }) { if (!this.getExperiment(experimentId)) throw new Error("experiment-not-found"); if (!this.canEditExperiment(experimentId, actorId)) throw new Error("experiment-owner-or-approved-participant-required"); return db.prepare("SELECT * FROM lab_fixture_attachments WHERE experiment_id = ? ORDER BY created_at").all(experimentId).map((row) => ({ ...row, size_bytes: SYNTHETIC_ATTACHMENTS[row.local_path]?.sizeBytes ?? 0 })) },
    addLocalUpload({ id, experimentId, actorId, storageKey, mediaType, sizeBytes }) {
      if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(storageKey) || !["image/jpeg","image/png","image/webp"].includes(mediaType) || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 5 * 1024 * 1024) throw new Error("attachment-upload-invalid")
      if (!this.getExperiment(experimentId)) throw new Error("experiment-not-found")
      if (!this.canEditExperiment(experimentId, actorId)) throw new Error("experiment-owner-or-approved-participant-required")
      const localPath=`local-upload:${storageKey}`; db.prepare("INSERT INTO lab_fixture_attachments VALUES (?, ?, ?, ?, ?)").run(id,experimentId,localPath,mediaType,now())
      return { id, experiment_id:experimentId, local_path:localPath, media_type:mediaType, size_bytes:sizeBytes }
    },
    getLocalUpload({ attachmentId, actorId }) { const row=db.prepare("SELECT * FROM lab_fixture_attachments WHERE id=?").get(attachmentId);if(!row)throw new Error("attachment-not-found");if(!row.local_path.startsWith("local-upload:"))throw new Error("attachment-not-upload");if(!this.canEditExperiment(row.experiment_id,actorId))throw new Error("experiment-owner-or-approved-participant-required");return {...row,storage_key:row.local_path.slice("local-upload:".length)} },
    createInternalNotification({ id, userId, type, body }) {
      db.prepare("INSERT INTO lab_fixture_notifications VALUES (?, ?, ?, ?, NULL, ?)").run(id, userId, type, body, now())
    },
    listInternalNotifications(userId) { return db.prepare("SELECT * FROM lab_fixture_notifications WHERE user_id = ? ORDER BY created_at").all(userId) },
    markInternalNotificationRead({ id, userId }) { const result=db.prepare("UPDATE lab_fixture_notifications SET read_at=? WHERE id=? AND user_id=? AND read_at IS NULL").run(now(),id,userId);if(!result.changes)throw new Error("notification-not-found-or-already-read");return db.prepare("SELECT * FROM lab_fixture_notifications WHERE id=?").get(id) },
    recordSimulatedAcceptance({ id, experimentId, userId, policyVersion = "fixture-1" }) {
      db.prepare("INSERT INTO lab_fixture_acceptances VALUES (?, ?, ?, ?, 1, ?)").run(id, experimentId, userId, policyVersion, now())
    },
    listSimulatedAcceptances(experimentId) { return db.prepare("SELECT * FROM lab_fixture_acceptances WHERE experiment_id = ?").all(experimentId) },
    createLoan({ id, requesterId, professorId, items, itemIds, purposeDescription, usageStart, usageEnd, simulatedAcceptance }) {
      const requestedItems = normalizeItems(items, itemIds)
      if (!id || !requesterId || !professorId || !this.isLoanResponsible(professorId) || !simulatedAcceptance) throw new Error("loan-invalid-request")
      if (!String(purposeDescription ?? "").trim() || String(purposeDescription).trim().length < 10 || !usageStart || !usageEnd || new Date(usageEnd) <= new Date(usageStart)) throw new Error("loan-invalid-request")
      const create = db.transaction(() => {
        requireStock(requestedItems)
        db.prepare("INSERT INTO lab_fixture_loans (id, requester_id, professor_id, purpose_description, usage_start, usage_end, status, simulated_acceptance, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, ?)")
          .run(id, requesterId, professorId, String(purposeDescription).trim(), usageStart, usageEnd, now())
        const insertItem = db.prepare("INSERT INTO lab_fixture_loan_items (loan_id, inventory_item_id, quantity) VALUES (?, ?, ?)")
        for (const item of requestedItems) insertItem.run(id, item.inventoryItemId, item.quantity)
      })
      create()
      return this.getLoan(id)
    },
    refreshOverdue(nowIso = now()) { return db.prepare("UPDATE lab_fixture_loans SET status = 'overdue' WHERE status = 'approved' AND usage_end < ?").run(nowIso).changes },
    getLoan(id) { const row = db.prepare("SELECT * FROM lab_fixture_loans WHERE id = ?").get(id); return row ? { ...row, simulated_acceptance: Boolean(row.simulated_acceptance), items: db.prepare("SELECT inventory_item_id, quantity FROM lab_fixture_loan_items WHERE loan_id = ? ORDER BY inventory_item_id").all(id) } : null },
    listLoansFor({ userId, role }) { this.refreshOverdue(); const rows = role === "PROFESSOR" ? db.prepare("SELECT id FROM lab_fixture_loans WHERE requester_id = ? OR professor_id = ? ORDER BY created_at DESC").all(userId, userId) : db.prepare("SELECT id FROM lab_fixture_loans WHERE requester_id = ? ORDER BY created_at DESC").all(userId); return rows.map((row) => this.getLoan(row.id)) },
    decideLoan({ loanId, professorId, decision, rejectionReason }) {
      if (!['approved', 'rejected'].includes(decision)) throw new Error("loan-invalid-transition")
      const decide = db.transaction(() => {
        const loan = this.getLoan(loanId)
        if (!loan) throw new Error("loan-not-found")
        if (loan.professor_id !== professorId) throw new Error("loan-decision-forbidden")
        if (loan.status !== "pending") throw new Error("loan-transition-not-allowed")
        db.prepare("UPDATE lab_fixture_loans SET status = ?, decided_at = ?, decided_by = ?, rejection_reason = ? WHERE id = ? AND status = 'pending'")
          .run(decision, now(), professorId, decision === "rejected" ? String(rejectionReason ?? "").trim() || null : null, loanId)
      })
      decide()
      return this.getLoan(loanId)
    },
    requestLoanExtension({ loanId, requesterId, newUsageEnd }) { const loan=this.getLoan(loanId);if(!loan)throw new Error("loan-not-found");if(loan.requester_id!==requesterId)throw new Error("loan-extension-forbidden");if(!['approved','overdue'].includes(loan.status))throw new Error("loan-transition-not-allowed");if(!newUsageEnd||new Date(newUsageEnd)<=new Date(loan.usage_end))throw new Error("loan-extension-invalid-date");db.prepare("UPDATE lab_fixture_loans SET requested_new_usage_end=? WHERE id=?").run(newUsageEnd,loanId);return this.getLoan(loanId) },
    resolveLoanExtension({ loanId, professorId, approve }) { const loan=this.getLoan(loanId);if(!loan)throw new Error("loan-not-found");if(loan.professor_id!==professorId)throw new Error("loan-decision-forbidden");if(!loan.requested_new_usage_end)throw new Error("loan-extension-not-pending");if(approve)db.prepare("UPDATE lab_fixture_loans SET usage_end=?,requested_new_usage_end=NULL,status='approved' WHERE id=?").run(loan.requested_new_usage_end,loanId);else db.prepare("UPDATE lab_fixture_loans SET requested_new_usage_end=NULL WHERE id=?").run(loanId);return this.getLoan(loanId) },
    returnLoan({ loanId, actorId, isResponsible }) {
      const finish = db.transaction(() => {
        const loan = this.getLoan(loanId)
        if (!loan) throw new Error("loan-not-found")
        if (loan.requester_id !== actorId && !(isResponsible && loan.professor_id === actorId)) throw new Error("loan-return-forbidden")
        if (!['approved', 'overdue'].includes(loan.status)) throw new Error("loan-transition-not-allowed")
        db.prepare("UPDATE lab_fixture_loans SET status = 'returned', returned_at = ? WHERE id = ?").run(now(), loanId)
      })
      finish()
      return this.getLoan(loanId)
    },
    close() { db.close() },
  }
}
