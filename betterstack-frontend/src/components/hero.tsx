'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, BellRing, Check, Globe2, Radio, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const monitorRows = [
  { label: 'api.yourapp.com', location: 'Mumbai', latency: '184 ms', status: 'Operational' },
  { label: 'checkout.yourapp.com', location: 'Frankfurt', latency: '231 ms', status: 'Operational' },
  { label: 'status.yourapp.com', location: 'New York', latency: '96 ms', status: 'Operational' },
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      <div className="hero-aurora absolute inset-0" />
      <div className="hero-grid absolute inset-0 opacity-40" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Radio className="h-3.5 w-3.5 text-cyan-300" />
            Your infrastructure, watched from every angle
          </div>

          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[88px]">
            Know it&apos;s down
            <span className="hero-gradient-text block">before they do.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-white/55 sm:text-lg">
            UpSignal checks your websites and APIs from multiple regions, tracks every response,
            and alerts you the moment something breaks.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="glass-button h-12 rounded-2xl px-6 text-sm font-semibold text-white">
              <Link href="/user/signup">
                Monitor your first site
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 rounded-2xl px-6 text-sm text-white/65 hover:bg-white/[0.06] hover:text-white">
              <Link href="/user/signin">Open your dashboard</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> No card required</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> You own the data</span>
            <span className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-violet-300" /> Multi-region checks</span>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-cyan-400/10 via-violet-500/15 to-fuchsia-400/10 blur-3xl" />
          <div className="liquid-panel relative overflow-hidden rounded-[1.75rem] p-2 sm:p-3">
            <div className="rounded-[1.35rem] border border-white/[0.07] bg-[#090b14]/80 p-4 sm:p-7">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">Live overview</p>
                  <h2 className="mt-1.5 text-lg font-medium text-white sm:text-xl">All systems operational</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  Live
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {monitorRows.map((monitor) => (
                  <div key={monitor.label} className="monitor-row grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_0.6fr_0.8fr]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
                      <span className="truncate text-sm font-medium text-white/85">{monitor.label}</span>
                    </div>
                    <span className="hidden text-sm text-white/35 sm:block">{monitor.location}</span>
                    <span className="hidden text-sm tabular-nums text-white/50 sm:block">{monitor.latency}</span>
                    <span className="text-xs text-emerald-300/80 sm:text-sm">{monitor.status}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['99.99%', 'Uptime'],
                  ['170 ms', 'Avg. response'],
                  ['3', 'Active regions'],
                  ['0', 'Open incidents'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <p className="text-lg font-medium tracking-tight text-white sm:text-xl">{value}</p>
                    <p className="mt-1 text-xs text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="liquid-glass absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-2xl px-4 py-3 text-left shadow-2xl sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><BellRing className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-medium text-white/80">Incident alerts</p>
              <p className="text-[11px] text-white/35">Delivered when every second matters</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
