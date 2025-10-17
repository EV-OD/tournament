import { RegisterForm } from "@/components/register-form";
import AuthPageLayout from "@/components/AuthPageLayout";

export default function UserRegisterPage() {
  return (
    <AuthPageLayout
      heroImage="/images/placeholder-register.jpg"
      heroTitle="Welcome to Futsal"
      heroDescription="Create an account to book courts, manage bookings and track your history."
      heroAlt="Illustration: onboarding and account creation"
    >
      <RegisterForm />
    </AuthPageLayout>
  );
}
