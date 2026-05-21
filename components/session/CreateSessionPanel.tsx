"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSession, isCodeUnique } from "@/lib/firestore";
import { authFetch } from "@/lib/api-client-auth";
import { generateJoinCode } from "@/lib/codes";
import {
  getFirestoreErrorMessage,
  isFirestoreUnavailable,
} from "@/lib/firestore-errors";

interface CreateSessionPanelProps {
  userId: string;
}

async function createSessionViaClient(
  userId: string,
  name: string
): Promise<string> {
  let code = generateJoinCode();
  let attempts = 0;
  while (!(await isCodeUnique(code)) && attempts < 10) {
    code = generateJoinCode();
    attempts++;
  }
  return createSession(code, userId, name);
}

async function createSessionViaApi(
  name: string
): Promise<{ id: string; code: string }> {
  const res = await authFetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const data = (await res.json()) as {
    id?: string;
    code?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Could not create session on the server.");
  }

  if (!data.id) {
    throw new Error("Server did not return a session id.");
  }

  return { id: data.id, code: data.code ?? "" };
}

export function CreateSessionPanel({ userId }: CreateSessionPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setCreating(true);
    setError("");

    try {
      const id = await createSessionViaClient(userId, name);
      router.push(`/session/${id}`);
    } catch (clientErr) {
      if (!isFirestoreUnavailable(clientErr)) {
        setError(getFirestoreErrorMessage(clientErr));
        return;
      }

      try {
        const viaApi = await createSessionViaApi(name);
        router.push(`/session/${viaApi.id}`);
      } catch (apiErr) {
        setError(
          `${getFirestoreErrorMessage(clientErr)} Server fallback: ${getFirestoreErrorMessage(apiErr)}`
        );
      }
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
