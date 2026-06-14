'use client';

import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';
import { Logo } from '@/components/logo';

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    if (getValidStoredToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/user/signin`, {
        username: formData.username,
        password: formData.password,
        remember_me: rememberMe,
      });
      localStorage.setItem('token', response.data.jwt);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center overflow-hidden px-4">
      {/* Landing page background layer */}
      <div className="supaste-gradient-layer" aria-hidden="true" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors duration-300 text-sm z-10 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Form card */}
        <div className="auth-glass-container rounded-3xl p-8 sm:p-9">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Logo className="h-16 w-16 mx-auto mb-4 object-contain animate-float-subtle text-white" />
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5 font-brand">Welcome back</h1>
            <p className="text-sm text-white/50">Sign in to your monitoring workspace</p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-white/75">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="auth-glass-input w-full px-4 py-3 text-[14px] placeholder:text-white/30"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/75">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="auth-glass-input w-full px-4 py-3 pr-12 text-[14px] placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Session options */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                    rememberMe
                      ? 'bg-[#1535BD] border-[#1535BD] shadow-[0_0_12px_rgba(21,53,189,0.4)]'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-[13px] text-white/60 font-medium select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>Remember me</span>
              </div>
              <Link
                href="/user/forgot-password"
                className="auth-secondary-link text-[13px] font-semibold transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="auth-button-primary w-full h-12 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Sign up link inside the card */}
          <div className="text-center mt-6 pt-5 border-t border-white/10 text-white/50 text-xs">
            Don&apos;t have an account?{' '}
            <Link href="/user/signup" className="auth-secondary-link font-semibold transition-colors duration-200">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
