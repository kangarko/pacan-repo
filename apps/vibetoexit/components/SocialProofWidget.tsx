'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, CheckCircle } from 'lucide-react';
import { UserContextData } from '@repo/ui/lib/types';

// Data for social proof
const names = [
    'Alex', 'Samantha', 'Mike', 'Jessica', 'Chris', 'Emily', 'David', 'Sarah', 'Ryan', 'Laura',
    'Ben', 'Olivia', 'Tom', 'Chloe', 'James', 'Sophia', 'Dan', 'Grace', 'Matt', 'Zoe',
    'Juan', 'Maria', 'Chen', 'Yuki', 'Mohammed', 'Fatima', 'Lars', 'Hanna', 'Giorgio', 'Giulia'
];

const cities = [
    // 80% Native English Speaking Tier 1
    { name: 'New York', country: 'USA' },
    { name: 'Los Angeles', country: 'USA' },
    { name: 'Chicago', country: 'USA' },
    { name: 'Houston', country: 'USA' },
    { name: 'Phoenix', country: 'USA' },
    { name: 'Philadelphia', country: 'USA' },
    { name: 'San Antonio', country: 'USA' },
    { name: 'San Diego', country: 'USA' },
    { name: 'Dallas', country: 'USA' },
    { name: 'San Jose', country: 'USA' },
    { name: 'Austin', country: 'USA' },
    { name: 'Seattle', country: 'USA' },
    { name: 'Boston', country: 'USA' },
    { name: 'Denver', country: 'USA' },
    { name: 'London', country: 'UK' },
    { name: 'Manchester', country: 'UK' },
    { name: 'Birmingham', country: 'UK' },
    { name: 'Glasgow', country: 'UK' },
    { name: 'Edinburgh', country: 'UK' },
    { name: 'Toronto', country: 'Canada' },
    { name: 'Montreal', country: 'Canada' },
    { name: 'Vancouver', country: 'Canada' },
    { name: 'Calgary', country: 'Canada' },
    { name: 'Ottawa', country: 'Canada' },
    { name: 'Sydney', country: 'Australia' },
    { name: 'Melbourne', country: 'Australia' },
    { name: 'Brisbane', country: 'Australia' },
    { name: 'Perth', country: 'Australia' },
    { name: 'Adelaide', country: 'Australia' },
    { name: 'Dublin', country: 'Ireland' },
    { name: 'Cork', country: 'Ireland' },
    { name: 'Auckland', country: 'New Zealand' },
    // 20% Other Tier 1
    { name: 'Berlin', country: 'Germany' },
    { name: 'Munich', country: 'Germany' },
    { name: 'Paris', country: 'France' },
    { name: 'Amsterdam', country: 'Netherlands' },
    { name: 'Stockholm', country: 'Sweden' },
    { name: 'Tokyo', country: 'Japan' },
    { name: 'Singapore', country: 'Singapore' },
    { name: 'Seoul', country: 'South Korea' },
];

const actions = [
    'registered for the workshop!'
];

const formatTimeAgo = (minutes: number) => {
    if (minutes < 60) {
        return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes < 10) {
        return `${hours}h ago`;
    }
    return `${hours}h ${remainingMinutes}m ago`;
};

const SocialProofWidget = ({ userContext }: { userContext: UserContextData | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentProof, setCurrentProof] = useState({ name: '', location: '', action: '', timeAgo: '' });

    const generateRandomProof = useCallback(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const randomAction = actions[0];
        const randomMinutes = Math.floor(Math.random() * (238)) + 2; // 2 to 240 minutes

        setCurrentProof({
            name: randomName,
            location: `${randomCity.name}, ${randomCity.country}`,
            action: randomAction,
            timeAgo: formatTimeAgo(randomMinutes)
        });
    }, []);

    useEffect(() => {
        let showTimeout: NodeJS.Timeout;
        let hideTimeout: NodeJS.Timeout;

        const showNotification = () => {
            generateRandomProof();
            setIsVisible(true);

            hideTimeout = setTimeout(() => {
                setIsVisible(false);
                const nextDelay = 10000 + Math.random() * 10000;
                showTimeout = setTimeout(showNotification, nextDelay);
            }, 6000);
        };

        const initialDelay = setTimeout(showNotification, 5000);

        return () => {
            clearTimeout(initialDelay);
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, [generateRandomProof]);

    return (
        <div className="fixed bottom-4 left-4 z-40">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl p-4 shadow-2xl max-w-xs md:max-w-sm flex items-center gap-4 border border-purple-500/30"
                    >
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm text-gray-100">
                                {currentProof.name}
                                <span className="text-gray-400 font-normal"> from </span>
                                {currentProof.location}
                            </p>
                            <p className="text-purple-300 text-xs font-medium">
                                {currentProof.action}
                            </p>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-400 text-xs">{currentProof.timeAgo}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    <span>Verified by Proof</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocialProofWidget; 