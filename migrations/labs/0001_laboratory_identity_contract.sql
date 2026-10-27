-- REVIEW ONLY: no migration runner executes this file.
-- Apply only to a named non-production database after reviewing its actual
-- schema and a one-to-one UUID mapping. Never infer membership from email,
-- broad GOTS role, display name, or a legacy external account.
CREATE TABLE laboratory_identity_map (
  gots_user_id text PRIMARY KEY,
  lab_profile_id text NOT NULL UNIQUE,
  scope text NOT NULL CHECK (scope IN ('approved','external')),
  approved_at timestamptz NOT NULL DEFAULT now()
);
