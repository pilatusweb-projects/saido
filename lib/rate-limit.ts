const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(
  request: Request,
  namespace: string
): { ok: true } | { ok: false; message: string } {
  const key = `${namespace}:${getClientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, message: "Too many requests. Please try again in a minute." };
  }

  bucket.count += 1;
  return { ok: true };
}
