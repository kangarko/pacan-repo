'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OrderForm from '@repo/ui/components/OrderForm';
import GradientBackground from '@repo/ui/components/GradientBackground';
import { Star, CheckCircle, LogIn, User } from 'lucide-react';
import { getDiscountPercent, replaceAccentTags } from '@repo/ui/lib/utils';
import { UserContextData, Headline } from '@repo/ui/lib/types';
import { Offer } from '@repo/ui/lib/types';
import { getIconByName } from '@repo/ui/lib/iconMapping';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { useSokolSession } from '@repo/ui/components/SokolSessionHandler';

// Add countdown component
const CountdownTimer = React.memo(() => {
    const [timeUntilMidnight, setTimeUntilMidnight] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeUntilMidnight = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(23, 59, 59, 999);

            const diff = midnight.getTime() - now.getTime();

            return {
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            };
        };

        setTimeUntilMidnight(calculateTimeUntilMidnight());

        const timer = setInterval(() => {
            setTimeUntilMidnight(calculateTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return <>{timeUntilMidnight.hours}h {timeUntilMidnight.minutes}m {timeUntilMidnight.seconds}s</>;
});

CountdownTimer.displayName = 'CountdownTimer';

const getRegionMessage = (region: string, discountPercentage: number) => {
    let regionName = '';
    let celebrationText = '';
    let expiryText = '';

    switch (region) {
        case 'RS':
            regionName = 'Srbije';
            celebrationText = 'Proslava izdavanja knjige:';
            expiryText = 'Ponuda ističe za:';
            break;
        case 'BA':
            regionName = 'Bosne i Hercegovine';
            celebrationText = 'Proslava lansiranja knjige:';
            expiryText = 'Ponuda ističe za:';
            break;
        case 'HR':
            regionName = 'Hrvatske';
            celebrationText = 'Proslava objave knjige:';
            expiryText = 'Ponuda istječe za:';
            break;
        case 'ME':
            regionName = 'Crne Gore';
            celebrationText = 'Proslava izdavanja knjige:';
            expiryText = 'Ponuda ističe za:';
            break;
        default:
            regionName = 'Vaše lokacije';
            celebrationText = 'Proslava objave knjige:';
            expiryText = 'Ponuda istječe za:';
    }

    return {
        celebration: celebrationText,
        expiry: expiryText,
        discount: `${discountPercentage}% popust`,
        region: `za kupce iz ${regionName}`
    };
};

const HeroSection = ({ primaryOffer, secondaryOffer, userContext, isLoading: pageIsLoading }: { primaryOffer: Offer | null; secondaryOffer: Offer | null; userContext: UserContextData | null; isLoading: boolean; }) => {
    const [mobileHideTopbar, setMobileHideTopbar] = useState(false);
    const [headline, setHeadline] = useState<Headline | null>(null);
    const [headlineLoading, setHeadlineLoading] = useState(true);
    const { isInitialized } = useSokolSession();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const urlParamValue = searchParams.get('mobile-hide-topbar') === 'true';
        const checkFragmentParams = () => {
            const hashPart = window.location.hash;

            if (hashPart && hashPart.includes('?')) {
                const fragmentParams = new URLSearchParams(hashPart.split('?')[1]);

                return fragmentParams.get('mobile-hide-topbar') === 'true';
            }

            return false;
        };

        setMobileHideTopbar(urlParamValue || checkFragmentParams());
    }, []);

    useEffect(() => {
        // Only read from localStorage after Sokol session has initialized
        if (!isInitialized)
            return;

        try {
            const storedHeadline = localStorage.getItem('active_headline');

            if (!storedHeadline)
                throw new Error("No headline found in localStorage");

            setHeadline(JSON.parse(storedHeadline));

        } catch (error) {
            sendClientErrorEmail("Error reading headline from localStorage", error);

        } finally {
            setHeadlineLoading(false);
        }
    }, [isInitialized]);

    const countryCode = userContext?.region;
    const discountPercentage = primaryOffer && countryCode ? getDiscountPercent(primaryOffer, countryCode) : 0;
    const combinedMessage = countryCode ? getRegionMessage(countryCode, discountPercentage) : { celebration: '', expiry: '', discount: '', region: '' };

    //const flagUrl = countryCode ? getFlagUrl(countryCode) : '';

    const LoadingSpinner = ({ message = "Učitavanje ponude...", spinnerSize = "md" }: { message?: string; spinnerSize?: "sm" | "md" | "lg" }) => {
        const sizes = {
            sm: "h-6 w-6",
            md: "h-10 w-10",
            lg: "h-12 w-12"
        };

        return (
            <div className="text-center">
                <div className={`animate-spin rounded-full ${sizes[spinnerSize]} border-t-2 border-b-2 border-[#6B498F] mx-auto mb-3`}></div>
                <p className="text-[#6B498F]">{message}</p>
            </div>
        );
    };

    return (
        <section className="relative overflow-hidden">
            {/* Top announcement bar - Show loading state here */}
            <div className={`bg-[#4b2c5e] text-white py-2 px-4 text-center font-medium ${mobileHideTopbar ? 'hidden lg:flex' : 'flex'} flex-wrap items-center justify-center gap-1 sm:gap-2`}>
                {!pageIsLoading && countryCode && primaryOffer ? (
                    <>
                        <span className="text-lg">✨</span>
                        <span className="sm:inline-block mr-1">{combinedMessage.celebration} <span className="text-[#FFF9E9] font-semibold">{combinedMessage.discount}</span></span>
                        <span className="flex items-center gap-1 bg-[#6B498F]/80 text-white px-2 py-0.5 rounded-md text-xs sm:text-sm">{combinedMessage.expiry} <CountdownTimer /></span>
                    </>
                ) : (
                    <span className="animate-pulse text-sm sm:text-base">Nalazim Vašu lokaciju...</span>
                )}
            </div>

            {/* Hero Section */}
            <div className="relative text-[#4b2c5e] bg-cover bg-center bg-no-repeat bg-[url('/img/couple-beach-mobile.webp')] lg:bg-[url('/img/couple-beach.webp')]">
                {/* Using reusable GradientBackground component instead of inline gradient code */}
                <GradientBackground />

                <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
                    {/* Only show these elements if not in mobile hide mode */}
                    <div className={mobileHideTopbar ? 'hidden lg:block' : ''}>
                        {/* Pre-headline */}
                        <div className="relative mb-6 sm:mb-8">
                            <div className="flex justify-center w-full">
                                {/* Mobile-only icon positioned to the right without background */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 sm:hidden">
                                    {userContext?.isAuthenticated ? (
                                        <Link
                                            href="/dashboard"
                                            className="inline-flex items-center justify-center text-[#6B498F] p-2 transition-colors"
                                            aria-label="Dashboard"
                                        >
                                            <User className="w-5 h-5" />
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center justify-center text-[#6B498F] p-2 transition-colors"
                                            aria-label="Login"
                                        >
                                            <LogIn className="w-5 h-5" />
                                        </Link>
                                    )}
                                </div>

                                {/* Centered pre-headline for both mobile and desktop */}
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2 sm:bg-[#FFEAFF]/80 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[#6B498F] w-full sm:w-auto mx-1 sm:mx-0">
                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium text-center">Revolucionarni pristup<span className="hidden sm:inline"> razumijevanju</span> privrženosti</span>
                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-12 text-center max-w-5xl mx-auto leading-tight md:leading-[1.1] tracking-tight text-[#4b2c5e]">
                            {headlineLoading ? (
                                <span className="inline-block animate-pulse bg-gray-200/50 rounded h-12 w-3/4 mx-auto"></span>
                            ) : headline ? (
                                <>
                                    <span dangerouslySetInnerHTML={{ __html: replaceAccentTags(headline.headline, true) }} />
                                    {headline.subheadline && (
                                        <span
                                            className="block text-base sm:text-lg md:text-xl lg:text-2xl text-[#6B498F]/80 mt-2 sm:mt-4 mb-8 font-normal"
                                            dangerouslySetInnerHTML={{ __html: replaceAccentTags(headline.subheadline, true) }}
                                        />
                                    )}
                                </>
                            ) : (
                                // Default fallback
                                <>
                                    Kako <span className="text-white">prevladati nesigurne obrasce privrženosti</span> i stvoriti zdravu, dugotrajnu vezu
                                    <span className="block text-base sm:text-lg md:text-xl lg:text-2xl text-[#6B498F]/80 mt-2 sm:mt-4 mb-8 font-normal">
                                        (Čak i ako ste već isprobali &quot;sve&quot;)
                                    </span>
                                </>
                            )}
                        </h1>
                    </div>

                    {/* Conditional grid layout based on mobile-hide-topbar */}
                    <div className={mobileHideTopbar ? "block lg:grid lg:grid-cols-2 lg:gap-8" : "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"}>
                        {/* Left Column - Book Info (hidden on mobile when mobile-hide-topbar is true) */}
                        <div className={`text-center lg:text-left ${mobileHideTopbar ? 'hidden lg:block' : ''}`}>
                            {/* Feature bullets - always shown above the order form */}
                            <div className="space-y-4 mb-2">
                                {headlineLoading ? (
                                    // Loading state for bullet points
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-6 h-6 bg-gray-200/50 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
                                                <div className="flex-1">
                                                    <div className="h-5 bg-gray-200/50 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : headline && headline.bullet_points.length > 0 ? (
                                    // Dynamic bullet points
                                    headline.bullet_points.map((point, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 mt-1">
                                                {getIconByName(point.icon, { size: 24, className: "text-[#6B498F]" })}
                                            </span>
                                            <p
                                                className="text-[#4b2c5e]/80"
                                                dangerouslySetInnerHTML={{ __html: replaceAccentTags(point.text, false) }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    // Default bullet points
                                    <>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                            <p className="text-[#4b2c5e]/80">
                                                <strong className="text-[#4b2c5e]">Prestanite sabotirati svoje veze</strong> i naučite kako stvoriti sigurnu povezanost s partnerom
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                            <p className="text-[#4b2c5e]/80">
                                                <strong className="text-[#4b2c5e]">Oslobodite se anksioznosti i straha</strong> koji Vas sprječavaju u stvaranju intimnih veza
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                            <p className="text-[#4b2c5e]/80">
                                                <strong className="text-[#4b2c5e]">Naučite postaviti zdrave granice</strong> bez osjećaja krivnje ili straha od napuštanja
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Only show the image and testimonial on desktop */}
                            <div className="hidden lg:block">
                                {/* Book image */}
                                <div className="relative w-full" style={{ height: '270px' }}>
                                    {primaryOffer && (
                                        <Image
                                            src={primaryOffer.thumbnail_url || ''}
                                            alt={primaryOffer.name}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            priority
                                        />
                                    )}
                                </div>

                                {/* Testimonial */}
                                <div className="mt-2 p-6 text-center">
                                    <div className="flex mb-2 justify-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-black mb-2">
                                        &quot;Mnogo mi se dopala knjiga. Pročitala sam je brzo iz dva tri navrata, nijesam mogla prestati, kao da sam gutala... U mnogim stvarima sam se pronašla. Tehnike disanja, opuštanja mi se sviđaju. Divna ste, originalna.&quot;
                                    </p>
                                    <p className="text-black text-sm">— Biljana Ž.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Form (always shown) */}
                        <div className={`${mobileHideTopbar ? "mx-auto w-full lg:mx-0 lg:w-auto" : ""} bg-transparent md:bg-[#FFEAFF]/50 backdrop-blur-xs rounded-2xl md:p-8 p-0 flex items-center justify-center self-start min-h-[520px]`}>
                            {pageIsLoading ? (
                                <LoadingSpinner message="Pripremamo Vaše materijale..." spinnerSize="lg" />
                            ) : (
                                <OrderForm
                                    primaryOffer={primaryOffer!}
                                    secondaryOffer={secondaryOffer!}
                                    userContext={userContext}
                                />
                            )}
                        </div>
                    </div>

                    {/* Mobile-only book image section (shown below order form) */}
                    <div className={`lg:hidden mt-8 ${mobileHideTopbar ? 'hidden' : ''}`}>
                        {/* Only show the image if primary offer is loaded - Mobile version */}
                        <div className="relative w-full" style={{ height: '270px' }}>
                            {primaryOffer && (
                                <Image
                                    src={primaryOffer.thumbnail_url || ''}
                                    alt={primaryOffer.name}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            )}
                        </div>

                        {/* Testimonial for mobile view */}
                        <div className="mt-2 p-6 text-center">
                            <div className="flex mb-2 justify-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <p className="text-[#4b2c5e]/80 mb-2">
                                &quot;Mnogo mi se dopala knjiga. Pročitala sam je brzo iz dva tri navrata, nijesam mogla prestati, kao da sam gutala... U mnogim stvarima sam se pronašla. Tehnike disanja, opuštanja mi se sviđaju. Divna ste, originalna.&quot;
                            </p>
                            <p className="text-black text-sm">— Biljana Ž.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;