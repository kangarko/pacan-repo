'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { Offer, UserContextData } from '@repo/ui/lib/types';
import { getDiscountPercent } from '@repo/ui/lib/utils';
import { formatFullPrice } from '@repo/ui/lib/utils';
import { formatDiscountedPriceForCurrentUser, scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const CTASection = ({ offer, userContext }: { offer: Offer | null, userContext: UserContextData | null }) => {
    const region = userContext?.region;

    const discountedPrice = offer && region ? formatDiscountedPriceForCurrentUser(offer, region, "CTASection") : '...';
    const fullPrice = offer && region ? formatFullPrice(offer, region) : '...';
    const discountPercent = offer && region ? getDiscountPercent(offer, region) : '...';

    return (
        <div className="py-16 bg-[#6B498F] relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto bg-white backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-purple-500/20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-purple-500/20 px-6 py-2 rounded-full mb-6">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Posebna ponuda - Ograničeno vrijeme
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Započnite svoju transformaciju već danas
                        </h2>
                        <p className="text-xl">
                            Ne dopustite da Vas nesigurni obrasci privrženosti još jedan dan drže zarobljenom
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[
                            {
                                icon: Sparkles,
                                title: "Trenutni Pristup",
                                description: "Započnite s transformacijom odmah nakon kupnje"
                            },
                            {
                                icon: ShieldCheck,
                                title: "100% Sigurno",
                                description: "Zaštićeno plaćanje i 30-dnevno jamstvo povrata novca"
                            },
                            {
                                icon: Clock,
                                title: "Doživotni Pristup",
                                description: "Uključujući sve buduće nadogradnje i bonus materijale"
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
                                <div className="bg-purple-600/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="text-3xl font-bold">{discountedPrice}</span>
                            <span className="text-lg line-through">{fullPrice}</span>
                            <span className="bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                                Ušteda {discountPercent}%
                            </span>
                        </div>

                        <button
                            onClick={scrollToOrderForm}
                            className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 mb-4 cursor-pointer"
                        >
                            Naručite knjigu odmah →
                        </button>

                        <p className="text-sm text-gray-500">
                            🔒 Sigurno plaćanje • Trenutni pristup • 30-dnevno jamstvo povrata novca
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CTASection;