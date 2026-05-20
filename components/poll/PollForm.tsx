"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createPoll } from "@/lib/firestore";
import { hasDuplicateOptions, normalizePollOptions, duplicateOptionsMessage } from "@/lib/poll-options";

interface PollFormProps {
  sessionId: string;
  sessionCode: string;
  onCreated?: () => void;
}

export function PollForm({ sessionId, sessionCode, onCreated }: PollFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = normalizePollOptions(options);
    if (!question.trim()) {
      setError("Enter a question.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Add at least 2 options.");
      return;
    }
    if (hasDuplicateOptions(trimmed)) {
      setError(duplicateOptionsMessage());
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createPoll(sessionId, sessionCode, question.trim(), trimmed);
      setQuestion("");
      setOptions(["", ""]);
      onCreated?.();
    } catch {
      setError("Failed to create poll.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should we discuss next?"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Options</label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
            />
            {options.length > 2 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(i)}>
                ✕
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addOption}>
          + Add option
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create poll"}
      </Button>
    </form>
  );
}
