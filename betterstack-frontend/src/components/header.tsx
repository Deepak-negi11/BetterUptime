'use client';

import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`
        fixed top-4 inset-x-4 z-50 mx-auto max-w-7xl rounded-full border
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${
          scrolled
            ? 'border-white/[0.12] bg-[#08091d]/75 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-3xl'
            : 'border-white/[0.08] bg-[#08091d]/45 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-2xl'
        }
      `}
    >
      <div className="relative mx-auto flex h-14 items-center justify-between px-4 sm:px-5">
        {/* Logo */}
        <div
          className="flex items-center gap-1.5 group cursor-pointer z-50"
          onClick={() => router.push('/')}
        >
          {/* Custom SVG Uptime Signal Icon */}
          <div className="relative w-9 h-9 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110">
            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#7201EA] to-[#3A0CA3] opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500" />

            <Logo className="w-full h-full relative z-10 text-white" />
          </div>

          <span className="text-lg font-bold tracking-tight text-gradient select-none font-brand">
            Argus
          </span>
        </div>

        {/* Right Actions — Desktop */}
        <div className="hidden lg:flex items-center gap-4 z-50">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                className="
                  text-gray-300 hover:text-white hover:bg-white/[0.06]
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  font-medium text-[14px] rounded-lg px-4 h-9
                "
              >
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="
                  text-gray-300 hover:text-white hover:bg-white/[0.06]
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  font-medium text-[14px] rounded-lg px-4 h-9
                "
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/user/signin')}
                className="
                  text-gray-300 hover:text-white hover:bg-transparent
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  font-medium text-[14px] p-0 h-auto
                  relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px]
                  after:bg-gradient-to-r after:from-[#7201EA] after:to-[#3A0CA3]
                  hover:after:w-full after:transition-all after:duration-300
                "
              >
                Sign in
              </Button>
              <Button
                onClick={() => router.push('/user/signup')}
                className="
                  relative overflow-hidden
                  bg-gradient-to-r from-[#7201EA] to-[#3A0CA3]
                  hover:from-[#8014FF] hover:to-[#4A1DC7]
                  text-white font-medium px-5 py-2 rounded-lg
                  transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  shadow-[0_0_20px_rgba(114,1,234,0.25)]
                  hover:shadow-[0_0_30px_rgba(114,1,234,0.45),0_0_60px_rgba(114,1,234,0.15)]
                  hover:scale-[1.02]
                  text-[14px] h-9
                  border border-white/[0.1]
                "
              >
                {/* Shimmer overlay */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Get Started</span>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="
            lg:hidden p-2 rounded-lg z-50
            text-gray-300 hover:text-white
            glass-button
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          "
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </motion.header>
  );
}
