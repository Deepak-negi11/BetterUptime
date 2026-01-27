'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { BACKEND_URL } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
    Pause,
    Settings,
    AlertTriangle,
    ChevronDown,
    Send,
    MoreHorizontal,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TickInfo {
    status: string;
    response_time: number;
    created_at: string;
    region_id: string;
}

interface WebsiteStats {
    uptime_24h: number;
    incidents_24h: number;
    avg_response_time_24h: number;
}

interface WebsiteDetails {
    id: string;
    url: string;
    user_id: string;
    recent_ticks: TickInfo[];
    stats: WebsiteStats;
}

export default function WebsiteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { webstieId } = params;
    const [website, setWebsite] = useState<WebsiteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('Day');
    const [selectedRegion, setSelectedRegion] = useState('Europe');

    useEffect(() => {
        if (webstieId) {
            fetchWebsiteDetails();
        }
    }, [webstieId]);

    const fetchWebsiteDetails = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/user/signin');
            return;
        }

        try {
            const response = await axios.get(`${BACKEND_URL}/website/${webstieId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWebsite(response.data);
        } catch (err) {
            console.error('Failed to fetch website details:', err);
            setError('Failed to load website details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0C0C14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5850ec]"></div>
            </div>
        );
    }

    if (error || !website) {
        return (
            <div className="min-h-screen bg-[#0C0C14] flex items-center justify-center flex-col gap-4">
                <p className="text-red-400">{error || 'Website not found'}</p>
                <Button onClick={() => router.push('/dashboard')} variant="outline">Back to Dashboard</Button>
            </div>
        );
    }

    const ticks = website.recent_ticks || [];
    const latestTick = ticks[0];
    const stats = website.stats || { uptime_24h: 100, incidents_24h: 0, avg_response_time_24h: 0 };

    let upTicks = 0;
    for (const tick of ticks) {
        if (tick.status === 'up') upTicks++;
        else break;
    }
    const upTimeSeconds = upTicks * 30;

    const isChecking = ticks.length === 0;

    // Calculate last checked relative time
    const lastChecked = latestTick ? new Date(latestTick.created_at) : null;

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    const timeAgoString = formatTimeAgo(lastChecked);

    const chartData = [...ticks].reverse().map(tick => ({
        time: new Date(tick.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response_time: tick.status === 'up' ? tick.response_time : 0,
        status: tick.status
    }));

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white font-sans">
            <Header isLoggedIn={true} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent text-white/40 hover:text-white text-sm h-auto py-0"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="w-3 h-3 mr-2" />
                    Back to Dashboard
                </Button>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className={`mt-1.5 w-3 h-3 rounded-full ${isChecking ? 'bg-yellow-500 animate-pulse' :
                            latestTick?.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                {website.url}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-green-400 mt-1">
                                <span className={`font-medium uppercase ${isChecking ? 'text-yellow-500' :
                                    latestTick?.status === 'up' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {isChecking ? 'Checking...' : latestTick?.status}
                                </span>
                                <span className="text-white/30">•</span>
                                <span className="text-white/40">Checked every 30 seconds</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/60">
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            <Send className="w-4 h-4" />
                            Send test alert
                        </button>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            <AlertTriangle className="w-4 h-4" />
                            Incidents
                        </button>
                        <span className="text-white/10">|</span>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                            Configure
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-5">
                        <div className="text-white/40 text-sm mb-2">Currently up for</div>
                        <div className="text-2xl font-bold text-white">
                            {isChecking ? '--' :
                                latestTick?.status === 'down' ? '0 seconds' :
                                    upTimeSeconds < 60 ? `${upTimeSeconds} seconds` : `${Math.floor(upTimeSeconds / 60)} minutes`
                            }
                        </div>
                    </div>

                    <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-5">
                        <div className="text-white/40 text-sm mb-2">Last checked at</div>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                            {timeAgoString}
                        </div>
                    </div>

                    <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-5">
                        <div className="text-white/40 text-sm mb-2">Incidents (24h)</div>
                        <div className="text-2xl font-bold text-white">{stats.incidents_24h}</div>
                    </div>
                </div>

                {/* Response Time Graph */}
                <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white/60 font-medium">Response times</h2>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="bg-transparent border-[#2D3748] text-white hover:bg-[#2D3748] hover:text-white gap-2">
                                <span className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center p-0.5">
                                    <span className="w-full h-full rounded-full bg-blue-500"></span>
                                </span>
                                Europe
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </Button>
                        </div>
                        <div className="flex bg-[#0B0C15] rounded-md p-1 border border-[#2D3748]">
                            {['Day', 'Week', 'Month'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-1 rounded text-sm transition-colors ${timeRange === range
                                        ? 'bg-[#2D3748] text-white'
                                        : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] w-full" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="#4A5568"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#4A5568"
                                    fontSize={12}
                                    unit="ms"
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748', borderRadius: '8px', color: '#fff' }}
                                    cursor={{ stroke: '#4A5568', strokeWidth: 1 }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(
                                        value: any,
                                        name: any,
                                        item: any
                                    ) => {

                                        if (item && item.payload && item.payload.status === 'down') {
                                            return ['Down', 'Response Time'];
                                        }
                                        return [
                                            typeof value === 'number' ? `${value}ms` : '--',
                                            'Response Time',
                                        ];
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="response_time"
                                    stroke="#5850ec"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#5850ec', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Availability Table */}
                <div className="bg-[#13141F] border border-[#1E293B] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#2D3748]">
                                <th className="py-4 px-6 text-white/60 font-medium">Time period</th>
                                <th className="py-4 px-6 text-white/60 font-medium md:text-right">Availability</th>
                                <th className="py-4 px-6 text-white/60 font-medium text-right">Downtime</th>
                                <th className="py-4 px-6 text-white/60 font-medium text-right">Incidents</th>
                                <th className="py-4 px-6 text-white/60 font-medium text-right hidden md:table-cell">Longest incident</th>
                                <th className="py-4 px-6 text-white/60 font-medium text-right hidden md:table-cell">Avg. incident</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-[#2D3748] hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">Today</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right">{stats.uptime_24h.toFixed(4)}%</td>
                                <td className="py-4 px-6 text-white text-right">{stats.uptime_24h < 100 ? 'Yes' : 'none'}</td>
                                <td className="py-4 px-6 text-white text-right">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="border-b border-[#2D3748] hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">Last 7 days</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right">{stats.uptime_24h.toFixed(4)}%</td> {/* Placeholder for 7d */}
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="border-b border-[#2D3748] hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">Last 30 days</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right">{stats.uptime_24h.toFixed(4)}%</td> {/* Placeholder for 30d */}
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">All time</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right">{stats.uptime_24h.toFixed(4)}%</td>
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="p-4 border-t border-[#2D3748] flex flex-col md:flex-row items-center gap-4 bg-[#0B0C15]/50">
                        <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">From</span>
                            <div className="bg-[#13141F] border border-[#2D3748] rounded px-3 py-1.5 flex items-center gap-2 text-white text-sm">
                                <Calendar className="w-4 h-4 text-white/60" />
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">To</span>
                            <div className="bg-[#13141F] border border-[#2D3748] rounded px-3 py-1.5 flex items-center gap-2 text-white text-sm">
                                <Calendar className="w-4 h-4 text-white/60" />
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                        <Button variant="secondary" className="bg-[#2D3748] text-white hover:bg-[#4A5568] ml-auto">
                            Calculate
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/60">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
