"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { clearServerSession } from "@/lib/auth-session-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await clearServerSession();
    await signOut(getAuthInstance());
    router.push("/");
  }

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-slate-600 hover:saido-brand transition-colors"
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
