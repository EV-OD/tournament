"use client";

import { AlertCircle, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoVenueAccessProps {
  adminEmail?: string;
}

export const NoVenueAccess = ({ adminEmail = "admin@tournament.com" }: NoVenueAccessProps) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full border-amber-200 dark:border-amber-800">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4">
              <Shield className="h-12 w-12 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Verification Required
          </CardTitle>
          <CardDescription className="text-base mt-2">
            You are not verified to manage any venues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Access Restricted</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Your account needs to be assigned to a venue by an administrator before you can access the manager dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              To gain access, please contact your administrator
            </p>
            <Button
              className="w-full"
              variant="default"
              onClick={() => window.location.href = `mailto:${adminEmail}?subject=Venue Manager Access Request`}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-2">
            If you believe this is an error, please reach out to support
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
