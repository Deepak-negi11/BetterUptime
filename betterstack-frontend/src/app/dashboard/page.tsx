'use client';

import { Button } from '@/components/ui/button';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTheme } from '@/lib/use-theme';
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import {
    Plus,
    AlertCircle,
    X,
    CheckCircle2,
    ChevronRight,
    Globe2,
    Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getValidStoredToken } from '@/lib/auth';
import { toast } from 'sonner';

interface Website {
    id: string;
    url: string;
    status: 'up' | 'down' | 'unknown';
    last_check: string | null;
    response_time: number | null;
    region_id: string | null;
}

function prettyHost(url: string) {
    try {
        const u = new URL(url);
        return u.host;
    } catch {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
}

function timeAgo(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 0) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function statusMetaFor(status: Website['status']) {
    if (status === 'unknown') {
        return { label: 'Checking', dot: 'var(--warn)', tone: 'text-[var(--warn)]' };
    }
    if (status === 'up') {
        return { label: 'Up', dot: 'var(--ok)', tone: 'text-[var(--ok)]' };
    }
    return { label: 'Down', dot: 'var(--down)', tone: 'text-[var(--down)]' };
}

export default function DashboardPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileNav, setMobileNav] = useState(false);

    useEffect(() => {
        fetchWebsites();
        const interval = setInterval(() => fetchWebsites(), 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                document.querySelector<HTMLInputElement>('input[name="dashboard-search"]')?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const fetchWebsites = async () => {
        const token = getValidStoredToken();
        if (!token) {
            router.push('/user/signin');
            return;
        }
        try {
            const response = await axios.get(`${BACKEND_URL}/websites`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const websiteData = response.data.websites || [];
            const mapped: Website[] = websiteData.map((w: any) => ({
                id: w.id,
                url: w.url,
                status: w.status || 'unknown',
                last_check: w.last_check || null,
                response_time: w.response_time || null,
                region_id: w.region_id || null,
            }));
            setWebsites(mapped);
        } catch (err: any) {
            console.error('Failed to fetch websites:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                router.push('/user/signin');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWebsite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        setError(null);
        const cleaned = newUrl.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        const fullUrl = `https://${cleaned}`;
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${BACKEND_URL}/website`,
                { url: fullUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewUrl('');
            setShowAddModal(false);
            fetchWebsites();
            toast.success('Site added');
        } catch (err: any) {
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || 'Failed to add site';
            setError(msg);
        } finally {
            setIsAdding(false);
        }
    };

    const counts = useMemo(() => ({ total: websites.length }), [websites]);

    const filtered = useMemo(() => {
        return websites.filter((w) => {
            if (searchQuery && !w.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [websites, searchQuery]);

    return (
        <div className={theme === 'dark' ? 'dark' : ''}>
            <div className="dashboard-shell app-canvas relative min-h-screen font-sans text-[var(--text)]">
                <DashboardSidebar
                    mobileOpen={mobileNav}
                    onMobileOpen={() => setMobileNav(true)}
                    onMobileClose={() => setMobileNav(false)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />

                <main className="relative z-10 lg:ml-[260px]">
                    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 sm:py-10">
                        {/* Header */}
                        <div className="dashboard-heading mb-7 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-[var(--text)]">
                                    Sites
                                </h1>
                                <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                                    {counts.total === 0
                                        ? 'No sites yet'
                                        : `Watching ${counts.total} site${counts.total === 1 ? '' : 's'} in real time`}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative w-[260px] sm:w-[320px]">
                                    <Search className="dashboard-search-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                    <input
                                        name="dashboard-search"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search"
                                        className="dashboard-search h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-9 pr-10 text-[13px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]"
                                    />
                                    <span className="dashboard-search-key pointer-events-none absolute right-2.5 top-1/2 grid h-5 -translate-y-1/2 place-items-center rounded border px-1.5 font-mono text-[10px]">
                                        /
                                    </span>
                                </div>

                                <Button
                                    onClick={() => setShowAddModal(true)}
                                    className="dashboard-create h-10 rounded-xl px-4 text-[13px] font-semibold text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add site
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        {isLoading && websites.length === 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-[148px] animate-pulse rounded-2xl bg-[var(--surface)]" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <EmptyState searching={!!searchQuery} />
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {filtered.map((w) => {
                                    const meta = statusMetaFor(w.status);

                                    return (
                                        <div
                                            key={w.id}
                                            className="dashboard-monitor-card group/card relative overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--line-strong)]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/website/${w.id}`)}
                                                className="absolute inset-0 z-0"
                                                aria-label={`Open ${prettyHost(w.url)}`}
                                            />

                                            {/* Top row: status and endpoint left, response time right */}
                                            <div className="relative z-10 mb-5 flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                                        {(w.status === 'up' || w.status === 'down') && (
                                                            <span
                                                                className="absolute inset-0 animate-ping rounded-full opacity-60"
                                                                style={{ background: meta.dot }}
                                                            />
                                                        )}
                                                        <span
                                                            className="relative h-2.5 w-2.5 rounded-full"
                                                            style={{ background: meta.dot, boxShadow: `0 0 12px ${meta.dot}` }}
                                                        />
                                                    </span>
                                                    <p
                                                        className="dashboard-monitor-name truncate text-[22px] font-semibold text-[var(--text)]"
                                                        title={w.url}
                                                    >
                                                        {prettyHost(w.url)}
                                                    </p>
                                                </div>

                                                <span className="font-mono text-[11px] tabular-nums text-[var(--text-faint)]">
                                                    {w.response_time == null
                                                        ? '—'
                                                        : `${Math.round(w.response_time)}ms`}
                                                </span>
                                            </div>

                                            <div className="relative z-10 ml-[22px] mt-1 flex items-center gap-2 text-[12px]">
                                                <span className={`${meta.tone}`}>{meta.label}</span>
                                                {w.region_id && (
                                                    <>
                                                        <span className="text-[var(--text-faint)]">·</span>
                                                        <span className="font-mono uppercase tracking-wider text-[var(--text-faint)]">
                                                            {w.region_id}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {showAddModal && (
                    <AddMonitorModal
                        url={newUrl}
                        setUrl={setNewUrl}
                        error={error}
                        isAdding={isAdding}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={handleAddWebsite}
                    />
                )}
            </div>
        </div>
    );
}

function EmptyState({ searching }: { searching: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 py-20 text-center">
            <span
                className="mb-5 grid h-14 w-14 place-items-center rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #1d8aff 0%, #0872F0 100%)', boxShadow: '0 8px 22px rgba(8, 114, 240, 0.32)' }}
            >
                <Globe2 className="h-6 w-6" />
            </span>
            <h3 className="text-[16px] font-semibold text-[var(--text)]">
                {searching ? 'Nothing matches your search' : 'No sites yet'}
            </h3>
            <p className="mt-2 max-w-sm text-[13px] text-[var(--text-muted)]">
                {searching
                    ? 'Try clearing the search field.'
                    : 'Add your first site and Argus will start checking it from every region.'}
            </p>
        </div>
    );
}

function AddMonitorModal({
    url,
    setUrl,
    error,
    isAdding,
    onClose,
    onSubmit,
}: {
    url: string;
    setUrl: (s: string) => void;
    error: string | null;
    isAdding: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">New site</p>
                        <h3 className="mt-1 text-[18px] font-semibold text-[var(--text)]">Add a target</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-faint)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--down)]/30 bg-[var(--down-soft)] p-3 text-[13px] text-[var(--down)]">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit}>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        Domain
                    </label>
                    <div className="mb-3 flex items-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand-ring)]">
                        <span className="select-none border-r border-[var(--line-soft)] px-3 py-2.5 font-mono text-[13px] text-[var(--text-faint)]">
                            https://
                        </span>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//i, ''))}
                            placeholder="example.com"
                            className="w-full border-none bg-transparent px-3 py-2.5 text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="mb-6 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--ok)]" />
                        Checked from every active region, around the clock.
                    </div>
                    <div className="flex gap-2.5">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-[var(--line)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isAdding}
                            className="flex-1 font-semibold text-white disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(180deg, #1d8aff 0%, #0872F0 100%)',
                                boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px rgba(8, 114, 240, 0.30)',
                            }}
                        >
                            {isAdding ? 'Adding…' : 'Create endpoint'}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
