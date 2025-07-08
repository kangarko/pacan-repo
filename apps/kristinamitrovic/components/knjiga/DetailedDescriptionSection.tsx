'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Brain, Heart, Shield, Quote } from 'lucide-react';
import { COMPANY_INFO } from '@repo/ui/lib/types';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const DetailedDescriptionSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#E1CCEB]/40 to-[#FFF9E9] py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center mb-16"
                    >
                        <div>
                            <div className="relative aspect-square rounded-2xl overflow-hidden mb-8">
                                <Image
                                    src="/img/kristina.jpg"
                                    alt={COMPANY_INFO.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9E9]/90 to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8">
                                    <Quote className="w-8 h-8 text-[#6B498F] mb-4" />
                                    <p className="text-[#4b2c5e] text-lg mb-4">
                                        &quot;Kroz godine rada s klijenticama, razvila sam metodologiju koja dosljedno pomaže ženama transformirati njihove obrasce privrženosti.&quot;
                                    </p>
                                    <p className="text-[#6B498F]">
                                        — {COMPANY_INFO.name}, Stručnjakinja za privrženost
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { number: "1,000+", label: "Zadovoljnih klijentica" },
                                    { number: "10+", label: "Godina iskustva" },
                                    { number: "92%", label: "Uspješnost metode" },
                                    { number: "4.89/5", label: "Prosječna ocjena" }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-4 text-center border border-[#E1CCEB]/50"
                                    >
                                        <div className="text-2xl font-bold text-[#4b2c5e] mb-1">
                                            {stat.number}
                                        </div>
                                        <div className="text-sm text-[#6B498F]">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-[#4b2c5e] mb-6">
                                    Znanstveno utemeljena metodologija za trajnu transformaciju
                                </h2>
                                <p className="text-[#4b2c5e]/80 mb-6">
                                    Kao istaknuta stručnjakinja za privrženost, razvila sam jedinstvenu metodologiju koja kombinira najnovija znanstvena istraživanja s praktičnim tehnikama koje možete odmah početi primjenjivati.
                                </p>
                            </div>

                            {[
                                {
                                    icon: Brain,
                                    title: "Neuroznanstveni pristup",
                                    description: "Razumjet ćete kako Vaš mozak stvara obrasce privrženosti i kako ih možete reprogramirati za zdravije veze."
                                },
                                {
                                    icon: Shield,
                                    title: "Dokazana metodologija",
                                    description: "Tehnike koje su pomogle tisućama žena transformirati svoje veze i izgraditi sigurnu privrženost."
                                },
                                {
                                    icon: Heart,
                                    title: "Praktične vježbe",
                                    description: "Svako poglavlje uključuje konkretne vježbe i alate koje možete odmah implementirati u svojim odnosima."
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: index * 0.2 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="bg-[#E1CCEB]/40 p-3 rounded-lg">
                                        <feature.icon className="w-6 h-6 text-[#6B498F]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-[#4b2c5e]">
                                            {feature.title}
                                        </h3>
                                        <p className="text-[#4b2c5e]/80">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <button
                            onClick={scrollToOrderForm}
                            className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 cursor-pointer"
                        >
                            Započnite svoju transformaciju →
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DetailedDescriptionSection;