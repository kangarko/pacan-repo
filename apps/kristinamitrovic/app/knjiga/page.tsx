'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { UserContextData } from '@repo/ui/lib/types';
import { retrieveData } from '@repo/ui/lib/clientUtils';
import HeroSection from '@/components/knjiga/HeroSection';

// Group critical above-the-fold components
const RecognizeYourselfSection = dynamic(() => import('@/components/knjiga/RecognizeYourselfSection'));
const TestimonialsSection = dynamic(() => import("@/components/TestimonialsSection"));
const ObjectionSection = dynamic(() => import("@/components/knjiga/ObjectionSection"));

// Lazy load below-the-fold components with loading states
const BenefitsSection = dynamic(() => import("@/components/knjiga/BenefitsSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
/*const KeyPointsSection = dynamic(() => import("@/components/home/KeyPointsSection"), {
    loading: () => <div className="h-96 bg-gray-900 animate-pulse" />
});*/
const CTASection = dynamic(() => import("@/components/knjiga/CTASection"));
const TargetAudienceSection = dynamic(() => import("@/components/knjiga/TargetAudienceSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
const StruggleSection = dynamic(() => import("@/components/knjiga/StruggleSection"), {
    loading: () => <div className="h-96 bg-gray-900 animate-pulse" />
});
const DetailedDescriptionSection = dynamic(() => import("@/components/knjiga/DetailedDescriptionSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
const BigCTASection = dynamic(() => import("@/components/knjiga/BigCTASection"));
const LearningSection = dynamic(() => import("@/components/knjiga/LearningSection"), {
    loading: () => <div className="h-96 bg-gray-900 animate-pulse" />
});
const ChaptersSection = dynamic(() => import("@/components/knjiga/ChaptersSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
const AuthorSection = dynamic(() => import("@/components/knjiga/AuthorSection"), {
    loading: () => <div className="h-96 bg-gray-900 animate-pulse" />
});
const GuaranteeSection = dynamic(() => import("@/components/knjiga/GuaranteeSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
const FAQSection = dynamic(() => import('@/components/knjiga/FAQSection'), {
    loading: () => <div className="h-96 bg-gray-900 animate-pulse" />
});
const NextSection = dynamic(() => import("@/components/knjiga/NextSection"), {
    loading: () => <div className="h-96 bg-gray-800 animate-pulse" />
});
const FooterSection = dynamic(() => import("@repo/ui/components/FooterSection"), {
    loading: () => <div className="h-32 bg-gray-900 animate-pulse" />
});
const ExitPopup = dynamic(() => import("@repo/ui/components/ExitPopup"), { ssr: false });
const SocialProofWidget = dynamic(() => import("@repo/ui/components/SocialProofWidget"), { ssr: false });

export default function KnjigaPage() {
    const [userContext, setUserContext] = useState<UserContextData | null>(null);

    useEffect(() => {
        async function loadUserContext() {
            setUserContext(await retrieveData());
        }

        loadUserContext();
    }, []);

    const primaryOffer = userContext?.offers.find(offer =>
        offer.slug === 'stilovi-privrzenosti'
    ) || null;

    const secondaryOffer = userContext?.offers.find(offer =>
        offer.slug === 'vodic-za-produbljivanje-veza'
    ) || null;
    
    const isLoading = !userContext;

    if (userContext && (!primaryOffer || !secondaryOffer))
        throw new Error('Main or order bump offer not found');

    const LoadingSpinner = () => (
        <div className="py-12 px-4 flex justify-center">
            <div className="text-center">
                <Loader2 className="animate-spin h-10 w-10 text-purple-500 mx-auto mb-3" />
                <p className="text-purple-300">Učitavanje ponude...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            <HeroSection
                primaryOffer={primaryOffer}
                secondaryOffer={secondaryOffer}
                userContext={userContext}
                isLoading={isLoading}
            />
            <RecognizeYourselfSection />
            <TestimonialsSection />
            <ObjectionSection />
            <BenefitsSection />
            {/*<KeyPointsSection />*/}

            {!userContext ? (
                <LoadingSpinner />
            ) : (
                <CTASection offer={primaryOffer} userContext={userContext} />
            )}

            <TargetAudienceSection />
            <StruggleSection />
            <DetailedDescriptionSection />

            {!userContext ? (
                <LoadingSpinner />
            ) : (
                <BigCTASection offer={primaryOffer} userContext={userContext} />
            )}

            <LearningSection />
            <ChaptersSection />
            <AuthorSection />
            <GuaranteeSection />
            <FAQSection />
            <NextSection />
            <FooterSection
                showLinks={false}
            />

            {!isLoading && primaryOffer && (
                <>
                    <ExitPopup userContext={userContext} />
                    <SocialProofWidget userContext={userContext} />
                </>
            )}
        </div>
    );
} 