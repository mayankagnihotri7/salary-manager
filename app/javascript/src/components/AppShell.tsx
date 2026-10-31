import { NavLink, Outlet } from "react-router";
import { useSession } from "../hooks/useSession";
import type { SessionUser } from "../types/session";

type Props = {
  user: SessionUser;
};

export const AppShell = ({ user }: Props) => {
  const { signOut, isSubmitting } = useSession();

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900'>
      <header className='border-b border-slate-200 bg-white'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3'>
          <div className='flex items-center gap-6'>
            <h1 className='text-lg font-semibold'>Salary Manager</h1>
            <nav aria-label='Main' className='flex gap-4'>
              <NavLink
                to='/dashboard'
                className={({ isActive }) =>
                  `text-sm ${isActive ? "font-semibold text-slate-900" : "text-slate-600 hover:text-slate-900"}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to='/employees'
                className={({ isActive }) =>
                  `text-sm ${isActive ? "font-semibold text-slate-900" : "text-slate-600 hover:text-slate-900"}`
                }
              >
                Employees
              </NavLink>
            </nav>
          </div>
          <div className='flex items-center gap-4 text-sm'>
            <span>
              {user.email_address}{" "}
              <span className='rounded bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-600'>
                {user.role}
              </span>
            </span>
            <button
              type='button'
              onClick={() => {
                void signOut();
              }}
              disabled={isSubmitting}
              className='rounded border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-60'
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-8'>
        <Outlet />
      </main>
    </div>
  );
};
