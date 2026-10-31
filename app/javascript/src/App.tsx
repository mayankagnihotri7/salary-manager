import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { SessionError } from "./components/SessionError";
import { SignInForm } from "./components/SignInForm";
import { SessionProvider } from "./contexts/SessionProvider";
import { useSession } from "./hooks/useSession";
import { AppRoutes } from "./routes/AppRoutes";

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
      return <SignInForm notice={session.notice} />;
    case "signedIn":
      return <AppRoutes user={session.user} />;
  }
};

export const App = () => (
  <>
    <Toaster
      position='bottom-center'
      duration={5000}
      visibleToasts={3}
      closeButton
      richColors
    />
    <BrowserRouter>
      <SessionProvider>
        <SessionGate />
      </SessionProvider>
    </BrowserRouter>
  </>
);
