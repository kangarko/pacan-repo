'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseClient, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [urlHash, setUrlHash] = useState<URLSearchParams | null>(null);
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash.substring(1);

        if (hash) {
            const params = new URLSearchParams(hash);

            const token = params.get('access_token');
            const refresh = params.get('refresh_token');
            const type = params.get('type');

            if (token && refresh && type === 'recovery') {
                setIsValid(true);
                setUrlHash(params);
                return;
            }
        }

        const checkSession = async () => {
            const { data: { session }, error } = await createSupabaseClient().auth.getSession();

            if (error) {
                setIsValid(false);
                return;
            }

            if (session) {
                const type = new URLSearchParams(hash.substring(1)).get('type');

                if (type === 'recovery')
                    setIsValid(true);
                else
                    router.push('/dashboard');

            } else
                setIsValid(false);
        };

        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createSupabaseClient();

            // Set the session using tokens from URL hash if available
            if (urlHash) {
                const accessToken = urlHash.get('access_token');
                const refreshToken = urlHash.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (sessionError) {
                        throw sessionError;
                    }
                }
            }

            // Now update the password
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error)
                throw error;

            setIsSuccess(true);

        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : 'An error occurred while resetting your password';

            if (errorMessage.includes('token is invalid or expired'))
                errorMessage = 'The password reset link has expired. Please request a new one.';
            else if (errorMessage.includes('Password should be at least'))
                errorMessage = 'Password must be at least 6 characters long';
            else if (errorMessage.includes('Auth session missing'))
                errorMessage = 'Your session has expired. Please request a new password reset link.';
            else if (errorMessage.includes('New password should be different from the old password'))
                errorMessage = 'The new password must be different from the current one.';
            else
                sendClientErrorEmail('Error resetting password:', error);

            setError(errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen relative bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Password Changed Successfully!
                            </h1>
                            <p className="text-gray-300 mb-6">
                                Your password has been set. You can now sign in with your new password.
                            </p>

                            <Link
                                href="/login"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="min-h-screen relative bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-red-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-8 h-8 text-red-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Invalid Link
                            </h1>
                            <p className="text-gray-300">
                                This password reset link has expired or is invalid.
                                Please request a new link.
                            </p>
                        </div>

                        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Request a new reset link
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md mx-auto"
                >
                    <div className="text-center mb-8">
                        <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">
                            Set a new password
                        </h1>
                        <p className="text-gray-300">
                            Please enter your new password
                        </p>
                    </div>

                    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Setting...' : 'Set New Password'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 