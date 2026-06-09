import { BellRing, ChartNoAxesCombined, Globe2, LockKeyhole } from 'lucide-react';

const features = [
  {
    icon: Globe2,
    title: 'See the whole internet, not one server',
    description: 'Run checks from independent regions so a local network issue never becomes a misleading incident.',
    accent: 'text-cyan-300',
  },
  {
    icon: BellRing,
    title: 'Get the signal while it still matters',
    description: 'Trigger incident alerts as soon as a monitor fails and keep the latest state visible in one dashboard.',
    accent: 'text-violet-300',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Turn every check into context',
    description: 'Keep response-time history and regional results so you can see when performance changed and where.',
    accent: 'text-fuchsia-300',
  },
  {
    icon: LockKeyhole,
    title: 'Keep ownership of the control plane',
    description: 'Run the Rust API, PostgreSQL, Redis, and workers on infrastructure you choose, without per-monitor fees.',
    accent: 'text-emerald-300',
  },
];

export function UptimeFeatures() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.05] px-4 py-24 sm:px-6 sm:py-32">
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/70">Built for useful answers</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-6xl">
            One calm place to see what your systems are doing.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/45">
            UpSignal gives small teams the core monitoring loop without filling the screen with enterprise noise.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="feature-glass group rounded-[1.6rem] p-6 sm:p-8">
              <feature.icon className={`h-5 w-5 ${feature.accent}`} />
              <h3 className="mt-12 max-w-sm text-xl font-medium tracking-[-0.025em] text-white/90 sm:text-2xl">{feature.title}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/40 sm:text-base">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
