import { NextRequest, NextResponse } from "next/server";
import { unblockSlot } from "@/lib/slotService.admin";
import { verifyRequestToken, isManagerOrAdmin, requireAdminSDK } from "@/lib/server/auth";

/**
 * POST /api/slots/unblock
 *
 * Description:
 *   Unblock a previously blocked slot by a venue manager or admin.
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
    const { venueId, date, startTime } = body;

    if (!venueId || !date || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const authResult = await verifyRequestToken(request);
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    const allowed = await isManagerOrAdmin(uid);
    if (!allowed)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await unblockSlot(venueId, date, startTime);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error in /api/slots/unblock:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
