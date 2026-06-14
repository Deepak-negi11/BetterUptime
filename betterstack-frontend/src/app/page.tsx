'use client';

import { getValidStoredToken } from '@/lib/auth';
import { ArrowUpRight, BellRing, Check, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';

const navItems = ['Features'];

export default function Home() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (getValidStoredToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <section
        className="relative flex min-h-[1120px] w-full min-w-0 flex-col items-center overflow-hidden bg-white sm:min-h-[1180px]"
      >
        <div className="supaste-gradient-layer" aria-hidden="true" />

        <nav className="landing-nav absolute left-3 right-3 top-3 z-20 w-auto px-3.5 py-1.5 text-white sm:left-1/2 sm:right-auto sm:w-[460px] sm:-translate-x-1/2 sm:px-3.5">
          <div className="relative z-10 flex items-center justify-between w-full">
            <Link href="/" className="flex items-center gap-1.5 rounded-xl">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/20 bg-white/[0.035] overflow-hidden p-1 text-white">
                <Logo className="h-full w-full object-contain" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-sm font-brand">Argus</span>
            </Link>

            <div className="hidden sm:flex items-center gap-4 text-[13px] text-white/70">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-white">
                  {item}
                </a>
              ))}
              <Link href="/user/signin" className="transition hover:text-white">
                Sign in
              </Link>
              <Link href="/user/signup" className="rounded-[13px] border border-white/25 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 ml-1">
                Get started
              </Link>
            </div>

            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((open) => !open)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,.25)] sm:hidden"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>

          {mobileOpen && (
            <div className="mt-2.5 grid gap-1 border-t border-white/10 pt-2.5 sm:hidden">
              {navItems.map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="rounded-lg px-3 py-1.5 text-xs text-white/65">
                  {item}
                </a>
              ))}
              <Link href="/user/signin" className="rounded-lg px-3 py-1.5 text-xs text-white/65">Sign in</Link>
              <Link href="/user/signup" className="mt-1 rounded-lg border border-white/25 bg-white/[0.025] px-3 py-1.5 text-center text-xs font-semibold text-white">Get started</Link>
            </div>
          )}
        </nav>

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 pt-40 text-center sm:px-10 sm:pt-[185px]">
          <div className="mb-8 flex items-center gap-2.5 text-sm font-medium text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            Multi-region uptime monitoring
          </div>

          <h1 className="w-full max-w-[680px] text-[2.55rem] font-bold leading-none tracking-[-0.05em] text-white sm:text-[4.5rem]">
            <span className="block">Know sooner.</span>
            <span className="landing-serif mt-1 block text-[2.55rem] font-normal leading-none tracking-[-0.05em] text-white sm:text-[4.5rem]">
              Respond faster.
            </span>
          </h1>

          <p className="mt-7 max-w-[570px] text-base leading-7 text-white/85 sm:text-lg sm:leading-7">
            Monitor your services from Bangalore and San Francisco, compare real response times, and receive an alert the moment something goes wrong.
          </p>

          <Link
            href="/user/signup"
            className="group mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-black px-7 text-base font-semibold text-white shadow-[0_14px_35px_rgba(0,0,0,.18)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,.24)]"
          >
            Start monitoring
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <div className="mt-9 grid gap-y-2 text-xs text-[#006fff]/50 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-7">
            {['30-second checks', 'Real regional data', 'Instant email alerts'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </div>

          <MonitorPreview />
        </div>
      </section>
    </main>
  );
}

function MonitorPreview() {
  return (
    <div className="relative mt-10 w-full min-w-0 max-w-[1000px] sm:mt-8">
      <div className="rounded-t-[34px] border border-white/80 bg-white/20 px-3 pt-3 shadow-[0_30px_80px_rgba(0,80,170,.12)] backdrop-blur-md sm:px-5 sm:pt-5">
        <div className="overflow-hidden rounded-t-[24px] bg-black text-left text-white shadow-2xl">
          <div className="flex h-16 items-center gap-4 border-b border-white/10 px-4 sm:px-6">
            <span className="flex items-center gap-1.5 text-sm font-bold text-white font-brand">
              <Logo className="h-5 w-5 object-contain" />
              Argus
            </span>
            <div className="ml-auto hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/45 sm:flex">
              <Search className="h-3.5 w-3.5" />
              Search monitors
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
              <BellRing className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-3 sm:p-6">
            {[
              ['api.satr.dev', 'Operational', '68ms', '#78D2FF'],
              ['app.satr.dev', 'Operational', '92ms', '#78D2FF'],
              ['cdn.satr.dev', 'Checking', '142ms', '#9191ff'],
            ].map(([url, status, latency, color]) => (
              <div key={url} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-4">
                <div className="mb-8 flex items-center justify-between">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
                  <span className="text-[10px] text-white/30">{latency}</span>
                </div>
                <p className="truncate text-sm font-medium text-white/85">{url}</p>
                <p className="mt-1 text-xs text-white/35">{status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
