'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Shield, Brain, Target, CheckCircle } from 'lucide-react';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const TargetAudienceSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#E1CCEB]/40 to-[#FFF9E9] py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#E1CCEB]/40 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#F1BBB0]/30 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#4b2c5e]">
                        Za koga je ova knjiga?
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Ako se pronalazite u bilo kojoj od ovih situacija, ova knjiga je stvorena posebno za Vas
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {[
                        {
                            icon: Heart,
                            image: "https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=800&q=80",
                            title: "Anksiozna privrženost",
                            points: [
                                "Stalno brinete da će Vas partner napustiti",
                                "Teško Vam je vjerovati partneru i osjećate nesigurnost",
                                "Pretjerano analizirate svaku interakciju",
                                "Često tražite potvrdu ljubavi i privrženosti"
                            ]
                        },
                        {
                            icon: Shield,
                            image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80",
                            title: "Izbjegavajuća privrženost",
                            points: [
                                "Teško Vam je otvoriti se i pokazati ranjivost",
                                "Držite emocionalnu distancu u vezama",
                                "Samostalnost Vam je izuzetno važna",
                                "Izbjegavate dublje emocionalno povezivanje"
                            ]
                        },
                        {
                            icon: Brain,
                            image: "https://images.unsplash.com/photo-1597347343908-2937e7dcc560?w=800&q=80",
                            title: "Dezorganizirana privrženost",
                            points: [
                                "Imate konfliktne osjećaje o intimnosti",
                                "Teško Vam je regulirati emocije u vezama",
                                "Oscilirate između potrebe za bliskošću i distance",
                                "Imate povijest kompleksnih odnosa"
                            ]
                        },
                        {
                            icon: Target,
                            image: "https://images.unsplash.com/photo-1741217531054-d00a1165dad5?w=800&q=80",
                            title: "Želite sigurnu privrženost",
                            points: [
                                "Spremni ste raditi na sebi i svojim odnosima",
                                "Želite razviti zdravije obrasce u vezama",
                                "Težite dubljoj emocionalnoj povezanosti",
                                "Želite prekinuti ciklus nesigurnih veza"
                            ]
                        }
                    ].map((category, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            className="group relative bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#E1CCEB]/50"
                        >
                            <div className="absolute inset-0">
                                <Image
                                    src={category.image}
                                    alt={category.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                                />
                            </div>

                            <div className="relative p-8">
                                <div className="bg-[#E1CCEB]/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                                    <category.icon className="w-8 h-8 text-[#6B498F]" />
                                </div>

                                <h3 className="text-2xl font-semibold mb-6 text-[#4b2c5e]">
                                    {category.title}
                                </h3>

                                <div className="space-y-4">
                                    {category.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-[#6B498F] flex-shrink-0 mt-1" />
                                            <p className="text-[#4b2c5e]/80">{point}</p>
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
                    className="text-center"
                >
                    <div className="inline-block bg-[#E1CCEB]/30 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                        <h3 className="text-2xl font-semibold mb-4 text-[#4b2c5e]">
                            Ako se borite s bilo kojim od ovih izazova...
                        </h3>
                        <p className="text-xl text-[#4b2c5e]/80 mb-6">
                            Ova knjiga će Vas voditi korak po korak do sigurnog stila privrženosti i ispunjavajućih veza koje zaslužujete
                        </p>
                        <button
                            onClick={scrollToOrderForm}
                            className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 cursor-pointer"
                        >
                            Započnite svoju transformaciju danas →
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TargetAudienceSection;