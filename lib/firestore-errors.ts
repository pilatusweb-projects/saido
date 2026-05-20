import { FirebaseError } from "firebase/app";

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
  if (error instanceof FirebaseError) {
    return error.message;
  }
  return "Something went wrong loading data.";
}
