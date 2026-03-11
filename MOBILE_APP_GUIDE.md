# Venue Visibility Implementation - Complete Architecture

## Current Status

### ✅ Already Implemented (Website - Normal Users)
- **Endpoint**: `GET /api/venues`
- **Filter**: Only returns `status === "approved"` venues
- **Components Using It**:
  - `/app/venues/page.tsx` (main venues list)
  - `/components/venueMap.tsx` (map view)
- **Security**: Server-side enforcement ✓

### ✅ Admin Access (Admin Panel)
- **Direct Firestore Query**: Fetches ALL venues (no status filter)
- **Location**: `/app/admin/venues/page.tsx`
- **Correct Behavior**: Admins see all venues including pending/rejected
- **Components**:
  - Active Venues tab: All venues in `venues` collection
  - Archived Venues tab: All venues in `archivedVenues` collection

---

## Mobile App Implementation Strategy

### Option 1: Use Same API Endpoint (RECOMMENDED) ✅

Your mobile app should use the **same** `GET /api/venues` endpoint as your website.

```typescript
// Mobile App Code
const fetchVenues = async () => {
  try {
    const response = await fetch('https://yourdomain.com/api/venues?limit=500');
    const data = await response.json();
    // data.venues contains only approved venues
    setVenues(data.venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
  }
};
```

**Why This Works**:
- ✅ Server-side filtering (secure)
- ✅ Same data on all platforms (consistency)
- ✅ Impossible for users to bypass approval check
- ✅ Automatic updates if you change approval logic

**Platforms Supported**:
- React Native (JavaScript)
- Flutter (via HTTP client)
- Native iOS (URLSession)
- Native Android (OkHttp)
- Web
- Any platform with HTTP capability

---

## Venue Visibility Matrix

### What Each User Type Sees

| User Type | Via Website | Via Mobile App | Via Admin Panel |
|-----------|-----------|-----------|-----------|
| **Anonymous User** | Only Approved | Only Approved | N/A |
| **Regular User (Logged In)** | Only Approved | Only Approved | N/A |
| **Manager** | Only Approved | Only Approved | Their own venues (any status) |
| **Admin** | Only Approved | Only Approved | **ALL venues** |

---

## API Endpoints Summary

### For Public Users (Website & Mobile App)
```
GET /api/venues
├── Returns: Only approved venues
├── Auth: Not required
├── Filter: status === "approved"
├── Used by: Website, Mobile App
└── Security: Server-side enforcement ✓
```

**Response**:
```json
{
  "venues": [
    {
      "id": "venue_1",
      "name": "Green Field",
      "status": "approved",
      "pricePerHour": 500,
      ...
    }
  ],
  "total": 42,
  "limit": 500,
  "offset": 0
}
```

### For Admins (Admin Panel - Backend Only)
```
Firestore Query: WHERE status == "approved"
├── Collection: venues
├── Filter: status === "approved" OR status === "pending" OR status === "rejected"
├── Auth: Admin only (client-side rule check)
├── Used by: Admin venues page
└── Note: No API endpoint - direct Firestore access
```

---

## Complete Implementation Checklist

### ✅ Website Implementation (DONE)
- [x] `/app/venues/page.tsx` uses `GET /api/venues`
- [x] `/components/venueMap.tsx` uses `GET /api/venues`
- [x] Server-side filtering enforced
- [x] Pending venues hidden from users

### ✅ Admin Panel (DONE)
- [x] Admin sees all venues in admin panel
- [x] No filter on admin queries
- [x] Can approve/reject venues
- [x] Can view archived venues

### 📋 Mobile App (YOUR TASK)
- [ ] Replace direct Firestore queries with `GET /api/venues`
- [ ] Parse JSON response
- [ ] Handle pagination if needed
- [ ] Cache venues locally if desired
- [ ] Respect same status filtering

---

## Migration Guide: From Firestore to API

### Before (Insecure - If Mobile App Used Direct Firestore)
```javascript
// ❌ NOT RECOMMENDED
db.collection('venues')
  .where('status', '==', 'approved')
  .get()
  .then(snapshot => {
    const venues = snapshot.docs.map(doc => doc.data());
    setVenues(venues);
  });
```

**Problems**:
- Users could modify the filter: `where('status', '==', 'pending')`
- Data is exposed on the client
- No server-side validation

### After (Secure - Using API)
```javascript
// ✅ RECOMMENDED
fetch('https://yourdomain.com/api/venues?limit=500')
  .then(response => response.json())
  .then(data => {
    // Server already filtered - only approved venues
    setVenues(data.venues);
  });
```

**Benefits**:
- ✅ Users cannot modify the query
- ✅ Server controls what data is sent
- ✅ Consistent across all platforms
- ✅ Easy to update filtering logic server-side

---

## Code Examples for Different Mobile Platforms

### React Native
```javascript
const fetchVenues = async () => {
  try {
    const response = await fetch(
      'https://yourdomain.com/api/venues?limit=500'
    );
    const data = await response.json();
    setVenues(data.venues);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Flutter
```dart
Future<List<Venue>> fetchVenues() async {
  final response = await http.get(
    Uri.parse('https://yourdomain.com/api/venues?limit=500'),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return List<Venue>.from(
      data['venues'].map((v) => Venue.fromJson(v))
    );
  } else {
    throw Exception('Failed to load venues');
  }
}
```

### Native iOS (Swift)
```swift
func fetchVenues() {
    let url = URL(string: "https://yourdomain.com/api/venues?limit=500")!
    
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let data = data {
            let decoder = JSONDecoder()
            let response = try? decoder.decode(VenuesResponse.self, from: data)
            DispatchQueue.main.async {
                self.venues = response?.venues ?? []
            }
        }
    }.resume()
}
```

### Native Android (Kotlin)
```kotlin
fun fetchVenues() {
    val url = "https://yourdomain.com/api/venues?limit=500"
    
    OkHttpClient().newCall(Request.Builder().url(url).build())
        .enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string()
                val venues = gson.fromJson(body, VenuesResponse::class.java)
                mainHandler.post {
                    updateVenuesList(venues.venues)
                }
            }
            
            override fun onFailure(call: Call, e: IOException) {
                Log.e("VenuesFetch", "Error: ${e.message}")
            }
        })
}
```

---

## Database Architecture - Complete View

### Firestore Collections

#### 1. `venues` Collection
```
venues/{venueId}
├── name: string
├── address: string
├── status: "pending" | "approved" | "rejected"
├── pricePerHour: number
├── latitude: number
├── longitude: number
├── imageUrls: string[]
├── createdAt: Timestamp
├── managedBy: string (manager UID)
└── ... other fields

Access:
- Admins: Read ALL documents
- Users: Only via GET /api/venues (filtered by server)
- Mobile: Only via GET /api/venues (filtered by server)
```

#### 2. `archivedVenues` Collection
```
archivedVenues/{venueId}
├── ... all original venue fields
├── archivedStatus: "deleted" | "rejected"
├── archivalReason: string
├── archivedBy: string (admin UID)
└── archivedAt: Timestamp

Access:
- Admins: Read in admin panel
- Users: No access
- Mobile: No access
```

#### 3. `venueDeletionLogs` Collection
```
venueDeletionLogs/{logId}
├── venueId: string
├── reason: string
├── deletedBy: string (admin UID)
└── deletedAt: Timestamp

Access:
- Admins: Read only
- Users: No access
- Mobile: No access
```

---

## Server-Side API Architecture

### GET /api/venues Endpoint

**File**: `/app/api/venues/route.ts`

**Implementation**:
```typescript
export async function GET(req: Request) {
  const q = db.collection("venues")
    .where("status", "==", "approved"); // ← SECURITY CRITICAL
  
  const snap = await q.get();
  const venues = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return NextResponse.json({
    venues,
    total: venues.length,
    limit: 500,
    offset: 0
  });
}
```

**Why Server-Side Filtering**:
1. Users cannot modify the query
2. Pending venues never sent to client
3. Consistent across all platforms
4. Future changes only need server update

---

## Answer to Your Questions

### Q1: "Do I need to change the mobile app code?"
**A**: Yes, if your mobile app is directly querying Firestore. Change it to use the `GET /api/venues` endpoint instead.

### Q2: "Is changing the server side enough?"
**A**: 
- **For security**: No. If your mobile app directly queries Firestore and filters client-side, it's still vulnerable.
- **For consistency**: No. Your website uses the API, but mobile might show different data.
- **Best practice**: Both should use the same API endpoint.

### Q3: "What if my mobile app uses direct Firestore?"
**A**: Replace these queries with HTTP calls to `GET /api/venues`:

**Before**:
```javascript
db.collection('venues').get() // Gets all venues
```

**After**:
```javascript
fetch('/api/venues') // Server filters to approved only
```

---

## Recommended Mobile App Architecture

### Data Flow
```
Mobile App
   ↓
GET /api/venues (HTTP Request)
   ↓
Backend Server
   ↓
WHERE status == "approved" (Server-Side Filter)
   ↓
Only Approved Venues (JSON Response)
   ↓
Display to User
```

### Benefits
✅ Secure (server enforces filtering)
✅ Consistent (same data across platforms)
✅ Maintainable (change logic in one place)
✅ Scalable (easy to add caching, pagination)
✅ Auditable (all requests logged on server)

---

## Summary

| Aspect | Website | Mobile App | Admin |
|--------|---------|-----------|--------|
| **Data Source** | `GET /api/venues` | `GET /api/venues` | Firestore direct |
| **Sees Approved** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Sees Pending** | ❌ No | ❌ No | ✅ Yes |
| **Sees Rejected** | ❌ No | ❌ No | ✅ Yes (archived) |
| **Security** | Server-side | Server-side | Client-side + rules |

**To implement for mobile**: Replace any direct Firestore queries with `fetch()` calls to `GET /api/venues`.
