'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserPlus, CheckCircle, DollarSign, ShoppingBag, Globe, Mail, AlertCircle, Database, CreditCard, RotateCcw, ChevronDown, ChevronRight, Zap, ArrowUpRight, ChevronUp } from 'lucide-react';
import { fetchJsonPost, formatCurrency, formatDateWithDayShort, getFlagUrl, formatDate } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { getSalesDataCache, setSalesDataCache, clearSalesDataCache } from '@repo/ui/lib/dbUtils';
import { AdminSalesData, CampaignInfo, AdSetInfo, AdInfo, AttributedPurchase, TrackedStep } from '@repo/ui/lib/types';
import Image from 'next/image';
import { SalesDataCacheProgress } from '@repo/ui/components/admin/SalesDataCacheProgress';

const SALES_DATA_ACTIVE_VIEW_LS_KEY = 'salesData_activeView';
const SALES_DATA_SOURCE_DISPLAY_LS_KEY = 'salesData_sourceDisplayOption';
const SALES_DATA_START_DATE_LS_KEY = 'salesData_startDate';
const SALES_DATA_END_DATE_LS_KEY = 'salesData_endDate';
const SALES_DATA_CURRENCY_LS_KEY = 'salesData_currency';
const SALES_DATA_FB_ATTRIBUTION_LS_KEY = 'salesData_fbAttributionOption';
const SALES_DATA_URL_LS_KEY = 'salesData_url';

// Helper function to format date to YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// The 'Grouped' view has been removed, so we define a simpler type for the sortable columns used in the individual view.
type GroupSortColumn = 'name' | 'spend' | 'sales' | 'cash' | 'roas';

export function SalesDataTab() {
    const [startDate, setStartDate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(SALES_DATA_START_DATE_LS_KEY) || formatDateLocal(new Date());
        }
        return formatDateLocal(new Date());
    });

    const [endDate, setEndDate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(SALES_DATA_END_DATE_LS_KEY) || formatDateLocal(new Date());
        }
        return formatDateLocal(new Date());
    });

    const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(SALES_DATA_CURRENCY_LS_KEY) || 'USD';
        }
        return 'USD';
    });

    const [selectedUrl, setSelectedUrl] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(SALES_DATA_URL_LS_KEY) || '/';
        }
        return '/';
    });

    const [appliedFilters, setAppliedFilters] = useState(() => ({
        startDate: typeof window !== 'undefined' ? localStorage.getItem(SALES_DATA_START_DATE_LS_KEY) || formatDateLocal(new Date()) : formatDateLocal(new Date()),
        endDate: typeof window !== 'undefined' ? localStorage.getItem(SALES_DATA_END_DATE_LS_KEY) || formatDateLocal(new Date()) : formatDateLocal(new Date()),
        currency: typeof window !== 'undefined' ? localStorage.getItem(SALES_DATA_CURRENCY_LS_KEY) || 'USD' : 'USD',
        url: typeof window !== 'undefined' ? localStorage.getItem(SALES_DATA_URL_LS_KEY) || '/' : '/'
    }));

    const [activeView, setActiveView] = useState<'summary' | 'signups' | 'orders' | 'adspend' | 'visitors' | 'countries' | 'paymentMethods'>(
        () => typeof window !== 'undefined' ? (localStorage.getItem(SALES_DATA_ACTIVE_VIEW_LS_KEY) as any) || 'summary' : 'summary'
    );

    const [sourceDisplayOption, setSourceDisplayOption] = useState<'first' | 'last'>(
        () => typeof window !== 'undefined' ? (localStorage.getItem(SALES_DATA_SOURCE_DISPLAY_LS_KEY) as any) || 'first' : 'first'
    );

    const [fbAttributionOption, setFbAttributionOption] = useState<'first' | 'last'>(
        () => typeof window !== 'undefined' ? (localStorage.getItem(SALES_DATA_FB_ATTRIBUTION_LS_KEY) as any) || 'last' : 'last'
    );

    const [currentRange, setCurrentRange] = useState<string>('');
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AdminSalesData | null>(null);
    const [expandedOrderRows, setExpandedOrderRows] = useState<number[]>([]);
    const [cacheCheckRequired, setCacheCheckRequired] = useState<boolean>(false);
    const [isDataFromCache, setIsDataFromCache] = useState<boolean>(false);

    // Mobile menu state
    const [mobileViewMenuOpen, setMobileViewMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(SALES_DATA_ACTIVE_VIEW_LS_KEY, activeView);
    }, [activeView]);

    useEffect(() => {
        localStorage.setItem(SALES_DATA_FB_ATTRIBUTION_LS_KEY, 'last');
    }, []);

    const handleCacheComplete = () => {
        setCacheCheckRequired(false);
        fetchSalesData();
    };

    const handleClearCache = async () => {
        await clearSalesDataCache();
        setData(null); // Clear current data
        setIsDataFromCache(false);
        alert('Client-side cache has been cleared. Apply filters again to fetch fresh data.');
    };

    const fetchSalesData = async () => {
        setLoading(true);
        setError(null);
        setIsDataFromCache(false); // Reset cache status on new fetch

        try {
            // Check if date range includes today
            const today = new Date();
            const todayStr = formatDateLocal(today);
            const endDateIsToday = appliedFilters.endDate >= todayStr;

            // Generate cache key for client-side cache (include URL in cache key)
            const cacheKey = `sales_${appliedFilters.startDate}_${appliedFilters.endDate}_${appliedFilters.currency}_${appliedFilters.url.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // Try to get cached data first (from IndexedDB), but NOT if range includes today
            if (!endDateIsToday) {
                const cachedData = await getSalesDataCache(cacheKey);

                if (cachedData) {
                    console.log('Using client-side cached sales data');
                    delete (cachedData as any)._cacheTimestamp; // clean up old property if present
                    setData(cachedData);
                    setIsDataFromCache(true); // Set cache status
                    setLoading(false);
                    return;
                }
            } else {
                console.log("Fetching fresh data because date range includes today.");
            }

            // If no client-side cache, fetch from API
            const fetchedData = await fetchJsonPost('/api/admin/sokol-sales-data', {
                start_date: appliedFilters.startDate,
                end_date: appliedFilters.endDate,
                base_currency: appliedFilters.currency,
                url: appliedFilters.url
            });

            // Save to client-side cache for future use, but NOT if range includes today
            if (!endDateIsToday) {
                await setSalesDataCache(cacheKey, fetchedData);
            }

            setData(fetchedData);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('"code":190') || errorMessage.includes('OAuthException')) {
                setError('Your Facebook connection has expired. Please go to the Integrations page to reconnect.');
            } else {
                setError(errorMessage);
                sendClientErrorEmail('Error during sales data fetch:', err);
            }
            setData(null);

        } finally {
            setLoading(false);
        }
    }

    const saveFilterSettings = () => {
        localStorage.setItem(SALES_DATA_START_DATE_LS_KEY, startDate);
        localStorage.setItem(SALES_DATA_END_DATE_LS_KEY, endDate);
        localStorage.setItem(SALES_DATA_CURRENCY_LS_KEY, selectedCurrency);
        localStorage.setItem(SALES_DATA_URL_LS_KEY, selectedUrl);
    };

    const handleDateRangeSelect = (range: string) => {
        const today = new Date();
        const todayStr = formatDateLocal(today);

        let start = todayStr;
        let end = todayStr;

        switch (range) {
            case 'today':
                // Already set to today
                break;

            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = formatDateLocal(yesterday);
                end = start;
                break;

            case 'this_week':
                const thisWeekStart = new Date(today);
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                thisWeekStart.setDate(today.getDate() - diff);
                start = formatDateLocal(thisWeekStart);
                break;

            case 'last_week':
                const lastWeekStart = new Date(today);
                const lastWeekEnd = new Date(today);
                const thisWeekDiff = today.getDay() === 0 ? 6 : today.getDay() - 1;
                lastWeekStart.setDate(today.getDate() - thisWeekDiff - 7);
                lastWeekEnd.setDate(today.getDate() - thisWeekDiff - 1);
                start = formatDateLocal(lastWeekStart);
                end = formatDateLocal(lastWeekEnd);
                break;

            case 'this_month':
                const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                start = formatDateLocal(thisMonthStart);
                break;

            case 'last_month':
                // Calculate the first and last day of the previous month
                // Handle year boundaries correctly
                let lastMonthYear = today.getFullYear();
                let lastMonth = today.getMonth() - 1;
                
                // If we're in January (month 0), last month is December (11) of previous year
                if (lastMonth < 0) {
                    lastMonth = 11;
                    lastMonthYear--;
                }
                
                const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
                const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);

                start = formatDateLocal(lastMonthStart);
                end = formatDateLocal(lastMonthEnd);

                break;

            case 'this_quarter':
                const currentQuarter = Math.floor(today.getMonth() / 3);
                const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
                start = formatDateLocal(thisQuarterStart);
                break;

            case 'last_quarter':
                // Calculate the previous quarter, handling year boundaries
                const currentQ = Math.floor(today.getMonth() / 3); // 0-3
                let lastQuarter = currentQ - 1;
                let lastQuarterYear = today.getFullYear();
                
                // If we're in Q1, last quarter is Q4 of previous year
                if (lastQuarter < 0) {
                    lastQuarter = 3;
                    lastQuarterYear--;
                }
                
                const lastQuarterFirstMonth = lastQuarter * 3; // 0, 3, 6, or 9
                const lastQuarterStart = new Date(lastQuarterYear, lastQuarterFirstMonth, 1);
                const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterFirstMonth + 3, 0);
                start = formatDateLocal(lastQuarterStart);
                end = formatDateLocal(lastQuarterEnd);
                break;

            case 'this_year':
                const thisYearStart = new Date(today.getFullYear(), 0, 1);
                start = formatDateLocal(thisYearStart);
                break;

            case 'last_year':
                const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
                const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
                start = formatDateLocal(lastYearStart);
                end = formatDateLocal(lastYearEnd);
                break;

            case 'last_7_days':
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 6);
                start = formatDateLocal(last7Days);
                break;

            case 'last_30_days':
                const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 29);
                start = formatDateLocal(last30Days);
                break;

            case 'custom':
                return;
        }

        setStartDate(start);
        setEndDate(end);
        setCurrentRange(range);
    };

    async function handleSubmit(event?: React.FormEvent) {
        if (event)
            event.preventDefault();

        if (isLoading)
            return;

        // Validate URL field
        if (!selectedUrl || selectedUrl.trim() === '') {
            setError('URL field is required. Use "/" to track visitors from the homepage.');
            return;
        }

        // Validate dates before proceeding
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const minDate = new Date('2025-02-01');

        // Check if start date is after end date
        if (startDateObj > endDateObj) {
            setError('Start date must be before or equal to end date');
            return;
        }

        // Check if dates are in the future
        if (startDateObj > today || endDateObj > today) {
            setError('Dates cannot be in the future');
            return;
        }

        // Check if dates are before February 1, 2025
        if (startDateObj < minDate || endDateObj < minDate) {
            setError('Dates cannot be before February 1, 2025');
            return;
        }

        saveFilterSettings();
        setAppliedFilters({ startDate, endDate, currency: selectedCurrency, url: selectedUrl });
        
        // Instead of fetching data directly, trigger the cache check
        setCacheCheckRequired(true);
        setData(null); // Clear previous data
        setError(null);
    }

    const { topCountry, topPaymentMethod, paymentMethodData, detailedCountryData } = useMemo(() => {
        if (!data)
            return {
                topCountry: '-',
                topPaymentMethod: '-',
                paymentMethodData: [],
                detailedCountryData: []
            };

        const leadsByCountry: Record<string, number> = {};
        const purchasesByCountry: Record<string, number> = {};
        const countryAmounts: Record<string, number> = {};
        const paymentMethodCounts: Record<string, number> = {};
        const paymentMethodAmounts: Record<string, number> = {};

        data.purchases.forEach(purchase => {
            if (!purchase.metadata?.region)
                throw new Error(`Purchase with ID ${purchase.id} is missing region data.`);

            if (!purchase.metadata?.payment_method)
                throw new Error(`Purchase with ID ${purchase.id} is missing payment_method data.`);

            purchasesByCountry[purchase.metadata.region] = (purchasesByCountry[purchase.metadata.region] || 0) + 1;
            countryAmounts[purchase.metadata.region] = (countryAmounts[purchase.metadata.region] || 0) + purchase.local_value;
            paymentMethodCounts[purchase.metadata.payment_method] = (paymentMethodCounts[purchase.metadata.payment_method] || 0) + 1;
            paymentMethodAmounts[purchase.metadata.payment_method] = (paymentMethodAmounts[purchase.metadata.payment_method] || 0) + purchase.local_value;
        });

        data.sign_ups_unique.forEach(signup => {
            if (!signup.metadata?.region)
                throw new Error(`Signup with ID ${signup.id} (Email: ${signup.metadata?.email}) is missing region data.`);

            leadsByCountry[signup.metadata.region] = (leadsByCountry[signup.metadata.region] || 0) + 1;
        });

        const allCountries = new Set([...Object.keys(countryAmounts), ...Object.keys(leadsByCountry), ...Object.keys(purchasesByCountry)]);

        const calculatedDetailedCountryData = Array.from(allCountries).map(country => {
            const cash = countryAmounts[country] || 0;
            const leads = leadsByCountry[country] || 0;
            const purchases = purchasesByCountry[country] || 0;
            const conversionRate = leads > 0 ? (purchases / leads) * 100 : 0;

            return {
                name: country,
                cash,
                leads,
                purchases,
                conversionRate
            };
        }).sort((a, b) => b.cash - a.cash);

        const calculatedTopCountry = Object.entries(countryAmounts).reduce((max, [country, amount]) => amount > max[1] ? [country, amount] : max, ['', 0])[0] || '-';
        const calculatedTopPaymentMethod = Object.entries(paymentMethodCounts).reduce((max, [method, count]) => count > max[1] ? [method, count] : max, ['', 0])[0] || '-';
        const calculatedPaymentMethodData = Object.entries(paymentMethodAmounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        return {
            topCountry: calculatedTopCountry,
            topPaymentMethod: calculatedTopPaymentMethod,
            paymentMethodData: calculatedPaymentMethodData,
            detailedCountryData: calculatedDetailedCountryData
        };
    }, [data]);

    const recalculateFacebookData = useCallback((
        attributedPurchases: AttributedPurchase[],
        originalCampaigns: CampaignInfo[],
        attributionModel: 'first' | 'last'
    ): CampaignInfo[] => {
        // Clone the original campaigns structure but reset all sales and cash values
        const campaigns = new Map<string, CampaignInfo>();
        
        // First, deep clone the original structure with zeroed sales/cash
        originalCampaigns.forEach(campaign => {
            const newCampaign: CampaignInfo = {
                ...campaign,
                sales: 0,
                cash: 0,
                adsets: campaign.adsets.map(adset => ({
                    ...adset,
                    sales: 0,
                    cash: 0,
                    ads: adset.ads.map(ad => ({
                        ...ad,
                        sales: 0,
                        cash: 0
                    }))
                }))
            };
            campaigns.set(campaign.campaign_id, newCampaign);
        });
        
        // Now attribute purchases based on the selected model
        attributedPurchases.forEach(purchase => {
            // Find the Facebook step based on attribution model
            let fbStep: TrackedStep | null = null;
            
            if (attributionModel === 'first') {
                // Find the first Facebook step
                for (const step of purchase.steps) {
                    if (step.campaignId && step.adsetId && step.adId) {
                        fbStep = step;
                        break;
                    }
                }
            } else {
                // Find the last Facebook step
                for (let i = purchase.steps.length - 1; i >= 0; i--) {
                    const step = purchase.steps[i];
                    if (step.campaignId && step.adsetId && step.adId) {
                        fbStep = step;
                        break;
                    }
                }
            }
            
            if (fbStep && fbStep.campaignId && fbStep.adsetId && fbStep.adId) {
                const campaign = campaigns.get(fbStep.campaignId);
                if (campaign) {
                    campaign.sales++;
                    campaign.cash += purchase.cash;
                    
                    const adset = campaign.adsets.find(a => a.adset_id === fbStep!.adsetId);
                    if (adset) {
                        adset.sales++;
                        adset.cash += purchase.cash;
                        
                        const ad = adset.ads.find(a => a.ad_id === fbStep!.adId);
                        if (ad) {
                            ad.sales++;
                            ad.cash += purchase.cash;
                        }
                    }
                }
            }
        });
        
        return Array.from(campaigns.values());
    }, []);

    const getRoasValue = (item: { cash: number, spend: number }) => {
        if (!item.spend || item.spend === 0)
            return 0;

        return item.cash / item.spend;
    };

    const recalculatedFacebookData = useMemo(() => {
        if (!data || !data.facebook_sales_data?.individual?.campaigns || !data.attributed_purchases) {
            return [];
        }
        
        return recalculateFacebookData(
            data.attributed_purchases,
            data.facebook_sales_data.individual.campaigns,
            fbAttributionOption
        );
    }, [data, fbAttributionOption, recalculateFacebookData]);

    const sortItems = useCallback((items: any[], sortCol: GroupSortColumn, sortDir: 'asc' | 'desc') => {
        return [...items].sort((a, b) => {
            let valueA, valueB;

            if (sortCol === 'roas') {
                valueA = getRoasValue(a);
                valueB = getRoasValue(b);

            } else if (sortCol === 'name') {
                valueA = (a.name || a.campaign_name || a.adset_name || a.ad_name)?.toLowerCase() || '';
                valueB = (b.name || b.campaign_name || b.adset_name || b.ad_name)?.toLowerCase() || '';

            } else {
                valueA = a[sortCol] || 0;
                valueB = b[sortCol] || 0;
            }

            const sortMod = sortDir === 'asc' ? 1 : -1;

            if (typeof valueA === 'string')
                return sortMod * valueA.localeCompare(valueB as string);
            else
                return sortMod * (valueA - (valueB as number));
        });
    }, []);

    const toggleOrderRow = (purchaseId: number) => {
        setExpandedOrderRows(prev => prev.includes(purchaseId) ? prev.filter(id => id !== purchaseId) : [...prev, purchaseId]
        );
    };

    const getAttributionForPurchase = (purchaseId: number) => {
        return data?.attributed_purchases.find(ap => ap.purchaseId === purchaseId);
    }

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                Sales Data {isDataFromCache && <span className="text-sm font-normal text-gray-400">(from client cache)</span>}
            </h2>

            {/* Date Range Controls - Mobile Optimized */}
            <form onSubmit={handleSubmit} className="mb-4 sm:mb-6 lg:mb-8">
                <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* First Row: Range, Date Fields (desktop), Currency, URL, Apply */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                        {/* Range Selector */}
                        <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Range</label>
                            <select
                                onChange={(e) => handleDateRangeSelect(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 h-[38px] sm:h-[42px] text-sm focus:ring-orange-500 focus:border-orange-500"
                                style={{ backgroundColor: "#191919" }}
                                value={currentRange}
                            >
                                <option value="custom">Custom Range</option>
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
                            </select>
                        </div>

                        {/* Start Date - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:block lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ colorScheme: 'dark', outline: 'none' }}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 h-[38px] sm:h-[42px] text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        {/* End Date - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:block lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ colorScheme: 'dark', outline: 'none' }}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 h-[38px] sm:h-[42px] text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        {/* Currency */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Currency</label>
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 h-[38px] sm:h-[42px] text-sm focus:ring-orange-500 focus:border-orange-500"
                                style={{ backgroundColor: "#191919" }}
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="BAM">BAM</option>
                                <option value="RSD">RSD</option>
                            </select>
                        </div>

                        {/* URL Field - Responsive sizing */}
                        <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                                URL <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={selectedUrl}
                                onChange={(e) => setSelectedUrl(e.target.value)}
                                placeholder='e.g. / or /knjiga'
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 h-[38px] sm:h-[42px] text-sm focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        {/* Apply Button */}
                        <div className="sm:col-span-2 lg:col-span-2 flex items-end space-x-2">
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg whitespace-nowrap font-medium text-sm"
                            >
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={handleClearCache}
                                title="Clear client-side cache"
                                className="p-3 bg-red-800/50 hover:bg-red-700/50 text-white rounded-lg"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Second Row: Date inputs for mobile and URL help text */}
                    <div className="space-y-3">
                        {/* Date inputs (only visible on mobile/tablet when custom range selected) */}
                        {currentRange === 'custom' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ colorScheme: 'dark', outline: 'none' }}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ colorScheme: 'dark', outline: 'none' }}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white px-2.5 sm:px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* URL Help Text */}
                        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-md">
                            <p className="text-xs sm:text-sm text-blue-200">
                                <strong>URL field:</strong> Tracks visitors to specific pages. Use &quot;/&quot; for homepage, or enter the sales page path (e.g., &quot;/knjiga&quot;). This filters analytics to show only data from visitors who landed on that specific URL.
                            </p>
                        </div>
                    </div>
                </div>
            </form>

            {/* Error State */}
            {error && (
                <div className="bg-red-900/30 border-l-4 border-red-500 text-white p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-md">
                    <p className="text-sm sm:text-base">{error}</p>
                </div>
            )}

            {/* Loading State or Cache Progress */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-40 space-y-3">
                    <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="text-gray-300 text-sm">Compiling sales data...</p>
                </div>
            ) : cacheCheckRequired ? (
                <SalesDataCacheProgress
                    startDate={appliedFilters.startDate}
                    endDate={appliedFilters.endDate}
                    onCacheComplete={handleCacheComplete}
                />
            ) : (
                <>
                    {data ? (
                        <div>
                            {/* Mobile View Selector */}
                            <div className="sm:hidden mb-4">
                                <button
                                    onClick={() => setMobileViewMenuOpen(!mobileViewMenuOpen)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                                >
                                    <span className="text-sm font-medium">
                                        {activeView === 'summary' ? 'Summary' :
                                            activeView === 'signups' ? 'Sign-ups' :
                                                activeView === 'orders' ? 'Orders' :
                                                    activeView === 'adspend' ? 'Ad Spend' :
                                                        activeView === 'visitors' ? 'Visitors' :
                                                            activeView === 'countries' ? 'Countries' :
                                                                'Payment Methods'}
                                    </span>
                                    {mobileViewMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {mobileViewMenuOpen && (
                                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                                        {['summary', 'signups', 'orders', 'adspend', 'visitors', 'countries', 'paymentMethods'].map((view) => (
                                            <button
                                                key={view}
                                                onClick={() => {
                                                    setActiveView(view as any);
                                                    setMobileViewMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm ${activeView === view
                                                        ? 'bg-purple-600/20 text-purple-300'
                                                        : 'text-gray-300 hover:bg-neutral-800/50'
                                                    } border-b border-neutral-700/50 last:border-b-0`}
                                            >
                                                {view === 'summary' ? 'Summary' :
                                                    view === 'signups' ? 'Sign-ups' :
                                                        view === 'orders' ? 'Orders' :
                                                            view === 'adspend' ? 'Ad Spend' :
                                                                view === 'visitors' ? 'Visitors' :
                                                                    view === 'countries' ? 'Countries' :
                                                                        'Payment Methods'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary Cards - Responsive Grid */}
                            <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 ${activeView !== 'summary' ? 'hidden sm:grid' : ''}`}>

                                {/* Total Adspend Card */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'adspend'
                                        ? 'from-blue-700/60 to-blue-600/50 ring-2 ring-blue-500'
                                        : 'from-blue-900/40 to-blue-800/30 hover:from-blue-800/40 hover:to-blue-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('adspend')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-blue-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Total Adspend</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {data.total_adspend.toLocaleString(undefined, { style: 'currency', currency: selectedCurrency })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Visitors Card */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'visitors'
                                        ? 'from-slate-700/60 to-slate-600/50 ring-2 ring-slate-500'
                                        : 'from-slate-900/40 to-slate-800/30 hover:from-slate-800/40 hover:to-slate-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-slate-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('visitors')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-slate-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Visitors</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {data.visitors.length.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Sign-ups Card */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'signups'
                                        ? 'from-purple-700/60 to-purple-600/50 ring-2 ring-purple-500'
                                        : 'from-purple-900/40 to-purple-800/30 hover:from-purple-800/40 hover:to-purple-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-purple-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('signups')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-purple-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-purple-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Sign-ups</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {data.sign_ups_unique.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Orders Card */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'orders'
                                        ? 'from-green-700/60 to-green-600/50 ring-2 ring-green-500'
                                        : 'from-green-900/40 to-green-800/30 hover:from-green-800/40 hover:to-green-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-green-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('orders')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-green-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-green-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Orders</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {data.purchases.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Cash Card */}
                                <div
                                    className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-500/20 shadow-xl transition-all"
                                >
                                    <div className="flex items-center">
                                        <div className="bg-emerald-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-emerald-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Total Cash</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {data.total_cash.toLocaleString(undefined, { style: 'currency', currency: appliedFilters.currency })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ROAS Card */}
                                <div
                                    className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-500/20 shadow-xl transition-all"
                                >
                                    <div className="flex items-center">
                                        <div className="bg-blue-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <Zap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">ROAS</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {(data.total_adspend > 0 ? data.total_cash / data.total_adspend : 0).toFixed(2)}x
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* AOV Card */}
                                <div
                                    className="bg-gradient-to-br from-red-900/40 to-red-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-red-500/20 shadow-xl transition-all"
                                >
                                    <div className="flex items-center">
                                        <div className="bg-red-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-red-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">AOV</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {(data.purchases.length > 0 ? data.total_cash / data.purchases.length : 0).toLocaleString(undefined, { style: 'currency', currency: appliedFilters.currency })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Bump Conversion Rate */}
                                <div
                                    className="bg-gradient-to-br from-orange-900/40 to-orange-800/30 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-orange-500/20 shadow-xl transition-all"
                                >
                                    <div className="flex items-center">
                                        <div className="bg-orange-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-orange-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Order Bump Rate</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {Math.round(data.order_bump_conversion_rate * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Country Card */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'countries'
                                        ? 'from-cyan-700/60 to-cyan-600/50 ring-2 ring-cyan-500'
                                        : 'from-cyan-900/40 to-cyan-800/30 hover:from-cyan-800/40 hover:to-cyan-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-cyan-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('countries')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-cyan-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-cyan-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Top Country</h3>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                {topCountry && topCountry !== '-' && (
                                                    <div className="relative w-4 h-2.5 sm:w-5 sm:h-3 rounded overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={getFlagUrl(topCountry)}
                                                            alt={`Flag of ${topCountry}`}
                                                            fill
                                                            sizes="20px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                    {topCountry}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Payment Method */}
                                <div
                                    className={`bg-gradient-to-br ${activeView === 'paymentMethods'
                                        ? 'from-fuchsia-700/60 to-fuchsia-600/50 ring-2 ring-fuchsia-500'
                                        : 'from-fuchsia-900/40 to-fuchsia-800/30 hover:from-fuchsia-800/40 hover:to-fuchsia-700/30'
                                        } backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-fuchsia-500/20 shadow-xl cursor-pointer transition-all`}
                                    onClick={() => setActiveView('paymentMethods')}
                                >
                                    <div className="flex items-center">
                                        <div className="bg-fuchsia-600/30 p-2 sm:p-2.5 lg:p-3 rounded-md sm:rounded-lg lg:rounded-xl mr-2 sm:mr-3 lg:mr-4">
                                            {topPaymentMethod === 'stripe' ? (
                                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-fuchsia-400" />
                                            ) : topPaymentMethod === 'paypal' ? (
                                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-fuchsia-400" />
                                            ) : topPaymentMethod === 'quick_pay' ? (
                                                <Zap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-fuchsia-400" />
                                            ) : (
                                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7 text-fuchsia-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-gray-300 font-medium text-[10px] sm:text-xs lg:text-sm truncate">Top Payment</h3>
                                            <p className="text-white text-sm sm:text-lg lg:text-xl font-bold truncate">
                                                {topPaymentMethod === 'stripe' ? 'Stripe' :
                                                    topPaymentMethod === 'paypal' ? 'PayPal' :
                                                        topPaymentMethod === 'quick_pay' ? 'Quick Pay' :
                                                            topPaymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sign-ups */}
                            {activeView === 'signups' && (
                                <div className="mt-4 sm:mt-6 lg:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-3 sm:p-4 lg:p-6">
                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">Sign-ups ({data.sign_ups_all.length} Total, {data.sign_ups_unique.length} Unique)</h3>
                                    {data.sign_ups_all.length > 0 ? (
                                        <>
                                            {/* Mobile Card View */}
                                            <div className="block sm:hidden space-y-2">
                                                {data.sign_ups_all.map((signup: any) => (
                                                    <div
                                                        key={`${signup.id}-${signup.nonUniqueReason || 'uniq'}`}
                                                        className={`p-3 rounded-lg border ${signup.nonUniqueReason
                                                                ? 'bg-red-900/20 border-red-500/30'
                                                                : 'bg-neutral-800/40 border-neutral-700/50'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${signup.nonUniqueReason ? 'text-red-300' : 'text-white'}`}>{signup.metadata.email}</p>
                                                                <p className="text-xs text-gray-400 truncate">{signup.metadata.name}</p>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{formatDateWithDayShort(signup.date)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs bg-neutral-700/50 px-2 py-1 rounded text-gray-300">{signup.metadata.region}</span>
                                                            {signup.nonUniqueReason && (
                                                                <span className="text-xs text-red-400 font-semibold">
                                                                    {signup.nonUniqueReason === 'duplicate' ? 'Duplicate' :
                                                                    `Previously registered on ${formatDate(new Date(signup.previousRegistrationDate!))}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden sm:block overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
                                                <div className="inline-block min-w-full align-middle px-3 sm:px-4 lg:px-0">
                                                    <table className="min-w-full divide-y divide-neutral-800/50">
                                                        <thead className="bg-neutral-800/50">
                                                            <tr>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Name</th>
                                                                <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Region</th>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exclusion Reason</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-800/50">
                                                            {data.sign_ups_all.map((signup: any) => (
                                                                <tr
                                                                    key={`${signup.id}-${signup.nonUniqueReason || 'uniq'}`}
                                                                    className={`transition-colors ${signup.nonUniqueReason ? 'text-red-400 bg-red-900/10 hover:bg-red-900/20' : 'text-gray-300 hover:bg-neutral-800/40'}`}
                                                                >
                                                                    <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">{formatDateWithDayShort(signup.date)}</td>
                                                                    <td className="px-3 py-2 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px] lg:max-w-xs">{signup.metadata.email}</td>
                                                                    <td className="px-3 py-2 text-xs sm:text-sm truncate max-w-xs hidden lg:table-cell">{signup.metadata.name}</td>
                                                                    <td className="px-3 py-2 text-xs sm:text-sm text-center">{signup.metadata.region}</td>
                                                                    <td className="px-3 py-2 text-xs sm:text-sm">
                                                                        {signup.nonUniqueReason ? (
                                                                            signup.nonUniqueReason === 'duplicate' ? 'Duplicate' :
                                                                            `Registered on ${formatDate(new Date(signup.previousRegistrationDate!))}`
                                                                        ) : (
                                                                            <span className="text-green-400">Unique</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-800/50 font-medium border-t-2 border-gray-600">
                                                            <tr>
                                                                <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-white">TOTALS</td>
                                                                <td colSpan={4} className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-white text-left">{data.sign_ups_unique.length} Unique sign-ups</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-center py-4 text-sm">No sign-ups in this period.</p>
                                    )}
                                </div>
                            )}

                            {/* Orders - Mobile Card View */}
                            {activeView === 'orders' && (
                                <div className="mt-6 sm:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                                        <h3 className="text-lg sm:text-xl font-semibold text-white">Orders ({data.purchases.length})</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs sm:text-sm text-gray-400">Source display:</span>
                                            <div className="flex bg-neutral-800 rounded-md p-0.5">
                                                <button
                                                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors ${sourceDisplayOption === 'first' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    onClick={() => {
                                                        setSourceDisplayOption('first');
                                                        localStorage.setItem(SALES_DATA_SOURCE_DISPLAY_LS_KEY, 'first');
                                                    }}
                                                >
                                                    First
                                                </button>
                                                <button
                                                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors ${sourceDisplayOption === 'last' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    onClick={() => {
                                                        setSourceDisplayOption('last');
                                                        localStorage.setItem(SALES_DATA_SOURCE_DISPLAY_LS_KEY, 'last');
                                                    }}
                                                >
                                                    Last
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {data.purchases.length > 0 ? (
                                        <>
                                            {/* Mobile Card View */}
                                            <div className="block sm:hidden space-y-3">
                                                {data.purchases.map((purchase) => {
                                                    const isExpanded = expandedOrderRows.includes(purchase.id);
                                                    const attributedPurchase = getAttributionForPurchase(purchase.id);
                                                    const steps = attributedPurchase ? attributedPurchase.steps : [];

                                                    return (
                                                        <div key={purchase.id} className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-4">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-sm text-gray-300 font-medium">
                                                                            {purchase.metadata.primary_offer_slug}
                                                                            {purchase.metadata.secondary_offer_slug && (
                                                                                <span className="text-purple-300"> + {purchase.metadata.secondary_offer_slug}</span>
                                                                            )}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">{formatDateWithDayShort(purchase.date)}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-green-400 font-bold">{formatCurrency(purchase.metadata.value!, purchase.metadata.currency!)}</p>
                                                                        <div className={`flex items-center justify-end mt-1 ${purchase.metadata.payment_status === 'refunded' ? 'text-red-400' : 'text-green-400'}`}>
                                                                            {purchase.metadata.payment_status === 'refunded' ? (
                                                                                <RotateCcw className="w-4 h-4" />
                                                                            ) : (
                                                                                <CheckCircle className="w-4 h-4" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">Email:</span>
                                                                        <span className="text-gray-300 truncate ml-2">{purchase.metadata.email}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">Name:</span>
                                                                        <span className="text-gray-300 truncate ml-2">{purchase.metadata.name}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">Country:</span>
                                                                        <span className="text-gray-300">{purchase.metadata.region}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-400">Payment:</span>
                                                                        <span className="text-gray-300 capitalize">{purchase.metadata.payment_method}</span>
                                                                    </div>
                                                                </div>

                                                                {steps.length > 0 && (
                                                                    <div className="pt-2 border-t border-neutral-700/50">
                                                                        <button
                                                                            onClick={() => toggleOrderRow(purchase.id)}
                                                                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                                                        >
                                                                            {isExpanded ? 'Hide' : 'Show'} Journey ({steps.length} steps)
                                                                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                                        </button>

                                                                        {isExpanded && (
                                                                            <ul className="mt-2 space-y-1 text-xs text-gray-400">
                                                                                {steps.map((step, index) => (
                                                                                    <li key={index} className="pl-2">• {step?.date ?? 'N/A'} - {step?.formatted ?? 'N/A'}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden sm:block overflow-x-auto">
                                                <table className="min-w-full divide-y divide-neutral-800/50">
                                                    <thead className="bg-neutral-800/50">
                                                        <tr>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Country</th>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                {sourceDisplayOption === 'first' ? 'First Source' : 'Last Source'}
                                                            </th>
                                                            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-800/50">
                                                        {data.purchases.map((purchase) => {
                                                            const isExpanded = expandedOrderRows.includes(purchase.id);
                                                            const attributedPurchase = getAttributionForPurchase(purchase.id);
                                                            const steps = attributedPurchase ? attributedPurchase.steps : [];

                                                            return (
                                                                <React.Fragment key={purchase.id}>
                                                                    <tr
                                                                        className={`hover:bg-neutral-800/40 transition-colors cursor-pointer`}
                                                                        onClick={() => toggleOrderRow(purchase.id)}
                                                                    >
                                                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{formatDateWithDayShort(purchase.date)}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 truncate max-w-[200px]">{purchase.metadata.region}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 truncate max-w-[200px]">{purchase.metadata.email}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 truncate max-w-[200px]">{purchase.metadata.name}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 truncate max-w-[200px]">{purchase.metadata.primary_offer_slug + (purchase.metadata.secondary_offer_slug ? ` + ${purchase.metadata.secondary_offer_slug}` : '')}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 text-right whitespace-nowrap">{formatCurrency(purchase.metadata.value!, purchase.metadata.currency!)}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-300 truncate max-w-[250px]" title={steps.length > 0 ? `${steps.length} - ${sourceDisplayOption === 'first' ? steps[0]?.formatted : steps[steps.length - 1]?.formatted}` : 'N/A'}>
                                                                            {steps.length > 0 ? (
                                                                                <div className="flex items-center space-x-2">
                                                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                                                                                        {steps.length}
                                                                                    </span>
                                                                                    <span className="text-gray-300">
                                                                                        {sourceDisplayOption === 'first' ? steps[0]?.formatted : steps[steps.length - 1]?.formatted}
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-gray-500">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-sm text-center">
                                                                            <div className={`flex items-center justify-center ${purchase.metadata.payment_status === 'refunded' ? 'text-red-400' : 'text-green-400'}`}>
                                                                                {purchase.metadata.payment_status === 'refunded' ? (
                                                                                    <RotateCcw className="w-5 h-5" />
                                                                                ) : (
                                                                                    <CheckCircle className="w-5 h-5" />
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {/* Expansion Row */}
                                                                    {isExpanded && attributedPurchase && (
                                                                        <tr className="bg-neutral-800/50">
                                                                            <td colSpan={8} className="px-6 py-3 text-sm text-gray-300">
                                                                                <h4 className="font-semibold mb-2 text-white">Full Journey Steps:</h4>
                                                                                <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                                                                                    {steps.map((step, index) => (
                                                                                        <li key={index}>{step?.date ?? 'N/A'} - {step?.formatted ?? 'N/A'}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot className="bg-gray-800/50 font-medium border-t-2 border-gray-600">
                                                        <tr>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-white">TOTALS</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white"></td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white"></td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white"></td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white"></td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.purchases.reduce((sum, p) => sum + p.local_value, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-white"></td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-center text-white">
                                                                <span className={`font-bold ${data.purchases.some(p => p.metadata.payment_status === 'refunded') ? 'text-red-400' : 'text-green-400'}`}>
                                                                    {data.purchases.filter(p => p.metadata.payment_status !== 'refunded').length}/{data.purchases.length}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-center py-4">No orders in this period.</p>
                                    )}
                                </div>
                            )}

                            {/* Daily Data - Responsive with horizontal scroll on mobile */}
                            {activeView === 'visitors' && (
                                <div className="mt-6 sm:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Daily Data Summary</h3>
                                    {data.daily_data && data.daily_data.length > 0 ? (
                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <div className="inline-block min-w-full align-middle">
                                                <table className="min-w-full divide-y divide-neutral-800/50">
                                                    <thead className="bg-neutral-800/50">
                                                        <tr>
                                                            <th scope="col" className="sticky left-0 z-10 bg-neutral-800/50 px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Spend</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Impressions</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Reach</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Frequency</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">CPM</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Clicks</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">CPC</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">CTR</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Visitors</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Leads</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Optin-%</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Purchases</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Cash</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Refunds</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Lead-%</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">LP-%</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">P/L</th>
                                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">ROAS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-800/50">
                                                        {data.daily_data.map((day) => (
                                                            <tr key={day.date} className="hover:bg-neutral-800/40 transition-colors">
                                                                <td className="sticky left-0 z-10 bg-neutral-900/50 px-3 py-2 whitespace-nowrap text-sm text-gray-300">{day.date}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(day.spend, appliedFilters.currency)}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.impressions.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.reach.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.frequency.toFixed(2)}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(day.cpm, appliedFilters.currency)}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.unique_outbound_clicks.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(day.cpc, appliedFilters.currency)}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.ctr.toFixed(2)}%</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.visitors.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.leads.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.visitToLead.toFixed(2)}%</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.purchases.toLocaleString()}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.cash.toFixed(2) + " " + appliedFilters.currency}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">
                                                                    {day.refundsCount > 0 ? (
                                                                        <span className="text-red-400">{day.refundsCount} ({day.refundsAmount.toFixed(2) + " " + appliedFilters.currency})</span>
                                                                    ) : (
                                                                        <span>0</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.leadToPurchase.toFixed(1)}%</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.visitToPurchase.toFixed(1)}%</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.profitLoss.toFixed(2) + " " + appliedFilters.currency}</td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{day.roas.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-800/50 font-medium border-t-2 border-gray-600">
                                                        <tr>
                                                            <td className="sticky left-0 z-10 bg-gray-800/50 px-3 py-3 whitespace-nowrap text-sm font-bold text-white">TOTALS</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.daily_data.reduce((sum, day) => sum + day.spend, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.impressions, 0).toLocaleString()}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.reach, 0).toLocaleString()}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.frequency, 0).toFixed(2)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.daily_data.reduce((sum, day) => sum + day.cpm, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.daily_data.reduce((sum, day) => sum + day.cpc, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.unique_outbound_clicks, 0).toLocaleString()}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {(data.daily_data.reduce((sum, day) => sum + day.impressions, 0) > 0
                                                                    ? (data.daily_data.reduce((sum, day) => sum + day.unique_outbound_clicks, 0) / data.daily_data.reduce((sum, day) => sum + day.impressions, 0)) * 100
                                                                    : 0).toFixed(2)}%
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.visitors, 0)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.leads, 0)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {(data.daily_data.reduce((sum, day) => sum + day.visitors, 0) > 0
                                                                    ? (data.daily_data.reduce((sum, day) => sum + day.leads, 0) / data.daily_data.reduce((sum, day) => sum + day.visitors, 0)) * 100
                                                                    : 0).toFixed(2)}%
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{data.daily_data.reduce((sum, day) => sum + day.purchases, 0)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.daily_data.reduce((sum, day) => sum + day.cash, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {data.daily_data.reduce((sum, day) => sum + day.refundsCount, 0) > 0 ? (
                                                                    <span key="refunds-count" className="text-red-400">
                                                                        {data.daily_data.reduce((sum, day) => sum + day.refundsCount, 0)} ({formatCurrency(data.daily_data.reduce((sum, day) => sum + day.refundsAmount, 0), appliedFilters.currency)})
                                                                    </span>
                                                                ) : (
                                                                    <span key="refunds-zero">0</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {(data.daily_data.reduce((sum, day) => sum + day.leads, 0) > 0
                                                                    ? (data.daily_data.reduce((sum, day) => sum + day.purchases, 0) / data.daily_data.reduce((sum, day) => sum + day.leads, 0)) * 100
                                                                    : 0).toFixed(1)}%
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {(data.daily_data.reduce((sum, day) => sum + day.visitors, 0) > 0
                                                                    ? (data.daily_data.reduce((sum, day) => sum + day.purchases, 0) / data.daily_data.reduce((sum, day) => sum + day.visitors, 0)) * 100
                                                                    : 0).toFixed(1)}%
                                                            </td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(data.daily_data.reduce((sum, day) => sum + day.profitLoss, 0), appliedFilters.currency)}</td>
                                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-bold text-white">
                                                                {(data.daily_data.reduce((sum, day) => sum + day.spend, 0) > 0
                                                                    ? data.daily_data.reduce((sum, day) => sum + day.cash, 0) / data.daily_data.reduce((sum, day) => sum + day.spend, 0)
                                                                    : 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-center py-4">No daily data available.</p>
                                    )}
                                </div>
                            )}

                            {/* Attribution - Responsive Layout */}
                            {activeView === 'adspend' && (
                                <div className="mt-6 sm:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                                        <h3 className="text-lg sm:text-xl font-semibold text-white">Facebook Attribution Summary</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs sm:text-sm text-gray-400">Attribution model:</span>
                                            <div className="flex bg-neutral-800 rounded-md p-0.5">
                                                <button
                                                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors ${fbAttributionOption === 'first' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    onClick={() => {
                                                        setFbAttributionOption('first');
                                                        localStorage.setItem(SALES_DATA_FB_ATTRIBUTION_LS_KEY, 'first');
                                                    }}
                                                >
                                                    First
                                                </button>
                                                <button
                                                    className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors ${fbAttributionOption === 'last' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    onClick={() => {
                                                        setFbAttributionOption('last');
                                                        localStorage.setItem(SALES_DATA_FB_ATTRIBUTION_LS_KEY, 'last');
                                                    }}
                                                >
                                                    Last
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <FacebookIndividualAttributionTable
                                        campaigns={recalculatedFacebookData}
                                        currency={appliedFilters.currency}
                                        sortItems={sortItems}
                                    />
                                </div>
                            )}

                            {/* Countries */}
                            {activeView === 'countries' && (
                                <div className="mt-4 sm:mt-6 lg:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-3 sm:p-4 lg:p-6">
                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">Sales by Country</h3>
                                    {detailedCountryData.length > 0 ? (
                                        <>
                                            {/* Mobile Card View */}
                                            <div className="block sm:hidden space-y-2">
                                                {detailedCountryData.map((country) => (
                                                    <div key={country.name} className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative w-6 h-4 rounded overflow-hidden">
                                                                    <Image
                                                                        src={getFlagUrl(country.name)}
                                                                        alt={`Flag of ${country.name}`}
                                                                        fill
                                                                        sizes="24px"
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium text-white">{country.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-green-400">
                                                                    {formatCurrency(country.cash, appliedFilters.currency)}
                                                                </span>
                                                                <p className="text-xs text-gray-400">
                                                                    {((country.cash / data.total_cash) * 100).toFixed(1)}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div className="text-center">
                                                                <p className="text-gray-500">Leads</p>
                                                                <p className="text-gray-300 font-medium">{country.leads}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-gray-500">Orders</p>
                                                                <p className="text-gray-300 font-medium">{country.purchases}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-gray-500">Conv %</p>
                                                                <p className="text-gray-300 font-medium">{country.conversionRate.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop Table View */}
                                            <div className="hidden sm:block overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
                                                <div className="inline-block min-w-full align-middle px-3 sm:px-4 lg:px-0">
                                                    <table className="min-w-full divide-y divide-neutral-800/50">
                                                        <thead className="bg-neutral-800/50">
                                                            <tr>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Country</th>
                                                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Cash</th>
                                                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Percent</th>
                                                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Leads</th>
                                                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Purchases</th>
                                                                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Conversion %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-800/50">
                                                            {detailedCountryData.map((country) => (
                                                                <tr key={country.name} className="hover:bg-neutral-800/40 transition-colors">
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="relative w-6 h-4 rounded overflow-hidden">
                                                                                <Image
                                                                                    src={getFlagUrl(country.name)}
                                                                                    alt={`Flag of ${country.name}`}
                                                                                    fill
                                                                                    sizes="24px"
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                            {country.name}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-green-400">
                                                                        {formatCurrency(country.cash, appliedFilters.currency)}
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-400">
                                                                        {((country.cash / data.total_cash) * 100).toFixed(1)}%
                                                                    </td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{country.leads}</td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{country.purchases}</td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-300">{country.conversionRate.toFixed(1)}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-center py-4 text-sm">No country data available.</p>
                                    )}
                                </div>
                            )}

                            {/* Payment Methods */}
                            {activeView === 'paymentMethods' && (
                                <div className="mt-4 sm:mt-6 lg:mt-8 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-3 sm:p-4 lg:p-6">
                                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">Sales by Payment Method</h3>
                                    {paymentMethodData.length > 0 ? (
                                        <div className="space-y-3">
                                            {paymentMethodData.map((method) => {
                                                const percentage = (method.value / data.total_cash) * 100;
                                                return (
                                                    <div key={method.name} className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-3 sm:p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="p-2 bg-fuchsia-600/20 rounded-lg">
                                                                    {method.name === 'stripe' ? (
                                                                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
                                                                    ) : method.name === 'paypal' ? (
                                                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
                                                                    ) : method.name === 'quick_pay' ? (
                                                                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
                                                                    ) : (
                                                                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-fuchsia-400" />
                                                                    )}
                                                                </div>
                                                                <span className="text-sm sm:text-base font-medium text-white capitalize">
                                                                    {method.name === 'stripe' ? 'Stripe' :
                                                                        method.name === 'paypal' ? 'PayPal' :
                                                                            method.name === 'quick_pay' ? 'Quick Pay' :
                                                                                method.name}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-base sm:text-lg font-bold text-green-400">
                                                                    {formatCurrency(method.value, appliedFilters.currency)}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {percentage.toFixed(1)}% of total
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {/* Visual Progress Bar */}
                                                        <div className="w-full bg-neutral-700/30 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-center py-4 text-sm">No payment method data available.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : data ? (
                        <div className="text-center py-8 sm:py-12 bg-white/5 rounded-lg border border-gray-700/20">
                            <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-purple-900/20 mb-4">
                                <AlertCircle className="w-6 sm:w-8 h-6 sm:h-8 text-purple-400" />
                            </div>
                            <p className="text-gray-300 mb-4 text-sm sm:text-base">No data available for the selected date range.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 sm:py-12 bg-white/5 rounded-lg border border-gray-700/20">
                            <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-blue-900/20 mb-4">
                                <Database className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400" />
                            </div>
                            <p className="text-gray-300 mb-4 text-sm sm:text-base">Select a date range and click &quot;Apply Filters&quot; to view sales data.</p>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

interface FacebookIndividualAttributionTableProps {
    campaigns: any[];
    currency: string;
    sortItems: (items: any[], sortCol: GroupSortColumn, sortDir: 'asc' | 'desc') => any[];
}

function FacebookIndividualAttributionTable({ campaigns, currency, sortItems }: FacebookIndividualAttributionTableProps) {
    const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
    const [expandedAdSets, setExpandedAdSets] = useState<string[]>([]); // Key format: "campaignName||adSetName"
    const [sortColumn, setSortColumn] = useState<GroupSortColumn>('cash');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const totals = useMemo(() => {
        let totalSpend = 0;
        let totalSales = 0;
        let totalCash = 0;

        campaigns.forEach(campaign => {
            totalSpend += campaign.spend || 0;
            totalSales += campaign.sales || 0;
            totalCash += campaign.cash || 0;
        });

        const totalRoas = totalSpend > 0 ? totalCash / totalSpend : 0;

        return {
            spend: totalSpend,
            sales: totalSales,
            cash: totalCash,
            roas: totalRoas
        };
    }, [campaigns]);

    const toggleCampaign = (campaignName: string) => {
        setExpandedCampaigns(prev => prev.includes(campaignName) ? prev.filter(name => name !== campaignName) : [...prev, campaignName]);

        if (expandedCampaigns.includes(campaignName))
            setExpandedAdSets(prev => prev.filter(key => !key.startsWith(`${campaignName}||`)));
    };

    const toggleAdSet = (campaignName: string, adSetName: string) => {
        const key = `${campaignName}||${adSetName}`;

        setExpandedAdSets(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const handleHeaderClick = (column: GroupSortColumn) => {
        if (sortColumn === column)
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');

        else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (column: GroupSortColumn) => {
        if (sortColumn !== column)
            return null;

        return sortDirection === 'asc'
            ? <ChevronRight className="w-4 h-4 inline-block transform rotate-90" />
            : <ChevronRight className="w-4 h-4 inline-block transform -rotate-90" />;
    };

    const sortedCampaigns = useMemo(() => campaigns ? sortItems(campaigns, sortColumn, sortDirection) : [], [campaigns, sortColumn, sortDirection, sortItems]);

    if (campaigns.length === 0)
        return <p className="text-gray-400 text-center py-4">No individual attribution data available.</p>;

    return (
        <div className="overflow-x-auto border border-neutral-700/50 rounded-lg">
            <table className="min-w-full divide-y divide-neutral-800/50 table-fixed">
                <colgroup><col className="w-10" /><col className="w-auto" /><col className="w-24" /><col className="w-24" /><col className="w-24" /><col className="w-24" /></colgroup>
                <thead className="bg-neutral-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => handleHeaderClick('name')}
                        >
                            Name {getSortIcon('name')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => handleHeaderClick('spend')}
                        >
                            Spend {getSortIcon('spend')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => handleHeaderClick('sales')}
                        >
                            Sales {getSortIcon('sales')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => handleHeaderClick('cash')}
                        >
                            Cash {getSortIcon('cash')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                            onClick={() => handleHeaderClick('roas')}
                        >
                            ROAS {getSortIcon('roas')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                    {sortedCampaigns.map((campaign: CampaignInfo) => {
                        const isCampaignExpanded = expandedCampaigns.includes(campaign.campaign_name);
                        const adSets = (campaign.adsets as any[]).sort((a: any, b: any) => b.cash - a.cash);

                        return (
                            <React.Fragment key={`campaign-${campaign.campaign_id}`}>
                                {/* Campaign Row */}
                                <tr className="hover:bg-neutral-800/40 transition-colors cursor-pointer" onClick={() => toggleCampaign(campaign.campaign_name)}>
                                    <td className="px-4 py-2 whitespace-nowrap text-center text-blue-400">
                                        {adSets.length > 0 && (isCampaignExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-300 truncate">{campaign.campaign_name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{campaign.spend ? formatCurrency(campaign.spend, currency) : '-'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{campaign.sales}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(campaign.cash, currency)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{campaign.spend ? (campaign.cash / campaign.spend).toFixed(2) : '-'}</td>
                                </tr>

                                {/* Ad Sets */}
                                {isCampaignExpanded && adSets.map((adSet: AdSetInfo) => {
                                    const adSetKey = `${campaign.campaign_name}||${adSet.adset_name}`;
                                    const isAdSetExpanded = expandedAdSets.includes(adSetKey);
                                    const ads = (adSet.ads as any[]).sort((a: any, b: any) => b.cash - a.cash);

                                    return (
                                        <React.Fragment key={`adset-${adSet.adset_id}`}>
                                            {/* Ad Set Row */}
                                            <tr className="hover:bg-neutral-800/30 transition-colors cursor-pointer bg-black/10" onClick={() => toggleAdSet(campaign.campaign_name, adSet.adset_name)}>
                                                <td className="pl-8 pr-4 py-2 whitespace-nowrap text-center text-green-400">
                                                    {ads.length > 0 && (isAdSetExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-300 truncate">{adSet.adset_name}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{adSet.spend ? formatCurrency(adSet.spend, currency) : '-'}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{adSet.sales}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(adSet.cash, currency)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{adSet.spend ? (adSet.cash / adSet.spend).toFixed(2) : '-'}</td>
                                            </tr>

                                            {/* Ads */}
                                            {isAdSetExpanded && ads.map((ad: AdInfo) => (
                                                <tr key={`ad-${ad.ad_id || `${adSetKey}||${ad.ad_name}`}`} className="hover:bg-neutral-800/20 transition-colors bg-black/20">
                                                    <td className="pl-12 pr-4 py-2 whitespace-nowrap"></td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-purple-300 truncate">{ad.ad_name}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{ad.spend ? formatCurrency(ad.spend, currency) : '-'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{ad.sales}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(ad.cash, currency)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-300">{ad.spend ? (ad.cash / ad.spend).toFixed(2) : '-'}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}

                    {/* Summary Row */}
                    <tr className="bg-gray-800/50 font-medium border-t-2 border-gray-600">
                        <td className="px-4 py-3 whitespace-nowrap"></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white">TOTAL</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(totals.spend, currency)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{totals.sales}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{formatCurrency(totals.cash, currency)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-white">{totals.roas.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}