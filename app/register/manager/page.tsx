"use client";

import React from "react";
import { RegisterForm } from "@/components/register-form";

export default function ManagerRegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form area - centered and using full height */}
      <div className="flex flex-col justify-center p-6 md:p-12">
        {/* Form container - allow wider form and prevent overflow */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <RegisterForm role="manager" />
          </div>
        </div>
      </div>

      {/* Right: Illustration / placeholder - show only on large screens */}
      <div className="relative hidden lg:flex items-center justify-center bg-gray-50 overflow-hidden">
        <img
          src="/images/placeholder-manage.jpg"
          alt="Illustration: manager with clipboard and calendar"
          className="w-full h-full object-cover"
        />
        {/* subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
        <div className="absolute left-12 bottom-12 text-white max-w-sm pointer-events-none">
          <h2 className="text-2xl font-bold">Welcome, Manager</h2>
          <p className="mt-2 text-sm">
            Create your manager account to add and manage venues, bookings and
            verify payments.
          </p>
        </div>
      </div>
    </div>
  );
}
