import { getAuthInstance } from "./firebase";

export async function getBearerToken(): Promise<string | null> {
  const user = getAuthInstance().currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}

export async function authFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = await getBearerToken();
  if (!token) {
    throw new Error("You must be signed in.");
  }
  return fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
