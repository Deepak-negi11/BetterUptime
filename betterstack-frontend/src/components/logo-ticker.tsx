'use client';

import { motion } from 'framer-motion';

const metrics = [
  ['Checks running', '2,840 / min'],
  ['Regional workers', 'BLR + SFO'],
  ['Average response', '68ms'],
  ['Incident verification', 'Multi-region'],
  ['Alert delivery', 'Ready'],
  ['Current status', 'All systems normal'],
];

export function LogoTicker() {
  return (
    <section className="overflow-hidden border-y border-white/[0.06] bg-[#050617] py-4">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="flex w-max"
      >
        {[...metrics, ...metrics].map(([label, value], index) => (
          <div key={`${label}-${index}`} className="flex min-w-64 items-center gap-4 border-r border-white/[0.06] px-7">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/25">{label}</span>
            <span className="text-xs font-medium text-white/65">{value}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
