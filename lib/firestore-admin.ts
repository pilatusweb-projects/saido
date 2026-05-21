import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminAuth, isAdminConfigured } from "./firebase-admin";
import { generateJoinCode } from "./codes";

export { isAdminConfigured };

export interface PublicSessionInfo {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

function getAdminDb() {
  getAdminAuth(); // ensures app is initialised; throws if not configured
  return getFirestore();
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
