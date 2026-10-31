type Props = {
  message: string;
  onRetry: () => void;
};

export const ErrorAlert = ({ message, onRetry }: Props) => (
  <div
    role='alert'
    className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'
  >
    <p>{message}</p>
    <button
      type='button'
      onClick={onRetry}
      className='mt-2 rounded border border-red-300 bg-white px-3 py-1 hover:bg-red-100'
    >
      Try again
    </button>
  </div>
);
