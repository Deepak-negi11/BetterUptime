'use client';

import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/lib/utils';
import { getValidStoredToken } from '@/lib/auth';

export default function SignUpPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });

    useEffect(() => {
        if (getValidStoredToken()) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${BACKEND_URL}/user/signup`, {
                username: formData.username,
                password: formData.password,
                email: formData.email
            });

            localStorage.setItem('token', response.data.jwt);
            console.log('Signup successful:', formData.username);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.response?.data?.message || 'Failed to create account. Please try again.');
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
                            Create your account
                        </h1>
                        <p className="text-white/50">
                            Start monitoring your infrastructure in minutes
                        </p>
                    </div>

                    {/* Sign Up Form */}
                    <div className="bg-[#13141F] border border-[#1E293B] rounded-xl p-8">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username Field */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-white/70 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0C0C14] border border-[#1E293B] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all pr-12"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute  right-4 top-7 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>


                                </div>
                                <p className="mt-2 text-xs text-white/40">
                                    Must be at least 8 characters
                                </p>
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
                                        Creating account...
                                    </div>
                                ) : (
                                    'Create account'
                                )}
                            </Button>
                        </form>

                    </div>

                    {/* Sign In Link */}
                    <p className="text-center mt-6 text-white/50">
                        Already have an account?{' '}
                        <Link href="/user/signin" className="text-[#5850ec] hover:text-[#7C75F0] transition-colors font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div >
        </div >
    );
}
