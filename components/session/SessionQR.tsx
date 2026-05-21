"use client";

import { QRCodeSVG } from "qrcode.react";
import { getJoinUrl } from "@/lib/join-url";

interface SessionQRProps {
  code: string;
}

export function SessionQR({ code }: SessionQRProps) {
  const joinUrl = getJoinUrl(code);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
        <QRCodeSVG value={joinUrl} size={160} level="M" />
      </div>
      <p className="text-xs text-slate-500 text-center break-all max-w-[240px]">{joinUrl}</p>
      <p className="text-xs text-slate-400 text-center">
        Scan with your phone camera — link uses this site&apos;s address.
      </p>
    </div>
  );
}
