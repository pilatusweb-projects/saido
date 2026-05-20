"use client";

import { QRCodeSVG } from "qrcode.react";
import { getAppUrl } from "@/lib/firebase";

interface SessionQRProps {
  code: string;
}

export function SessionQR({ code }: SessionQRProps) {
  const joinUrl = `${getAppUrl()}/join/${code}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
        <QRCodeSVG value={joinUrl} size={160} level="M" />
      </div>
      <p className="text-xs text-slate-500 text-center break-all max-w-[200px]">{joinUrl}</p>
    </div>
  );
}
