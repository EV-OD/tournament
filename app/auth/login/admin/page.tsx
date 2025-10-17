import { AdminLoginForm } from "@/components/admin-login-form";
import AuthPageLayout from "@/components/AuthPageLayout";

export default function AdminLoginPage() {
  return (
    <AuthPageLayout
      heroImage="/images/placeholder-admin.jpg"
      heroTitle="Admin Sign in"
      heroDescription="Sign in with your admin credentials to access the system dashboard and manage the platform."
      heroAlt="Illustration: admin dashboard"
    >
      <AdminLoginForm />
    </AuthPageLayout>
  );
}
