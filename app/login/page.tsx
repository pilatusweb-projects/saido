import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
