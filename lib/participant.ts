const PREFIX = "saido_participant_";

export function getParticipantId(sessionCode: string): string {
  if (typeof window === "undefined") return "";
  const key = `${PREFIX}${sessionCode.toUpperCase()}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function getResponseDocId(pollId: string, participantId: string): string {
  return `${pollId}_${participantId}`;
}
