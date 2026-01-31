'use client';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { BACKEND_URL } from '@/lib/utils';
import axios from 'axios';
import {
    Search,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    X,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Website {
    id: string;
    url: string;
    status: 'up' | 'down' | 'unknown';
    last_check: string | null;
    response_time: number | null;
    region_id: string | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const hasActiveIncident = (w: Website) => w.status === 'down';

    useEffect(() => {
        fetchWebsites();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredWebsites(websites);
        } else {
            setFilteredWebsites(websites.filter(w =>
                w.url.toLowerCase().includes(searchQuery.toLowerCase())
            ));
        }
    }, [searchQuery, websites]);

    const fetchWebsites = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/user/signin');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Fetching websites...');
            console.log('Token exists:', !!token);

            const response = await axios.get(`${BACKEND_URL}/websites`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Fetch response status:', response.status);
            console.log('Fetch response data:', response.data);

            const websiteData = response.data.websites || [];
            const mappedWebsites = websiteData.map((w: any) => ({
                id: w.id,
                url: w.url,
                status: w.status || 'unknown',
                last_check: w.last_check || null,
                response_time: w.response_time || null,
                region_id: w.region_id || null,
            }));

            setWebsites(mappedWebsites);
            setFilteredWebsites(mappedWebsites);
        } catch (err: any) {
            console.error('Failed to fetch websites:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                router.push('/user/signin');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWebsite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${BACKEND_URL}/website`,
                { url: newUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewUrl('');
            setShowAddModal(false);
            fetchWebsites();
        } catch (err: any) {
            console.error('Failed to add website:', err); const errorMessage = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || 'Failed to add website';
            setError(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#0B0C15] text-white font-sans">
            <Header isLoggedIn={true} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-bold">Monitors</h1>

                    <div className="flex items-center gap-4 flex-1 md:justify-end">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)
                                }
                                className="w-full bg-[#13141F] border border-[#2D3748] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#5850ec] transition-colors"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-[#2D3748] text-[10px] text-white/40">
                                /
                            </div>
                        </div >

                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#5850ec] hover:bg-[#4338ca] text-white font-medium px-4"
                        >
                            Create monitor
                            <ChevronDown className="w-4 h-4 ml-2 border-l border-white/20 pl-2" />
                        </Button>
                    </div >
                </div >

                <div className="border border-[#2D3748] rounded-lg overflow-hidden bg-[#0B0C15]">
                    <div className="bg-[#13141F] px-4 py-3 flex items-center gap-2 border-b border-[#2D3748]">
                        <ChevronDown className="w-4 h-4 text-white/60" />
                        <span className="text-sm font-medium text-white/80">Monitors</span>
                    </div>

                    {isLoading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-[#5850ec] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredWebsites.length === 0 ? (
                        <div className="p-12 text-center text-white/40">
                            No monitors found
                        </div>
                    ) : (
                        <div>
                            {filteredWebsites.map((website) => (
                                <div
                                    key={website.id}
                                    onClick={() => router.push(`/website/${website.id}`)}
                                    className="flex items-center justify-between px-4 py-3 border-b border-[#2D3748] hover:bg-[#13141F] cursor-pointer transition-colors group last:border-0"
                                >
                                    <div className="flex items-center gap-4">
                                        {website.status === 'unknown' ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                        ) : website.status === 'up' ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                        )}

                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white text-sm">{website.url}</span>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className={
                                                    website.status === 'unknown' ? 'text-yellow-500' :
                                                        website.status === 'up' ? 'text-green-500' : 'text-red-500'
                                                }>
                                                    {website.status === 'unknown' ? 'Checking...' :
                                                        website.status === 'up' ? 'Up' : 'Down'}
                                                </span>
                                                {website.last_check && (
                                                    <>
                                                        <span className="text-white/30">.</span>


                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {hasActiveIncident(website) && (
                                            <div className="bg-[#2D1A1A] border border-red-500/20 text-red-500 text-xs px-3 py-1.5 rounded-md flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Ongoing incident
                                                <ChevronRight className="w-3 h-3 opacity-50 ml-1" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-white/40">
                                            <div className="hidden md:flex items-center gap-2 text-xs">
                                                <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                                </div>

                                            </div>

                                            <button className="p-1 hover:text-white transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main >


            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#13141F] border border-[#1E293B] rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-white">Add Monitor</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAddWebsite}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        URL to monitor
                                    </label>
                                    <input
                                        type="url"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 bg-[#0C0C14] border border-[#2D3748] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#5850ec] focus:border-transparent transition-all"
                                        required
                                        autoFocus
                                    />
                                    <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        We'll monitor this URL every 3 minutes from Europe
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        variant="outline"
                                        className="flex-1 bg-transparent border-[#2D3748] text-white hover:bg-[#2D3748]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isAdding}
                                        className="flex-1 bg-[#5850ec] hover:bg-[#4338ca] text-white disabled:opacity-50"
                                    >
                                        {isAdding ? 'Adding...' : 'Create monitor'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
