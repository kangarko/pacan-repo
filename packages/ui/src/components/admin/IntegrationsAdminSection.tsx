'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, Loader2, Facebook, Database, Unlink, AlertCircle, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchJsonPost, formatDate, normalizeAccountId } from '@repo/ui/lib/utils';
import { createSupabaseClient, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

export function IntegrationsTab() {
    const [activeSubTab, setActiveSubTab] = useState<'facebook' | 'other'>('facebook');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Integrations</h2>
            
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {activeSubTab === 'facebook' ? 'Facebook Ads' : 'Other Integrations'}
                    </span>
                    {mobileMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        <button
                            onClick={() => {
                                setActiveSubTab('facebook');
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                activeSubTab === 'facebook'
                                    ? 'bg-purple-600/20 text-purple-300'
                                    : 'text-gray-300 hover:bg-neutral-800/50'
                            }`}
                        >
                            <Facebook className="w-4 h-4 inline-block mr-2" />
                            Facebook Ads
                        </button>
                        {/* Add more integrations here later */}
                    </div>
                )}
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden lg:flex flex-wrap mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveSubTab('facebook')}
                    className={`relative px-5 py-3 text-sm font-medium transition-all duration-200
                        ${activeSubTab === 'facebook'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'}`}
                >
                    <div className="flex items-center">
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook Ads
                    </div>
                    {activeSubTab === 'facebook' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500"></div>
                    )}
                </button>
            </div>
            <div>
                {activeSubTab === 'facebook' && <FacebookIntegrationSubTab />}
            </div>
        </div>
    );
}

function FacebookIntegrationSubTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedAccount, setConnectedAccount] = useState<any | null>(null);
    const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [cachedData, setCachedData] = useState<any | null>(null);
    const [isFetchingCache, setIsFetchingCache] = useState(false);
    const [activeSection, setActiveSection] = useState<'account' | 'page-selection' | 'campaigns'>('account');
    const [promotablePages, setPromotablePages] = useState<{ id: string, name: string }[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [isSavingPage, setIsSavingPage] = useState(false);
    const [mobileSectionOpen, setMobileSectionOpen] = useState(false);

    const hasLoadedAccounts = React.useRef(false);
    const loadedCacheForAccount = React.useRef<string | null>(null);

    const fetchAdAccounts = useCallback(async (forceRefresh = false) => {
        if (isFetchingAccounts)
            return;

        if (!forceRefresh) {
            const cachedAccounts = loadAdAccountsFromCache();
            if (cachedAccounts && cachedAccounts.length > 0) {
                setAdAccounts(cachedAccounts);

                if (selectedAdAccount) {
                    const accountExists = cachedAccounts.some((account: { id: string }) =>
                        normalizeAccountId(account.id) === normalizeAccountId(selectedAdAccount)
                    );

                    if (!accountExists)
                        setSelectedAdAccount('');
                }

                hasLoadedAccounts.current = true;
                return;
            }
        }

        try {
            setIsFetchingAccounts(true);
            setError(null);

            const data = await fetchJsonPost('/api/admin/facebook', { action: 'get_ad_accounts' });

            if (data.data && data.data.length > 0) {
                setAdAccounts(data.data);
                saveAdAccountsToCache(data.data);

                if (selectedAdAccount) {
                    const accountExists = data.data.some((account: { id: string }) =>
                        normalizeAccountId(account.id) === normalizeAccountId(selectedAdAccount)
                    );

                    if (!accountExists)
                        setSelectedAdAccount('');
                }

                hasLoadedAccounts.current = true;

            } else {
                setAdAccounts([]);

                hasLoadedAccounts.current = true;
            }

        } catch (err) {
            sendClientErrorEmail('Error fetching ad accounts:', err);

            setError(err instanceof Error ? err.message : 'Failed to fetch ad accounts');

        } finally {
            setIsFetchingAccounts(false);
        }

    }, [isFetchingAccounts, selectedAdAccount]);

    const loadAdAccountsFromCache = () => {
        const cachedData = localStorage.getItem('facebook_ad_accounts');

        if (!cachedData)
            return null;

        const parsedData = JSON.parse(cachedData);
        const cacheExpiry = parsedData.expiry || 0;

        if (cacheExpiry < Date.now()) {
            localStorage.removeItem('facebook_ad_accounts');

            return null;
        }

        return parsedData.accounts;
    };

    const saveAdAccountsToCache = (accounts: any[]) => {
        const cacheData = {
            accounts,
            expiry: Date.now() + (24 * 60 * 60 * 1000)
        };

        localStorage.setItem('facebook_ad_accounts', JSON.stringify(cacheData));
    };

    const fetchFacebookCache = useCallback(async () => {
        if (!selectedAdAccount || isFetchingCache)
            return;

        try {
            setIsFetchingCache(true);

            const normalizedAccountId = normalizeAccountId(selectedAdAccount);
            const accountId = normalizedAccountId.startsWith('act_') ? normalizedAccountId : `act_${normalizedAccountId}`;

            const data = await fetchJsonPost('/api/admin/facebook', {
                action: 'get_cache',
                ad_account_id: accountId
            });

            setCachedData(data.data);

        } catch (err) {
            sendClientErrorEmail('Error fetching Facebook cached data:', err);

            setError(err instanceof Error ? err.message : 'Failed to fetch Facebook cached data');

        } finally {
            setIsFetchingCache(false);
        }
    }, [selectedAdAccount, isFetchingCache]);

    const refreshFacebookData = async () => {
        if (!selectedAdAccount)
            return;

        try {
            setIsFetchingCache(true);
            setError(null);

            const normalizedAccountId = normalizeAccountId(selectedAdAccount);
            const accountId = normalizedAccountId.startsWith('act_') ? normalizedAccountId : `act_${normalizedAccountId}`;

            await fetchJsonPost('/api/admin/facebook', {
                action: 'get_fb_data',
                ad_account_id: accountId
            });

            await fetchFacebookCache();

        } catch (err) {
            sendClientErrorEmail('Error refreshing Facebook data:', err);

            setError(err instanceof Error ? err.message : 'Failed to refresh Facebook data');

        } finally {
            setIsFetchingCache(false);
        }
    };

    useEffect(() => {
        const loadConnectionData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const params = new URLSearchParams(window.location.search);
                const integrationParam = params.get('integration');
                const newStatusParam = params.get('status');
                const messageParam = params.get('message');
                const fbErrorParam = params.get('fb_error');
                const fbErrorReasonParam = params.get('fb_error_reason');

                if (integrationParam === 'facebook') {
                    if (newStatusParam === 'error' && messageParam) {
                        let detailedErrorMessage = decodeURIComponent(messageParam);
                        if (fbErrorParam) {
                            detailedErrorMessage += ` (Code: ${fbErrorParam}`;
                            if (fbErrorReasonParam) {
                                detailedErrorMessage += `, Reason: ${fbErrorReasonParam}`;
                            }
                            detailedErrorMessage += ')';
                        }
                        setError(detailedErrorMessage);
                    }
                    else if (newStatusParam === 'success') {
                        setSaveSuccess(true);
                        setError(null);
                    }

                    const newParams = new URLSearchParams(window.location.search);
                    newParams.delete('integration');
                    newParams.delete('status');
                    newParams.delete('message');
                    newParams.delete('fb_error');
                    newParams.delete('fb_error_reason');
                    window.history.replaceState({}, '', newParams.toString() ? `${window.location.pathname}?${newParams.toString()}` : window.location.pathname);
                }

                const client = createSupabaseClient();
                await client.auth.refreshSession();
                const { data: { user } } = await client.auth.getUser();

                if (!user)
                    throw new Error('Not authenticated');

                const facebookIntegration = user.user_metadata?.facebook_integration;

                if (facebookIntegration && facebookIntegration.connected) {
                    setConnectedAccount(facebookIntegration);

                    if (facebookIntegration.adAccount && facebookIntegration.adAccount.id)
                        setSelectedAdAccount(facebookIntegration.adAccount.id);

                    if (facebookIntegration.pageId)
                        setSelectedPageId(facebookIntegration.pageId);

                } else
                    setConnectedAccount(null);

            } catch (err) {
                sendClientErrorEmail('Error loading Facebook integration data:', err);
                setError('Failed to load integration data');

            } finally {
                setIsLoading(false);
            }
        };

        loadConnectionData();
    }, []);

    useEffect(() => {
        if (connectedAccount && !isFetchingAccounts && !hasLoadedAccounts.current)
            fetchAdAccounts();
    }, [connectedAccount, fetchAdAccounts, isFetchingAccounts]);

    useEffect(() => {
        if (selectedAdAccount && connectedAccount) {
            const normalizedId = normalizeAccountId(selectedAdAccount);

            if (loadedCacheForAccount.current !== normalizedId) {
                loadedCacheForAccount.current = normalizedId;

                fetchFacebookCache();
            }
        }
    }, [selectedAdAccount, connectedAccount, fetchFacebookCache]);

    const handleFacebookLogin = async () => {
        try {
            setIsLoading(true);

            const data = await fetchJsonPost('/api/auth/facebook-login', {
                redirectUrl: window.location.href
            });

            window.location.href = data.authUrl;

        } catch (err) {
            sendClientErrorEmail('Error initiating Facebook login:', err);

            setError('Failed to connect to Facebook');
            setIsLoading(false);
        }
    };

    const handleSaveAdAccount = async () => {
        try {
            setIsSaving(true);
            setSaveSuccess(false);
            setError(null);

            const selectedAccount = adAccounts.find(account => account.id === selectedAdAccount);

            if (!selectedAccount)
                throw new Error('Please select a valid ad account');

            const data = await fetchJsonPost('/api/admin/facebook', {
                action: 'save_ad_account',
                ad_account: selectedAccount
            });

            setPromotablePages(data.promotablePages || []);
            setSelectedPageId('');
            setSaveSuccess(true);
            setError(null);

        } catch (err) {
            sendClientErrorEmail('Error saving ad account:', err);
            setError(err instanceof Error ? err.message : 'Failed to save ad account');
            setPromotablePages([]);

        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePage = async () => {
        if (!selectedPageId) {
            setError('Please select a page.');
            return;
        }

        const selectedPage = promotablePages.find(p => p.id === selectedPageId);
        if (!selectedPage) {
            setError('Selected page not found in the list.');
            return;
        }

        try {
            setIsSavingPage(true);
            setSaveSuccess(false);
            setError(null);

            const data = await fetchJsonPost('/api/admin/facebook', {
                action: 'save_page',
                page_id: selectedPage.id,
                page_name: selectedPage.name
            });

            setConnectedAccount(data.data);
            setSaveSuccess(true);
            setPromotablePages([]);

        } catch (err) {
            sendClientErrorEmail('Error saving Facebook page:', err);
            setError(err instanceof Error ? err.message : 'Failed to save Facebook page');
        } finally {
            setIsSavingPage(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setIsLoading(true);

            await fetchJsonPost('/api/admin/facebook', { action: 'disconnect' });

            setConnectedAccount(null);
            setSelectedAdAccount('');
            setAdAccounts([]);
            setCachedData(null);
            setSaveSuccess(false);
            setPromotablePages([]);
            setSelectedPageId('');

        } catch (err) {
            sendClientErrorEmail('Error disconnecting from Facebook:', err);
            setError('Failed to disconnect from Facebook');

        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!connectedAccount) {
        return (
            <div className="bg-white/5 rounded-xl p-6 sm:p-8 text-center">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Facebook className="w-7 sm:w-8 h-7 sm:h-8 text-blue-400" />
                </div>
                <h4 className="text-lg sm:text-xl font-medium text-white mb-2">Connect to Facebook Ads</h4>
                <p className="text-gray-400 mb-5 sm:mb-6 text-sm">Connect your Facebook account to access your ad campaigns, ad sets, and ads.</p>
                <button
                    onClick={handleFacebookLogin}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
                >
                    <Facebook className="w-4 sm:w-5 h-4 sm:h-5" />
                    Connect with Facebook
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row overflow-hidden">
            {/* Mobile Section Toggle */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileSectionOpen(!mobileSectionOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">
                        {activeSection === 'account' ? 'Ad Accounts' :
                         activeSection === 'page-selection' ? 'Select Page' :
                         'Ad Campaigns'}
                    </span>
                    {mobileSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Sidebar - Collapsible on mobile */}
            <div className={`lg:w-64 lg:min-h-[600px] ${mobileSectionOpen ? 'block' : 'hidden lg:block'}`}>
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center mb-3 sm:mb-4">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-900/40 rounded-full flex items-center justify-center mr-2.5 sm:mr-3">
                            <Facebook className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-base sm:text-lg font-medium text-white">{connectedAccount.name || 'Facebook Account'}</h4>
                            <p className="text-gray-400 text-[11px] sm:text-xs">Connected on {formatDate(new Date(connectedAccount.connectedAt))}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleDisconnect}
                        className="w-full bg-transparent border border-red-500/30 hover:bg-red-900/20 text-red-400 px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 justify-center transition-colors mt-2"
                    >
                        <Unlink className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                        Disconnect
                    </button>
                </div>

                <div className="border-t border-gray-700/50 pt-3 sm:pt-4 mb-3 sm:mb-4">
                    <h5 className="text-[11px] sm:text-xs uppercase text-gray-500 mb-2.5 sm:mb-3 font-semibold tracking-wider">Navigation</h5>

                    <nav className="space-y-1">
                        <button
                            className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm font-medium ${activeSection === 'account'
                                ? 'bg-purple-900/50 text-purple-200'
                                : 'text-gray-300 hover:bg-gray-800/50'
                                }`}
                            onClick={() => {
                                setActiveSection('account');
                                setMobileSectionOpen(false);
                            }}
                        >
                            <Database className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2.5 sm:mr-3 opacity-70" />
                            Ad Accounts
                        </button>

                        <button
                            className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm font-medium transition-colors
                                ${activeSection === 'page-selection'
                                    ? 'bg-purple-900/50 text-purple-200'
                                    : 'text-gray-300 hover:bg-gray-800/50'}
                                ${!selectedAdAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (selectedAdAccount) {
                                    setActiveSection('page-selection');
                                    setSaveSuccess(false);
                                    setError(null);
                                    setMobileSectionOpen(false);
                                }
                            }}
                            disabled={!selectedAdAccount}
                        >
                            <FileText className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2.5 sm:mr-3 opacity-70" />
                            Select Page
                        </button>

                        <button
                            className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm font-medium ${activeSection === 'campaigns' ? 'bg-purple-900/50 text-purple-200' : 'text-gray-300 hover:bg-gray-800/50'}${!selectedAdAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                setActiveSection('campaigns');
                                setMobileSectionOpen(false);
                                if (selectedAdAccount && !cachedData)
                                    fetchFacebookCache();
                            }}
                            disabled={!selectedAdAccount}
                        >
                            <Facebook className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2.5 sm:mr-3 opacity-70" />
                            Ad Campaigns
                        </button>
                    </nav>
                </div>

                {selectedAdAccount && (
                    <div className="border-t border-gray-700/50 pt-3 sm:pt-4">
                        <h5 className="text-[11px] sm:text-xs uppercase text-gray-500 mb-2.5 sm:mb-3 font-semibold tracking-wider">Selected Account</h5>
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 rounded-lg">
                            <p className="text-white font-medium text-xs sm:text-sm truncate">
                                {adAccounts.find(acc => acc.id === selectedAdAccount)?.name || 'Ad Account'}
                            </p>
                            <p className="text-gray-500 text-[11px] sm:text-xs truncate">{selectedAdAccount}</p>
                            {connectedAccount?.pageName && (
                                <p className="text-purple-300 text-[11px] sm:text-xs truncate mt-1">Page: {connectedAccount.pageName}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 lg:p-6 lg:pt-0">
                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                        </div>
                    </div>
                )}
                {saveSuccess && (
                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
                            <p className="text-green-400 text-xs sm:text-sm">Settings saved successfully!</p>
                        </div>
                    </div>
                )}
                {activeSection === 'account' && (
                    <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-white">Select Ad Account</h3>
                            <button
                                onClick={() => fetchAdAccounts(true)}
                                disabled={isFetchingAccounts}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 justify-center sm:justify-start"
                            >
                                {isFetchingAccounts ? (
                                    <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                )}
                                Refresh Accounts
                            </button>
                        </div>

                        {isLoading || isFetchingAccounts ? (
                            <div className="flex justify-center items-center py-6">
                                <div className="animate-spin rounded-full h-7 sm:h-8 w-7 sm:w-8 border-t-2 border-b-2 border-purple-500"></div>
                                <span className="ml-2.5 sm:ml-3 text-gray-300 text-sm">Loading ad accounts...</span>
                            </div>
                        ) : adAccounts.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 bg-white/5 rounded-lg border border-gray-700/20">
                                <div className="mb-3">
                                    <div className="w-14 sm:w-16 h-14 sm:h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                                        <Facebook className="w-7 sm:w-8 h-7 sm:h-8 text-blue-400 opacity-50" />
                                    </div>
                                </div>
                                <p className="text-gray-400 mb-4 text-sm">We couldn&apos;t find any ad accounts for your Facebook user.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5 sm:mb-6">
                                    {adAccounts.map((account) => (
                                        <div
                                            key={account.id}
                                            onClick={() => setSelectedAdAccount(account.id)}
                                            className={`relative bg-white/5 border rounded-lg p-3 sm:p-4 transition-all cursor-pointer hover:bg-white/10 ${normalizeAccountId(selectedAdAccount) === normalizeAccountId(account.id)
                                                ? 'border-purple-500 bg-purple-900/10'
                                                : 'border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2.5 sm:mr-3 rounded-full border flex-shrink-0 ${normalizeAccountId(selectedAdAccount) === normalizeAccountId(account.id)
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-gray-400'
                                                    }`}>
                                                    {normalizeAccountId(selectedAdAccount) === normalizeAccountId(account.id) && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white text-sm truncate">{account.name}</div>
                                                    <div className="text-[11px] sm:text-xs text-gray-400 truncate">{account.id}</div>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs rounded-full ${account.status === 'active'
                                                        ? 'bg-green-900/20 text-green-400'
                                                        : 'bg-gray-700/30 text-gray-400'
                                                        }`}>
                                                        {account.status || 'unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleSaveAdAccount}
                                    disabled={!selectedAdAccount || isSaving}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                                            Save Ad Account
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'page-selection' && (
                    <PageSelectionSection
                        selectedAdAccount={selectedAdAccount}
                        connectedAccount={connectedAccount}
                        promotablePages={promotablePages}
                        selectedPageId={selectedPageId}
                        setSelectedPageId={setSelectedPageId}
                        handleSavePage={handleSavePage}
                        isSavingPage={isSavingPage}
                        error={error}
                        saveSuccess={saveSuccess}
                        setError={setError}
                        setSaveSuccess={setSaveSuccess}
                        setActiveSection={setActiveSection}
                    />
                )}

                {activeSection === 'campaigns' && selectedAdAccount && (
                    <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                            <h3 className="text-lg sm:text-xl font-semibold text-white">Facebook Ads Data</h3>
                            <button
                                onClick={refreshFacebookData}
                                disabled={isFetchingCache}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 justify-center sm:justify-start"
                            >
                                {isFetchingCache ? (
                                    <Loader2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                                )}
                                Refresh Data
                            </button>
                        </div>

                        {isFetchingCache ? (
                            <div className="flex justify-center items-center py-10 sm:py-12">
                                <div className="animate-spin rounded-full h-7 sm:h-8 w-7 sm:w-8 border-t-2 border-b-2 border-purple-500"></div>
                                <span className="ml-2.5 sm:ml-3 text-gray-300 text-sm">Loading/Refreshing Facebook data...</span>
                            </div>
                        ) : cachedData && cachedData.length > 0 ? (
                            <FacebookDataTable data={cachedData} />
                        ) : (
                            <div className="text-center py-6 sm:py-8 bg-white/5 rounded-lg border border-gray-700/20">
                                <p className="text-gray-400 mb-4 text-sm">No Facebook ad data found. Click the refresh button to fetch your campaign data.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'campaigns' && !selectedAdAccount && (
                    <div className="text-center py-10 sm:py-12 bg-white/5 rounded-lg border border-white/10">
                        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Facebook className="w-7 sm:w-8 h-7 sm:h-8 text-purple-400 opacity-70" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-medium text-white mb-2">No Ad Account Selected</h4>
                        <p className="text-gray-400 mb-5 sm:mb-6 max-w-md mx-auto text-sm">Please select and save an ad account from the Accounts section before viewing campaign data.</p>
                        <button
                            onClick={() => setActiveSection('account')}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Go to Accounts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FacebookDataTable({ data }: { data: any[] }) {
    const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
    const [expandedAdSets, setExpandedAdSets] = useState<string[]>([]);

    const campaigns = data.filter(item => item.object_type === 'campaign');
    const adSets = data.filter(item => item.object_type === 'adset');
    const ads = data.filter(item => item.object_type === 'ad');

    const toggleCampaign = (campaignId: string) => {
        setExpandedCampaigns(prev => prev.includes(campaignId) ? prev.filter(id => id !== campaignId) : [...prev, campaignId]);
    };

    const toggleAdSet = (adSetId: string) => {
        setExpandedAdSets(prev => prev.includes(adSetId) ? prev.filter(id => id !== adSetId) : [...prev, adSetId]
        );
    };

    return (
        <div className="overflow-hidden rounded-lg border border-purple-500/20">
            <table className="min-w-full divide-y divide-purple-500/20">
                <colgroup><col className="w-10" /><col className="w-auto" /><col className="w-24" /><col className="w-24" /><col className="w-24" /><col className="w-24" /></colgroup>
                <thead className="bg-purple-900/30">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider w-8"></th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">ID</th>
                    </tr>
                </thead>
                <tbody className="bg-purple-900/10 divide-y divide-purple-500/10">
                    {campaigns.map((campaign: any) => (
                        <React.Fragment key={campaign.id}>
                            <tr
                                className="bg-blue-900/5 cursor-pointer hover:bg-blue-900/10"
                                onClick={() => toggleCampaign(campaign.object_id)}
                            >
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className="text-blue-400">
                                        {expandedCampaigns.includes(campaign.object_id) ? '−' : '+'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-300">
                                        campaign
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">{campaign.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">{campaign.object_id}</td>
                            </tr>
                            {expandedCampaigns.includes(campaign.object_id) &&
                                adSets
                                    .filter(adSet => adSet.parent_id === campaign.object_id)
                                    .map(adSet => (
                                        <React.Fragment key={adSet.id}>
                                            <tr
                                                className="bg-green-900/5 cursor-pointer hover:bg-green-900/10 border-t border-purple-500/10"
                                                onClick={() => toggleAdSet(adSet.object_id)}
                                            >
                                                <td className="pl-8 py-3 whitespace-nowrap text-center">
                                                    <div className="text-green-400">
                                                        {expandedAdSets.includes(adSet.object_id) ? '−' : '+'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-300">
                                                        adset
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">{adSet.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">{adSet.object_id}</td>
                                            </tr>
                                            {expandedAdSets.includes(adSet.object_id) &&
                                                ads
                                                    .filter(ad => ad.parent_id === adSet.object_id)
                                                    .map(ad => (
                                                        <tr key={ad.id} className="bg-purple-900/5 border-t border-purple-500/10">
                                                            <td className="pl-12 py-3 whitespace-nowrap"></td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                                <span className="inline-flex px-2 py-0.5 rounded text-xs bg-purple-900/30 text-purple-300">
                                                                    ad
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">{ad.name}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 font-mono">{ad.object_id}</td>
                                                        </tr>
                                                    ))
                                            }
                                        </React.Fragment>
                                    ))
                            }
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            <div className="p-3 bg-black/20 border-t border-purple-500/20">
                <div className="flex justify-between text-xs text-gray-400">
                    <div>Total: {campaigns.length} campaigns, {adSets.length} ad sets, {ads.length} ads</div>
                    <div>
                        <button
                            onClick={() => setExpandedCampaigns(campaigns.map(c => c.object_id))}
                            className="text-purple-400 hover:text-purple-300 mr-4"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={() => {
                                setExpandedCampaigns([]);
                                setExpandedAdSets([]);
                            }}
                            className="text-purple-400 hover:text-purple-300"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PageSelectionSectionProps {
    selectedAdAccount: string;
    connectedAccount: any | null;
    promotablePages: { id: string, name: string }[];
    selectedPageId: string;
    setSelectedPageId: (id: string) => void;
    handleSavePage: () => Promise<void>;
    isSavingPage: boolean;
    error: string | null;
    saveSuccess: boolean;
    setError: (error: string | null) => void;
    setSaveSuccess: (success: boolean) => void;
    setActiveSection: (section: 'account' | 'page-selection' | 'campaigns') => void;
}

function PageSelectionSection({
    selectedAdAccount,
    connectedAccount,
    promotablePages,
    selectedPageId,
    setSelectedPageId,
    handleSavePage,
    isSavingPage,
    error,
    saveSuccess,
    setError,
    setSaveSuccess,
    setActiveSection
}: PageSelectionSectionProps) {

    useEffect(() => {
        setError(null);
        setSaveSuccess(false);
    }, [selectedAdAccount, setError, setSaveSuccess]);

    if (!selectedAdAccount) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-purple-400 opacity-70" />
                </div>
                <h4 className="text-xl font-medium text-white mb-2">No Ad Account Selected</h4>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">Please select and save an ad account from the Ad Accounts section first.</p>
                <button
                    onClick={() => setActiveSection('account')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                    Go to Ad Accounts
                </button>
            </div>
        );
    }

    if (promotablePages.length === 0 && !connectedAccount?.pageId) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-purple-400 opacity-70" />
                </div>
                <h4 className="text-xl font-medium text-white mb-2">No Promotable Pages Found</h4>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    We could not find any Facebook Pages associated with the selected ad account ({selectedAdAccount}).
                    Ensure the correct ad account is selected or check your Facebook Business settings.
                </p>
                <button
                    onClick={() => setActiveSection('account')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg mr-2"
                >
                    Back to Ad Accounts
                </button>
            </div>
        );
    }

    const pagesToDisplay = promotablePages.length > 0
        ? promotablePages
        : (connectedAccount?.pageId && connectedAccount?.pageName)
            ? [{ id: connectedAccount.pageId, name: connectedAccount.pageName }]
            : [];

    if (pagesToDisplay.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-purple-400 opacity-70" />
                </div>
                <h4 className="text-xl font-medium text-white mb-2">No Facebook Pages Available</h4>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Either no promotable pages were found for ad account ({selectedAdAccount}), or an error occurred fetching them.
                    You might need to re-select the ad account or check Facebook Business settings.
                </p>
                <button
                    onClick={() => setActiveSection('account')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg mr-2"
                >
                    Back to Ad Accounts
                </button>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-4">Select Associated Facebook Page</h3>

            {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                </div>
            )}
            {saveSuccess && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm">Page saved successfully!</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <p className="text-sm text-gray-300">
                    Select the Facebook Page associated with the ad account: <br />
                    <span className="font-medium text-white">{connectedAccount?.adAccount?.name || 'N/A'} ({selectedAdAccount})</span>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {pagesToDisplay.map(page => (
                        <div
                            key={page.id}
                            onClick={() => {
                                if (!isSavingPage) {
                                    setSelectedPageId(page.id);
                                    setError(null);
                                    setSaveSuccess(false);
                                }
                            }}
                            className={`relative bg-white/5 border rounded-lg p-4 transition-all cursor-pointer hover:bg-white/10 ${selectedPageId === page.id
                                ? 'border-purple-500 bg-purple-900/10'
                                : 'hover:bg-white/10 border-white/10 bg-white/5'
                                } ${isSavingPage ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center">
                                <div className={`w-4 h-4 mr-3 rounded-full border flex-shrink-0 ${selectedPageId === page.id
                                    ? 'hover:bg-white/10 border-white/10 border-gray-500'
                                    : 'border-gray-400'
                                    }`}>
                                    {selectedPageId === page.id && (
                                        <div className="w-4 h-4 mr-3 rounded-full border flex-shrink-0 bg-purple-500 border-purple-500">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white truncate" title={page.name}>{page.name}</div>
                                    <div className="text-xs text-gray-400 truncate" title={page.id}>{page.id}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <button
                        onClick={handleSavePage}
                        disabled={!selectedPageId || isSavingPage}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSavingPage ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving Page...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Save Selected Page
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">This page will be used for fetching comments and potentially other interactions.</p>
                </div>
            </div>
        </div>
    );
}