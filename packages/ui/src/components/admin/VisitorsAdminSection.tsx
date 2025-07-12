'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { BarChart, Loader2, Users } from 'lucide-react';

interface DailyStat {
    date: string;
    totalVisitors: number;
    uniqueVisitors: number;
}

interface VisitorStats {
    daily: DailyStat[];
    total: number;
    total_unique: number;
}

export function VisitorsAdminSection() {
    const [stats, setStats] = useState<VisitorStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [url, setUrl] = useState('/');
    
    const [currentRange, setCurrentRange] = useState<string>('last_7_days');

    const handleDateRangeSelect = (range: string) => {
        setCurrentRange(range);
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today);

        switch (range) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'last_7_days':
                start.setDate(today.getDate() - 6);
                break;
            case 'last_30_days':
                start.setDate(today.getDate() - 29);
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                start = new Date(end.getFullYear(), end.getMonth(), 1);
                break;
            case 'custom':
                return; // Custom range is handled by date inputs directly
            default:
                break;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const validateAndFetch = async () => {
        if (!url.trim()) {
            setError('URL field is required.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            setError('Start date cannot be after end date.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetchJsonPost('/api/admin/visitors', {
                start_date: startDate,
                end_date: endDate,
                url: url
            });
            setStats(response.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
            sendClientErrorEmail('Failed to fetch visitor stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        validateAndFetch();
    }, []);

    const sortedStats = useMemo(() => {
        if (!stats?.daily) return [];
        return [...stats.daily].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stats]);


    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-6">Visitor Statistics</h3>

            <div className="bg-neutral-900/70 rounded-lg p-4 mb-6 border border-neutral-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Date Range
                        </label>
                        <select
                            value={currentRange}
                            onChange={(e) => handleDateRangeSelect(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last_7_days">Last 7 Days</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setCurrentRange('custom'); }}
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setCurrentRange('custom'); }}
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            URL <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="/knjiga"
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <button
                            onClick={validateAndFetch}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Fetch Stats'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            </div>

            {loading && !stats ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-6 rounded-lg flex items-center gap-4 border border-purple-500/30">
                            <Users className="w-10 h-10 text-purple-400" />
                            <div>
                                <p className="text-sm text-purple-300">Total Visits</p>
                                <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 p-6 rounded-lg flex items-center gap-4 border border-green-500/30">
                            <Users className="w-10 h-10 text-green-400" />
                            <div>
                                <p className="text-sm text-green-300">Unique Visitors</p>
                                <p className="text-3xl font-bold text-white">{stats.total_unique.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-900/70 rounded-lg overflow-hidden border border-neutral-800">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Visits</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Unique Visitors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {sortedStats.map((day) => (
                                        <tr key={day.date} className="hover:bg-neutral-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{formatDate(new Date(day.date))}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-medium">{day.totalVisitors.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-white font-medium">{day.uniqueVisitors.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
} 