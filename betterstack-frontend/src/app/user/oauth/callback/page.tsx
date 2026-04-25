'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OAuthCallbackPage() {
    const router = useRouter();
    const [message, setMessage] = useState('Completing sign in...');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            setMessage('Sign in failed. Redirecting...');
            router.replace('/user/signin');
            return;
        }

        localStorage.setItem('token', token);
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0C0C14] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[#5850ec] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-white/60">{message}</p>
            </div>
        </div>
    );
}
