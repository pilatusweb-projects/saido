import { signInWithCustomToken } from "firebase/auth";
import { getAuthInstance } from "./firebase";

export function isAuthNetworkError(err: unknown): boolean {
  const firebaseErr = err as { code?: string; message?: string };
  if (firebaseErr.code === "auth/network-request-failed") return true;
  const msg = firebaseErr.message ?? "";
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("CORS") ||
    msg.includes("ERR_FAILED")
  );
}

export async function signInWithServerAuth(
  mode: "login" | "signup",
  email: string,
  password: string
): Promise<void> {
  const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    customToken?: string;
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    const err = new Error(data.error ?? "Authentication failed.") as Error & {
      code?: string;
    };
    err.code = data.code;
    throw err;
  }

  if (!data.customToken) {
    throw new Error("Server did not return a sign-in token.");
  }

  try {
    await signInWithCustomToken(getAuthInstance(), data.customToken);
  } catch (tokenErr) {
    if (isAuthNetworkError(tokenErr)) {
      throw new Error(
        "Your network blocked the final sign-in step (identitytoolkit.googleapis.com). " +
          "Ask IT to allow that domain, or try mobile hotspot / home network."
      );
    }
    throw tokenErr;
  }
}
