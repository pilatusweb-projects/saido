import { Timestamp } from "firebase/firestore";
import type { Poll, Session } from "@/types";

/** Props safe to pass from Server Components to client (Firestore Timestamps stripped). */
export type HostSessionProps = Omit<Session, "createdAt"> & { id: string };
export type HostPollProps = Omit<Poll, "createdAt"> & { id: string };

export function toHostSessionProps(session: Session): HostSessionProps {
  const { createdAt: _c, ...rest } = session;
  return rest;
}

export function toHostPollProps(poll: Poll): HostPollProps {
  const { createdAt: _c, ...rest } = poll;
  return rest;
}

/** Client state uses full Session/Poll once Firestore delivers snapshots. */
export function hostSessionToSession(props: HostSessionProps): Session {
  return { ...props, createdAt: Timestamp.now() };
}

export function hostPollToPoll(props: HostPollProps): Poll {
  return { ...props, createdAt: Timestamp.now() };
}
