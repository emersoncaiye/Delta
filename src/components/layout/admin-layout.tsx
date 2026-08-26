'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on login/register pages
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-60 min-h-screen bg-[#fbf9f7]">
        <div className="p-8">
          {children}
        </div>
      </main>
    </>
  );
}
