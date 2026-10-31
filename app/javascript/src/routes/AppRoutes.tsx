import { Link, Navigate, Route, Routes } from "react-router";
import { AppShell } from "../components/AppShell";
import type { SessionUser } from "../types/session";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { EmployeeDetailPage } from "../pages/EmployeeDetailPage";
import { EmployeePage } from "../pages/EmployeePage";

const NotFound = () => (
  <section className='py-10 text-center'>
    <h2 className='text-xl font-semibold text-slate-900'>Page not found</h2>
    <p className='mt-2 text-slate-600'>The page you asked for doesn't exist.</p>
    <Link
      to='/employees'
      className='mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white'
    >
      Back to employees
    </Link>
  </section>
);

type Props = {
  user: SessionUser;
};

export const AppRoutes = ({ user }: Props) => (
  <Routes>
    <Route element={<AppShell user={user} />}>
      <Route index element={<Navigate to='/employees' replace />} />
      <Route path='dashboard' element={<DashboardPage />} />
      <Route path='analytics' element={<AnalyticsPage />} />
      <Route path='employees' element={<EmployeePage />} />
      <Route
        path='employees/:id'
        element={<EmployeeDetailPage user={user} />}
      />
      <Route path='*' element={<NotFound />} />
    </Route>
  </Routes>
);
