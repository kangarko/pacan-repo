'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@repo/ui/lib/clientUtils';
import { useRouter } from 'next/navigation';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost } from '@repo/ui/lib/utils';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Check if user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user)
                router.push('/dashboard');
            else
                setIsCheckingAuth(false);
        };

        checkUser();
    }, [router, supabase.auth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            await fetchJsonPost('/api/auth/reset-password', {
                email: email
            });

            // Show success message
            setSuccess(true);

        } catch (error) {
            let errorMessage = 'An error occurred while sending the password reset email.';
            let isKnownError = false;

            if (error instanceof Error) {
                const errorTranslations: Record<string, string> = {
                    'User not found': 'User with this email address was not found',
                    'Email not confirmed': 'Email address not confirmed, please check your email for confirmation',
                    'Rate limit exceeded': 'Too many attempts, please try again later',
                    'Invalid email': 'Invalid email address',
                    'Email rate limit exceeded': 'Too many attempts, please try again later',
                    'Server error': 'Server error'
                };

                const originalMessage = error.message;
                errorMessage = errorTranslations[originalMessage] || originalMessage;
                isKnownError = errorTranslations[originalMessage] !== undefined;
            }

            if (!isKnownError)
                sendClientErrorEmail('Error in forgot-password:', error);

            setError(errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative py-24 overflow-hidden bg-gray-900 text-white">
            <div className="container mx-auto px-4 relative z-10">
                {isCheckingAuth ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Forgot Your Password?
                            </h1>
                            <p className="text-gray-300">
                                Enter the email you used to purchase the book
                            </p>
                        </div>

                        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            {success && !error ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-green-900/40 border border-green-500/30 rounded-lg p-4">
                                        <p className="text-green-300">
                                            We've sent you an email with a link to reset your password.
                                            Please check your inbox.
                                        </p>
                                    </div>
                                    <Link
                                        href="/login"
                                        className="block text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Back to login
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>

                                    <div className="text-center">
                                        <Link
                                            href="/login"
                                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            Back to login
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
} 