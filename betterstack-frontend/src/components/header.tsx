'use client';

import { Button } from '@/components/ui/button';
import { Activity, ArrowUpRight, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn: isLoggedInOverride }: HeaderProps) {
  const [hasSession, setHasSession] = useState(isLoggedInOverride ?? false);
  const router = useRouter();

  useEffect(() => {
    const syncSession = () => {
      setHasSession(isLoggedInOverride ?? Boolean(localStorage.getItem('token')));
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [isLoggedInOverride]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setHasSession(false);
    router.push('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="liquid-glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-3 sm:h-16 sm:px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span className="absolute inset-0 bg-gradient-to-br from-cyan-300/20 via-transparent to-violet-400/30" />
            <Activity className="relative h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-base">
            UpSignal
          </span>
        </Link>

        <div className="hidden items-center gap-2 text-xs text-white/55 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Self-hosted monitoring
        </div>

        <div className="flex items-center gap-1.5">
          {hasSession ? (
            <>
              <Button asChild variant="ghost" className="h-9 rounded-xl px-3 text-white/75 hover:bg-white/10 hover:text-white">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                aria-label="Log out"
                className="h-9 w-9 rounded-xl p-0 text-white/55 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="h-9 rounded-xl px-3 text-white/70 hover:bg-white/10 hover:text-white">
                <Link href="/user/signin">Sign in</Link>
              </Button>
              <Button asChild className="glass-button h-9 rounded-xl px-3.5 text-sm font-medium text-white">
                <Link href="/user/signup">
                  Start free
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
