'use client';

import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';
import type { Theme } from '@/lib/use-theme';
import axios from 'axios';
import {
  AlertTriangle,
  Bell,
  CircleDot,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const navigation = [
  { label: 'Sites', icon: CircleDot, route: '/dashboard', match: ['/dashboard', '/website'] },
  { label: 'Incidents', icon: AlertTriangle, route: null, match: ['/incidents'] },
  { label: 'Alerts', icon: Bell, route: null, match: ['/alerts'] },
  { label: 'Settings', icon: Settings, route: '/settings', match: ['/settings'] },
];

async function getGravatarUrl(email: string): Promise<string> {
  const cleaned = email.trim().toLowerCase();
  const msgBuffer = new TextEncoder().encode(cleaned);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `https://www.gravatar.com/avatar/${hashHex}?d=404`;
}

function BrandMark() {
  const spikeAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
      {/* Light blue scan ring */}
      <circle cx="16" cy="16" r="15" stroke="#7dd3fc" strokeWidth="0.8" strokeOpacity="0.9" />

      {/* Spikes — alternating long/short */}
      {spikeAngles.map((deg, i) => (
        <path
          key={deg}
          d={
            i % 2 === 0
              ? 'M 24 15.5 L 29.5 16 L 24 16.5 Z'
              : 'M 24 15.6 L 27.5 16 L 24 16.4 Z'
          }
          fill="currentColor"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}

      {/* Eye almond */}
      <path
        d="M10 16 Q16 11.5 22 16 Q16 20.5 10 16 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />

      {/* Pupil — slow pulse */}
      <circle cx="16" cy="16" r="2.6" fill="currentColor">
        <animate attributeName="r" values="2.6;1.9;2.6" dur="2.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function DashboardSidebar({
  mobileOpen,
  onMobileOpen,
  onMobileClose,
  theme,
  onToggleTheme,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [useFallbackAvatar, setUseFallbackAvatar] = useState(false);

  useEffect(() => {
    const token = getValidStoredToken();
    if (!token) return;
    axios
      .get(`${BACKEND_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const userEmail = response.data.email;
        setEmail(userEmail);
        setUsername(response.data.username);
        try {
          setAvatarUrl(await getGravatarUrl(userEmail));
        } catch {
          /* ignore */
        }
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

  const initial = (username || email || '?').charAt(0).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={onMobileOpen}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition hover:text-[var(--text)] lg:hidden"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`dashboard-sidebar ${pathname.startsWith('/website') ? 'website-detail-sidebar' : ''} fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-[64px] items-center justify-between border-b border-[var(--line)] px-5">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-left"
          >
            <Logo className="h-8 w-8 text-black dark:text-white shrink-0" />
            <span>
              <span className="dashboard-brand-name block text-[17px] font-bold tracking-tight text-[var(--text)] font-brand">Argus</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-faint)] transition hover:bg-black/[0.04] hover:text-[var(--text)] dark:hover:bg-white/[0.06] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 px-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.match.some((m) => pathname.startsWith(m));
              const disabled = !item.route;

              return (
                <button
                  type="button"
                  key={item.label}
                  disabled={disabled}
                  onClick={() => {
                    if (item.route) router.push(item.route);
                    onMobileClose();
                  }}
                  className={`group/nav relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition ${
                    active
                      ? 'bg-[var(--brand-soft)] text-[var(--brand)] dark:text-[#7eb6ff]'
                      : disabled
                        ? 'text-[var(--text-faint)] cursor-default'
                        : 'text-[var(--text-muted)] hover:bg-black/[0.03] hover:text-[var(--text)] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r"
                      style={{ background: 'var(--brand)' }}
                    />
                  )}
                  <Icon className="h-[15px] w-[15px]" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {disabled && (
                    <span className="rounded-md border border-[var(--line)] bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--text-faint)]">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Account */}
        <div className="mt-auto p-3">
          <div className="dashboard-account flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5">
            {avatarUrl && !useFallbackAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={username || email}
                onError={() => setUseFallbackAvatar(true)}
                className="h-8 w-8 shrink-0 rounded-full border border-[var(--line)] object-cover"
              />
            ) : (
              <span
                className="dashboard-avatar grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
                style={{ background: 'var(--brand)' }}
              >
                {initial}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[var(--text)]">{username || 'Account'}</p>
              <p className="truncate text-[11px] text-[var(--text-faint)]" title={email}>{email}</p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-black/[0.04] hover:text-[var(--text)] dark:hover:bg-white/[0.06]"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--down-soft)] hover:text-[var(--down)]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
