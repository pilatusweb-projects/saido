"use client";

import { useEffect, useState, FormEvent } from "react";
import type { Poll } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updatePoll, getPollResponseCount } from "@/lib/firestore";
import { hasDuplicateOptions, normalizePollOptions, duplicateOptionsMessage } from "@/lib/poll-options";

interface PollEditFormProps {
  poll: Poll;
  onSaved: () => void;
  onCancel: () => void;
}

export function PollEditForm({ poll, onSaved, onCancel }: PollEditFormProps) {
  const [question, setQuestion] = useState(poll.question);
  const [options, setOptions] = useState([...poll.options]);
  const [hasVotes, setHasVotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPollResponseCount(poll.id).then((n) => setHasVotes(n > 0));
  }, [poll.id]);

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
    if (trimmed.length < 2) {
      setError("Add at least 2 options.");
      return;
    }
    if (!hasVotes && hasDuplicateOptions(trimmed)) {
      setError(duplicateOptionsMessage());
      return;
    }
    setError("");
    setLoading(true);
    try {
      await updatePoll(poll.id, question, trimmed);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update poll.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3 pt-3 border-t border-slate-200">
      {hasVotes && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          This poll has votes. You can change the question only; options are locked.
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Options</label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              disabled={hasVotes}
              required
            />
            {!hasVotes && options.length > 2 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(i)}>
                ✕
              </Button>
            )}
          </div>
        ))}
        {!hasVotes && (
          <Button type="button" variant="secondary" size="sm" onClick={addOption}>
            + Add option
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
