"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

/**
 * Email Verification Page
 *
 * Shows when a user:
 * - Tries to login but is not email verified
 * - Just completed registration
 *
 * User is logged out when this page loads.
 */
export default function VerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const email_param = searchParams?.get("email") || "";

  // Logout user when page loads
  useEffect(() => {
    const logoutUser = async () => {
      try {
        await signOut(auth);
        setIsLoggingOut(false);
      } catch (err) {
        console.error("Logout error:", err);
        setIsLoggingOut(false);
      }
    };

    logoutUser();
  }, []);

  // Set email once
  useEffect(() => {
    if (email_param) {
      setEmail(decodeURIComponent(email_param));
    }
  }, [email_param]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      toast.info(
        "Please go back to login and try again. We'll resend the verification email.",
      );
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err) {
      console.error("Resend error:", err);
      toast.error("Please go back to login to resend the email.");
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6">
          {/* Icon Section */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Email Icon Background */}
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {/* Checkmark overlay */}
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-2 shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
            <p className="text-gray-600 text-sm">
              We've sent a verification link to:
            </p>
          </div>

          {/* Email Display */}
          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-gray-700">
                <span className="text-blue-600 font-semibold">{email}</span>
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3 text-center">
            <p className="text-gray-600 text-sm leading-relaxed">
              Click the link in your email to verify your account. The link will expire in
              {" "}
              <span className="font-semibold text-gray-900">24 hours</span>
              .
            </p>
            <p className="text-gray-500 text-xs">
              Don't see the email? Check your spam or junk folder.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Link href="/auth/login" className="block">
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Go to Login
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Already verified?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-xs text-green-800 font-medium">
                  Your account is secure
                </p>
                <p className="text-xs text-green-700 mt-1">
                  We'll never ask you to verify your email through a link in a chat or call.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Having trouble?{" "}
            <a
              href="mailto:support@tourney.local"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
