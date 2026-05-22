/** Participant live state from GET /api/join/[code]/live (server fallback). */
export type JoinLivePoll = {
  id: string;
  sessionId: string;
  sessionCode: string;
  question: string;
  options: string[];
  isActive: boolean;
  sortOrder?: number;
};

export type JoinLiveSession = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type JoinLiveChart = {
  labels: string[];
  values: number[];
  totalVotes: number;
};

export type JoinLivePayload = {
  session: JoinLiveSession;
  activePoll: JoinLivePoll | null;
  chart: JoinLiveChart | null;
};
