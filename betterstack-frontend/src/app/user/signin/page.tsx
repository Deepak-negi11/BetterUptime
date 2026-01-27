'use client';

import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${BACKEND_URL}/user/signin`, {
                username: formData.username,
                password: formData.password
            });

            localStorage.setItem('token', response.data.jwt);
            console.log('Signin successful:', formData.username);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Signin error:', err);
            setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0C0C14] flex flex-col">
            <div className="p-6">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to home</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome back
                        </h1>
                        <p className="text-white/50">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Sign In Form */}
                    <div className="bg-[#13141F] border border-[#1E293B] rounded-xl p-8">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                                    Username
                                </label>
                                <input
                                    type="username"
                                    id='username'
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all"
                                    placeholder="username"
                                    required
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-white/70">
                                        Password
                                    </label>
                                    <Link href="/user/forgot-password" className="text-sm text-[#5850ec] hover:text-[#7C75F0] transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="w-4 h-4 rounded border-[#1E293B] bg-[#0C0C14] text-[#5850ec] focus:ring-[#5850ec] focus:ring-offset-0"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-white/50">
                                    Remember me for 30 days
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#5850ec] hover:bg-[#4338ca] text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-[#5850ec]/20 disabled:opacity-50 disabled:cursor-not-allowed h-12"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign in'
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#1E293B]" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-[#13141F] text-white/40">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white/70 hover:text-white hover:border-[#5850ec]/50 transition-all">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-sm">Google</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white/70 hover:text-white hover:border-[#5850ec]/50 transition-all">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                                <span className="text-sm">GitHub</span>
                            </button>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center mt-6 text-white/50">
                        Don't have an account?{' '}
                        <Link href="/user/signup" className="text-[#5850ec] hover:text-[#7C75F0] transition-colors font-medium">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
