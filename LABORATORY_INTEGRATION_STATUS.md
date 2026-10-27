# Laboratory integration status (pre-publication)

This document distinguishes the committed implementation from the live public
deployment. The reviewed, additive empty-Labs schema was applied once to the
existing GOTS Neon PostgreSQL database on 2026-10-27: it created empty `lab_*`
tables only, and did not read, import, or modify the third-party GOTS_LAB
Supabase project. The three non-storage Labs runtime flags are configured in
Vercel Production but do not take effect until a deployment containing this
branch is published. No production Labs membership, administrator,
responsible, inventory, loan, experiment, attachment, or fixture row exists.

The interactive inventory, experiment and loan routes use a dedicated SQLite
fixture store under `/tmp` (or `GOTS_LAB_LOCAL_FIXTURE_DB`) in development only.
It contains only synthetic rows and is never selected in production.

The public `gots.site` endpoint was read-only verified on 2026-10-27 as a
Vercel-served Next.js deployment (Vercel and Next response headers). The
repository's GitHub Pages workflow is therefore not treated as the active
runtime. No Vercel dashboard metadata or environment values were read.

## What is functional now

| Surface | Current behavior | Data source |
| --- | --- | --- |
| `GOTS Lab` navigation | Goes to the internal `/laboratorio` route on GOTS, on desktop and mobile | GOTS application routes |
| Session boundary | A visitor without a GOTS session is redirected to the existing `/login` flow | Existing NextAuth credentials session |
| Authorization boundary | Inventory and experiments require the explicit `approved_lab_member` scope; loan requests require an explicit laboratory scope | Development UUID grants only; disabled by default and in production |
| Loans | Pending request, aggregate quantity reservation, responsible-only decision and return | Local SQLite; simulated acknowledgement only |
| Experiments | Owner start, shared quantity reservation, single open session, close and finish/return | Local SQLite; collaborators and real legal acceptance absent |
| Experiment attachments | Owner or approved collaborator can create/read packaged SVG metadata and local multipart JPEG/PNG/WebP synthetic files through guarded development routes; generated names and authenticated download prevent traversal | No user/production data, external URL, storage service, malware scanning, quota service or production adapter enabled |
| Registration eligibility | Server accepts only `@correo.uis.edu.co` and `@uis.edu.co` for new GOTS registrations | GOTS `/api/register` |

## Publication and real-validation gate

The public `main` branch currently predates this implementation. Until the
reviewed commits are published and Vercel builds them, `gots.site` remains the
previous release. A successful DDL execution validates schema applicability,
not a functional workflow.

The production backend flags were set after the additive schema succeeded so
the deployment can fail closed if the schema is missing or the database URL is
unavailable. This ordering is safe only because the production Labs tables are
empty and the un-deployed code cannot route requests to them; it does **not**
replace the required functional validation below.

Without persisting synthetic data in production, existing access can complete:

- read-only schema/index/constraint introspection in Neon;
- Vercel build and deployment-log inspection after publication;
- unauthenticated fail-closed checks and public route loading on `gots.site`.

It cannot complete role, stock, multipart, or concurrent-transaction tests on
production without creating membership/inventory rows, even if a transaction
is later rolled back. A rollback test still acquires locks in production and is
therefore intentionally not run there. The minimum isolated validation target
is an existing disposable Neon preview branch/database using synthetic GOTS
users and Labs rows; none was available. Creating one may have plan/cost
implications and is outside this change.

## What remains deliberately unavailable

All four laboratory routes are protected **shells**, not an import of the
operational GOTS_LAB application:

| Route | Present | Missing real functionality |
| --- | --- | --- |
| `/laboratorio` | Public organizational overview/navigation; it has no data | Membership source, laboratory data |
| `/laboratorio/inventario` | Guarded synthetic catalogue query: locations, categories, boxes, kit-child availability and local experiment-item history | Imported locations/photos/catalogue and original search UI |
| `/laboratorio/experimentos` | Guarded fixture lifecycle; approved collaborators may reserve equipment after owner approval | Discovery/invites UI, observations, files and legal effect |
| `/laboratorio/prestamos` | Guarded fixture request/decision/return flow | Extensions, real legal effect and notifications |

The gateway lists empty data until a real GOTS administrator deliberately adds
explicit memberships and inventory. No GOTS_LAB data, files, Supabase project
settings, or user records are read or written by this branch.

## Permission storage

There is **no persisted grant storage yet**. `createLabModuleGateway()` starts
disabled and returns `none` for every GOTS subject. Its `mock` mode receives an
in-memory test object, discarded when the test ends. Therefore no real user can
obtain access from the new routes today.

`external` in the contract is only a compatibility label for the existing
GOTS_LAB legacy external-requester loan flow. The local GOTS registration API
does not create external accounts, and an institutional email never creates an
external or laboratory grant.

## Recommended shared identity path

Use the existing GOTS credentials account and its GOTS user ID as the future
authoritative identity, because it already owns the requested single registration
and the internal session. Add laboratory membership as a separate, least-
privilege relation keyed by that existing ID; do not put it in the email suffix
or broad GOTS role. Existing GOTS_LAB identities/data need an approved mapping
and migration or read-adapter plan before they can be exposed through GOTS.

## Test classification

`pg-mem` is an in-process PostgreSQL **emulator**, not a PostgreSQL server.
`tests/lab-pglite-postgres-engine.test.mjs` additionally runs the reviewed DDL
and a transaction rollback/stock scenario through PGlite's PostgreSQL 17 WASM
engine. PGlite is still not a production PostgreSQL service and does not prove
pool behaviour, multi-connection MVCC, or concurrent stock reservations.
Those require a disposable real PostgreSQL database before operational Labs
data is enabled.

- `tests/institutional-email-contract.test.mjs`: unit tests of the exact
  registration-domain predicate. The API route imports that predicate before any
  user creation.
- `tests/lab-module-contract.test.mjs`: synthetic, in-memory contract tests for
  permission scopes. They do not exercise NextAuth, a browser session, database,
  Supabase, email, RLS, or a real account.
- `tests/common-auth-contract.test.mjs`: pure unit tests for authorization and
  safe redirect/URL behavior.
- Chrome local check: an integration smoke check of the live Next development
  server — the public organizational overview can be reviewed without an
  account, while unauthenticated protected sections redirect to the real GOTS
  login. The internal link appears in desktop/mobile navigation. It does not
  sign in or create an account.
- `next build --webpack`: compilation and route-discovery check, not a
  functional data or authorization integration test.

## Attachment storage decision

No existing GOTS object-storage integration was found. The empty schema now
contains an optional, disabled database-blob path for small private images:
`lab_attachment_blobs.content bytea`, capped at 5 MiB per file and 25 MiB per
experiment, with SHA-256 recorded in `lab_attachments`. It is selected only
when both `GOTS_LABS_ATTACHMENT_STORAGE=database` and
`GOTS_LABS_ATTACHMENT_STORAGE_READY=1` are explicitly set; otherwise routes
fail closed. Authenticated owner/approved-participant reads are enforced and
production never falls back to local disk.

This is transitional, not a substitute for object storage. Database blobs make
private access and backups simple for small volumes but increase DB size and
backup/restore cost. Object storage is preferable at higher volume but needs an
approved provider, private bucket, signed-access policy, lifecycle/retention,
malware scanning, cost owner and operational runbook. Either option needs an
approved destination, quotas, retention, backup impact and real PostgreSQL
concurrency testing before activation. The production attachment flags remain
unset, so upload/download requests return `503`; this is intentional rather
than a disk or public-URL fallback.

## Local HTTP QA (synthetic only)

On 2026-10-27, an isolated localhost server used a temporary SQLite user
database and separate fixture SQLite file under `/tmp`, with three explicit
fixture UUID grants (two members and one responsible professor). It verified:

- credentials login redirects an existing GOTS account into the protected Labs
  route; no second laboratory registration is created;
- a pending request for 3 of 5 laser units returns `201` and inventory then
  reports 3 reserved / 2 available;
- a competing request for 3 units returns `409 inventory-insufficient-quantity`;
- only the configured responsible can approve; the requester can request an
  extension; another member receives `403 loan-extension-forbidden`;
- approved extension persists, and requester return restores the loan state to
  `returned` and releases all three units.

A second authenticated HTTP pass used three separate NextAuth cookie jars for
an owner, an approved collaborator and an approved non-participant. It created
an experiment, started it with the explicit synthetic acknowledgement, set the
`montaje` stage, approved the collaborator's request, opened an overdue
session, saved that collaborator's observation, and auto-closed then cancelled
the experiment. The non-participant's stage update was rejected with HTTP 403.
The owner list still returned the cancelled experiment with the persisted
observation and planned-end close timestamp. The same isolated store also
verified catalogue filters for a synthetic kit, its two children, locations,
category and box metadata. No browser account, production account, Vercel
environment, Supabase data or user cookie was used.

The browser desktop/mobile pass remains unexecuted: the available macOS host
was locked and UI automation cannot unlock it. No normal browser cookies or
accounts were inspected or reused.

## Minimum next permission, precisely scoped

Before a preview can show genuine laboratory data, authorize a named **non-
production** database or an approved read-only export of the GOTS_LAB schema and
fixtures. The minimum required effect is to create a preview-only laboratory
membership table keyed by existing GOTS user IDs and synthetic laboratory rows;
no user migration, email delivery, Supabase tenant change, credentials, or
production data access is required for that step.

## Empty-GOTS persistence decision

The requested direction is now to create new Labs data in the existing GOTS
datastore, without accessing, importing, altering, or depending on the
third-party GOTS_LAB Supabase project. Review-only additive SQL is kept in
`migrations/labs/`; it is not run automatically. The local checkout confirms
that GOTS selects PostgreSQL only when Vercel supplies `DATABASE_URL` or
`POSTGRES_URL`, otherwise it uses SQLite. On 2026-10-27 the local Vercel CLI
had no authenticated credential, so this branch could not read even variable
names or verify the remote datastore provider. No login, token, secret value,
remote schema inspection, or migration was attempted.

Before applying the empty schema, the precise external operation is: verify
that the deployment's existing GOTS PostgreSQL destination is the intended
database, take its normal backup, and apply the two additive `migrations/labs`
files once. This preserves the existing `users` table and all current GOTS
data; it creates only empty `lab_*` tables. A future import of another lab's
data is a separate task and is not a prerequisite.
