'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Zap } from 'lucide-react';
import Cookies from 'js-cookie';
import { UserContextData } from '@repo/ui/lib/types';

const ExitPopup = ({ userContext }: { userContext: UserContextData | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasShownThisSession, setHasShownThisSession] = useState(false);
    const isLoggedIn = userContext?.isAuthenticated || false;

    const hasSeenPopupRecently = useCallback(() => {
        return Boolean(Cookies.get('exit_popup_shown_vibe'));
    }, []);

    const handleExitIntent = useCallback((e: MouseEvent) => {
        if (hasShownThisSession || isLoggedIn || hasSeenPopupRecently())
            return;

        if (e.clientY <= 0 && e.clientX > 50 && e.clientX < window.innerWidth - 50 && !isVisible) {
            Cookies.set('exit_popup_shown_vibe', 'true', { expires: 1 });
            setIsVisible(true);
            setHasShownThisSession(true);
        }
    }, [isVisible, hasShownThisSession, isLoggedIn, hasSeenPopupRecently]);

    useEffect(() => {
        if (isVisible || hasShownThisSession || isLoggedIn || hasSeenPopupRecently())
            return;

        document.addEventListener('mouseleave', handleExitIntent);

        return () => {
            document.removeEventListener('mouseleave', handleExitIntent);
        };
    }, [isVisible, handleExitIntent, hasShownThisSession, isLoggedIn, hasSeenPopupRecently]);

    if (!isVisible || isLoggedIn)
        return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setIsVisible(false)}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative max-w-lg w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-purple-500/30 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute -top-3 -right-3 bg-purple-600 p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="text-center mb-6">
                        <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/50">
                            <Mic className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            Don&apos;t Miss The Workshop!
                        </h2>
                        <p className="text-gray-300 text-lg">
                            Your step-by-step playbook to building and exiting a <span className="font-semibold text-white">$10k/mo AI SaaS</span> is one click away.
                        </p>
                    </div>

                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/70 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h4 className="font-semibold text-white">On the workshop, you&apos;ll learn:</h4>
                        </div>
                        <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
                            <li>How to find a profitable SaaS idea with AI.</li>
                            <li>Build a complete MVP without writing code.</li>
                            <li>The exact roadmap to go from 0 to $10-40k/mo.</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                            onClick={() => {
                                const registrationForm = document.getElementById('registration-form');
                                if (registrationForm) {
                                    registrationForm.scrollIntoView({ behavior: 'smooth' });
                                }
                                setIsVisible(false);
                            }}
                        >
                            Save My Spot
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ExitPopup; 