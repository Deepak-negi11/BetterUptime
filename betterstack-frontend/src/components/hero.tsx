'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowUpRight, BellRing, Check, Globe2, Radio, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CSSProperties, MouseEvent, useEffect, useState } from 'react';

const rotatingSignals = ['downtime', 'latency', 'regional drift'];

const regions = [
  { name: 'Bangalore', code: 'BLR', latency: '68ms', color: '#8CC4F1' },
  { name: 'San Francisco', code: 'SFO', latency: '142ms', color: '#E8AB3A' },
];

export function Hero() {
  const router = useRouter();
  const [signalIndex, setSignalIndex] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 28, tiltX: 0, tiltY: 0 });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSignalIndex((current) => (current + 1) % rotatingSignals.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, []);

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setPointer({
      x,
      y,
      tiltX: (50 - y) / 35,
      tiltY: (x - 50) / 45,
    });
  };

  const signalStyle = {
    '--signal-x': `${pointer.x}%`,
    '--signal-y': `${pointer.y}%`,
  } as CSSProperties;

  return (
    <section
      onMouseMove={handlePointerMove}
      style={signalStyle}
      className="landing-signal-field relative min-h-screen overflow-hidden px-5 pb-24 pt-28 sm:px-8 lg:px-12 lg:pb-16 lg:pt-32"
    >
      <div className="signal-grid absolute inset-0" aria-hidden="true" />
      <SignalNetwork />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-10rem)] max-w-[1400px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 pr-4 text-xs text-white/60 backdrop-blur-2xl"
          >
            <span className="relative grid h-7 w-7 place-items-center rounded-full bg-emerald-300/10 text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              <span className="absolute inset-0 animate-ping rounded-full border border-emerald-300/25" />
            </span>
            Watching from BLR and SFO right now
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[760px] text-[clamp(3.7rem,7vw,7.2rem)] font-semibold leading-[0.91] tracking-[-0.075em] text-white"
          >
            Know what breaks
            <span className="mt-2 block text-white/24">before users do.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-8 flex min-h-7 items-center gap-3 text-base text-white/45"
          >
            <span>Catch</span>
            <span className="min-w-32 overflow-hidden rounded-full border border-[#7201EA]/25 bg-[#7201EA]/10 px-3 py-1 text-center font-mono text-sm text-[#c9a7ff]">
              <motion.span
                key={rotatingSignals[signalIndex]}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12 }}
                className="block"
              >
                {rotatingSignals[signalIndex]}
              </motion.span>
            </span>
            <span>across every region.</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="mt-7 max-w-xl text-base leading-7 text-white/42 sm:text-lg"
          >
            Real checks from real workers, compared side by side. See slowdowns develop, verify incidents globally, and alert the right person before the noise starts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.7 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button onClick={() => router.push('/user/signup')} className="liquid-primary group h-12 rounded-full px-7 font-semibold text-white">
              Start monitoring
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
            <Button onClick={() => router.push('/user/signin')} className="glass-button h-12 rounded-full px-7 font-semibold text-white/80">
              Open your workspace
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/35"
          >
            {['30 second checks', 'One-click test alerts', 'No card required'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-300/80" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: `perspective(1200px) rotateX(${pointer.tiltX}deg) rotateY(${pointer.tiltY}deg)` }}
          className="relative mx-auto w-full max-w-[760px] transition-transform duration-300 ease-out"
        >
          <div className="absolute -inset-12 rounded-full bg-[#7201EA]/15 blur-[90px]" aria-hidden="true" />
          <div className="liquid-panel relative overflow-hidden rounded-[32px] p-2">
            <div className="liquid-highlight" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[25px] border border-white/[0.07] bg-[#050617]/88">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/12" />
                  <span className="h-2 w-2 rounded-full bg-white/8" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/28">Live signal console</span>
                <span className="flex items-center gap-2 text-[10px] text-emerald-200/70">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  synced
                </span>
              </div>

              <div className="grid gap-px bg-white/[0.06] md:grid-cols-[1fr_0.72fr]">
                <div className="bg-[#070819] p-5 sm:p-7">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Monitored target</p>
                      <p className="mt-2 text-lg font-medium text-white/88">api.satr.dev</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-medium text-emerald-200">Operational</span>
                  </div>

                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Response trace</p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">68<span className="ml-1 text-sm font-normal text-white/35">ms</span></p>
                    </div>
                    <span className="text-xs text-emerald-300/70">-12.4%</span>
                  </div>
                  <ResponseTrace />

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    {regions.map((region) => (
                      <div key={region.code} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.045]">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-mono text-[10px] text-white/30">{region.code}</span>
                          <span className="h-2 w-2 rounded-full" style={{ background: region.color, boxShadow: `0 0 12px ${region.color}` }} />
                        </div>
                        <p className="text-xs text-white/42">{region.name}</p>
                        <p className="mt-1 text-sm font-medium text-white/80">{region.latency}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-px bg-white/[0.06]">
                  <div className="bg-[#090a1d] p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">Global reach</p>
                      <Globe2 className="h-4 w-4 text-[#b993ff]" />
                    </div>
                    <div className="relative mx-auto aspect-square max-w-52">
                      <div className="absolute inset-[8%] animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-[#7201EA]/25" />
                      <div className="absolute inset-[24%] animate-[spin_18s_linear_infinite_reverse] rounded-full border border-white/[0.08]" />
                      <div className="absolute inset-[39%] rounded-full bg-[#7201EA]/20 blur-xl" />
                      <span className="absolute left-[20%] top-[33%] h-2.5 w-2.5 rounded-full bg-[#8CC4F1] shadow-[0_0_16px_#8CC4F1]" />
                      <span className="absolute right-[17%] top-[52%] h-2.5 w-2.5 rounded-full bg-[#E8AB3A] shadow-[0_0_16px_#E8AB3A]" />
                      <span className="absolute inset-0 grid place-items-center text-center">
                        <span>
                          <span className="block text-3xl font-semibold tracking-[-0.06em] text-white">2</span>
                          <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-white/30">regions live</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#090a1d] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#7201EA]/15 text-[#c7a4ff]"><BellRing className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-medium text-white/80">Alert path ready</p>
                        <p className="mt-0.5 text-[10px] text-white/28">Email channel verified</p>
                      </div>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ delay: 1, duration: 1.3 }} className="h-full rounded-full bg-gradient-to-r from-[#7201EA] to-[#c7a4ff]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -right-3 -top-8 hidden rounded-2xl border border-white/10 bg-[#10112b]/75 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:block">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-[11px] font-medium text-white/80">No false incident</p>
                <p className="mt-0.5 text-[9px] text-white/30">Verified across regions</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ResponseTrace() {
  return (
    <svg viewBox="0 0 440 150" className="w-full overflow-visible" role="img" aria-label="Animated response time trace">
      <defs>
        <linearGradient id="traceArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7201EA" stopOpacity=".34" />
          <stop offset="100%" stopColor="#7201EA" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="traceLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8CC4F1" />
          <stop offset="55%" stopColor="#7201EA" />
          <stop offset="100%" stopColor="#E8AB3A" />
        </linearGradient>
      </defs>
      {[28, 70, 112].map((y) => <line key={y} x1="0" y1={y} x2="440" y2={y} stroke="rgba(255,255,255,.06)" strokeDasharray="3 7" />)}
      <path d="M0 111 C36 102 55 108 82 92 S128 55 163 73 S210 120 249 83 S298 42 330 61 S378 98 440 45 L440 150 L0 150 Z" fill="url(#traceArea)" />
      <motion.path
        d="M0 111 C36 102 55 108 82 92 S128 55 163 73 S210 120 249 83 S298 42 330 61 S378 98 440 45"
        fill="none"
        stroke="url(#traceLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.7, duration: 2, ease: 'easeInOut' }}
      />
      <motion.circle cx="440" cy="45" r="4" fill="#E8AB3A" animate={{ r: [3, 6, 3], opacity: [1, .45, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
    </svg>
  );
}

function SignalNetwork() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-55" viewBox="0 0 1440 900" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="signalGlow">
          <stop offset="0%" stopColor="#7201EA" stopOpacity=".22" />
          <stop offset="100%" stopColor="#7201EA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1030" cy="410" r="390" fill="url(#signalGlow)" />
      <motion.path d="M80 730 C330 610 360 360 620 420 S1030 680 1390 280" stroke="rgba(139,108,255,.12)" strokeWidth="1" strokeDasharray="5 12" animate={{ strokeDashoffset: [0, -68] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
      <motion.path d="M360 80 C560 280 800 70 1010 260 S1210 630 1410 620" stroke="rgba(140,196,241,.1)" strokeWidth="1" strokeDasharray="3 14" animate={{ strokeDashoffset: [0, -85] }} transition={{ duration: 11, repeat: Infinity, ease: 'linear' }} />
    </svg>
  );
}
