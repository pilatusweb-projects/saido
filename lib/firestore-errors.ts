import { FirebaseError } from "firebase/app";

export function isFirestoreUnavailable(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === "unavailable" || error.code === "failed-precondition";
  }
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("unavailable") ||
    msg.includes("Could not reach Cloud Firestore") ||
    msg.includes("offline mode")
  );
}

export function isIndexBuildingError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === "failed-precondition" &&
    error.message.includes("index")
  );
}

export function getFirestoreErrorMessage(error: unknown): string {
  if (isIndexBuildingError(error)) {
    return "Firestore indexes are still building. Wait a few minutes, then refresh this page.";
  }
  if (error instanceof Error && error.message) {
    if (error.message.includes("permission-denied") || error.message.includes("PERMISSION_DENIED")) {
      return "Permission denied writing to Firestore. Deploy firestore.rules (npm run deploy:firestore) and ensure you are signed in.";
    }
    return error.message;
  }
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "Permission denied writing to Firestore. Deploy firestore.rules (npm run deploy:firestore) and ensure you are signed in.";
    }
    return error.message;
  }
  return "Something went wrong loading data.";
}
