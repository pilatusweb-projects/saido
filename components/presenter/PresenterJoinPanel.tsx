"use client";

import { SessionQR } from "@/components/session/SessionQR";
import { getJoinUrl } from "@/lib/join-url";

interface PresenterJoinPanelProps {
  sessionId: string;
  code: string;
  sessionName: string;
  compact?: boolean;
}

export function PresenterJoinPanel({
  sessionId,
  code,
  sessionName,
  compact = false,
}: PresenterJoinPanelProps) {
  return (
    <div
      className={
        compact
          ? "flex flex-col items-center justify-center gap-4 py-4"
          : "flex flex-col items-center justify-center gap-6 p-6 lg:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 h-full"
      }
    >
      {!compact && (
        <p className="text-slate-400 text-sm uppercase tracking-wider text-center">
          Join {sessionName}
        </p>
      )}
      <p
        className={
          compact
            ? "text-4xl font-bold font-mono tracking-[0.2em] text-white"
            : "text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tracking-[0.25em] text-white"
        }
      >
        {code}
      </p>
      <SessionQR
        sessionId={sessionId}
        code={code}
        size={compact ? 200 : 260}
        variant="presenter"
      />
      {!compact && (
        <p className="text-slate-500 text-sm text-center max-w-xs break-all">
          {getJoinUrl(code)} or scan the QR
        </p>
      )}
    </div>
  );
}
