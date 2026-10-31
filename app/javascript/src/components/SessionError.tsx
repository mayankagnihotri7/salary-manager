type Props = {
  message: string;
  onRetry: () => void;
};

export const SessionError = ({ message, onRetry }: Props) => (
  <main className='grid min-h-screen place-items-center bg-slate-50 px-4'>
    <div
      role='alert'
      className='w-full max-w-sm rounded-lg bg-white p-6 shadow'
    >
      <h1 className='text-lg font-semibold text-slate-900'>
        We couldn&apos;t load your session
      </h1>
      <p className='mt-2 text-sm text-slate-600'>{message}</p>
      <button
        type='button'
        onClick={onRetry}
        className='mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white'
      >
        Try again
      </button>
    </div>
  </main>
);
