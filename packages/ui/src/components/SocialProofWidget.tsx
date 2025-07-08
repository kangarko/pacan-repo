'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { UserContextData } from '@repo/ui/lib/types';

// Croatian cities with coordinates
const hrCities = [
    { name: 'Zagreb', lat: 45.8150, lon: 15.9819 },
    { name: 'Split', lat: 43.5081, lon: 16.4402 },
    { name: 'Rijeka', lat: 45.3271, lon: 14.4422 },
    { name: 'Osijek', lat: 45.5550, lon: 18.6955 },
    { name: 'Zadar', lat: 44.1194, lon: 15.2314 },
    { name: 'Pula', lat: 44.8666, lon: 13.8496 },
    { name: 'Varaždin', lat: 46.3057, lon: 16.3366 },
    { name: 'Šibenik', lat: 43.7342, lon: 15.8947 },
    { name: 'Dubrovnik', lat: 42.6507, lon: 18.0944 },
    { name: 'Karlovac', lat: 45.4929, lon: 15.5553 }
];

// Bosnian cities with coordinates
const baCities = [
    { name: 'Sarajevo', lat: 43.8563, lon: 18.4131 },
    { name: 'Banja Luka', lat: 44.7722, lon: 17.1910 },
    { name: 'Tuzla', lat: 44.5392, lon: 18.6757 },
    { name: 'Zenica', lat: 44.2015, lon: 17.9075 },
    { name: 'Mostar', lat: 43.3438, lon: 17.8078 },
    { name: 'Bijeljina', lat: 44.7583, lon: 19.2146 },
    { name: 'Brčko', lat: 44.8697, lon: 18.8102 },
    { name: 'Trebinje', lat: 42.7121, lon: 18.3437 },
    { name: 'Doboj', lat: 44.7318, lon: 18.0878 },
    { name: 'Prijedor', lat: 44.9799, lon: 16.7049 }
];

// Montenegro cities with coordinates
const meCities = [
    { name: 'Podgorica', lat: 42.4304, lon: 19.2594 },
    { name: 'Nikšić', lat: 42.7728, lon: 18.9445 },
    { name: 'Herceg Novi', lat: 42.4531, lon: 18.5375 },
    { name: 'Bar', lat: 42.0982, lon: 19.1000 },
    { name: 'Budva', lat: 42.2910, lon: 18.8401 },
    { name: 'Cetinje', lat: 42.3906, lon: 18.9142 },
    { name: 'Kotor', lat: 42.4254, lon: 18.7716 },
    { name: 'Tivat', lat: 42.4349, lon: 18.6963 },
    { name: 'Pljevlja', lat: 43.3567, lon: 19.3584 },
    { name: 'Ulcinj', lat: 41.9294, lon: 19.2244 }
];

// Serbian cities with coordinates
const rsCities = [
    { name: 'Beograd', lat: 44.7866, lon: 20.4489 },
    { name: 'Novi Sad', lat: 45.2671, lon: 19.8335 },
    { name: 'Niš', lat: 43.3209, lon: 21.8958 },
    { name: 'Kragujevac', lat: 44.0128, lon: 20.9114 },
    { name: 'Subotica', lat: 46.1005, lon: 19.6650 },
    { name: 'Zrenjanin', lat: 45.3828, lon: 20.3973 },
    { name: 'Pančevo', lat: 44.8708, lon: 20.6403 },
    { name: 'Čačak', lat: 43.8914, lon: 20.3497 },
    { name: 'Smederevo', lat: 44.6641, lon: 20.9280 },
    { name: 'Kraljevo', lat: 43.7256, lon: 20.6892 }
];

// Names by region
const hrNames = [
    'Ana', 'Marija', 'Ivana', 'Marina', 'Petra', 'Sara', 'Maja', 'Nina', 'Lea', 'Lana',
    'Iva', 'Elena', 'Mia', 'Tea', 'Lucija', 'Karla', 'Dora', 'Ema', 'Laura', 'Tara'
];

const baNames = [
    'Amina', 'Lejla', 'Emina', 'Ajla', 'Selma', 'Amra', 'Minela', 'Merima', 'Lamija', 'Elma',
    'Jasmina', 'Amela', 'Hana', 'Aida', 'Ena', 'Alma', 'Ilda', 'Melisa', 'Dženana', 'Belma'
];

const meNames = [
    'Jovana', 'Milica', 'Dragana', 'Marija', 'Jelena', 'Ivana', 'Anđela', 'Ana', 'Nina', 'Sara',
    'Maja', 'Tijana', 'Kristina', 'Tamara', 'Teodora', 'Katarina', 'Milena', 'Nevena', 'Danijela', 'Nikolina'
];

const rsNames = [
    'Jovana', 'Marija', 'Milica', 'Ana', 'Jelena', 'Aleksandra', 'Kristina', 'Katarina', 'Dragana', 'Ivana',
    'Teodora', 'Sofija', 'Sara', 'Isidora', 'Nataša', 'Mila', 'Nina', 'Tamara', 'Snežana', 'Sanja'
];

// Purchase time mapping (minutes ago) for each name by region
const hrPurchaseTimes: Record<string, number> = {
    'Ana': 3, 'Marija': 7, 'Ivana': 12, 'Marina': 5, 'Petra': 8, 'Sara': 14, 'Maja': 4, 'Nina': 9,
    'Lea': 6, 'Lana': 11, 'Iva': 2, 'Elena': 15, 'Mia': 8, 'Tea': 10, 'Lucija': 5, 'Karla': 7,
    'Dora': 13, 'Ema': 4, 'Laura': 9, 'Tara': 6
};

const baPurchaseTimes: Record<string, number> = {
    'Amina': 4, 'Lejla': 8, 'Emina': 11, 'Ajla': 3, 'Selma': 9, 'Amra': 5, 'Minela': 13, 'Merima': 7,
    'Lamija': 10, 'Elma': 6, 'Jasmina': 14, 'Amela': 5, 'Hana': 9, 'Aida': 12, 'Ena': 4, 'Alma': 8,
    'Ilda': 6, 'Melisa': 11, 'Dženana': 7, 'Belma': 3
};

const mePurchaseTimes: Record<string, number> = {
    'Jovana': 5, 'Milica': 8, 'Dragana': 12, 'Marija': 4, 'Jelena': 10, 'Ivana': 6, 'Anđela': 13, 'Ana': 7,
    'Nina': 9, 'Sara': 5, 'Maja': 11, 'Tijana': 3, 'Kristina': 14, 'Tamara': 6, 'Teodora': 8, 'Katarina': 4,
    'Milena': 10, 'Nevena': 7, 'Danijela': 15, 'Nikolina': 5
};

const rsPurchaseTimes: Record<string, number> = {
    'Jovana': 6, 'Marija': 9, 'Milica': 4, 'Ana': 11, 'Jelena': 7, 'Aleksandra': 13, 'Kristina': 5, 'Katarina': 8,
    'Dragana': 10, 'Ivana': 3, 'Teodora': 12, 'Sofija': 5, 'Sara': 7, 'Isidora': 14, 'Nataša': 6, 'Mila': 9,
    'Nina': 4, 'Tamara': 10, 'Snežana': 8, 'Sanja': 5
};

interface RegionData {
    cities: Array<{ name: string; lat: number; lon: number; }>;
    names: Array<string>;
    purchaseTimes: Record<string, number>;
}

// Map regions to their respective data
const regionData: Record<string, RegionData> = {
    'HR': { cities: hrCities, names: hrNames, purchaseTimes: hrPurchaseTimes },
    'BA': { cities: baCities, names: baNames, purchaseTimes: baPurchaseTimes },
    'ME': { cities: meCities, names: meNames, purchaseTimes: mePurchaseTimes },
    'RS': { cities: rsCities, names: rsNames, purchaseTimes: rsPurchaseTimes }
};

const SocialProofWidget = ({ userContext }: { userContext: UserContextData | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentPurchase, setCurrentPurchase] = useState({
        name: '',
        city: '',
        lat: 0,
        lon: 0,
        minutesAgo: 0
    });

    const getRegionData = useCallback((): RegionData => {
        const region = userContext?.region || '';

        if (!region || !regionData[region]) {
            // Fall back to Croatia if region not available or not supported
            return regionData['HR'];
        }
        return regionData[region];
    }, [userContext]);

    useEffect(() => {
        // Initialize with random data from the appropriate region
        const { cities, names, purchaseTimes } = getRegionData();
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];

        setCurrentPurchase({
            name: randomName,
            city: randomCity.name,
            lat: randomCity.lat,
            lon: randomCity.lon,
            minutesAgo: purchaseTimes[randomName] || 5 // Fallback to 5 minutes if no mapping exists
        });
    }, [userContext, getRegionData]); // Re-initialize when userContext changes

    useEffect(() => {
        let showTimeout: NodeJS.Timeout;
        let hideTimeout: NodeJS.Timeout;

        // Function to show notification
        const showNotification = () => {
            const { cities, names, purchaseTimes } = getRegionData();
            const randomName = names[Math.floor(Math.random() * names.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];

            setCurrentPurchase({
                name: randomName,
                city: randomCity.name,
                lat: randomCity.lat,
                lon: randomCity.lon,
                minutesAgo: purchaseTimes[randomName] || 5 // Fallback to 5 minutes if no mapping exists
            });
            setIsVisible(true);

            // Hide after 5 seconds
            hideTimeout = setTimeout(() => {
                setIsVisible(false);

                // Schedule next notification after random delay (10-20 seconds)
                const nextDelay = 10000 + Math.random() * 10000;
                showTimeout = setTimeout(showNotification, nextDelay);
            }, 5000);
        };

        // Initial show after 3 seconds
        const initialDelay = setTimeout(() => {
            showNotification();
        }, 3000);

        return () => {
            clearTimeout(initialDelay);
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, [userContext, getRegionData]); // Re-initialize when userContext changes

    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+7c3aed(${currentPurchase.lon},${currentPurchase.lat})/${currentPurchase.lon},${currentPurchase.lat},11,0,0/80x80@2x?access_token=pk.eyJ1Ijoia2FuZ2Fya28iLCJhIjoiY203ZzVhbHF5MDdqajJqc2hqd2s4bG93NiJ9.ULrPWR8V_tPwY7lbritXwA&attribution=false&logo=false`;

    return (
        <div className="fixed bottom-4 left-4 z-40">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: -50, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -50, y: 0 }}
                        className="bg-[#6B498F] text-white rounded-[20px] p-5 shadow-xl max-w-xs md:max-w-sm flex items-center gap-5"
                    >
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
                            <Image
                                src={mapUrl}
                                alt={`Map of ${currentPurchase.city}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="rounded-[100%]"
                                sizes="64px"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="font-medium text-sm">
                                    {currentPurchase.name} <span className="text-white/60">iz grada</span> {currentPurchase.city}
                                </p>
                            </div>
                            <p className="text-white/80 text-xs">
                                upravo je kupila knjigu
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-white">
                                    prije {currentPurchase.minutesAgo}min
                                </p>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                    <span className="text-xs text-white">Potvrđeno od Proof</span>
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