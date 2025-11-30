# Backend API Documentation

This document outlines the API endpoints and Server Actions available in the application.

## API Routes

### Grounds

#### `GET /api/grounds`
Fetches the list of available grounds from the static data file.
- **Response**: `Array<Ground>`
  ```json
  [
    {
      "id": 1,
      "name": "Futsal Arena",
      "location": "Kathmandu",
      "price": 1500,
      "image": "/images/ground1.jpg"
    }
  ]
  ```
- **Note**: This endpoint reads from `data/grounds.json`.

#### `POST /api/grounds`
Adds a new ground to the static data file.
- **Body**: `Ground` object
  ```json
  {
    "name": "New Ground",
    "location": "Lalitpur",
    "price": 2000,
    "image": "url"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Ground added successfully"
  }
  ```

### Payment (eSewa)

#### `POST /api/payment/verify`
Verifies a transaction with eSewa.
- **Body**:
  ```json
  {
    "transactionUuid": "string (Required)",
    "productCode": "string (Required)",
    # Backend API Documentation

    This document provides a concise, developer-friendly reference for the server APIs and server-side actions implemented in this repository.

    Goals:
    - Describe authentication and common behaviors used by endpoints.
    - Provide per-endpoint details (method, path, auth, purpose, request/response examples).
    - Point to implementation locations for faster navigation.

    If you'd like, I can also generate an OpenAPI (Swagger) spec from this documentation.

    --

    ## Auth & Common Behavior

    - **Authentication**: Most endpoints require a Firebase ID token presented as `Authorization: Bearer <idToken>`.
    - **Admin SDK / Server Privileges**: Endpoints that perform privileged operations (create or modify bookings/slots/venues across users) use the Firebase Admin SDK via `lib/firebase-admin.ts`.
    - **Role checks**: Actions that require `manager` or `admin` roles read user roles from `users/{uid}` in Firestore.
    - **Error responses**: Standard error payloads use `{ error: string, details?: any }` with appropriate HTTP status codes.
    - **Timestamps**: Server-written timestamps use `admin.firestore.FieldValue.serverTimestamp()`.

    ## Error codes (common)
    - `400 Bad Request` — missing/invalid parameters
    - `401 Unauthorized` — missing/invalid token
    - `403 Forbidden` — insufficient permissions (role check failed)
    - `404 Not Found` — resource missing
    - `409 Conflict` — resource not in expected state (e.g., slot already reserved)
    - `500 Internal Server Error` — server-side failure

    --

    ## Endpoints (grouped)

    Notes:
    - Each entry shows: method, path, auth, purpose, request example, response example, and implementation file path.
    - Implementation file links are relative to the repository root.

    ### Bookings

    - **Create booking**
      - Method: `POST`
      - Path: `/api/bookings`
      - Auth: Required
      - Purpose: Atomically verify a slot hold or availability, create a booking document, and mark the slot reserved.
      - Request example:
        ```json
        {
          "venueId": "venue_abc",
          "slotId": "venue_abc_2025-11-30_18:00",
          "userId": "UID",
          "amount": 600
        }
        ```
      - Response example (success):
        ```json
        { "success": true, "bookingId": "booking_xyz", "status": "PENDING_PAYMENT" }
        ```
      - Implementation: `app/api/bookings/route.ts`

    - **Cancel booking**
      - Method: `POST`
      - Path: `/api/bookings/[id]/cancel`
      - Auth: Required
      - Purpose: Cancel a booking (subject to venue cancellation rules) and release the reserved slot.
      - Request example:
        ```json
        { "userId": "UID" }
        ```
      - Response example (success): `{ "success": true }`
      - Implementation: `app/api/bookings/[id]/route.ts` or `app/api/bookings/[id]/cancel/route.ts` (search `app/api/bookings`)

    ### Invoices & QR verification

    - **Get invoice (PDF)**
      - Method: `GET`
      - Path: `/api/invoices/[id]`
      - Auth: Required (manager/admin or owner)
      - Purpose: Generate or return the booking invoice (PDF) for the given booking.
      - Implementation: `app/api/invoices/[id]/route.ts`

    - **Verify invoice / QR payload**
      - Method: `POST`
      - Path: `/api/invoices/verify`
      - Auth: Required (manager or admin typically)
      - Purpose: Verify QR payload and permissions (used by `manager/scan-qr` flows).
      - Implementation: `app/api/invoices/verify/route.ts`

    ### Payment (eSewa)

    - **Initiate payment**
      - Method: `POST`
      - Path: `/api/payment/initiate`
      - Auth: Required
      - Purpose: Create a server-side payment initiation, attach `esewaTransactionUuid` to a booking atomically, and return any payment metadata required by the client.
      - Implementation: `app/api/payment/initiate/route.ts`

    - **Verify payment**
      - Method: `POST`
      - Path: `/api/payment/verify`
      - Auth: Required
      - Purpose: Confirm payment with eSewa, and finalize the booking on successful verification.
      - Request example:
        ```json
        { "transactionUuid": "uuid", "bookingId": "booking_xyz" }
        ```
      - Implementation: `app/api/payment/verify/route.ts`

    ### Slots (server-side write surfaces)

    - **Generate slots**
      - Method: `POST`
      - Path: `/api/slots/generate`
      - Auth: Manager or Admin
      - Purpose: Generate a series of slots for a venue (used by managers to initialize availability).
      - Implementation: `app/api/slots/generate/route.ts` and `lib/slotService.admin.ts`

    - **Hold slot**
      - Method: `POST`
      - Path: `/api/slots/hold`
      - Auth: Required
      - Purpose: Place a short-lived hold on a slot (e.g., 5 minutes) to prevent race conditions during checkout.
      - Request example:
        ```json
        { "slotId": "slot_xyz", "venueId": "venue_abc", "holdDurationMinutes": 5 }
        ```
      - Implementation: `app/api/slots/hold/route.ts`

    - **Reserve / confirm slot**
      - Method: `POST`
      - Path: `/api/slots/reserve`
      - Auth: Required
      - Purpose: Convert a hold into a confirmed reservation (typically after successful payment).
      - Implementation: `app/api/slots/reserve/route.ts`

    - **Unbook / release**
      - Method: `POST`
      - Path: `/api/slots/unbook`
      - Auth: Manager or Admin
      - Purpose: Force-release or clear a booked slot.
      - Implementation: `app/api/slots/unbook/route.ts`

    ### Venues

    - **List venues**
      - Method: `GET`
      - Path: `/api/venues`
      - Auth: Public
      - Purpose: Return public venue list and metadata used by the client map and listings.
      - Implementation: `app/api/venues/route.ts`

    - **Create / upsert venue**
      - Method: `POST`
      - Path: `/api/venues`
      - Auth: Manager or Admin
      - Purpose: Create a venue and initialize `venueSlots` as needed.
      - Implementation: `app/api/venues/route.ts`

    - **Add review**
      - Method: `POST`
      - Path: `/api/venues/[id]/reviews`
      - Auth: Required
      - Purpose: Add or update a review and merge aggregates in a server transaction.
      - Implementation: `app/api/venues/[id]/reviews/route.ts`

    ### Users

    - **Upsert user**
      - Method: `POST`
      - Path: `/api/users/upsert`
      - Auth: Required
      - Purpose: Safely upsert `users/{uid}`; only admins may assign privileged roles.
      - Implementation: `app/api/users/upsert/route.ts`

    ### Uploads (UploadThing)

    - **Upload webhook / endpoint**
      - Method: `POST`
      - Path: `/api/uploadthing`
      - Auth: Required (server should verify the user's token)
      - Purpose: Handle upload callbacks and return metadata.
      - Note: Current implementation contains a dev stub returning `{ id: "fakeId" }` — replace with proper token verification.
      - Implementation: `app/api/uploadthing/core.ts`

    ### Maintenance / Cron

    - **Run maintenance**
      - Method: `GET`
      - Path: `/api/cron`
      - Auth: Optional (should be protected in production)
      - Purpose: Cleanup expired holds and run periodic maintenance.
      - Recommendation: Protect with a `CRON_SECRET` header in production.
      - Implementation: `app/api/cron/route.ts`

    ### Legacy / Local-only

    - **Grounds (file-backed)**
      - Method: `GET` / `POST`
      - Path: `/api/grounds`
      - Purpose: Local mock used during development; reads/writes `data/grounds.json`. Not suitable for production.
      - Implementation: `app/api/grounds/route.ts`

    --

    ## Server Actions (RSC / app/actions)

    - `app/actions/bookings.ts` — server actions used by Server Components for booking flows (wrap Admin SDK logic).
    - `app/actions/slots.ts` — server actions for slot operations (releaseHold, blockSlot, etc.).

    ## Migration & Security Notes

    - Migrate any client-side writes that change bookings, slots, or venues to server endpoints to maintain transactional integrity.
    - Fix the UploadThing auth stub in `app/api/uploadthing/core.ts` — verify Firebase ID tokens server-side and return the real user id.
    - Tighten Firestore rules: restrict `users` reads/writes to owners and manager/admin roles where appropriate. See `firestore.rules`.

    ## Examples

    1) Hold a slot (client)

      - Request: `POST /api/slots/hold`
      - Headers: `Authorization: Bearer <idToken>`
      - Body:
        ```json
        {
          "slotId": "venue_2025-01-20_14:00",
          "venueId": "venue_abc",
          "holdDurationMinutes": 5
        }
        ```

    2) Initiate payment

      - Request: `POST /api/payment/initiate`
      - Body:
        ```json
        {
          "bookingId": "booking_abc123",
          "totalAmount": 600
        }
        ```

    3) Verify QR / invoice (manager scan)

      - Request: `POST /api/invoices/verify`
      - Body:
        ```json
        { "qrPayload": "...", "managerId": "UID" }
        ```

    ## Where to look in the code

    - Booking flow / server transaction: `app/api/bookings/route.ts`
    - Slot server helpers: `lib/slotService.admin.ts`
    - Payment flow & verification: `app/api/payment/initiate/route.ts`, `app/api/payment/verify/route.ts`
    - Uploads: `app/api/uploadthing/core.ts`
    - Migration plan and audit: `reports/firebase-client-writes.md`

    --

    If you'd like next steps, I can:

    - Option A: Generate a complete OpenAPI spec (YAML/JSON) for all routes.
    - Option B: Add per-endpoint curl samples and expanded response schemas in `backend.md`.
    - Option C: Create a PR that replaces the UploadThing auth stub and adds tests for payments and bookings.

    Choose A, B, or C and I'll proceed.
