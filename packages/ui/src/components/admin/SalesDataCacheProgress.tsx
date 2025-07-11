'use client';

import React, { useState, useCallback } from 'react';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CacheProgressProps {
    startDate: string;
    endDate: string;
    onCacheComplete: () => void;
}

export function SalesDataCacheProgress({ startDate, endDate, onCacheComplete }: CacheProgressProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isWarming, setIsWarming] = useState(false);
    const [cacheStatus, setCacheStatus] = useState<{
        total_days: number;
        cached_days: number;
        missing_days: number;
        cache_complete: boolean;
    } | null>(null);
    const [warmingProgress, setWarmingProgress] = useState<{
        newly_cached_days: number;
        failed_days: number;
        errors?: string[];
    } | null>(null);

    const checkCache = useCallback(async () => {
        setIsChecking(true);
        try {
            const result = await fetchJsonPost('/api/admin/sokol-cache-warmup', {
                start_date: startDate,
                end_date: endDate,
                check_only: true
            });
            
            setCacheStatus(result);
            
            // If cache is complete, proceed immediately
            if (result.cache_complete) {
                onCacheComplete();
            }
        } catch (error) {
            console.error('Error checking cache:', error);
        } finally {
            setIsChecking(false);
        }
    }, [startDate, endDate, onCacheComplete]);

    const warmCache = async () => {
        setIsWarming(true);
        setWarmingProgress(null);
        
        try {
            const result = await fetchJsonPost('/api/admin/sokol-cache-warmup', {
                start_date: startDate,
                end_date: endDate,
                check_only: false
            }, 60000); // 60 second timeout for cache warming
            
            setWarmingProgress({
                newly_cached_days: result.newly_cached_days,
                failed_days: result.failed_days,
                errors: result.errors
            });
            
            // Update cache status
            if (cacheStatus) {
                setCacheStatus({
                    ...cacheStatus,
                    cached_days: result.cached_days,
                    missing_days: result.failed_days,
                    cache_complete: result.failed_days === 0
                });
            }
            
            // If warming completed successfully, proceed
            if (!result.errors || result.errors.length === 0) {
                setTimeout(() => {
                    onCacheComplete();
                }, 1000); // Small delay for user to see completion
            }
        } catch (error) {
            console.error('Error warming cache:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            let displayError = `Cache warming failed: ${errorMessage}`;

            if (errorMessage.includes("Facebook account is not connected")) {
                displayError = "Facebook account is not connected. Please go to the Integrations page to connect it.";
            }

            setWarmingProgress({
                newly_cached_days: 0,
                failed_days: cacheStatus?.missing_days || 0,
                errors: [displayError]
            });
        } finally {
            setIsWarming(false);
        }
    };

    // Auto-check cache on mount
    React.useEffect(() => {
        checkCache();
    }, [startDate, endDate, checkCache]);

    if (!cacheStatus) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="ml-2 text-gray-300">Checking cache status...</span>
            </div>
        );
    }

    if (cacheStatus.cache_complete && !warmingProgress) {
        return null; // Cache is ready, no UI needed
    }

    const progressPercent = Math.round((cacheStatus.cached_days / cacheStatus.total_days) * 100);

    return (
        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Data Cache Status</h3>
            
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{cacheStatus.cached_days} of {cacheStatus.total_days} days cached</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-neutral-700/50 rounded-full h-2 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Status Messages */}
            {cacheStatus.missing_days > 0 && !isWarming && !warmingProgress && (
                <div className="flex items-start space-x-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                        <p className="font-medium">Cache incomplete</p>
                        <p className="text-gray-400">
                            {cacheStatus.missing_days} days of data need to be cached before generating the report.
                            This is a one-time process that may take a few minutes.
                        </p>
                    </div>
                </div>
            )}

            {isWarming && (
                <div className="flex items-center space-x-2 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-300">
                        Warming cache... This may take several minutes for large date ranges.
                    </span>
                </div>
            )}

            {warmingProgress && (
                <div className="space-y-2 mb-4">
                    {warmingProgress.errors && warmingProgress.errors.length > 0 ? (
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-red-400 font-medium">Cache warming completed with errors</p>
                                <ul className="text-gray-400 mt-1 space-y-1">
                                    {warmingProgress.errors.map((error, idx) => (
                                        <li key={idx} className="text-xs">
                                            {error}
                                            {error.includes("Facebook account is not connected") && (
                                                <Link href="/admin/integrations" className="text-indigo-400 hover:underline ml-2 font-semibold">
                                                    Go to Integrations
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-green-400">
                                Successfully cached {warmingProgress.newly_cached_days} days of data!
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
                {!cacheStatus.cache_complete && !isWarming && !warmingProgress && (
                    <button
                        onClick={warmCache}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        Start Cache Warming
                    </button>
                )}

                {warmingProgress && warmingProgress.errors && warmingProgress.errors.length > 0 && (
                    <>
                        <button
                            onClick={warmCache}
                            disabled={isWarming}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            Retry Failed Days
                        </button>
                        <button
                            onClick={onCacheComplete}
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                            Continue Anyway
                        </button>
                    </>
                )}

                {warmingProgress && (!warmingProgress.errors || warmingProgress.errors.length === 0) && (
                    <button
                        onClick={onCacheComplete}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        Continue to Report
                    </button>
                )}

                {isChecking && (
                    <button
                        disabled
                        className="px-4 py-2 bg-neutral-700 text-gray-400 rounded-lg font-medium text-sm opacity-50"
                    >
                        Checking...
                    </button>
                )}
            </div>
        </div>
    );
} 