# Mobile App Implementation Guide: Side-by-Side Code

## Current Mobile Code (Before)

```dart
// lib/repositories/venue_repository.dart
class VenueRepository {
  final FirebaseFirestore _firestore;
  
  VenueRepository(this._firestore);
  
  // Current: Fetches ALL venues, no status filter
  Future<List<Venue>> getVenues() async {
    final snapshot = await _firestore.collection('venues').get();
    return snapshot.docs
        .map((doc) => Venue.fromJson(doc.data()))
        .toList();
  }
}
```

**Problem**: This fetches ALL venues (pending, approved, rejected). No filtering.

---

## Path 1: Switch to API (RECOMMENDED)

### Step 1: Create API Service

```dart
// lib/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiConfig {
  static const String baseUrl = 'https://yourdomain.com'; // Change this
}

class ApiService {
  static const String _venuesEndpoint = '/api/venues';
  final http.Client _httpClient;
  
  ApiService({http.Client? httpClient}) 
    : _httpClient = httpClient ?? http.Client();
  
  Future<Map<String, dynamic>> getVenues({
    int limit = 500,
    int offset = 0,
  }) async {
    try {
      final url = Uri.parse(
        '${ApiConfig.baseUrl}$_venuesEndpoint?limit=$limit&offset=$offset'
      );
      
      final response = await _httpClient.get(url);
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw ApiException('Failed to fetch venues: ${response.statusCode}');
      }
    } on FormatException {
      throw ApiException('Invalid response format');
    } catch (e) {
      throw ApiException('Network error: $e');
    }
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  
  @override
  String toString() => message;
}
```

### Step 2: Update Repository

```dart
// lib/repositories/venue_repository.dart
class VenueRepository {
  final ApiService _apiService;
  
  VenueRepository(this._apiService);
  
  // NEW: Uses API endpoint (already filtered on server)
  Future<List<Venue>> getApprovedVenues({
    int limit = 500,
    int offset = 0,
  }) async {
    try {
      final response = await _apiService.getVenues(
        limit: limit,
        offset: offset,
      );
      
      // Server already filtered to approved venues only
      final venues = List<Map<String, dynamic>>.from(
        response['venues'] as List
      );
      
      return venues
          .map((venueData) => Venue.fromJson(venueData))
          .toList();
    } catch (e) {
      throw Exception('Failed to load venues: $e');
    }
  }
}
```

### Step 3: Update pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0  # Add this
  # ... other dependencies
```

### Step 4: Update BLoC/Provider

```dart
// lib/bloc/venue_bloc.dart (using BLoC pattern)
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
      // Venues are already filtered by API
      emit(VenueLoaded(venues));
    } catch (e) {
      emit(VenueError(e.toString()));
    }
  }
}

class FetchVenuesEvent extends VenueEvent {}
abstract class VenueEvent {}
abstract class VenueState {}
class VenueInitial extends VenueState {}
class VenueLoading extends VenueState {}
class VenueLoaded extends VenueState {
  final List<Venue> venues;
  VenueLoaded(this.venues);
}
class VenueError extends VenueState {
  final String message;
  VenueError(this.message);
}
```

### Step 5: Use in Widget

```dart
// lib/screens/venues_screen.dart
class VenuesScreen extends StatefulWidget {
  @override
  State<VenuesScreen> createState() => _VenuesScreenState();
}

class _VenuesScreenState extends State<VenuesScreen> {
  @override
  void initState() {
    super.initState();
    // Trigger venue fetch when screen loads
    context.read<VenueBloc>().add(FetchVenuesEvent());
  }
  
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<VenueBloc, VenueState>(
      builder: (context, state) {
        if (state is VenueLoading) {
          return Center(child: CircularProgressIndicator());
        }
        
        if (state is VenueError) {
          return Center(child: Text('Error: ${state.message}'));
        }
        
        if (state is VenueLoaded) {
          return ListView.builder(
            itemCount: state.venues.length,
            itemBuilder: (context, index) {
              final venue = state.venues[index];
              return VenueCard(venue: venue);
            },
          );
        }
        
        return Center(child: Text('No venues'));
      },
    );
  }
}
```

### Summary: Path 1
- ✅ Uses API endpoint
- ✅ Server-side filtering
- ✅ Cannot be bypassed
- ⏱️ Time: 1-2 hours
- 📊 Files to modify: 4-5

---

## Path 2: Direct Firestore with Client Filter (WITH SECURITY RULE)

### Step 1: Update Repository

```dart
// lib/repositories/venue_repository.dart
class VenueRepository {
  final FirebaseFirestore _firestore;
  
  VenueRepository(this._firestore);
  
  // NEW: Filters client-side + Firestore rules provide backup
  Future<List<Venue>> getApprovedVenues() async {
    try {
      final snapshot = await _firestore
          .collection('venues')
          // Client-side filter (can be bypassed, but Firestore rules protect)
          .where('status', isEqualTo: 'approved')
          .orderBy('createdAt', descending: true)
          .limit(500)
          .get();
      
      return snapshot.docs
          .map((doc) => Venue.fromJson(doc.data()))
          .toList();
    } catch (e) {
      throw Exception('Failed to load venues: $e');
    }
  }
}
```

### Step 2: Add Firestore Security Rule

```firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Venues collection
    match /venues/{venueId} {
      // ✅ SECURITY CRITICAL: Only allow reading approved venues
      allow read: if resource.data.status == 'approved';
      allow write: if false;
    }
    
    // ... other rules
  }
}
```

### Step 3: Update BLoC (Same as Path 1)

```dart
// lib/bloc/venue_bloc.dart (no change needed, works the same)
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
      emit(VenueLoaded(venues));
    } catch (e) {
      emit(VenueError(e.toString()));
    }
  }
}
```

### Summary: Path 2
- ⚠️ Client-side filtering (can be decompiled)
- ✅ Firestore rules provide backup security
- ✅ Works offline (with caching)
- ⏱️ Time: 30 minutes
- 📊 Files to modify: 2-3

---

## Comparison Side-by-Side

### What Gets Called

#### Path 1 (API)
```
Mobile App
  ↓
HTTP Client → GET /api/venues
  ↓
Backend Server
  ↓
WHERE status == 'approved'
  ↓
JSON Response (filtered)
  ↓
Mobile App displays
```

#### Path 2 (Firestore)
```
Mobile App
  ↓
Firestore Client
  ↓
Query: WHERE status == 'approved'
  ↓
Firestore Rules Check
  ↓
if (resource.data.status == 'approved')
  ↓
Return documents
  ↓
Mobile App displays
```

---

## Testing Both Paths

### Test Path 1 (API)
```dart
// Test the API service
void main() {
  test('API returns only approved venues', () async {
    final service = ApiService();
    final response = await service.getVenues();
    
    final venues = response['venues'] as List;
    // Verify all venues have status 'approved'
    expect(
      venues.every((v) => v['status'] == 'approved'),
      true,
    );
  });
}
```

### Test Path 2 (Firestore)
```dart
// Test Firestore query
void main() {
  test('Firestore returns only approved venues', () async {
    final firestore = FakeFirebaseFirestore();
    final repository = VenueRepository(firestore);
    
    final venues = await repository.getApprovedVenues();
    // Verify all venues have status 'approved'
    expect(
      venues.every((v) => v.status == 'approved'),
      true,
    );
  });
}
```

---

## Performance Comparison

### Path 1 (API)
```
Network Request: 50-200ms (depending on connection)
Server Filtering: 10-50ms
Total: 60-250ms
Bandwidth: Small JSON payload (only approved venues)
```

### Path 2 (Firestore)
```
Firestore Query: 100-500ms
Local Filtering: 10-50ms
Total: 110-550ms
Bandwidth: Medium (Firestore reads each doc)
Caching: Better with local cache
```

---

## Migration Path (If You Already Have Path 2)

### From Firestore to API (Easy)

**Before**:
```dart
Future<List<Venue>> getApprovedVenues() async {
  final snapshot = await _firestore
      .collection('venues')
      .where('status', isEqualTo: 'approved')
      .get();
  return snapshot.docs.map(...).toList();
}
```

**After**:
```dart
Future<List<Venue>> getApprovedVenues() async {
  final response = await _apiService.getVenues();
  final venues = response['venues'] as List;
  return venues.map(...).toList();
}
```

**Change**: Just swap the data source, same return type!

---

## My Recommendation (One More Time)

### 🟢 USE PATH 1 (API)
**Why**:
1. Server controls filtering (secure)
2. Consistent with website
3. No decompilation bypass possible
4. Single source of truth
5. Worth the extra hour

**Do this if**:
- You want maximum security
- You want consistency across platforms
- You're open to adding HTTP dependency
- You plan to add more features later

### 🟡 USE PATH 2 (Firestore) ONLY IF:
1. You add the security rule (CRITICAL)
2. You need offline support
3. You want minimal code changes
4. You trust Firestore security

**Don't use Path 2 if**:
- You don't add the Firestore rule (SECURITY RISK)
- You want consistency with website

---

## Summary Table

| Aspect | Path 1 (API) | Path 2 (Firestore) |
|--------|---------|----------|
| Code Changes | 4-5 files | 2-3 files |
| Time | 1-2 hours | 30 minutes |
| Security | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (with rules) |
| Consistency | Perfect | Different from web |
| Offline | No | Yes |
| Can Bypass | ❌ NO | ⚠️ YES (if no rules) |
| Needs Rules | No | YES (critical) |
| Future Features | Easy | Need mobile update |

**Recommendation**: Path 1 (API) for long-term success.
