import { redirect } from "next/navigation";
import Link from "next/link";
import {
  isAdminConfigured,
  getSessionJoinInfoByIdAdmin,
} from "@/lib/firestore-admin";
import GoFallback from "./GoFallback";

/**
 * /go/[sessionId] — participant entry point encoded in QR codes.
 *
 * When the Admin SDK is configured (FIREBASE_SERVICE_ACCOUNT_KEY set on Vercel):
 *   - Resolves the session on the server and issues an instant HTTP redirect to /join/[code].
 *   - No JavaScript required; works even if the phone has no client Firestore connection.
 *
 * When the Admin SDK is not configured:
 *   - Falls back to a client-side component that uses the Firestore JS SDK.
 */
export default async function GoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isAdminConfigured()) {
    let session: Awaited<ReturnType<typeof getSessionJoinInfoByIdAdmin>> = null;
    try {
      session = await getSessionJoinInfoByIdAdmin(id);
    } catch {
      /* admin SDK failed — fall through to client below */
    }

    if (session?.code) {
      redirect(`/join/${session.code}`);
    }

    if (session !== null) {
      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-slate-700 font-medium">Session not found</p>
          <p className="text-sm text-slate-500">
            This link is no longer valid. Ask the host for the current QR code or 6-character
            join code and{" "}
            <Link href="/" className="saido-brand underline">
              enter it on the home page
            </Link>
            .
          </p>
        </div>
      );
    }
    /* session === null means admin init threw — fall through to client */
  }

  return <GoFallback id={id} />;
}
