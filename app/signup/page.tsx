import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Spinner } from "@/components/ui/Spinner";

export default function SignupPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
