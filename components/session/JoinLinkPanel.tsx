"use client";

import { useState } from "react";
import { getJoinUrl } from "@/lib/join-url";
import { Button } from "@/components/ui/Button";

interface JoinLinkPanelProps {
  sessionId: string;
  code: string;
}

export function JoinLinkPanel({ sessionId, code }: JoinLinkPanelProps) {
  const [copied, setCopied] = useState(false);
  const joinUrl = getJoinUrl(code);
  const goUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/go/${sessionId}`
      : `/go/${sessionId}`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", text);
    }
  }

  return (
    <div className="rounded-xl border-2 border-primary-soft bg-red-50/40 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">Participant link (for QR & sharing)</p>
      <p className="text-xs text-slate-600">
        Participants must use <span className="font-mono">/join/{code}</span> — not the host
        page <span className="font-mono">/session/…</span> from the browser bar.
      </p>
      <p className="text-sm font-mono font-bold saido-brand break-all">{joinUrl}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => copy(joinUrl)}>
          {copied ? "Copied!" : "Copy join link"}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => copy(goUrl)}>
          Copy short link (/go/…)
        </Button>
      </div>
    </div>
  );
}
