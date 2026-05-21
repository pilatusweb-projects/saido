"use client";

import { useState, FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { isAuthNetworkError, signInWithServerAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/unauthorized-domain":
    "This site URL is not allowed in Firebase. Add your Vercel domain under Authentication → Settings → Authorized domains.",
  "auth/network-request-failed":
    "Cannot reach Firebase Auth from this browser. Trying server sign-in…",
  "server-auth-not-configured":
    "Server sign-in is not set up. Add FIREBASE_SERVICE_ACCOUNT_KEY on Vercel (see README).",
};

function getAuthErrorMessage(err: unknown): string {
  const firebaseErr = err as { code?: string; message?: string };
  if (firebaseErr.code && ERROR_MESSAGES[firebaseErr.code]) {
    return ERROR_MESSAGES[firebaseErr.code];
  }
  if (firebaseErr.message) return firebaseErr.message;
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
      router.push("/dashboard");
    } catch (clientErr) {
      if (!isAuthNetworkError(clientErr)) {
        setError(getAuthErrorMessage(clientErr));
        setLoading(false);
        return;
      }

      try {
        await signInWithServerAuth(mode, trimmedEmail, password);
        router.push("/dashboard");
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
        On restricted company networks, sign-up uses your Vercel server first, then completes
        sign-in. If it still fails, IT must allow{" "}
        <span className="font-mono">identitytoolkit.googleapis.com</span>.
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
