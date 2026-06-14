'use client';

import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';
import type { Theme } from '@/lib/use-theme';
import axios from 'axios';
import { Bell, LogOut, Moon, Search, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/logo';

interface TopNavProps {
    theme: Theme;
    onToggleTheme: () => void;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

async function getGravatarUrl(email: string): Promise<string> {
    const cleaned = email.trim().toLowerCase();
    const msgBuffer = new TextEncoder().encode(cleaned);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `https://www.gravatar.com/avatar/${hashHex}?d=404`;
}

function BrandMark() {
    return (
        <Logo className="h-7 w-7 text-black dark:text-white" />
    );
}

export function TopNav({ theme, onToggleTheme, showSearch = false, searchValue = '', onSearchChange }: TopNavProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [useFallbackAvatar, setUseFallbackAvatar] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.replace('/');
    };

    const initial = (username || email || '?').charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080810]/85">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                {/* Brand */}
                <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-1.5"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.04]">
                        <BrandMark />
                    </span>
                    <span className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white font-brand">
                        Argus
                    </span>
                </button>

                {/* Right cluster */}
                <div className="flex items-center gap-2.5">
                    {showSearch && (
                        <div className="relative hidden w-64 sm:block">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/35" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder="Search monitors"
                                className="h-10 w-full rounded-full border border-black/[0.08] bg-black/[0.03] pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#7201ea]/50 focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-[#8b6cff]/60 dark:focus:bg-white/[0.06]"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onToggleTheme}
                        aria-label="Toggle theme"
                        className="grid h-10 w-10 place-items-center rounded-full border border-black/[0.08] bg-black/[0.03] text-gray-600 transition hover:bg-black/[0.06] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
                    >
                        {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                    </button>

                    <button
                        type="button"
                        aria-label="Notifications"
                        className="grid h-10 w-10 place-items-center rounded-full border border-black/[0.08] bg-black/[0.03] text-gray-600 transition hover:bg-black/[0.06] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
                    >
                        <Bell className="h-4.5 w-4.5" />
                    </button>

                    {/* Account */}
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((o) => !o)}
                            aria-label="Account menu"
                            className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-black/[0.08] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.04]"
                        >
                            {avatarUrl && !useFallbackAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarUrl}
                                    alt={username || email}
                                    onError={() => setUseFallbackAvatar(true)}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-semibold text-[#7201ea] dark:text-[#c7a4ff]">{initial}</span>
                            )}
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0e0f17] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
                                    {username && (
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{username}</p>
                                    )}
                                    <p className="truncate text-xs text-gray-500 dark:text-white/45" title={email}>
                                        {email || 'Loading account…'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-500/[0.06] dark:text-red-400"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
