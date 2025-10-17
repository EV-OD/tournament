"use client";

import React from "react";

interface AuthPageLayoutProps {
  heroImage: string;
  heroTitle: string;
  heroDescription: string;
  heroAlt?: string;
  children: React.ReactNode;
}

/**
 * AuthPageLayout
 *
 * Reusable layout for all auth pages (login/register for all roles).
 * Provides a two-column design:
 * - Left: Form area with backdrop card
 * - Right: Full-bleed hero image with overlay and caption
 *
 * Usage:
 * <AuthPageLayout
 *   heroImage="/images/placeholder-login.jpg"
 *   heroTitle="Welcome back"
 *   heroDescription="Sign in to manage your bookings"
 * >
 *   <LoginForm />
 * </AuthPageLayout>
 */
export default function AuthPageLayout({
  heroImage,
  heroTitle,
  heroDescription,
  heroAlt = "Hero illustration",
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2">
      {/* Left: Form area - centered and using full height */}
      <div className="relative z-20 flex flex-col justify-center p-6 md:p-12">
        {/* Form container - allow wider form and prevent overflow; add readable backdrop */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/85 rounded-lg shadow-lg p-6 backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>

      {/* Right: Full-bleed hero image (covers entire page including left area) */}
      <div className="absolute inset-0 hidden lg:block z-0">
        <img
          src={heroImage}
          alt={heroAlt}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          aria-hidden="true"
        />
        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

        {/* Hero caption */}
        <div className="absolute right-12 bottom-12 text-white max-w-sm pointer-events-none z-10">
          <h2 className="text-2xl font-bold">{heroTitle}</h2>
          <p className="mt-2 text-sm">{heroDescription}</p>
        </div>
      </div>
    </div>
  );
}
