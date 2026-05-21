"use client";

import { QRCodeSVG } from "qrcode.react";
import { getAppUrl } from "@/lib/firebase";
import { getJoinUrl } from "@/lib/join-url";

interface SessionQRProps {
  sessionId: string;
  code: string;
}

/** QR encodes /go/{sessionId} so the server resolves the join code (works even if /join lookup fails on the phone). */
function getGoUrl(sessionId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/go/${sessionId}`;
  }
  return `${getAppUrl()}/go/${sessionId}`;
}

export function SessionQR({ sessionId, code }: SessionQRProps) {
  const qrUrl = getGoUrl(sessionId);
  const joinUrl = getJoinUrl(code);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
        <QRCodeSVG value={qrUrl} size={160} level="M" />
      </div>
      <p className="text-xs text-slate-500 text-center break-all max-w-[240px]">{qrUrl}</p>
      <p className="text-xs text-slate-400 text-center">
        Scans redirect to join code{" "}
        <span className="font-mono font-semibold saido-brand">{code}</span> (
        <span className="font-mono break-all">{joinUrl}</span>)
      </p>
    </div>
  );
}
