'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const RecognizeYourselfSection = () => {
    return (
        <div className="bg-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 bg-[#FFEAFF]/80 px-8 py-3 rounded-full mb-8 border border-[#E1CCEB]/50 backdrop-blur-sm">
                        <HelpCircle className="w-4 h-4 text-[#6B498F]" />
                        <span className="text-sm font-medium text-[#6B498F]">
                            Prepoznajte li se?
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-[#4b2c5e] mb-4 md:mb-6 leading-tight">
                        Prepoznajete li se u ovim situacijama?
                    </h2>
                    <p className="text-lg md:text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto leading-relaxed">
                        Ako se pronalazite u bilo kojoj od ovih situacija, ova knjiga je stvorena za Vas
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto space-y-4">
                    {[
                        "Često se prilagođavate partnerovim potrebama zanemarujući vlastite",
                        "Bojite se postaviti granice jer mislite da ćete biti napušteni",
                        "Osjećate da zaslužujete bolje, ali ne znate kako promijeniti obrasce",
                        "Stalno analizirate partnerove riječi i postupke tražeći znakove odbacivanja",
                        "Bojite se da niste dovoljno dobri za zdravu, ispunjavajuću vezu"
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl border border-[#E1CCEB]/50 p-6"
                        >
                            <div className="flex items-start gap-4">
                                <CheckCircle className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                <p className="text-[#4b2c5e] text-lg">{item}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mt-12"
                >
                    <button
                        onClick={scrollToOrderForm}
                        className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 mb-4 cursor-pointer"
                    >
                        Saznajte kako promijeniti ove obrasce →
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default RecognizeYourselfSection; 