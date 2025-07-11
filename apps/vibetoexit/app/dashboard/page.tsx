'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Book, User as UserIcon, LogOut, Settings, CreditCard, Receipt, Save, AlertCircle, Check, Code, Briefcase } from 'lucide-react';
import { UserContextData, Tracking } from '@repo/ui/lib/types';
import { fetchJsonPost, formatCurrency, formatDate } from '@repo/ui/lib/utils';
import { User } from '@supabase/supabase-js';
import { retrieveData, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { createSupabaseClient } from '@repo/ui/lib/clientUtils';

const TransactionsPanel = ({ transactions, loading }: { transactions: Tracking[], loading: boolean }) => {
    if (loading)
        return (
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-400">Loading transaction history...</p>
            </div>
        );

    if (transactions.length === 0)
        return (
            <div className="text-center py-10">
                <div className="bg-gray-800/50 rounded-lg p-8 max-w-md mx-auto border border-gray-700/50">
                    <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-white">No Transactions Yet</h3>
                    <p className="text-gray-400">
                        You haven&apos;t made any purchases yet. When you do, your transaction history will appear here.
                    </p>
                </div>
            </div>
        );

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => (
                <div key={transaction.metadata.payment_id} className="transaction-item bg-gray-800/60 rounded-xl p-5 hover:bg-gray-700/60 transition-colors border border-gray-700/50 overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-indigo-500/20 p-3 text-indigo-400">
                                {transaction.metadata.payment_method === 'stripe' ? (
                                    <CreditCard className="w-6 h-6" />
                                ) : transaction.metadata.payment_method === 'paypal' ? (
                                    <Image
                                        src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg"
                                        alt="PayPal"
                                        width={24}
                                        height={24}
                                        className="w-6 h-6"
                                    />
                                ) : (
                                    <CreditCard className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white">{transaction.metadata.primary_offer_slug}</h3>
                                {transaction.metadata.secondary_offer_slug && (
                                    <p className="text-sm text-gray-400">+ {transaction.metadata.secondary_offer_slug}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">{formatDate(new Date(transaction.date))}</p>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 text-right flex-shrink-0">
                            <p className="font-semibold text-lg text-white">{formatCurrency(transaction.metadata.value!, transaction.metadata.currency!)}</p>
                            <div className="flex items-center justify-end text-sm mt-1">
                                <div className={`w-2 h-2 rounded-full mr-2 ${transaction.metadata.payment_status === 'succeeded' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="capitalize text-gray-400">{transaction.metadata.payment_status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 text-right">
                        ID: {transaction.metadata.payment_id}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const supabase = createSupabaseClient();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userContext, setUserContext] = useState<UserContextData | null>(null);

    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [settingsData, setSettingsData] = useState({
        name: '',
        email: '',
        newPassword: '',
        passwordConfirm: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const data = await retrieveData(true);

        setUserContext(data);
        setUser(user);

        setSettingsData({
            name: user.user_metadata?.name || user.user_metadata?.display_name || '',
            email: user.email || '',
            newPassword: '',
            passwordConfirm: '',
        });

        setLoading(false);
    }, [router, supabase.auth]);

    useEffect(() => {
        loadDashboardData()
    }, [loadDashboardData]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            sendClientErrorEmail('Error signing out:', error);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettingsData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            if (settingsData.newPassword) {
                if (settingsData.newPassword !== settingsData.passwordConfirm) {
                    setSaveError('Passwords do not match.');
                    setIsSaving(false);
                    return;
                }

                if (settingsData.newPassword.length < 6) {
                    setSaveError('Password must be at least 6 characters long.');
                    setIsSaving(false);
                    return;
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: settingsData.newPassword,
                });

                if (passwordError) throw passwordError;
            }

            const { error } = await supabase.auth.updateUser({
                data: {
                    name: settingsData.name,
                    display_name: settingsData.name,
                }
            });

            if (error) throw error;

            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) {
                setUser(updatedUser);
            }

            setSaveSuccess(true);
            setSettingsData(prev => ({ ...prev, newPassword: '', passwordConfirm: '' }));
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error) {
            const err = error as Error;
            let errorMessage = err.message;

            if (err.message.includes('should be different from the old password')) {
                errorMessage = 'New password must be different from the current one.';
            } else {
                sendClientErrorEmail('Error updating user settings:', err);
            }
            setSaveError(errorMessage);

        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-900">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="text-center py-20">
                        <div className="bg-gray-800/50 rounded-lg p-8 max-w-md mx-auto border border-gray-700/50">
                            <Briefcase className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2 text-white">Work in Progress</h3>
                            <p className="text-gray-400">
                                We are currently building this section. Your products and materials will appear here soon.
                            </p>
                        </div>
                    </div>
                );
            case 'transactions':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                            <Receipt className="w-6 h-6 text-indigo-400" />
                            Transaction History
                        </h2>
                        <TransactionsPanel
                            transactions={userContext?.transactions || []}
                            loading={loading}
                        />
                    </>
                );
            case 'account':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                            <UserIcon className="w-6 h-6 text-indigo-400" />
                            Account Settings
                        </h2>

                        <div className="bg-gray-800/60 rounded-xl overflow-hidden border border-gray-700/50">
                            <div className="p-6">
                                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                    {saveError && (
                                        <div className="bg-red-900/40 border border-red-500/30 rounded-md p-4 flex">
                                            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                                            <p className="text-sm text-red-300">{saveError}</p>
                                        </div>
                                    )}

                                    {saveSuccess && (
                                        <div className="bg-green-900/40 border border-green-500/30 rounded-md p-4 mb-6">
                                            <p className="text-sm text-green-300 flex items-center">
                                                <Check className="h-4 w-4 mr-2" />
                                                Settings saved successfully!
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={settingsData.name}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={isSaving}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={settingsData.email}
                                                className="w-full bg-gray-900/30 border border-gray-700/30 rounded-lg p-3 text-gray-400 cursor-not-allowed"
                                                disabled={true}
                                                readOnly
                                            />
                                             <p className="mt-1 text-xs text-gray-500">
                                                To change your email address, contact us at {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                            </p>
                                        </div>
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={settingsData.newPassword}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={isSaving}
                                                placeholder="Leave blank to keep current password"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-300 mb-1">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                id="passwordConfirm"
                                                name="passwordConfirm"
                                                value={settingsData.passwordConfirm}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={isSaving}
                                                placeholder="Repeat new password"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="mr-2">Saving...</span>
                                                    <div className="h-4 w-4 border-2 border-t-indigo-500 border-white rounded-full animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                );
            default:
                return <div className="text-white">Select an option from the menu.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-0 sm:px-4 pt-0 sm:py-10">
                <div className="bg-gray-800/30 border border-gray-700/50 backdrop-blur-lg sm:rounded-2xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-60 flex-shrink-0 border-r border-gray-700/50 bg-gray-900/50">
                            <div className="p-4 flex flex-col h-full">
                                <div className="mb-8 text-center hidden md:block">
                                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-3">
                                        <UserIcon className="h-8 w-8" />
                                    </div>
                                    <h2 className="font-semibold text-white text-lg mb-1 truncate">
                                        {user?.user_metadata?.name || user?.email}
                                    </h2>
                                    <p className="text-indigo-400 text-sm truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <nav className="flex md:flex-col md:space-y-2 justify-around md:justify-start">
                                    <button
                                        onClick={() => setActiveTab('dashboard')}
                                        className={`flex items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'dashboard'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Code className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Dashboard</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`flex items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'transactions'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Receipt className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Transactions</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('account')}
                                        className={`flex items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'account'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Settings className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Account</span>
                                    </button>
                                </nav>
                                <div className="mt-auto">
                                    {(user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'marketer') && (
                                        <button
                                            onClick={() => router.push('/admin')}
                                            className="flex w-full items-center justify-center md:justify-start p-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-colors mb-2"
                                        >
                                            <UserIcon className="h-5 w-5" />
                                            <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Admin Panel</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center md:justify-start p-3 text-red-400 hover:bg-red-900/30 rounded-xl transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-6 bg-gray-900">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 