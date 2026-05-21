import { getFirestore } from "firebase-admin/firestore";
import { getAdminAuth, isAdminConfigured } from "./firebase-admin";

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
