'use client';

import React, { useState, useEffect } from 'react';
import { Plus, BarChart, ListFilter, Edit, Trash, AlertCircle, Loader2, Save, X, ArrowDown, ArrowUp, Power, PieChart, Award, Target } from 'lucide-react';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';

type Experiment = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    variants: string[];
    start_date: string;
    end_date: string | null;
    created_at: string;
};

type ExperimentWithStats = Experiment & {
    stats?: {
        total_users: number;
        variant_distribution: Record<string, number>;
        conversions: {
            sign_up: Record<string, number>;
            buy: Record<string, number>;
        };
    };
};

// Helper function to calculate the duration between two dates
const calculateDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Less than a day";
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;

    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (months === 1) {
        return remainingDays > 0 ? `1 month, ${remainingDays} days` : "1 month";
    }

    return remainingDays > 0 ? `${months} months, ${remainingDays} days` : `${months} months`;
};

// Helper function to find the best performing variant
const findBestVariant = (variants: string[], conversions: Record<string, number>, distributions: Record<string, number>): string => {
    let bestVariant = variants[0];
    let bestRate = 0;

    variants.forEach(variant => {
        const users = distributions[variant] || 0;
        const convCount = conversions[variant] || 0;
        const rate = users > 0 ? (convCount / users) * 100 : 0;

        if (rate > bestRate) {
            bestRate = rate;
            bestVariant = variant;
        }
    });

    return bestVariant;
};

interface ExperimentsTabProps {
    userRole?: string | null;
}

export function ExperimentsTab({ userRole }: ExperimentsTabProps) {
    const isMarketer = userRole === 'marketer';
    const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'edit'>('list');
    const [experiments, setExperiments] = useState<ExperimentWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentExperiment, setCurrentExperiment] = useState<ExperimentWithStats | null>(null);
    const [expandedExperimentId, setExpandedExperimentId] = useState<number | null>(null);

    // New experiment form state
    const [newExperiment, setNewExperiment] = useState<{
        name: string;
        description: string;
        active: boolean;
        variants: string[];
        end_date: string;
    }>({
        name: '',
        description: '',
        active: true,
        variants: ['A', 'B'],
        end_date: ''
    });

    const fetchExperiments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { experiments } = await fetchJsonPost('/api/admin/experiments', {
                action: 'list'
            });

            setExperiments(experiments || []);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch experiments';
            setError(errorMsg);
            sendClientErrorEmail('Error fetching experiments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiments();
    }, []);

    const toggleExperimentExpand = (id: number) => {
        setExpandedExperimentId(expandedExperimentId === id ? null : id);
    };

    const handleCreateExperiment = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await fetchJsonPost('/api/admin/experiments', {
                action: 'create',
                experiment: newExperiment
            });

            // Reset form and switch to list view
            setNewExperiment({
                name: '',
                description: '',
                active: true,
                variants: ['A', 'B'],
                end_date: ''
            });

            setActiveSubTab('list');
            fetchExperiments();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create experiment';
            setError(errorMsg);
            sendClientErrorEmail('Error creating experiment:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateExperiment = async () => {
        if (!currentExperiment) return;

        setIsLoading(true);
        setError(null);

        try {
            await fetchJsonPost('/api/admin/experiments', {
                action: 'update',
                experiment: currentExperiment
            });

            setActiveSubTab('list');
            fetchExperiments();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to update experiment';
            setError(errorMsg);
            sendClientErrorEmail('Error updating experiment:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExperiment = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) return;

        setIsLoading(true);
        setError(null);

        try {
            await fetchJsonPost('/api/admin/experiments', {
                action: 'delete',
                id
            });

            fetchExperiments();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete experiment';
            setError(errorMsg);
            sendClientErrorEmail('Error deleting experiment:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (id: number, currentActive: boolean) => {
        setIsLoading(true);
        setError(null);

        try {
            await fetchJsonPost('/api/admin/experiments', {
                action: 'toggle_active',
                id,
                active: currentActive
            });

            fetchExperiments();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to update experiment status';
            setError(errorMsg);
            sendClientErrorEmail('Error updating experiment status:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const editExperiment = (experiment: ExperimentWithStats) => {
        setCurrentExperiment(experiment);
        setActiveSubTab('edit');
    };

    const addVariant = () => {
        if (activeSubTab === 'create') {
            setNewExperiment({
                ...newExperiment,
                variants: [...newExperiment.variants, `Variant ${newExperiment.variants.length + 1}`]
            });
        } else if (activeSubTab === 'edit' && currentExperiment) {
            setCurrentExperiment({
                ...currentExperiment,
                variants: [...currentExperiment.variants, `Variant ${currentExperiment.variants.length + 1}`]
            });
        }
    };

    const removeVariant = (index: number) => {
        if (activeSubTab === 'create') {
            if (newExperiment.variants.length <= 2) {
                setError('At least two variants are required');
                return;
            }
            const updatedVariants = [...newExperiment.variants];
            updatedVariants.splice(index, 1);
            setNewExperiment({
                ...newExperiment,
                variants: updatedVariants
            });
        } else if (activeSubTab === 'edit' && currentExperiment) {
            if (currentExperiment.variants.length <= 2) {
                setError('At least two variants are required');
                return;
            }
            const updatedVariants = [...currentExperiment.variants];
            updatedVariants.splice(index, 1);
            setCurrentExperiment({
                ...currentExperiment,
                variants: updatedVariants
            });
        }
    };

    const updateVariantName = (index: number, value: string, isEdit: boolean) => {
        if (!isEdit) {
            const updatedVariants = [...newExperiment.variants];
            updatedVariants[index] = value;
            setNewExperiment({
                ...newExperiment,
                variants: updatedVariants
            });
        } else if (currentExperiment) {
            const updatedVariants = [...currentExperiment.variants];
            updatedVariants[index] = value;
            setCurrentExperiment({
                ...currentExperiment,
                variants: updatedVariants
            });
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Experiments</h2>

                {!isMarketer && (
                    <button
                        onClick={() => {
                            setActiveSubTab('create');
                            setError(null);
                        }}
                        disabled={isLoading || activeSubTab !== 'list'}
                        className="w-full sm:w-auto px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Experiment
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                        <p className="text-red-400 text-xs sm:text-sm">Error: {error}</p>
                    </div>
                </div>
            )}

            {activeSubTab === 'list' && (
                <div>
                    {isLoading && !experiments.length ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 animate-spin text-purple-500" />
                        </div>
                    ) : experiments.length === 0 ? (
                        <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-xl p-6 sm:p-10 text-center">
                            <ListFilter className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-500" />
                            <h4 className="text-base sm:text-lg font-medium text-gray-300 mb-2">No Experiments Found</h4>
                            <p className="text-gray-500 mb-4 sm:mb-6 text-sm">Create your first A/B test to start experimenting with your website</p>
                            {!isMarketer && (
                                <button
                                    onClick={() => setActiveSubTab('create')}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors text-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Experiment
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="block sm:hidden space-y-3">
                                {experiments.map((experiment) => (
                                    <div key={experiment.id} className="bg-neutral-800/60 border border-neutral-700/80 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 h-8 w-8 bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                    <BarChart className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-medium text-white truncate">{experiment.name}</h3>
                                                    {experiment.description && (
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">{experiment.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 text-xs rounded ${experiment.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {experiment.active ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            <div>
                                                <p className="text-gray-500">Started</p>
                                                <p className="text-gray-300">{formatDate(experiment.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Duration</p>
                                                <p className="text-gray-300">
                                                    {experiment.end_date
                                                        ? calculateDuration(experiment.created_at, experiment.end_date)
                                                        : 'Ongoing'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Variants</p>
                                                <p className="text-gray-300">{experiment.variants.join(', ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Users</p>
                                                <p className="text-gray-300">{experiment.stats?.total_users || 0}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleExperimentExpand(experiment.id)}
                                                className="flex-1 text-purple-400 hover:text-purple-300 text-xs py-1.5 flex items-center justify-center gap-1"
                                            >
                                                {expandedExperimentId === experiment.id ? 'Hide Stats' : 'View Stats'}
                                                {expandedExperimentId === experiment.id ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                            </button>
                                            {!isMarketer && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleToggleActive(experiment.id, experiment.active)}
                                                        className={`p-1.5 rounded ${experiment.active
                                                            ? 'bg-yellow-900/30 text-yellow-400'
                                                            : 'bg-green-900/30 text-green-400'
                                                        }`}
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => editExperiment(experiment)}
                                                        className="p-1.5 rounded bg-indigo-900/30 text-indigo-400"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExperiment(experiment.id)}
                                                        className="p-1.5 rounded bg-red-900/30 text-red-400"
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                                                                        {expandedExperimentId === experiment.id && experiment.stats && experiment.stats.total_users > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-neutral-700/50">
                                                        <div className="space-y-3">
                                                            {experiment.variants.map(variant => {
                                                                const users = experiment.stats!.variant_distribution[variant] || 0;
                                                                const signUps = experiment.stats!.conversions.sign_up[variant] || 0;
                                                                const purchases = experiment.stats!.conversions.buy[variant] || 0;
                                                                const signUpRate = users > 0 ? (signUps / users) * 100 : 0;
                                                                const purchaseRate = users > 0 ? (purchases / users) * 100 : 0;

                                                                const bestSignUpVariant = findBestVariant(
                                                                    experiment.variants,
                                                                    experiment.stats!.conversions.sign_up,
                                                                    experiment.stats!.variant_distribution
                                                                );
                                                                const bestPurchaseVariant = findBestVariant(
                                                                    experiment.variants,
                                                                    experiment.stats!.conversions.buy,
                                                                    experiment.stats!.variant_distribution
                                                                );
                                                                
                                                                const isSignUpBest = variant === bestSignUpVariant && signUps > 0;
                                                                const isPurchaseBest = variant === bestPurchaseVariant && purchases > 0;
                                                                const isWinner = isSignUpBest || isPurchaseBest;

                                                                return (
                                                                    <div key={variant} className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800/50">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <p className="text-sm font-medium text-white flex items-center">
                                                                                {isWinner && <Award className="w-3.5 h-3.5 mr-1.5 text-purple-400" />}
                                                                                Variant {variant}
                                                                            </p>
                                                                            <span className="text-xs text-gray-400">{users} users</span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs text-gray-500">Sign-ups:</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs text-gray-300">{signUps}</span>
                                                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                                                        isSignUpBest 
                                                                                            ? 'bg-green-900/30 text-green-400' 
                                                                                            : 'bg-neutral-700/50 text-gray-300'
                                                                                    }`}>
                                                                                        {signUpRate.toFixed(1)}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-xs text-gray-500">Purchases:</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs text-gray-300">{purchases}</span>
                                                                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                                                        isPurchaseBest 
                                                                                            ? 'bg-green-900/30 text-green-400' 
                                                                                            : 'bg-neutral-700/50 text-gray-300'
                                                                                    }`}>
                                                                                        {purchaseRate.toFixed(1)}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden sm:block bg-neutral-800/60 border border-neutral-700/80 rounded-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-700">
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Experiment</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Started</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">End Date</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variants</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-700">
                                            {experiments.map((experiment) => (
                                                <React.Fragment key={experiment.id}>
                                                    <tr className="hover:bg-neutral-700/20">
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                                    <BarChart className="h-4 w-4 lg:h-5 lg:w-5 text-purple-400" />
                                                                </div>
                                                                <div className="ml-3 lg:ml-4">
                                                                    <div className="text-sm font-medium text-white">{experiment.name}</div>
                                                                    {experiment.description && (
                                                                        <div className="text-sm text-gray-400">{experiment.description}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${experiment.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                                <span className="text-sm text-gray-300">
                                                                    {experiment.active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                                                            {formatDate(experiment.created_at)}
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                                                            {experiment.end_date ? formatDate(experiment.end_date) : '—'}
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            {experiment.end_date
                                                                ? calculateDuration(experiment.created_at, experiment.end_date)
                                                                : 'Ongoing'}
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            {experiment.variants.join(', ')}
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            {experiment.stats?.total_users || 0}
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                            <button
                                                                onClick={() => toggleExperimentExpand(experiment.id)}
                                                                className="text-purple-400 hover:text-purple-300 flex items-center"
                                                            >
                                                                {expandedExperimentId === experiment.id ? (
                                                                    <>Hide <ArrowUp size={16} className="ml-1" /></>
                                                                ) : (
                                                                    <>View <ArrowDown size={16} className="ml-1" /></>
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end">
                                                                {!isMarketer && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleToggleActive(experiment.id, experiment.active)}
                                                                            className={`p-1.5 rounded-md flex items-center justify-center ${experiment.active
                                                                                ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/40 border border-yellow-700/40'
                                                                                : 'bg-green-900/30 text-green-400 hover:bg-green-900/40 border border-green-700/40'
                                                                                }`}
                                                                            title={experiment.active ? "Deactivate" : "Activate"}
                                                                        >
                                                                            <Power size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {!isMarketer && (
                                                                    <button
                                                                        onClick={() => editExperiment(experiment)}
                                                                        className="ml-2 lg:ml-3 p-1.5 rounded-md bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-700/40"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                )}
                                                                {!isMarketer && (
                                                                    <button
                                                                        onClick={() => handleDeleteExperiment(experiment.id)}
                                                                        className="ml-2 lg:ml-3 p-1.5 rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/40 border border-red-700/40"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {expandedExperimentId === experiment.id && (
                                                        <tr className="bg-neutral-800/50">
                                                            <td colSpan={9} className="px-4 lg:px-6 py-4">
                                                                {experiment.stats && experiment.stats.total_users > 0 ? (
                                                                    <div className="grid grid-cols-1 gap-6">
                                                                        {(() => {
                                                                            if (!experiment.stats || !experiment.stats.conversions || !experiment.stats.variant_distribution) {
                                                                                return null;
                                                                            }

                                                                            const stats = experiment.stats!;

                                                                            const bestSignUpVariant = findBestVariant(
                                                                                experiment.variants,
                                                                                stats.conversions.sign_up,
                                                                                stats.variant_distribution
                                                                            );

                                                                            const bestPurchaseVariant = findBestVariant(
                                                                                experiment.variants,
                                                                                stats.conversions.buy,
                                                                                stats.variant_distribution
                                                                            );

                                                                            return (
                                                                                <>
                                                                                    {/* Desktop View - Table */}
                                                                                    <div className="hidden md:block overflow-x-auto">
                                                                                        <table className="w-full border-collapse">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th className="text-left py-3 px-4 text-sm text-gray-400 border-b border-neutral-700/50 w-40">Variant</th>
                                                                                                    <th className="text-left py-3 px-4 text-sm text-gray-400 border-b border-neutral-700/50">Total Participants</th>
                                                                                                    <th className="text-left py-3 px-4 text-sm text-gray-400 border-b border-neutral-700/50">
                                                                                                        <div className="flex items-center">
                                                                                                            <Target className="w-4 h-4 mr-1.5 text-purple-400" />
                                                                                                            Sign-ups
                                                                                                        </div>
                                                                                                    </th>
                                                                                                    <th className="text-left py-3 px-4 text-sm text-gray-400 border-b border-neutral-700/50">
                                                                                                        <div className="flex items-center">
                                                                                                            <PieChart className="w-4 h-4 mr-1.5 text-blue-400" />
                                                                                                            Purchases
                                                                                                        </div>
                                                                                                    </th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {experiment.variants.map(variant => {
                                                                                                    const users = stats.variant_distribution[variant] || 0;
                                                                                                    const signUps = stats.conversions.sign_up[variant] || 0;
                                                                                                    const purchases = stats.conversions.buy[variant] || 0;

                                                                                                    const signUpRate = users > 0 ? (signUps / users) * 100 : 0;
                                                                                                    const purchaseRate = users > 0 ? (purchases / users) * 100 : 0;

                                                                                                    const isSignUpBest = variant === bestSignUpVariant && signUps > 0;
                                                                                                    const isPurchaseBest = variant === bestPurchaseVariant && purchases > 0;
                                                                                                    const isWinner = isSignUpBest || isPurchaseBest;

                                                                                                    return (
                                                                                                        <tr key={variant}>
                                                                                                            <td className="py-3 px-4 text-sm font-medium text-white border-b border-neutral-700/30">
                                                                                                                <div className="flex items-center">
                                                                                                                    {isWinner && <Award className="w-4 h-4 mr-1.5 text-purple-400" />}
                                                                                                                    Variant {variant}
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="py-3 px-4 text-sm text-white border-b border-neutral-700/30">
                                                                                                                {users}
                                                                                                            </td>
                                                                                                            <td className={`py-3 px-4 text-sm border-b border-neutral-700/30 ${isSignUpBest ? 'bg-green-900/20' : ''}`}>
                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                    <span className="text-white font-medium">
                                                                                                                        {signUps}
                                                                                                                    </span>
                                                                                                                    <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${isSignUpBest
                                                                                                                        ? 'bg-green-900/30 text-green-400'
                                                                                                                        : 'bg-neutral-700/50 text-gray-300'
                                                                                                                        }`}>
                                                                                                                        {signUpRate.toFixed(1)}%
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                {!isSignUpBest && signUpRate > 0 && (
                                                                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                                                                        <span className="text-red-400">
                                                                                                                            {(() => {
                                                                                                                                const bestRate = stats.conversions.sign_up[bestSignUpVariant] / stats.variant_distribution[bestSignUpVariant] * 100;
                                                                                                                                const diff = ((bestRate - signUpRate) / bestRate * 100).toFixed(1);
                                                                                                                                return `${diff}% worse than winner`;
                                                                                                                            })()}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className={`py-3 px-4 text-sm border-b border-neutral-700/30 ${isPurchaseBest ? 'bg-green-900/20' : ''}`}>
                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                    <span className="text-white font-medium">
                                                                                                                        {purchases}
                                                                                                                    </span>
                                                                                                                    <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${isPurchaseBest
                                                                                                                        ? 'bg-green-900/30 text-green-400'
                                                                                                                        : 'bg-neutral-700/50 text-gray-300'
                                                                                                                        }`}>
                                                                                                                        {purchaseRate.toFixed(1)}%
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                {!isPurchaseBest && purchaseRate > 0 && (
                                                                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                                                                        <span className="text-red-400">
                                                                                                                            {(() => {
                                                                                                                                const bestRate = stats.conversions.buy[bestPurchaseVariant] / stats.variant_distribution[bestPurchaseVariant] * 100;
                                                                                                                                const diff = ((bestRate - purchaseRate) / bestRate * 100).toFixed(1);
                                                                                                                                return `${diff}% worse than winner`;
                                                                                                                            })()}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    );
                                                                                                })}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>

                                                                                    {/* Mobile View - Cards */}
                                                                                    <div className="md:hidden space-y-3">
                                                                                        {experiment.variants.map(variant => {
                                                                                            const users = stats.variant_distribution[variant] || 0;
                                                                                            const signUps = stats.conversions.sign_up[variant] || 0;
                                                                                            const purchases = stats.conversions.buy[variant] || 0;

                                                                                            const signUpRate = users > 0 ? (signUps / users) * 100 : 0;
                                                                                            const purchaseRate = users > 0 ? (purchases / users) * 100 : 0;

                                                                                            const isSignUpBest = variant === bestSignUpVariant && signUps > 0;
                                                                                            const isPurchaseBest = variant === bestPurchaseVariant && purchases > 0;
                                                                                            const isWinner = isSignUpBest || isPurchaseBest;

                                                                                            return (
                                                                                                <div key={variant} className="bg-neutral-800/40 border border-neutral-700/40 rounded-lg p-4">
                                                                                                    <div className="flex items-center justify-between mb-3">
                                                                                                        <div className="flex items-center">
                                                                                                            {isWinner && <Award className="w-4 h-4 mr-1.5 text-purple-400" />}
                                                                                                            <span className="text-sm font-medium text-white">Variant {variant}</span>
                                                                                                        </div>
                                                                                                        <span className="text-xs text-gray-400">{users} users</span>
                                                                                                    </div>
                                                                                                    
                                                                                                    <div className="space-y-3">
                                                                                                        {/* Sign-ups */}
                                                                                                        <div className={`rounded-lg p-3 ${isSignUpBest ? 'bg-green-900/20' : 'bg-neutral-700/30'}`}>
                                                                                                            <div className="flex items-center justify-between mb-1">
                                                                                                                <div className="flex items-center text-xs text-gray-400">
                                                                                                                    <Target className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                                                                                                                    Sign-ups
                                                                                                                </div>
                                                                                                                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${isSignUpBest
                                                                                                                    ? 'bg-green-900/30 text-green-400'
                                                                                                                    : 'bg-neutral-700/50 text-gray-300'
                                                                                                                    }`}>
                                                                                                                    {signUpRate.toFixed(1)}%
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="text-sm font-medium text-white">{signUps}</div>
                                                                                                            {!isSignUpBest && signUpRate > 0 && (
                                                                                                                <div className="mt-1 text-xs text-red-400">
                                                                                                                    {(() => {
                                                                                                                        const bestRate = stats.conversions.sign_up[bestSignUpVariant] / stats.variant_distribution[bestSignUpVariant] * 100;
                                                                                                                        const diff = ((bestRate - signUpRate) / bestRate * 100).toFixed(1);
                                                                                                                        return `${diff}% worse than winner`;
                                                                                                                    })()}
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {/* Purchases */}
                                                                                                        <div className={`rounded-lg p-3 ${isPurchaseBest ? 'bg-green-900/20' : 'bg-neutral-700/30'}`}>
                                                                                                            <div className="flex items-center justify-between mb-1">
                                                                                                                <div className="flex items-center text-xs text-gray-400">
                                                                                                                    <PieChart className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                                                                                                                    Purchases
                                                                                                                </div>
                                                                                                                <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${isPurchaseBest
                                                                                                                    ? 'bg-green-900/30 text-green-400'
                                                                                                                    : 'bg-neutral-700/50 text-gray-300'
                                                                                                                    }`}>
                                                                                                                    {purchaseRate.toFixed(1)}%
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="text-sm font-medium text-white">{purchases}</div>
                                                                                                            {!isPurchaseBest && purchaseRate > 0 && (
                                                                                                                <div className="mt-1 text-xs text-red-400">
                                                                                                                    {(() => {
                                                                                                                        const bestRate = stats.conversions.buy[bestPurchaseVariant] / stats.variant_distribution[bestPurchaseVariant] * 100;
                                                                                                                        const diff = ((bestRate - purchaseRate) / bestRate * 100).toFixed(1);
                                                                                                                        return `${diff}% worse than winner`;
                                                                                                                    })()}
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center p-6 bg-neutral-800/40 border border-neutral-700/40 rounded-lg">
                                                                        <BarChart className="w-10 h-10 mx-auto mb-2 text-neutral-500" />
                                                                        <h4 className="text-lg font-medium text-gray-300 mb-1">No data collected yet</h4>
                                                                        <p className="text-gray-500 text-sm">This experiment doesn&apos;t have any user participation data yet.</p>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeSubTab === 'create' && !isMarketer && (
                <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Create New Experiment</h3>
                    <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="name">
                                    Experiment Name *
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={newExperiment.name}
                                    onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="e.g., Homepage Hero Test"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use a descriptive name that clearly identifies the test
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="description">
                                    Description
                                </label>
                                <input
                                    id="description"
                                    type="text"
                                    value={newExperiment.description}
                                    onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="e.g., Testing different hero headlines"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="end_date">
                                    End Date (Optional)
                                </label>
                                <input
                                    id="end_date"
                                    type="date"
                                    value={newExperiment.end_date}
                                    style={{ colorScheme: 'dark', outline: 'none' }}
                                    onChange={(e) => setNewExperiment({ ...newExperiment, end_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    The experiment will automatically end on this date if set
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Status
                                </label>
                                <div className="flex items-center space-x-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewExperiment({ ...newExperiment, active: !newExperiment.active })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newExperiment.active ? 'bg-purple-600' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newExperiment.active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        {newExperiment.active ? 'Active (will be applied to users)' : 'Inactive (draft mode)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Variants *
                                </label>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-2 py-1 rounded flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Variant
                                </button>
                            </div>
                            <div className="space-y-3">
                                {newExperiment.variants.map((variant, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={variant}
                                            onChange={(e) => updateVariantName(index, e.target.value, false)}
                                            className="flex-1 px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                            placeholder={`Variant ${index + 1}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="p-2 text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg"
                                            disabled={newExperiment.variants.length <= 2}
                                            title="Remove variant"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                At least two variants are required. Default: A and B.
                            </p>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('list')}
                                className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg flex items-center gap-2"
                            >
                                <X size={18} /> Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateExperiment}
                                disabled={isLoading}
                                className="px-6 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Create Experiment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'edit' && currentExperiment && !isMarketer && (
                <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Edit Experiment</h3>
                    <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="edit-name">
                                    Experiment Name *
                                </label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={currentExperiment.name}
                                    onChange={(e) => setCurrentExperiment({ ...currentExperiment, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="e.g., Homepage Hero Test"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="edit-description">
                                    Description
                                </label>
                                <input
                                    id="edit-description"
                                    type="text"
                                    value={currentExperiment.description || ''}
                                    onChange={(e) => setCurrentExperiment({ ...currentExperiment, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                    placeholder="e.g., Testing different hero headlines"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="edit-end-date">
                                    End Date (Optional)
                                </label>
                                <input
                                    id="edit-end-date"
                                    type="date"
                                    value={currentExperiment.end_date || ''}
                                    style={{ colorScheme: 'dark', outline: 'none' }}
                                    onChange={(e) => setCurrentExperiment({ ...currentExperiment, end_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Status
                                </label>
                                <div className="flex items-center space-x-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentExperiment({ ...currentExperiment, active: !currentExperiment.active })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentExperiment.active ? 'bg-purple-600' : 'bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentExperiment.active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        {currentExperiment.active ? 'Active (will be applied to users)' : 'Inactive (draft mode)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Variants *
                                </label>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-2 py-1 rounded flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Variant
                                </button>
                            </div>
                            <div className="space-y-3">
                                {currentExperiment.variants.map((variant, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={variant}
                                            onChange={(e) => updateVariantName(index, e.target.value, true)}
                                            className="flex-1 px-4 py-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-white"
                                            placeholder={`Variant ${index + 1}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="p-2 text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg"
                                            disabled={currentExperiment.variants.length <= 2 || (currentExperiment.stats?.total_users || 0) > 0}
                                            title="Remove variant"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {currentExperiment.stats && currentExperiment.stats.total_users > 0 && (
                            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-yellow-300 text-sm font-medium">Warning: Users already assigned to this experiment</p>
                                        <p className="text-yellow-400/80 text-xs mt-1">
                                            Changing variants may affect data consistency. {currentExperiment.stats.total_users} users
                                            are currently participating in this experiment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => setActiveSubTab('list')}
                                className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg flex items-center gap-2"
                            >
                                <X size={18} /> Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateExperiment}
                                disabled={isLoading}
                                className="px-6 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-lg flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> Update Experiment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 