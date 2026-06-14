'use client';

import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import { ArrowLeft, Eye, EyeOff, Radio } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { Logo } from '@/components/logo';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('This reset link is missing its secure token.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await axios.post(`${BACKEND_URL}/user/reset-password`, { token, password });
      setDone(true);
    } catch {
      setError('This link is invalid or expired. Request a new reset link.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="auth-glass-container relative z-10 w-full overflow-hidden rounded-[28px] p-8 sm:p-9">
      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] overflow-hidden p-2 text-white">
            <Logo className="h-full w-full object-contain animate-float-subtle" />
          </span>
          <span className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/75">
            <Radio className="h-3 w-3" />
            One-time link
          </span>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#82a3ff]">Account recovery</p>
        <h1 className="mb-3 text-3xl font-bold tracking-[-0.04em] text-white font-brand">
          {done ? 'Password updated' : 'Choose a new password'}
        </h1>
        <p className="mb-8 text-sm leading-6 text-white/70">
          {done ? 'Your new password is active. You can safely return to your monitoring workspace.' : 'Use at least eight characters. This reset link can only be used once.'}
        </p>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/75">New password</label>
              <span className="relative block">
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="auth-glass-input h-12 w-full px-4 pr-12 text-[14px] placeholder:text-white/30"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={loading} className="auth-button-primary h-12 w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>
        ) : (
          <Button asChild className="auth-button-primary h-12 w-full text-sm font-semibold cursor-pointer">
            <Link href="/user/signin">Return to sign in</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center overflow-hidden px-4">
      {/* Landing page background layer */}
      <div className="supaste-gradient-layer" aria-hidden="true" />

      {/* Back to sign in */}
      <Link href="/user/signin" className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-white/50 transition hover:text-white font-medium">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Suspense fallback={<div className="text-sm text-white/40">Verifying secure link...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
