# Mobile App Strategy: API vs Direct Firestore

## Your Two Options

### Option 1: Use API Endpoint (My Recommendation) ✅
```dart
// venue_repository.dart
Future<List<Venue>> getApprovedVenues() async {
  try {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/venues?limit=500'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Venue>.from(
        data['venues'].map((v) => Venue.fromJson(v))
      );
    }
    throw Exception('Failed to load venues');
  } catch (e) {
    throw Exception('Error fetching venues: $e');
  }
}
```

### Option 2: Direct Firestore + Client Filter
```dart
// venue_repository.dart
Future<List<Venue>> getApprovedVenues() async {
  try {
    final snapshot = await _firestore
        .collection('venues')
        .where('status', isEqualTo: 'approved') // Client-side filter
        .get();
    
    return snapshot.docs
        .map((doc) => Venue.fromJson(doc.data()))
        .toList();
  } catch (e) {
    throw Exception('Error fetching venues: $e');
  }
}
```

---

## Detailed Comparison

| Aspect | Option 1: API | Option 2: Firestore Filter |
|--------|-------|----------|
| **Security** | ⭐⭐⭐⭐⭐ Server-side enforcement | ⭐⭐⭐ Client-side (can be bypassed) |
| **Complexity** | Medium (HTTP client needed) | Low (use existing Firestore) |
| **Performance** | Good (filtered on server) | Excellent (read fewer docs) |
| **Consistency** | Perfect (same as website) | Good (respects Firestore rules) |
| **Future Changes** | One-time server update | Need mobile code update |
| **Offline Support** | Limited (needs internet) | Good (can cache locally) |
| **Data Freshness** | Always fresh from server | Depends on Firestore cache |
| **API Costs** | 1 read per request | 1 read per document (cheaper if filter works) |
| **User Can Bypass** | ❌ NO (server enforces) | ⚠️ YES (can modify Dart code) |

---

## My Strong Recommendation: Use Option 1 (API) ✅

### Why Option 1 is Better:

1. **Security**
   - Server enforces status filter
   - Users CANNOT bypass it even if they reverse-engineer the app
   - Consistent with your website

2. **Future-Proof**
   - Add new filters (price range, location, sport type) without mobile update
   - Change approval logic once, all platforms updated
   - Add new business rules server-side

3. **Consistency**
   - Same data across website and mobile
   - No conflicting logic between platforms
   - Easier to debug issues

4. **Maintainability**
   - Single source of truth (API endpoint)
   - Change filter in one place
   - No duplicate logic

### Why Option 2 Has Risks:

1. **Security Risk**
   - Hacker decompiles APK, removes the `where('status', '==', 'approved')` filter
   - Now their app sees pending/rejected venues
   - No way to prevent this at server level

2. **Requires Mobile Update**
   - If you add a new filter later (e.g., by sport type)
   - Must update both website AND mobile app code
   - Mobile users might not update their app

3. **Inconsistent Logic**
   - Website filter logic: Server-side in `/api/venues/route.ts`
   - Mobile filter logic: Client-side in `venue_repository.dart`
   - Different places to maintain = easy to forget one

4. **Scalability Issues**
   - If you add filters, API becomes the only source of truth
   - Mobile would need constant updates to stay consistent

---

## Implementation: Option 1 (Recommended)

### Step 1: Create HTTP Client Wrapper

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'https://yourdomain.com';
  static const String venuesEndpoint = '/api/venues';
}

// lib/services/api_service.dart
class ApiService {
  final http.Client _client;
  
  ApiService({http.Client? client}) : _client = client ?? http.Client();
  
  Future<Map<String, dynamic>> getVenues({
    int limit = 500,
    int offset = 0,
    String? sportType,
  }) async {
    String url = '${ApiConfig.baseUrl}${ApiConfig.venuesEndpoint}?limit=$limit&offset=$offset';
    if (sportType != null) {
      url += '&sportType=$sportType';
    }
    
    try {
      final response = await _client.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load venues: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching venues: $e');
    }
  }
}
```

### Step 2: Update Repository

```dart
// lib/repositories/venue_repository.dart
class VenueRepository {
  final ApiService _apiService;
  
  VenueRepository(this._apiService);
  
  Future<List<Venue>> getApprovedVenues({
    int limit = 500,
    int offset = 0,
  }) async {
    try {
      final response = await _apiService.getVenues(limit: limit, offset: offset);
      
      // Server already filtered to approved venues only
      final venues = response['venues'] as List;
      return venues
          .map((v) => Venue.fromJson(v))
          .toList();
    } catch (e) {
      throw Exception('Error fetching venues: $e');
    }
  }
}
```

### Step 3: Use in BLoC/Provider

```dart
// lib/bloc/venue_bloc.dart
class VenueBloc extends Bloc<VenueEvent, VenueState> {
  final VenueRepository _repository;
  
  VenueBloc(this._repository) : super(VenueInitial()) {
    on<FetchVenuesEvent>(_onFetchVenues);
  }
  
  Future<void> _onFetchVenues(
    FetchVenuesEvent event,
    Emitter<VenueState> emit,
  ) async {
    emit(VenueLoading());
    try {
      final venues = await _repository.getApprovedVenues();
      // venues are already filtered server-side
      emit(VenueLoaded(venues));
    } catch (e) {
      emit(VenueError(e.toString()));
    }
  }
}
```

---

## If You Still Want Option 2 (Direct Firestore)

Only choose this if you have strict offline-first requirements and Firestore rules are already enforced.

```dart
// lib/repositories/venue_repository.dart
class VenueRepository {
  final FirebaseFirestore _firestore;
  
  VenueRepository(this._firestore);
  
  Future<List<Venue>> getApprovedVenues() async {
    try {
      final snapshot = await _firestore
          .collection('venues')
          .where('status', isEqualTo: 'approved') // Client-side filter
          .orderBy('createdAt', descending: true)
          .limit(500)
          .get();
      
      return snapshot.docs
          .map((doc) => Venue.fromJson(doc.data()))
          .toList();
    } catch (e) {
      throw Exception('Error fetching venues: $e');
    }
  }
}
```

**But you MUST have Firestore security rules**:

```firestore.rules
match /venues/{venueId} {
  // Clients can only read approved venues
  allow read: if resource.data.status == 'approved';
  allow write: if false;
}
```

This rule prevents users from even querying pending venues at the Firestore level.

---

## Security Comparison With Firestore Rules

### Without Firestore Rules + Option 2
```
🔓 INSECURE
User decompiles APK → Modifies venue_repository.dart
→ Removes .where('status', isEqualTo: 'approved')
→ Now sees pending venues
```

### With Firestore Rules + Option 2
```
🔒 SECURE
User decompiles APK → Modifies code to fetch all venues
→ Firestore rules block the read
→ Still can't see pending venues
```

---

## My Final Recommendation

### Choose Based on Your Architecture:

**If you have REST API + Firestore**:
- Use Option 1 (API) ✅
- Consistent with website
- Better long-term scalability

**If you have Mobile-First + Firestore Only**:
- Use Option 2 with Firestore Rules ✅
- Add `allow read: if resource.data.status == 'approved';` rule
- Simpler for mobile, but harder to sync with website later

**If you want Maximum Security**:
- Use Option 1 (API) ✅✅
- Server controls everything
- Users cannot bypass even with decompiled APK

---

## Database Query Comparison

### Option 1: API (Recommended)
```
Mobile App
   ↓
GET /api/venues (HTTP)
   ↓
Backend: WHERE status == 'approved'
   ↓
Return JSON with filtered venues
   ↓
Display to user
```

### Option 2: Firestore Direct (Needs Rules)
```
Mobile App
   ↓
Firestore Query: WHERE status == 'approved'
   ↓
Firestore Rules: CHECK if status == 'approved'
   ↓
Return filtered documents
   ↓
Display to user
```

---

## Side-by-Side Code Example

### Website (Current) ✅
```javascript
// /app/venues/page.tsx
const response = await fetch("/api/venues");
const data = await response.json();
setVenues(data.venues); // Already filtered on server
```

### Mobile Option 1 (Recommended)
```dart
// lib/repositories/venue_repository.dart
final response = await http.get(Uri.parse('https://yourdomain.com/api/venues'));
final data = jsonDecode(response.body);
return data['venues']; // Same filtered data as website
```

### Mobile Option 2 (Only with Firestore Rules)
```dart
// lib/repositories/venue_repository.dart
final snapshot = await _firestore
    .collection('venues')
    .where('status', isEqualTo: 'approved')
    .get();
return snapshot.docs.map((doc) => Venue.fromJson(doc.data())).toList();
// Must have Firestore rule: allow read: if status == 'approved';
```

---

## Summary & Action Items

### ✅ My Recommendation: Use Option 1 (API)

**Reasons**:
1. Consistent with website
2. Server-side enforcement (cannot be bypassed)
3. Single source of truth for filtering logic
4. Future-proof for new features
5. Easier to maintain

**Action Items**:
1. [ ] Create/use HTTP client in mobile app
2. [ ] Call `https://yourdomain.com/api/venues` instead of Firestore
3. [ ] Parse JSON response
4. [ ] Update BLoC/Provider to use new data source

### If You Must Use Option 2:
1. [ ] Add Firestore security rule: `allow read: if resource.data.status == 'approved';`
2. [ ] Update `venue_repository.dart` to include `.where('status', isEqualTo: 'approved')`
3. [ ] Document that mobile and website have different implementations
4. [ ] Plan for future sync issues

**Bottom Line**: Option 1 (API) is more secure, more maintainable, and more consistent. I recommend it strongly.
