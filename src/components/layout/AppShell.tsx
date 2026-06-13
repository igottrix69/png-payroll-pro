import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

/** Standard page content wrapper (under the TopBar). */
export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade mx-auto max-w-[1400px] px-6 py-6">{children}</div>;
}
