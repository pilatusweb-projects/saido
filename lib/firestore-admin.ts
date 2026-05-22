import {
  FieldValue,
  getFirestore,
  type Timestamp,
  type DocumentReference,
} from "firebase-admin/firestore";
import { getAdminApp, isAdminConfigured } from "./firebase-admin";
import { generateJoinCode } from "./codes";
import {
  duplicateOptionsMessage,
  hasDuplicateOptions,
  normalizePollOptions,
} from "./poll-options";
import type { Poll, Response, Session } from "@/types";
import { buildPollChartData } from "./poll-chart";
import type { JoinLivePayload } from "./join-live-types";
import { sortPolls } from "./sort-polls";

export { isAdminConfigured };

export interface PublicSessionInfo {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

function getAdminDb() {
  const app = getAdminApp();
  if (!app) {
    throw new Error("Firebase Admin SDK is not configured.");
  }
  return getFirestore(app);
}

function mapAdminSession(id: string, data: Record<string, unknown>): Session {
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id,
    code: data.code as string,
    name: typeof data.name === "string" ? data.name : "",
    createdAt: createdAt as Session["createdAt"],
    createdBy: data.createdBy as string,
    isActive: data.isActive !== false,
  };
}

function mapAdminPoll(id: string, data: Record<string, unknown>): Poll {
  const createdAt = data.createdAt as Timestamp | undefined;
  const sortOrder =
    typeof data.sortOrder === "number"
      ? data.sortOrder
      : createdAt?.toMillis?.() ?? undefined;
  return {
    id,
    sessionId: data.sessionId as string,
    sessionCode: data.sessionCode as string,
    question: data.question as string,
    options: data.options as string[],
    isActive: Boolean(data.isActive),
    sortOrder,
    createdAt: createdAt as Poll["createdAt"],
  };
}

export async function getSessionByCodeAdmin(
  code: string
): Promise<PublicSessionInfo | null> {
  const snap = await getAdminDb()
    .collection("sessions")
    .where("code", "==", code.toUpperCase().trim())
    .limit(1)
    .get();

  if (snap.empty) return null;

  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    code: data.code as string,
    name: typeof data.name === "string" ? data.name : "",
    isActive: data.isActive !== false,
  };
}

export async function getSessionJoinInfoByIdAdmin(
  sessionId: string
): Promise<PublicSessionInfo | null> {
  const snap = await getAdminDb().collection("sessions").doc(sessionId).get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    id: snap.id,
    code: data.code as string,
    name: typeof data.name === "string" ? data.name : "",
    isActive: data.isActive !== false,
  };
}

export async function isCodeUniqueAdmin(code: string): Promise<boolean> {
  const snap = await getAdminDb()
    .collection("sessions")
    .where("code", "==", code.toUpperCase().trim())
    .limit(1)
    .get();
  return snap.empty;
}

/** Creates a session in Firestore using the Admin SDK (bypasses client security rules). */
export async function createSessionAdmin(
  createdBy: string,
  name = ""
): Promise<{ id: string; code: string }> {
  let code = generateJoinCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await isCodeUniqueAdmin(code)) break;
    code = generateJoinCode();
  }

  const ref = await getAdminDb().collection("sessions").add({
    code: code.toUpperCase(),
    name: name.trim(),
    createdAt: FieldValue.serverTimestamp(),
    createdBy,
    isActive: true,
  });

  return { id: ref.id, code: code.toUpperCase() };
}

export async function listHostSessionsAdmin(ownerUid: string): Promise<Session[]> {
  const snap = await getAdminDb()
    .collection("sessions")
    .where("createdBy", "==", ownerUid)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => mapAdminSession(d.id, d.data()));
}

export async function getSessionHostAdmin(
  sessionId: string,
  ownerUid: string
): Promise<{ session: Session; polls: Poll[] } | null> {
  const sessionSnap = await getAdminDb().collection("sessions").doc(sessionId).get();
  if (!sessionSnap.exists) return null;

  const sessionData = sessionSnap.data()!;
  if (sessionData.createdBy !== ownerUid) return null;

  const pollsSnap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();

  return {
    session: mapAdminSession(sessionSnap.id, sessionData),
    polls: sortPolls(pollsSnap.docs.map((d) => mapAdminPoll(d.id, d.data()))),
  };
}

async function assertSessionOwner(
  sessionId: string,
  ownerUid: string
): Promise<Session> {
  const snap = await getAdminDb().collection("sessions").doc(sessionId).get();
  if (!snap.exists) throw new Error("Session not found.");
  const session = mapAdminSession(snap.id, snap.data()!);
  if (session.createdBy !== ownerUid) throw new Error("Forbidden.");
  return session;
}

export async function updateSessionNameAdmin(
  sessionId: string,
  ownerUid: string,
  name: string
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  await getAdminDb()
    .collection("sessions")
    .doc(sessionId)
    .update({ name: name.trim() });
}

export async function createPollAdmin(
  sessionId: string,
  ownerUid: string,
  question: string,
  options: string[]
): Promise<string> {
  const session = await assertSessionOwner(sessionId, ownerUid);
  const normalized = normalizePollOptions(options);
  if (normalized.length < 2) throw new Error("Add at least 2 options.");
  if (hasDuplicateOptions(normalized)) throw new Error(duplicateOptionsMessage());

  const existing = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();
  let maxOrder = 0;
  existing.docs.forEach((d) => {
    const o = d.data().sortOrder;
    if (typeof o === "number" && o > maxOrder) maxOrder = o;
  });

  const ref = await getAdminDb().collection("polls").add({
    sessionId,
    sessionCode: session.code.toUpperCase(),
    question: question.trim(),
    options: normalized,
    isActive: false,
    sortOrder: maxOrder + 1000,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function reorderPollsAdmin(
  sessionId: string,
  ownerUid: string,
  pollIds: string[]
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const snap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();

  if (pollIds.length !== snap.size) {
    throw new Error("Invalid poll order.");
  }

  const sessionPollIds = new Set(snap.docs.map((d) => d.id));
  if (!pollIds.every((id) => sessionPollIds.has(id))) {
    throw new Error("Invalid poll order.");
  }

  const batch = getAdminDb().batch();
  pollIds.forEach((id, index) => {
    batch.update(getAdminDb().collection("polls").doc(id), { sortOrder: index });
  });
  await batch.commit();
}

export async function launchPollAdmin(
  sessionId: string,
  ownerUid: string,
  pollId: string
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const pollsSnap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();
  const batch = getAdminDb().batch();
  pollsSnap.docs.forEach((d) => {
    batch.update(d.ref, { isActive: d.id === pollId });
  });
  await batch.commit();
}

export async function closePollAdmin(
  sessionId: string,
  ownerUid: string,
  pollId: string
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  await getAdminDb().collection("polls").doc(pollId).update({ isActive: false });
}

export async function getPollResponseCountAdmin(pollId: string): Promise<number> {
  const snap = await getAdminDb()
    .collection("responses")
    .where("pollId", "==", pollId)
    .get();
  return snap.size;
}

export async function updatePollAdmin(
  sessionId: string,
  ownerUid: string,
  pollId: string,
  question: string,
  options: string[]
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const pollRef = getAdminDb().collection("polls").doc(pollId);
  const snap = await pollRef.get();
  if (!snap.exists) throw new Error("Poll not found.");
  const data = snap.data()!;
  if (data.isActive) throw new Error("Close the poll before editing.");

  const trimmedOptions = normalizePollOptions(options);
  if (trimmedOptions.length < 2) throw new Error("Add at least 2 options.");
  if (hasDuplicateOptions(trimmedOptions)) throw new Error(duplicateOptionsMessage());

  const responseCount = await getPollResponseCountAdmin(pollId);
  const payload: { question: string; options?: string[] } = {
    question: question.trim(),
  };

  if (responseCount === 0) {
    payload.options = trimmedOptions;
  } else {
    const existing = (data.options as string[]) ?? [];
    const optionsChanged =
      trimmedOptions.length !== existing.length ||
      trimmedOptions.some((o, i) => o !== existing[i]);
    if (optionsChanged) {
      throw new Error(
        "This poll already has votes. You can edit the question only, not the options."
      );
    }
  }

  await pollRef.update(payload);
}

const BATCH_LIMIT = 500;

async function deleteDocumentsAdmin(refs: DocumentReference[]): Promise<void> {
  const db = getAdminDb();
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function deletePollAdmin(
  sessionId: string,
  ownerUid: string,
  pollId: string
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const pollRef = getAdminDb().collection("polls").doc(pollId);
  const snap = await pollRef.get();
  if (!snap.exists) return;
  if (snap.data()!.isActive) throw new Error("Close the poll before deleting.");

  const responsesSnap = await getAdminDb()
    .collection("responses")
    .where("pollId", "==", pollId)
    .get();
  await deleteDocumentsAdmin(responsesSnap.docs.map((d) => d.ref));
  await pollRef.delete();
}

export async function endSessionAdmin(sessionId: string, ownerUid: string): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const pollsSnap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();
  const batch = getAdminDb().batch();
  pollsSnap.docs.forEach((d) => {
    if (d.data().isActive) batch.update(d.ref, { isActive: false });
  });
  batch.update(getAdminDb().collection("sessions").doc(sessionId), { isActive: false });
  await batch.commit();
}

export async function deleteSessionAdmin(
  sessionId: string,
  ownerUid: string
): Promise<void> {
  await assertSessionOwner(sessionId, ownerUid);
  const pollsSnap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();

  const responseRefs: DocumentReference[] = [];
  for (const pollDoc of pollsSnap.docs) {
    const responsesSnap = await getAdminDb()
      .collection("responses")
      .where("pollId", "==", pollDoc.id)
      .get();
    responseRefs.push(...responsesSnap.docs.map((d) => d.ref));
  }

  await deleteDocumentsAdmin(responseRefs);
  await deleteDocumentsAdmin(pollsSnap.docs.map((d) => d.ref));
  await getAdminDb().collection("sessions").doc(sessionId).delete();
}

function mapAdminResponse(id: string, data: Record<string, unknown>): Response {
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id,
    pollId: data.pollId as string,
    sessionCode: data.sessionCode as string,
    answer: data.answer as string,
    participantId: data.participantId as string,
    participantName: data.participantName as string | undefined,
    createdAt: createdAt as Response["createdAt"],
  };
}

export async function getPollsForSessionAdmin(sessionId: string): Promise<Poll[]> {
  const snap = await getAdminDb()
    .collection("polls")
    .where("sessionId", "==", sessionId)
    .get();
  return sortPolls(snap.docs.map((d) => mapAdminPoll(d.id, d.data())));
}

/** Live state for participants when Firestore listeners are unavailable. */
export async function getJoinLiveAdmin(code: string): Promise<JoinLivePayload | null> {
  const session = await getSessionByCodeAdmin(code);
  if (!session) return null;

  const polls = await getPollsForSessionAdmin(session.id);
  const activePoll = polls.find((p) => p.isActive) ?? null;

  let chart = null;
  if (activePoll) {
    const responses = await getResponsesForPollAdmin(activePoll.id);
    chart = buildPollChartData(activePoll.options, responses);
  }

  return {
    session,
    activePoll: activePoll
      ? {
          id: activePoll.id,
          sessionId: activePoll.sessionId,
          sessionCode: activePoll.sessionCode,
          question: activePoll.question,
          options: activePoll.options,
          isActive: activePoll.isActive,
          sortOrder: activePoll.sortOrder,
        }
      : null,
    chart,
  };
}

export async function getResponsesForPollAdmin(pollId: string): Promise<Response[]> {
  const snap = await getAdminDb()
    .collection("responses")
    .where("pollId", "==", pollId)
    .get();
  return snap.docs.map((d) => mapAdminResponse(d.id, d.data()));
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildSessionCsvAdmin(sessionId: string): Promise<string> {
  const polls = await getPollsForSessionAdmin(sessionId);
  const lines: string[] = [];

  lines.push("Poll Question,Option,Vote Count");
  for (const poll of polls) {
    const responses = await getResponsesForPollAdmin(poll.id);
    const counts: Record<string, number> = {};
    poll.options.forEach((opt) => {
      counts[opt] = 0;
    });
    responses.forEach((r) => {
      if (counts[r.answer] !== undefined) counts[r.answer]++;
    });
    for (const opt of poll.options) {
      lines.push(
        [escapeCsv(poll.question), escapeCsv(opt), String(counts[opt] ?? 0)].join(",")
      );
    }
    lines.push("");
  }

  lines.push("--- Raw Responses ---");
  lines.push("Poll Question,Participant Name,Answer");
  for (const poll of polls) {
    const responses = await getResponsesForPollAdmin(poll.id);
    for (const r of responses) {
      lines.push(
        [
          escapeCsv(poll.question),
          escapeCsv(r.participantName ?? "Anonymous"),
          escapeCsv(r.answer),
        ].join(",")
      );
    }
  }

  return lines.join("\n");
}
