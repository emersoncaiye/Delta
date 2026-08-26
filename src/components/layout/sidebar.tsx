'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const adminNavigation = [
  { name: '仪表盘', href: '/admin', icon: 'grid' },
  { name: '库存管理', href: '/admin/items', icon: 'archive' },
  { name: '订单管理', href: '/admin/orders', icon: 'receipt' },
  { name: '闲置提交', href: '/admin/submissions', icon: 'inbox' },
  { name: '公益金', href: '/admin/charity', icon: 'heart' },
  { name: '回流计算器', href: '/admin/return-calculator', icon: 'calculator' },
  { name: '用户', href: '/admin/users', icon: 'users' },
  { name: '持有记录', href: '/admin/hold-records', icon: 'clock' },
];

const userNavigation = [
  { name: '我的收藏', href: '/my-favorites', icon: 'bookmark' },
];

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    archive: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="5" rx="0" /><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
        <path d="M10 12h4" />
      </svg>
    ),
    receipt: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
        <path d="M8 10h8M8 14h4" />
      </svg>
    ),
    inbox: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-6l-2 3H10l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      </svg>
    ),
    heart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    calculator: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="0" /><path d="M8 6h8M8 10h2M14 10h2M8 14h2M14 14h2M8 18h2M14 18h2" />
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    clock: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    bookmark: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Show user navigation for logged-in users
  const navigation = user ? [...userNavigation, ...adminNavigation] : adminNavigation;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#050d06] flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 pb-4">
        <Link href="/" className="block">
          <div className="font-serif text-[#d4cfc4] text-lg tracking-wide">
            THAT
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#5c7a64] mt-0.5">
            PROGRAM / ADMIN
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-[#1a2a1f]" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-[2px] text-[13px]
                transition-all duration-200
                ${isActive 
                  ? 'text-[#5c7a64] bg-[rgba(92,122,100,0.08)] border-l-2 border-[#5c7a64]' 
                  : 'text-[rgba(212,207,196,0.5)] hover:text-[#d4cfc4] hover:bg-[rgba(255,255,255,0.03)] border-l-2 border-transparent'
                }
              `}
            >
              <NavIcon name={item.icon} />
              <span className="font-sans">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 pt-4">
        <div className="h-px bg-[#1a2a1f] mb-4" />
        
        {/* User Info & Sign Out */}
        {user ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[2px] bg-[#5c7a64] flex items-center justify-center">
                <span className="font-mono text-[11px] text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-[#d4cfc4] truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-1.5 text-[12px] text-[rgba(212,207,196,0.4)] hover:text-[#d4cfc4] transition-colors rounded-[2px] hover:bg-[rgba(255,255,255,0.03)]"
            >
              退出登录
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="block text-center px-3 py-2 text-[12px] text-[#5c7a64] hover:text-[#d4cfc4] transition-colors rounded-[2px] border border-[#1a2a1f] hover:border-[#5c7a64] mb-4"
          >
            登录
          </Link>
        )}

        <div className="brand-signature">
          <span className="font-serif italic text-[12px] leading-relaxed block">
            &ldquo;漂亮的东西<br />应该流动&rdquo;
          </span>
          <div className="font-mono text-[9px] tracking-[0.15em] text-[rgba(212,207,196,0.2)] mt-2">
            TASTE / HOLD / TRANSFER
          </div>
        </div>
      </div>
    </aside>
  );
}
