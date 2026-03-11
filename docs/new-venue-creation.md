# New Venue Creation — Flow & API Reference

**Purpose:** Complete reference for creating a new venue as a manager/admin: client flow, API contract, validation rules, server-side effects, and examples.

Audience: frontend/mobile engineers, integrators, and backend maintainers.

---

## Quick summary
- Endpoint: `POST /api/venues` — implementation: [app/api/venues/route.ts](app/api/venues/route.ts#L1-L220)
- Auth: `Authorization: Bearer <idToken>` (must be role `manager` or `admin`)
- Returns: `201 { id: "<venueId>" }` on success
- Side effects: Creates `venues/{id}` and initializes `venueSlots/{id}` canonical document used by slot system

---

## End-to-end flow (client perspective)
1. User (manager) opens "Add venue" form in app and fills required fields (name, pricing, slotConfig) and optional data (description, address, coordinates, attributes).
2. Client uploads image files to UploadThing via the UploadThing client; receives file metadata including accessible `url`s.
3. Client assembles request body containing fields plus `imageUrls` array from uploads.
4. Client sends `POST /api/venues` with `Authorization: Bearer <idToken>` and JSON body.
5. Server verifies token, checks caller role is `manager` or `admin`, creates `venues/{id}` doc, initializes `venueSlots/{id}` with `slotConfig`, and returns the new venue id.
6. Client navigates to venue management UI to generate slots (optional) or edit venue later via `PATCH /api/venues/:id`.

---

## Authentication & authorization
- The route verifies the ID token using the Firebase Admin SDK (`verifyRequestToken` in `lib/server/auth.ts`).
- Allowed roles: `manager` or `admin` — if the caller is not one of these roles, the route returns 403.
- If token missing/invalid → 401.

---

## Request (details)
- URL: `POST /api/venues`
- Headers:
  - `Authorization: Bearer <idToken>` (required)
  - `Content-Type: application/json`

- Body (JSON): fields accepted by the server. Required and optional fields below.

Required fields
- `name` (string) — human-friendly venue name. Trimmed server-side.
- `pricePerHour` (number or parseable string) — price per hour for the venue. The server coerces to number via `parseFloat`.
- `slotConfig` (object) — required configuration for the slot system; used to initialize `venueSlots.config`. See `Slot config` section for schema.

Optional fields
- `description` (string|null) — long-form description; server trims or stores `null`.
- `latitude` (number|null) — decimal degrees; server stores `null` if omitted.
- `longitude` (number|null)
- `address` (string|null)
- `imageUrls` (string[]) — list of image URLs previously uploaded (recommended via UploadThing). Defaults to [] if omitted.
- `attributes` (object) — arbitrary key/value metadata (e.g., `{ "covered": true, "surface": "turf" }`). Defaults to {}.
- `sportType` (string) — must be one of supported `SPORT_TYPES`; otherwise defaults to `futsal`.
- `advancePercentage` (number) — 0-100; server clamps to range or uses `DEFAULT_ADVANCE_PERCENT` default.
- `platformCommission` (number) — 0-100; server clamps to range or defaults to 0.

Validation rules performed server-side (current implementation)
- `name`, `pricePerHour`, and `slotConfig` are required. Missing any results in 400.
- `pricePerHour` is `parseFloat`-ed; clients should pass a numeric or parseable string.
- `sportType` is validated against `SPORT_TYPES` in `lib/sports`.
- `advancePercentage` and `platformCommission` are clamped between 0 and 100.

Slots config (recommended shape)
- `slotConfig` is an opaque object persisted under `venueSlots.config` but should include:
  - `slotDuration` (number, minutes) e.g., 60
  - `timezone` (string) e.g., `Asia/Kathmandu` — if missing, the server sets `DEFAULT_TIMEZONE`.
  - Optionally other fields used by client: available days, opening hours, etc.


---

## Response
- Success (201):
  - Body: `{ "id": "<venueId>" }` — new Firestore document id for `venues/{id}`.
- Errors:
  - 400 Bad Request — `{ error: 'Missing required fields' }` when required fields missing.
  - 401 Unauthorized — `{ error: 'Unauthorized' }` or `{ error: 'Invalid token' }` when token missing/invalid.
  - 403 Forbidden — `{ error: 'Insufficient permissions' }` when role is not manager/admin.
  - 500 Internal Server Error — Admin SDK misconfiguration or other unexpected errors.

---

## Server-side behavior & side-effects (what the endpoint writes)
- Creates a Firestore document in `venues` with these fields:
  - `name`, `description`, `sportType`, `latitude`, `longitude`, `address`, `imageUrls`, `pricePerHour` (number), `advancePercentage`, `platformCommission`, `attributes`, `createdAt: serverTimestamp()`, `managedBy: uid`.
- Initializes `venueSlots/{venueId}` with canonical structure:
  {
    venueId: <id>,
    config: { ...slotConfig, timezone: slotConfig.timezone || DEFAULT_TIMEZONE },
    blocked: [],
    bookings: [],
    held: [],
    reserved: [],
    updatedAt: serverTimestamp()
  }
- Note: `pricePerHour` is coerced to number via `parseFloat`.

References: `app/api/venues/route.ts` and `lib/slotService.admin.ts` for `initializeVenueSlots`.

---

## Image upload integration (required — do not use base64)

> **Warning:** Never store raw base64 / data URLs in `imageUrls`. Firestore has a 1 MB document size limit. A single base64-encoded image can exceed this and cause the write to fail with `INVALID_ARGUMENT: The value of property "array" is longer than 1048487 bytes`. Always upload via UploadThing first and store only the returned short CDN URL.

- Use UploadThing routes: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200) with router in [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200).
- Client helper: [lib/uploadthing-client.ts](lib/uploadthing-client.ts) — use the exported `useUploadThing("imageUploader", { headers })` hook.
- Correct flow:
  1. Call `startUpload(files)` from the `useUploadThing` hook, passing `Authorization: Bearer <idToken>` in the `headers` option so the server middleware can verify the uploader.
  2. In `onClientUploadComplete`, collect `res.map(f => f.url)` — these are short CDN URLs like `https://cdn.uploadthing.com/...`.
  3. Pass those URLs as the `imageUrls` array to `POST /api/venues`.
- The server stores the `imageUrls` array as-is in the venue document; each entry must be a URL string.
- See [components/ImageManager.tsx](components/ImageManager.tsx) for the canonical implementation.

Security: UploadThing middleware already verifies ID tokens via Firebase Admin in `core.ts`. Uploads from unauthenticated callers are rejected.

---

## Example requests

### Minimal create (curl)

curl -X POST \
  -H "Authorization: Bearer <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Green Field",
    "pricePerHour":"500",
    "slotConfig": { "slotDuration": 60, "timezone": "Asia/Kathmandu" }
  }' \
  https://your-host.example.com/api/venues

Response (201):
{ "id": "abcd1234" }


### Create with images & attributes (curl)

curl -X POST \
  -H "Authorization: Bearer <idToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Green Field",
    "pricePerHour":500,
    "slotConfig": { "slotDuration": 60 },
    "imageUrls":["https://cdn.example.com/u1.jpg","https://cdn.example.com/u2.jpg"],
    "attributes": { "covered": true, "surface": "turf" }
  }' \
  https://your-host.example.com/api/venues


---

## Client integration tips and sample TypeScript helper (fetch)

Use a small helper to call the API and handle JSON + errors consistently.

Example (browser / React / Next fetch):

async function createVenue(idToken: string, payload: any) {
  const res = await fetch('/api/venues', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json; // { id }
}

Client-side validations to perform before calling API:
- Ensure `name` is present and not empty.
- Ensure `pricePerHour` is numeric and >= 0.
- Ensure `slotConfig` is provided and contains at least `slotDuration`.
- Validate image upload success and use the returned `url`s.

---

## Edge cases & operational notes
- If `sportType` provided is invalid, server defaults to `futsal`.
- The server uses `DEFAULT_ADVANCE_PERCENT` when `advancePercentage` is omitted or invalid.
- Deleting a venue via `DELETE /api/venues/:id` (admin-only) does not automatically delete `venueSlots/{id}` or `slots/*` — consider cleanup jobs if needed.

---

## Errors and troubleshooting
- If you see `Server misconfigured: Admin SDK not initialized`, verify environment variables and `lib/firebase-admin.ts` initialization on the server.
- When uploads fail with `Unauthorized`, verify the client is sending the same ID token to UploadThing middleware.

---

## Security & privacy
- `venueSlots` may contain booking-level information (customerName/customerPhone) for physical bookings created by managers. See [SECURITY_AUDIT.md](SECURITY_AUDIT.md#L1-L200) for mitigation options (move PII to restricted collection or restrict reads).
- Sanitize and validate all client-supplied text (names, descriptions) to avoid injection in any downstream UIs.

---

## References (code)
- Route implementation: [app/api/venues/route.ts](app/api/venues/route.ts#L1-L220)
- `initializeVenueSlots` helper: [lib/slotService.admin.ts](lib/slotService.admin.ts#L1-L200)
- UploadThing: [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200)
- Auth helpers: [lib/server/auth.ts](lib/server/auth.ts#L1-L200)


---

If you want, I can now:
- Add example TypeScript client functions for image upload + create flow.
- Add integration tests (supertest / fetch mocks) for `POST /api/venues`.
- Add automatic cleanup guidance for orphaned slots/venueSlots.
