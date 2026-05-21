"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { hostJson } from "@/lib/host-api";

export function CreateSessionPanel() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setCreating(true);
    setError("");

    try {
      const { id } = await hostJson<{ id: string; code: string }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      router.push(`/session/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create session.");
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
          onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating} className="shrink-0">
          {creating ? "Creating…" : "Create session"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </Card>
  );
}
