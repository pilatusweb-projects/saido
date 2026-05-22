import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  orderBy,
  limit,
  type DocumentReference,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Poll, Response, Session } from "@/types";
import { getResponseDocId } from "./participant";
import {
  hasDuplicateOptions,
  normalizePollOptions,
  duplicateOptionsMessage,
} from "./poll-options";
import { sortPolls } from "./sort-polls";

function sessionsCol() {
  return collection(getDb(), "sessions");
}
function pollsCol() {
  return collection(getDb(), "polls");
}
function responsesCol() {
  return collection(getDb(), "responses");
}

function mapSession(id: string, data: Record<string, unknown>): Session {
  return {
    id,
    code: data.code as string,
    name: typeof data.name === "string" ? data.name : "",
    createdAt: data.createdAt as Session["createdAt"],
    createdBy: data.createdBy as string,
    isActive: data.isActive !== false,
  };
}

function mapPoll(id: string, data: Record<string, unknown>): Poll {
  const createdAt = data.createdAt as Poll["createdAt"];
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
    isActive: data.isActive as boolean,
    sortOrder,
    createdAt,
  };
}

function mapResponse(id: string, data: Record<string, unknown>): Response {
  return {
    id,
    pollId: data.pollId as string,
    sessionCode: data.sessionCode as string,
    answer: data.answer as string,
    participantId: data.participantId as string,
    participantName: data.participantName as string | undefined,
    createdAt: data.createdAt as Response["createdAt"],
  };
}

export async function createSession(
  code: string,
  createdBy: string,
  name = ""
): Promise<string> {
  const ref = await addDoc(sessionsCol(), {
    code: code.toUpperCase(),
    name: name.trim(),
    createdAt: serverTimestamp(),
    createdBy,
    isActive: true,
  });
  return ref.id;
}

export async function updateSessionName(
  sessionId: string,
  name: string
): Promise<void> {
  await updateDoc(doc(getDb(), "sessions", sessionId), {
    name: name.trim(),
  });
}

export async function getSessionById(id: string): Promise<Session | null> {
  const snap = await getDoc(doc(getDb(), "sessions", id));
  if (!snap.exists()) return null;
  return mapSession(snap.id, snap.data());
}

export async function getSessionByCode(code: string): Promise<Session | null> {
  const q = query(
    sessionsCol(),
    where("code", "==", code.toUpperCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapSession(d.id, d.data());
}

export function subscribeToSessionByCode(
  code: string,
  callback: (session: Session | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    sessionsCol(),
    where("code", "==", code.toUpperCase()),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback(mapSession(d.id, d.data()));
    },
    onError
  );
}

export function subscribeToHostSessions(
  uid: string,
  callback: (sessions: Session[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    sessionsCol(),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => mapSession(d.id, d.data())));
    },
    onError
  );
}

export function subscribeToSession(
  id: string,
  callback: (session: Session | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), "sessions", id),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(mapSession(snap.id, snap.data()));
    },
    onError
  );
}

export async function createPoll(
  sessionId: string,
  sessionCode: string,
  question: string,
  options: string[]
): Promise<string> {
  const normalized = normalizePollOptions(options);
  if (normalized.length < 2) throw new Error("Add at least 2 options.");
  if (hasDuplicateOptions(normalized)) throw new Error(duplicateOptionsMessage());

  const ref = await addDoc(pollsCol(), {
    sessionId,
    sessionCode: sessionCode.toUpperCase(),
    question,
    options: normalized,
    isActive: false,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToSessionPolls(
  sessionId: string,
  callback: (polls: Poll[]) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(pollsCol(), where("sessionId", "==", sessionId));
  return onSnapshot(
    q,
    (snap) => {
      callback(sortPolls(snap.docs.map((d) => mapPoll(d.id, d.data()))));
    },
    onError
  );
}

export function subscribeToActivePoll(
  sessionCode: string,
  callback: (poll: Poll | null) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    pollsCol(),
    where("sessionCode", "==", sessionCode.toUpperCase()),
    where("isActive", "==", true),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback(mapPoll(d.id, d.data()));
    },
    onError
  );
}

export async function launchPoll(
  sessionId: string,
  pollId: string
): Promise<void> {
  const pollsQuery = query(pollsCol(), where("sessionId", "==", sessionId));
  const snap = await getDocs(pollsQuery);
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => {
    batch.update(d.ref, { isActive: d.id === pollId });
  });
  await batch.commit();
}

export async function closePoll(pollId: string): Promise<void> {
  await updateDoc(doc(getDb(), "polls", pollId), { isActive: false });
}

/** Ends the session: no new joins; closes any live poll. */
export async function endSession(sessionId: string): Promise<void> {
  const pollsQuery = query(pollsCol(), where("sessionId", "==", sessionId));
  const snap = await getDocs(pollsQuery);
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => {
    if (d.data().isActive) {
      batch.update(d.ref, { isActive: false });
    }
  });
  batch.update(doc(getDb(), "sessions", sessionId), { isActive: false });
  await batch.commit();
}

export async function submitResponse(
  pollId: string,
  sessionCode: string,
  answer: string,
  participantId: string,
  participantName?: string
): Promise<void> {
  const id = getResponseDocId(pollId, participantId);
  await setDoc(doc(getDb(), "responses", id), {
    pollId,
    sessionCode: sessionCode.toUpperCase(),
    answer,
    participantId,
    participantName: participantName || null,
    createdAt: serverTimestamp(),
  });
}

export async function hasVoted(
  pollId: string,
  participantId: string
): Promise<boolean> {
  const id = getResponseDocId(pollId, participantId);
  const snap = await getDoc(doc(getDb(), "responses", id));
  return snap.exists();
}

export function subscribeToPollResponses(
  pollId: string,
  callback: (responses: Response[]) => void
): Unsubscribe {
  const q = query(responsesCol(), where("pollId", "==", pollId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapResponse(d.id, d.data())));
  });
}

export async function getPollsForSession(sessionId: string): Promise<Poll[]> {
  const q = query(pollsCol(), where("sessionId", "==", sessionId));
  const snap = await getDocs(q);
  return sortPolls(snap.docs.map((d) => mapPoll(d.id, d.data())));
}

export async function getResponsesForPoll(pollId: string): Promise<Response[]> {
  const q = query(responsesCol(), where("pollId", "==", pollId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapResponse(d.id, d.data()));
}

export async function isCodeUnique(code: string): Promise<boolean> {
  const q = query(sessionsCol(), where("code", "==", code.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

const BATCH_LIMIT = 500;

async function deleteDocuments(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(getDb());
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function getPollResponseCount(pollId: string): Promise<number> {
  const snap = await getDocs(query(responsesCol(), where("pollId", "==", pollId)));
  return snap.size;
}

export async function updatePoll(
  pollId: string,
  question: string,
  options: string[]
): Promise<void> {
  const pollRef = doc(getDb(), "polls", pollId);
  const snap = await getDoc(pollRef);
  if (!snap.exists()) throw new Error("Poll not found");
  const data = snap.data();
  if (data.isActive) throw new Error("Close the poll before editing.");

  const trimmedOptions = normalizePollOptions(options);
  if (trimmedOptions.length < 2) throw new Error("Add at least 2 options.");
  if (hasDuplicateOptions(trimmedOptions)) throw new Error(duplicateOptionsMessage());

  const responseCount = await getPollResponseCount(pollId);
  const payload: { question: string; options?: string[] } = {
    question: question.trim(),
  };

  if (responseCount === 0) {
    payload.options = trimmedOptions;
  } else if (responseCount > 0) {
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

  await updateDoc(pollRef, payload);
}

async function deletePollResponses(pollId: string): Promise<void> {
  const snap = await getDocs(query(responsesCol(), where("pollId", "==", pollId)));
  const refs = snap.docs.map((d) => d.ref);
  await deleteDocuments(refs);
}

export async function deletePoll(pollId: string): Promise<void> {
  const pollRef = doc(getDb(), "polls", pollId);
  const snap = await getDoc(pollRef);
  if (!snap.exists()) return;
  if (snap.data().isActive) throw new Error("Close the poll before deleting.");

  await deletePollResponses(pollId);
  await deleteDoc(pollRef);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const pollsSnap = await getDocs(
    query(pollsCol(), where("sessionId", "==", sessionId))
  );

  const responseRefs: DocumentReference[] = [];
  for (const pollDoc of pollsSnap.docs) {
    const responsesSnap = await getDocs(
      query(responsesCol(), where("pollId", "==", pollDoc.id))
    );
    responseRefs.push(...responsesSnap.docs.map((d) => d.ref));
  }

  await deleteDocuments(responseRefs);
  await deleteDocuments(pollsSnap.docs.map((d) => d.ref));
  await deleteDoc(doc(getDb(), "sessions", sessionId));
}
