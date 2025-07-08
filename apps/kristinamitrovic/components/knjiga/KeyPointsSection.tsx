'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield as ShieldHeart, Brain, HeartPulse, Users } from 'lucide-react';

const KeyPointsSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#E1CCEB]/40 to-[#FFF9E9] py-24 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#E1CCEB]/40 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#F1BBB0]/30 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 bg-[#FFEAFF]/80 px-6 py-2 rounded-full mb-6">
                        <Users className="w-4 h-4 text-[#6B498F]" />
                        <span className="text-sm font-medium text-[#6B498F]">
                            Rezultati Istraživanja 2024
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#4b2c5e]">
                        Ključni elementi Vaše transformacije
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Prema istraživanju provedenom u 2024. godini na 1,000+ čitateljica, ove tehnike donose mjerljive rezultate u stvaranju sigurne i ispunjavajuće veze
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {[
                        {
                            icon: ShieldHeart,
                            title: "Postavljanje zdravih granica",
                            description: "Naučite postaviti granice s ljubavlju i razumijevanjem, bez osjećaja krivnje ili straha od odbacivanja. Otkrijte kako jasna komunikacija i poštovanje vlastitih potreba jača, a ne slabi Vaše veze.",
                            stats: [
                                { label: "Povećanje samopouzdanja", value: "73%" },
                                { label: "Smanjenje konflikata", value: "64%" }
                            ],
                            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
                        },
                        {
                            icon: Brain,
                            title: "Reprogramiranje uvjerenja",
                            description: "Identificirajte i transformirajte ograničavajuća uvjerenja koja sabotiraju Vaše veze. Usvojite novi, osnažujući način razmišljanja koji podržava zdrave odnose.",
                            stats: [
                                { label: "Poboljšanje samopouzdanja", value: "82%" },
                                { label: "Smanjenje negativnih misli", value: "68%" }
                            ],
                            image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80"
                        },
                        {
                            icon: HeartPulse,
                            title: "Regulacija živčanog sustava",
                            description: "Savladajte praktične tehnike za smirivanje anksioznosti i stresa u odnosima. Naučite kako ostati prisutni i povezani čak i u izazovnim situacijama.",
                            stats: [
                                { label: "Smanjenje anksioznosti", value: "76%" },
                                { label: "Bolja emocionalna regulacija", value: "85%" }
                            ],
                            image: "https://images.unsplash.com/photo-1604971666408-9dcd56ece0bf?w=800&q=80"
                        },
                        {
                            icon: Users,
                            title: "Zdrave strategije za veze",
                            description: "Razvijte vještine za stvaranje i održavanje duboke intimnosti. Naučite kako komunicirati svoje potrebe i želje na način koji jača povezanost.",
                            stats: [
                                { label: "Poboljšanje komunikacije", value: "89%" },
                                { label: "Povećanje intimnosti", value: "77%" }
                            ],
                            image: "https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=800&q=80"
                        }
                    ].map((point, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            className="group bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#E1CCEB]/50"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <Image
                                    src={point.image}
                                    alt={point.title}
                                    className="group-hover:scale-105 transition-transform duration-500"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute bottom-4 left-4 bg-[#FFEAFF]/90 p-3 rounded-xl">
                                    <point.icon className="w-6 h-6 text-[#6B498F]" />
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-2xl font-semibold mb-4 text-[#4b2c5e]">
                                    {point.title}
                                </h3>
                                <p className="text-[#4b2c5e]/80 mb-6">
                                    {point.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 relative">
                                    <div className="absolute -top-3 z-10 left-0 right-0 text-center">
                                        <span className="text-xs font-medium text-[#6B498F] bg-[#FFF9E9] px-3 py-1 rounded-full">
                                            Rezultati nakon 6 mjeseci
                                        </span>
                                    </div>
                                    {point.stats.map((stat, statIndex) => (
                                        <div
                                            key={statIndex}
                                            className="bg-[#E1CCEB]/40 rounded-lg p-6 text-center transform hover:scale-105 transition-transform duration-300"
                                        >
                                            <div className="text-3xl font-bold bg-gradient-to-r from-[#6B498F] to-[#F1BBB0] bg-clip-text text-transparent mb-2">
                                                {stat.value}
                                            </div>
                                            <div className="text-sm text-[#4b2c5e] font-medium">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-[#E1CCEB]/30 px-6 py-3 rounded-full">
                        <Users className="w-5 h-5 text-[#6B498F]" />
                        <span className="text-[#6B498F] font-medium">
                            Istraživanje provedeno na 1,000+ žena u Hrvatskoj tijekom 2024. godine
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default KeyPointsSection;