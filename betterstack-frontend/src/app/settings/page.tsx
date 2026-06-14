'use client';

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    AtSign,
    Check,
    Key,
    LogOut,
    Mail,
    Moon,
    Pencil,
    ShieldAlert,
    Sun,
    Trash2,
    User,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTheme } from '@/lib/use-theme';
import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';

async function getGravatarUrl(email: string): Promise<string> {
    const cleaned = email.trim().toLowerCase();
    const msgBuffer = new TextEncoder().encode(cleaned);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `https://www.gravatar.com/avatar/${hashHex}?d=404`;
}

export default function SettingsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [mobileNav, setMobileNav] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarBroken, setAvatarBroken] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const [editingName, setEditingName] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [editingEmail, setEditingEmail] = useState(false);
    const [draftEmail, setDraftEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const emailInputRef = useRef<HTMLInputElement>(null);

    const [sendingReset, setSendingReset] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const token = getValidStoredToken();
        if (!token) {
            router.push('/user/signin');
            return;
        }
        axios
            .get(`${BACKEND_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (res) => {
                setUsername(res.data.username || '');
                setEmail(res.data.email || '');
                setDraftName(res.data.username || '');
                setDraftEmail(res.data.email || '');
                try {
                    if (res.data.email) setAvatarUrl(await getGravatarUrl(res.data.email));
                } catch {
                    /* ignore */
                }
            })
            .catch(() => {
                toast.error('Failed to load profile');
            })
            .finally(() => setIsLoaded(true));
    }, [router]);

    useEffect(() => {
        if (editingName) nameInputRef.current?.focus();
    }, [editingName]);

    useEffect(() => {
        if (editingEmail) emailInputRef.current?.focus();
    }, [editingEmail]);

    const saveName = async () => {
        const trimmed = draftName.trim();
        if (!trimmed || trimmed === username) {
            setEditingName(false);
            setDraftName(username);
            return;
        }
        setSavingName(true);
        try {
            const token = getValidStoredToken();
            const res = await axios.put(
                `${BACKEND_URL}/user/me`,
                { username: trimmed },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsername(res.data.username);
            setDraftName(res.data.username);
            setEditingName(false);
            toast.success('Name updated');
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 409) toast.error('That name is taken');
            else if (status === 400) toast.error('Name must be 1–64 characters');
            else toast.error('Failed to update name');
        } finally {
            setSavingName(false);
        }
    };

    const saveEmail = () => {
        const trimmed = draftEmail.trim();
        if (!trimmed || !trimmed.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (trimmed === email) {
            setEditingEmail(false);
            setDraftEmail(email);
            return;
        }
        setPasswordConfirm('');
        setShowEmailConfirmModal(true);
    };

    const confirmUpdateEmail = async () => {
        const trimmed = draftEmail.trim();
        if (!passwordConfirm) return;
        setSavingEmail(true);
        try {
            const token = getValidStoredToken();
            const res = await axios.put(
                `${BACKEND_URL}/user/me/email`,
                { email: trimmed, password_confirm: passwordConfirm },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEmail(res.data.email);
            setDraftEmail(res.data.email);
            setEditingEmail(false);
            setShowEmailConfirmModal(false);
            setPasswordConfirm('');
            toast.success('Email updated successfully');
            try {
                setAvatarUrl(await getGravatarUrl(res.data.email));
            } catch {
                /* ignore */
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401) {
                toast.error('Incorrect password');
            } else if (status === 409) {
                toast.error('That email is already in use');
            } else {
                toast.error('Failed to update email');
            }
        } finally {
            setSavingEmail(false);
        }
    };

    const sendPasswordReset = async () => {
        if (!email) return;
        setSendingReset(true);
        try {
            await axios.post(`${BACKEND_URL}/user/forgot-password`, { email });
            toast.success('Reset link sent', {
                description: `Check ${email} for instructions.`,
            });
        } catch {
            toast.error('Could not send reset email');
        } finally {
            setSendingReset(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.replace('/');
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const token = getValidStoredToken();
            await axios.delete(`${BACKEND_URL}/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.removeItem('token');
            toast.success('Account deleted');
            router.replace('/');
        } catch (err: any) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.message || err?.message || 'Unknown error';
            toast.error(`Could not delete account${status ? ` (${status})` : ''}: ${detail}`);
            setIsDeleting(false);
        }
    };

    const initial = (username || email || '?').charAt(0).toUpperCase();

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
                    <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-8 sm:py-10">
                        <div className="mb-8">
                            <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-[var(--text)]">
                                Settings
                            </h1>
                            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                                Manage your account, security, and appearance.
                            </p>
                        </div>

                        {/* Profile */}
                        <Section eyebrow="Profile" title="Your account" description="Update your profile username.">
                            <div className="flex items-center gap-4">
                                {avatarUrl && !avatarBroken ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={avatarUrl}
                                        alt={username || email}
                                        onError={() => setAvatarBroken(true)}
                                        className="h-14 w-14 shrink-0 rounded-full border border-[var(--line)] object-cover"
                                    />
                                ) : (
                                    <span
                                        className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-[18px] font-semibold text-white"
                                        style={{ background: 'var(--brand)' }}
                                    >
                                        {initial}
                                    </span>
                                )}

                                <div className="min-w-0 flex-1">
                                    {editingName ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={nameInputRef}
                                                value={draftName}
                                                onChange={(e) => setDraftName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveName();
                                                    if (e.key === 'Escape') {
                                                        setEditingName(false);
                                                        setDraftName(username);
                                                    }
                                                }}
                                                disabled={savingName}
                                                maxLength={64}
                                                className="h-9 w-full max-w-[280px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[14px] font-medium text-[var(--text)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={saveName}
                                                disabled={savingName}
                                                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:opacity-50"
                                            >
                                                {savingName ? (
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingName(false);
                                                    setDraftName(username);
                                                }}
                                                disabled={savingName}
                                                className="h-9 shrink-0 rounded-lg px-3 text-[12px] font-medium text-[var(--text-muted)] transition hover:text-[var(--text)] disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[16px] font-semibold text-[var(--text)]">
                                                {isLoaded ? username || '—' : '…'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setEditingName(true)}
                                                aria-label="Edit name"
                                                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--text-faint)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}

                                    {editingEmail ? (
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                ref={emailInputRef}
                                                value={draftEmail}
                                                type="email"
                                                onChange={(e) => setDraftEmail(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEmail();
                                                    if (e.key === 'Escape') {
                                                        setEditingEmail(false);
                                                        setDraftEmail(email);
                                                    }
                                                }}
                                                disabled={savingEmail}
                                                className="h-9 w-full max-w-[280px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--text)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={saveEmail}
                                                disabled={savingEmail}
                                                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingEmail(false);
                                                    setDraftEmail(email);
                                                }}
                                                disabled={savingEmail}
                                                className="h-9 shrink-0 rounded-lg px-3 text-[12px] font-medium text-[var(--text-muted)] transition hover:text-[var(--text)] disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center gap-2">
                                            <p className="truncate text-[13px] text-[var(--text-muted)]">
                                                {isLoaded ? email || '—' : '…'}
                                            </p>
                                            {isLoaded && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingEmail(true)}
                                                    aria-label="Edit email"
                                                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--text-faint)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Section>

                        {/* Security */}
                        <Section
                            eyebrow="Security"
                            title="Password & access"
                            description="Sign-in credentials for your account."
                        >
                            <Field
                                icon={<Mail className="h-3.5 w-3.5" />}
                                label="Reset password"
                                helper="We'll email a secure link to set a new password."
                            >
                                <button
                                    type="button"
                                    onClick={sendPasswordReset}
                                    disabled={sendingReset || !email}
                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] disabled:opacity-50"
                                >
                                    {sendingReset ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                        <Mail className="h-3.5 w-3.5" />
                                    )}
                                    {sendingReset ? 'Sending…' : 'Send reset link'}
                                </button>
                            </Field>
                        </Section>

                        {/* Appearance */}
                        <Section
                            eyebrow="Appearance"
                            title="Theme"
                            description="Choose how Argus looks for you."
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <ThemeOption
                                    active={theme === 'light'}
                                    onClick={() => theme !== 'light' && toggleTheme()}
                                    icon={<Sun className="h-3.5 w-3.5" />}
                                    label="Light"
                                />
                                <ThemeOption
                                    active={theme === 'dark'}
                                    onClick={() => theme !== 'dark' && toggleTheme()}
                                    icon={<Moon className="h-3.5 w-3.5" />}
                                    label="Dark"
                                />
                            </div>
                        </Section>

                        {/* Danger zone */}
                        <Section
                            eyebrow="Danger zone"
                            title="Delete account"
                            description="Permanently remove your account, sites, and history."
                            tone="danger"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                                    <ShieldAlert className="h-3.5 w-3.5 text-[var(--down)]" />
                                    This cannot be undone.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteConfirmText('');
                                        setConfirmDelete(true);
                                    }}
                                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--down)]/25 bg-[var(--down-soft)] px-3 text-[12px] font-medium text-[var(--down)] transition hover:bg-[var(--down)] hover:text-white"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete account
                                </button>
                            </div>
                        </Section>
                    </div>
                </main>

                {confirmDelete && (
                    <DeleteAccountModal
                        email={email}
                        confirmText={deleteConfirmText}
                        setConfirmText={setDeleteConfirmText}
                        isDeleting={isDeleting}
                        onCancel={() => setConfirmDelete(false)}
                        onConfirm={handleDeleteAccount}
                    />
                )}

                {showEmailConfirmModal && (
                    <EmailUpdateConfirmModal
                        email={draftEmail}
                        password={passwordConfirm}
                        setPassword={setPasswordConfirm}
                        isSaving={savingEmail}
                        onCancel={() => setShowEmailConfirmModal(false)}
                        onConfirm={confirmUpdateEmail}
                    />
                )}
            </div>
        </div>
    );
}

function Section({
    eyebrow,
    title,
    description,
    children,
    tone,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
    tone?: 'danger';
}) {
    return (
        <section
            className={`mb-5 overflow-hidden rounded-2xl border bg-[var(--surface)] ${
                tone === 'danger' ? 'border-[var(--down)]/25' : 'border-[var(--line)]'
            }`}
        >
            <header className="border-b border-[var(--line-soft)] px-5 py-4">
                <p
                    className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                        tone === 'danger' ? 'text-[var(--down)]' : 'text-[var(--text-faint)]'
                    }`}
                >
                    {eyebrow}
                </p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-[var(--text)]">{title}</h2>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">{description}</p>
            </header>
            <div className="space-y-5 p-5">{children}</div>
        </section>
    );
}

function Field({
    icon,
    label,
    helper,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    helper?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-[200px_1fr] sm:gap-6">
            <div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)]">
                    <span className="text-[var(--text-faint)]">{icon}</span>
                    {label}
                </div>
                {helper && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{helper}</p>}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function ThemeOption({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition ${
                active
                    ? 'border-[var(--brand)]/45 bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
        >
            {icon}
            {label}
            {active && <Check className="ml-1 h-3 w-3" />}
        </button>
    );
}

function DeleteAccountModal({
    email,
    confirmText,
    setConfirmText,
    isDeleting,
    onCancel,
    onConfirm,
}: {
    email: string;
    confirmText: string;
    setConfirmText: (s: string) => void;
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const matches = confirmText.trim().toLowerCase() === email.trim().toLowerCase() && email.length > 0;
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-2xl border bg-[var(--surface)] p-6 shadow-2xl"
                style={{
                    borderColor: 'rgba(220, 38, 38, 0.30)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(220, 38, 38, 0.18)',
                }}
            >
                <div className="mb-5 flex items-start gap-3">
                    <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ background: 'var(--down-soft)', color: 'var(--down)' }}
                    >
                        <Trash2 className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                            Confirm deletion
                        </p>
                        <h3 className="mt-1 text-[16px] font-semibold leading-snug text-[var(--text)]">
                            Delete your account?
                        </h3>
                        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                            All your sites, monitoring history, and incidents will be permanently removed. This cannot be undone.
                        </p>
                    </div>
                </div>

                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Type your email to confirm
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={email}
                    disabled={isDeleting}
                    className="mb-5 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--down)]/50 focus:ring-2 focus:ring-[var(--down)]/20 disabled:opacity-60"
                />

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!matches || isDeleting}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--down)]/30 bg-[var(--down-soft)] text-[13px] font-medium text-[var(--down)] transition hover:bg-[var(--down)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--down-soft)] disabled:hover:text-[var(--down)]"
                    >
                        {isDeleting ? (
                            <span
                                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                            />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {isDeleting ? 'Deleting…' : 'Delete forever'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmailUpdateConfirmModal({
    email,
    password,
    setPassword,
    isSaving,
    onCancel,
    onConfirm,
}: {
    email: string;
    password: string;
    setPassword: (s: string) => void;
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md overflow-hidden rounded-2xl border bg-[var(--surface)] p-6 shadow-2xl"
                style={{
                    borderColor: 'rgba(59, 130, 246, 0.30)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(59, 130, 246, 0.18)',
                }}
            >
                <div className="mb-5 flex items-start gap-3">
                    <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl animate-pulse"
                        style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                    >
                        <Key className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                            Security verification
                        </p>
                        <h3 className="mt-1 text-[16px] font-semibold leading-snug text-[var(--text)]">
                            Confirm email change
                        </h3>
                        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                            Please enter your current password to update your email identifier to <span className="font-semibold text-[var(--text)]">{email}</span>.
                        </p>
                    </div>
                </div>

                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    disabled={isSaving}
                    autoFocus
                    className="mb-5 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] disabled:opacity-60"
                />

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!password || isSaving}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(180deg, #1d8aff 0%, #0872F0 100%)',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px rgba(8, 114, 240, 0.30)',
                        }}
                    >
                        {isSaving ? (
                            <span
                                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                            />
                        ) : (
                            <Check className="h-3.5 w-3.5" />
                        )}
                        {isSaving ? 'Confirming…' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
