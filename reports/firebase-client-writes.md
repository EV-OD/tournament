<!--
  Consolidated Audit & Migration Report
  Generated: 2025-11-29
  This file replaces the earlier audit with a full session summary, the migration progress to date,
  and an actionable next-step plan. Old, already-done sections were removed as requested.
-->

# Firebase Client Writes — Consolidated Audit & Migration Summary

Date: 2025-11-29

## Purpose

- Provide a single, authoritative audit of every client-side write to Firestore found in this repository.
- Record work already completed (server migrations and rule changes).
- List remaining client-write surfaces and a prioritized migration plan.

## Executive summary

- Objective: remove client-originated writes for sensitive collections (bookings, slots, users, venues, reviews, admin flows) by migrating them to server endpoints that use the Firebase Admin SDK, then tighten Firestore rules to deny client writes.
- Progress so far: bookings payment verification now performs server-side confirmation, a server-only `bookSlot` helper was added, the dev tester page was neutralized, and `firestore.rules` were updated to deny client writes for critical collections (do not deploy stricter rules until all client-write paths are migrated).
- Remaining high-priority work: migrate the `lib/slotService.ts` write functions (holds, reserves, unbooks, generate), and replace direct admin-page writes with server endpoints (or accept them explicitly in your threat model).

## Technical foundations

- Stack: Next.js (App Router), TypeScript, React (client & server components).
- Firebase usage:
  - Client SDK: used for reads and (historically) writes; clients obtain ID tokens (`user.getIdToken()`) and call APIs.
  - Admin SDK: used in server endpoints for verified transactional writes; requires `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in environment.
- Security: server endpoints verify ID tokens, enforce role checks (manager/admin), and perform atomic work with Admin SDK transactions when needed.

## What was changed (completed work)

- Neutralized dev tester page:
  - `app/tester/page.tsx` previously exposed many direct write operations. It has been replaced with a harmless stub to remove the accidental write surface.
- Server-side slot helper:
  - `lib/slotService.admin.ts` was added (server-only). It contains a `bookSlot(...)` implementation that runs necessary Admin SDK transactions to confirm bookings and update slots/venueSlots atomically.
- Payment verification endpoint updated:
  - `app/api/payment/verify/route.ts` now:
    - Verifies eSewa responses server-side.
    - Reads booking documents with the Admin SDK.
    - Calls `lib/slotService.admin.bookSlot(...)` to convert holds to confirmed bookings.
    - Marks failing verifications (NOT_FOUND/CANCELED/FAILED) by updating booking status server-side and setting `verificationFailedAt` timestamps.
- Client bookings page adjusted:
  - `app/user/bookings/page.tsx` no longer performs a client `updateDoc` fallback when verification fails. It relies on the server to mark the booking and refreshes client reads accordingly.
- Firestore rules updated (local file edited, but only deploy after migration):
  - `firestore.rules` in repo was updated to explicitly deny client writes for: `users`, `venues`, `venueSlots`, `slots`, `bookings`, `reviews`, and `venues/{venueId}/comments` and includes a conservative catch-all deny-write rule. The file includes comments that list which server endpoints are now authoritative for writes.

## Why these changes

- Server-side Admin SDK writes guarantee atomicity and server-side authorization, preventing race conditions, duplication, client tampering, and under/over booking.
- Tightening Firestore rules without migrating all client writes first will break functionality — migration must complete before enforcing rules in production.

## Detailed inventory (remaining client-side write surfaces)

The following files still contain client-originated writes or previously did and require migration or verification. Many were already audited in the earlier report; this is the updated, current list.

- `lib/slotService.ts` — Critical: contains many write-capable functions (initializeVenueSlots, bookSlot, holdSlot, releaseHold, reserveSlot, unbookSlot, block/unblock slot, updateSlotConfig, cleanExpiredHolds). These functions are called from client components; porting them to server-side `lib/slotService.admin.ts` (or exposing secure API wrappers) is the top priority.
- `components/WeeklySlotsGrid.old.tsx` — Legacy component with `runTransaction`, batch writes, and booking creation flows used by the UI to hold and reserve slots. Must be updated to call server endpoints.
- `components/SlotEditor.tsx` / `components/SlotEditor.old.tsx` — Slot create/update/delete functionality; calls `initializeVenueSlots()` and other write functions. Migrate to server endpoints.
- `components/BookingForm.tsx` — Creates bookings and updates slot statuses. Replace direct writes with a POST `/api/bookings` that validates and performs the transaction.
- `components/addGround.tsx` — Venue creation that calls `initializeVenueSlots`. Use `/api/venues` server endpoint to create venue + initialize slots.
- `components/ReviewsSection.tsx` & `components/RatingModal.tsx` — Run transactions to set `venues/{id}/comments`, `reviews/{venueId_userId}`, and update aggregated rating stats. Create `/api/venues/:id/reviews` server endpoint to centralize validation and aggregation.
- `components/ManagerPanel.tsx` — Manager venue edits; currently updates `venues/{id}` directly. Use `/api/venues/:id` with role checks.
- `lib/esewa/initiate.ts` — Persists `esewaTransactionUuid` client-side before redirect; recommend using `/api/payment/initiate` to generate & persist server-side.
- `app/admin/*` pages (`venues`, `users`, `bookings`, `overview`, `managers/[id]`) — Several admin pages perform `addDoc`/`updateDoc`/`deleteDoc` directly. Either migrate admin writes to `/api/admin/*` endpoints or accept that admin UI writes will stay client-side under a specific risk model.

## Completed vs pending (status)

- Completed:
  - Added server-only `bookSlot` helper: `lib/slotService.admin.ts` (server-side transactional booking confirmation).
  - Updated `/api/payment/verify` to use Admin SDK and server `bookSlot`.
  - Neutralized dev tester page (`app/tester/page.tsx`).
  - Updated `app/user/bookings/page.tsx` to remove client fallback write on verification failures.
  - Edited `firestore.rules` to reflect server-authoritative write rules (local file updated; do not deploy until migration done).
- Partially complete / Pending:
  - Migrate `lib/slotService.ts` write functions to server-side implementations (only `bookSlot` implemented server-side so far).
  - Replace direct admin-page writes with server endpoints (high priority if rules will be strict).
  - Replace client-side `lib/esewa/initiate.ts` persist step with a server-side initiate endpoint.

## Migration roadmap (recommended next steps)

Priority order (recommended):

1) Booking & slot hold flows (highest priority):
   - Add `POST /api/bookings` that performs the hold/create booking transaction atomically using Admin SDK transactions.
   - Refactor `components/BookingForm.tsx` and slot-hold UIs to call the new endpoint.

2) Port `lib/slotService.ts` writes to server:
   - Move or reimplement `holdSlot`, `releaseHold`, `reserveSlot`, `unbookSlot`, `blockSlot`, `unblockSlot`, `cleanExpiredHolds`, `initializeVenueSlots`, and `updateSlotConfig` as server functions (use `lib/slotService.admin.ts` as the home for server logic).
   - Expose minimal endpoints: `/api/slots/hold`, `/api/slots/reserve`, `/api/slots/unbook`, `/api/slots/generate`, `/api/slots/config`.

3) Venue & admin flows:
   - Implement `/api/venues` (create) and `/api/venues/:id` (update/delete) with manager/admin validation and internal calls to initialize slots.
   - Implement admin endpoints `/api/admin/users`, `/api/admin/bookings`, `/api/admin/payouts` with role checks and audit logging.

4) Reviews & ratings:
   - Add `/api/venues/:id/reviews` to handle review creation/upsert and to recalculate `averageRating` and `reviewCount` server-side.

5) Payment initiate flow:
   - Replace client-side persist of `esewaTransactionUuid` with `/api/payment/initiate` that returns the redirect parameters and stores the transaction server-side.

6) Finalize Firestore rules & deploy:
   - Only after migrating all client write paths (or explicitly accepting admin-only client writes), deploy the stricter `firestore.rules` that deny client writes to the critical collections.

## Safety & deployment notes

- Admin SDK env vars: ensure `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (with proper newlines), and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are set in production. Server endpoints will fail if Admin SDK cannot initialize.
- ID token contract: client calls must attach `Authorization: Bearer <idToken>` (from `user.getIdToken()`) to endpoints; server verifies tokens and enforces roles.
- Don't deploy `firestore.rules` tightening until you confirm there are no remaining client-write paths, or plan to allow admin-only client writes in your threat model.

## One-time data migration considerations

- Reviews currently exist in two places (`reviews/{venueId_userId}` and `venues/{id}/comments`). Consider a one-time migration to consolidate into a single authoritative location, or keep the UI reading both until you deprecate the legacy shape.

## What I changed in this repository during the session (reference)

- Added: `lib/slotService.admin.ts` — server `bookSlot` implementation using Admin SDK transactions.
- Updated: `app/api/payment/verify/route.ts` — now uses Admin SDK booking reads and server `bookSlot` and marks failed verifications server-side.
- Updated: `app/user/bookings/page.tsx` — removed client fallback write after failed verification; client now refreshes reads.
- Updated: `app/tester/page.tsx` — neutralized dev tester page to remove dev write surfaces.
- Updated: `firestore.rules` — added comments and an explicit deny of client writes for critical collections (local file updated; do not deploy until migration done).

## How I can help next (pick one):

- Option A (recommended): Fully migrate `lib/slotService.ts` writes to server-side implementations and create the minimal `/api/slots/*` endpoints; then update client components in one PR.
- Option B: Produce a staged PR plan (file-by-file diffs) for you to review before edits.
- Option C: Start with a narrower, high-impact migration: `POST /api/bookings` + refactor `BookingForm` and the hold flow.

If you want me to continue, tell me which option to pick and I'll proceed (I can implement Option C quickly as a working example).

-- End of consolidated audit --
