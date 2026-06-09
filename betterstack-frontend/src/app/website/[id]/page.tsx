'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { useParams, useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
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
    uptime_7d: number | null;
    uptime_30d: number | null;
    incidents_24h: number;
    avg_response_time_24h: number;
}

interface WebsiteBucket {
    bucket: string;
    avg_response_time: number;
    down_count: number;
}

interface ComparisonLine {
    region: string;
    dataKey: string;
    color: string;
}

interface ComparisonPoint {
    time: number;
    [dataKey: string]: number | string;
}

interface WebsiteDetails {
    id: string;
    url: string;
    user_id: string;
    regions: string[];
    recent_ticks: TickInfo[];
    stats: WebsiteStats;
    graph_data: WebsiteBucket[];
    streak?: number;
    created_at: string;
}

const COMPARE_REGIONS = '__compare_regions__';
const FALLBACK_REGION_COLORS = ['#6871E1', '#22D3EE', '#F472B6', '#34D399'];

const REGION_LABELS: Record<string, string> = {
    'blr': 'BLR',
    'worker-blr': 'BLR',
    'banglore-1': 'BLR',
    'bangalore-1': 'BLR',
    'india-mumbai': 'India',
    'india-1': 'India',
    'sf': 'SF',
    'sfo': 'SF',
    'worker-sf': 'SF',
    'worker-sfo': 'SF',
    'san-francisco': 'SF',
    'us-west-1': 'SF',
};

function labelRegion(regionId: string) {
    return REGION_LABELS[regionId] || regionId;
}

function regionColor(regionId: string, index: number) {
    const normalized = regionId.toLowerCase();
    if (normalized.includes('sfo') || normalized.includes('sf') || normalized.includes('san-francisco')) {
        return '#E8AB3A';
    }
    if (normalized.includes('blr') || normalized.includes('bangalore') || normalized.includes('banglore')) {
        return '#8CC4F1';
    }
    return FALLBACK_REGION_COLORS[index % FALLBACK_REGION_COLORS.length];
}

export default function WebsiteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.websiteId || params.id;
    const [website, setWebsite] = useState<WebsiteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('Day');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [comparisonData, setComparisonData] = useState<ComparisonPoint[]>([]);
    const [comparisonLines, setComparisonLines] = useState<ComparisonLine[]>([]);
    const [comparisonSummaryRegion, setComparisonSummaryRegion] = useState('');

    const regions = (website?.regions ?? []).map((regionId) => ({
            id: regionId,
            name: labelRegion(regionId),
        }));

    const rangeToDays: Record<string, number> = {
        'Day': 1,
        'Week': 7,
        'Month': 30
    };

    useEffect(() => {
        if (id) {
            fetchWebsiteDetails();
            const interval = setInterval(() => fetchWebsiteDetails(), 10000);
            return () => clearInterval(interval);
        }
    }, [id, timeRange, selectedRegion, startDate, endDate]);

    const fetchWebsiteDetails = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/user/signin');
            return;
        }

        try {
            const createParams = (region?: string) => {
                const params = new URLSearchParams();
                if (startDate && endDate) {
                    params.append('start', new Date(startDate).toISOString());
                    params.append('end', new Date(endDate).toISOString());
                } else {
                    params.append('days', rangeToDays[timeRange].toString());
                }
                if (region) params.append('region', region);
                return params;
            };

            if (selectedRegion === COMPARE_REGIONS && website && website.regions.length > 1) {
                const responses = await Promise.all(
                    website.regions.map((region) =>
                        axios.get<WebsiteDetails>(`${BACKEND_URL}/website/${id}?${createParams(region).toString()}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                    )
                );

                const lines = website.regions.map((region, index) => ({
                    region,
                    dataKey: `region_${index}`,
                    color: regionColor(region, index),
                }));
                const mergedPoints = new Map<number, ComparisonPoint>();

                responses.forEach((response, regionIndex) => {
                    response.data.graph_data.forEach((bucket) => {
                        const time = new Date(bucket.bucket + 'Z').getTime();
                        const point = mergedPoints.get(time) || { time };
                        point[lines[regionIndex].dataKey] = bucket.down_count > 0 ? 0 : bucket.avg_response_time;
                        mergedPoints.set(time, point);
                    });
                });

                setWebsite(responses[0].data);
                setComparisonSummaryRegion(website.regions[0]);
                setComparisonLines(lines);
                setComparisonData(Array.from(mergedPoints.values()).sort((a, b) => a.time - b.time));
            } else {
                const response = await axios.get(`${BACKEND_URL}/website/${id}?${createParams(selectedRegion || undefined).toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const websiteDetails = response.data as WebsiteDetails;
                setWebsite(websiteDetails);
                setComparisonSummaryRegion('');
                setComparisonLines([]);
                setComparisonData([]);
                if (!selectedRegion && websiteDetails.regions.length > 0) {
                    setSelectedRegion(websiteDetails.regions[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch website details:', err);
            setError('Failed to load website details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0B0D15]">
                <DashboardSidebar
                    mobileOpen={mobileSidebarOpen}
                    onMobileOpen={() => setMobileSidebarOpen(true)}
                    onMobileClose={() => setMobileSidebarOpen(false)}
                />
                <div className="flex min-h-screen items-center justify-center lg:ml-[272px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6871E1]"></div>
                </div>
            </div>
        );
    }

    if (error || !website) {
        return (
            <div className="min-h-screen bg-[#0B0D15]">
                <DashboardSidebar
                    mobileOpen={mobileSidebarOpen}
                    onMobileOpen={() => setMobileSidebarOpen(true)}
                    onMobileClose={() => setMobileSidebarOpen(false)}
                />
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 lg:ml-[272px]">
                    <p className="text-red-400">{error || 'Website not found'}</p>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">Back to Dashboard</Button>
                </div>
            </div>
        );
    }


    const ticks = website.recent_ticks || [];
    const latestTick = ticks[0];
    const stats = website.stats || { uptime_24h: 100, incidents_24h: 0, avg_response_time_24h: 0 };

    const streakSeconds = (website.streak && website.streak > 0)
        ? website.streak
        : Math.floor((new Date().getTime() - new Date(website.created_at + (website.created_at.endsWith("Z") ? "" : "Z")).getTime()) / 1000);
    const isDateLimit = false;

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };
    
    const formatStreak = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ${mins % 60}m`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    };

    const lastCheckedDate = latestTick ? new Date(latestTick.created_at + "Z") : null;
    const lastCheckedString = formatTimeAgo(lastCheckedDate);
    const currentStatus = !latestTick ? 'Checking' : latestTick.status === 'up' ? 'Up' : 'Down';


    const singleRegionChartData = (website?.graph_data || []).map((bucket) => {
        const date = new Date(bucket.bucket + "Z");

        return {
            time: date.getTime(),
            response_time: bucket.down_count > 0 ? 0 : bucket.avg_response_time,
            status: bucket.down_count > 0 ? 'down' : 'up',
        };
    });
    const chartData = selectedRegion === COMPARE_REGIONS ? comparisonData : singleRegionChartData;



    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this monitor? All history will be lost.')) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${BACKEND_URL}/website/${website.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push('/dashboard');
            toast.success("Monitor deleted successfully");
        } catch (err) {
            toast.error('Failed to delete website');
        }
    };

    const handleSendTestAlert = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${BACKEND_URL}/website/${id}/alert-test`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                alert('Test alert sent successfully!');
            }
        } catch (err: any) {
            console.error('Failed to send test alert:', err);
            toast.error(err.response?.data?.message || 'Failed to send test alert');
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0D15] text-white font-sans">
            <DashboardSidebar
                mobileOpen={mobileSidebarOpen}
                onMobileOpen={() => setMobileSidebarOpen(true)}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            <main className="px-4 pb-8 pt-20 sm:px-6 lg:ml-[272px] lg:px-8 lg:pt-8">
                <div className="mx-auto max-w-7xl">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent text-white/40 hover:text-white text-sm h-auto py-0"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="w-3 h-3 mr-2" />
                    Back to Dashboard
                </Button>


                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className={`mt-2 w-3 h-3 rounded-full ${ticks.length === 0 ? 'bg-yellow-500 animate-pulse' : latestTick?.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                            <h1 className="text-3xl font-bold truncate" title={website.url}>{website.url}</h1>
                            <div className="flex items-center gap-2 text-sm mt-1">
                                <span className={`font-medium uppercase ${latestTick?.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                    {ticks.length === 0 ? 'Checking…' : latestTick?.status}
                                </span>
                                <span className="text-green-400">•</span>

                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/60">
                        <button onClick={handleSendTestAlert} className="flex items-center gap-2 rounded-lg bg-[#6871E1] px-3 py-2 text-white transition-colors hover:bg-[#5861cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6871E1]" aria-label="Send test alert">
                            <Send className="w-4 h-4" />
                            Send test alert
                        </button>
                        <button className="flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1" aria-label="Incidents">
                            <AlertTriangle className="w-4 h-4" />
                            Incidents
                        </button>
                        <span className="text-white/10">|</span>
                        <button className="flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1" aria-label="Pause monitor">
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                        <Button variant="destructive" onClick={handleDelete} className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white focus-visible:ring-2 focus-visible:ring-red-500">
                            Delete Monitor
                        </Button>
                        <button className="flex items-center gap-2 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1" aria-label="Configure settings">
                            <Settings className="w-4 h-4" />
                            Configure
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-5">
                        <div className="text-white/40 text-sm mb-2">Currently {currentStatus} for</div>
                        <div className="text-2xl font-bold text-white">
                            {isDateLimit && <span className="text-white/40 text-lg">&gt;</span>}
                            {formatStreak(streakSeconds)}
                        </div>
                    </div>

                    <div className="bg-[#13141F] border border-[#1E293B] rounded-lg p-5">
                        <div className="text-white/40 text-sm mb-2">Last checked at</div>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                            {
                                isLoading ? (
                                    <span className='text-white/20'>...</span>
                                ) : (
                                    lastCheckedString
                                )
                            }
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
                        <div>
                            <h2 className="text-white/60 font-medium">Response times</h2>
                            <p className="mt-1 text-xs text-white/30">
                                {selectedRegion === COMPARE_REGIONS
                                    ? `Comparing ${comparisonLines.map((line) => labelRegion(line.region)).join(' and ')}. Summary cards use ${labelRegion(comparisonSummaryRegion)}.`
                                    : selectedRegion
                                        ? `Showing real checks from ${labelRegion(selectedRegion)}`
                                        : 'Waiting for worker data'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 relative"> {/* Added 'relative' here */}
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                disabled={regions.length === 0}
                                className="appearance-none bg-[#13141F] border border-[#2D3748] text-white hover:bg-[#2D3748] rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                {regions.length === 0 && <option value="">No worker data yet</option>}
                                {regions.length > 1 && <option value={COMPARE_REGIONS}>Compare</option>}
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 pointer-events-none" />
                        </div>
                        <div className="flex bg-[#0B0C15] rounded-md p-1 border border-[#2D3748]">
                            {['Day', 'Week', 'Month'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className={`px-4 py-1 rounded text-sm transition-colors ${timeRange === range && !startDate
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
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    stroke="#4A5568"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        if (timeRange === 'Day') {
                                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }
                                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                    }}
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
                                    labelFormatter={(label) => new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    formatter={(
                                        value: any,
                                        name: any,
                                        item: any
                                    ) => {
                                        if (selectedRegion === COMPARE_REGIONS) {
                                            const line = comparisonLines.find((entry) => entry.dataKey === name);
                                            return [
                                                typeof value === 'number' ? `${Math.round(value)}ms` : '--',
                                                line ? labelRegion(line.region) : name,
                                            ];
                                        }
                                        if (item && item.payload && item.payload.status === 'down') {
                                            return ['Down', 'Response Time'];
                                        }
                                        return [
                                            typeof value === 'number' ? `${Math.round(value)}ms` : '--',
                                            'Response Time',
                                        ];
                                    }}
                                />
                                {selectedRegion === COMPARE_REGIONS ? (
                                    comparisonLines.map((line) => (
                                        <Line
                                            key={line.region}
                                            type="monotone"
                                            dataKey={line.dataKey}
                                            name={line.dataKey}
                                            stroke={line.color}
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                            activeDot={{ r: 4, fill: line.color, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    ))
                                ) : (
                                    <Line
                                        type="monotone"
                                        dataKey="response_time"
                                        stroke="#6871E1"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: '#6871E1', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {selectedRegion === COMPARE_REGIONS && (
                        <div className="mt-4 flex flex-wrap gap-4 border-t border-white/[0.06] pt-4">
                            {comparisonLines.map((line) => (
                                <div key={line.region} className="flex items-center gap-2 text-xs text-white/50">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                                    {labelRegion(line.region)}
                                </div>
                            ))}
                        </div>
                    )}
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
                                <td className="py-4 px-6 text-white font-bold md:text-right tabular-nums">

                                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'percent' }).format((stats.uptime_24h / 100) / 100)}                                </td>
                                <td className="py-4 px-6 text-white text-right">{website.stats.uptime_24h < 100 ? 'Yes' : 'none'}</td>
                                <td className="py-4 px-6 text-white text-right tabular-nums">{website.stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="border-b border-[#2D3748] hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">Last 7 days</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right tabular-nums">
                                    {typeof stats.uptime_7d === 'number'
                                        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'percent' }).format(stats.uptime_7d / 100)
                                        : '-'}
                                </td>
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right tabular-nums">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="border-b border-[#2D3748] hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">Last 30 days</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right tabular-nums">
                                    {typeof stats.uptime_30d === 'number'
                                        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'percent' }).format(stats.uptime_30d / 100)
                                        : '-'}
                                </td>
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right tabular-nums">{stats.incidents_24h}</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                                <td className="py-4 px-6 text-white text-right hidden md:table-cell">none</td>
                            </tr>
                            <tr className="hover:bg-[#1A202C]">
                                <td className="py-4 px-6 text-white font-medium">All time</td>
                                <td className="py-4 px-6 text-white font-bold md:text-right tabular-nums">
                                    {typeof stats.uptime_30d === 'number'
                                        ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'percent' }).format(stats.uptime_30d / 100)
                                        : '-'}
                                </td>
                                <td className="py-4 px-6 text-white text-right">none</td>
                                <td className="py-4 px-6 text-white text-right tabular-nums">{stats.incidents_24h}</td>
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
                                <input
                                    type="datetime-local"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-white text-sm w-[180px]"
                                    aria-label="Start date"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm">To</span>
                            <div className="bg-[#13141F] border border-[#2D3748] rounded px-3 py-1.5 flex items-center gap-2 text-white text-sm">
                                <Calendar className="w-4 h-4 text-white/60" />
                                <input
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-white text-sm w-[180px]"
                                    aria-label="End date"
                                />
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            className="bg-[#2D3748] text-white hover:bg-[#4A5568] ml-auto"
                            onClick={() => fetchWebsiteDetails()}
                        >
                            Calculate
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" aria-label="More options">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                </div>
            </main >
        </div >
    );
}
