/*
 * POST /api/venues/archive
 *
 * Description:
 *   Archives a venue by moving it from the venues collection to the archivedVenues
 *   collection. This preserves all venue data and adds metadata about why it was
 *   archived (deleted or rejected).
 *
 * Authentication & Authorization:
 *   - Requires an Authorization header: `Authorization: Bearer <idToken>`
 *   - The idToken is verified using the Admin SDK.
 *   - Only admins can archive venues.
 *
 * Request:
 *   - Method: POST
 *   - Body (JSON):
 *       {
 *         "venueId": string,              // required - venue document id to archive
 *         "reason": string,               // required - reason for archival
 *         "archivedStatus": "deleted" | "rejected"  // required - type of archival
 *       }
 *
 * Successful Response (200):
 *   { ok: true }
 *
 * Failure responses:
 *   - 400 Bad Request (missing required fields)
 *     { error: 'Missing required fields: venueId, reason, archivedStatus' }
 *
 *   - 401 Missing/Invalid Authorization token
 *     { error: 'Missing Authorization token' }
 *
 *   - 403 Insufficient permissions (not admin)
 *     { error: 'Insufficient permissions' }
 *
 *   - 404 Venue not found
 *     { error: 'Venue not found' }
 *
 *   - 500 Internal Server Error
 *     { error: '<error message>' }
 *
 * Behavior / Side-effects:
 *   - Verifies caller is admin
 *   - Loads venues/{venueId} document
 *   - Creates archive doc in archivedVenues/{venueId} with all original data + metadata
 *   - Deletes the original venue document
 *   - Logs to venueDeletionLogs if archivedStatus is "deleted"
 *
 * Notes:
 *   - Rejection metadata is stored directly in the archived venue (rejectionReason field)
 *   - Deletion metadata is stored in both archived venue and venueDeletionLogs for audit trail
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestToken, getUserRole, requireAdminSDK } from "@/lib/server/auth";
import { COLLECTIONS } from "@/lib/utils";

export async function POST(req: Request) {
  const sdkError = requireAdminSDK();
  if (sdkError) return sdkError;

  try {
    const body = await req.json();
    const { venueId, reason, archivedStatus } = body;

    // Validate required fields
    if (!venueId || !reason || !archivedStatus) {
      return NextResponse.json(
        { error: "Missing required fields: venueId, reason, archivedStatus" },
        { status: 400 },
      );
    }

    // Validate archivedStatus enum
    if (!["deleted", "rejected"].includes(archivedStatus)) {
      return NextResponse.json(
        { error: "archivedStatus must be 'deleted' or 'rejected'" },
        { status: 400 },
      );
    }

    const authResult = await verifyRequestToken(req);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    // Only admins can archive venues
    const userRole = await getUserRole(uid);
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Fetch venue to verify it exists
    const venueRef = db.collection(COLLECTIONS.VENUES).doc(venueId);
    const venueSnap = await venueRef.get();
    if (!venueSnap.exists) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const venueData = venueSnap.data() as any;

    // Create archived venue document with all original data + metadata
    const archivedVenueData = {
      ...venueData,
      originalId: venueId,
      archivedStatus: archivedStatus,
      archivalReason: reason,
      archivedBy: uid,
      archivedAt: FieldValue.serverTimestamp(),
    };

    // Store the archived venue
    await db.collection("archivedVenues").doc(venueId).set(archivedVenueData);

    // Log deletion to venueDeletionLogs if it's a deletion
    if (archivedStatus === "deleted") {
      await db.collection("venueDeletionLogs").add({
        venueId: venueId,
        reason: reason,
        deletedBy: uid,
        deletedAt: FieldValue.serverTimestamp(),
      });
    }

    // Delete the original venue
    await venueRef.delete();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Venue archive error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
