'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@repo/ui/lib/clientUtils';
import { useRouter } from 'next/navigation';
import GradientBackground from '@repo/ui/components/GradientBackground';
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
            let errorMessage = 'Došlo je do greške prilikom slanja emaila za resetiranje lozinke.';
            let isKnownError = false;

            if (error instanceof Error) {
                const errorTranslations: Record<string, string> = {
                    'User not found': 'Korisnik s ovom email adresom nije pronađen',
                    'Email not confirmed': 'E-mail adresa nije potvrđena, provjerite svoj email za potvrdu',
                    'Rate limit exceeded': 'Previše pokušaja, pokušajte kasnije',
                    'Invalid email': 'Neispravna e-mail adresa',
                    'Email rate limit exceeded': 'Previše pokušaja, pokušajte kasnije',
                    'Server error': 'Greška na serveru'
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
        <div className="min-h-screen relative py-24 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />

            <div className="container mx-auto px-4 relative z-10">
                {isCheckingAuth ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6B498F]"></div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-[#6B498F]" />
                            </div>
                            <h1 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                Zaboravili ste lozinku?
                            </h1>
                            <p className="text-[#4b2c5e]/80">
                                Unesite email koji ste koristili pri kupnji knjige
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                            {success && !error ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-green-100/50 border border-green-300 rounded-lg p-4">
                                        <p className="text-green-800">
                                            Poslali smo Vam email s linkom za resetiranje lozinke.
                                            Molimo provjerite svoj inbox.
                                        </p>
                                    </div>
                                    <Link
                                        href="/login"
                                        className="block text-[#6B498F] hover:text-[#4b2c5e] transition-colors"
                                    >
                                        Povratak na prijavu
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B498F]/70" />
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                        {isLoading ? 'Slanje...' : 'Pošalji link za resetiranje'}
                                    </button>

                                    <div className="text-center">
                                        <Link
                                            href="/login"
                                            className="text-sm text-[#6B498F] hover:text-[#4b2c5e] transition-colors"
                                        >
                                            Povratak na prijavu
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