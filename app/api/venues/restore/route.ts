/*
 * POST /api/venues/restore
 *
 * Description:
 *   Restores an archived venue by moving it back from the archivedVenues collection
 *   to the venues collection. The venue status is set based on the type of archival:
 *   - If rejected: status is set to "pending" (requires re-approval)
 *   - If deleted: status is set to "pending" (requires re-approval)
 *
 * Authentication & Authorization:
 *   - Requires an Authorization header: `Authorization: Bearer <idToken>`
 *   - The idToken is verified using the Admin SDK.
 *   - Only admins can restore venues.
 *
 * Request:
 *   - Method: POST
 *   - Body (JSON):
 *       {
 *         "venueId": string  // required - archived venue document id to restore
 *       }
 *
 * Successful Response (200):
 *   { ok: true }
 *
 * Failure responses:
 *   - 400 Bad Request (missing required fields)
 *     { error: 'Missing required field: venueId' }
 *
 *   - 401 Missing/Invalid Authorization token
 *     { error: 'Missing Authorization token' }
 *
 *   - 403 Insufficient permissions (not admin)
 *     { error: 'Insufficient permissions' }
 *
 *   - 404 Archived venue not found
 *     { error: 'Archived venue not found' }
 *
 *   - 500 Internal Server Error
 *     { error: '<error message>' }
 *
 * Behavior / Side-effects:
 *   - Verifies caller is admin
 *   - Loads archivedVenues/{venueId} document
 *   - Removes archival metadata from venue data
 *   - Sets status to "pending"
 *   - Creates/updates venue document in venues/{venueId}
 *   - Deletes the archived venue document
 *
 * Notes:
 *   - All original venue data is preserved except archival-specific metadata
 *   - Venue status is always reset to "pending" on restore
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestToken, getUserRole, requireAdminSDK } from "@/lib/server/auth";

export async function POST(req: Request) {
  const sdkError = requireAdminSDK();
  if (sdkError) return sdkError;

  try {
    const body = await req.json();
    const { venueId } = body;

    // Validate required fields
    if (!venueId) {
      return NextResponse.json(
        { error: "Missing required field: venueId" },
        { status: 400 },
      );
    }

    const authResult = await verifyRequestToken(req);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    // Only admins can restore venues
    const userRole = await getUserRole(uid);
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Fetch archived venue to verify it exists
    const archivedVenueRef = db.collection("archivedVenues").doc(venueId);
    const archivedVenueSnap = await archivedVenueRef.get();
    if (!archivedVenueSnap.exists) {
      return NextResponse.json(
        { error: "Archived venue not found" },
        { status: 404 },
      );
    }

    const archivedVenueData = archivedVenueSnap.data() as any;

    // Prepare venue data for restoration - remove archival metadata
    const { originalId, archivedStatus, archivalReason, archivedBy, archivedAt, ...venueData } = archivedVenueData;

    // Set status to pending for re-approval
    venueData.status = "pending";
    venueData.restoredAt = FieldValue.serverTimestamp();
    venueData.restoredBy = uid;

    // Restore the venue to the active venues collection
    const venueRef = db.collection("venues").doc(venueId);
    await venueRef.set(venueData);

    // Delete the archived venue
    await archivedVenueRef.delete();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Venue restore error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
