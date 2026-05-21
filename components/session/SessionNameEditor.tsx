"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { hostFetch } from "@/lib/host-api";

interface SessionNameEditorProps {
  sessionId: string;
  initialName: string;
}

export function SessionNameEditor({ sessionId, initialName }: SessionNameEditorProps) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await hostFetch(`/api/session/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Rename failed.");
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <p className="text-lg text-slate-700">
          {name.trim() ? name : <span className="text-slate-400 italic">Unnamed session</span>}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Rename
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-2 max-w-md">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. SDM-Meeting-Juni"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setName(initialName);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
