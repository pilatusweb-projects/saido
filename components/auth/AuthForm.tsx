"use client";

import { useState, FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { isAuthNetworkError, signInWithServerAuth } from "@/lib/auth-client";
import { establishServerSession } from "@/lib/auth-session-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/unauthorized-domain":
    "This site is not authorized for sign-in. Please contact the person who invited you.",
  "auth/network-request-failed":
    "Connection problem. Trying again…",
  "server-auth-not-configured":
    "Sign-in is temporarily unavailable. Please try again in a few minutes.",
};

function getAuthErrorMessage(err: unknown): string {
  const firebaseErr = err as { code?: string; message?: string };
  if (firebaseErr.code && ERROR_MESSAGES[firebaseErr.code]) {
    return ERROR_MESSAGES[firebaseErr.code];
  }
  const msg = firebaseErr.message ?? "";
  if (
    /FIREBASE_SERVICE_ACCOUNT|\.env|not configured|Admin SDK/i.test(msg)
  ) {
    return "Sign-in is temporarily unavailable. Please try again in a few minutes.";
  }
  if (msg && !msg.includes("Firebase") && !msg.includes("token")) {
    return msg;
  }
  return "Something went wrong. Please try again.";
}

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { user, serverSession, loading: authLoading } = useAuth();

  function redirectAfterAuth() {
    const target =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/dashboard";
    router.push(target);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      const auth = getAuthInstance();
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      }
      await establishServerSession();
      redirectAfterAuth();
    } catch (clientErr) {
      if (!isAuthNetworkError(clientErr)) {
        setError(getAuthErrorMessage(clientErr));
        setLoading(false);
        return;
      }

      try {
        await signInWithServerAuth(mode, trimmedEmail, password);
        await establishServerSession();
        redirectAfterAuth();
      } catch (serverErr) {
        setError(getAuthErrorMessage(serverErr));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold saido-heading mb-1">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        {mode === "login"
          ? "Sign in to manage your sessions"
          : "Sign up to start hosting polls"}
      </p>

      {!authLoading && user && !serverSession && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Your previous sign-in could not be completed. Enter your email and password
          below to continue.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        Company network? Ensure Firebase → Authentication → Authorized domains includes{" "}
        <span className="font-mono font-semibold">saido-26.vercel.app</span> (required).
      </p>

      <p className="mt-4 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="saido-brand hover:underline font-medium">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="saido-brand hover:underline font-medium">
              Sign in
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
