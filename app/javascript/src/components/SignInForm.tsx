import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { useSession } from "../hooks/useSession";

type Props = {
  notice?: string;
};

// Only fixed strings are shown. Network failures, timeouts and unexpected server errors all
// get the generic message; server-provided text is never displayed.
const signInErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Invalid email address or password.";
      case 422:
        return "We couldn't verify this request. Reload the page and try again.";
      case 429:
        return "Too many attempts. Please wait a few minutes and try again.";
    }
  }

  return "We couldn't sign you in right now. Please try again in a moment.";
};

export const SignInForm = ({ notice }: Props) => {
  const { signIn, isSubmitting } = useSession();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await signIn(emailAddress, password);
      setPassword("");
    } catch (error) {
      setErrorMessage(signInErrorMessage(error));
    }
  };

  const errorProps = errorMessage
    ? { "aria-invalid": true, "aria-describedby": "sign-in-error" }
    : {};

  return (
    <main className='grid min-h-screen place-items-center bg-slate-50 px-4'>
      <div className='w-full max-w-sm'>
        {notice && (
          <p
            role='status'
            className='mb-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800'
          >
            {notice}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className='rounded-lg bg-white p-6 shadow'
          aria-labelledby='sign-in-heading'
        >
          <h1
            id='sign-in-heading'
            className='text-xl font-semibold text-slate-900'
          >
            Sign in to Salary Manager
          </h1>

          <div className='mt-6'>
            <label
              htmlFor='email_address'
              className='block text-sm font-medium text-slate-700'
            >
              Email address
            </label>
            <input
              id='email_address'
              name='email_address'
              type='email'
              autoComplete='username'
              required
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              className='mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm'
              {...errorProps}
            />
          </div>

          <div className='mt-4'>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-slate-700'
            >
              Password
            </label>
            <input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm'
              {...errorProps}
            />
          </div>

          {errorMessage && (
            <p
              id='sign-in-error'
              role='alert'
              className='mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700'
            >
              {errorMessage}
            </p>
          )}

          <button
            type='submit'
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className='mt-6 w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60'
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
};
