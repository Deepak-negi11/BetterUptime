import { Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-sm font-medium text-white/70">
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
            <Activity className="h-4 w-4" />
          </span>
          UpSignal
          <span className="text-white/20">/</span>
          <span className="font-normal text-white/35">Know before they do.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-white/45">
          <Link href="/user/signin" className="transition-colors hover:text-white">Sign in</Link>
          <Link href="/user/signup" className="flex items-center gap-1 transition-colors hover:text-white">
            Start monitoring <ArrowUpRight className="h-3 w-3" />
          </Link>
          <span>© {new Date().getFullYear()} UpSignal</span>
        </div>
      </div>
    </footer>
  );
}
