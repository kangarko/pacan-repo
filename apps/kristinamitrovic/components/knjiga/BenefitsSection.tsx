'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Shield, Brain, Sparkles, Target, Zap } from 'lucide-react';

const benefits = [
    {
        icon: Heart,
        title: "Oslobodite se anksioznosti u vezama",
        description: "Naučite tehnike za smirivanje aktiviranog sustava privrženosti i stvaranje emocionalne stabilnosti - čak i u stresnim situacijama.",
        image: "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=500&q=80"
    },
    {
        icon: Shield,
        title: "Izgradite zdrave granice",
        description: "Otkrijte kako postaviti čvrste granice bez osjećaja krivnje i naučite komunicirati svoje potrebe s samopouzdanjem.",
        image: "https://images.unsplash.com/photo-1525721653822-f9975a57cd4c?w=500&q=80"
    },
    {
        icon: Brain,
        title: "Reprogramirajte svoj um",
        description: "Usvojite praktične tehnike za promjenu negativnih uvjerenja i stvaranje novih, zdravijih obrazaca razmišljanja o vezama.",
        image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&q=80"
    },
    {
        icon: Sparkles,
        title: "Razvijte emocionalnu inteligenciju",
        description: "Naučite prepoznati i upravljati svojim emocijama te bolje razumjeti i povezati se s partnerom na dubljoj razini.",
        image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&q=80"
    },
    {
        icon: Target,
        title: "Stvorite dugotrajnu intimnost",
        description: "Savladajte vještine za izgradnju i održavanje duboke emocionalne povezanosti koja traje.",
        image: "https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=500&q=80"
    },
    {
        icon: Zap,
        title: "Aktivirajte svoj potencijal",
        description: "Otkrijte kako Vaš stil privrženosti može postati Vaša snaga, a ne prepreka u stvaranju zdravih odnosa.",
        image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=500&q=80"
    }
];

const BenefitsSection = () => {
    return (
        <section className="bg-gradient-to-b from-[#FFF9E9] to-[#FFEAFF]/40 py-24 relative overflow-hidden">
            {/* Simplified Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-72 h-72 bg-[#E1CCEB]/30 rounded-full blur-3xl transform-gpu" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F1BBB0]/30 rounded-full blur-3xl transform-gpu" />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        <span className="text-[#6B498F]">Prestanite se boriti</span>
                        <br />
                        <span className="text-[#4b2c5e]">
                            s nesigurnim obrascima privrženosti
                        </span>
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Naučite kako prepoznati i transformirati obrasce koji Vas sprječavaju
                        da ostvarite duboku, ispunjavajuću vezu koju zaslužujete
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((item, index) => (
                        <motion.article
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="group relative backdrop-blur-sm rounded-2xl overflow-hidden border border-[#E1CCEB]/50"
                        >
                            <div className="absolute inset-0">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    className="opacity-10 group-hover:opacity-30 transition-opacity duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                                />
                            </div>

                            <div className="relative p-8">
                                <div className="bg-[#E1CCEB]/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#E1CCEB]/70 transition-colors duration-300">
                                    <item.icon className="w-8 h-8 text-[#6B498F]" />
                                </div>

                                <h3 className="text-xl font-semibold mb-4 text-[#4b2c5e] group-hover:text-[#6B498F] transition-colors duration-300">
                                    {item.title}
                                </h3>

                                <p className="text-[#4b2c5e]/80">
                                    {item.description}
                                </p>
                            </div>
                        </motion.article>
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
                        <span className="text-[#6B498F] font-medium">
                            💫 Pridružite se tisućama žena koje su već transformirale svoje veze
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default BenefitsSection;