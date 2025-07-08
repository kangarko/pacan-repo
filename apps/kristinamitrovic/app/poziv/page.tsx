'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import GradientBackground from '@repo/ui/components/GradientBackground';
import Script from 'next/script';

const BookCallPage = () => {
    return (
        <div className="min-h-screen relative py-8 md:py-24 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mx-auto"
                >
                    <div className="text-center mb-8">
                        <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-[#6B498F]" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-[#4b2c5e] mb-4">
                            Zakažite razgovor
                        </h1>
                        <p className="text-xl text-[#4b2c5e]/80 max-w-2xl mx-auto">
                            Odaberite termin koji Vam najbolje odgovara
                        </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto">
                        <div 
                            className="calendly-inline-widget" 
                            data-url="https://calendly.com/kristina-kristinamitrovic/poziv?hide_event_type_details=1&hide_gdpr_banner=1"
                            style={{ minWidth: '320px', height: '700px' }}
                        />
                        <Script 
                            type="text/javascript" 
                            src="https://assets.calendly.com/assets/external/widget.js" 
                            strategy="afterInteractive"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BookCallPage; 