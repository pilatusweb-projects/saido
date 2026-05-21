"use client";

import { QRCodeSVG } from "qrcode.react";
import { getAppUrl } from "@/lib/firebase";
import { getJoinUrl } from "@/lib/join-url";

interface SessionQRProps {
  sessionId: string;
  code: string;
  /** QR image size in pixels (default 160) */
  size?: number;
  /** Dark presenter shell — white QR on dark card */
  variant?: "default" | "presenter";
}

/** QR encodes /go/{sessionId} so the server resolves the join code (works even if /join lookup fails on the phone). */
function getGoUrl(sessionId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/go/${sessionId}`;
  }
  return `${getAppUrl()}/go/${sessionId}`;
}

export function SessionQR({
  sessionId,
  code,
  size = 160,
  variant = "default",
}: SessionQRProps) {
  const qrUrl = getGoUrl(sessionId);
  const joinUrl = getJoinUrl(code);
  const isPresenter = variant === "presenter";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={
          isPresenter
            ? "bg-white p-4 rounded-2xl shadow-lg"
            : "bg-white p-3 rounded-2xl shadow-inner border border-slate-100"
        }
      >
        <QRCodeSVG value={qrUrl} size={size} level="M" />
      </div>
      {!isPresenter && (
        <>
          <p className="text-xs text-slate-500 text-center break-all max-w-[240px]">{qrUrl}</p>
          <p className="text-xs text-slate-400 text-center">
            Scans redirect to join code{" "}
            <span className="font-mono font-semibold saido-brand">{code}</span> (
            <span className="font-mono break-all">{joinUrl}</span>)
          </p>
        </>
      )}
      {isPresenter && (
        <p className="text-sm text-slate-400 text-center">
          Scan to join ·{" "}
          <span className="font-mono text-slate-300">{joinUrl}</span>
        </p>
      )}
    </div>
  );
}
