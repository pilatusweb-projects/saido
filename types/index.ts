import { Timestamp } from "firebase/firestore";

export interface Session {
  id: string;
  code: string;
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}

export interface Poll {
  id: string;
  sessionId: string;
  sessionCode: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Response {
  id: string;
  pollId: string;
  sessionCode: string;
  answer: string;
  participantId: string;
  participantName?: string;
  createdAt: Timestamp;
}

export type SessionDoc = Omit<Session, "id">;
export type PollDoc = Omit<Poll, "id">;
export type ResponseDoc = Omit<Response, "id">;
