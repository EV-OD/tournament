import { NextRequest, NextResponse } from "next/server";
import { requireAdminSDK } from "@/lib/server/auth";
import { db } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const sdkError = requireAdminSDK();
  if (sdkError) return sdkError;

  try {
    const { venueId, reason, deletedBy } = await req.json();
    if (!venueId || !reason || !deletedBy) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await db.collection("venueDeletionLogs").add({
      venueId,
      reason,
      deletedBy,
      deletedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
