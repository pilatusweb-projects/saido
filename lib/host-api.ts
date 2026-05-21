/** Host API client — uses session cookie (credentials: include). */

export async function hostFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function hostJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await hostFetch(path, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return data;
}
