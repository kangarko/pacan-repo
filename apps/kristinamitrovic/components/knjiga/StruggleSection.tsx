'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';

const StruggleSection = () => {
    return (
        <div className="bg-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-[#E1CCEB]/30 px-6 py-2 rounded-full mb-6">
                            <Heart className="w-4 h-4 text-[#6B498F]" />
                            <span className="text-sm font-medium text-[#6B498F]">
                                Prepoznajete li se?
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-[#4b2c5e] mb-6">
                            Ako se borite s nesigurnim obrascima privrženosti...
                            <br />
                            <span className="text-[#6B498F]">ova knjiga je Vaš put do transformacije</span>
                        </h2>
                    </motion.div>

                    <div className="gap-12 items-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            {[
                                {
                                    before: "Stalna anksioznost i strah od napuštanja",
                                    after: "Unutarnji mir i sigurnost u vezama"
                                },
                                {
                                    before: "Teškoće s postavljanjem granica",
                                    after: "Jasne granice bez osjećaja krivnje"
                                },
                                {
                                    before: "Samosabotaža u odnosima",
                                    after: "Zdrave veze pune povjerenja"
                                },
                                {
                                    before: "Emocionalna nestabilnost",
                                    after: "Stabilnost i emocionalna regulacija"
                                }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="bg-[#F1BBB0]/20 p-4 rounded-xl flex-1">
                                        <p className="text-red-800">{item.before}</p>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-[#6B498F] flex-shrink-0" />
                                    <div className="bg-green-500/10 p-4 rounded-xl flex-1">
                                        <p className="text-green-800">{item.after}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StruggleSection;