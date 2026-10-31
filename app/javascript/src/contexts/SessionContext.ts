import { createContext } from "react";
import { SessionUser } from "../types/session";

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut"; notice?: string }
  | { status: "signedIn"; user: SessionUser }
  | { status: "error"; message: string };

export type SessionContextValue = {
  session: SessionState;
  isSubmitting: boolean;
  signIn: (emailAddress: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
  expire: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
