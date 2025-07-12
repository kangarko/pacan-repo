'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Book, User as UserIcon, BookOpen, LogOut, Settings, Download, CreditCard, Receipt, Save, AlertCircle, Gift, Check, ShoppingCart, GraduationCap } from 'lucide-react';
import GradientBackground from '@repo/ui/components/GradientBackground';
import { Offer, OfferWithOwnership, Tracking, UserContextData } from '@repo/ui/lib/types';
import { fetchJsonPost, formatCurrency, formatDate } from '@repo/ui/lib/utils';
import { User } from '@supabase/supabase-js';
import { retrieveData, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { createSupabaseClient } from '@repo/ui/lib/clientUtils';
import { hasOffer } from '@repo/ui/lib/utils';

// TODO
const PRIMARY_OFFER_SLUG = 'stilovi-privrzenosti';
const SECONDARY_OFFER_SLUG = 'vodic-za-produbljivanje-veza';
const COURSE_OFFER_SLUG = 'srce-na-sigurnom';

let offersFromApi: Map<string, OfferWithOwnership> = new Map();

const getOffer = (slug: string): Offer => {
    const offer = offersFromApi.get(slug);

    if (!offer)
        throw new Error(`Offer name not found for slug: ${slug}`);

    return offer;
};

const TransactionsPanel = ({ transactions, loading }: { transactions: Tracking[], loading: boolean }) => {
    if (loading)
        return (
            <div className="text-center py-10 text-white">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-400">Učitavanje povijesti kupovina...</p>
            </div>
        );

    if (transactions.length === 0)
        return (
            <div className="text-center py-10">
                <div className="bg-[#E1CCEB]/20 rounded-lg p-8 max-w-md mx-auto border border-[#D4B5A0]/30">
                    <AlertCircle className="w-12 h-12 text-[#6B498F] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-[#4b2c5e]">Nema transakcija</h3>
                    <p className="text-[#4b2c5e]/80">
                        Niste još napravili nijednu kupovinu. Kada kupite nešto, ovdje će se prikazati povijest Vaših transakcija.
                    </p>
                </div>
            </div>
        );

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => (
                <div key={transaction.metadata.payment_id} className="transaction-item bg-[#FFEAFF]/50 rounded-xl p-5 hover:bg-[#E1CCEB]/30 transition-colors border border-[#E1CCEB]/50 overflow-hidden">
                    {/* Mobile layout - elements stacked vertically */}
                    <div className="flex flex-col sm:hidden space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-[#E1CCEB]/40 p-2 text-[#6B498F]">
                                {transaction.metadata.payment_method === 'stripe' ? (
                                    <CreditCard className="w-5 h-5" />
                                ) : transaction.metadata.payment_method === 'paypal' ? (
                                    <Image
                                        src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg"
                                        alt="PayPal"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                ) : (
                                    <CreditCard className="w-5 h-5" />
                                )}
                            </div>
                            <h3 className="font-semibold text-lg text-[#4b2c5e]">{getOffer(transaction.metadata.primary_offer_slug!).name}</h3>
                            {transaction.metadata.secondary_offer_slug && (
                                <h3 className="font-semibold text-lg text-[#4b2c5e]">{getOffer(transaction.metadata.secondary_offer_slug!).name}</h3>
                            )}
                        </div>

                        <div className="bg-[#E1CCEB]/50 px-4 py-2 rounded-lg text-[#6B498F] text-lg self-start font-semibold">
                            {formatCurrency(transaction.metadata.value!, transaction.metadata.currency!)}
                        </div>

                        <div className="text-sm text-gray-500">
                            {formatDate(new Date(transaction.date))}
                        </div>

                        <div className="pt-3 border-t border-[#E1CCEB] flex flex-col space-y-2">
                            <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${transaction.metadata.payment_status === 'succeeded' ? 'bg-green-500' :
                                    transaction.metadata.payment_status === 'refunded' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}></div>
                                <span className="capitalize text-[#4b2c5e]/80">
                                    {transaction.metadata.payment_status === 'succeeded' ? 'Uspješno' :
                                        transaction.metadata.payment_status === 'refunded' ? 'Refundirano' : 'Neznana'}
                                    {' • '}
                                    {transaction.metadata.payment_method === 'stripe' ? 'Kartica' :
                                        transaction.metadata.payment_method === 'paypal' ? 'PayPal' : 'Ostalo'}
                                </span>
                            </div>

                            <div className="text-xs text-gray-500 break-all">
                                ID: {transaction.metadata.payment_id}
                            </div>
                        </div>
                    </div>

                    {/* Desktop layout - horizontal with columns */}
                    <div className="hidden sm:block">
                        <div className="flex flex-wrap justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-full bg-[#E1CCEB]/40 p-2 text-[#6B498F]">
                                    {transaction.metadata.payment_method === 'stripe' ? (
                                        <CreditCard className="w-5 h-5" />
                                    ) : transaction.metadata.payment_method === 'paypal' ? (
                                        <Image
                                            src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg"
                                            alt="PayPal"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                        />
                                    ) : (
                                        <CreditCard className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-[#4b2c5e]">{getOffer(transaction.metadata.primary_offer_slug!).name}</h3>
                                    {transaction.metadata.secondary_offer_slug && (
                                        <h3 className="font-semibold text-lg text-[#4b2c5e]">{getOffer(transaction.metadata.secondary_offer_slug!).name}</h3>
                                    )}
                                    <div className="text-sm text-gray-500">
                                        {formatDate(new Date(transaction.date))}
                                    </div>
                                </div>
                            </div>

                            <div className="font-semibold bg-[#E1CCEB]/50 px-4 py-2 rounded-lg text-[#6B498F] text-lg flex items-center">
                                {formatCurrency(transaction.metadata.value!, transaction.metadata.currency!)}
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-[#E1CCEB]">
                            <div className="text-gray-500">
                                ID: {transaction.metadata.payment_id}
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${transaction.metadata.payment_status === 'succeeded' ? 'bg-green-500' :
                                        transaction.metadata.payment_status === 'refunded' ? 'bg-amber-500' : 'bg-red-500'
                                        }`}></div>
                                    <span className="capitalize text-[#4b2c5e]/80">
                                        {transaction.metadata.payment_status === 'succeeded' ? 'Uspješno' :
                                            transaction.metadata.payment_status === 'refunded' ? 'Refundirano' :
                                                transaction.metadata.payment_status === 'failed' ? 'Neuspješno' : 'Na čekanju'}
                                        {' • '}
                                        {transaction.metadata.payment_method === 'stripe' ? 'Kartica' :
                                            transaction.metadata.payment_method === 'paypal' ? 'PayPal' : 'Ostalo'}
                                    </span>
                                </div>
                            </div>
                        </div>
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

    const [activeTab, setActiveTab] = useState<string>('book');
    const [settingsData, setSettingsData] = useState({
        name: '',
        email: '',
        region: '',
        newPassword: '',
        passwordConfirm: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Use useMemo to check if user owns specific products
    const ownsPrimaryOffer = useMemo(() => hasOffer(userContext?.transactions || [], user?.email || '', PRIMARY_OFFER_SLUG), [userContext?.transactions, user?.email]);
    const ownsSecondaryOffer = useMemo(() => hasOffer(userContext?.transactions || [], user?.email || '', SECONDARY_OFFER_SLUG), [userContext?.transactions, user?.email]);
    const ownsCourseOffer = useMemo(() => hasOffer(userContext?.transactions || [], user?.email || '', COURSE_OFFER_SLUG), [userContext?.transactions, user?.email]);

    // Wrap loadDashboardData in useCallback to prevent recreating on every render
    const loadDashboardData = useCallback(async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');

            return;
        }

        const data = await retrieveData(true);

        if (!data.isAdmin) {
            const formSubmitted = await fetchJsonPost('/api/form/submitted', {
                form_slug: 'onboarding'
            });

            if (!formSubmitted.submitted && (user.user_metadata?.role !== 'admin' && user.user_metadata?.role !== 'marketer')) {
                router.push('/onboarding');

                return;
            }
        }

        setUserContext(data);
        setUser(user);

        offersFromApi = new Map(data.offers.map(offer => [offer.slug, offer]));

        setSettingsData({
            name: user.user_metadata?.name || user.user_metadata?.display_name || '',
            email: user.email || '',
            region: user.user_metadata?.region || '',
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
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();

            router.push('/login');
        } catch (error) {
            sendClientErrorEmail('Error signing out:', error);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            // If there's a new password, update it
            if (settingsData.newPassword) {

                // Check if passwords match
                if (settingsData.newPassword !== settingsData.passwordConfirm) {
                    setSaveError('Lozinke se ne podudaraju. Molimo pokušajte ponovno.');
                    setIsSaving(false);

                    return;
                }

                if (settingsData.newPassword.length < 6) {
                    setSaveError('Lozinka mora biti najmanje 6 znakova. Molimo pokušajte ponovno.');
                    setIsSaving(false);

                    return;
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: settingsData.newPassword,
                });

                if (passwordError) {
                    throw passwordError;
                }
            }

            // Update user metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    name: settingsData.name,
                    display_name: settingsData.name,
                    region: settingsData.region,
                }
            });

            if (error) {
                throw error;
            }

            // Update the user state with new metadata
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) {
                setUser(updatedUser);
            }

            // Show success message and reset form
            setSaveSuccess(true);
            setIsSaving(false);

            // Clear the password field after successful update
            setSettingsData(prev => ({
                ...prev,
                newPassword: '',
                passwordConfirm: ''
            }));

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('should be different from the old password'))
                    setSaveError('Nova lozinka mora biti različita od trenutne lozinke. Molimo odaberite drugu lozinku.');

                else {
                    sendClientErrorEmail('Error updating user settings:', error);

                    setSaveError(error.message);
                }

            } else {
                sendClientErrorEmail('Error updating user settings:', error);

                setSaveError('Došlo je do greške prilikom spremanja postavki');
            }

        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 to-purple-900 relative">
                <GradientBackground />
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'book':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#4b2c5e]">
                            <Book className="w-6 h-6 text-[#6B498F]" />
                            Moje knjige
                        </h2>

                        {loading ? (
                            <div className="bg-[#FFEAFF]/30 p-8 rounded-xl border border-[#E1CCEB]/30 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#6B498F] animate-spin"></div>
                                    <p className="text-[#4b2c5e]/80 text-sm">Učitavanje sadržaja...</p>
                                </div>
                            </div>
                        ) : ownsPrimaryOffer ? (
                            <div className="bg-gradient-to-br from-[#E1CCEB]/20 to-[#FFEAFF]/40 rounded-xl overflow-hidden border border-[#D4B5A0]/30">
                                <div className="p-6 relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B498F]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F1BBB0]/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                                    <div className="flex flex-col md:flex-row items-center gap-8 relative">
                                        <div className="w-36 h-52 flex-shrink-0 relative bg-gradient-to-b from-[#6B498F]/30 to-[#4b2c5e]/30 rounded-lg overflow-hidden shadow-xl border border-[#D4B5A0]/20">
                                            <Image
                                                src="/img/offer/Stilovi-privrzenosti.webp"
                                                alt="Stilovi privrženosti - Knjiga"
                                                fill
                                                sizes="(max-width: 768px) 100vw, 144px"
                                                style={{ objectFit: 'cover' }}
                                                className="rounded-lg"
                                            />
                                        </div>

                                        <div className="flex-grow">
                                            <div className="inline-block px-3 py-1 bg-[#6B498F]/20 rounded-full text-[#6B498F] text-xs font-medium mb-2">
                                                Digitalno izdanje
                                            </div>

                                            <h3 className="text-2xl font-semibold mb-2 text-[#4b2c5e]">{getOffer(PRIMARY_OFFER_SLUG).name}</h3>

                                            <p className="text-[#4b2c5e]/80 mb-6 max-w-2xl">
                                                {getOffer(PRIMARY_OFFER_SLUG).description}
                                            </p>

                                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                <a
                                                    href={getOffer(PRIMARY_OFFER_SLUG).file_path}
                                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg w-full"
                                                >
                                                    <BookOpen className="w-5 h-5" />
                                                    <span className="font-medium">Preuzmi PDF</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#E1CCEB]/20 p-8 rounded-xl border border-[#D4B5A0]/30 text-center">
                                <h3 className="text-xl text-[#4b2c5e] font-semibold mb-4">Nemate pristup knjizi</h3>
                                <p className="text-[#4b2c5e]/80 mb-4">Kupite knjigu da biste dobili pristup digitalnom izdanju.</p>
                                <Link
                                    href="/#order-form"
                                    className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Kupi knjigu
                                </Link>
                            </div>
                        )}

                        <div className="mt-8">
                            <h3 className="text-xl font-semibold text-[#4b2c5e] mb-4 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-yellow-500" />
                                Dodatni materijali
                            </h3>

                            {/* First show loader while fetching data, then show appropriate component */}
                            {loading ? (
                                <div className="bg-[#FFEAFF]/30 p-5 rounded-xl border border-[#E1CCEB]/30 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-yellow-500 animate-spin"></div>
                                        <p className="text-[#4b2c5e]/80 text-sm">Učitavanje sadržaja...</p>
                                    </div>
                                </div>
                            ) : ownsSecondaryOffer ? (
                                <div className="bg-[#FFEAFF]/30 p-6 rounded-xl border border-[#D4B5A0]/30 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F1BBB0] to-[#D4B5A0]"></div>
                                    <div className="absolute -right-32 -bottom-32 w-64 h-64 bg-[#F1BBB0]/10 rounded-full blur-3xl"></div>

                                    <div className="flex flex-col md:flex-row items-start gap-6">
                                        <div className="w-full md:flex-1">
                                            <h3 className="text-2xl font-semibold text-[#4b2c5e] mb-2">
                                                {getOffer(SECONDARY_OFFER_SLUG).name}
                                            </h3>
                                            <div className="inline-block px-3 py-1 bg-[#F1BBB0]/30 rounded-full text-[#4b2c5e] text-xs font-medium mb-3">
                                                Bonus Materijal
                                            </div>
                                            <p className="text-[#4b2c5e]/80 mb-4 md:pr-6">
                                                {getOffer(SECONDARY_OFFER_SLUG).description}
                                            </p>
                                        </div>

                                        <div className="w-full md:w-auto md:min-w-[240px] md:max-w-[280px] bg-[#F1BBB0]/20 p-5 rounded-xl border border-[#D4B5A0]/20 flex flex-col items-center justify-center">
                                            <div className="text-center mb-4">
                                                <div className="w-16 h-16 mx-auto mb-2 bg-[#F1BBB0]/30 rounded-full flex items-center justify-center">
                                                    <Download className="w-8 h-8 text-[#4b2c5e]" />
                                                </div>
                                                <p className="text-[#4b2c5e] text-sm">Vaš bonus materijal je spreman</p>
                                            </div>

                                            <a
                                                href={getOffer(SECONDARY_OFFER_SLUG).file_path}
                                                className="bg-[#D4B5A0] hover:bg-[#c8a994] text-[#4b2c5e] px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors w-full"
                                            >
                                                <Download className="w-5 h-5" />
                                                <span>Preuzmi PDF</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#FFEAFF]/20 p-6 rounded-xl border border-[#E1CCEB]/30 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row gap-0 md:gap-8">
                                        <div className="md:w-7/12">
                                            <h3 className="text-2xl font-semibold mb-4 text-[#4b2c5e]">
                                                <span className="text-[#6B498F]">Predstavljamo</span>: {getOffer(SECONDARY_OFFER_SLUG).name}
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4 mb-4 md:mb-0">
                                                <div className="bg-[#FFEAFF]/30 rounded-lg p-4 border border-[#E1CCEB]/20">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#E1CCEB]/50 border border-[#D4B5A0]/30 flex items-center justify-center flex-shrink-0">
                                                            <Check className="w-4 h-4 text-[#6B498F]" />
                                                        </div>
                                                        <h4 className="font-semibold text-[#6B498F]">Tehnike za krize</h4>
                                                    </div>
                                                    <p className="text-[#4b2c5e]/80 text-sm">Brze tehnike za smirivanje i upravljanje teškim emocionalnim trenucima u vezama.</p>
                                                </div>
                                                <div className="bg-[#FFEAFF]/30 rounded-lg p-4 border border-[#E1CCEB]/20">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-[#E1CCEB]/50 border border-[#D4B5A0]/30 flex items-center justify-center flex-shrink-0">
                                                            <Check className="w-4 h-4 text-[#6B498F]" />
                                                        </div>
                                                        <h4 className="font-semibold text-[#6B498F]">Oporavak nakon prekida</h4>
                                                    </div>
                                                    <p className="text-[#4b2c5e]/80 text-sm">Strategije za emocionalno odvajanje i iscjeljenje nakon prekida veze, prilagođene Vašem stilu privrženosti.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:w-5/14 bg-[#FFEAFF]/30 rounded-xl border border-[#E1CCEB]/20 p-6 flex flex-col justify-center relative overflow-hidden">
                                            {/* Polygonal background */}
                                            <div className="absolute inset-0 z-0 opacity-2">
                                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    <polygon fill="#D4B5A0" points="0,0 30,0 15,20 0,20" />
                                                    <polygon fill="#D4B5A0" points="70,0 100,0 100,20 85,20" />
                                                    <polygon fill="#D4B5A0" points="0,40 15,40 0,60" />
                                                    <polygon fill="#D4B5A0" points="85,40 100,40 100,60" />
                                                    <polygon fill="#D4B5A0" points="0,80 0,100 30,100 15,80" />
                                                    <polygon fill="#D4B5A0" points="70,80 85,100 100,100 100,80" />
                                                </svg>
                                            </div>

                                            {/* Decorative element */}
                                            <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#F1BBB0]/10 rounded-full blur-xl"></div>
                                            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#F1BBB0]/10 rounded-full blur-xl"></div>

                                            {/* Content */}
                                            <div className="relative z-10">
                                                <h4 className="font-semibold text-xl text-[#4b2c5e] mb-3 text-center">Nadogradite svoje iskustvo</h4>
                                                <p className="text-[#4b2c5e]/80 text-sm mb-6 text-center">
                                                    Dodajte praktični vodič za upravljanje krizama i oporavak nakon prekida veze prilagođen Vašem stilu privrženosti.
                                                </p>
                                                <Link
                                                    href="knjiga/?mobile-hide-topbar=true#order-form"
                                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-4 rounded-lg font-semibold text-center transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group"
                                                >
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#D4B5A0]/0 via-[#D4B5A0]/10 to-[#D4B5A0]/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                                    <ShoppingCart className="w-5 h-5" />
                                                    <span>Kupi sada</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 'transactions':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#4b2c5e]">
                            <Receipt className="w-6 h-6 text-[#6B498F]" />
                            Povijest kupovina
                        </h2>
                        <TransactionsPanel
                            transactions={userContext?.transactions || []}
                            loading={loading}
                        />
                    </>
                );
            case 'courses':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#4b2c5e]">
                            <GraduationCap className="w-6 h-6 text-[#6B498F]" />
                            Moji tečajevi
                        </h2>

                        {loading ? (
                            <div className="bg-[#FFEAFF]/30 p-8 rounded-xl border border-[#E1CCEB]/30 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#6B498F] animate-spin"></div>
                                    <p className="text-[#4b2c5e]/80 text-sm">Učitavanje sadržaja...</p>
                                </div>
                            </div>
                        ) : ownsCourseOffer ? (
                            <div className="bg-gradient-to-br from-[#E1CCEB]/20 to-[#FFEAFF]/40 rounded-xl overflow-hidden">
                                <div className="p-6 relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B498F]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F1BBB0]/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                                    <div className="flex flex-col md:flex-row items-center gap-8 relative">
                                        <div className="w-36 h-36 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                            {getOffer(COURSE_OFFER_SLUG).thumbnail_url ? (
                                                <Image
                                                    src={getOffer(COURSE_OFFER_SLUG).thumbnail_url!}
                                                    alt={getOffer(COURSE_OFFER_SLUG).name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 144px"
                                                    style={{ objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <GraduationCap className="w-20 h-20 text-[#6B498F]" />
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            <div className="inline-block px-3 py-1 bg-[#6B498F]/20 rounded-full text-[#6B498F] text-xs font-medium mb-2">
                                                Online tečaj
                                            </div>

                                            <h3 className="text-2xl font-semibold mb-2 text-[#4b2c5e]">{getOffer(COURSE_OFFER_SLUG).name}</h3>

                                            <p className="text-[#4b2c5e]/80 mb-6 max-w-2xl">
                                                {getOffer(COURSE_OFFER_SLUG).description}
                                            </p>

                                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                <a
                                                    href={getOffer(COURSE_OFFER_SLUG).file_path || '#'}
                                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg w-full"
                                                >
                                                    <GraduationCap className="w-5 h-5" />
                                                    <span className="font-medium">Započni tečaj</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#E1CCEB]/20 p-8 rounded-xl border border-[#D4B5A0]/30 text-center">
                                <h3 className="text-xl text-[#4b2c5e] font-semibold">Nemate pristup tečaju</h3>
                            </div>
                        )}
                    </>
                );
            case 'account':
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#4b2c5e]">
                            <UserIcon className="w-6 h-6 text-[#6B498F]" />
                            Postavke računa
                        </h2>

                        <div className="bg-[#FFEAFF]/30 rounded-xl overflow-hidden border border-[#E1CCEB]/30 mb-6">
                            <div className="border-b border-[#E1CCEB]/30 px-6 py-4 bg-[#E1CCEB]/20">
                                <h3 className="font-semibold text-[#4b2c5e]">Osobni podaci</h3>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSettingsSubmit}>
                                    {saveError && (
                                        <div className="bg-red-200/50 border border-red-300 rounded-md p-4 flex mb-6">
                                            <AlertCircle className="h-5 w-5 text-red-700 mr-3 flex-shrink-0" />
                                            <p className="text-sm text-red-800">{saveError}</p>
                                        </div>
                                    )}

                                    {saveSuccess && (
                                        <div className="bg-green-100/50 border border-green-300 rounded-md p-4 mb-6">
                                            <p className="text-sm text-green-800 flex items-center">
                                                <Check className="h-4 w-4 mr-2" />
                                                Postavke su uspješno spremljene!
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                                                Ime
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={settingsData.name}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-white/70 border border-[#E1CCEB] rounded-lg p-3 text-[#4b2c5e] focus:outline-none focus:ring-2 focus:ring-[#6B498F]"
                                                disabled={isSaving}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                                                E-mail
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={settingsData.email}
                                                className="w-full bg-[#E1CCEB]/30 border border-[#E1CCEB]/30 rounded-lg p-3 text-[#4b2c5e]/70 cursor-not-allowed"
                                                disabled={true}
                                                readOnly
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Za promjenu e-mail adrese kontaktirajte nas na {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                                                Nova lozinka
                                            </label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={settingsData.newPassword}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-white/70 border border-[#E1CCEB] rounded-lg p-3 text-[#4b2c5e] focus:outline-none focus:ring-2 focus:ring-[#6B498F]"
                                                disabled={isSaving}
                                                placeholder="Ostavite prazno ako ne želite promijeniti"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-[#4b2c5e]/80 mb-1">
                                                Potvrdite lozinku
                                            </label>
                                            <input
                                                type="password"
                                                id="passwordConfirm"
                                                name="passwordConfirm"
                                                value={settingsData.passwordConfirm}
                                                onChange={handleSettingsChange}
                                                className="w-full bg-white/70 border border-[#E1CCEB] rounded-lg p-3 text-[#4b2c5e] focus:outline-none focus:ring-2 focus:ring-[#6B498F]"
                                                disabled={isSaving}
                                                placeholder="Ponovite novu lozinku"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#6B498F] hover:bg-[#4b2c5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B498F] disabled:opacity-50"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="mr-2">Spremanje...</span>
                                                    <div className="h-4 w-4 border-2 border-t-[#4b2c5e] border-white rounded-full animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Spremi promjene
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/30 rounded-xl overflow-hidden border border-[#E1CCEB]/30 mt-6">
                            <div className="border-b border-[#E1CCEB]/30 px-6 py-4 bg-[#E1CCEB]/20">
                                <h3 className="font-semibold text-[#4b2c5e]">Informacije o računu</h3>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-sm text-[#4b2c5e]/80 mb-1">Datum registracije</div>
                                        <div className="font-medium bg-[#E1CCEB]/30 p-3 rounded-lg border border-[#D4B5A0]/20 text-[#4b2c5e]">
                                            {user?.created_at ? formatDate(new Date(user.created_at)) : 'Nepoznato'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );
            default:
                return <div className="text-white">Odaberite opciju iz izbornika</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 relative">
            <GradientBackground />
            <div className="container mx-auto px-0 sm:px-4 pt-0 sm:py-10">
                <div className="bg-[#FFF9E9]/20 border border-[#E1CCEB]/50 backdrop-blur-lg sm:rounded-2xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-60 flex-shrink-0 border-r border-[#D4B5A0]/20 bg-[#FFEAFF] text-[#4b2c5e]">
                            <div className="p-4 flex flex-col h-full">
                                <div className="mb-8 text-center hidden md:block">
                                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-[#E1CCEB] text-[#6B498F] mb-2">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <h2 className="font-semibold text-[#4b2c5e] text-lg mb-1 truncate">
                                        {user?.user_metadata?.name || user?.email}
                                    </h2>
                                    <p className="text-[#6B498F] text-sm truncate">
                                        {user?.email}
                                    </p>
                                </div>

                                <nav className="flex md:flex-col md:space-y-2 justify-around md:justify-start">
                                    <button
                                        onClick={() => setActiveTab('book')}
                                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'book'
                                            ? 'bg-[#6B498F] text-white'
                                            : 'text-[#4b2c5e] hover:text-[#6B498F] hover:bg-[#E1CCEB]/50'
                                            }`}
                                    >
                                        <Book className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Knjige</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('courses')}
                                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'courses'
                                            ? 'bg-[#6B498F] text-white'
                                            : 'text-[#4b2c5e] hover:text-[#6B498F] hover:bg-[#E1CCEB]/50'
                                            }`}
                                    >
                                        <GraduationCap className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Tečajevi</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'transactions'
                                            ? 'bg-[#6B498F] text-white'
                                            : 'text-[#4b2c5e] hover:text-[#6B498F] hover:bg-[#E1CCEB]/50'
                                            }`}
                                    >
                                        <Receipt className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Kupovine</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('account')}
                                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-3 rounded-xl transition-colors ${activeTab === 'account'
                                            ? 'bg-[#6B498F] text-white'
                                            : 'text-[#4b2c5e] hover:text-[#6B498F] hover:bg-[#E1CCEB]/50'
                                            }`}
                                    >
                                        <Settings className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Postavke</span>
                                    </button>

                                    {(user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'marketer') && (
                                        <button
                                            onClick={() => router.push('/admin')}
                                            className="flex flex-col md:flex-row items-center justify-center md:justify-start p-3 text-[#4b2c5e] hover:text-[#6B498F] hover:bg-[#E1CCEB]/50 rounded-xl transition-colors"
                                        >
                                            <UserIcon className="h-5 w-5" />
                                            <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Admin Panel</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="flex flex-col md:flex-row items-center justify-center md:justify-start p-3 text-[#4b2c5e] hover:bg-red-100 rounded-xl transition-colors md:mt-auto"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="text-xs mt-1 md:text-base md:mt-0 md:ml-3">Odjava</span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <div className="flex-1 p-6 bg-[#FFF9E9] min-w-0">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 