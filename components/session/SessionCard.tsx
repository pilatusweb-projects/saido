"use client";

import Link from "next/link";
import type { Session } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link href={`/session/${session.id}`}>
      <Card className="hover:shadow-xl hover:border-primary-soft transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            {session.name ? (
              <p className="font-semibold text-slate-900">{session.name}</p>
            ) : null}
            <p
              className={`font-bold tracking-widest saido-brand font-mono ${session.name ? "text-lg mt-0.5" : "text-2xl"}`}
            >
              {session.code}
            </p>
            <p className="text-sm text-slate-500 mt-1">Session control →</p>
          </div>
          <Badge variant={session.isActive ? "active" : "inactive"}>
            {session.isActive ? "Open" : "Ended"}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
