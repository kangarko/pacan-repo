'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Award, BookOpen, Users, Star, Quote, Heart } from 'lucide-react';
import { COMPANY_INFO } from '@repo/ui/lib/types';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const AuthorSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                                <Image
                                    src="/img/kristina.jpg"
                                    alt={COMPANY_INFO.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9E9]/20 via-[#FFEAFF]/10 to-transparent" />
                            </div>

                            <div className="absolute -bottom-6 -right-6 bg-[#FFEAFF]/90 backdrop-blur-sm p-6 rounded-2xl border border-[#E1CCEB]/50">
                                <div className="flex items-center gap-2 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-[#4b2c5e]/80 text-sm mb-2">
                                    &quot;Razumijem sve o čemu pričate i pišete, jer sam liječnica i psihoterapeut. Vaša knjiga mi se učinila interesantnom za naručiti i koristiti u radu sa klijentima.&quot;
                                </p>
                                <p className="text-[#6B498F] text-xs">
                                    — Dr. Azra A., psihoterapeut
                                </p>
                            </div>

                            <div className="absolute -top-6 -left-6 bg-[#FFEAFF]/90 backdrop-blur-sm p-4 rounded-xl border border-[#E1CCEB]/50">
                                <div className="flex items-center gap-3">
                                    <Award className="w-8 h-8 text-[#6B498F]" />
                                    <div>
                                        <p className="text-[#4b2c5e] font-semibold">Nagrađivana stručnjakinja</p>
                                        <p className="text-sm text-[#6B498F]">za privrženost</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-[#4b2c5e] mb-6">
                                    Upoznajte Kristinu Mitrović
                                </h2>
                                <div className="prose">
                                    <p className="text-[#4b2c5e]/80 mb-6">
                                        Kao renomirana stručnjakinja za privrženost s više od 10 godina iskustva,
                                        posvetila sam svoj život pomaganju ženama da transformiraju svoje veze i
                                        pronađu emocionalnu slobodu koju zaslužuju.
                                    </p>
                                    <p className="text-[#4b2c5e]/80">
                                        Moje putovanje započelo je iz osobnog iskustva s nesigurnim stilom privrženosti.
                                        Kroz godine istraživanja i rada s tisućama klijentica, razvila sam jedinstvenu
                                        metodologiju koja dosljedno pomaže ženama transformirati njihove obrasce privrženosti.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: Users, number: "1,000+", label: "Transformiranih života" },
                                    { icon: BookOpen, number: "10+", label: "Godina iskustva" },
                                    { icon: Heart, number: "92%", label: "Upješnost" },
                                    { icon: Star, number: "4.85/5", label: "Ocjena klijentica" }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="bg-[#E1CCEB]/30 backdrop-blur-sm rounded-xl p-4 text-center border border-[#E1CCEB]/50"
                                    >
                                        <div className="bg-[#E1CCEB]/50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                                            <stat.icon className="w-6 h-6 text-[#6B498F]" />
                                        </div>
                                        <div className="text-2xl font-bold text-[#4b2c5e] mb-1">
                                            {stat.number}
                                        </div>
                                        <div className="text-sm text-[#6B498F]">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="bg-[#E1CCEB]/30 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                                <Quote className="w-8 h-8 text-[#6B498F] mb-4" />
                                <p className="text-[#4b2c5e]/80 text-lg mb-4">
                                    &quot;Moja misija je pomoći svakoj ženi da pronađe put do sigurne privrženosti i
                                    ispunjavajućih veza. Ova knjiga je sažetak svega što sam naučila kroz godine
                                    rada i istraživanja, predstavljen na način koji je praktičan i primjenjiv u
                                    stvarnom životu.&quot;
                                </p>
                                <p className="text-[#6B498F]">
                                    — Kristina Mitrović
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={scrollToOrderForm}
                                    className="flex-1 bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 text-center cursor-pointer"
                                >
                                    Započnite svoju transformaciju →
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthorSection;