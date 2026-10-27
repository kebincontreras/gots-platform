# Labs parity map

Source reviewed: local `../GOTS_LAB` checkout. This is a precise local-preview comparison, not a production migration claim.

| GOTS_LAB capability | Original source | Local GOTS Labs preview | Deliberately still absent |
| --- | --- | --- | --- |
| Identity and access | `src/hooks/useAuth.ts`, profile RLS | Existing NextAuth session; development-only UUID grants in isolated SQLite | Production membership relation/migration |
| Inventory and availability | `queries/inventory.ts`; `00028_prestamos.sql` | Read-only inventory UI with `quantity_total`, aggregate reservations and `quantity_available`; pending loans and active experiment items share one local SQLite stock transaction | Imported catalogue quantities, locations and images |
| Loan request | `queries/loans.ts:152-228` | Persistent pending request, dates, purpose, selected local responsible UUID, per-item quantities and explicit simulated acknowledgement | Multi-item cart UI, extension and lost/stolen UI |
| Loan decision/return | `queries/loans.ts:331-457` | Responsible-only approve/reject, requester/responsible return, overdue refresh and restart persistence | Real legal acceptance and notifications |
| Experiment lifecycle | `queries/experiments.ts:510-533, 980-1155` | Owner creates, starts with simulated acknowledgement, reserves fixture item, opens/closes one session, and finishes with transactional item return | Collaborators, observations, dates/stages and cancellation |
| Experiment legal acceptance | `0004_legal_acceptance.sql`, `queries/experiments.ts:328-351` | Explicitly labelled simulated test row only | Legal effect, immutable production audit |
| Files/images | Supabase Storage and attachment queries | Guarded development API lets the owner/approved collaborator attach and list one exact packaged `/labs-fixtures/laser.svg` asset; path traversal, external paths and mismatched media types are rejected | Multipart upload validation/quota, object storage, signed access, attachment UI and migration |
| Collaborators/admin | `queries/participants.ts`, participant RLS | Pending self-request, owner-only resolution and approved-collaborator equipment reservation are persisted and API-wired; grants/responsibles are dev environment fixtures only | Discovery/invites UI, observations, membership administration, audit UI and original RLS policies |
| Notifications/email | migrations and `functions/send-email` | Local notification rows exist only in the fixture store; no delivery, inbox UI or notification API | In-app inbox/read state, templates, email/webhooks and audit retention |

Reservation clarification: original `get_inventory_availability()` counts loans in `pending`, `approved`, `overdue` and `lost_stolen` (`00028_prestamos.sql` lines 359-376). The original loan-item insert trigger locks inventory and counts pending requests before insert (lines 427-472). The local transaction therefore reserves at pending-request creation and releases only when rejected or returned; it does not reserve from the inventory screen.

## Complete remaining original-function list

- Inventory: imported real catalogue, locations/boxes, categories, kits and child items, search/filtering, photos and item history. The local fixture now supports quantities greater than one and availability shared with every workflow.
- Experiments: full wizard fields, item quantities/sharing, invitations and discovery UI, participant observations, planned dates/stages, cancellation, overdue auto-close, detail/history and immutable real acceptance.
- Loans: cart with quantities, selecting/displaying responsible staff, rejection reason UI, extension request/resolution, overdue/lost-stolen lifecycle, real legal acceptance and history.
- Communication: in-app notification views, email/webhook delivery, readable notification audit and message templates.
- Administration: real member/responsible mapping, role management, audit views and all original RLS policies.

## Production integration plan (not executed)

1. Keep existing NextAuth `users.id` as the sole account identity; add a new, migration-reviewed laboratory relation keyed by that UUID rather than making another account table.
2. Configure a separate non-production database/schema using the repo's existing `DATABASE_URL`/`POSTGRES_URL` convention in `lib/store.ts`; migrate synthetic data first and validate every RLS/transaction invariant.
3. Introduce server-side route adapters over that relation and the GOTS_LAB-derived tables, then run a reviewed UUID mapping/import with a rollback snapshot. Do not import passwords, sessions, external credentials, files or email settings.
4. Add delivery/storage only after explicit service configuration and approval; keep notifications disabled until their recipient, retention and audit rules are reviewed.
