import { getAuthInstance } from "./firebase";

/** After Firebase client sign-in, establish httpOnly server session cookie. */
export async function establishServerSession(): Promise<void> {
  const user = getAuthInstance().currentUser;
  if (!user) {
    throw new Error("Not signed in.");
  }
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not establish server session.");
  }
}

export async function hasServerSession(): Promise<boolean> {
  const res = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { authenticated?: boolean };
  return data.authenticated === true;
}

export async function clearServerSession(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });
}
