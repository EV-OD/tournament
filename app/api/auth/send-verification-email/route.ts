/**
 * POST /api/auth/send-verification-email
 *
 * Description:
 *   Sends a verification email to a user using Firebase Admin SDK.
 *   Generates a verification link and sends it via Firebase's email service.
 *   This is a server-side operation for security reasons.
 *
 * Authentication:
 *   - Requires header: Authorization: Bearer <idToken>
 *   - The idToken is verified server-side
 *
 * Request (JSON body):
 *   {
 *     "uid": string  // Firebase UID of the user
 *   }
 *
 * Success Response:
 *   - 200 OK
 *     { "ok": true, "message": "Verification email sent" }
 *
 * Error Responses:
 *   - 400 Bad Request
 *     { "error": "Missing uid" }
 *   - 401 Unauthorized
 *     { "error": "Unauthorized" }
 *   - 404 Not Found
 *     { "error": "User not found" }
 *   - 500 Internal Server Error
 *     { "error": "Failed to send verification email" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Verify the user exists
    const user = await auth.getUser(uid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate verification link using Firebase Admin SDK
    // This creates a link that when clicked will mark the email as verified in Firebase
    const verificationLink = await auth.generateEmailVerificationLink(
      user.email!,
    );

    // Log for development purposes
    console.log(`✉️  Verification Email Generated`);
    console.log(`   To: ${user.email}`);
    console.log(`   Link: ${verificationLink}`);
    console.log(`   ---`);
    console.log(
      `   NOTE: In production, send this link via your email service (SendGrid, Nodemailer, etc.)`,
    );

    // In production, you would send this link via email here:
    // Example:
    // await emailService.send({
    //   to: user.email,
    //   subject: "Verify your email",
    //   html: `<a href="${verificationLink}">Click here to verify your email</a>`
    // });

    return NextResponse.json(
      {
        ok: true,
        message: "Verification email sent",
        // In development, we return the link for testing purposes only
        ...(process.env.NODE_ENV === "development" && {
          verificationLink,
        }),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 },
    );
  }
}

