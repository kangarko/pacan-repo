'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, BarChart, Check, X, TrendingUp, Eye, UserPlus, ShoppingCart, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchJsonPost, stripAccentTags } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { Headline } from '@repo/ui/lib/types';
import IconPicker from '@repo/ui/components/IconPicker';
import { getIconByName } from '@repo/ui/lib/iconMapping';

interface HeadlineStats {
    headline: Headline;
    views: number;
    signups: number;
    purchases: number;
    signupRate: number;
    purchaseRate: number;
}

interface HeadlinesTabProps {
    userRole?: string | null;
}

export function HeadlinesTab({ userRole }: HeadlinesTabProps) {
    const [subTab, setSubTab] = useState<'manage' | 'stats'>('manage');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Headlines Testing</h2>

            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {subTab === 'manage' ? 'Manage Headlines' : 'Statistics'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                setSubTab('manage');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${subTab === 'manage'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-gray-300 hover:bg-neutral-800/50'
                                } border-b border-neutral-700/50`}
                        >
                            <Edit2 className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Manage Headlines
                        </button>
                        <button
                            onClick={() => {
                                setSubTab('stats');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${subTab === 'stats'
                                ? 'bg-purple-600/20 text-purple-300'
                                : 'text-gray-300 hover:bg-neutral-800/50'
                                }`}
                        >
                            <BarChart className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Statistics
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Left Navigation Panel */}
                <div className="hidden lg:block lg:w-64 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${subTab === 'manage'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setSubTab('manage')}
                        >
                            <Edit2 className="w-4 h-4 mr-3 opacity-70" />
                            Manage Headlines
                        </button>
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${subTab === 'stats'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setSubTab('stats')}
                        >
                            <BarChart className="w-4 h-4 mr-3 opacity-70" />
                            Statistics
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 lg:p-6 lg:pt-0">
                    {subTab === 'manage' && <ManageHeadlinesSubTab userRole={userRole} />}
                    {subTab === 'stats' && <HeadlineStatsSubTab />}
                </div>
            </div>
        </div>
    );
}

function ManageHeadlinesSubTab({ userRole }: { userRole?: string | null }) {
    const [headlines, setHeadlines] = useState<Headline[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchHeadlines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchJsonPost('/api/admin/headlines', {
                action: 'list'
            });
            setHeadlines(response.headlines || []);
        } catch (error) {
            sendClientErrorEmail("Failed to fetch headlines: ", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHeadlines();
    }, [fetchHeadlines]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this headline?')) return;

        try {
            await fetchJsonPost('/api/admin/headlines', {
                action: 'delete',
                id
            });
            await fetchHeadlines();
        } catch (error) {
            sendClientErrorEmail("Error deleting headline: ", error);
        }
    };

    const handleToggleActive = async (headline: Headline) => {
        try {
            await fetchJsonPost('/api/admin/headlines', {
                action: 'update',
                id: headline.id,
                active: !headline.active
            });
            await fetchHeadlines();
        } catch (error) {
            sendClientErrorEmail("Error toggling headline active state: ", error);
        }
    };

    const startCreate = () => {
        setIsCreating(true);
        setEditingHeadline({
            id: '',
            name: '',
            slug: '',
            headline: '',
            subheadline: '',
            bullet_points: [
                { icon: 'Check', text: '' },
                { icon: 'Check', text: '' },
                { icon: 'Check', text: '' }
            ],
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Manage Headlines</h3>
                <button
                    onClick={startCreate}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md flex items-center transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Headline
                </button>
            </div>

            {editingHeadline && isCreating && (
                <HeadlineEditor
                    headline={editingHeadline}
                    isNew={true}
                    onSave={async () => {
                        setEditingHeadline(null);
                        setIsCreating(false);
                        await fetchHeadlines();
                    }}
                    onCancel={() => {
                        setEditingHeadline(null);
                        setIsCreating(false);
                    }}
                />
            )}

            <div className="space-y-4">
                {headlines.map((headline) => {
                    // If this headline is being edited, show the editor instead
                    if (editingHeadline && !isCreating && editingHeadline.id === headline.id) {
                        return (
                            <HeadlineEditor
                                key={headline.id}
                                headline={editingHeadline}
                                isNew={false}
                                onSave={async () => {
                                    setEditingHeadline(null);
                                    await fetchHeadlines();
                                }}
                                onCancel={() => {
                                    setEditingHeadline(null);
                                }}
                            />
                        );
                    }
                    return (
                        <div key={headline.id} className="bg-neutral-900/70 rounded-lg p-6 border border-neutral-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-white mb-1">{headline.name}</h4>
                                    <div className="flex items-center gap-3 mb-2">
                                        <code className="text-xs bg-neutral-800 px-2 py-1 rounded text-gray-400">?hd={headline.slug}</code>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${headline.active ? 'bg-green-900/30 text-green-400' : 'bg-gray-900/30 text-gray-400'
                                            }`}>
                                            {headline.active ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setEditingHeadline(headline)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-md text-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleToggleActive(headline)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-md text-sm"
                                    >
                                        {headline.active ? (
                                            <>
                                                <X className="w-4 h-4" />
                                                <span>Deactivate</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>Activate</span>
                                            </>
                                        )}
                                    </button>
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() => handleDelete(headline.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Remove</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-gray-300">
                                    <strong>Headline:</strong> <span dangerouslySetInnerHTML={{ __html: stripAccentTags(headline.headline) }} />
                                </div>
                                {headline.subheadline && (
                                    <div className="text-gray-300">
                                        <strong>Subheadline:</strong> <span dangerouslySetInnerHTML={{ __html: stripAccentTags(headline.subheadline) }} />
                                    </div>
                                )}
                                <div>
                                    <strong className="text-gray-300">Bullet Points:</strong>
                                    <ul className="mt-2 space-y-1">
                                        {headline.bullet_points.map((point, index) => (
                                            <li key={index} className="flex items-center gap-2 text-gray-400">
                                                {getIconByName(point.icon || 'Check', { size: 16, className: "text-purple-400" })}
                                                <span dangerouslySetInnerHTML={{ __html: stripAccentTags(point.text) }} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {headlines.length === 0 && !editingHeadline && (
                <p className="text-gray-400 text-center py-10">No headlines created yet</p>
            )}
        </>
    );
}

function HeadlineEditor({ headline, isNew, onSave, onCancel }: {
    headline: Headline;
    isNew: boolean;
    onSave: (headline: Headline) => Promise<void>;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState({
        ...headline,
        bullet_points: headline.bullet_points.map(point => ({
            ...point,
            icon: point.icon || 'Check'
        }))
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const action = isNew ? 'create' : 'update';
            const payload: any = {
                action,
                name: formData.name,
                slug: formData.slug,
                headline: formData.headline,
                subheadline: formData.subheadline,
                bullet_points: formData.bullet_points.filter(p => p.text.trim() !== '')
            };

            if (!isNew) {
                payload.id = formData.id;
            }

            await fetchJsonPost('/api/admin/headlines', payload);
            await onSave(formData);
        } catch (error) {
            sendClientErrorEmail("Error saving headline: ", error);
        } finally {
            setSaving(false);
        }
    };

    const updateBulletPoint = (index: number, field: 'icon' | 'text', value: string) => {
        const newBulletPoints = [...formData.bullet_points];
        newBulletPoints[index] = { ...newBulletPoints[index], [field]: value };
        setFormData({ ...formData, bullet_points: newBulletPoints });
    };

    const addBulletPoint = () => {
        setFormData({
            ...formData,
            bullet_points: [...formData.bullet_points, { icon: 'Check', text: '' }]
        });
    };

    const removeBulletPoint = (index: number) => {
        const newBulletPoints = formData.bullet_points.filter((_, i) => i !== index);
        setFormData({ ...formData, bullet_points: newBulletPoints });
    };

    return (
        <div className="bg-neutral-900/70 rounded-lg p-6 border border-neutral-800 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">
                {isNew ? 'Create New Headline' : 'Edit Headline'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Internal Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        URL Slug
                    </label>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setFormData({ ...formData, slug: value });
                        }}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        placeholder={formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'url-slug'}
                        pattern="[a-z0-9-]+"
                        title="Only lowercase letters, numbers, and hyphens allowed"
                    />
                    <p className="mt-1 text-xs text-gray-400">Used in URLs like ?hd=your-slug</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Headline
                    </label>
                    <textarea
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Subheadline (optional)
                    </label>
                    <input
                        type="text"
                        value={formData.subheadline || ''}
                        onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bullet Points
                    </label>
                    <div className="space-y-2">
                        {formData.bullet_points.map((point, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <IconPicker
                                    selectedIcon={point.icon || 'Check'}
                                    onChange={(icon) => updateBulletPoint(index, 'icon', icon)}
                                />
                                <input
                                    type="text"
                                    value={point.text}
                                    onChange={(e) => updateBulletPoint(index, 'text', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Bullet point text"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeBulletPoint(index)}
                                    className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addBulletPoint}
                        className="mt-2 px-3 py-1 bg-purple-600/80 hover:bg-purple-600 text-white text-sm rounded-md"
                    >
                        Add Bullet Point
                    </button>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white font-medium rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md flex items-center disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>Save</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function HeadlineStatsSubTab() {
    const [stats, setStats] = useState<HeadlineStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentRange, setCurrentRange] = useState<string>('last_7_days');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        // Ensure initial date is after February 2025
        const minDate = new Date('2025-02-01');
        if (date < minDate) {
            return minDate.toISOString().split('T')[0];
        }
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [dateError, setDateError] = useState<string | null>(null);
    const [url, setUrl] = useState<string>(() => {
        
        if (!process.env.NEXT_PUBLIC_DOMAIN)
            throw new Error('NEXT_PUBLIC_DOMAIN is not set');

        return process.env.NEXT_PUBLIC_DOMAIN == 'kristinamitrovic.com' ? '/knjiga' : '/';
    });

    const handleDateRangeSelect = (range: string) => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let start = todayStr;
        let end = todayStr;

        // For date validation, ensure we don't go before February 2025
        const minDate = new Date('2025-02-01');

        switch (range) {
            case 'today':
                // Already set to today
                break;

            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = yesterday.toISOString().split('T')[0];
                end = start;
                break;

            case 'this_week':
                const thisWeekStart = new Date(today);
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                thisWeekStart.setDate(today.getDate() - diff);
                start = thisWeekStart.toISOString().split('T')[0];
                break;

            case 'last_week':
                const lastWeekStart = new Date(today);
                const lastWeekEnd = new Date(today);
                const thisWeekDiff = today.getDay() === 0 ? 6 : today.getDay() - 1;
                lastWeekStart.setDate(today.getDate() - thisWeekDiff - 7);
                lastWeekEnd.setDate(today.getDate() - thisWeekDiff - 1);
                start = lastWeekStart.toISOString().split('T')[0];
                end = lastWeekEnd.toISOString().split('T')[0];
                break;

            case 'this_month':
                const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                start = thisMonthStart.toISOString().split('T')[0];
                break;

            case 'last_month':
                let lastMonthYear = today.getFullYear();
                let lastMonth = today.getMonth() - 1;

                if (lastMonth < 0) {
                    lastMonth = 11;
                    lastMonthYear--;
                }

                const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
                const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);

                start = lastMonthStart.toISOString().split('T')[0];
                end = lastMonthEnd.toISOString().split('T')[0];
                break;

            case 'this_quarter':
                const currentQuarter = Math.floor(today.getMonth() / 3);
                const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
                start = thisQuarterStart.toISOString().split('T')[0];
                break;

            case 'last_quarter':
                const currentQ = Math.floor(today.getMonth() / 3);
                let lastQuarter = currentQ - 1;
                let lastQuarterYear = today.getFullYear();

                if (lastQuarter < 0) {
                    lastQuarter = 3;
                    lastQuarterYear--;
                }

                const lastQuarterFirstMonth = lastQuarter * 3;
                const lastQuarterStart = new Date(lastQuarterYear, lastQuarterFirstMonth, 1);
                const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterFirstMonth + 3, 0);
                start = lastQuarterStart.toISOString().split('T')[0];
                end = lastQuarterEnd.toISOString().split('T')[0];
                break;

            case 'this_year':
                const thisYearStart = new Date(today.getFullYear(), 0, 1);
                start = thisYearStart.toISOString().split('T')[0];
                break;

            case 'last_year':
                const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                start = lastYearStart.toISOString().split('T')[0];
                end = lastYearEnd.toISOString().split('T')[0];
                break;

            case 'last_7_days':
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 6);
                start = last7Days.toISOString().split('T')[0];
                break;

            case 'last_30_days':
                const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 29);
                start = last30Days.toISOString().split('T')[0];
                break;

            case 'custom':
                setCurrentRange(range);
                return;
        }

        // Ensure start date is not before February 2025
        const startDate = new Date(start);
        if (startDate < minDate) {
            start = minDate.toISOString().split('T')[0];
        }

        setStartDate(start);
        setEndDate(end);
        setCurrentRange(range);
        setDateError(null);
    };

    const validateDates = (): boolean => {
        setDateError(null);

        // Check if URL is provided
        if (!url || url.trim() === '') {
            setDateError('URL field is required. Use "/" to track visitors from the homepage.');
            return false;
        }

        // Check if dates are valid
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        const minDate = new Date('2025-02-01');

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setDateError('Please enter valid dates');
            return false;
        }

        // Check if start date is after February 2025
        if (start < minDate) {
            setDateError('Start date must be after February 2025');
            return false;
        }

        // Check if end date is not in the future
        if (end > today) {
            setDateError('End date cannot be in the future');
            return false;
        }

        // Check if start date is before end date
        if (start > end) {
            setDateError('Start date must be before end date');
            return false;
        }

        return true;
    };

    const fetchStats = async () => {
        if (!validateDates()) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetchJsonPost('/api/admin/headlines', {
                action: 'get_stats',
                start_date: startDate,
                end_date: endDate,
                url: url
            });
            setStats(response.stats || []);
        } catch (error) {
            sendClientErrorEmail("Failed to fetch headline stats: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats on initial mount only
    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBestPerformer = (metric: 'signupRate' | 'purchaseRate') => {
        const filtered = stats.filter(s => s.views > 0 && s.headline.id !== 'no_headline');
        if (filtered.length === 0) return null;
        return filtered.reduce((best, current) =>
            current[metric] > best[metric] ? current : best
        );
    };

    return (
        <>
            <h3 className="text-xl font-semibold text-white mb-6">Headline Performance Statistics</h3>

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
                            <option value="this_week">This Week</option>
                            <option value="last_week">Last Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_quarter">This Quarter</option>
                            <option value="last_quarter">Last Quarter</option>
                            <option value="this_year">This Year</option>
                            <option value="last_year">Last Year</option>
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
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentRange('custom');
                                setDateError(null); // Clear error when user changes date
                            }}
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                            min="2025-02-01"
                            max={endDate}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentRange('custom');
                                setDateError(null); // Clear error when user changes date
                            }}
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                            min={startDate}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            URL <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setDateError(null); // Clear error when user changes URL
                            }}
                            placeholder='e.g. / or /knjiga'
                            className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-md text-white focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <BarChart className="w-4 h-4 mr-2" />
                                    Refresh Stats
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {dateError && (
                    <div className="mt-3 text-red-400 text-sm">
                        {dateError}
                    </div>
                )}
                {/* URL Help Text */}
                <div className="mt-4 bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-md">
                    <p className="text-xs sm:text-sm text-blue-200">
                        <strong>URL field:</strong> Filters headline performance data by landing page. Use &quot;/&quot; for homepage tracking. The system compares how different headlines perform on the same page, helping you optimize conversion rates for each specific URL.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {(() => {
                            const bestSignup = getBestPerformer('signupRate');
                            const bestPurchase = getBestPerformer('purchaseRate');

                            return (
                                <>
                                    {bestSignup && bestSignup.signupRate > 0 && (
                                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-green-400 font-semibold">Best Signup Rate</h4>
                                                <TrendingUp className="w-5 h-5 text-green-400" />
                                            </div>
                                            <p className="text-white font-medium">{bestSignup.headline.name}</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                {bestSignup.signupRate.toFixed(2)}%
                                            </p>
                                        </div>
                                    )}
                                    {bestPurchase && bestPurchase.purchaseRate > 0 && (
                                        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-blue-400 font-semibold">Best Purchase Rate</h4>
                                                <ShoppingCart className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <p className="text-white font-medium">{bestPurchase.headline.name}</p>
                                            <p className="text-2xl font-bold text-blue-400">
                                                {bestPurchase.purchaseRate.toFixed(2)}%
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Stats Table */}
                    <div className="bg-neutral-900/70 rounded-lg overflow-hidden border border-neutral-800">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Headline
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            <Eye className="w-4 h-4 inline-block mr-1" />
                                            Views
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            <UserPlus className="w-4 h-4 inline-block mr-1" />
                                            Signups
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Signup Rate
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                                            Purchases
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Purchase Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {stats.map((stat) => (
                                        <tr key={stat.headline.id} className={stat.headline.id === 'no_headline' ? 'bg-neutral-800/50' : ''}>
                                            <td className="px-4 py-3 text-white">
                                                <div>
                                                    <p className="font-medium">{stat.headline.name}</p>
                                                    {stat.headline.id !== 'no_headline' && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {stripAccentTags(stat.headline.headline).replace(/<[^>]*>/g, '').substring(0, 50)}...
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300">
                                                {stat.views.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300">
                                                {stat.signups.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${stat.signupRate > 0 ? 'text-green-400' : 'text-gray-400'
                                                    }`}>
                                                    {stat.signupRate.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300">
                                                {stat.purchases.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${stat.purchaseRate > 0 ? 'text-blue-400' : 'text-gray-400'
                                                    }`}>
                                                    {stat.purchaseRate.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {stats.length === 0 && (
                        <p className="text-gray-400 text-center py-10">No data available for the selected date range</p>
                    )}
                </>
            )}
        </>
    );
} 