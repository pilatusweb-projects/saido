"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, serverSession, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !serverSession)) {
      router.replace("/login");
    }
  }, [user, serverSession, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !serverSession) return null;

  return <>{children}</>;
}
