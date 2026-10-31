import { AppShell } from "./components/AppShell";
import { SessionError } from "./components/SessionError";
import { SignInForm } from "./components/SignInForm";
import { SessionProvider } from "./contexts/SessionProvider";
import { useSession } from "./hooks/useSession";

const SessionGate = () => {
  const { session, retry } = useSession();

  switch (session.status) {
    case "loading":
      return (
        <main
          className='grid min-h-screen place-items-center bg-slate-50'
          aria-busy='true'
        >
          <p role='status' className='text-slate-600'>
            Loading…
          </p>
        </main>
      );
    case "error":
      return <SessionError message={session.message} onRetry={retry} />;
    case "signedOut":
      return <SignInForm />;
    case "signedIn":
      return <AppShell user={session.user} />;
  }
};

export const App = () => (
  <SessionProvider>
    <SessionGate />
  </SessionProvider>
);
