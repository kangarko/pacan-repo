'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Brain, Heart, Shield, Users, Target, Sparkles } from 'lucide-react';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const ChaptersSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-6">
                        Vaš put do sigurne privrženosti
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Detaljni vodič kroz svako poglavlje Vaše transformacije
                    </p>
                </motion.div>

                {[
                    {
                        number: "01",
                        icon: Brain,
                        title: "Razumijevanje Vaših obrazaca",
                        description: "Otkrijte korijene svojih obrazaca privrženosti i kako oni utječu na Vaše veze",
                        points: [
                            "Znanstveno objašnjenje teorije privrženosti i kako se razvijaju različiti stilovi",
                            "Detaljna analiza četiri stila privrženosti i njihovih karakteristika",
                            "Praktični upitnik za identificiranje Vašeg dominantnog stila privrženosti",
                            "Razumijevanje kako Vaša prošla iskustva oblikuju trenutne odnose"
                        ],
                        image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80"
                    },
                    {
                        number: "02",
                        icon: Heart,
                        title: "Emocionalna regulacija i stabilnost",
                        description: "Savladajte tehnike za upravljanje emocionalnim reakcijama i anksioznošću u vezama",
                        points: [
                            "Napredne tehnike za smirivanje aktiviranog sustava privrženosti",
                            "Praktične vježbe za regulaciju živčanog sustava u stresnim situacijama",
                            "Strategije za prekidanje ciklusa anksioznosti i izbjegavanja",
                            "Mindfulness tehnike posebno prilagođene za nesigurne stilove privrženosti"
                        ],
                        image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80"
                    },
                    {
                        number: "03",
                        icon: Shield,
                        title: "Izgradnja zdravih granica",
                        description: "Naučite postaviti i održavati zdrave granice bez osjećaja krivnje ili straha",
                        points: [
                            "Kako prepoznati kada su Vaše granice narušene i što učiniti",
                            "Tehnike asertivne komunikacije za izražavanje svojih potreba",
                            "Praktična skripta za postavljanje granica u različitim situacijama",
                            "Strategije za nošenje s osjećajem krivnje pri postavljanju granica"
                        ],
                        image: "https://images.unsplash.com/photo-1525721653822-f9975a57cd4c?w=800&q=80"
                    },
                    {
                        number: "04",
                        icon: Target,
                        title: "Reprogramiranje uvjerenja",
                        description: "Transformirajte ograničavajuća uvjerenja koja sabotiraju Vaše veze",
                        points: [
                            "Identifikacija i transformacija negativnih uvjerenja o ljubavi i vezama",
                            "Tehnike kognitivne reprogramacije za stvaranje novih, zdravijih obrazaca",
                            "Vježbe za jačanje samopouzdanja i samopoštovanja",
                            "Alati za prevladavanje straha od intimnosti i ranjivosti"
                        ],
                        image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80"
                    },
                    {
                        number: "05",
                        icon: Users,
                        title: "Stvaranje sigurne povezanosti",
                        description: "Praktične strategije za izgradnju i održavanje duboke intimnosti",
                        points: [
                            "Tehnike za stvaranje emocionalne sigurnosti u vezama",
                            "Komunikacijski alati za produbljivanje povezanosti",
                            "Strategije za održavanje bliskosti bez gubitka sebe",
                            "Praktične vježbe za parove u procesu izgradnje sigurne povezanosti"
                        ],
                        image: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=800&q=80"
                    }
                ].map((chapter, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.2 }}
                        className="grid lg:grid-cols-2 gap-8 items-center mb-20 last:mb-0"
                    >
                        <div className={`space-y-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                            <div className="flex items-start gap-4">
                                <div className="bg-[#E1CCEB]/40 px-4 py-2 rounded-lg">
                                    <span className="text-2xl font-bold text-[#6B498F]">
                                        {chapter.number}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <chapter.icon className="w-6 h-6 text-[#6B498F]" />
                                        <h3 className="text-2xl font-bold text-[#4b2c5e]">
                                            {chapter.title}
                                        </h3>
                                    </div>
                                    <p className="text-[#4b2c5e]/80">
                                        {chapter.description}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {chapter.points.map((point, pointIndex) => (
                                    <div
                                        key={pointIndex}
                                        className="flex items-start gap-3 bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-4 border border-[#E1CCEB]/50"
                                    >
                                        <Sparkles className="w-5 h-5 text-[#6B498F] flex-shrink-0 mt-1" />
                                        <p className="text-[#4b2c5e]/80">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                                <Image
                                    src={chapter.image}
                                    alt={chapter.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9E9]/90 via-[#FFEAFF]/50 to-transparent" />

                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-[#FFEAFF]/90 backdrop-blur-sm p-2 rounded-lg">
                                            <chapter.icon className="w-5 h-5 text-[#6B498F]" />
                                        </div>
                                        <span className="text-sm font-medium text-[#4b2c5e]">
                                            Poglavlje {chapter.number}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-semibold text-[#4b2c5e] mb-2">
                                        {chapter.title}
                                    </h4>
                                    <p className="text-[#4b2c5e]/80 text-sm">
                                        {chapter.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mt-16"
                >
                    <button
                        onClick={scrollToOrderForm}
                        className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 cursor-pointer"
                    >
                        Započnite svoju transformaciju danas →
                    </button>
                    <p className="text-gray-500 mt-4">
                        Uključuje doživotni pristup i sve buduće nadogradnje
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ChaptersSection;