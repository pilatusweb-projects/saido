"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSession, isCodeUnique } from "@/lib/firestore";
import { generateJoinCode } from "@/lib/codes";

interface CreateSessionPanelProps {
  userId: string;
}

export function CreateSessionPanel({ userId }: CreateSessionPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      let code = generateJoinCode();
      let attempts = 0;
      while (!(await isCodeUnique(code)) && attempts < 10) {
        code = generateJoinCode();
        attempts++;
      }
      const id = await createSession(code, userId, name);
      router.push(`/session/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="mb-8">
      <CardTitle>New session</CardTitle>
      <p className="text-sm text-slate-500 mt-1 mb-4">
        Give your session a name (e.g. SDM-Meeting-Juni). A join code is generated automatically.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Session name (optional)"
          className="flex-1"
        />
        <Button onClick={handleCreate} disabled={creating} className="shrink-0">
          {creating ? "Creating…" : "Create session"}
        </Button>
      </div>
    </Card>
  );
}
