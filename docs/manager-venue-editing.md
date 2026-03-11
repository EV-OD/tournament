**Overview**
- **Purpose:** Detailed reference for all manager-facing venue editing actions, required API calls, request/response schemas, and server-side effects.
- **Audience:** Frontend engineers, mobile clients, and backend maintainers.

---

## Quick index
- Metadata edits: `PATCH /api/venues/:id`
- Pricing edits: `PATCH /api/venues/:id`
- Images: upload via UploadThing → `PATCH /api/venues/:id`
- Attributes: `PATCH /api/venues/:id`
- Slot config update (bulk generation): `POST /api/slots/generate` and `updateSlotConfig` helper
- Slot operations: `POST /api/slots/hold`, `POST /api/slots/reserve`, `POST /api/slots/unbook`, plus helpers `holdSlot`, `reserveSlot`, `unbookSlot`

---

## Common headers
- `Authorization: Bearer <idToken>` (required for manager/admin actions).
- `Content-Type: application/json` for JSON bodies.

---

## Create Venue (server)
- Endpoint: `POST /api/venues` — implementation: [app/api/venues/route.ts](app/api/venues/route.ts#L1-L220)
- Auth: Bearer token. Allowed roles: `manager` or `admin`.
- Required body (JSON):
  - `name` (string)
  - `pricePerHour` (number|string)
  - `slotConfig` (object) — used to initialize `venueSlots.config`
- Optional body fields:
  - `description`, `latitude`, `longitude`, `address`, `imageUrls` (string[]), `attributes` (object), `sportType`, `advancePercentage`, `platformCommission`.
- Success: 201 { id: "<venueId>" }
- Errors:
  - 400 Missing required fields
  - 401 Unauthorized / Invalid token
  - 403 Insufficient permissions
  - 500 Server misconfiguration or other error
- Side-effects:
  - Creates `venues/{id}` document with provided fields and `managedBy` set to caller uid.
  - Initializes `venueSlots/{id}` with canonical structure (config, blocked, bookings, held, reserved).
- Example request:

  POST /api/venues
  Headers: Authorization + Content-Type
  Body:
  {
    "name": "Green Field",
    "pricePerHour": "500",
    "slotConfig": { "slotDuration": 60, "timezone": "Asia/Kathmandu" },
    "imageUrls": ["https://.../1.jpg"]
  }

---

## Update Venue (metadata, pricing, images, attributes)
- Endpoint: `PATCH /api/venues/:id` — implementation: [app/api/venues/[id]/route.ts](app/api/venues/[id]/route.ts#L1-L200)
- Auth: Bearer token. Caller must be `admin` or `venue.managedBy === uid`.
- Allowed (whitelisted) fields (JSON body):
  - `name`, `description`, `pricePerHour`, `advancePercentage`, `platformCommission`, `imageUrls` (string[]), `attributes` (object), `address`, `latitude`, `longitude`, `sportType`.
- Success: 200 { ok: true }
- Errors:
  - 401 Unauthorized / Invalid token
  - 403 Insufficient permissions
  - 404 Venue not found
  - 500 Server error
- Behavior:
  - Only whitelisted fields are applied; other keys are ignored.
  - Sets `updatedAt` with server timestamp.
- Example request:

  PATCH /api/venues/abc123
  Headers: Authorization + Content-Type
  Body:
  {
    "name": "New Name",
    "pricePerHour": 900,
    "imageUrls": ["https://.../a.jpg", "https://.../b.jpg"]
  }

---

## Delete Venue
- Endpoint: `DELETE /api/venues/:id` — implementation: [app/api/venues/[id]/route.ts](app/api/venues/[id]/route.ts#L1-L200)
- Auth: Bearer token; only role `admin` may delete.
- Success: 200 { ok: true }
- Notes: Deleting a venue may leave orphaned `venueSlots` or `slots` documents — verify app semantics before calling in production.

---

## Image uploads (recommended flow)
- Upload flow: client uploads images to UploadThing route and uses returned URLs in `imageUrls`.
- Upload endpoints: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200) with router in [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200).
- Auth: UploadThing middleware verifies Bearer token (calls Firebase Admin `verifyIdToken`) and rejects if unauthorized.
- Typical response: upload runtime returns file metadata including `url`; collect these and PATCH the venue's `imageUrls`.
- Example:
  1. Upload file via UploadThing client → receive `{ file: { url: "https://..." } }`.
  2. PATCH /api/venues/:id with `imageUrls` array.

---

## Slots: config, generation & single-slot operations
Slot data is stored in two places:
- `slots/{slotId}` documents (individual slot records)
- `venueSlots/{venueId}` canonical document (aggregates bookings, held, reserved arrays)

### Update slot configuration
- API: There is no direct public PATCH for slotConfig on venue doc; the creation flow sets it and `lib/slotService.admin.updateSlotConfig` exists.
- Helper: `updateSlotConfig(venueId, config)` — see [lib/slotService.admin.ts](lib/slotService.admin.ts#L1-L200).

### Generate slots (bulk)
- Endpoint: `POST /api/slots/generate` — [app/api/slots/generate/route.ts](app/api/slots/generate/route.ts#L1-L200)
- Auth: manager or admin (Bearer token). Uses `isManagerOrAdmin`.
- Body:
  - `venueId` (required)
  - `startTime` (required) e.g. "08:00"
  - `endTime` (required) e.g. "22:00"
  - `slotDuration` (optional, minutes, default 60)
  - `days` (optional, default 7)
- Success: 200 { ok: true }
- Side-effects: Creates/merges `slots/{slotId}` documents and updates `venues/{id}` start/end times.

### Place a hold on a slot (temporary, for payment)
- Endpoint: `POST /api/slots/hold` — [app/api/slots/hold/route.ts](app/api/slots/hold/route.ts#L1-L200)
- Auth: Bearer token (any authenticated user); the holder becomes `userId` on slot.
- Body:
  - `slotId` (required)
  - `venueId` (required)
  - `holdDurationMinutes` (optional, default 5)
- Success: 200 { ok: true, bookingId: "<id>" }
- Errors: 400/401/404/409/500 with messages like "Slot not available" or "Slot currently held".
- Side-effects: Creates `bookings/{id}` with status `PENDING_PAYMENT`, updates `slots/{slotId}` to status `HELD` and writes a held entry into `venueSlots` via `holdSlot` helper.

### Reserve a slot (physical / manager-created booking)
- Endpoint: `POST /api/slots/reserve` — [app/api/slots/reserve/route.ts](app/api/slots/reserve/route.ts#L1-L200)
- Auth: manager or admin (Bearer token)
- Body:
  - `slotId`, `venueId`, `customerName`, `customerPhone` (required), `notes` (optional)
- Success: 200 { ok: true, bookingId }
- Side-effects: Creates `bookings/{id}` (bookingType: "physical", status: "confirmed"), updates `slots/{slotId}` to `RESERVED`, and calls `reserveSlot` helper to mirror into `venueSlots`.

### Unbook (remove) a physical booking
- Endpoint: `POST /api/slots/unbook` — [app/api/slots/unbook/route.ts](app/api/slots/unbook/route.ts#L1-L200)
- Auth: manager or admin
- Body: `slotId`, `bookingId`, `venueId` (all required)
- Success: 200 { ok: true }
- Behavior: Deletes booking (only `physical` bookingType allowed), sets `slots/{slotId}` back to `AVAILABLE`, removes booking entry from `venueSlots` via `unbookSlot` helper.

### Helpers (server-side, elevated privileges)
- `holdSlot(venueId, date, startTime, userId, bookingId, holdDurationMinutes)` — adds held entry to `venueSlots`.
- `reserveSlot(venueId, date, startTime, reservedBy, note?)` — adds reserved entry and returns a booking id.
- `unbookSlot(venueId, date, startTime)` — removes booking entry from `venueSlots`.
- `bookSlot(venueId, date, startTime, bookingData)` — converts a hold into a confirmed booking inside `venueSlots`.

---

## Error patterns & HTTP codes
- 401 Unauthorized: missing/invalid bearer token (see `verifyRequestToken`).
- 403 Forbidden: insufficient permissions (role check failed or manager check failed).
- 404 Not Found: venue/slot/booking does not exist.
- 409 Conflict: slot unavailable/held/booked conflict conditions.
- 400 Bad Request: missing required fields.
- 500 Internal Server Error: Admin SDK not initialized or unexpected exceptions.

---

## Security notes & recommendations
- `venueSlots` currently stores booking-level details (including `customerName`/`customerPhone` for physical bookings). See [SECURITY_AUDIT.md](SECURITY_AUDIT.md#L1-L200) — consider moving PII to a restricted collection or restricting reads to managers only.
- Validate numeric ranges (price, percentages) and coordinate ranges on the client and optionally on the server.

---

## Examples (curl)
- Update metadata example:

  curl -X PATCH \
    -H "Authorization: Bearer <idToken>" \
    -H "Content-Type: application/json" \
    -d '{"name":"New Name","pricePerHour":800}' \
    https://your-host.example.com/api/venues/abc123

- Hold slot example (user flow):

  curl -X POST \
    -H "Authorization: Bearer <idToken>" \
    -H "Content-Type: application/json" \
    -d '{"slotId":"venue_2026-03-11_1800","venueId":"venue","holdDurationMinutes":10}' \
    https://your-host.example.com/api/slots/hold

---

## References (code)
- Venue create: [app/api/venues/route.ts](app/api/venues/route.ts#L1-L220)
- Venue update/delete: [app/api/venues/[id]/route.ts](app/api/venues/[id]/route.ts#L1-L200)
- UploadThing routes: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200) and [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200)
- Slot APIs: [app/api/slots/generate/route.ts](app/api/slots/generate/route.ts#L1-L200), [app/api/slots/hold/route.ts](app/api/slots/hold/route.ts#L1-L200), [app/api/slots/reserve/route.ts](app/api/slots/reserve/route.ts#L1-L200), [app/api/slots/unbook/route.ts](app/api/slots/unbook/route.ts#L1-L200)
- Slot helpers: [lib/slotService.admin.ts](lib/slotService.admin.ts#L1-L400)
- Auth helpers: [lib/server/auth.ts](lib/server/auth.ts#L1-L200)
