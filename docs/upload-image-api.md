# Upload Image API — Reference

**Purpose:** Describes how to upload images for venues (manager/upload flows), the server endpoints, middleware behavior, expected request/response shapes, error handling, and client examples.

Primary implementation files:
- Route: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200)
- Router/core: [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200)

---

## Summary
- Primary endpoint(s): `GET /api/uploadthing` and `POST /api/uploadthing` (created via UploadThing `createRouteHandler`).
- Auth: Bearer ID token required by the router middleware (see `core.ts`).
- File route slug in `ourFileRouter`: `imageUploader` with limits `maxFileSize: 4MB`, `maxFileCount: 5`.
- Typical response: UploadThing runtime returns JSON with uploaded file metadata including `url` for each file.

---

## Authentication & middleware behavior
- The UploadThing middleware in `core.ts` performs server-side auth:
  - Verifies Firebase Admin SDK is initialized.
  - Reads `Authorization` header, extracts the ID token, and verifies via `firebaseAdminAuth.verifyIdToken(idToken)`.
  - On success, middleware returns `{ id: decoded.uid, email: decoded.email }` which is exposed to `onUploadComplete` as `metadata` (the example returns `{ userId: metadata.userId }`).
  - If token missing or invalid, the middleware throws and the upload is rejected with 4xx.
- `onUploadComplete` runs server-side after each successful file is stored; it logs the upload, can write DB records, and returns info passed back to client-side `onClientUploadComplete`.

---

## Request
- POST /api/uploadthing
- Content-Type: multipart/form-data (handled by UploadThing runtime)
- Headers:
  - `Authorization: Bearer <idToken>` — required (middleware enforces this in `core.ts`).
- Body: file fields as per UploadThing client usage. The router config defines route slug `imageUploader` (server-side router); the client must call the matching upload route/flow per UploadThing docs.

Notes:
- The exact form parameter names and pre-signed upload flow are handled by the UploadThing SDK; using the SDK is recommended for ease.
- If calling the route manually, follow the runtime's expected multipart format and include any required fields returned by the SDK initialization step.

---

## Response (typical)
- Success (2xx): JSON describing uploaded file(s); shape depends on UploadThing runtime and `ourFileRouter` configuration.
- Example (typical returned metadata):
  {
    "files": [
      {
        "fileKey": "abc123",
        "url": "https://cdn.uploadthing.com/abcd/filename.jpg",
        "size": 123456,
        "mimeType": "image/jpeg"
      }
    ],
    "metadata": { "uploadedBy": "<uid>" }
  }

- `onUploadComplete` return value (server) is forwarded to client-side `onClientUploadComplete`.

---

## Server-side limitations & config (from code)
- `imageUploader` route options:
  - `image` field: `maxFileSize: 4MB`, `maxFileCount: 5` (as set in `core.ts`).
- The middleware logs detailed information and returns `null` (or throws) on auth failure.
- `onUploadComplete` returns `{ uploadedBy: metadata.userId }` in the current implementation — clients can expect metadata about who uploaded the file.

---

## Errors & HTTP codes
- 401 / 4xx: If `Authorization` header missing or token invalid (middleware returns/throws).
- 4xx: If file validations fail (too large, too many files) — runtime-specific error message.
- 5xx: If Admin SDK not initialized or storage backend errors.

---

## Client usage examples

### Recommended: Use UploadThing client (pseudo-code / typical SDK flow)
- The UploadThing client handles chunking, presigned flows, and will call server route(s) under the hood.

Example (React, simplified):

const onClientUploadComplete = (res) => {
  // res contains server-side onUploadComplete return and file list
  console.log('Upload result', res);
  // Typically use returned `url`s to call your venue create/update APIs
};

// Pseudocode — follow UploadThing client library API in project
const uploadFiles = async (files) => {
  // SDK handles auth headers if configured or you attach token
  const result = await uploadthingClient.upload(files, { slug: 'imageUploader' });
  onClientUploadComplete(result);
};

Notes:
- Ensure your client includes the ID token (same token used to call `POST /api/venues`), so server middleware can verify and return `uploadedBy` metadata.

### Manual curl multipart example (if not using SDK)
- This example may not work if UploadThing runtime expects additional pre-signed fields; use SDK when possible.

curl -X POST \
  -H "Authorization: Bearer <idToken>" \
  -F "file=@/path/to/image.jpg" \
  https://your-host.example.com/api/uploadthing

- Response: JSON containing uploaded file metadata (see above). If the runtime expects field names or additional data, inspect the UploadThing client init response or use the SDK.

---

## How clients should store/use results
- After upload, collect the `url` values returned by the upload response and include them in `imageUrls` when calling `POST /api/venues` or `PATCH /api/venues/:id`.
- Example: `imageUrls: ["https://cdn.uploadthing.com/abcd/filename.jpg"]`

---

## Security considerations
- UploadThing middleware verifies ID tokens via Firebase Admin; keep Admin credentials secure and do not expose them to clients.
- Validate file types & sizes server-side (router already restricts images & sizes). Avoid storing raw user-provided filenames in UIs without sanitization.
- If you need strict access control to uploaded images, consider signing URLs or storing image metadata in Firestore with restricted reads.

---

## Troubleshooting
- If you see `Firebase Admin SDK not initialized` in server logs: verify `lib/firebase-admin.ts` initialization and environment variables.
- If uploads succeed but `uploadedBy` is null: check that `Authorization` header was included and token is valid; `core.ts` returns `null` on auth failure which causes middleware to throw.
- For runtime-specific errors consult UploadThing docs and server logs for full error details.

---

## References
- Route: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200)
- Router/core: [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200)
- Example server `onUploadComplete` behavior is in `core.ts` (returns `{ uploadedBy: metadata.userId }`).

---

If you want, I can:
- Add a concrete TypeScript client helper using the UploadThing client library (matching this repo's config).
- Add a small server-side example to save upload metadata to `images` collection after `onUploadComplete`.
