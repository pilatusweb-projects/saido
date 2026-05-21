import { getAppUrl } from "./firebase";

/** Join link for QR codes — always uses current site origin in the browser */
export function getJoinUrl(code: string): string {
  const normalized = code.toUpperCase();
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join/${normalized}`;
  }
  return `${getAppUrl()}/join/${normalized}`;
}
