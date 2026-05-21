/** Google hosts used by Firebase Web SDK — proxied on restricted networks */
/** Auth-only — do not proxy Firestore (long-poll Listen breaks on serverless). */
export const PROXYABLE_GOOGLE_HOSTS = [
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "www.googleapis.com",
  "firebaseinstallations.googleapis.com",
] as const;

export type ProxyableHost = (typeof PROXYABLE_GOOGLE_HOSTS)[number];

export function isProxyableGoogleHost(host: string): host is ProxyableHost {
  return (PROXYABLE_GOOGLE_HOSTS as readonly string[]).includes(host);
}

export function toProxiedGoogleUrl(originalUrl: string): string | null {
  try {
    const parsed = new URL(originalUrl);
    if (!isProxyableGoogleHost(parsed.host)) return null;
    const pathWithQuery = `${parsed.pathname}${parsed.search}`;
    return `/api/proxy/google?host=${encodeURIComponent(parsed.host)}&path=${encodeURIComponent(pathWithQuery)}`;
  } catch {
    return null;
  }
}
