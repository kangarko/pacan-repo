'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Check, Loader2 } from 'lucide-react';
import GradientBackground from '@repo/ui/components/GradientBackground';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient, sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost } from '@repo/ui/lib/utils';

// Instead of exporting directly from the page file, use a constant
const ONBOARDING_FORM_SLUG = 'onboarding';

interface FormStep {
    id: number;
    title: string;
    description?: string;
    type: 'select' | 'multiselect' | 'text' | 'textarea';
    options?: string[];
    field: string;
    rows?: number;
    placeholder?: string;
}

const onboardingSteps: FormStep[] = [
    {
        id: 1,
        title: 'U kojoj ste dobnoj skupini?',
        description: 'Ova informacija pomaže nam prilagoditi sadržaj vašim potrebama. Odaberite opciju kako biste nastavili na sljedeću stranicu.',
        type: 'select',
        options: [
            '18-24',
            '25-34',
            '35-44',
            '45-54',
            '55-64',
            '65+'
        ],
        field: 'age_range',
    },
    {
        id: 2,
        title: 'Kakav je Vaš trenutni status veze?',
        type: 'select',
        options: ['U vezi', 'U braku', 'Samac/Samica', 'Složeno', 'Razvedena/Rastavljen'],
        field: 'relationship_status',
    },
    {
        id: 3,
        title: 'Koji su Vaši najveći izazovi u odnosima?',
        description: 'Odaberite sve što se odnosi na Vas.',
        type: 'multiselect',
        options: [
            'Teško vjerujem ljudima',
            'Strah od odbacivanja',
            'Prebrzo se vežem',
            'Problemi s komunikacijom',
            'Teško izražavam emocije',
            'Često se osjećam nesigurno',
            'Tražim previše potvrde'
        ],
        field: 'challenges',
    },
    {
        id: 4,
        title: 'Što Vas je najviše inspiriralo da kupite moju knjigu?',
        description: 'Vaš odgovor će mi pomoći da bolje razumijem što je važno mojim čitateljima.',
        type: 'textarea',
        rows: 4,
        field: 'purchase_inspiration',
        placeholder: 'Npr. Želim bolje razumjeti sebe, preporučio mi je prijatelj, vaš video me je motivirao...'
    },
    {
        id: 5,
        title: 'Koje izazove najčešće doživljavate u Vašim odnosima?',
        description: 'Podijelite situacije koje su za Vas emocionalno značajne ili izazovne.',
        type: 'textarea',
        field: 'pain_points',
        rows: 4,
        placeholder: 'Npr. Kada partner/ica ne čuje moje potrebe, osjećam se...'
    },
    {
        id: 6,
        title: 'Što biste voljeli postići ili promijeniti u sljedećih 90 dana?',
        description: 'Koji su vaši konkretni ciljevi u odnosima za naredno razdoblje?',
        type: 'textarea',
        field: 'ninety_day_goals',
        rows: 4,
        placeholder: 'Upišite Vaš odgovor ovdje...'
    }
];

// Create a custom type for our form data
interface OnboardingFormData {
    [key: string]: string | string[] | undefined;
}

const OnboardingPage = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<OnboardingFormData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false); // New state to track when form is submitted
    const [userName, setUserName] = useState('');
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Track initial auth check
    const [validationError, setValidationError] = useState<string | null>(null); // Track validation error message
    const [submitError, setSubmitError] = useState<string | null>(null); // Add state for submission errors
    const [isAnimating, setIsAnimating] = useState(false); // Track if content is animating
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const router = useRouter();

    // Focus input when step changes
    useEffect(() => {
        const currentStep = onboardingSteps[step];
        if (inputRef.current && (currentStep.type === 'text' || currentStep.type === 'textarea')) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300); // Delay focus slightly for animation
        }
    }, [step]);

    // Check for authentication and get user name
    useEffect(() => {
        const checkAuth = async () => {
            setIsCheckingAuth(true);

            const supabase = createSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login?error=unauthorized&redirect=/onboarding'); // Redirect to login if not authenticated
                
                return;
            }

            if (user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'marketer') {
                router.push('/dashboard');
                return;
            }

            const data = await fetchJsonPost('/api/form/submitted', {
                form_slug: ONBOARDING_FORM_SLUG
            });

            if (data.submitted) 
                router.push('/dashboard');

            if (user.user_metadata.name) {
                const nameParts = user.user_metadata.name.split(' ');

                setUserName(nameParts[0]);
            }

            setIsCheckingAuth(false); // Auth check complete
        };

        checkAuth();
    }, [router]);

    const handleNext = () => {
        if (validateCurrentStep()) {
            setIsAnimating(true); // Start animation transition
            setValidationError(null); // Clear any validation errors

            if (step < onboardingSteps.length - 1) {
                setStep(prev => prev + 1);

                // After a short delay (matching the exit animation duration),
                // mark animation as complete to show the button again
                setTimeout(() => {
                    setIsAnimating(false);
                }, 400); // This should match the motion div transition duration
            } else {
                // If this is the last step, submit instead of going to next step
                handleSubmit();
            }
        }
    };

    const validateCurrentStep = () => {
        const currentStepConfig = onboardingSteps[step];
        const field = currentStepConfig.field;

        if (!field) return true; // No validation needed for steps without fields

        const value = formData[field];

        switch (currentStepConfig.type) {
            case 'select':
            case 'text':
            case 'textarea':
                return typeof value === 'string' && value.trim() !== '';
            case 'multiselect':
                return Array.isArray(value) && value.length > 0;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null); // Clear any previous errors

        try {
            await fetchJsonPost('/api/form/submit', {
                form_slug: ONBOARDING_FORM_SLUG,
                form_data: formData,
            });

            setIsSubmitted(true);
            setIsSubmitting(false);

        } catch (error) {
            if (!(error instanceof Error && error.message === 'Failed to fetch'))
                sendClientErrorEmail('[client/onboarding] Error submitting form:', error);
            
            setIsSubmitting(false);

            setSubmitError(error instanceof Error ? error.message : 'Došlo je do greške prilikom spremanja vaših odgovora. Molimo pokušajte ponovno.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Toggle value in multi-select array without moving to the next step
    const handleMultiSelectChange = (field: string, value: string) => {
        setFormData(prev => {
            const currentValues = (prev[field] as string[]) || [];
            const newValues = currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value];

            return { ...prev, [field]: newValues };
        });
    };

    // Handler for when disabled button is clicked
    const handleDisabledClick = () => {
        const currentStepConfig = onboardingSteps[step];

        let errorMessage = 'Molimo ispunite ovo polje prije nastavka.';

        // Customize error message based on field type
        if (currentStepConfig.type === 'multiselect') {
            errorMessage = 'Molimo odaberite barem jednu opciju.';
        } else if (currentStepConfig.type === 'text' || currentStepConfig.type === 'textarea') {
            errorMessage = 'Molimo unesite odgovor prije nastavka.';
        }

        setValidationError(errorMessage);

        // Hide the error message after 3 seconds
        setTimeout(() => {
            setValidationError(null);
        }, 3000);
    };

    const renderStep = () => {
        const currentStepConfig = onboardingSteps[step];
        const { title, description, type, options, field, placeholder, rows } = currentStepConfig;

        return (
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationComplete={() => setIsAnimating(false)}
                className="space-y-6"
            >
                <h2 className="text-2xl font-semibold text-[#4b2c5e]">{title}</h2>
                {description && <p className="text-[#6B498F]">{description}</p>}

                {/* In-form validation error message */}
                {validationError && !validateCurrentStep() && type !== 'select' && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] text-sm"
                    >
                        {validationError}
                    </motion.div>
                )}

                {type === 'select' && field && options && (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((option) => (
                            <motion.button
                                key={option}
                                onClick={() => {
                                    // For select type, don't show selected state, just move to next step
                                    // Set the form data and move to next step in a single operation
                                    setFormData(prev => ({ ...prev, [field]: option }));
                                    setStep(step + 1); // Move directly to next step
                                }}
                                className="text-left px-6 py-4 rounded-lg border transition-all bg-[#6B498F]/10 border-[#6B498F]/30 text-[#4b2c5e] hover:bg-[#6B498F]/20 hover:border-[#6B498F]/50 font-medium"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {option}
                            </motion.button>
                        ))}
                    </div>
                )}

                {type === 'multiselect' && field && options && (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((option) => (
                            <motion.button
                                key={option}
                                onClick={() => handleMultiSelectChange(field, option)}
                                className={`text-left px-6 py-4 rounded-lg border transition-all flex items-center justify-between font-medium ${Array.isArray(formData[field]) && (formData[field] as string[]).includes(option)
                                    ? 'bg-[#6B498F] border-[#6B498F] text-white'
                                    : 'bg-[#6B498F]/10 border-[#6B498F]/30 text-[#4b2c5e] hover:bg-[#6B498F]/20 hover:border-[#6B498F]/50'
                                    }`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>{option}</span>
                                {Array.isArray(formData[field]) && (formData[field] as string[]).includes(option) && (
                                    <Check className="w-5 h-5 text-white" />
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}

                {type === 'text' && field && (
                    <div>
                        <input
                            ref={inputRef as React.RefObject<HTMLInputElement>}
                            type="text"
                            name={field}
                            value={(formData[field] as string) || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/60 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] placeholder-[#6B498F]/50 focus:outline-none focus:ring-2 focus:ring-[#6B498F]/50 focus:bg-white/80 transition-all"
                            placeholder={placeholder}
                        />
                    </div>
                )}

                {type === 'textarea' && field && (
                    <div>
                        <textarea
                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                            name={field}
                            value={(formData[field] as string) || ''}
                            onChange={handleInputChange}
                            rows={rows ? rows * 2 : 8} // Double the rows with fallback to 8
                            className="w-full px-4 py-3 bg-white/60 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] placeholder-[#6B498F]/50 focus:outline-none focus:ring-2 focus:ring-[#6B498F]/50 focus:bg-white/80 transition-all md:text-base text-lg min-h-[150px] md:min-h-[120px]"
                            placeholder={placeholder}
                        ></textarea>
                    </div>
                )}
            </motion.div>
        );
    };

    // Function to render content (either form or thank you message)
    const renderContent = () => {
        if (isSubmitted) {
            // Show the thank you message if form was submitted
            return (
                <motion.div
                    key="thank-you"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 text-center"
                >
                    <div className="bg-[#6B498F]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-[#6B498F]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-[#4b2c5e] mb-4">Hvala Vam, {userName}!</h2>
                    <p className="text-[#6B498F] mb-6">
                        Ove informacije će nam pomoći da prilagodimo Vaše iskustvo čitanja.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-colors"
                    >
                        Pristupi knjizi i materijalima
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </motion.div>
            );
        }

        // Otherwise render the current step
        return renderStep();
    };

    // Define current step config before the return statement
    const currentStepConfig = onboardingSteps[step];
    const isCurrentStepValid = validateCurrentStep();
    const isLastStep = step === onboardingSteps.length - 1;

    // Show loading indicator while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6B498F]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />

            <div className="container mx-auto px-4 py-10 md:py-20 relative z-10">
                <div className="max-w-2xl mx-auto">
                    {/* Progress bar */}
                    <div className="mb-12">
                        <div className="relative mb-4">
                            <div className="h-1.5 w-full bg-[#D4B5A0]/40 rounded-full absolute top-3.5" />
                            <div
                                className="h-1.5 rounded-full absolute top-3.5 bg-gradient-to-r from-[#6B498F] to-[#a074c7] transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(100, (step / (onboardingSteps.length - 1)) * 100)}%` }}
                            />
                            <div className="flex justify-between relative">
                                {onboardingSteps.map((_, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${index < step
                                                ? 'bg-[#6B498F] text-white'
                                                : index === step
                                                    ? 'bg-[#6B498F] ring-4 ring-[#6B498F]/30 shadow-lg text-white'
                                                    : 'bg-[#FFEAFF] text-[#6B498F]/50'
                                                }`}
                                        >
                                            {index < step ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <span className="text-xs font-medium">{index + 1}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between px-1 text-sm text-[#6B498F]">
                            <span className="font-medium">Korak {step + 1} od {onboardingSteps.length}</span>
                            <span className="text-[#6B498F] font-medium">{Math.floor((step / (onboardingSteps.length - 1)) * 100)}% završeno</span>
                        </div>
                    </div>

                    {step === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-[#FFEAFF]/60 border border-[#D4B5A0]/40 rounded-xl p-6 mb-6"
                        >
                            <h3 className="text-xl font-medium text-[#4b2c5e] mb-3">Dragi čitatelju, hvala Vam na kupnji moje knjige! 💜</h3>
                            <p className="text-[#6B498F] mb-3">
                                Trenutno radim na novom poglavlju i željela bih bolje upoznati svoje čitatelje.
                            </p>
                            <p className="text-[#6B498F] mb-3">
                                Bila bih Vam jako zahvalna ako možete odvojiti 3-5 minuta i podijeliti svoje
                                misli sa mnom kroz nekoliko pitanja. Vaši odgovori će mi pomoći da bolje razumijem
                                Vaše potrebe i prilagodim sadržaj budućih poglavlja.
                            </p>
                            <p className="text-[#6B498F] italic">
                                S poštovanjem,<br />
                                <span className="font-semibold text-[#6B498F]">Kristina Mitrović</span>
                            </p>
                        </motion.div>
                    )}

                    <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 mb-6 min-h-[200px]">
                        <AnimatePresence mode="wait">
                            {renderContent()}
                        </AnimatePresence>
                    </div>

                    {!isSubmitted && step < onboardingSteps.length && !isAnimating && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="flex flex-col gap-4 mt-6"
                            >
                                {currentStepConfig.type !== 'select' && (
                                    <button
                                        onClick={isCurrentStepValid ? handleNext : handleDisabledClick}
                                        disabled={isSubmitting}
                                        className={`flex items-center justify-center px-6 py-4 rounded-lg transition-colors w-full ${isCurrentStepValid
                                            ? 'bg-[#6B498F] hover:bg-[#4b2c5e] text-white font-medium shadow-md'
                                            : 'bg-[#D4B5A0]/20 text-[#6B498F]/60 cursor-pointer border border-[#D4B5A0]/40'
                                            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting && isLastStep ? (
                                            <>
                                                <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                                <span>Obrađujem...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{isLastStep ? 'Završi' : 'Dalje'}</span>
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </button>
                                )}

                                {validationError && !isCurrentStepValid && currentStepConfig.type !== 'select' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] text-sm sm:max-w-md"
                                    >
                                        {validationError}
                                    </motion.div>
                                )}

                                {submitError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] text-sm w-full"
                                    >
                                        <p className="font-medium mb-1">Greška:</p>
                                        <p>{submitError}</p>
                                        <p className="mt-2 text-xs">Molimo pokušajte ponovno ili kontaktirajte podršku ako problem i dalje postoji.</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage; 