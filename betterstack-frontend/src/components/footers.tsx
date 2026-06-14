import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#03040f] px-5 pb-8 pt-20 sm:px-8 lg:px-12">
      <div className="absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 rounded-full bg-[#7201EA]/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="liquid-panel grid gap-10 overflow-hidden rounded-[32px] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="liquid-highlight" aria-hidden="true" />
          <div className="relative">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#b993ff]">Your next incident will not wait</p>
            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">
              Make your services<br /><span className="text-white/25">easier to trust.</span>
            </h2>
          </div>
          <Link href="/user/signup" className="liquid-primary relative inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white">
            Start monitoring
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-6 py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-white/60 font-brand font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#7201EA]/20 overflow-hidden p-1 text-white">
              <Logo className="h-full w-full object-contain" />
            </span>
            Argus
          </Link>
          <div className="flex gap-6">
            <Link href="/user/signin" className="transition hover:text-white">Sign in</Link>
            <Link href="/user/forgot-password" className="transition hover:text-white">Account recovery</Link>
          </div>
          <span>Multi-region uptime monitoring</span>
        </div>
      </div>
    </footer>
  );
}
