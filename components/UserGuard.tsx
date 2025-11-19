"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function UserGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || role !== "user") {
        router.replace("/auth/login");
      }
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  if (!user || role !== "user") {
    return null; // Will redirect
  }

  return <>{children}</>;
}
