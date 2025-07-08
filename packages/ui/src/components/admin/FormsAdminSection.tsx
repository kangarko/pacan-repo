'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ChevronRight, ChevronDown, AlertCircle, Loader2, List, BarChartHorizontal, User, Heart, ThumbsDown, TrendingUp, Search, ArrowUpDown, Download, ChevronUp } from 'lucide-react';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';

type OnboardingResponse = {
    id: number;
    created_at: string;
    user_email: string;
    age_range: string;
    challenges: string[];
    pain_points: string;
    ninety_day_goals: string;
    relationship_status: string;
    purchase_inspiration: string;
};

type AggregatedData = Record<string, number>;

// Type for the most common answers
type MostCommonAnswers = {
    ageRange: string | null;
    relationshipStatus: string | null;
    topChallenges: string[]; // Store top 3
};

// Define sortable keys for the individual table
type SortableKeys = keyof OnboardingResponse | 'similarityScore';
interface SortConfig {
    key: SortableKeys | null;
    direction: 'ascending' | 'descending';
}

export function FormsTab() {
    const [activeSubTab, setActiveSubTab] = useState<'onboarding'>('onboarding');
    const [activeView, setActiveView] = useState<'individual' | 'groupped'>('groupped');
    const [responses, setResponses] = useState<OnboardingResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'descending' });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const fetchResponses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { responses: fetchedResponses } = await fetchJsonPost('/api/admin/form-responses', {
                form_slug: 'onboarding' // Send the slug to the backend
            });
            setResponses(fetchedResponses || []);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch form responses';
            setError(errorMsg);
            sendClientErrorEmail('Error fetching onboarding responses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'onboarding') {
            fetchResponses();
        }
    }, [activeSubTab]);

    const toggleRow = (id: number) => {
        setExpandedRowId(expandedRowId === id ? null : id);
    };

    // --- Data Aggregation & Most Common Answers ---
    const { aggregatedData, mostCommonAnswers } = useMemo(() => {
        const ageCounts: AggregatedData = {};
        const challengeCounts: AggregatedData = {};
        const statusCounts: AggregatedData = {};

        responses.forEach(response => {
            ageCounts[response.age_range] = (ageCounts[response.age_range] || 0) + 1;
            statusCounts[response.relationship_status] = (statusCounts[response.relationship_status] || 0) + 1;
            response.challenges.forEach(challenge => {
                challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
            });
        });

        // Default sort: by count descending
        const sortAggregatedByCount = (data: AggregatedData): [string, number][] =>
            Object.entries(data).sort(([, countA], [, countB]) => countB - countA);

        // Custom sort for age ranges: oldest to youngest
        const sortAgeRanges = (data: AggregatedData): [string, number][] => {
            const ageOrder: Record<string, number> = {
                "65+": 65,   // Or a higher number if needed
                "55-64": 55,
                "45-54": 45,
                "35-44": 35,
                "25-34": 25,
                "18-24": 18
            };
            return Object.entries(data).sort(([ageA], [ageB]) => {
                const orderA = ageOrder[ageA] ?? 0; // Default to 0 if unknown range
                const orderB = ageOrder[ageB] ?? 0;
                return orderB - orderA; // Descending order (oldest first)
            });
        };

        const sortedAges = sortAgeRanges(ageCounts); // Use custom sort for ages
        const sortedChallenges = sortAggregatedByCount(challengeCounts);
        const sortedStatuses = sortAggregatedByCount(statusCounts);

        // Most common are still based on counts, even if display order changes
        const commonAnswers: MostCommonAnswers = {
            ageRange: Object.keys(ageCounts).length > 0 ? Object.entries(ageCounts).sort(([, a], [, b]) => b - a)[0][0] : null,
            relationshipStatus: Object.keys(statusCounts).length > 0 ? Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0] : null,
            topChallenges: sortedChallenges.slice(0, 3).map(([challenge]) => challenge),
        };

        return {
            aggregatedData: {
                ageRanges: sortedAges, // Use the age-sorted array
                challenges: sortedChallenges,
                relationshipStatuses: sortedStatuses,
            },
            mostCommonAnswers: commonAnswers,
        };
    }, [responses]);

    // --- Calculate Similarity Score ---
    const calculateSimilarity = (response: OnboardingResponse, common: MostCommonAnswers): number => {
        if (!common.ageRange || !common.relationshipStatus) return 0; // Cannot calculate if no common answers

        let score = 0;
        const maxScore = 3;

        if (response.age_range === common.ageRange) {
            score += 1;
        }
        if (response.relationship_status === common.relationshipStatus) {
            score += 1;
        }
        // Check if any of the user's challenges match any of the top 3 overall challenges
        if (response.challenges.some(challenge => common.topChallenges.includes(challenge))) {
            score += 1;
        }

        return Math.round((score / maxScore) * 100);
    };

    // --- Filtered and Sorted Responses for Individual View ---
    const filteredAndSortedResponses = useMemo(() => {
        let sortableItems = [...responses];

        // Apply search filter
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            sortableItems = sortableItems.filter(item => {
                return (
                    item.user_email.toLowerCase().includes(lowerCaseSearchTerm) ||
                    item.pain_points.toLowerCase().includes(lowerCaseSearchTerm) ||
                    item.ninety_day_goals.toLowerCase().includes(lowerCaseSearchTerm) ||
                    item.purchase_inspiration.toLowerCase().includes(lowerCaseSearchTerm)
                    // Add other searchable fields if needed
                );
            });
        }

        // Apply sorting
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'similarityScore') {
                    aValue = calculateSimilarity(a, mostCommonAnswers);
                    bValue = calculateSimilarity(b, mostCommonAnswers);
                } else {
                    aValue = a[sortConfig.key as keyof OnboardingResponse];
                    bValue = b[sortConfig.key as keyof OnboardingResponse];
                }

                // Handle date sorting specifically
                if (sortConfig.key === 'created_at') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return sortableItems;
    }, [responses, searchTerm, sortConfig, mostCommonAnswers]); // Include mostCommonAnswers dependency

    // --- Request Sort Function ---
    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // --- Get Sort Icon Helper ---
    const getSortIcon = (key: SortableKeys) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-500 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ?
            <ArrowUpDown className="w-3 h-3 ml-1 text-purple-400 transform rotate-180" /> :
            <ArrowUpDown className="w-3 h-3 ml-1 text-purple-400" />;
    };

    // --- Simple Bar Graph Component ---
    const SimpleBarGraph = ({ title, data, icon: Icon }: { title: string; data: [string, number][]; icon: React.ElementType }) => {
        if (!data || data.length === 0) {
            return (
                <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/40 border border-neutral-700/50 rounded-xl p-6 shadow-lg h-full flex flex-col justify-center items-center">
                    <Icon className="w-10 h-10 text-neutral-600 mb-3" />
                    <p className="text-sm text-neutral-500">No data available for {title}.</p>
                </div>
            );
        }
        const maxValue = Math.max(...data.map(([, count]) => count));
        const totalCount = data.reduce((sum, [, count]) => sum + count, 0);

        return (
            <div className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/40 border border-neutral-700/50 rounded-xl p-6 shadow-lg h-full flex flex-col">
                <div className="flex items-center mb-4">
                    <div className="bg-purple-600/20 p-2 rounded-lg mr-3">
                        <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">{title}</h4>
                    <span className="ml-auto text-sm font-medium text-neutral-400 bg-neutral-700/50 px-2 py-0.5 rounded">Total: {totalCount}</span>
                </div>
                <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
                    {data.map(([label, count]) => {
                        const percentageOfMax = maxValue > 0 ? (count / maxValue) * 100 : 0;
                        const percentageOfTotal = totalCount > 0 ? ((count / totalCount) * 100) : 0;

                        // Determine bar color based on percentage (example logic)
                        let barColorClass = 'bg-purple-600';
                        if (percentageOfTotal < 15) barColorClass = 'bg-purple-700/80';
                        if (percentageOfTotal < 5) barColorClass = 'bg-purple-800/60';

                        return (
                            <div key={label} className="group" title={`${label}: ${count} (${percentageOfTotal.toFixed(1)}%)`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-neutral-300 truncate pr-2 group-hover:text-white transition-colors">{label}</span>
                                    <span className="text-xs font-mono text-neutral-400 group-hover:text-purple-300 transition-colors">{count} ({percentageOfTotal.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-neutral-700/60 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${barColorClass} transition-all duration-500 ease-out shadow-inner shadow-black/20`}
                                        style={{ width: `${percentageOfMax}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- Export Function ---
    const handleExport = () => {
        if (!aggregatedData) return;

        const { ageRanges, challenges, relationshipStatuses } = aggregatedData;
        const totalResponses = responses.length; // Get total responses count

        let exportText = `# Onboarding Form Aggregated Results (Total Responses: ${totalResponses})\n\n`;

        exportText += `## Age Ranges (${ageRanges.reduce((sum, [, count]) => sum + count, 0)} responses)\n`;
        ageRanges.forEach(([label, count]) => {
            exportText += `- ${label}: ${count}\n`;
        });
        exportText += '\n';

        exportText += `## Relationship Statuses (${relationshipStatuses.reduce((sum, [, count]) => sum + count, 0)} responses)\n`;
        relationshipStatuses.forEach(([label, count]) => {
            exportText += `- ${label}: ${count}\n`;
        });
        exportText += '\n';

        // Calculate total mentions for challenges for clarity
        const totalChallengeMentions = challenges.reduce((sum, [, count]) => sum + count, 0);
        exportText += `## Top Challenges (${totalChallengeMentions} total mentions across ${challenges.length} unique challenges)\n`;
        // Display all challenges sorted by count, not just top 3, as per graph
        challenges.forEach(([label, count]) => {
            exportText += `- ${label}: ${count}\n`;
        });
        exportText += '\n';

        // Generate timestamp for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `onboarding_summary_${timestamp}.txt`;

        // Create blob and trigger download
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Forms</h2>
            
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {activeSubTab === 'onboarding' ? 'Onboarding' : 'Select Form'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                setActiveSubTab('onboarding');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'onboarding'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            }`}
                        >
                            <FileText className="w-4 h-4 inline-block mr-2 opacity-70" />
                            Onboarding
                        </button>
                        {/* Add more forms here later */}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block lg:w-64 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${activeSubTab === 'onboarding'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => setActiveSubTab('onboarding')}
                        >
                            <FileText className="w-4 h-4 mr-3 opacity-70" />
                            Onboarding
                        </button>
                        {/* Add more forms here later */}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 lg:p-6 lg:pt-0">
                    {activeSubTab === 'onboarding' && (
                        <div>
                            {/* Header with view toggle and Export button - Mobile Optimized */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-white">Onboarding Form Responses</h3>
                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4">
                                    {/* View Toggle */}
                                    <button
                                        onClick={() => setActiveView('groupped')}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeView === 'groupped' ? 'bg-purple-600 text-white' : 'bg-neutral-800/60 text-gray-400 hover:bg-neutral-700/50 hover:text-white'}`}
                                    >
                                        <BarChartHorizontal className="w-3.5 h-3.5" />
                                        <span className="sm:inline">Grouped</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveView('individual')}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeView === 'individual' ? 'bg-purple-600 text-white' : 'bg-neutral-800/60 text-gray-400 hover:bg-neutral-700/50 hover:text-white'}`}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        <span className="sm:inline">Individual</span>
                                    </button>
                                    {/* Export Button */}
                                    <button
                                        onClick={handleExport}
                                        disabled={isLoading || responses.length === 0}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Export Aggregated Data"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="sm:inline">Export</span>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                                        <p className="text-red-400 text-xs sm:text-sm">Error loading data: {error}</p>
                                    </div>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex justify-center items-center py-16 sm:py-20">
                                    <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 animate-spin text-purple-500" />
                                </div>
                            ) : responses.length === 0 && !error ? (
                                <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-6 sm:p-10 text-center">
                                    <FileText className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-500" />
                                    <h4 className="text-base sm:text-lg font-medium text-gray-300 mb-2">No Responses Found</h4>
                                    <p className="text-gray-500 text-sm">There are no submitted responses for the onboarding form yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Individual View - Mobile Optimized */}
                                    {activeView === 'individual' && (
                                        <div>
                                            {/* Search Input - Mobile Responsive */}
                                            <div className="mb-4 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search email or text fields..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                                />
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
                                            </div>

                                            {/* Mobile Card View */}
                                            <div className="block sm:hidden space-y-3">
                                                {filteredAndSortedResponses.map((response) => {
                                                    const similarityScore = calculateSimilarity(response, mostCommonAnswers);
                                                    let scoreColorClass = 'text-red-400';
                                                    if (similarityScore > 65) scoreColorClass = 'text-green-400';
                                                    else if (similarityScore > 30) scoreColorClass = 'text-yellow-400';

                                                    return (
                                                        <div 
                                                            key={response.id} 
                                                            className="bg-neutral-900/50 border border-neutral-800/50 rounded-lg p-4 cursor-pointer"
                                                            onClick={() => toggleRow(response.id)}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-white truncate">{response.user_email}</p>
                                                                    <p className="text-xs text-gray-400">{formatDate(new Date(response.created_at))}</p>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 ml-2">
                                                                    <TrendingUp size={14} className={`${scoreColorClass} opacity-70`} />
                                                                    <span className={`text-xs font-medium ${scoreColorClass}`}>{similarityScore}%</span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-gray-500">Age:</span> {response.age_range}
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Status:</span> {response.relationship_status}
                                                                </div>
                                                            </div>

                                                            {response.challenges && response.challenges.length > 0 && (
                                                                <div className="mt-2">
                                                                    <span className="inline-block bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                                                                        {response.challenges.length} challenges
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {expandedRowId === response.id && (
                                                                <div className="mt-3 pt-3 border-t border-neutral-700/50 space-y-3">
                                                                    <div>
                                                                        <h5 className="font-semibold text-xs text-purple-300 mb-1">Challenges:</h5>
                                                                        {response.challenges.length > 0 ? (
                                                                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-0.5">
                                                                                {response.challenges.map((c, i) => <li key={i}>{c}</li>)}
                                                                            </ul>
                                                                        ) : <p className="text-xs text-gray-500">N/A</p>}
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-semibold text-xs text-purple-300 mb-1">Pain Points:</h5>
                                                                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{response.pain_points || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-semibold text-xs text-purple-300 mb-1">90-Day Goals:</h5>
                                                                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{response.ninety_day_goals || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-semibold text-xs text-purple-300 mb-1">Purchase Inspiration:</h5>
                                                                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{response.purchase_inspiration || 'N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop Table View - Hidden on mobile */}
                                            <div className="hidden sm:block overflow-x-auto bg-neutral-900/50 border border-neutral-700/50 rounded-lg">
                                                <table className="min-w-full divide-y divide-neutral-800/50">
                                                    <thead className="bg-neutral-800/50">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8"></th>
                                                            {/* Make headers sortable */}
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-purple-300" onClick={() => requestSort('created_at')}>
                                                                <div className="flex items-center">Date {getSortIcon('created_at')}</div>
                                                            </th>
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-purple-300" onClick={() => requestSort('user_email')}>
                                                                <div className="flex items-center">Email {getSortIcon('user_email')}</div>
                                                            </th>
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-purple-300" onClick={() => requestSort('age_range')}>
                                                                <div className="flex items-center">Age {getSortIcon('age_range')}</div>
                                                            </th>
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-purple-300" onClick={() => requestSort('relationship_status')}>
                                                                <div className="flex items-center">Status {getSortIcon('relationship_status')}</div>
                                                            </th>
                                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Challenges</th>
                                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-purple-300" onClick={() => requestSort('similarityScore')}>
                                                                <div className="flex items-center justify-center">Average % {getSortIcon('similarityScore')}</div>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-800/50">
                                                        {filteredAndSortedResponses.map((response) => { // Use filteredAndSortedResponses
                                                            const similarityScore = calculateSimilarity(response, mostCommonAnswers);
                                                            let scoreColorClass = 'text-red-400';
                                                            if (similarityScore > 65) scoreColorClass = 'text-green-400';
                                                            else if (similarityScore > 30) scoreColorClass = 'text-yellow-400';

                                                            return (
                                                                <React.Fragment key={response.id}>
                                                                    <tr
                                                                        className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                                                                        onClick={() => toggleRow(response.id)}
                                                                    >
                                                                        <td className="px-4 py-3 whitespace-nowrap text-center text-gray-400">
                                                                            {expandedRowId === response.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatDate(new Date(response.created_at))}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs">{response.user_email}</td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{response.age_range}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-[150px]">{response.relationship_status}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                                            {(response.challenges && response.challenges.length > 0) ? (
                                                                                <span className="inline-block bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                                                                                    {response.challenges.length} selected
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-500">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                <TrendingUp size={14} className={`${scoreColorClass} opacity-70`} />
                                                                                <span className={`font-medium ${scoreColorClass}`}>{similarityScore}%</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {/* Expanded Row (no changes needed here) */}
                                                                    {expandedRowId === response.id && (
                                                                        <tr className="bg-neutral-800/50">
                                                                            <td colSpan={7} className="px-6 py-4"> { /* Adjusted colSpan */}
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                    <div>
                                                                                        <h5 className="font-semibold text-sm text-purple-300 mb-2">Challenges:</h5>
                                                                                        {response.challenges.length > 0 ? (
                                                                                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                                                                                {response.challenges.map((c, i) => <li key={i}>{c}</li>)}
                                                                                            </ul>
                                                                                        ) : <p className="text-sm text-gray-500">N/A</p>}
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="font-semibold text-sm text-purple-300 mb-2">Pain Points:</h5>
                                                                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{response.pain_points || 'N/A'}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="font-semibold text-sm text-purple-300 mb-2">90-Day Goals:</h5>
                                                                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{response.ninety_day_goals || 'N/A'}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="font-semibold text-sm text-purple-300 mb-2">Purchase Inspiration:</h5>
                                                                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{response.purchase_inspiration || 'N/A'}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Groupped View - Mobile Optimized */}
                                    {activeView === 'groupped' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                            <SimpleBarGraph title="Age Ranges" data={aggregatedData.ageRanges} icon={User} />
                                            <SimpleBarGraph title="Relationship Statuses" data={aggregatedData.relationshipStatuses} icon={Heart} />
                                            <SimpleBarGraph title="Top Challenges" data={aggregatedData.challenges} icon={ThumbsDown} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
} 