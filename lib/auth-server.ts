import { getAdminAuth } from "./firebase-admin";

const IDENTITY_TOOLKIT = "https://identitytoolkit.googleapis.com/v1";

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set.");
  return key;
}

interface SignInPasswordResponse {
  localId: string;
  idToken: string;
  refreshToken: string;
  email?: string;
}

interface IdentityToolkitError {
  error?: {
    message?: string;
    code?: number;
  };
}

function mapIdentityError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email_exists")) return "An account already exists with this email.";
  if (lower.includes("invalid_password") || lower.includes("invalid_login"))
    return "Invalid email or password.";
  if (lower.includes("invalid_email")) return "Invalid email address.";
  if (lower.includes("weak_password")) return "Password must be at least 6 characters.";
  if (lower.includes("too_many_attempts")) return "Too many attempts. Try again later.";
  return message;
}

export async function signInWithPasswordServer(
  email: string,
  password: string
): Promise<SignInPasswordResponse> {
  const res = await fetch(
    `${IDENTITY_TOOLKIT}/accounts:signInWithPassword?key=${getApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  const data = (await res.json()) as SignInPasswordResponse & IdentityToolkitError;
  if (!res.ok) {
    const msg = data.error?.message ?? "Login failed.";
    throw new Error(mapIdentityError(msg));
  }
  return data;
}

export async function createUserServer(email: string, password: string): Promise<string> {
  const auth = getAdminAuth();
  const user = await auth.createUser({ email, password });
  return user.uid;
}

export async function createCustomTokenForEmailPassword(
  email: string,
  password: string
): Promise<string> {
  const signIn = await signInWithPasswordServer(email, password);
  const auth = getAdminAuth();
  return auth.createCustomToken(signIn.localId);
}

export async function createCustomTokenForNewUser(
  email: string,
  password: string
): Promise<string> {
  const uid = await createUserServer(email, password);
  const auth = getAdminAuth();
  return auth.createCustomToken(uid);
}

/** Server-side probe: can Vercel reach Google Identity Toolkit? */
export async function checkServerCanReachIdentityToolkit(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const res = await fetch(
      `${IDENTITY_TOOLKIT}/accounts:lookup?key=${getApiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "invalid-probe-token" }),
      }
    );
    // Any HTTP response from Google (even 400) means the server can reach the API
    if (res.status >= 200 && res.status < 500) {
      return { ok: true, message: "Server can reach Firebase Auth API." };
    }
    return { ok: false, message: `Unexpected status ${res.status}` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Server cannot reach Firebase Auth API.",
    };
  }
}
