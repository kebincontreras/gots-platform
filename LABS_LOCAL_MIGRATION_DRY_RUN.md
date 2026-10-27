# Labs local migration dry-run

This plan is deliberately non-executable against GOTS production, Neon, or
Supabase. It is an adapter/migration review checklist for a separate local
SQLite preview database only.

## Preconditions

1. Select a new empty SQLite file outside `data/app.db`.
2. Supply a reviewed mapping of existing GOTS `users.id` values to individual
   laboratory grants. Email suffixes and broad GOTS roles are invalid inputs.
3. Copy only synthetic fixture rows. Do not copy GOTS_LAB profiles, inventory,
   attachments, legal records, or notifications.

## Alternative: empty Labs on the existing GOTS datastore

If the decision is to stop depending on the original GOTS_LAB Supabase
project, start Labs **empty** on the datastore already configured for GOTS.
This option must not inspect, copy, connect to, or modify the original
Supabase project. It still needs a separate, reviewed migration against the
actual GOTS datastore before execution: a laboratory membership relation keyed
by existing GOTS user UUIDs; empty locations/inventory; and laboratory rows
for loans/experiments/participants/sessions. Existing GOTS accounts remain the
only identity source. No automatic grant follows from domain, role, or email.

This document does not authorize that migration, create infrastructure, or
publish synthetic fixtures as laboratory data. It records the implementation
choice only, pending the explicit answer whether Labs should begin empty.

## Dry-run schema order

1. `lab_memberships(gots_user_id, scope, approved_by, approved_at)` with a
   unique user ID and explicit scope.
2. Inventory locations/items and local attachment metadata.
3. Experiments, participants, items, sessions, and simulated-only acceptance
   records.
4. Loan requests/items and their local state transitions.
5. Internal notifications, with no delivery worker, webhook, or email column.

## Authorization adapter requirements

The server adapter must receive the NextAuth user ID, look up one explicit
membership row, and enforce the original owner/approved-participant and
pending-only transitions in transactions. It must never trust a client role,
email domain, fixture flag, or item ID.

## Rollback

Preview rollback is removal of the dedicated SQLite preview file only. No
schema changes are permitted in `data/app.db`, Neon, or Supabase until a
separate reviewed migration exists. The dry run makes no accounts, sends no
email, uploads no files, and has no legal acceptance effect.
