'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock } from 'lucide-react';
import Cookies from 'js-cookie';
import { UserContextData } from '@repo/ui/lib/types';

const ExitPopup = ({ userContext }: { userContext: UserContextData | null })  => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasShownThisSession, setHasShownThisSession] = useState(false);
    const isLoggedIn = userContext?.isAuthenticated || false;

    const hasSeenPopupRecently = useCallback(() => {
        return Boolean(Cookies.get('exit_popup_shown'));
    }, []);

    const handleExitIntent = useCallback((e: MouseEvent) => {
        if (hasShownThisSession || isLoggedIn || hasSeenPopupRecently())
            return;

        // Only show if:
        // 1. Mouse leaves through the top of the page
        // 2. Not at the edges (where menu bars often are)
        // 3. Not currently visible
        if (e.clientY <= 0 && e.clientX > 50 && e.clientX < window.innerWidth - 50 && !isVisible) {

            // Set cookie to track that user has seen the popup (expires in 24 hours)
            Cookies.set('exit_popup_shown', 'true', { expires: 1 });

            setIsVisible(true);
            setHasShownThisSession(true);
        }
    }, [isVisible, hasShownThisSession, isLoggedIn, hasSeenPopupRecently]);

    useEffect(() => {
        if (isVisible || hasShownThisSession || isLoggedIn || hasSeenPopupRecently())
            return;

        // Add the event listener
        document.addEventListener('mouseleave', handleExitIntent);

        // Cleanup
        return () => {
            document.removeEventListener('mouseleave', handleExitIntent);
        };
    }, [isVisible, handleExitIntent, hasShownThisSession, isLoggedIn, hasSeenPopupRecently]);

    if (!isVisible || isLoggedIn)
        return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 bg-[#4b2c5e]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setIsVisible(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative max-w-2xl w-full bg-[#FFF9E9] rounded-2xl p-8 border border-[#E1CCEB]/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute -top-3 -right-3 bg-[#6B498F] p-2 rounded-lg hover:bg-[#4b2c5e] transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-8 h-8 text-[#6B498F]" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            <span className="text-[#4b2c5e]">Pričekajte! Posebna ponuda</span>
                            <br />
                            <span className="text-[#6B498F]">samo za Vas</span>
                        </h2>
                        <p className="text-[#4b2c5e]/80 text-lg">
                            Otkrijte kako razumjeti skrivene obrasce u vezama i transformirajte svoju ljubavnu priču u samo 21 dan uz revolucionarni pristup koji 93% žena nikada nije čulo!
                        </p>
                    </div>

                    <div className="bg-[#E1CCEB]/40 p-4 rounded-lg border border-[#E1CCEB]/50 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-[#6B498F]" />
                            <h4 className="font-semibold text-[#4b2c5e]">Dobit ćete bonus poglavlje:</h4>
                        </div>
                        <p className="text-[#4b2c5e]/80 text-sm mt-2">
                            Naučite tehnike regulacije živčanog sustava koje vam pomažu ostati smireni u trenucima konflikta i stvoriti dublje emocionalne veze. Ponuda vrijedi samo danas {new Date().toLocaleDateString('hr-HR', { day: 'numeric', month: 'long' })}.
                        </p>
                    </div>

                    <div className="text-center space-y-4">
                        <button
                            className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform"
                            onClick={() => {
                                const orderForm = document.getElementById('order-form');
                                if (orderForm) {
                                    orderForm.scrollIntoView({ behavior: 'smooth' });
                                }
                                setIsVisible(false);
                            }}
                        >
                            Da, želim knjigu odmah! →
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ExitPopup;