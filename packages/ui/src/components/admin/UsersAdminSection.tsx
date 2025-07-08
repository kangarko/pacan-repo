'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, CheckCircle, Lock, Mail, AlertCircle, Loader2, User, Globe, Search, Download, UserCog, CreditCard, ExternalLink, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { calculateJourneyTime, ensureError, fetchJsonPost, formatCurrency, formatDate, getPricing } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { AdminSalesData, EventType, LabeledTracking, EmailTemplate, Offer, Tracking } from '@repo/ui/lib/types';

interface UsersTabProps {
    userRole?: string | null;
}

export function UsersTab({ userRole }: UsersTabProps) {
    // For marketers, only show journey/lookup user
    const isMarketer = userRole === 'marketer';
    const [activeSubTab, setActiveSubTab] = useState<'journey' | 'checkAccounts' | 'setPassword' | 'createUser' | 'refund' | 'export' | 'clearDebug'>('journey');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [journeyData, setJourneyData] = useState<LabeledTracking[] | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [userRegion, setUserRegion] = useState<string | null>(null);
    const [expandedMetadata, setExpandedMetadata] = useState<number[]>([]);
    const [userData, setUserData] = useState<any | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleFetchJourneyData = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Please enter an email address');

            return;
        }

        setIsLoading(true);
        setError(null);
        setExpandedMetadata([]);

        try {
            const result = await fetchJsonPost('/api/sokol/journey', { email });

            setJourneyData(result.data || []);
            setUserRegion(result.region || null);
            setUserData(result);
            setHasSearched(true);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            sendClientErrorEmail('Error fetching journey data:', err);

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setError(null);
    }, [activeSubTab]);

    const navigationItems = isMarketer ? [
        { id: 'journey', label: 'Lookup User', icon: Users }
    ] : [
        { id: 'journey', label: 'Lookup User', icon: Users },
        { id: 'checkAccounts', label: 'Check Accounts', icon: AlertCircle },
        { id: 'setPassword', label: 'Set Password', icon: Lock },
        { id: 'createUser', label: 'Create User', icon: UserPlus },
        { id: 'refund', label: 'Refund', icon: CreditCard },
        { id: 'export', label: 'Export Purchasers', icon: Download },
        { id: 'clearDebug', label: 'Clear Debug', icon: Users }
    ];

    const getActiveLabel = () => {
        const activeItem = navigationItems.find(item => item.id === activeSubTab);
        return activeItem ? activeItem.label : 'Users';
    };

    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Users</h2>
            
            {/* Mobile Navigation Dropdown */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/50 border border-neutral-700/50 rounded-lg text-white"
                >
                    <span className="text-sm font-medium">{getActiveLabel()}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {mobileMenuOpen && (
                    <div className="mt-2 bg-neutral-900/50 border border-neutral-700/50 rounded-lg overflow-hidden">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`w-full text-left px-4 py-2.5 flex items-center text-sm font-medium ${
                                        activeSubTab === item.id
                                            ? 'bg-purple-900/50 text-purple-200'
                                            : 'text-gray-300 hover:bg-gray-800/50'
                                    } border-b border-neutral-700/50 last:border-b-0`}
                                    onClick={() => {
                                        setActiveSubTab(item.id as any);
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <Icon className="w-4 h-4 mr-3 opacity-70" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block lg:w-64 lg:min-h-[600px]">
                    <nav className="space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center text-sm font-medium ${
                                        activeSubTab === item.id
                                            ? 'bg-purple-900/50 text-purple-200'
                                            : 'text-gray-300 hover:bg-gray-800/50'
                                    }`}
                                    onClick={() => setActiveSubTab(item.id as any)}
                                >
                                    <Icon className="w-4 h-4 mr-3 opacity-70" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex-1 lg:p-6 lg:pt-0">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}
                    {activeSubTab === 'checkAccounts' && <CheckAccountsSubTab />}
                    {activeSubTab === 'journey' && <JourneySubTab email={email} setEmail={setEmail} isLoading={isLoading} journeyData={journeyData} hasSearched={hasSearched} expandedMetadata={expandedMetadata} setExpandedMetadata={setExpandedMetadata} handleFetchJourneyData={handleFetchJourneyData} setHasSearched={setHasSearched} userData={userData} setUserData={setUserData} userRegion={userRegion} userRole={userRole} />}
                    {activeSubTab === 'setPassword' && <SetPasswordSubTab />}
                    {activeSubTab === 'createUser' && <CreateUserSubTab />}
                    {activeSubTab === 'refund' && <RefundSubTab />}
                    {activeSubTab === 'export' && <ExportUsersSubTab />}
                    {activeSubTab === 'clearDebug' && <ClearDebugSubTab />}
                </div>
            </div>
        </>
    );
}

function SetPasswordSubTab() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            await fetchJsonPost('/api/admin/set-password', { email, password });

            setSuccess(true);
            setPassword('');

        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred while setting the password');
            sendClientErrorEmail('Error setting password:', error);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Set User Password</h3>

            <div className="max-w-2xl mx-auto">
                {success ? (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 text-green-400 mb-3 sm:mb-4">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-medium text-green-400 mb-2">Password Updated!</h4>
                        <p className="text-green-300 mb-3 sm:mb-4 text-sm sm:text-base">The password for <span className="font-medium">{email}</span> has been successfully updated.</p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset another password
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                        <form onSubmit={handleSetPassword} className="space-y-6 max-w-md mx-auto">
                            <div>
                                <label htmlFor="setPasswordEmail" className="block text-sm font-medium text-gray-300 mb-2">
                                    User Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        id="setPasswordEmail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        required
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        required
                                        minLength={6}
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-400">Password must be at least 6 characters long</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Setting Password...
                                        </>
                                    ) : (
                                        <>
                                            Set Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

function CreateUserSubTab() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        region: 'HR',
        password: '',
        role: 'user',
        offer_slugs: [] as string[],
        purchase_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
        payment_id: '',
        value: 0,
        currency: 'EUR',
        fallback_ip: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const res = await fetchJsonPost('/api/admin/offer', { action: 'list' });
                setOffers(res.offers || []);
            } catch (err) {
                console.error("Failed to fetch offers", err);
                setError("Failed to load offers. Please refresh.");
            }
        };
        fetchOffers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            const result = await fetchJsonPost('/api/auth/setup-account', formData);
            setSuccess(true);

            let successMsg = "User created successfully!";
            if (result.buyEventInfo) {
                successMsg += ` Purchase event created using IP: ${result.buyEventInfo.ipUsed} (source: ${result.buyEventInfo.ipSource}).`
            }
            setSuccessMessage(successMsg);

            setFormData({
                name: '',
                email: '',
                region: 'HR',
                password: '',
                role: 'user',
                offer_slugs: [],
                purchase_date: new Date().toISOString().split('T')[0],
                payment_method: 'stripe',
                payment_id: '',
                value: 0,
                currency: 'EUR',
                fallback_ip: ''
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred while creating the user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox' && name === 'offer_slugs') {
            const { checked } = e.target as HTMLInputElement;
            let newOfferSlugs: string[];

            if (checked) {
                newOfferSlugs = [...formData.offer_slugs, value];
            } else {
                newOfferSlugs = formData.offer_slugs.filter(slug => slug !== value);
            }
            
            updatePriceAndCurrency(newOfferSlugs, formData.region);

        } else {
            const newFormData = { ...formData, [name]: value };
            if (name === 'region') {
                updatePriceAndCurrency(formData.offer_slugs, value);
            } else {
                setFormData(newFormData);
            }
        }
    };

    const updatePriceAndCurrency = (offerSlugs: string[], region: string) => {
        let totalValue = 0;
        let finalCurrency = 'EUR';

        if (offerSlugs.length > 0) {
            const firstOffer = offers.find(o => o.slug === offerSlugs[0]);
            if (firstOffer) {
                finalCurrency = getPricing(firstOffer, region).currency;
            }

            offerSlugs.forEach(slug => {
                const offer = offers.find(o => o.slug === slug);
                if (offer) {
                    const pricing = getPricing(offer, region);
                    // Ensure we are adding prices in the same currency
                    if (pricing.currency === finalCurrency) {
                        totalValue += pricing.discounted_price;
                    } else {
                        // Handle currency conversion or show an error if currencies mismatch
                        console.warn(`Currency mismatch for offer ${slug}. Expected ${finalCurrency}, got ${pricing.currency}. Skipping price addition.`);
                    }
                }
            });
        }
        
        setFormData(prev => ({ ...prev, offer_slugs: offerSlugs, value: totalValue, currency: finalCurrency, region: region }));
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-6">Create New User</h3>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                {success ? (
                    <div className="text-center">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-medium text-green-400 mb-2">User Created Successfully!</h4>
                            <p className="text-green-300 mb-4">{successMessage}</p>
                        </div>
                        <button
                            onClick={() => setSuccess(false)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Create another user
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                        <fieldset>
                            <legend className="text-lg font-medium text-purple-300 mb-4">User Details</legend>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                            required
                                            minLength={6}
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                                        Role
                                    </label>
                                    <div className="relative">
                                        <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white appearance-none"
                                        >
                                            <option value="user">Standard User</option>
                                            <option value="admin">Admin</option>
                                            <option value="marketer">Marketer</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
                                        Region Code
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            id="region"
                                            name="region"
                                            value={formData.region}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white uppercase"
                                            required
                                            maxLength={2}
                                            minLength={2}
                                            placeholder="e.g. DE, RS, HR"
                                            pattern="[A-Za-z]{2}"
                                            title="Two-letter country code (e.g. DE, RS, HR)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="text-lg font-medium text-purple-300 mb-4 pt-4 border-t border-purple-500/20">Purchase Information (Optional)</legend>
                            <div className="grid md:grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Offers
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto bg-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                                        {offers.length > 0 ? offers.map(offer => (
                                            <label key={offer.slug} className="flex items-center space-x-3 p-2 rounded-md hover:bg-purple-900/40 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="offer_slugs"
                                                    value={offer.slug}
                                                    checked={formData.offer_slugs.includes(offer.slug)}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-white text-sm">{offer.name} ({offer.type})</span>
                                            </label>
                                        )) : <p className="text-gray-400 text-sm">No offers available.</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-300 mb-2">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        id="purchase_date"
                                        name="purchase_date"
                                        value={formData.purchase_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="value" className="block text-sm font-medium text-gray-300 mb-2">
                                        Value
                                    </label>
                                    <input
                                        type="number"
                                        id="value"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-2">
                                        Currency
                                    </label>
                                    <input
                                        type="text"
                                        id="currency"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white uppercase"
                                        maxLength={3}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-300 mb-2">
                                        Payment Method
                                    </label>
                                    <select name="payment_method" id="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white">
                                        <option value="stripe">Stripe</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="bank">Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="payment_id" className="block text-sm font-medium text-gray-300 mb-2">
                                        Payment ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="payment_id"
                                        name="payment_id"
                                        value={formData.payment_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="fallback_ip" className="block text-sm font-medium text-gray-300 mb-2">
                                        Fallback IP Address (Optional)
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            id="fallback_ip"
                                            name="fallback_ip"
                                            value={formData.fallback_ip}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white"
                                            placeholder="e.g. 192.168.1.1"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Provide an IP only if the user&apos;s IP cannot be found from their previous activities.
                                    </p>
                                </div>
                            </div>
                        </fieldset>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating User...
                                </>
                            ) : (
                                'Create User'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function JourneySubTab({
    email,
    setEmail,
    isLoading,
    journeyData,
    hasSearched,
    expandedMetadata,
    setExpandedMetadata,
    handleFetchJourneyData,
    setHasSearched,
    userData,
    setUserData,
    userRegion,
    userRole
}: {
    email: string;
    setEmail: (email: string) => void;
    isLoading: boolean;
    journeyData: LabeledTracking[] | null;
    hasSearched: boolean;
    expandedMetadata: number[];
    setExpandedMetadata: React.Dispatch<React.SetStateAction<number[]>>;
    handleFetchJourneyData: (e: React.FormEvent) => Promise<void>;
    setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
    userData: any | null;
    setUserData: React.Dispatch<React.SetStateAction<any | null>>;
    userRegion: string | null;
    userRole?: string | null;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const isMarketer = userRole === 'marketer';

    const handleEditClick = () => {
        if (!userData || !userData.user) return;
        setEditedUser({
            name: userData.user.user_metadata?.name || '',
            email: userData.user.email || '',
            role: userData.user.user_metadata?.role || 'user',
            region: userData.user.user_metadata?.region || ''
        });
        setIsEditing(true);
        setEditError(null);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedUser(null);
        setEditError(null);
    };

    const handleSaveClick = async () => {
        if (!editedUser || !userData?.user?.id) return;
        setIsSaving(true);
        setEditError(null);
        try {
            const response = await fetchJsonPost('/api/admin/update-user', {
                userId: userData.user.id,
                name: editedUser.name,
                email: editedUser.email,
                role: editedUser.role,
                region: editedUser.region,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            // Successfully updated, now update local state
            const newUserData = {
                ...userData,
                user: response.user
            };
            setUserData(newUserData);
            setIsEditing(false);
        } catch (error) {
            setEditError(error instanceof Error ? error.message : 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedUser((prev: any) => ({
            ...prev,
            [name]: value
        }));
    };

    const buyEvents = journeyData?.filter(event => event.type === 'buy') || [];

    function getActionColor(type: EventType): string {
        if (type === 'buy') return 'text-emerald-600';
        if (type === 'sign_up') return 'text-purple-600';
        if (type === 'buy_click') return 'text-cyan-600';
        if (type === 'buy_decline') return 'text-red-600';
        if (type === 'view') return 'text-white';
        return 'text-white';
    }

    const toggleMetadata = (index: number) => {
        setExpandedMetadata((prev: number[]) => {
            if (prev.includes(index)) {
                return prev.filter((i: number) => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Lookup User</h3>
                <button
                    onClick={() => setHasSearched(false)}
                    className="text-sm text-gray-300 hover:text-white flex items-center transition-colors gap-1.5"
                >
                    <RefreshCw className="w-4 h-4" />
                    New Search
                </button>
            </div>

            <form onSubmit={handleFetchJourneyData} className="mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Search by email or PayPal email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {hasSearched && userData && (
                <div className="mb-6 bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-semibold text-white">User Information</h4>
                        {!isEditing && userData.user && !isMarketer && (
                            <button onClick={handleEditClick} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5">
                                <UserCog size={16} /> Edit User
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            {editError && (
                                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">{editError}</div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400">Name</label>
                                    <input type="text" name="name" value={editedUser.name} onChange={handleEditFormChange} className="w-full bg-neutral-700/50 border border-neutral-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Email</label>
                                    <input type="email" name="email" value={editedUser.email} onChange={handleEditFormChange} className="w-full bg-neutral-700/50 border border-neutral-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Role</label>
                                    <select name="role" value={editedUser.role} onChange={handleEditFormChange} className="w-full bg-neutral-700/50 border border-neutral-600 rounded p-2 text-white">
                                        <option value="user">Standard</option>
                                        <option value="admin">Admin</option>
                                        <option value="marketer">Marketer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Region</label>
                                    <input 
                                        type="text" 
                                        name="region" 
                                        value={editedUser.region} 
                                        onChange={handleEditFormChange} 
                                        className="w-full bg-neutral-700/50 border border-neutral-600 rounded p-2 text-white uppercase"
                                        maxLength={2}
                                        placeholder="e.g. DE, RS, HR"
                                        pattern="[A-Za-z]{2}"
                                        title="Two-letter country code (e.g. DE, RS, HR)"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={handleCancelClick} className="px-4 py-2 text-sm rounded bg-neutral-600 hover:bg-neutral-500 text-white">Cancel</button>
                                <button onClick={handleSaveClick} disabled={isSaving} className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 disabled:opacity-50">
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        userData.user ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Name</p>
                                    <p className="text-white font-medium">{userData.user.user_metadata?.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Email</p>
                                    <p className="text-white font-medium">{userData.user.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Registered</p>
                                    <p className="text-white font-medium">{formatDate(userData.user.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Role</p>
                                    <p className="text-white font-medium capitalize">{userData.user.user_metadata?.role || 'user'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">LTV (EUR)</p>
                                    <p className="text-white font-medium">{formatCurrency(userData.ltv, 'EUR')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Detected Region</p>
                                    <p className="text-white font-medium">{userRegion || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Events Tracked</p>
                                    <p className="text-white font-medium">{journeyData?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Journey Duration</p>
                                    <p className="text-white font-medium">
                                        {journeyData && journeyData.length >= 2 ? calculateJourneyTime(journeyData) : 'N/A'}
                                    </p>
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                    <p className="text-gray-400">Purchases ({buyEvents.length})</p>
                                    {buyEvents.length > 0 ? (
                                        <div className="space-y-2 mt-1">
                                            {buyEvents.map((purchase) => (
                                                <div key={purchase.id} className="bg-purple-900/20 p-3 rounded-lg border border-purple-800/50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-white font-semibold text-sm">
                                                                {purchase.metadata.primary_offer_slug}
                                                                {purchase.metadata.secondary_offer_slug && (
                                                                    <span className="text-purple-300 font-normal"> + {purchase.metadata.secondary_offer_slug}</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatDate(purchase.date)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0 ml-4">
                                                            <p className="text-green-400 font-bold text-sm">{formatCurrency(purchase.metadata.value || 0, purchase.metadata.currency || 'EUR')}</p>
                                                            <p className="text-xs text-gray-400 capitalize">{purchase.metadata.payment_method}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Payment ID: <code className="bg-neutral-700/50 text-xs px-1 rounded">{purchase.metadata.payment_id}</code>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 mt-1">No purchases found.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">User not found in Supabase Auth database.</p>
                        )
                    )}
                </div>
            )}
            
            {hasSearched && journeyData && journeyData.length > 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="font-mono text-sm text-slate-300 overflow-x-auto">
                        <div className="space-y-2">
                            {journeyData.map((entry, index) => (
                                <div
                                    key={index}
                                    className="bg-black/20 border border-gray-700/50 rounded-lg p-3 hover:bg-black/30 transition-colors"
                                >
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-medium inline-block">
                                            {formatDate(entry.date)}
                                        </span>

                                        <span className={`font-medium ${getActionColor(entry.type)} flex-1`}>
                                            {entry.action}
                                            {entry.referer && (
                                                <span className="text-slate-400 font-normal"> from <span className="text-slate-300">
                                                    {entry.referer.split('?')[0]}
                                                </span></span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {entry.campaign_name && (
                                            <span className="bg-amber-100/20 text-amber-200 px-2 py-1 rounded text-xs font-medium">
                                                {entry.campaign_name}
                                            </span>
                                        )}
                                        {entry.campaign_id && (
                                            <span className="bg-blue-100/20 text-blue-300 px-2 py-1 rounded text-xs font-medium">
                                                {entry.campaign_name ?
                                                    <span title={`Campaign ID: ${entry.campaign_id}`}>Campaign: {entry.campaign_name}</span> :
                                                    <span>Campaign {entry.campaign_id}</span>
                                                }
                                            </span>
                                        )}
                                        {entry.adset_id && (
                                            <span className="bg-green-100/20 text-green-300 px-2 py-1 rounded text-xs font-medium">
                                                {entry.adset_name ?
                                                    <span title={`Ad Set ID: ${entry.adset_id}`}>Ad Set: {entry.adset_name}</span> :
                                                    <span>Ad Set {entry.adset_id}</span>
                                                }
                                            </span>
                                        )}
                                        {entry.ad_id && (
                                            <span className="bg-purple-100/20 text-purple-300 px-2 py-1 rounded text-xs font-medium">
                                                {entry.ad_name ?
                                                    <span title={`Ad ID: ${entry.ad_id}`}>Ad: {entry.ad_name}</span> :
                                                    <span>Ad {entry.ad_id}</span>
                                                }
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-400 flex justify-between items-center">
                                        <span>IP: {entry.ip}</span>
                                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                            <button
                                                onClick={() => toggleMetadata(index)}
                                                className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                                            >
                                                {expandedMetadata.includes(index) ? '- hide metadata' : '+ metadata'}
                                            </button>
                                        )}
                                    </div>

                                    {expandedMetadata.includes(index) && entry.metadata && (
                                        <div className="mt-3 p-3 bg-slate-800/80 rounded border-l-2 border-purple-500 text-xs">
                                            <pre className="whitespace-pre-wrap text-slate-300">
                                                {JSON.stringify(entry.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : hasSearched ? (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-gray-700/20">
                    <p className="text-gray-400 mb-4">No journey data found for this user.</p>
                </div>
            ) : null}
        </div>
    );
}

function CheckAccountsSubTab() {
    const [data, setData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [isSendingEmails, setIsSendingEmails] = useState<boolean>(false);
    const [emailSendProgress, setEmailSendProgress] = useState<number>(0);
    const [emailSendTotal, setEmailSendTotal] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);
    const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/check-accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok)
                throw new Error('Failed to fetch data from admin/check-accounts');

            setData(await response.json() as AdminSalesData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            sendClientErrorEmail('Error fetching account check data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRow = (paymentId: string) => {
        setSelectedAccounts(prev =>
            prev.includes(paymentId)
                ? prev.filter(id => id !== paymentId)
                : [...prev, paymentId]
        );
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allPaymentIds = data?.missing_accounts.map((item: any) => item.payment_id) || [];
            setSelectedAccounts(allPaymentIds);
        } else {
            setSelectedAccounts([]);
        }
    };

    const handleCreateAccounts = async () => {
        if (selectedAccounts.length === 0) {
            setCreateErrorMessage("No accounts selected.");
            return;
        }

        if (password.length < 6) {
            setCreateErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        setIsCreating(true);
        setCreateSuccessMessage(null);
        setCreateErrorMessage(null);
        const createdEmails: string[] = [];
        const createdAccountsData: { email: string; name: string }[] = [];
        const failedEmails: { email: string; error: string }[] = [];

        for (const paymentId of selectedAccounts) {
            const accountData = data?.missing_accounts.find((item: any) => item.payment_id === paymentId);

            if (!accountData)
                throw new Error(`Data not found for selected payment ID: ${paymentId}`);

            try {
                await fetchJsonPost('/api/auth/setup-account', {
                    email: accountData.email,
                    name: accountData.name,
                    password: password,
                    region: accountData.region,
                    auto_login: false,
                    stripe_customer_id: accountData.stripe_customer_id
                });

                createdEmails.push(accountData.email);
                createdAccountsData.push({ email: accountData.email, name: accountData.name });

            } catch (err) {
                const error = ensureError(err, 'Failed to create account');
                failedEmails.push({ email: accountData.email, error: error.message });
                sendClientErrorEmail(`Error creating account for ${accountData.email} from admin panel:`, error);
            }
        }

        setIsCreating(false);

        let successMsg = '';
        if (createdEmails.length > 0) {
            successMsg = `Successfully created accounts for: ${createdEmails.join(', ')}. `;
        }
        let errorMsg = '';
        if (failedEmails.length > 0) {
            errorMsg = `Failed to create accounts for: ${failedEmails.map(f => `${f.email} (${f.error})`).join(', ')}`;
        }

        setCreateSuccessMessage(successMsg || null);
        setCreateErrorMessage(errorMsg || null);

        if (createdEmails.length > 0) {
            setIsSendingEmails(true);
            setEmailSendTotal(createdAccountsData.length);
            setEmailSendProgress(0);
            let emailsSent = 0;
            const emailErrors: { email: string; error: string }[] = [];

            for (const account of createdAccountsData) {
                try {
                    await fetchJsonPost('/api/email/send', {
                        template: EmailTemplate.ACCOUNT_CREATED_MANUALLY,
                        recipient: account.email,
                        data: {
                            name: account.name,
                            loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
                            password: password
                        }
                    });
                    
                    emailsSent++;
                    setEmailSendProgress(emailsSent);
                } catch (emailErr) {
                    const error = ensureError(emailErr, `Failed to send account created email to ${account.email}`);
                    emailErrors.push({ email: account.email, error: error.message });
                    sendClientErrorEmail(`Failed sending ACCOUNT_CREATED_MANUALLY to ${account.email}:`, error);
                }
            }

            setIsSendingEmails(false);

            if (emailErrors.length > 0) {
                const currentError = createErrorMessage || '';
                const newError = ` Email sending failed for: ${emailErrors.map(e => `${e.email} (${e.error})`).join(', ')}`;
                setCreateErrorMessage((currentError + newError).trim());
            }

            //fetchData();
            setSelectedAccounts([]);
            setPassword('');
        }
    };

    const renderMissingAccountsTable = (items: any[], emptyMessage: string) => {
        if (items.length === 0)
            return <p className="text-gray-400 text-sm">{emptyMessage}</p>;

        return (
            <div className="overflow-x-auto border border-purple-500/20 rounded-lg">
                <table className="min-w-full divide-y divide-purple-500/20">
                    <thead className="bg-purple-900/30">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider w-12">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                                    onChange={handleSelectAll}
                                    ref={el => {
                                        if (el) {
                                            const numSelected = selectedAccounts.length;
                                            const numItems = items.length;
                                            el.checked = numSelected === numItems && numItems > 0;
                                            el.indeterminate = numSelected > 0 && numSelected < numItems;
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Payment Method</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Payment ID</th>
                        </tr>
                    </thead>
                    <tbody className="bg-purple-900/10 divide-y divide-purple-500/10">
                        {items.map((item) => (
                            <tr key={item.payment_id}>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                                        checked={selectedAccounts.includes(item.payment_id)}
                                        onChange={() => handleSelectRow(item.payment_id)}
                                    />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">{item.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{item.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">{item.payment_method}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">{item.payment_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderEmailListTable = (items: any[], emptyMessage: string) => {
        if (items.length === 0)
            return <p className="text-gray-400 text-sm">{emptyMessage}</p>;

        return (
            <div className="overflow-x-auto border border-purple-500/20 rounded-lg">
                <table className="min-w-full divide-y divide-purple-500/20">
                    <thead className="bg-purple-900/30">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-purple-900/10 divide-y divide-purple-500/10">
                        {items.map((email) => (
                            <tr key={email}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-mono">{email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Account Consistency Check</h3>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-6 mb-6">
                <p className="text-gray-300 text-sm mb-4">
                    Check for account consistency issues such as missing accounts, refunded users, and accounts without purchases.
                </p>

                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-1" /> Checking Accounts...</>
                    ) : (
                        <><User className="w-5 h-5 mr-1" /> Check Accounts</>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : data ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg border border-purple-500/20">
                        <div className={`p-4 rounded-lg ${data.purchases_count !== data.mzda_transactions_count ? 'bg-red-900/30 border border-red-500/40' : 'bg-purple-900/30'}`}>
                            <h4 className="text-sm font-medium text-gray-300 mb-1">Purchase Count</h4>
                            <p className="text-2xl font-bold text-white">{data.purchases_count}</p>
                            <p className="text-xs text-gray-400 mt-1">Database Purchases</p>
                        </div>
                        <div className={`p-4 rounded-lg ${data.purchases_count !== data.mzda_transactions_count ? 'bg-red-900/30 border border-red-500/40' : 'bg-purple-900/30'}`}>
                            <h4 className="text-sm font-medium text-gray-300 mb-1">Mzda Count</h4>
                            <p className="text-2xl font-bold text-white">{data.mzda_transactions_count}</p>
                            <p className="text-xs text-gray-400 mt-1">Mzda Transactions</p>
                        </div>
                        <div className={`p-4 rounded-lg ${data.purchases_value !== data.mzda_transactions_value ? 'bg-red-900/30 border border-red-500/40' : 'bg-purple-900/30'}`}>
                            <h4 className="text-sm font-medium text-gray-300 mb-1">Purchase Value (EUR)</h4>
                            <p className="text-2xl font-bold text-white">{formatCurrency(data.purchases_value, 'EUR')}</p>
                            <p className="text-xs text-gray-400 mt-1">DB Purchases (Converted)</p>
                        </div>
                        <div className={`p-4 rounded-lg ${data.purchases_value !== data.mzda_transactions_value ? 'bg-red-900/30 border border-red-500/40' : 'bg-purple-900/30'}`}>
                            <h4 className="text-sm font-medium text-gray-300 mb-1">Mzda Value (EUR)</h4>
                            <p className="text-2xl font-bold text-white">{formatCurrency(data.mzda_transactions_value, 'EUR')}</p>
                            <p className="text-xs text-gray-400 mt-1">Mzda Transactions</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-medium text-white mb-2">Users with Purchase but No Account ({data.missing_accounts.length})</h4>

                        {data.missing_accounts.length > 0 && (
                            <div className="my-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg flex flex-col md:flex-row items-center gap-4">
                                <div className="flex-grow">
                                    <label htmlFor="createPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                        Password for New Accounts
                                    </label>
                                    <input
                                        type="password"
                                        id="createPassword"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter minimum 6 characters"
                                        className="w-full px-3 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white placeholder-gray-500"
                                        minLength={6}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateAccounts}
                                    disabled={isCreating || selectedAccounts.length === 0 || password.length < 6}
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap mt-2 md:mt-0 md:self-end"
                                >
                                    {isCreating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-1" /> Creating...</>
                                    ) : (
                                        <><UserPlus className="w-5 h-5 mr-1" /> Create Selected ({selectedAccounts.length})</>
                                    )}
                                </button>
                            </div>
                        )}

                        {createSuccessMessage && (
                            <div className="my-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-sm text-green-300">
                                {createSuccessMessage}
                            </div>
                        )}
                        {createErrorMessage && (
                            <div className="my-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-300">
                                {createErrorMessage}
                            </div>
                        )}

                        {isSendingEmails && (
                            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                                <div className="flex items-center gap-2 mb-1">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Sending confirmation emails... ({emailSendProgress}/{emailSendTotal})</span>
                                </div>
                                <div className="w-full bg-blue-900/50 rounded-full h-1.5">
                                    <div
                                        className="bg-blue-500 h-1.5 rounded-full transition-width duration-300 ease-linear"
                                        style={{ width: `${(emailSendProgress / emailSendTotal) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {renderMissingAccountsTable(data.missing_accounts, 'All purchased users have an account.')}
                    </div>

                    <div>
                        <h4 className="text-lg font-medium text-white mb-2">Refunded Users Still Having Account ({data.refunded_still_active.length})</h4>
                        {renderEmailListTable(data.refunded_still_active, 'No refunded users with active accounts found.')}
                    </div>

                    <div>
                        <h4 className="text-lg font-medium text-white mb-2">Accounts Without Purchase ({data.accounts_without_purchase.length})</h4>
                        {renderEmailListTable(data.accounts_without_purchase, 'All accounts have at least one purchase.')}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ExportUsersSubTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleExport = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const users = await fetchJsonPost('/api/admin/export-purchasers');

            if (!users || users.length === 0) {
                setError('No purchasers found to export.');
                setIsLoading(false);
                return;
            }

            let csvContent = "email,fn,ln,v\n";
            users.forEach((user: { email: string, name: string | null, totalValueEur: number }) => {
                let firstName = '';
                let lastName = '';

                if (user.name) {
                    const nameParts = user.name.trim().split(/\s+/);
                    firstName = nameParts[0] || '';
                    if (nameParts.length > 1) {
                        lastName = nameParts.slice(1).join(' ');
                    }
                }

                const escapeCSV = (field: string) => {
                    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                        return `"${field.replace(/"/g, '""')}"`;
                    }
                    return field;
                };

                csvContent += `${user.email},${escapeCSV(firstName)},${escapeCSV(lastName)},${user.totalValueEur}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "facebook_purchasers_export.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            setSuccessMessage(`Successfully exported ${users.length} purchasers.`);

        } catch (err) {
            const error = ensureError(err, 'Failed to export purchasers');
            setError(error.message);
            sendClientErrorEmail('Error exporting purchasers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-6">Export Purchasers for Facebook</h3>

            <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-6">
                <p className="text-gray-300 text-sm mb-6">
                    Download a CSV file containing the email, first name, and last name of all users who have made a purchase.
                    This file can be used to create a custom audience in Facebook Ads for exclusion targeting.
                </p>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-300 text-sm">{successMessage}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Export CSV
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function RefundSubTab() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<Tracking[]>([]);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const [refundSuccess, setRefundSuccess] = useState<{
        purchase: Tracking;
        refundLink: string | null;
        refundInstructions: string;
        googleSheetsLink: string;
    } | null>(null);

    const handleSearchPurchases = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPurchases([]);
        setSelectedPurchaseId(null);
        setRefundSuccess(null);

        try {
            const result = await fetchJsonPost('/api/admin/refund', {
                action: 'get_purchases',
                email: email.trim()
            });

            if (result.purchases && result.purchases.length > 0) {
                setPurchases(result.purchases);
            } else {
                setError('No active purchases found for this email');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
            sendClientErrorEmail('Error fetching purchases for refund:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessRefund = async () => {
        if (!selectedPurchaseId) {
            setError('Please select a purchase to refund');
            return;
        }

        if (!confirm('Are you sure you want to refund this purchase? This will mark it as refunded and remove the user from the WordPress list.')) {
            return;
        }

        setIsProcessingRefund(true);
        setError(null);

        try {
            const result = await fetchJsonPost('/api/admin/refund', {
                action: 'process_refund',
                purchase_id: selectedPurchaseId
            });

            setRefundSuccess({
                purchase: result.purchase,
                refundLink: result.refundLink,
                refundInstructions: result.refundInstructions,
                googleSheetsLink: result.googleSheetsLink
            });

            // Remove the refunded purchase from the list
            setPurchases(prev => prev.filter(p => p.id !== selectedPurchaseId));
            setSelectedPurchaseId(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process refund');
            sendClientErrorEmail('Error processing refund:', err);
        } finally {
            setIsProcessingRefund(false);
        }
    };

    const handleNewSearch = () => {
        setEmail('');
        setPurchases([]);
        setSelectedPurchaseId(null);
        setRefundSuccess(null);
        setError(null);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-6">Process Refund</h3>

            {!refundSuccess ? (
                <>
                    <form onSubmit={handleSearchPurchases} className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="refundEmail" className="block text-sm font-medium text-gray-300 mb-2">
                                    Customer Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        id="refundEmail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        placeholder="customer@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Search Purchases
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {purchases.length > 0 && (
                        <div>
                            <h4 className="text-lg font-medium text-white mb-4">Select Purchase to Refund</h4>
                            <div className="space-y-3 mb-6">
                                {purchases.map((purchase) => (
                                    <div
                                        key={purchase.id}
                                        onClick={() => setSelectedPurchaseId(purchase.id)}
                                        className={`bg-neutral-800/50 border rounded-lg p-4 cursor-pointer transition-all ${
                                            selectedPurchaseId === purchase.id
                                                ? 'border-purple-500 bg-purple-900/20'
                                                : 'border-neutral-700 hover:border-purple-500/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    checked={selectedPurchaseId === purchase.id}
                                                    onChange={() => setSelectedPurchaseId(purchase.id)}
                                                    className="mt-1 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-white">
                                                            {purchase.metadata.primary_offer_slug}
                                                            {purchase.metadata.secondary_offer_slug && (
                                                                <span className="text-purple-300"> + {purchase.metadata.secondary_offer_slug}</span>
                                                            )}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-neutral-700 rounded-full text-gray-300 capitalize">
                                                            {purchase.metadata.payment_method}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        <span>Date: {formatDate(purchase.date)}</span>
                                                        <span className="mx-2">•</span>
                                                        <span>Payment ID: <code className="text-xs bg-neutral-700/50 px-1 rounded">{purchase.metadata.payment_id}</code></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-400 font-bold">{formatCurrency(purchase.metadata.value || 0, purchase.metadata.currency || 'EUR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleProcessRefund}
                                disabled={!selectedPurchaseId || isProcessingRefund}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessingRefund ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing Refund...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Process Refund
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h4 className="text-lg font-medium text-green-400 mb-2">Refund Marked Successfully</h4>
                            <p className="text-green-300 text-sm mb-3">
                                The purchase has been marked as refunded and the customer has been removed from the WordPress list.
                            </p>
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-3">Refunded Purchase Details:</h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Product:</span>
                                <span className="text-white">
                                    {refundSuccess.purchase.metadata.primary_offer_slug}
                                    {refundSuccess.purchase.metadata.secondary_offer_slug && (
                                        <span className="text-purple-300"> + {refundSuccess.purchase.metadata.secondary_offer_slug}</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-white">{formatCurrency(refundSuccess.purchase.metadata.value || 0, refundSuccess.purchase.metadata.currency || 'EUR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment Method:</span>
                                <span className="text-white capitalize">{refundSuccess.purchase.metadata.payment_method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment ID:</span>
                                <code className="text-white text-xs bg-neutral-700/50 px-1 rounded">{refundSuccess.purchase.metadata.payment_id}</code>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-4">
                        <h5 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Next Steps
                        </h5>
                        <p className="text-blue-300 text-sm mb-3">{refundSuccess.refundInstructions}</p>
                        
                        <div className="flex flex-wrap gap-3 mt-4">
                            {refundSuccess.refundLink && (
                                <a
                                    href={refundSuccess.refundLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Process Refund in {refundSuccess.purchase.metadata.payment_method === 'paypal' ? 'PayPal' : 'Stripe'}
                                </a>
                            )}
                            
                            <a
                                href={refundSuccess.googleSheetsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Update Google Sheets
                            </a>
                        </div>
                    </div>

                    <button
                        onClick={handleNewSearch}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Process Another Refund
                    </button>
                </div>
            )}
        </div>
    );
}

function ClearDebugSubTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleClearDebugData = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await fetchJsonPost('/api/admin/clear-debug-data');
            
            if (result.success) {
                setSuccessMessage(result.message);
            } else {
                setError(result.error || 'An unknown error occurred.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear debug data.');
            sendClientErrorEmail('Error clearing debug data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-white mb-6">Clear Debug Data</h3>
            <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                    <div>
                        <h4 className="text-lg font-medium text-red-300">Warning: Destructive Action</h4>
                        <p className="text-gray-300 text-sm mt-1">
                            This action will permanently delete all tracking data associated with the IP address <strong>127.0.0.1</strong>. 
                            It will also remove associated records from other tables like webinar sessions, feedback, form responses, etc.
                        </p>
                        <p className="text-red-400 font-semibold text-sm mt-2">This cannot be undone.</p>
                    </div>
                </div>
                
                <div className="mt-6">
                    <button
                        onClick={handleClearDebugData}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Deleting Data...
                            </>
                        ) : (
                            <>
                                <Users className="w-5 h-5" />
                                Clear All Debug Data
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mt-6">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mt-6">
                         <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <h5 className="text-green-300 font-semibold">Cleanup Complete</h5>
                        </div>
                        <pre className="text-green-200 text-xs whitespace-pre-wrap font-mono bg-black/20 p-3 rounded-md max-h-60 overflow-y-auto">
                            {successMessage}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
