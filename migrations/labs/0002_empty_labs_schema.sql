-- REVIEW ONLY — additive empty-Labs schema for the datastore already used by
-- GOTS.  This file has no runner. Do not apply until DATABASE_URL/POSTGRES_URL
-- is verified as the intended GOTS database and a backup/change window exists.
-- No table reads from, references, or imports the original GOTS_LAB Supabase.
CREATE TABLE lab_memberships (
  gots_user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('approved','external')),
  approved_by text REFERENCES users(id), approved_at text NOT NULL
);
CREATE TABLE lab_admins (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE);
-- Responsibility is an explicit Labs grant, never inferred from a GOTS role.
CREATE TABLE lab_loan_responsibles (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE lab_locations (
  id text PRIMARY KEY, type text NOT NULL CHECK(type IN ('cajon','armario')),
  number integer NOT NULL, label text NOT NULL, building text, created_at text NOT NULL,
  UNIQUE(type,number)
);
CREATE TABLE lab_inventory_items (
  id text PRIMARY KEY, location_id text NOT NULL REFERENCES lab_locations(id),
  reference text, name text NOT NULL, description text, quantity_total integer NOT NULL CHECK(quantity_total>=0),
  image_path text, category text, box_label text, kit_parent_id text REFERENCES lab_inventory_items(id),
  created_at text NOT NULL, updated_at text NOT NULL
);
CREATE TABLE lab_experiments (
  id text PRIMARY KEY, owner_id text NOT NULL REFERENCES users(id), title text NOT NULL,
  description text, category text, status text NOT NULL CHECK(status IN ('draft','in_progress','finished','cancelled')),
  stage text CHECK(stage IS NULL OR stage IN ('montaje','toma_datos')), created_at text NOT NULL
);
CREATE TABLE lab_experiment_participants (
  id text PRIMARY KEY, experiment_id text NOT NULL REFERENCES lab_experiments(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id), status text NOT NULL CHECK(status IN ('pending','approved','rejected')),
  source text NOT NULL CHECK(source IN ('invited_by_owner','requested_by_user')), requested_at text NOT NULL,
  resolved_by text REFERENCES users(id), resolved_at text, UNIQUE(experiment_id,user_id)
);
CREATE TABLE lab_experiment_items (
  id text PRIMARY KEY, experiment_id text NOT NULL REFERENCES lab_experiments(id) ON DELETE CASCADE,
  inventory_item_id text NOT NULL REFERENCES lab_inventory_items(id), quantity integer NOT NULL CHECK(quantity>0),
  status text NOT NULL CHECK(status IN ('active','returned')), added_by text NOT NULL REFERENCES users(id),
  reserved_at text NOT NULL, returned_at text
);
CREATE UNIQUE INDEX lab_experiment_active_item ON lab_experiment_items(experiment_id,inventory_item_id) WHERE status='active';
CREATE TABLE lab_experiment_sessions (
  id text PRIMARY KEY, experiment_id text NOT NULL REFERENCES lab_experiments(id) ON DELETE CASCADE,
  started_at text NOT NULL, ended_at_planned text NOT NULL, ended_at_actual text, observations text,
  created_by text NOT NULL REFERENCES users(id), created_at text NOT NULL
);
CREATE TABLE lab_attachments (id text PRIMARY KEY, experiment_id text NOT NULL REFERENCES lab_experiments(id) ON DELETE CASCADE, path text NOT NULL, media_type text NOT NULL, size_bytes integer NOT NULL DEFAULT 0 CHECK(size_bytes>=0), sha256 text, created_at text NOT NULL);
CREATE TABLE lab_attachment_blobs (attachment_id text PRIMARY KEY REFERENCES lab_attachments(id) ON DELETE CASCADE, content bytea NOT NULL);
CREATE TABLE lab_loans (
  id text PRIMARY KEY, requester_id text NOT NULL REFERENCES users(id), responsible_id text NOT NULL REFERENCES users(id),
  purpose_description text NOT NULL, usage_start text NOT NULL, usage_end text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','approved','rejected','overdue','returned','lost_stolen')),
  requested_new_usage_end text, rejection_reason text, decided_by text REFERENCES users(id), decided_at text, returned_at text, created_at text NOT NULL
);
CREATE TABLE lab_loan_items (loan_id text NOT NULL REFERENCES lab_loans(id) ON DELETE CASCADE, inventory_item_id text NOT NULL REFERENCES lab_inventory_items(id), quantity integer NOT NULL CHECK(quantity>0), PRIMARY KEY(loan_id,inventory_item_id));
CREATE TABLE lab_notifications (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), type text NOT NULL, body text NOT NULL, read_at text, created_at text NOT NULL);
CREATE INDEX lab_inventory_location_idx ON lab_inventory_items(location_id);
CREATE INDEX lab_inventory_parent_idx ON lab_inventory_items(kit_parent_id);
CREATE INDEX lab_experiment_owner_idx ON lab_experiments(owner_id,created_at);
CREATE INDEX lab_loan_requester_idx ON lab_loans(requester_id,created_at);
