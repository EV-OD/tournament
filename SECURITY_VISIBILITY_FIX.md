# Security & Visibility Implementation

## Issue 1: Admin Cannot See All Venues

### Problem
The admin venues page may not display all venues for several reasons:

1. **No venues created yet** - If no venues exist in the database, the list will be empty
2. **Missing status field** - If venues were created before the status field was added, they won't have a status value
3. **Firestore security rules** - Rules may restrict access to certain venues
4. **Query limits** - The limit of 500 should be sufficient for most cases, but extremely large datasets may need pagination

### Debugging Steps

1. **Check Browser Console**: Open DevTools (F12) and check the console for any errors in the admin venues page
2. **Check Firestore**: Go to Firebase Console → Firestore → venues collection and verify:
   - Venues exist in the database
   - Each venue has the `status` field (should be "pending", "approved", or "rejected")
   - `createdAt` field exists (needed for sorting)
3. **Check Firestore Rules**: Verify security rules allow admins to read all venues
4. **Check Admin Role**: Verify the logged-in user has `role: "admin"` in the `users/{uid}` document

### Solution: Migration Script

If venues are missing the `status` field, run this Firebase Cloud Function or admin script:

```javascript
// This script can be run in Firebase Cloud Shell or Node.js admin SDK
const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateVenueStatuses() {
  const venuesRef = db.collection('venues');
  const batch = db.batch();
  let updateCount = 0;

  const snapshot = await venuesRef.get();
  
  snapshot.forEach((doc) => {
    if (!doc.data().status) {
      batch.update(doc.ref, { status: 'approved' }); // Default existing venues to approved
      updateCount++;
    }
  });

  await batch.commit();
  console.log(`Updated ${updateCount} venues with default status`);
}

migrateVenueStatuses();
```

### Expected Behavior
After logging in as admin, the venues page should show:
- **Active Venues tab**: All venues with limit of 500 (sorted by newest first)
- **Archived Venues tab**: All archived venues from the `archivedVenues` collection

---

## Issue 2: Pending Venues Visibility in Mobile App (SECURED)

### Problem
Previously, pending venues were being filtered client-side, which is insecure because:

1. **Client-side filtering is easily bypassed** - Users can modify JavaScript to remove the filter
2. **Data is exposed** - Pending venues are fetched from Firestore and only filtered in the browser
3. **No server validation** - There's no server-side enforcement of venue visibility

### Solution: Backend Filtering (Implemented)

A new secure endpoint `GET /api/venues` has been implemented that:

1. **Filters on the server** - Only approved venues are returned
2. **Cannot be bypassed** - Users cannot modify server-side logic
3. **Enforces status check** - The database query includes `where("status", "==", "approved")`

#### New API Endpoint

**Endpoint**: `GET /api/venues`

**Query Parameters**:
- `limit`: number (optional, default 500, max 500) - max venues to return
- `offset`: number (optional, default 0) - pagination offset
- `sportType`: string (optional) - filter by sport type

**Response**:
```json
{
  "venues": [
    {
      "id": "venue_id",
      "name": "Venue Name",
      "address": "Venue Address",
      "status": "approved",
      "pricePerHour": 500,
      "latitude": 27.12345,
      "longitude": 85.12345,
      "imageUrls": ["..."],
      ...
    }
  ],
  "total": 42,
  "limit": 500,
  "offset": 0
}
```

**Security Features**:
- ✅ Server-side status filtering (`where("status", "==", "approved")`)
- ✅ No pending venues in response
- ✅ No rejected venues in response
- ✅ Cannot be bypassed by client-side code modification
- ✅ Public endpoint (no auth required)

#### Implementation Details

**File**: `/app/api/venues/route.ts`

```typescript
export async function GET(req: Request) {
  // Query ONLY approved venues
  let q = db.collection(COLLECTIONS.VENUES).where("status", "==", "approved");
  
  // Optional sport type filter
  if (sportTypeFilter && SPORT_TYPES.includes(sportTypeFilter)) {
    q = q.where("sportType", "==", sportTypeFilter);
  }

  const snap = await q.get();
  const allVenues = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({
    venues: paginatedVenues,
    total: allVenues.length,
    limit,
    offset,
  });
}
```

### Updated Components

The following components now use the secure API instead of direct Firestore access:

1. **`/app/venues/page.tsx`** - Main venues listing page
   - Changed from: Direct `getDocs(collection(db, "venues"))`
   - Changed to: `fetch("/api/venues")`

2. **`/components/venueMap.tsx`** - Map view component
   - Changed from: Direct `getDocs(collection(db, "venues")).filter(status === "approved")`
   - Changed to: `fetch("/api/venues")`

3. **`/components/VenueList.tsx`** - Manager venue list
   - Note: This component filters by `managedBy` (manager's own venues), so the status filter is appropriate and kept as-is

### Status Values

The system uses three status values:

- **pending**: New venue awaiting admin approval
- **approved**: Venue approved and visible to users
- **rejected**: Venue rejected and moved to archive

### Venue Lifecycle

```
New Venue (created by manager)
  ↓
  status: "pending" (created at `/api/venues` POST)
  ↓
  Admin Reviews & Decides
  ├─→ Approved? → status: "approved" → Visible to users
  └─→ Rejected? → Archived to archivedVenues with archivedStatus: "rejected"
```

### Benefits

1. **Security**: Pending/rejected venues cannot be accessed via client manipulation
2. **Compliance**: Proper separation of concerns (backend enforces rules)
3. **Scalability**: Easy to add more server-side validations
4. **Auditability**: All venue visibility decisions are logged server-side

### Testing

To verify the implementation:

1. **Create a new venue** (as manager) - Status should be "pending"
2. **Try to view venues** (as user) - Pending venue should NOT appear
3. **Check API** - `GET /api/venues` should only return approved venues
4. **Check browser DevTools** - Network tab shows API response without pending venues
5. **Approve the venue** (as admin)
6. **View venues again** - Now the approved venue should appear

---

## Future Enhancements

1. **Add server-side caching** - Cache approved venues list for faster responses
2. **Implement pagination** - Use cursor-based pagination for large datasets
3. **Add filtering** - Support filtering by location, price range, sport type server-side
4. **Add sorting** - Support sorting by rating, price, distance server-side
5. **Rate limiting** - Prevent abuse of the venues API
6. **Analytics** - Track venue views and searches server-side
