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

## ⚠️  Critical: do NOT store base64/data URLs in imageUrls
- Never read image files with `FileReader.readAsDataURL()` and pass the result as an image URL.
- A base64-encoded image can be 2–4 MB of text, which exceeds Firestore's 1 MB per-document limit. Firestore will reject the write with:
  `INVALID_ARGUMENT: The value of property "array" is longer than 1048487 bytes`
- Always upload images to UploadThing CDN first, then store only the returned short CDN URL string (e.g. `https://cdn.uploadthing.com/...`).

---

## Client usage examples

### Recommended: `useUploadThing` hook (exact pattern used in this project)
- `lib/uploadthing-client.ts` exports `useUploadThing` via `generateReactHelpers`.
- The hook is used in `components/ImageManager.tsx` — the canonical image upload component.

Example (actual React implementation pattern):

```tsx
import { useUploadThing } from "@/lib/uploadthing-client";
import { useAuth } from "@/contexts/AuthContext";

const { user } = useAuth();

const { startUpload } = useUploadThing("imageUploader", {
  // Pass Firebase ID token so the server middleware can verify the uploader
  headers: async () => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  },
  onClientUploadComplete: (res) => {
    // res is an array of uploaded file objects; each has a .url (CDN URL)
    const newUrls = res.map((f) => f.url);
    // Store only these short CDN URLs, never base64 content
    onImagesChange([...existingUrls, ...newUrls]);
  },
  onUploadError: (error) => {
    console.error("Upload failed:", error.message);
  },
});

// Trigger upload when user selects files:
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  e.target.value = ""; // reset so same file can be re-selected
  await startUpload(Array.from(files));
};
```

Notes:
- `Authorization: Bearer <idToken>` header must be sent so the UploadThing server middleware (in `core.ts`) can verify the user.
- After `onClientUploadComplete` fires, the CDN URLs are safe to include in `imageUrls` for `POST /api/venues` or `PATCH /api/venues/:id`.

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
- **Firestore write fails with `array is longer than 1048487 bytes`:** Image data URLs (base64) were stored instead of CDN URLs. See the warning section above — always use UploadThing and store only the returned `url`.
- **`Firebase Admin SDK not initialized`** in server logs: verify `lib/firebase-admin.ts` initialization and environment variables.
- **`uploadedBy` is null / upload rejected:** Check that `Authorization: Bearer <idToken>` header was included and that the token is fresh. The `core.ts` middleware logs the reason when auth fails.
- **Same file not re-selectable in `<input type="file">`:** Reset `e.target.value = ""` after triggering the upload (already done in `ImageManager.tsx`).
- For other runtime-specific errors consult UploadThing docs and server logs for full error details.

---

## References
- Route: [app/api/uploadthing/route.ts](app/api/uploadthing/route.ts#L1-L200)
- Router/core: [app/api/uploadthing/core.ts](app/api/uploadthing/core.ts#L1-L200)
- Client helper: [lib/uploadthing-client.ts](lib/uploadthing-client.ts) (exports `useUploadThing` and `uploadFiles`)
- Usage in UI: [components/ImageManager.tsx](components/ImageManager.tsx) — canonical example of `useUploadThing` with auth headers
- `onUploadComplete` in `core.ts` returns `{ uploadedBy: metadata.userId }` server-side.

---

If you want, I can:
- Add a concrete TypeScript client helper using the UploadThing client library (matching this repo's config).
- Add a small server-side example to save upload metadata to `images` collection after `onUploadComplete`.
