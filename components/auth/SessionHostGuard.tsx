"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Host-only session page. Logged-out visitors (e.g. wrong URL from browser bar)
 * are sent to /go/{sessionId} so they can join as participants.
 */
export function SessionHostGuard({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/go/${sessionId}`);
    }
  }, [user, loading, router, sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
