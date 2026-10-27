# Laboratory integration status (local branch)

This document describes the local, reversible state of the embedded GOTS
laboratory. It is not a production deployment or a data-migration plan.

## What is functional now

| Surface | Current behavior | Data source |
| --- | --- | --- |
| `GOTS Lab` navigation | Goes to the internal `/laboratorio` route on GOTS, on desktop and mobile | GOTS application routes |
| Session boundary | A visitor without a GOTS session is redirected to the existing `/login` flow | Existing NextAuth credentials session |
| Authorization boundary | Inventory and experiments require the explicit `approved_lab_member` scope; loan requests require an explicit laboratory scope | Disabled local gateway by default; mock only in tests |
| Registration eligibility | Server accepts only `@correo.uis.edu.co` and `@uis.edu.co` for new GOTS registrations | GOTS `/api/register` |

## What is not connected

All four laboratory routes are protected **shells**, not an import of the
operational GOTS_LAB application:

| Route | Present | Missing real functionality |
| --- | --- | --- |
| `/laboratorio` | Public organizational overview/navigation; it has no data | Membership source, laboratory data |
| `/laboratorio/inventario` | Guard and explanatory UI | Inventory read/write, locations, images, reservations |
| `/laboratorio/experimentos` | Guard and explanatory UI | Experiments, participants, sessions, items, legal acceptance |
| `/laboratorio/prestamos` | Guard and explanatory UI | Loan applications, approvals, legal acceptance, availability, notifications |

The gateway's `listInventory`, `listExperiments`, and `listLoans` methods return
empty arrays. No GOTS_LAB data, files, Supabase project settings, or user records
are read or written by this branch.

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

## Minimum next permission, precisely scoped

Before a preview can show genuine laboratory data, authorize a named **non-
production** database or an approved read-only export of the GOTS_LAB schema and
fixtures. The minimum required effect is to create a preview-only laboratory
membership table keyed by existing GOTS user IDs and synthetic laboratory rows;
no user migration, email delivery, Supabase tenant change, credentials, or
production data access is required for that step.
