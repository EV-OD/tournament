import { ManagerLoginForm } from "@/components/manager-login-form";
import AuthPageLayout from "@/components/AuthPageLayout";

export default function ManagerLoginPage() {
  return (
    <AuthPageLayout
      heroImage="/images/placeholder-manage.jpg"
      heroTitle="Manager Sign in"
      heroDescription="Sign in to manage your venues, view bookings, and verify payments."
      heroAlt="Illustration: manager with clipboard and calendar"
    >
      <ManagerLoginForm />
    </AuthPageLayout>
  );
}
