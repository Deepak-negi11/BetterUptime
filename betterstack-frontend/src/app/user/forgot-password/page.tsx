'use client';

import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import { ArrowLeft, Radio } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${BACKEND_URL}/user/forgot-password`, { email });
      setSent(true);
    } catch {
      setError('We could not start the reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };
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
        <section className="auth-glass-container relative z-10 w-full overflow-hidden rounded-[28px] p-8 sm:p-9">
          <div className="relative">
            <div className="mb-8 flex items-center justify-between">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/[0.07] overflow-hidden p-2 text-white">
                <Logo className="h-full w-full object-contain animate-float-subtle" />
              </span>
              <span className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/75">
                <Radio className="h-3 w-3" />
                Secure reset
              </span>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#82a3ff]">Account recovery</p>
            <h1 className="mb-3 text-3xl font-bold tracking-[-0.04em] text-white font-brand">
              {sent ? 'Check your inbox' : 'Reset your password'}
            </h1>
            <p className="mb-8 text-sm leading-6 text-white/70">
              {sent
                ? 'If an account exists for that email, we sent a one-time link that expires in one hour.'
                : 'Enter the email connected to your monitoring workspace. We will send a one-time reset link.'}
            </p>

            {!sent && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/75">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="auth-glass-input h-12 w-full px-4 text-[14px] placeholder:text-white/30"
                  />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button type="submit" disabled={loading} className="auth-button-primary h-12 w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {loading ? 'Sending secure link...' : 'Send reset link'}
                </Button>
              </form>
            )}

            {sent && (
              <Button onClick={() => setSent(false)} className="w-full h-12 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white text-sm font-semibold transition-all duration-300 cursor-pointer animate-fade-in">
                Try another email
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
