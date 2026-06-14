'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BellRing, Check, GitCompareArrows, Radio, ShieldCheck } from 'lucide-react';

const checks = [
  ['BLR', '68ms', '#8CC4F1'],
  ['SFO', '142ms', '#E8AB3A'],
];

export function UptimeFeatures() {
  return (
    <section className="relative overflow-hidden bg-[#050617] px-5 py-28 sm:px-8 lg:px-12">
      <div className="signal-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="mb-16 grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#b993ff]">Designed for the moment something changes</p>
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">
              One signal.<br /><span className="text-white/25">Three clear decisions.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/40 lg:justify-self-end">
            Monitoring should not make you interpret a wall of numbers. Argus connects regional evidence, incident verification, and alert delivery into one calm workflow.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <motion.article whileHover={{ y: -5 }} className="liquid-panel group relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:col-span-7">
            <div className="liquid-highlight" aria-hidden="true" />
            <div className="relative">
              <div className="mb-14 flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#b993ff]">
                  <GitCompareArrows className="h-5 w-5" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">01 / Compare</span>
              </div>
              <h3 className="max-w-md text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">See the same service from two real places.</h3>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/38">Separate traces make regional drift obvious. A slowdown in San Francisco never hides inside a global average.</p>

              <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#060719]/80 p-5">
                <div className="mb-7 flex flex-wrap gap-4">
                  {checks.map(([region, latency, color]) => (
                    <span key={region} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
                      {region} <strong className="font-medium text-white/75">{latency}</strong>
                    </span>
                  ))}
                </div>
                <svg viewBox="0 0 700 180" className="w-full overflow-visible">
                  {[35, 90, 145].map((y) => <line key={y} x1="0" x2="700" y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeDasharray="4 8" />)}
                  <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8 }} d="M0 105 C70 96 90 65 150 74 S240 120 300 86 S390 48 450 80 S560 118 700 70" stroke="#8CC4F1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, delay: .2 }} d="M0 132 C80 128 120 112 175 118 S280 145 335 92 S430 62 500 112 S610 130 700 104" stroke="#E8AB3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </motion.article>

          <motion.article whileHover={{ y: -5 }} className="liquid-panel group relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:col-span-5">
            <div className="liquid-highlight" aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <div className="mb-14 flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">02 / Verify</span>
              </div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">An incident needs evidence.</h3>
              <p className="mt-4 text-sm leading-6 text-white/38">Cross-region verification separates a real outage from a temporary network wobble.</p>

              <div className="mt-auto pt-10">
                {['BLR check failed', 'SFO check confirmed', 'Incident created'].map((step, index) => (
                  <div key={step} className="relative flex items-center gap-4 pb-6 last:pb-0">
                    {index < 2 && <span className="absolute left-[15px] top-8 h-full w-px bg-gradient-to-b from-[#7201EA]/60 to-white/[0.05]" />}
                    <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${index === 2 ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-[#7201EA]/35 bg-[#7201EA]/12 text-[#c7a4ff]'}`}>
                      {index === 2 ? <Check className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm text-white/55">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>

          <motion.article whileHover={{ y: -5 }} className="liquid-panel group relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:col-span-12">
            <div className="liquid-highlight" aria-hidden="true" />
            <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="mb-12 flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#b993ff]">
                    <BellRing className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 lg:hidden">03 / Alert</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">Send the useful alert. Skip the panic.</h3>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/38">Test the complete alert path before an outage and know exactly where the incident came from.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Detected', '00:00', 'Worker saw failure'],
                  ['Verified', '00:30', 'Second region agreed'],
                  ['Delivered', '00:32', 'Email reached owner'],
                ].map(([title, time, description], index) => (
                  <div key={title} className="rounded-2xl border border-white/[0.07] bg-[#060719]/80 p-5 transition hover:border-[#7201EA]/30 hover:bg-[#7201EA]/[0.06]">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/25">0{index + 1}</span>
                      <span className="font-mono text-[10px] text-[#c7a4ff]">{time}</span>
                    </div>
                    <p className="text-sm font-medium text-white/75">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/30">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>
        </div>

        <div className="mt-12 flex justify-end">
          <a href="/user/signup" className="group inline-flex items-center gap-3 text-sm font-medium text-white/55 transition hover:text-white">
            Build your first monitor
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] transition group-hover:border-[#7201EA]/40 group-hover:bg-[#7201EA]/15">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
