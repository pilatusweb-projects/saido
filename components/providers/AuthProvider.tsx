"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import {
  establishServerSession,
  hasServerSession,
} from "@/lib/auth-session-client";

interface AuthContextValue {
  user: User | null;
  /** httpOnly session cookie valid (required for /dashboard, /session) */
  serverSession: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  serverSession: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [serverSession, setServerSession] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncServerSession = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setServerSession(false);
      setLoading(false);
      return;
    }

    if (await hasServerSession()) {
      setServerSession(true);
      setLoading(false);
      return;
    }

    try {
      await establishServerSession();
      setServerSession(true);
    } catch {
      setServerSession(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), (u) => {
      setUser(u);
      setLoading(true);
      void syncServerSession(u);
    });
    return unsub;
  }, [syncServerSession]);

  return (
    <AuthContext.Provider value={{ user, serverSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
