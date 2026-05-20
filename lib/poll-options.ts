export function normalizePollOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean);
}

export function hasDuplicateOptions(options: string[]): boolean {
  const normalized = normalizePollOptions(options);
  return new Set(normalized.map((o) => o.toLowerCase())).size !== normalized.length;
}

export function duplicateOptionsMessage(): string {
  return "Each option must be unique.";
}
