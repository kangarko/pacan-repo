'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GradientBackground from '@repo/ui/components/GradientBackground';
import Cookies from 'js-cookie';
import { createSupabaseClient, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [redirectPath, setRedirectPath] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createSupabaseClient();

    // Check if user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            // Check for error parameters in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const errorParam = urlParams.get('error');
            // Get redirect path if provided
            const redirect = urlParams.get('redirect');
            if (redirect) {
                setRedirectPath(redirect);
            }

            if (errorParam) {
                const errorMessages: Record<string, string> = {
                    'invalid_session': 'Your session has expired or is invalid. Please log in again.',
                    'session_error': 'There was a problem with your login. Please log in again.',
                    'unauthorized': 'You do not have permission to access this page. Please log in again.'
                };

                setError(errorMessages[errorParam] || 'There was a problem with your login.');
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                if (redirectPath)
                    router.push(redirectPath);

                else
                    router.push('/dashboard');

            } else {
                const leadEmail = Cookies.get('lead_email');

                if (leadEmail)
                    setEmail(leadEmail);

                setIsCheckingAuth(false);
            }
        };

        checkUser();
    }, [router, supabase.auth, redirectPath]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error)
                throw error;

            // Redirect to specified path or dashboard after successful login
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                router.push('/dashboard');
            }

        } catch (error) {
            // Translate common Supabase auth error messages
            let errorMessage = 'An error occurred while logging in, please try again';

            if (error instanceof Error) {
                // Map known error messages
                const errorTranslations: Record<string, string> = {
                    'Invalid login credentials': 'Invalid login credentials',
                    'Email not confirmed': 'Email not confirmed, please check your email for confirmation',
                    'Invalid email or password': 'Invalid email or password',
                    'User not found': 'User not found',
                    'Email rate limit exceeded': 'Too many attempts, please try again later',
                    'Password recovery email not sent': 'Password recovery email not sent',
                    'Rate limit exceeded': 'Too many attempts, please try again later',
                    'Server error': 'Server error, please try again'
                };

                // Use translation if available, otherwise use generic error
                errorMessage = errorTranslations[error.message] || `${errorMessage}: ${error.message}`;
            }

            setError(errorMessage);

            if (errorMessage !== 'Invalid email or password' && errorMessage !== 'Invalid login credentials' && errorMessage !== 'Failed to fetch')
                sendClientErrorEmail('Error signing in:', error);

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
                                <Lock className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Sign In
                            </h1>
                            <p className="text-gray-300">
                                Welcome back! Please sign in to your account
                            </p>
                            {/* Back button */}
                            <Link
                                href="/"
                                className="inline-flex mt-2 items-center w-full text-center justify-center text-indigo-400 hover:text-indigo-300 transition-colors mb-8"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                <span>Back to home</span>
                            </Link>
                        </div>

                        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
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

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
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
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <div className="text-center space-y-4">
                                    <Link
                                        href="/forgot-password"
                                        className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot your password?
                                    </Link>

                                    <p className="text-gray-500 text-xs pt-2">
                                        If you're having trouble logging in, please contact us at{' '}
                                        <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
                                            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                        </a>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
} 