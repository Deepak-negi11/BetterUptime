'use client';

import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';
import axios from 'axios';
import {
  Activity,
  LogOut,
  Menu,
  Monitor,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
}

const navigation = [
  { label: 'Monitors', icon: Monitor, route: '/dashboard' },
  { label: 'Alert Incidents', icon: TriangleAlert },
];

export function DashboardSidebar({
  mobileOpen,
  onMobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const router = useRouter();
  const [email, setEmail] = useState('Loading account...');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = getValidStoredToken();
    if (!token) return;

    axios
      .get(`${BACKEND_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setEmail(response.data.email);
        setUsername(response.data.username);
      })
      .catch(() => {
        setEmail('Signed-in account');
        setUsername('');
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/');
  };

  return (
    <>
      <button
        type="button"
        onClick={onMobileOpen}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-[#0B0D15] text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/[0.08] bg-[#0B0D15] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6871E1] text-white shadow-lg shadow-[#6871E1]/20">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight text-white">Better Stack</span>
              <span className="block text-[11px] text-white/35">Uptime workspace</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.label === 'Monitors';

              return (
                <button
                  type="button"
                  key={item.label}
                  disabled={!item.route}
                  onClick={() => {
                    if (item.route) {
                      router.push(item.route);
                    }
                    onMobileClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? 'bg-[#6871E1]/20 text-[#aeb4ff] shadow-[inset_0_0_0_1px_rgba(104,113,225,0.2)]'
                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/45'
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-2 border-t border-white/[0.07] p-3">
          <div className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#7C3AED] text-2xl font-medium uppercase text-white">
              {(username || email).charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              {username && (
                <span className="block truncate text-base font-medium text-white">{username}</span>
              )}
              <span className="block truncate text-sm text-white/55" title={email}>{email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-base font-medium text-red-500/90 transition hover:bg-red-500/[0.05] hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
