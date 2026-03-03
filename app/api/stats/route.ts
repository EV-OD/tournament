/**
 * GET /api/stats
 *
 * Public endpoint — returns platform-wide aggregate stats for the homepage
 * Live Activity widget. Uses Admin SDK so Firestore security rules do not block it.
 *
 * Response:
 *   {
 *     venueCount: number,
 *     activeBookingCount: number,
 *     recentInitials: string[]   // up to 3 uppercase first characters from recent bookers
 *   }
 */

import { NextResponse } from "next/server";
import { requireAdminSDK } from "@/lib/server/auth";
import { getFirestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/utils";

export async function GET() {
  const adminError = requireAdminSDK();
  if (adminError) return adminError;

  try {
    const db = getFirestore();

    // Venue count
    const venueSnap = await db.collection(COLLECTIONS.VENUES).count().get();
    const venueCount = venueSnap.data().count;

    // Active bookings — confirmed or pending_payment
    const activeSnap = await db
      .collection(COLLECTIONS.BOOKINGS)
      .where("status", "in", ["confirmed", "CONFIRMED", "pending_payment"])
      .count()
      .get();
    const activeBookingCount = activeSnap.data().count;

    // Recent unique booker initials (up to 3) from latest 20 bookings
    const recentSnap = await db
      .collection(COLLECTIONS.BOOKINGS)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const seen = new Set<string>();
    const recentInitials: string[] = [];
    recentSnap.docs.forEach((d) => {
      const data = d.data();
      const name: string = data.customerName || data.userName || data.userId || "?";
      const initial = name.trim().charAt(0).toUpperCase();
      if (!seen.has(initial) && recentInitials.length < 3) {
        seen.add(initial);
        recentInitials.push(initial);
      }
    });

    return NextResponse.json(
      { venueCount, activeBookingCount, recentInitials },
      {
        status: 200,
        headers: {
          // Cache for 60 seconds — stats are non-critical, slight staleness is fine
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[/api/stats] error:", err);
    return NextResponse.json(
      { venueCount: 0, activeBookingCount: 0, recentInitials: [] },
      { status: 200 }
    );
  }
}
