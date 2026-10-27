# Labs parity map

Source reviewed: local `../GOTS_LAB` checkout. This is a precise local-preview comparison, not an imported-data claim. On 2026-10-27 the empty, additive `lab_*` schema was applied to the existing GOTS Neon database; no GOTS_LAB/Supabase data was inspected or imported. The committed runtime selects the production Postgres adapter only with all fail-closed flags. It is not public until the branch is deployed.

| GOTS_LAB capability | Original source | Local GOTS Labs preview | Deliberately still absent |
| --- | --- | --- | --- |
| Identity and access | `src/hooks/useAuth.ts`, profile RLS | Existing NextAuth session; development-only UUID grants in isolated SQLite | Production membership relation/migration |
| Inventory and availability | `queries/inventory.ts`; `00028_prestamos.sql` | Read-only local catalogue API preserves top-level-only browsing, locations, categories, boxes, kit-child aggregate availability, text/location/category filters and synthetic item history; pending loans and active experiment items share one SQLite stock transaction | Imported catalogue quantities/photos and the original complete browse/detail UI |
| Loan request | `queries/loans.ts:152-228` | Persistent pending request, dates, purpose, selected local responsible UUID, per-item quantities and explicit simulated acknowledgement | Multi-item cart UI, extension and lost/stolen UI |
| Loan decision/return | `queries/loans.ts:331-457` | Responsible-only approve/reject, requester/responsible return, overdue refresh and restart persistence | Real legal acceptance and notifications |
| Experiment lifecycle | `queries/experiments.ts:510-533, 980-1155` | Owner creates, starts with simulated acknowledgement, reserves fixture item, opens/closes one session, and finishes with transactional item return | Collaborators, observations, dates/stages and cancellation |
| Experiment legal acceptance | `0004_legal_acceptance.sql`, `queries/experiments.ts:328-351` | Explicitly labelled simulated test row only | Legal effect, immutable production audit |
| Files/images | Supabase Storage and attachment queries | Guarded development API lets the owner/approved collaborator attach and list one exact packaged `/labs-fixtures/laser.svg` asset; path traversal, external paths and mismatched media types are rejected | Multipart upload validation/quota, object storage, signed access, attachment UI and migration |
| Collaborators/admin | `queries/participants.ts`, participant RLS | Pending self-request, owner-only resolution and approved-collaborator equipment reservation are persisted and API-wired; grants/responsibles are dev environment fixtures only | Discovery/invites UI, observations, membership administration, audit UI and original RLS policies |
| Notifications/email | migrations and `functions/send-email` | Local notification rows exist only in the fixture store; no delivery, inbox UI or notification API | In-app inbox/read state, templates, email/webhooks and audit retention |

Reservation clarification: original `get_inventory_availability()` counts loans in `pending`, `approved`, `overdue` and `lost_stolen` (`00028_prestamos.sql` lines 359-376). The original loan-item insert trigger locks inventory and counts pending requests before insert (lines 427-472). The local transaction therefore reserves at pending-request creation and releases only when rejected or returned; it does not reserve from the inventory screen.

## Complete remaining original-function list

## Verifiable parity matrix (2026-10-27)

| Area | UI in GOTS preview | Local API/store | Evidence | Remaining before a real release |
| --- | --- | --- | --- | --- |
| Catalogue | Search/filter controls, cards, kit detail/children and local history | `/api/labs/inventory` supports location/category/box/query/detail and kit aggregates | fixture-store catalogue test; authenticated HTTP query | Import/review real items/photos and complete original modal/grid affordances |
| Loans | Multi-item cart and lifecycle controls | Pending reservation, decision, extension, lost/stolen, return | loan fixture suites and authenticated HTTP pass | Real acceptance, named staff directory, notification delivery/audit |
| Experiment wizard | Compact create/start/reserve/session UI; lifecycle workspace | Owner/participant/stock/session/stage/observations/cancel | experiment fixture suites and authenticated three-user HTTP pass | Original multi-step wizard fields, category/date planning and full detail/history UI |
| Attachments | Synthetic attachment workspace | Guarded packaged/local multipart metadata/download | attachment fixture tests | Storage configuration, scanning/quota, signed production access |
| Inbox/admin | Local inbox/admin components | Local notification rows and explicit fixture grants | fixture store authorization tests | Delivery, retention/audit controls and authoritative membership source |
| Production adapter | Server-only Postgres adapter and all API handlers | Explicit membership, owner/participant/responsible predicates, parameterized SQL, `FOR UPDATE` stock reservation and transaction wrapper | pg-mem contract tests; PGlite PostgreSQL-WASM schema/rollback test; DDL executed in Neon | Disposable real PostgreSQL validation with multiple connections; administrator-controlled first grants/catalogue |

- Inventory: imported real catalogue, locations/boxes, categories, kits and child items, search/filtering, photos and item history. The local fixture now supports the original catalogue shape with synthetic locations/categories/boxes/kits and availability shared with every workflow, but its UI is still a compact preview rather than the original complete browse/detail experience.
- Experiments: full wizard fields, item quantities/sharing, invitations and discovery UI, participant observations, planned dates/stages, cancellation, overdue auto-close, detail/history and immutable real acceptance.
- Loans: cart with quantities, selecting/displaying responsible staff, rejection reason UI, extension request/resolution, overdue/lost-stolen lifecycle, real legal acceptance and history.
- Communication: in-app notification views, email/webhook delivery, readable notification audit and message templates.
- Administration: real member/responsible mapping, role management, audit views and all original RLS policies.

## Production integration status

1. Done: existing NextAuth `users.id` remains the sole account identity; `lab_memberships` is a separate explicit relation keyed by it.
2. Done: the additive schema was applied to the verified existing GOTS Neon destination. It starts empty; no user mapping/import was performed.
3. Done in code, pending publication: all Labs handlers use the server-side adapter. The production adapter never derives access from email/domain/role or fixture flags.
4. Pending by design: database-blob attachments are implemented but disabled until an operator accepts the 5 MiB-per-file/25 MiB-per-experiment quota and backup impact. Notification email/webhooks are not implemented or enabled.
5. Pending real validation: a disposable PostgreSQL target with two client connections is required to demonstrate concurrent stock and quota transactions. No existing isolated target was available, and no production test rows were created.
