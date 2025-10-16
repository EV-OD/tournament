"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Social-only login form.
 * - Shows buttons for Google, Facebook and GitHub (only Google wired up).
 * - After successful Google sign-in, redirects to `next` query param or root.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const next = searchParams?.get("next") ?? "/";

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Redirect to the original page if provided
      router.replace(next);
    } catch (err) {
      // Show minimal feedback - UI components can be enhanced to surface errors
      // For now we just log to console
      console.error("Google sign-in error:", err);
      alert("Google sign-in failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotImplemented = (providerName: string) => {
    alert(`${providerName} login is not implemented yet.`);
  };

  return (
    <form
      className={cn("flex flex-col gap-6 w-full", className)}
      onSubmit={(e) => e.preventDefault()}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground text-sm">
            Continue with one of the social providers below
          </p>
        </div>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2"
            disabled={loading}
          >
            {/* Google SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.72 1.21 9.23 3.58l6.93-6.93C34.96 2.26 29.77 0 24 0 14.84 0 6.96 5.39 3.04 13.2l7.99 6.2C12.86 13.06 18.98 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.7 24.5c0-1.67-.17-3.28-.5-4.82H24v9.12h12.9c-.56 2.96-2.4 5.45-5.1 7.12l7.97 6.18C43.9 38.22 46.7 31.9 46.7 24.5z"
              />
              <path
                fill="#4A90E2"
                d="M10.03 28.12A14.99 14.99 0 0 1 9 24.5c0-1.48.23-2.91.64-4.26L1.65 13.98A23.98 23.98 0 0 0 0 24.5c0 3.97.94 7.71 2.64 11.06l7.39-7.44z"
              />
              <path
                fill="#FBBC05"
                d="M24 48c6.48 0 11.92-2.14 15.9-5.8l-7.97-6.18C29.65 35.78 27 36.5 24 36.5c-6.98 0-12.9-4.64-15-10.92l-7.99 6.2C6.96 42.61 14.84 48 24 48z"
              />
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleNotImplemented("GitHub")}
            className="flex items-center justify-center gap-2"
          >
            {/* GitHub mark (simple) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path
                fill="currentColor"
                d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.6 3 8.5 7.1 9.9.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.2-3.5-1.2-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6-.7 1.8-1 .1-.7.4-1.2.7-1.5-2.3-.3-4.7-1.1-4.7-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1 1.6-.5 3.5-.8 5.3-.8 1.8 0 3.7.3 5.3.8 1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.5 4.7-4.9 5 .4.4.7 1 .7 2v3c0 .3.2.6.7.5 4.1-1.5 7.1-5.3 7.1-9.9C23.1 5.3 18.3.5 12 .5z"
              />
            </svg>
            Login with GitHub
          </Button>

          <div className="mt-2 text-center">
            <FieldDescription>
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
