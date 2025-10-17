"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * AuthGuard
 *
 * Client component that protects routes by redirecting unauthenticated users
 * to the `/auth/login` page. It preserves the originally requested path in a `next`
 * query parameter so the user can be returned after login.
 *
 * Usage:
 * Wrap protected pages/components with <AuthGuard>...</AuthGuard>
 *
 * Notes:
 * - This is a client component (uses firebase client SDK and next/router client hooks).
 * - It intentionally does not render anything until the auth state is known.
 * - If the current path is the login page, it will not redirect (avoids redirect loop).
 */
export default function AuthGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Subscribe to firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);

      // If no user and not already on the login page, redirect to /auth/login
      // Preserve the requested path in the `next` query param
      if (!u) {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "/";
        // Avoid redirect loop: if already on /auth/login, don't redirect
        if (!currentPath.startsWith("/auth/login")) {
          const redirectTo = `/auth/login?next=${encodeURIComponent(currentPath)}`;
          // use replace so browser history isn't filled with intermediate redirects
          router.replace(redirectTo);
        }
      }
    });

    return () => {
      unsubscribe();
    };
    // router is stable; include it to satisfy lint rules for hooks
  }, [router]);

  // While checking auth state, render a simple loading placeholder.
  // You can replace this with a spinner or skeleton if desired.
  if (!checked) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  // If user exists, render children (protected content)
  if (user) {
    return <>{children}</>;
  }

  // If we got here, the user is not authenticated and we've already triggered
  // a redirect to /auth/login. Render nothing while the router replaces the route.
  return null;
}
