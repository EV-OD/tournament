import { RegisterForm } from "@/components/register-form";
import AuthPageLayout from "@/components/AuthPageLayout";

export default function ManagerRegisterPage() {
  return (
    <AuthPageLayout
      heroImage="/images/placeholder-manage.jpg"
      heroTitle="Welcome, Manager"
      heroDescription="Create your manager account to add and manage venues, bookings and verify payments."
      heroAlt="Illustration: manager with clipboard and calendar"
    >
      <RegisterForm role="manager" />
    </AuthPageLayout>
  );
}
