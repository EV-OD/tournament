// Debug script for admin venues listing issue
// Add this to browser console in the admin venues page (F12)

// Check 1: Are venues being fetched?
console.log("🔍 Checking venues data...");

// Check 2: Verify Firebase connection
if (typeof window !== 'undefined' && window.location.href.includes('/admin/venues')) {
  console.log("✓ On admin venues page");
} else {
  console.log("✗ Not on admin venues page");
}

// Check 3: Check local storage for user role
const userRole = localStorage.getItem('userRole');
console.log(`User Role in Storage: ${userRole || 'Not found'}`);

// Check 4: Network debugging
console.log("📡 To debug network issues:");
console.log("1. Open DevTools (F12)");
console.log("2. Go to Network tab");
console.log("3. Reload the page");
console.log("4. Look for failed requests (red entries)");
console.log("5. Check Firestore requests for errors");

// Check 5: Firestore data structure
console.log("🗄️ Expected Firestore structure:");
console.log({
  collection: "venues",
  requiredFields: ["id", "name", "status", "createdAt"],
  statusValues: ["pending", "approved", "rejected"],
  example: {
    id: "venue_123",
    name: "Example Venue",
    address: "123 Main St",
    status: "pending",
    createdAt: "2024-01-01T00:00:00Z",
    advancePercentage: 20,
    platformCommission: 5,
    managedBy: "manager_uid"
  }
});

// Check 6: Browser console errors
console.log("⚠️ Check if there are any red error messages above this");

// Check 7: Firestore Rules Check
console.log(`🔐 Firestore Rules Note: Ensure your rules allow admins to read all venues`);
console.log(`Example rule: match /venues/{document=**} { allow read: if request.auth.token.role == 'admin'; }`);
