import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError } from "../api/client";
import { createSession, destroySession, fetchSession } from "../api/session";
import {
  SessionContext,
  type SessionContextValue,
  type SessionState,
} from "./SessionContext";

type Props = {
  children: ReactNode;
};

const SIGN_OUT_NOTICE =
  "You were signed out on this device, but we couldn't confirm it with the server. " +
  "If you're on a shared computer, close this browser window.";

export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const isMounted = useRef(true);
  // Id of the sign-in/sign-out in flight, or null. Only that operation may release it, so a
  // stale operation can never clear a newer operation's claim.
  const activeSubmission = useRef<number | null>(null);
  const latestOperation = useRef(0);
  const sessionStatus = useRef<SessionState["status"]>("loading");

  const beginOperation = useCallback(() => {
    latestOperation.current += 1;
    return latestOperation.current;
  }, []);

  const isCurrent = useCallback(
    (operationId: number) =>
      isMounted.current && operationId === latestOperation.current,
    [],
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    sessionStatus.current = session.status;
  }, [session.status]);

  useEffect(() => {
    const operationId = beginOperation();
    const controller = new AbortController();

    const load = async () => {
      try {
        const user = await fetchSession(controller.signal);
        if (isCurrent(operationId)) {
          setSession({ status: "signedIn", user });
        }
      } catch (error) {
        if (controller.signal.aborted || !isCurrent(operationId)) return;

        if (error instanceof ApiError && error.status === 401) {
          setSession({ status: "signedOut" });
        } else {
          // Anything else, including 403 (authenticated but not allowed), means the session
          // could not be loaded; it is not a sign-out. ApiError messages are fixed strings.
          setSession({
            status: "error",
            message:
              error instanceof ApiError
                ? error.message
                : "Something went wrong.",
          });
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [attempt, beginOperation, isCurrent]);

  const retry = useCallback(() => {
    beginOperation();
    activeSubmission.current = null;
    setIsSubmitting(false);
    setSession({ status: "loading" });
    setAttempt((current) => current + 1);
  }, [beginOperation]);

  // Failures propagate to the caller (the sign-in form); session state only changes on success.
  const signIn = useCallback(
    async (emailAddress: string, password: string) => {
      if (activeSubmission.current !== null) return;
      const operationId = beginOperation();
      activeSubmission.current = operationId;
      setIsSubmitting(true);

      try {
        const user = await createSession(emailAddress, password);
        if (isCurrent(operationId)) {
          setSession({ status: "signedIn", user });
          toast.success("Signed in successfully.");
        }
      } finally {
        // Only the operation that holds the claim releases it.
        if (activeSubmission.current === operationId) {
          activeSubmission.current = null;
          if (isMounted.current) {
            setIsSubmitting(false);
          }
        }
      }
    },
    [beginOperation, isCurrent],
  );

  // The client ends up signed out even if the DELETE fails, unless a newer operation (such as
  // a retry) has superseded this one; that operation then decides the state.
  const signOut = useCallback(async () => {
    if (activeSubmission.current !== null) return;
    const operationId = beginOperation();
    activeSubmission.current = operationId;
    setIsSubmitting(true);
    let notice: string | undefined;

    try {
      await destroySession();
    } catch (error) {
      // 401 means the session was already gone, which is the outcome we wanted. Any other
      // failure means we can't confirm the server ended the session. Nothing from the error
      // is surfaced; the notice is a fixed string.
      if (!(error instanceof ApiError && error.status === 401)) {
        notice = SIGN_OUT_NOTICE;
      }
    } finally {
      if (activeSubmission.current === operationId) {
        activeSubmission.current = null;
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
      if (isCurrent(operationId)) {
        setSession({ status: "signedOut", notice });
        // Only a confirmed sign-out gets a success toast; otherwise the sign-in screen shows the notice.
        if (!notice) {
          toast.success("Signed out.");
        }
      }
    }
  }, [beginOperation, isCurrent]);

  const expire = useCallback(() => {
    if (
      sessionStatus.current !== "signedIn" ||
      activeSubmission.current !== null
    )
      return;
    sessionStatus.current = "signedOut";
    beginOperation();
    setSession({ status: "signedOut" });
    toast.info("Your session expired. Please sign in again.");
  }, [beginOperation]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isSubmitting, signIn, signOut, retry, expire }),
    [session, isSubmitting, signIn, signOut, retry, expire],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
