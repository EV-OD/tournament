import { NextRequest, NextResponse } from "next/server";
import { blockSlot } from "@/lib/slotService.admin";
import { verifyRequestToken, isManagerOrAdmin, requireAdminSDK } from "@/lib/server/auth";

/**
 * POST /api/slots/block
 *
 * Description:
 *   Block a slot by a venue manager or admin to prevent it from being booked.
 *
 * Authentication:
 *   - Requires Authorization: Bearer <idToken>
 *   - The token must belong to a user with role "manager" or "admin".
 */
export async function POST(request: NextRequest) {
  const sdkError = requireAdminSDK();
  if (sdkError) return sdkError;

  try {
    const body = await request.json();
    const { venueId, date, startTime, reason } = body;

    if (!venueId || !date || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const authResult = await verifyRequestToken(request);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    // TODO: Ideally we should verify if the manager has access to this specific venueId
    // For now, we use a general check for manager/admin role as existing in reserve/route.ts
    const allowed = await isManagerOrAdmin(uid);
    if (!allowed)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await blockSlot(venueId, date, startTime, reason, uid);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error in /api/slots/block:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
