'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GradientBackground from '@repo/ui/components/GradientBackground';
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
            setError('Lozinka mora imati najmanje 6 znakova');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Lozinke se ne podudaraju');
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
                errorMessage = 'Link za resetiranje lozinke je istekao. Molimo zatražite novi link.';
            else if (errorMessage.includes('Password should be at least'))
                errorMessage = 'Lozinka mora imati najmanje 6 znakova';
            else if (errorMessage.includes('Auth session missing'))
                errorMessage = 'Sesija je istekla. Molimo zatražite novi link za resetiranje lozinke.';
            else if (errorMessage.includes('New password should be different from the old password'))
                errorMessage = 'Nova lozinka mora biti različita od trenutne lozinke.';
            else
                sendClientErrorEmail('Error resetting password:', error);

            setError(errorMessage);

        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen relative bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-green-100/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                Lozinka uspješno promijenjena!
                            </h1>
                            <p className="text-[#4b2c5e]/80 mb-6">
                                Vaša lozinka je uspješno postavljena. Sada se možete prijaviti s novom lozinkom.
                            </p>

                            <Link
                                href="/login"
                                className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                            >
                                Prijavite se
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="min-h-screen relative bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-red-100/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-8 h-8 text-red-800" />
                            </div>
                            <h1 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                Nevažeći link
                            </h1>
                            <p className="text-[#4b2c5e]/80">
                                Ovaj link za resetiranje lozinke je istekao ili je nevažeći.
                                Molimo zatražite novi link.
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-[#6B498F] hover:text-[#4b2c5e] transition-colors"
                            >
                                Zatražite novi link za resetiranje
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />
            <div className="container mx-auto px-4 py-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-md mx-auto"
                >
                    <div className="text-center mb-8">
                        <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-[#6B498F]" />
                        </div>
                        <h1 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                            Postavite novu lozinku
                        </h1>
                        <p className="text-[#4b2c5e]/80">
                            Molimo unesite svoju novu lozinku
                        </p>
                    </div>

                    <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                    Nova lozinka
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B498F]/70" />
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/70 border border-[#E1CCEB] rounded-lg text-[#4b2c5e]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                    Potvrdite novu lozinku
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B498F]/70" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/70 border border-[#E1CCEB] rounded-lg text-[#4b2c5e]"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-100/50 border border-red-300 rounded-lg p-4">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Postavljanje...' : 'Postavite novu lozinku'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 