'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { useTheme } from '@/lib/use-theme';
import { BACKEND_URL } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
    AlertTriangle,
    ChevronDown,
    Send,
    MoreHorizontal,
    Calendar,
    ArrowLeft,
    Pause,
    Play,
    Trash2,
    ExternalLink,
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
    name?: string | null;
}

const COMPARE_REGIONS = '__compare_regions__';
const DEFAULT_REGION = 'india-mumbai';
const FALLBACK_REGION_COLORS = ['#0872F0', '#22D3EE', '#F472B6', '#34D399'];

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
    'us-san-francisco': 'SF',
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
    if (
        normalized.includes('blr')
        || normalized.includes('bangalore')
        || normalized.includes('banglore')
        || normalized.includes('india')
        || normalized.includes('mumbai')
    ) {
        return '#8CC4F1';
    }
    return FALLBACK_REGION_COLORS[index % FALLBACK_REGION_COLORS.length];
}

function prettyHost(url: string) {
    try {
        return new URL(url).host;
    } catch {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
}

function toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WebsiteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.websiteId || params.id;
    const [website, setWebsite] = useState<WebsiteDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('Day');
    const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const { theme, toggleTheme } = useTheme();
    const [comparisonData, setComparisonData] = useState<ComparisonPoint[]>([]);
    const [comparisonLines, setComparisonLines] = useState<ComparisonLine[]>([]);
    const [comparisonSummaryRegion, setComparisonSummaryRegion] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const selectedRegionRef = useRef(selectedRegion);
    const requestSequenceRef = useRef(0);

    const isDark = theme === 'dark';
    const chartGridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)';
    const chartAxisStroke = isDark ? 'rgba(255,255,255,0.45)' : '#64748b';
    const chartTooltipStyle = {
        backgroundColor: isDark ? 'rgba(13,15,23,0.96)' : 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}`,
        borderRadius: '12px',
        color: isDark ? '#fff' : '#0b1220',
        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
    };

    const regions = (website?.regions ?? []).map((regionId) => ({
        id: regionId,
        name: labelRegion(regionId),
    }));

    const rangeToDays: Record<string, number> = { 'Day': 1, 'Week': 7, 'Month': 30 };

    useEffect(() => {
        selectedRegionRef.current = selectedRegion;

        if (id) {
            fetchWebsiteDetails(selectedRegion);
            const interval = setInterval(() => fetchWebsiteDetails(selectedRegion), 10000);
            return () => {
                clearInterval(interval);
                requestSequenceRef.current += 1;
            };
        }
    }, [id, timeRange, selectedRegion, startDate, endDate]);

    const fetchWebsiteDetails = async (requestedRegion = selectedRegionRef.current) => {
        const requestSequence = ++requestSequenceRef.current;
        const isCurrentRequest = () => (
            requestSequence === requestSequenceRef.current
            && requestedRegion === selectedRegionRef.current
        );
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

            if (requestedRegion === COMPARE_REGIONS && website && website.regions.length > 1) {
                const responses = await Promise.all(
                    website.regions.map((region) =>
                        axios.get<WebsiteDetails>(`${BACKEND_URL}/website/${id}?${createParams(region).toString()}`, {
                            headers: { Authorization: `Bearer ${token}` },
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
                        point[lines[regionIndex].dataKey] = bucket.avg_response_time;
                        mergedPoints.set(time, point);
                    });
                });

                if (!isCurrentRequest()) return;
                setWebsite(responses[0].data);
                setError(null);
                setComparisonSummaryRegion(website.regions[0]);
                setComparisonLines(lines);
                setComparisonData(Array.from(mergedPoints.values()).sort((a, b) => a.time - b.time));
            } else {
                const response = await axios.get(`${BACKEND_URL}/website/${id}?${createParams(requestedRegion || undefined).toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const websiteDetails = response.data as WebsiteDetails;
                if (!isCurrentRequest()) return;
                setWebsite(websiteDetails);
                setError(null);
                setComparisonSummaryRegion('');
                setComparisonLines([]);
                setComparisonData([]);
                if (!websiteDetails.regions.includes(requestedRegion) && websiteDetails.regions.length > 0) {
                    selectedRegionRef.current = websiteDetails.regions[0];
                    setSelectedRegion(websiteDetails.regions[0]);
                }
            }
        } catch (err) {
            if (!isCurrentRequest()) return;
            console.error('Failed to fetch website details:', err);
            setError('Failed to load website details');
        } finally {
            if (isCurrentRequest()) {
                setIsLoading(false);
            }
        }
    };

    const Frame = ({ children }: { children: React.ReactNode }) => (
        <div className={theme === 'dark' ? 'dark' : ''}>
            <div className="website-detail-shell app-canvas relative min-h-screen font-sans" style={{ color: 'var(--text)' }}>
                <DashboardSidebar
                    mobileOpen={mobileNav}
                    onMobileOpen={() => setMobileNav(true)}
                    onMobileClose={() => setMobileNav(false)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
                <main className="website-detail-main relative z-10 lg:ml-[260px]">
                    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8 sm:py-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <Frame>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                </div>
            </Frame>
        );
    }

    if (error || !website) {
        return (
            <Frame>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                    <p className="text-[var(--down)]">{error || 'Website not found'}</p>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                        className="border-[var(--line)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                    >
                        Back to dashboard
                    </Button>
                </div>
            </Frame>
        );
    }

    const ticks = website.recent_ticks || [];
    const latestTick = ticks[0];
    const stats = website.stats || { uptime_24h: 100, incidents_24h: 0, avg_response_time_24h: 0, uptime_7d: null, uptime_30d: null };

    const streakSeconds = (website.streak && website.streak > 0)
        ? website.streak
        : Math.floor((new Date().getTime() - new Date(website.created_at + (website.created_at.endsWith('Z') ? '' : 'Z')).getTime()) / 1000);

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds} sec`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr`;
        return `${Math.floor(diffInSeconds / 86400)} day`;
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

    const lastCheckedDate = latestTick ? new Date(latestTick.created_at + 'Z') : null;
    const lastCheckedString = formatTimeAgo(lastCheckedDate);
    const currentStatus = isPaused ? 'Paused' : !latestTick ? 'Checking' : latestTick.status === 'up' ? 'Up' : 'Down';
    const workerIsActive = lastCheckedDate
        ? Date.now() - lastCheckedDate.getTime() < 90_000
        : false;

    const createdAtInput = toLocalInput(
        new Date(website.created_at + (website.created_at.endsWith('Z') ? '' : 'Z'))
    );
    const nowInput = toLocalInput(new Date());

    const singleRegionChartData = (website?.graph_data || []).map((bucket) => {
        const date = new Date(bucket.bucket + 'Z');
        return {
            time: date.getTime(),
            response_time: bucket.avg_response_time,
            status: bucket.down_count > 0 ? 'down' : 'up',
        };
    });
    const chartData = selectedRegion === COMPARE_REGIONS ? comparisonData : singleRegionChartData;

    const handleDelete = async () => {
        setIsDeleting(true);
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${BACKEND_URL}/website/${website.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            router.push('/dashboard');
            toast.success('Site deleted');
        } catch (err: any) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.message || err?.response?.data || err?.message || 'Unknown error';
            console.error('Delete failed:', status, detail);
            toast.error(`Delete failed${status ? ` (${status})` : ''}: ${typeof detail === 'string' ? detail : 'see console'}`);
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    const handleSendTestAlert = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`${BACKEND_URL}/website/${id}/alert-test`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.status === 'success') {
                toast.success('Test alert sent');
            }
        } catch (err: any) {
            console.error('Failed to send test alert:', err);
            toast.error(err.response?.data?.message || 'Failed to send test alert');
        }
    };

    const statusDot = isPaused
        ? 'var(--text-faint)'
        : ticks.length === 0
            ? 'var(--warn)'
            : latestTick?.status === 'up'
                ? 'var(--ok)'
                : 'var(--down)';
    const statusLabel = isPaused ? 'Paused' : ticks.length === 0 ? 'Checking…' : latestTick?.status === 'up' ? 'Operational' : 'Incident';

    return (
        <Frame>
            <Button
                variant="ghost"
                className="website-detail-header-text mb-5 h-auto py-0 pl-0 text-[12px] hover:bg-transparent"
                onClick={() => router.push('/dashboard')}
            >
                <ArrowLeft className="mr-1.5 h-3 w-3" />
                Back to dashboard
            </Button>

            {/* Header */}
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                    <span className="relative mt-2 flex h-3 w-3 shrink-0">
                        {!isPaused && latestTick?.status === 'up' && (
                            <span className="absolute inset-0 animate-ping rounded-full opacity-50" style={{ background: statusDot }} />
                        )}
                        <span
                            className="relative h-3 w-3 rounded-full"
                            style={{ background: statusDot, boxShadow: `0 0 10px ${statusDot}` }}
                        />
                    </span>
                    <div className="min-w-0">
                        <p className="website-detail-header-text font-mono text-[10px] uppercase tracking-[0.18em]">
                            {website.name ? prettyHost(website.url) : 'Site'}
                        </p>
                        <h1 className="website-detail-domain mt-1 flex items-center gap-3 text-[2.5rem] font-semibold leading-tight tracking-[-0.035em]">
                            <span className="truncate" title={website.url}>{website.name || prettyHost(website.url)}</span>
                            <a
                                href={website.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                aria-label={`Open ${website.name || prettyHost(website.url)} in a new tab`}
                                className="website-detail-header-text group/ext grid h-7 w-7 shrink-0 place-items-center rounded-md transition"
                            >
                                <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover/ext:-translate-y-[2px] group-hover/ext:translate-x-[2px]" />
                            </a>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Primary group */}
                    <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1">
                        <ToolbarButton onClick={handleSendTestAlert} icon={<Send className="h-3.5 w-3.5" />} label="Send test alert" />
                        <div className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--text-muted)]">
                            <AlertTriangle className={`h-3.5 w-3.5 ${stats.incidents_24h > 0 ? 'text-[var(--down)]' : ''}`} />
                            <span>Incidents</span>
                            <span
                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
                                    stats.incidents_24h > 0
                                        ? 'bg-[var(--down-soft)] text-[var(--down)]'
                                        : 'bg-[var(--surface-2)] text-[var(--text-faint)]'
                                }`}
                            >
                                {stats.incidents_24h}
                            </span>
                        </div>
                        <ToolbarButton
                            onClick={() => {
                                setIsPaused((p) => !p);
                                toast.info(isPaused ? 'Resumed (UI preview)' : 'Paused (UI preview)');
                            }}
                            icon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                            label={isPaused ? 'Resume' : 'Pause'}
                        />
                    </div>

                    {/* Danger separated */}
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--down)]/25 bg-[var(--down-soft)] px-3 text-[13px] font-medium text-[var(--down)] transition hover:bg-[var(--down)] hover:text-white"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            {confirmDelete && (
                <DeleteConfirmModal
                    isDeleting={isDeleting}
                    onCancel={() => setConfirmDelete(false)}
                    onConfirm={handleDelete}
                />
            )}

            {/* KPI cards */}
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <KpiCard label={`Endpoint ${currentStatus.toLowerCase()} for`} value={formatStreak(streakSeconds)} accent={statusDot} />
                <KpiCard label={workerIsActive ? 'Worker active · last checked' : 'Worker delayed · last checked'} value={isLoading ? '…' : lastCheckedString} />
                <KpiCard
                    label="Incidents (24h)"
                    value={String(stats.incidents_24h)}
                    emphasize={stats.incidents_24h > 0}
                />
            </div>

            {/* Response Time chart */}
            <div className="mb-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">Response times</p>
                        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                            {selectedRegion === COMPARE_REGIONS
                                ? `Comparing ${comparisonLines.map((line) => labelRegion(line.region)).join(' and ')}. Cards reflect ${labelRegion(comparisonSummaryRegion)}.`
                                : selectedRegion
                                    ? `${workerIsActive ? 'Worker active' : 'Worker delayed'} · Endpoint latency from ${labelRegion(selectedRegion)}`
                                    : 'Waiting for worker data'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={selectedRegion}
                                onChange={(e) => {
                                    selectedRegionRef.current = e.target.value;
                                    requestSequenceRef.current += 1;
                                    setSelectedRegion(e.target.value);
                                }}
                                disabled={regions.length === 0}
                                className="h-9 cursor-pointer appearance-none rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 pr-9 text-[13px] text-[var(--text)] outline-none transition hover:border-[var(--line-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] disabled:opacity-50"
                            >
                                {regions.length === 0 && <option value="">No worker data yet</option>}
                                {regions.length > 1 && <option value={COMPARE_REGIONS}>Compare</option>}
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-faint)]" />
                        </div>
                        <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
                            {['Day', 'Week', 'Month'].map((range) => {
                                const active = timeRange === range && !startDate;
                                return (
                                    <button
                                        key={range}
                                        onClick={() => {
                                            setTimeRange(range);
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                                            active
                                                ? 'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_0_rgba(0,0,0,0.04)]'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                                        }`}
                                    >
                                        {range}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-5 py-5">
                    <div className="h-[280px] w-full" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    stroke={chartAxisStroke}
                                    fontSize={11}
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
                                    stroke={chartAxisStroke}
                                    fontSize={11}
                                    unit="ms"
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    cursor={{ stroke: 'rgba(8, 114, 240, 0.4)', strokeWidth: 1 }}
                                    itemStyle={{ color: isDark ? '#fff' : '#0b1220' }}
                                    labelFormatter={(label) => new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    formatter={(value: any, name: any, item: any) => {
                                        if (selectedRegion === COMPARE_REGIONS) {
                                            const line = comparisonLines.find((entry) => entry.dataKey === name);
                                            return [
                                                typeof value === 'number' ? `${Math.round(value)}ms` : '--',
                                                line ? labelRegion(line.region) : name,
                                            ];
                                        }
                                        if (item && item.payload && item.payload.status === 'down') {
                                            return [
                                                typeof value === 'number' ? `${Math.round(value)}ms` : '--',
                                                'Down check latency',
                                            ];
                                        }
                                        return [
                                            typeof value === 'number' ? `${Math.round(value)}ms` : '--',
                                            'Response time',
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
                                            isAnimationActive={false}
                                            activeDot={{ r: 4, fill: line.color, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    ))
                                ) : (
                                    <Line
                                        type="monotone"
                                        dataKey="response_time"
                                        stroke="#8CC4F1"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                        activeDot={{ r: 4, fill: '#8CC4F1', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {selectedRegion === COMPARE_REGIONS && (
                        <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--line-soft)] pt-4">
                            {comparisonLines.map((line) => (
                                <div key={line.region} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color, boxShadow: `0 0 8px ${line.color}` }} />
                                    {labelRegion(line.region)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Availability table */}
            <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <div className="border-b border-[var(--line)] px-5 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Availability</p>
                </div>
                <table className="w-full text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-[var(--line-soft)]">
                            <Th>Time period</Th>
                            <Th align="right">Availability</Th>
                            <Th align="right">Incidents</Th>
                        </tr>
                    </thead>
                    <tbody>
                        <Row period="Today" availability={typeof stats.uptime_24h === 'number' ? stats.uptime_24h / 100 : null} incidents={stats.incidents_24h} />
                        <Row period="Last 7 days" availability={typeof stats.uptime_7d === 'number' ? stats.uptime_7d / 100 : null} incidents={stats.incidents_24h} />
                        <Row period="Last 30 days" availability={typeof stats.uptime_30d === 'number' ? stats.uptime_30d / 100 : null} incidents={stats.incidents_24h} last />
                    </tbody>
                </table>

                <div className="flex flex-col items-stretch gap-3 border-t border-[var(--line)] bg-[var(--surface-2)] p-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">From</span>
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[var(--text-faint)]" />
                            <input
                                type="datetime-local"
                                value={startDate}
                                min={createdAtInput}
                                max={endDate || nowInput}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[170px] border-none bg-transparent text-[12px] text-[var(--text)] outline-none"
                                aria-label="Start date"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">To</span>
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[var(--text-faint)]" />
                            <input
                                type="datetime-local"
                                value={endDate}
                                min={startDate || createdAtInput}
                                max={nowInput}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[170px] border-none bg-transparent text-[12px] text-[var(--text)] outline-none"
                                aria-label="End date"
                            />
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        className="website-detail-calculate ml-auto h-9 rounded-lg px-3 text-[13px] font-semibold"
                        onClick={() => fetchWebsiteDetails()}
                        style={{
                            background: 'linear-gradient(180deg, #1d8aff 0%, #0872F0 100%)',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px rgba(8, 114, 240, 0.30)',
                        }}
                    >
                        Calculate
                    </Button>
                    <Button variant="ghost" size="icon" className="text-[var(--text-faint)] hover:bg-[var(--surface)] hover:text-[var(--text)]" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Frame>
    );
}

function ToolbarButton({
    onClick,
    icon,
    label,
}: {
    onClick?: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
            {icon}
            {label}
        </button>
    );
}

function KpiCard({
    label,
    value,
    accent,
    emphasize,
}: {
    label: string;
    value: string;
    accent?: string;
    emphasize?: boolean;
}) {
    return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div className="flex items-center gap-2">
                {accent && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                )}
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">{label}</p>
            </div>
            <p
                className={`mt-2 font-mono text-[26px] font-semibold leading-none tabular-nums ${
                    emphasize ? 'text-[var(--down)]' : 'website-detail-data-value'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function Th({
    children,
    align,
    className = '',
}: {
    children: React.ReactNode;
    align?: 'right' | 'left';
    className?: string;
}) {
    return (
        <th
            className={`px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-faint)] ${
                align === 'right' ? 'text-right' : 'text-left'
            } ${className}`}
        >
            {children}
        </th>
    );
}

function Row({
    period,
    availability,
    incidents,
    last,
}: {
    period: string;
    availability: number | null;
    incidents: number;
    last?: boolean;
}) {
    const fmt = useMemo(
        () => new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4, style: 'percent' }),
        []
    );
    return (
        <tr className={`${last ? '' : 'border-b border-[var(--line-soft)]'} transition hover:bg-[var(--surface-2)]`}>
            <td className="website-detail-data-value px-5 py-3.5 font-medium">{period}</td>
            <td className="website-detail-data-value px-5 py-3.5 text-right font-semibold tabular-nums">
                {availability == null ? '—' : fmt.format(availability)}
            </td>
            <td className="website-detail-data-value px-5 py-3.5 text-right tabular-nums">{incidents}</td>
        </tr>
    );
}

function DeleteConfirmModal({
    isDeleting,
    onCancel,
    onConfirm,
}: {
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
            style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm overflow-hidden rounded-2xl border bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                style={{
                    borderColor: 'rgba(220, 38, 38, 0.30)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(220, 38, 38, 0.18)',
                }}
            >
                <div className="mb-5 flex items-start gap-3">
                    <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ background: 'var(--down-soft)', color: 'var(--down)' }}
                    >
                        <Trash2 className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Confirm</p>
                        <h3 className="mt-1 text-[16px] font-semibold leading-snug text-[var(--text)]">
                            Are you sure you want to delete this?
                        </h3>
                    </div>
                </div>

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[var(--line)] bg-transparent text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--down)]/30 bg-[var(--down-soft)] text-[13px] font-medium text-[var(--down)] transition hover:bg-[var(--down)] hover:text-white disabled:opacity-60"
                    >
                        {isDeleting ? (
                            <span
                                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                            />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {isDeleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
