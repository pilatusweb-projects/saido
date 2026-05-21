"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionById } from "@/lib/firestore";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

/**
 * Client-side fallback for /go/[id] when the Admin SDK is not configured.
 * Uses the client Firestore SDK to look up the session by id and redirect.
 */
export default function GoFallback({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSessionById(id)
      .then((session) => {
        if (cancelled) return;
        if (session?.code) {
          router.replace(`/join/${session.code.toUpperCase()}`);
        } else {
          setError("Session not found.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not connect to the database. Check your internet connection.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-700 font-medium">{error}</p>
        <p className="text-sm text-slate-500">
          Ask the host for the 6-character code and{" "}
          <Link href="/" className="saido-brand underline">
            enter it on the home page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Spinner />
      <p className="text-sm text-slate-500">Joining session…</p>
    </div>
  );
}
