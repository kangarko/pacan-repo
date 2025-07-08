'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const logos = [
    {
        name: "Hrvatsko psihološko društvo",
        url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&fit=crop&q=80"
    },
    {
        name: "Poliklinika za zaštitu djece i mladih",
        url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&fit=crop&q=80"
    },
    {
        name: "Hrvatska udruga za psihoterapiju",
        url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&fit=crop&q=80"
    },
    {
        name: "Centar za psihološko savjetovanje",
        url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&fit=crop&q=80"
    }
];

const FeaturedSection = () => {
    return (
        <div className="bg-gray-900/50 backdrop-blur-sm py-12">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-medium text-gray-400 mb-8">
                    VIĐENO U
                </p>

                <div className="flex items-center justify-center gap-8 md:gap-16">
                    <div className="flex items-center gap-8 md:gap-16 animate-scroll">
                        {logos.concat(logos).map((logo, index) => (
                            <motion.div
                                key={index}
                                className="flex-shrink-0 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all relative h-12 w-32"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Image
                                    src={logo.url}
                                    alt={logo.name}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="128px"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedSection;