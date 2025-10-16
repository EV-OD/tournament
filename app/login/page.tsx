import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <CardTitle className="mt-2">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage bookings, view your reservations, and access admin
            tools.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div className="mt-2">
            {/* LoginForm provides social-only buttons (Google wired up) */}
            <LoginForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
