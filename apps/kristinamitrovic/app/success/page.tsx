'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Lock, AlertCircle } from 'lucide-react';
import GradientBackground from '@repo/ui/components/GradientBackground';
import Link from 'next/link';
import { createSupabaseClient, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { ensureError, fetchJsonPost } from '@repo/ui/lib/utils';
import { useSokolSession } from '@repo/ui/components/SokolSessionHandler';

interface OrderData {
    name: string;
    email: string;
    region: string;
    stripe_customer_id?: string;
    has_account: boolean;
    refunded: boolean;
}

export default function SuccessPage() {
    const sokolData = useSokolSession();
    const [error, setError] = useState('');

    const [isLoggedIn] = useState(false);
    const [createdAccount, setCreatedAccount] = useState(false);

    const [orderData, setOrderData] = useState<OrderData | null>(null);

    useEffect(() => {
        if (!sokolData)
            return;

        if (!orderData) {
            (async () => {
                const urlParams = new URLSearchParams(window.location.search);
                const paymentId = urlParams.get('payment_id') || urlParams.get('payment_intent');

                if (paymentId)
                    try {
                        const data = await fetchJsonPost(`/api/auth/verify-payment`, {
                            payment_id: paymentId,
                            user_id: sokolData?.user_id
                        });

                        if (!data.name || !data.email || !data.region || data.has_account === undefined || data.refunded === undefined)
                            throw new Error('Missing required fields in data: ' + JSON.stringify(data));

                        if (data.refunded) {
                            setError(`Vaša uplata je povraćena. Ne možete kreirati novi račun. Ako mislite da je ovo greška, kontaktirajte nas na ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.`);

                            return;
                        }

                        console.log('Processing emails');
                        const result = await fetchJsonPost('/api/email/process_pending', {});
                        console.log('Emails processed: ' + result.processed);

                        setOrderData(data);
                    } catch (error) {
                        setError(`Došlo je do pogreške prilikom provjere Vaše uplate. Molimo osvježite stranicu i pokušajte ponovno. Ako se problem nastavi, kontaktirajte nas na ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} s opisom pogreške: ` + ensureError(error, 'Nepoznata pogreška').message);
                        sendClientErrorEmail('[client/success] Error verifying payment with id: ' + paymentId, error);
                    }

                else {
                    setError('Nema informacija o plaćanju.');
                }
            })();
        }
    }, [orderData, sokolData]);

    if (error) {
        return (
            <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />
                <div className="text-center relative z-10">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link href="/" className="text-purple-400 hover:text-purple-300">
                        Povratak na početnu stranicu
                    </Link>
                </div>
            </div>
        );
    }

    if (!orderData) {
        return (
            <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />
                <div className="relative z-10 bg-[#FFF9E9]/70 backdrop-blur-xl overflow-hidden rounded-2xl border border-[#E1CCEB]/50 shadow-xl max-w-md w-full">
                    <div className="bg-red-200/20 w-full py-4 px-5 mb-6">
                        <div className="flex items-start gap-3 px-5">
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-800 mb-1">VAŽNO: Ne zatvarajte ovu stranicu!</p>
                                <p className="text-red-700">Zatvaranje stranice prije dovršetka obrade može uzrokovati probleme s pristupom Vašim materijalima.</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-10 pb-10">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-[#E1CCEB]/30 rounded-full flex items-center justify-center">
                                    <div className="w-20 h-20 absolute border-t-4 border-[#6B498F] rounded-full animate-spin"></div>
                                    <Loader2 className="w-10 h-10 text-[#6B498F] animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-[#4b2c5e]">Potvrđujemo Vašu uplatu</h3>
                                <p className="text-[#4b2c5e]/80 text-sm">Ne napuštajte ovu stranicu...</p>
                            </div>
                            <div className="w-full bg-[#E1CCEB]/30 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-[#6B498F] to-[#a074c7] h-full rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {!orderData.has_account && !createdAccount && (
                <div className="bg-[#fde68a] items-center justify-center px-4 py-4 flex gap-3">
                    <AlertCircle className="w-6 h-6 text-[#92400e] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-[#92400e] mb-1">VAŽNO: Ne zatvarajte ovu stranicu!</p>
                        <p className="text-[#92400e]/90">Morate dovršiti kreiranje računa kako biste dobili pristup Vašim materijalima.</p>
                    </div>
                </div>
            )}
            <div className="min-h-screen relative py-12 md:py-24 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="text-center mb-12">
                            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                Hvala na kupnji!
                            </h1>
                            <p className="text-xl text-[#4b2c5e]/80">
                                Vaša narudžba je potvrđena. Kreirajte svoj račun za pristup materijalima.
                            </p>
                        </div>
                        {!orderData.has_account && !createdAccount && (
                            <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 mb-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-[#E1CCEB]/40 p-3 rounded-lg">
                                        <Lock className="w-6 h-6 text-[#6B498F]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-[#4b2c5e]">Kreirajte svoj račun</h2>
                                        <p className="text-[#4b2c5e]/80">Postavite lozinku za pristup materijalima</p>
                                    </div>
                                </div>

                                <AccountSetupForm
                                    orderData={orderData}
                                    onSuccess={() => setCreatedAccount(true)}
                                />
                            </div>
                        )}
                        {(orderData.has_account || createdAccount) && (
                            <div className="text-center bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 mb-8">
                                <p className="text-[#4b2c5e] mb-6">
                                    {isLoggedIn ? 'Već ste prijavljeni! Možete pristupiti svojim materijalima u Vašoj biblioteci.' : 'Već imate račun! Možete se prijaviti kako biste pristupili svojim materijalima. Molimo koristite istu e-mail adresu za prijavu koju ste koristili za kupnju.'}
                                </p>
                                <a
                                    href={isLoggedIn ? "/dashboard" : "/login"}
                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-10 py-3 rounded-xl font-semibold transition-colors mb-6"
                                >
                                    {isLoggedIn ? "Idite na Dashboard →" : "Prijavite se →"}
                                </a>

                                <div className="bg-amber-100/50 rounded-lg p-4 text-sm mt-6 flex items-center gap-4 border border-amber-200">
                                    <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
                                    <p className="text-amber-800 text-left">
                                        Sljedeći put možete direktno posjetiti našu stranicu za prijavu.
                                        Spremite ovu poveznicu za brži pristup Vašim materijalima: <a href="/login" className="text-[#6B498F] hover:text-[#4b2c5e] font-medium">{process.env.NEXT_PUBLIC_BASE_URL}/login</a>
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="text-center text-[#4b2c5e] text-sm mt-4 bg-[#FFEAFF]/40 backdrop-blur-sm p-4 rounded-xl border border-[#E1CCEB]/50 shadow-md mx-auto">
                            <p>
                                Ako imate pitanja, kontaktirajte nas na{' '}
                                <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-[#6B498F] hover:text-[#4b2c5e]">
                                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                </a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

const AccountSetupForm = ({ orderData, onSuccess }: { orderData: OrderData; onSuccess: () => void; }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const supabase = createSupabaseClient();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (!orderData.name || orderData.name === '')
                throw new Error('Name is required');

            if (!orderData.email || orderData.email === '')
                throw new Error('Email is required');

            if (!orderData.region || orderData.region === '')
                throw new Error('Region is required');

            if (password.length < 6) {
                setError('Lozinka mora imati najmanje 6 znakova');

                return;
            }

            if (password !== confirmPassword) {
                setError('Lozinke se ne podudaraju');

                return;
            }

            setIsLoading(true);

            const result = await fetchJsonPost('/api/auth/setup-account', {
                email: orderData.email,
                name: orderData.name,
                password: password,
                region: orderData.region,
                stripe_customer_id: orderData.stripe_customer_id,
                auto_login: true
            });

            if (result.session) {

                // Store the session client-side
                await supabase.auth.setSession({
                    access_token: result.session.access_token,
                    refresh_token: result.session.refresh_token
                });

                // Show redirecting indicator
                setIsLoading(false);
                setIsRedirecting(true);

                // Call onSuccess to update parent state
                onSuccess();

                // Navigate to onboarding page immediately
                router.push('/onboarding');

            } else {
                // Just call onSuccess without redirecting
                onSuccess();
            }

        } catch (error: any) {
            if (error.message?.includes('stronger password'))
                setError('Molimo koristite jaču lozinku. Uključite brojeve, velika slova i posebne znakove.');

            else {
                setError(`Došlo je do greške. Molimo pokušajte ponovno. Ako se pogreška nastavi, kontaktirajte nas na ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} sljedećom porukom: ` + error);

                sendClientErrorEmail('Error creating account:', error);
            }

        } finally {
            if (!isRedirecting)
                setIsLoading(false);
        }
    };

    if (isRedirecting) {
        return (
            <div className="p-6 rounded-lg text-center">
                <div className="flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-10 h-10 text-[#6B498F] animate-spin" />
                </div>
                <p className="text-[#4b2c5e]/80 text-lg mb-2">Račun uspješno kreiran!</p>
                <p className="text-gray-500">Preusmjeravanje...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
                <div className="bg-[#E1CCEB]/30 rounded p-3 text-sm text-[#4b2c5e] flex items-start gap-2 border border-[#D4B5A0]/20">
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        <p>
                            Vaš račun biti će povezan s e-mail adresom: <strong>{orderData.email}</strong>
                        </p>
                        <p>
                            Nakon što kreirate račun, moći ćete se prijaviti putem ove poveznice: <a className="underline" href={`${process.env.NEXT_PUBLIC_BASE_URL}/login`} target="_blank" rel="noopener noreferrer">{process.env.NEXT_PUBLIC_BASE_URL}/login</a>
                        </p>
                    </span>
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                    Lozinka
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white/70 border border-[#E1CCEB] rounded-lg text-[#4b2c5e]"
                    placeholder="Unesite lozinku"
                    required
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                    Potvrdite lozinku
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white/70 border border-[#E1CCEB] rounded-lg text-[#4b2c5e]"
                    placeholder="Ponovite lozinku"
                    required
                />
            </div>

            {error && (
                <p className="text-red-800 text-sm">{error}</p>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Kreiranje računa...
                    </span>
                ) : (
                    'Kreiraj račun'
                )}
            </button>
        </form>
    );
};