'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, ArrowRight, Banknote } from 'lucide-react';

const GuaranteeSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#E1CCEB]/40 to-[#FFF9E9] py-16 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-[#FFEAFF]/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#E1CCEB]/50">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl font-bold text-[#4b2c5e] mb-4">
                                30-dnevno jamstvo povrata novca
                            </h2>
                            <p className="text-[#4b2c5e]/80 text-lg mb-6">
                                Toliko sam sigurna da će Vam ova knjiga pomoći transformirati Vaše veze, da Vam nudim bezrizično jamstvo povrata novca. Bez pitanja, bez komplikacija.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                    <p className="text-[#4b2c5e]/80">
                                        <strong className="text-[#4b2c5e]">30 dana za testiranje</strong>
                                        {" "}metodologije i primjenu tehnika
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                    <p className="text-[#4b2c5e]/80">
                                        <strong className="text-[#4b2c5e]">Bezuvjetni povrat novca</strong>
                                        {" "}ako niste potpuno zadovoljni rezultatima
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ArrowRight className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                    <p className="text-[#4b2c5e]/80">
                                        <strong className="text-[#4b2c5e]">Bez rizika za Vas</strong>
                                        {" "}100% garancija zadovoljstva
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative bg-[#E1CCEB]/40 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 text-center">
                                <div className="bg-[#E1CCEB]/50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <div className="absolute inset-0 bg-[#F1BBB0]/30 rounded-full animate-pulse"></div>
                                    <Banknote className="w-16 h-16 text-[#6B498F] relative z-10" />
                                </div>
                                <p className="text-2xl font-bold text-[#4b2c5e] mb-3">
                                    100% povrat novca
                                </p>
                                <p className="text-[#4b2c5e]/80">
                                    &quot;Ako iz bilo kojeg razloga niste zadovoljni, jednostavno me kontaktirajte unutar 30 dana i dobit ćete puni povrat novca.&quot;
                                </p>
                                <p className="text-[#6B498F] mt-4 text-sm">
                                    — Kristina Mitrović
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuaranteeSection;