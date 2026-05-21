import { FieldValue, getFirestore, type Timestamp } from "firebase-admin/firestore";
import { getAdminApp, getAdminAuth, isAdminConfigured } from "./firebase-admin";
import { generateJoinCode } from "./codes";
import type { Poll, Session } from "@/types";

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
  return {
    id,
    sessionId: data.sessionId as string,
    sessionCode: data.sessionCode as string,
    question: data.question as string,
    options: data.options as string[],
    isActive: Boolean(data.isActive),
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
    .orderBy("createdAt", "desc")
    .get();

  return {
    session: mapAdminSession(sessionSnap.id, sessionData),
    polls: pollsSnap.docs.map((d) => mapAdminPoll(d.id, d.data())),
  };
}
