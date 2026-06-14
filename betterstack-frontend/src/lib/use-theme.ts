'use client';

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

/**
 * Lightweight theme hook scoped to the app shell.
 * The returned `theme` is meant to be applied as a `dark` class on a wrapper
 * element (e.g. <div className={theme === 'dark' ? 'dark' : ''}>), so the
 * landing/auth pages are never affected. Defaults to dark, persisted locally.
 */
export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') {
                setTheme(saved);
            }
        } catch {
            /* ignore */
        }
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem('theme', next);
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    return { theme, toggleTheme };
}
