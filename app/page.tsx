"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code) router.push(`/join/${code}`);
  }

  return (
    <div className="flex-1">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Engage your audience{" "}
          <span className="text-indigo-600">in real time</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
          Create live polls, share a join code or QR, and watch results update instantly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="w-full sm:w-auto min-w-[200px]">
              Create session
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-md mx-auto px-4 pb-24">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Join a session</h2>
          <form onSubmit={handleJoin} className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. ABCD12)"
              className="font-mono tracking-widest uppercase"
              maxLength={6}
            />
            <Button type="submit">Join</Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
