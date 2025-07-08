'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { Offer, UserContextData } from '@repo/ui/lib/types';
import { formatFullPrice, getDiscountPercent } from '@repo/ui/lib/utils';
import { formatDiscountedPriceForCurrentUser, scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const BigCTASection = ({ offer, userContext }: { offer: Offer | null, userContext: UserContextData | null }) => {
    const region = userContext?.region;

    const discountedPrice = offer && region ? formatDiscountedPriceForCurrentUser(offer, region, "BigCTA") : '...';
    const fullPrice = offer && region ? formatFullPrice(offer, region) : '...';
    const discountPercent = offer && region ? getDiscountPercent(offer, region) : '...';

    return (
        <div className="bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto bg-[#FFEAFF]/50 backdrop-blur-sm rounded-3xl p-12 border border-[#E1CCEB]/50">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <div className="flex items-center justify-center gap-1 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                            ))}
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-6">
                            <>
                                Transformirajte svoje veze
                                <br />
                                <span className="text-[#6B498F]">već danas</span>
                            </>
                        </h2>
                        <p className="text-xl text-[#4b2c5e]/80 max-w-2xl mx-auto">
                            Pridružite se tisućama žena koje su već pronašle put do sigurne privrženosti i ispunjavajućih veza
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {[
                            {
                                icon: Sparkles,
                                title: "Trenutni pristup",
                                description: "Počnite čitati i primjenjivati tehnike odmah nakon kupnje"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Sigurna kupovina",
                                description: "Zaštićeno plaćanje i 30-dnevno jamstvo povrata novca"
                            },
                            {
                                icon: Clock,
                                title: "Ograničena ponuda",
                                description: "Posebna cijena dostupna samo kratko vrijeme"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="bg-[#E1CCEB]/50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-8 h-8 text-[#6B498F]" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#4b2c5e] mb-2">{feature.title}</h3>
                                <p className="text-[#4b2c5e]/80">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="text-4xl font-bold text-[#4b2c5e]">{discountedPrice}</span>
                            <span className="text-xl text-gray-500 line-through">{fullPrice}</span>
                            <span className="bg-[#E1CCEB]/50 px-4 py-2 rounded-full text-[#6B498F]">
                                Ušteda {discountPercent}%
                            </span>
                        </div>

                        <button
                            onClick={scrollToOrderForm}
                            className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-16 py-6 rounded-xl font-semibold text-xl transition-all transform hover:scale-105 mb-6 cursor-pointer"
                        >
                            Započnite svoju transformaciju →
                        </button>

                        <p className="text-gray-500">
                            🔒 Sigurno plaćanje • Trenutni pristup • 30-dnevno jamstvo povrata novca
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigCTASection;