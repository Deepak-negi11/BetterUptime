'use client';

import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
  isLoggedIn?: boolean;
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-[#0C0C14] border-b border-white/[0.05]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-pointer z-50" onClick={() => router.push('/')}>
          {/* Logo Icon Mockup */}
          <div className="w-6 h-6 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Better Stack
          </span>
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-6 z-50 ">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-transparent transition-colors font-medium text-[14px] p-0 h-auto"
              >
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-[14px]"
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
                className="text-gray-300 hover:text-white  hover:bg-transparent transition-colors font-medium text-[14px] p-0 h-auto"
              >
                Sign in
              </Button>
              <Button
                onClick={() => router.push('/user/signup')}
                className="bg-[#5850ec] hover:bg-[#4338ca] text-white font-medium px-4 py-2 rounded-md transition-all shadow-md text-[14px] h-9"
              >
                Sign up
              </Button>
            </>
          )}
        </div>

        <button className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-50">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
