'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { motion } from 'framer-motion';
import { CreditCard, Clock, AlertCircle, Check, Gift, ArrowRight, Mail } from 'lucide-react';
import { fetchJsonPost, formatCurrency, formatFullPrice, getDiscountPercent, getPricing } from '@repo/ui/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { UserContextData } from '@repo/ui/lib/types';
import { sendClientErrorEmail, track } from '@repo/ui/lib/clientUtils';
import { Offer } from '@repo/ui/lib/types';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { getIconByName, DEFAULT_ICON } from '@repo/ui/lib/iconMapping';
import { formatDiscountedPriceForCurrentUser } from '@repo/ui/lib/clientUtils';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
    throw new Error('Missing Stripe or PayPal environment variables');

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const StripeCheckoutForm = ({ name, email, primaryOffer, secondaryOffer, totalAmount, currency }: { name: string; email: string; primaryOffer: Offer; secondaryOffer: Offer | null, totalAmount: number, currency: string }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [error, setError] = useState<string>();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements)
            return;

        setIsProcessing(true);

        track('buy_click', {
            payment_method: 'stripe',
            email: email,
            name: name,
            value: totalAmount,
            currency: currency,
            primary_offer_slug: primaryOffer.slug,
            secondary_offer_slug: secondaryOffer?.slug
        });

        const { error: submitError } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                payment_method_data: {
                    billing_details: {
                        name: name,
                        email: email,
                    },
                },
                return_url: `${window.location.origin}/success`,
            },
            redirect: 'always',
        });

        if (submitError) {
            setError(submitError.message);
            setIsProcessing(false);

            track('buy_decline', {
                payment_method: 'stripe',
                email: email,
                name: name,
                value: totalAmount,
                currency: currency,
                primary_offer_slug: primaryOffer.slug,
                secondary_offer_slug: secondaryOffer?.slug,
                error: submitError.code + "/" + submitError.type
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: {
                        type: 'tabs'
                    },
                    defaultValues: {
                        billingDetails: {
                            name,
                            email
                        }
                    },
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'ideal', 'bancontact', 'sepa_debit']
                }}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className={`w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform flex items-center justify-center gap-2 ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
                {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Plati karticom'}
            </button>
        </form>
    );
};

const FormInput = ({ id, label, value, onChange, type = "text", placeholder = "", disabled = false, autoCapitalize
}: {
    id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; disabled?: boolean; autoCapitalize?: string;
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
            {label}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2 bg-white/70 border border-[#E1CCEB] rounded-lg text-[#4b2c5e] ${disabled ? 'opacity-75' : ''}`}
            placeholder={placeholder}
            required={true}
            disabled={disabled}
            autoCapitalize={autoCapitalize}
        />
    </div>
);

const PaymentMethodSelector = ({ selectedMethod, onSelect }: { selectedMethod: string; onSelect: (method: string) => void; }) => (
    <div className="grid grid-cols-2 gap-4 mb-6">
        <button
            type="button"
            onClick={() => onSelect('stripe')}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${selectedMethod === 'stripe' ? 'border-[#6B498F] bg-[#E1CCEB]' : 'border-[#6B498F] bg-transparent hover:bg-[#FFEAFF]/50'}`}
        >
            <CreditCard className="w-5 h-5" />
            <span>Kartica</span>
        </button>
        <button
            type="button"
            onClick={() => onSelect('paypal')}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${selectedMethod === 'paypal' ? 'border-[#6B498F] bg-[#E1CCEB]' : 'border-[#6B498F] bg-transparent hover:bg-[#FFEAFF]/50'}`}
        >
            <Image
                src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg"
                alt="PayPal"
                width={20}
                height={20}
                className="w-5 h-5"
            />
            <span>PayPal</span>
        </button>
    </div>
);

const OrderBump = ({ userContext, checked, onChange, offer }: { userContext: UserContextData; checked: boolean; onChange: (checked: boolean) => void; offer: Offer }) => (
    <div className="border border-[#D4B5A0] bg-[#FFFFFF] rounded-xl p-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F1BBB0] to-[#D4B5A0]"></div>
        <div className="flex items-start gap-3">
            <div
                className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-[#F1BBB0] border-[#D4B5A0]' : 'border-[#D4B5A0] bg-transparent'
                    }`}
                onClick={() => onChange(!checked)}
            >
                {checked && <Check className="w-4 h-4 text-[#4b2c5e]" />}
            </div>
            <div className="flex-1 pb-1">
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <span className="relative inline-block flex-shrink-0">
                            <Gift className="w-4 h-4 animate-pulse text-[#4b2c5e]/70" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F1BBB0] rounded-full animate-ping"></span>
                        </span>
                        <span className="font-bold text-[#4b2c5e] tracking-wide text-sm sm:text-base">Vremenski ograničena ponuda</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <div>
                            <h4 className="text-[#4b2c5e] font-semibold mt-1">{offer.name}</h4>
                        </div>
                        <div className="bg-[#FFEAFF]/40 rounded-lg py-1.5 px-3 flex-shrink-0 border border-[#E1CCEB]/20 backdrop-blur-sm">
                            <p className="text-[#6B498F] font-bold whitespace-nowrap text-base sm:text-lg">
                                +{formatDiscountedPriceForCurrentUser(offer, userContext.region, "OrderBump 1")}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-3 text-sm text-[#4b2c5e]/90 space-y-2.5">
                    <p>
                        Dok knjiga pruža dubinsko razumijevanje, ovaj praktični džepni vodič nudi <span className="italic">trenutna rješenja i strategije</span> za upravljanje krizama i oporavak nakon prekida veze - prilagođeno Vašem stilu privrženosti.
                    </p>
                    <p>
                        Sadrži <span className="underline">brze tehnike za smirivanje</span>, konkretne korake za emocionalno odvajanje nakon prekida, i dugoročne strategije za iscjeljenje - sve u formatu koji je uvijek pri ruci kada Vam je najpotrebnije.
                    </p>
                    <p className="underline">
                        Dodajte ovaj esencijalni vodič za produbljivanje veza za samo {formatDiscountedPriceForCurrentUser(offer, userContext.region, "OrderBump 2")} i transformirte svoje emocionalne krize u prilike za rast!
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const OrderForm = ({ primaryOffer, secondaryOffer, userContext }: { primaryOffer: Offer; secondaryOffer: Offer | null; userContext: UserContextData | null; }) => {
    const [name, setName] = useState(Cookies.get('lead_name')?.trim() || '');
    const [email, setEmail] = useState(Cookies.get('lead_email')?.trim() || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string>('stripe');
    const [error, setError] = useState<string>();
    const [includeSecondaryOffer, setIncludeSecondaryOffer] = useState(false);
    const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>((15 * 60) - 1);

    const prevCurrentStepRef = useRef<number | undefined>(undefined);
    const prevIncludeSecondaryOfferRef = useRef<boolean | undefined>(undefined);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const ownsPrimaryOffer = userContext?.offers?.some((offer) =>
        primaryOffer && offer.slug === primaryOffer.slug && offer.is_owned
    ) || false;

    const ownsSecondaryOffer = userContext?.offers?.some((offer) =>
        secondaryOffer && offer.slug === secondaryOffer.slug && offer.is_owned
    ) || false;

    const isSecondaryOfferPrimary = useMemo(() => ownsPrimaryOffer && !ownsSecondaryOffer, [ownsPrimaryOffer, ownsSecondaryOffer]);

    const displayedOfferForHeading = useMemo(() => {
        if (isSecondaryOfferPrimary && secondaryOffer) {
            return secondaryOffer;
        }
        return primaryOffer;
    }, [isSecondaryOfferPrimary, secondaryOffer, primaryOffer]);

    const defaultHeadingText = useMemo(() => {
        if (isSecondaryOfferPrimary && secondaryOffer) {
            return 'Nadogradite svoje iskustvo';
        }
        return 'Naručite svoj primjerak danas';
    }, [isSecondaryOfferPrimary, secondaryOffer]);

    const orderFormTitle = useMemo(() => 
        displayedOfferForHeading?.metadata?.order_form_heading || defaultHeadingText,
    [displayedOfferForHeading, defaultHeadingText]);
    
    const defaultSubtitleText = useMemo(() => {
        if (isSecondaryOfferPrimary) {
            return '';
        }
        return 'Dobit ćete bonus poglavlje za regulaciju živčanog sustava';
    }, [isSecondaryOfferPrimary]);
    
    const orderFormSubtitle = useMemo(() => 
        displayedOfferForHeading?.metadata?.order_form_subtitle || defaultSubtitleText,
    [displayedOfferForHeading, defaultSubtitleText]);

    const getPrimaryOfferPricing = useCallback(() => {
        if (!primaryOffer || !userContext)
            return null;

        return getPricing(primaryOffer, userContext.region);
    }, [primaryOffer, userContext]);

    const getSecondaryOfferPricing = useCallback(() => {
        if (!secondaryOffer || !userContext)
            return null;

        return getPricing(secondaryOffer, userContext.region);
    }, [secondaryOffer, userContext]);

    const getCurrency = useCallback(() => {
        return getPrimaryOfferPricing()?.currency || '';
    }, [getPrimaryOfferPricing]);

    const getTotalAmount = useCallback(() => {
        const primaryOfferPrice = primaryOffer ? getPrimaryOfferPricing() : null;
        const secondaryOfferPrice = secondaryOffer ? getSecondaryOfferPricing() : null;

        if (primaryOfferPrice == null)
            return 0;

        let total = isSecondaryOfferPrimary && secondaryOfferPrice ? secondaryOfferPrice.discounted_price : primaryOfferPrice.discounted_price;

        if (includeSecondaryOffer && !isSecondaryOfferPrimary && secondaryOfferPrice)
            total += secondaryOfferPrice.discounted_price;

        return total;
    }, [isSecondaryOfferPrimary, includeSecondaryOffer, secondaryOffer, primaryOffer, getPrimaryOfferPricing, getSecondaryOfferPricing]);

    const getTotalEurAmount = useCallback(() => {
        const primaryOfferPrice = primaryOffer ? getPrimaryOfferPricing() : null;
        const secondaryOfferPrice = secondaryOffer ? getSecondaryOfferPricing() : null;

        if (primaryOfferPrice == null) 
            return 0;

        let total = isSecondaryOfferPrimary && secondaryOfferPrice ? secondaryOfferPrice.discounted_price_eur : primaryOfferPrice.discounted_price_eur;

        if (includeSecondaryOffer && !isSecondaryOfferPrimary && secondaryOfferPrice)
            total += secondaryOfferPrice.discounted_price_eur;

        return total ?? 0;
    }, [primaryOffer, includeSecondaryOffer, isSecondaryOfferPrimary, secondaryOffer, getPrimaryOfferPricing, getSecondaryOfferPricing]);

    const stripeOptions = useMemo(() => (clientSecret ? {
        clientSecret,
        locale: 'hr' as const,
        appearance: {
            theme: 'flat' as const,
            variables: {
                colorPrimary: '#6B498F',
                colorBackground: '#FFFFFF',
                colorText: '#4b2c5e',
                colorDanger: '#EF4444',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                colorTextPlaceholder: '#4b2c5e'
            },
            rules: {
                ".Input": {
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E1CCEB'
                },
                ".Label": { paddingBottom: '2px', color: '#4b2c5e' },
                ".AccordionItem": { backgroundColor: '#FFEAFF', border: '1px solid #E1CCEB' },
                ".TermsText": { fontSize: '1px', color: '#D4B5A0' }
            }
        },
    } : {}), [clientSecret]);

    const updatePaymentIntent = useCallback(async (name: string, email: string) => {
        if (!primaryOffer || !name || !email || !userContext)
            return;

        try {
            const body = {
                name: name.trim(),
                email: email.trim(),
                region: userContext.region,
                primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
            };

            console.log("Updating payment intent", body);

            const responseJson = await fetchJsonPost(`/api/stripe/create-intent`, {
                body: JSON.stringify(body)
            });

            if (!responseJson.clientSecret)
                throw new Error('Stripe create intent returning no client secret');

            setClientSecret(responseJson.clientSecret);

        } catch (err: unknown) {
            setError(`Greška prilikom obrade plaćanja, molimo pokušajte ponovno ili kontaktirajte ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}: ` + err);
            sendClientErrorEmail('Error updating payment intent:', err);
        }

    }, [includeSecondaryOffer, isSecondaryOfferPrimary, primaryOffer, secondaryOffer, userContext]);

    useEffect(() => {
        let isMounted = true;

        const handlePaymentIntentUpdate = async () => {
            if (name && email && isMounted) {
                try {
                    if (userContext?.isAuthenticated) {
                        const data = await fetchJsonPost('/api/stripe/has-payment-methods');

                        if (data.has_saved_methods == undefined)
                            throw new Error('Stripe has payment methods returning undefined');

                        setHasSavedPaymentMethods(data.has_saved_methods);

                        if (data.customer_id)
                            setCustomerId(data.customer_id);
                    }

                    await updatePaymentIntent(name, email);

                } catch (err: unknown) {
                    setError(`Greška prilikom obrade plaćanja, molimo pokušajte ponovno ili kontaktirajte ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}: ` + err);
                    sendClientErrorEmail('Error handling payment intent update:', err);

                } finally {
                    if (isMounted)
                        setIsSubmitting(false);
                }
            }
        };

        const stepJustChangedTo2 = prevCurrentStepRef.current !== 2 && currentStep === 2;
        const bumpJustChangedOnStep2 = currentStep === 2 && prevIncludeSecondaryOfferRef.current !== includeSecondaryOffer;

        if (currentStep === 2 && (stepJustChangedTo2 || bumpJustChangedOnStep2))
            handlePaymentIntentUpdate();

        if (userContext?.isAuthenticated && ownsPrimaryOffer && !ownsSecondaryOffer && primaryOffer && secondaryOffer && prevCurrentStepRef.current !== 2)
            setCurrentStep(2);

        prevCurrentStepRef.current = currentStep;
        prevIncludeSecondaryOfferRef.current = includeSecondaryOffer;

        return () => {
            isMounted = false;
        };
    }, [userContext, ownsPrimaryOffer, ownsSecondaryOffer, primaryOffer, secondaryOffer, currentStep, name, email, includeSecondaryOffer, updatePaymentIntent]);

    useEffect(() => {
        const clearExistingInterval = () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);

                timerIntervalRef.current = null;
            }
        };

        if (currentStep === 2) {
            clearExistingInterval();
            setTimeRemaining(15 * 60);

            timerIntervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearExistingInterval();

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else
            clearExistingInterval();

        return clearExistingInterval;

    }, [currentStep]);

    const proceedToPaymentStep = async () => {
        if (!userContext) {
            setError(`Pogreška prilikom obrade, molimo pokušajte ponovno ili kontaktirajte ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`);

            throw new Error('User context not found');
        }

        if (!primaryOffer) {
            setError('Ponuda nije dostupna, molimo osvježite stranicu');

            throw new Error('Primary offer not found');
        }

        if (!name || name.length < 2) {
            setError('Ime je obavezno');

            return;
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().charAt(0).toLowerCase() + email.trim().slice(1);

        if (!trimmedEmail || !trimmedEmail.includes('@')) {
            setError('Vaša adresa e-pošte nije ispravno formatirana');
            setIsSubmitting(false);

            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError('Vaša adresa e-pošte nije ispravno formatirana.');
            setIsSubmitting(false);

            return;
        }

        if (/[^\u0000-\u007F]/.test(trimmedEmail)) {
            setError('Vaša adresa e-pošte ne smije sadržavati dijakritičke znakove (č, ć, š, ž, đ itd.)');
            setIsSubmitting(false);

            return;
        }

        if (trimmedEmail.endsWith('gmail.con') || trimmedEmail.endsWith('gmail.hot')) {
            setError('Vaša adresa e-pošte možda sadrži tipografsku grešku.');
            setIsSubmitting(false);

            return;
        }

        if (trimmedName.includes('@')) {
            setError('Ime ne smije sadržavati @');
            setIsSubmitting(false);

            return;
        }

        setIsSubmitting(true);
        setError(undefined);

        const nameParts = trimmedName.split(' ');
        const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
        const lastName = nameParts.slice(1).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
        const fullName = `${firstName} ${lastName}`.trim();

        setName(fullName);
        setEmail(trimmedEmail);

        try {
            if (currentStep === 1) {
                Cookies.set('lead_name', fullName, { expires: 365 });
                Cookies.set('lead_email', trimmedEmail, { expires: 365 });
                
                await track('sign_up', {
                    name: fullName,
                    email: trimmedEmail,
                    region: userContext.region,
                    primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                    secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                });
            }

            if (!selectedMethod) {
                setError('Molimo odaberite način plaćanja');
                setIsSubmitting(false);

                return;
            }

            setCurrentStep(2);

        } catch (err) {
            setError('Došlo je do greške prilikom obrade. Molimo pokušajte ponovno.');
            setIsSubmitting(false);

            sendClientErrorEmail('Error processing sign up:', err);
        }
    };

    const handleQuickPay = async () => {
        setIsSubmitting(true);

        if (!primaryOffer)
            throw new Error('Primary offer not found');

        try {
            track('buy_click', {
                payment_method: 'quick_pay',
                email: email,
                name: name,
                value: getTotalAmount(),
                currency: getCurrency(),
                primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
            });

            if (!clientSecret)
                throw new Error('No client secret found');

            try {
                const result = await fetchJsonPost('/api/stripe/charge-saved-card', {
                    client_secret: clientSecret,
                    customer_id: customerId
                });

                const paymentId = result.payment_id;

                if (!paymentId) {
                    sendClientErrorEmail('Error handling quick pay, expected payment_id, got: ' + JSON.stringify(result));

                    throw new Error('Missing payment_id');
                }

                if (result?.next_action?.redirect_to_url)
                    window.location.href = result.next_action.redirect_to_url;
                else
                    window.location.href = `/success?payment_id=${paymentId}`;

            } catch (error) {
                setError(error instanceof Error ? error.message : 'Greška prilikom obrade plaćanja');
                setIsSubmitting(false);

                track('buy_decline', {
                    payment_method: 'quick_pay',
                    email: email,
                    name: name,
                    value: getTotalAmount(),
                    currency: getCurrency(),
                    primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                    secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                    error: error instanceof Error ? error.message : 'Greška prilikom obrade plaćanja'
                });
            }

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Došlo je do neočekivane pogreške');
            setIsSubmitting(false);

            sendClientErrorEmail('Error handling quick pay:', error);
        }
    };

    // Early check for required data - after all hooks are declared
    if (!primaryOffer || !userContext) {
        return (
            <div className="text-center py-10">
                <p className="text-purple-200">Još nije spremno. Ako se problem nastavi, kontaktirajte nas na {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            id="order-form"
            className="w-full"
        >
            {isSubmitting ? (
                <div className="flex flex-col justify-center items-center min-h-[500px] gap-4">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6B498F]"></div>
                    <p className="text-[#6B498F]">Obrada...</p>
                </div>
            ) : (
                <>
                    {!(ownsPrimaryOffer && ownsSecondaryOffer) && (
                        <div className="text-center mb-8">
                            <div className="bg-[#E1CCEB]/30 w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-4">
                                {getIconByName(displayedOfferForHeading?.metadata?.icon_name || DEFAULT_ICON, { className: "w-8 h-8 text-[#6B498F]" })}
                            </div>
                            {isSecondaryOfferPrimary ? (
                                <h2 className="text-2xl font-bold text-[#4b2c5e] mb-2">{orderFormTitle}</h2>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-[#4b2c5e] mb-2">
                                        {orderFormTitle}
                                    </h2>
                                    {orderFormSubtitle && (
                                        <h3 className="text-[#6B498F] text-lg">
                                            {orderFormSubtitle}
                                        </h3>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {userContext.isAuthenticated && ownsPrimaryOffer && ownsSecondaryOffer ? (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#4b2c5e] mb-4">
                                Dobrodošli natrag!
                            </h3>
                            <p className="text-[#6B498F] mb-6">
                                Svi Vaši materijali i resursi dostupni su u Vašem korisničkom prostoru.
                            </p>
                            <a
                                href="/dashboard"
                                className="block w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium text-center transition-colors"
                            >
                                Pristupite svojim materijalima
                            </a>
                        </div>

                    ) : currentStep === 1 ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                proceedToPaymentStep();
                            }}
                            className="space-y-6"
                        >
                            <FormInput id="name" label="Vaše Ime" value={name} onChange={(e) => setName(e.target.value)} placeholder="Unesite Vaše ime" disabled={isSubmitting} />
                            <FormInput id="email" label="E-mail Adresa" value={email} placeholder="vas@email.com" disabled={isSubmitting} autoCapitalize="none" onChange={(e) => {
                                const value = e.target.value;

                                if (value.length > 0)
                                    setEmail(value.charAt(0).toLowerCase() + value.slice(1));
                                else
                                    setEmail(value);
                            }} />

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="pt-4 space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`bg-[#6B498F] border border-[#4b2c5e]/20 rounded-xl p-4 text-center flex flex-col items-center justify-center relative hover:bg-[#4b2c5e] transition-all min-h-[60px] ${isSubmitting ? 'opacity-90' : ''}`}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-lg flex items-center text-white">
                                                Nastavite
                                                <ArrowRight className="w-6 h-6 ml-2" />
                                            </span>
                                        )}
                                    </button>

                                    {/* Price display below the button */}
                                    <div className="flex items-center justify-center mt-4 gap-1">
                                        <span className="text-2xl font-bold mr-2">
                                            {formatDiscountedPriceForCurrentUser(secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer : primaryOffer, userContext.region, "Main return")}
                                        </span>
                                        <span className="text-gray-500 line-through mr-2">
                                            {formatFullPrice(secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer : primaryOffer, userContext.region)}
                                        </span>
                                        <span className="text-sm bg-[#E1CCEB]/50 px-3 py-1 rounded-full text-[#6B498F]">
                                            Ušteda {getDiscountPercent(secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer : primaryOffer, userContext.region)}%
                                        </span>
                                    </div>

                                    {/* Security guarantees below the price */}
                                    <div className="text-sm text-gray-500 mt-2 flex items-center justify-center text-center">
                                        <span>🔒 Sigurno plaćanje • Trenutni pristup • 30-dnevno jamstvo povrata novca</span>
                                    </div>
                                </div>

                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {!userContext.isAuthenticated && (
                                    <div className="bg-[#FFF9E9] p-4 rounded-lg mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-[#D4B5A0]/20 p-2 rounded-full flex-shrink-0">
                                                <Clock className="w-5 h-5 text-[#4b2c5e]/80" />
                                            </div>
                                            <div>
                                                <p className="text-[#4b2c5e] font-medium">Vaša ponuda je rezervirana na {(() => {
                                                    const minutes = Math.floor(timeRemaining / 60);
                                                    const remainingSeconds = timeRemaining % 60;
                                                    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                                                })()}</p>
                                                <p className="text-[#4b2c5e]/80 text-sm">Dovršite svoju narudžbu prije isteka vremena.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {secondaryOffer && !isSecondaryOfferPrimary && (
                                    <OrderBump
                                        userContext={userContext}
                                        checked={includeSecondaryOffer}
                                        onChange={(checked) => {
                                            setIncludeSecondaryOffer(checked);
                                        }}
                                        offer={secondaryOffer}
                                    />
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold text-[#4b2c5e] mb-6">
                                        {secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.name : primaryOffer.name}
                                    </h3>
                                    <div className="flex justify-between items-center mb-6 border-b border-[#E1CCEB]/50 pb-4">
                                        <p className="text-[#4b2c5e] text-lg">Ukupno:</p>
                                        <div className="text-2xl font-bold text-[#4b2c5e]">
                                            {formatCurrency(getTotalAmount(), getCurrency())}
                                        </div>
                                    </div>
                                    {timeRemaining <= 60 && timeRemaining > 0 && (
                                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mb-6 animate-pulse">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-red-500/20 p-2 rounded-full flex-shrink-0">
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-red-700 font-medium">Vaše vrijeme brzo istječe!</p>
                                                    <p className="text-red-600 text-sm">
                                                        Dovršite svoju narudžbu u sljedećih {(() => {
                                                            const minutes = Math.floor(timeRemaining / 60);
                                                            const remainingSeconds = timeRemaining % 60;
                                                            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                                                        })()}.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {timeRemaining === 0 && (
                                        <div className="bg-[#F1BBB0]/40 p-4 rounded-lg border border-[#F1BBB0]/30 mb-6">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-[#D4B5A0]/20 p-2 rounded-full flex-shrink-0">
                                                    <Clock className="w-5 h-5 text-[#4b2c5e]/80" />
                                                </div>
                                                <div>
                                                    <p className="text-[#4b2c5e] font-medium">Vrijeme je isteklo</p>
                                                    <p className="text-[#4b2c5e]/80 text-sm">
                                                        Ne brinite - još uvijek držimo Vaše mjesto! Dovršite svoju narudžbu dok ste još na ovoj stranici.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {userContext.isAuthenticated && hasSavedPaymentMethods && (
                                        <div className="mb-6">
                                            <div className="bg-[#E1CCEB]/30 backdrop-blur-sm p-4 rounded-lg border border-[#E1CCEB]/50 mb-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <CreditCard className="w-5 h-5 text-[#6B498F]" />
                                                    <h4 className="font-medium text-[#4b2c5e]">Brzo plaćanje</h4>
                                                </div>
                                                <p className="text-[#4b2c5e]/80 text-sm mb-4">
                                                    Platite koristeći svoju spremljenu karticu za brži checkout.
                                                </p>
                                                <button
                                                    onClick={handleQuickPay}
                                                    disabled={isSubmitting}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                                                >
                                                    {isSubmitting ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Plati s spremljenom karticom
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="relative flex items-center">
                                                <div className="flex-grow border-t border-[#E1CCEB]/50"></div>
                                                <span className="mx-4 text-gray-500 text-sm">ili</span>
                                                <div className="flex-grow border-t border-[#E1CCEB]/50"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        <PaymentMethodSelector selectedMethod={selectedMethod} onSelect={setSelectedMethod} />

                                        {!clientSecret && isSubmitting && selectedMethod === 'stripe' ? (
                                            <div className="flex justify-center py-10">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6B498F]"></div>
                                            </div>
                                        ) : (
                                            <>
                                                <PayPalScriptProvider options={{
                                                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                                                    currency: "EUR",
                                                    intent: "capture",
                                                    components: "buttons",
                                                    disableFunding: "credit",
                                                }}>
                                                    <div style={{ display: selectedMethod === 'paypal' ? 'block' : 'none' }}>
                                                        <div className="bg-blue-100/50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3 text-blue-800">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-sm font-medium mb-1">
                                                                    Plaćanje se vrši u EUR valuti
                                                                </p>
                                                                <p className="text-sm">
                                                                    Iznos za plaćanje: <span className="font-semibold">{getTotalEurAmount().toFixed(2)}€</span>
                                                                    <span className="text-xs block mt-1">
                                                                        Vaša banka automatski obrađuje konverziju prema trenutnom tečaju.
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <PayPalButtons
                                                            fundingSource="paypal"
                                                            style={{ layout: "vertical", label: "pay" }}
                                                            disabled={isSubmitting}
                                                            createOrder={async () => {
                                                                try {
                                                                    track('buy_click', {
                                                                        payment_method: 'paypal',
                                                                        email: email,
                                                                        name: name,
                                                                        value: getTotalAmount(),
                                                                        currency: getCurrency(),
                                                                        primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                                                                        secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                                                                    });

                                                                    const data = await fetchJsonPost('/api/paypal/create-order', {
                                                                        email: email,
                                                                        region: userContext.region,
                                                                        primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                                                                        secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                                                                    });

                                                                    if (!data.orderID)
                                                                        throw new Error('No order ID returned from PayPal');

                                                                    return data.orderID;

                                                                } catch (error) {
                                                                    track('buy_decline', {
                                                                        payment_method: 'paypal',
                                                                        email: email,
                                                                        name: name,
                                                                        value: getTotalAmount(),
                                                                        currency: getCurrency(),
                                                                        primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                                                                        secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                                                                        error: error instanceof Error ? error.message : 'unknown'
                                                                    });

                                                                    setIsSubmitting(false);
                                                                    setError(error instanceof Error ? error.message : `Neuspjelo kreiranje PayPal narudžbe. Molimo osvježite stranicu i kontaktirajte nas putem ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} ako se problem nastavi.`);
                                                                    sendClientErrorEmail("Error creating PayPal order:", error);

                                                                    throw error; // Let PayPal handle the rejection
                                                                }
                                                            }}
                                                            onApprove={async (data) => {
                                                                try {
                                                                    await fetchJsonPost('/api/paypal/save-pending-payment', {
                                                                        raw_data: JSON.stringify(data),
                                                                        name: name,
                                                                        email: email,
                                                                        region: userContext.region,
                                                                        amount: getTotalEurAmount(),
                                                                        currency: 'EUR',
                                                                        primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                                                                        secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                                                                        payment_id: data.paymentID,
                                                                        order_id: data.orderID,
                                                                        payer_id: data.payerID
                                                                    });

                                                                    window.location.href = `/success?payment_id=${data.orderID}`;

                                                                } catch (error) {
                                                                    setError(`Došlo je do pogreške prilikom spremanja plaćanja. Vaša uplata je uspješno obavljena, a račun će biti kreiran u roku od 24 sata. Kontaktirajte nas putem ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} ako imate pitanja.`);
                                                                    setIsSubmitting(false);

                                                                    sendClientErrorEmail("Error saving pending payment:", error);
                                                                }
                                                            }}
                                                            onError={(err) => {
                                                                setError('Došlo je do pogreške prilikom obrade PayPal plaćanja: ' + err);
                                                                setIsSubmitting(false);

                                                                track('buy_decline', {
                                                                    payment_method: 'paypal',
                                                                    email: email,
                                                                    name: name,
                                                                    value: getTotalAmount(),
                                                                    currency: getCurrency(),
                                                                    primary_offer_slug: secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer.slug : primaryOffer.slug,
                                                                    secondary_offer_slug: secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer.slug : null,
                                                                    error: err instanceof Error ? err : 'PayPal error'
                                                                });
                                                            }}
                                                            onCancel={() => {
                                                                setIsSubmitting(false);
                                                            }}
                                                        />
                                                        {isSubmitting && (
                                                            <div className="flex justify-center items-center mt-4">
                                                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#6B498F] mr-2"></div>
                                                                <span className="text-[#6B498F] text-sm">Pripremanje PayPala...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </PayPalScriptProvider>

                                                <div style={{ display: selectedMethod === 'stripe' ? 'block' : 'none' }}>
                                                    {clientSecret ? (
                                                        <Elements
                                                            stripe={stripePromise}
                                                            options={stripeOptions}
                                                            key={clientSecret}
                                                        >
                                                            <StripeCheckoutForm
                                                                name={name}
                                                                email={email}
                                                                primaryOffer={secondaryOffer && isSecondaryOfferPrimary ? secondaryOffer : primaryOffer}
                                                                secondaryOffer={secondaryOffer && includeSecondaryOffer && !isSecondaryOfferPrimary ? secondaryOffer : null}
                                                                totalAmount={getTotalAmount()}
                                                                currency={getCurrency()}
                                                            />
                                                        </Elements>
                                                    ) : (
                                                        <div className="flex justify-center py-6">
                                                            <div className="text-center">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6B498F] mx-auto mb-3"></div>
                                                                <p className="text-[#6B498F]">Pripremanje forme za plaćanje...</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {error && (
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                                                        <p className="text-red-500 text-sm">{error}</p>
                                                    </div>
                                                )}
                                                {!userContext && (
                                                    <div className="flex justify-center py-10">
                                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6B498F]"></div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center gap-2 text-[#4b2c5e]/80 text-sm mb-4 px-3 py-1.5 rounded-full">
                                            <Image
                                                src="/img/secure-payment-icon.svg"
                                                alt="Secure Payment"
                                                width={20}
                                                height={20}
                                                className="w-5 h-5"
                                            />
                                            <span className="font-medium">Zajamčeno sigurna odjava</span>
                                        </div>

                                        <div className="flex flex-wrap justify-between mt-3 mb-4 mx-auto">
                                            <div className="flex items-start gap-1.5 w-full md:w-[48%] mb-3">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-left">Vaši osobni podaci su strogo zaštićeni</p>
                                            </div>
                                            <div className="flex items-start gap-1.5 w-full md:w-[48%] mb-3">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-left">Svi podaci ostaju potpuno privatni i nikada se ne dijele</p>
                                            </div>
                                            <div className="flex items-start gap-1.5 w-full md:w-[48%] mb-3">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-left">Trenutni pristup nakon plaćanja</p>
                                            </div>
                                            <div className="flex items-start gap-1.5 w-full md:w-[48%] mb-3">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-left">Puno jamstvo povrata novca 30 dana</p>
                                            </div>
                                        </div>

                                        <div className="bg-[#E1CCEB]/30 p-4 rounded-lg border border-[#E1CCEB]/50 mt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-[#E1CCEB]/50 p-2 rounded-full flex-shrink-0">
                                                    <Mail className="w-5 h-5 text-[#6B498F]" />
                                                </div>
                                                <p className="text-sm text-[#4b2c5e]/90">
                                                    Imate pitanja? Kontaktirajte nas na <a href="tel:+385991904855" className="text-[#6B498F] hover:underline">+385 99 190 4855</a> ili <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-[#6B498F] hover:underline">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </motion.div>
    );
};

export default OrderForm;