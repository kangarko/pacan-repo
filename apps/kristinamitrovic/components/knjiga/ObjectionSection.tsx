'use client';

import React from 'react';
import { ShieldCheck, BookCheck, HeartHandshake, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

const ObjectionSection = () => {
    return (
        <div className="bg-[#E1CCEB]/40 py-24 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234b2c5e' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        <span className="text-[#4b2c5e]">Ovo nije &quot;još jedna knjiga o vezama&quot;</span>
                        <br />
                        <span className="text-[#6B498F]">Ovo je Vaš put do transformacije</span>
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Zaboravite na površne savjete. Ova knjiga je rezultat godina istraživanja,
                        rada s klijentima i dubokog razumijevanja psihologije privrženosti.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Znanstveno utemeljena metodologija",
                            description: "Svaka tehnika i vježba bazirana je na najnovijim istraživanjima iz područja psihologije privrženosti i neuroznanosti."
                        },
                        {
                            icon: BookCheck,
                            title: "Praktični koraci i vježbe",
                            description: "Ne samo teorija - dobivate konkretne alate koje možete odmah početi primjenjivati u svojim odnosima."
                        },
                        {
                            icon: HeartHandshake,
                            title: "Personalizirani pristup",
                            description: "Knjiga Vas vodi kroz proces koji je prilagođen Vašem jedinstvenom stilu privrženosti i životnoj situaciji."
                        },
                        {
                            icon: Lightbulb,
                            title: "Dubinska transformacija",
                            description: "Fokus nije samo na simptomima, već na korjenu Vaših obrazaca u odnosima za dugotrajnu promjenu."
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-6 border border-[#E1CCEB]/50"
                        >
                            <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                                <item.icon className="w-8 h-8 text-[#6B498F]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-[#4b2c5e]">{item.title}</h3>
                            <p className="text-[#4b2c5e]/80">{item.description}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 bg-[#E1CCEB]/30 px-6 py-3 rounded-full"
                    >
                        <span className="text-[#6B498F] font-medium">
                            🎯 Preko 1,000+ žena već je transformiralo svoje veze uz pomoć ove metodologije
                        </span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ObjectionSection;