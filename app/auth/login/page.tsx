import { LoginForm } from "@/components/login-form";
import AuthPageLayout from "@/components/AuthPageLayout";

export default function UserLoginPage() {
  return (
    <AuthPageLayout
      heroImage="/images/placeholder-login.jpg"
      heroTitle="Welcome back"
      heroDescription="Sign in to manage your bookings and view your history."
      heroAlt="Illustration: person using phone to sign in"
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
