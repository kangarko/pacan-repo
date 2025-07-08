'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Heart } from 'lucide-react';
import { scrollToOrderForm } from '@repo/ui/lib/clientUtils';

const NextSection = () => {
    return (
        <div className="bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-6">
                            Jeste li Vi sljedeći?
                            <br />
                            <span className="text-[#6B498F]">
                                Vrijeme je za Vašu transformaciju
                            </span>
                        </h2>
                        <p className="text-xl text-[#4b2c5e]/80 mb-12 max-w-3xl mx-auto">
                            Tisuće žena već su transformirale svoje veze koristeći ovu metodologiju.
                            Sada je vrijeme da i Vi napravite taj korak prema sigurnoj privrženosti
                            i ispunjavajućim odnosima koje zaslužujete.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                image: "",
                                name: "Aleksandra",
                                location: "",
                                quote: "Doživela sam wauu momenat već sa prvih 20 stranica koje sam stigla da pročitam. Sama prolazim kroz anksioznost, pogotovo posle porođaja i promene sredine u kojoj sada živim, a imam i malu dvojčicu od 3 godine i sada sam više svesnija gde sam grešila i u našem odnosu za ove 3 godine.",
                                offsetY: 0
                            },
                            {
                                image: "",
                                name: "Anđela V.",
                                location: "",
                                quote: "Nisam više u grču šta će neko reći zbog mojih granica. Ranije me je bilo strah da ih postavim.",
                                offsetY: -60
                            },
                            {
                                image: "",
                                name: "Željko P.",
                                location: "",
                                quote: "Mislim da je fenomenalno iskustveno i istinito napisana jer se u dosta situacija pronalazim...",
                                offsetY: 0
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl overflow-hidden border border-[#E1CCEB]/50"
                            >
                                {testimonial.image && (
                                    <div className="relative h-48">
                                        <Image
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            fill
                                            style={{
                                                objectFit: 'cover',
                                                objectPosition: `0 ${testimonial.offsetY}px`
                                            }}
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className={`flex items-center gap-1 mb-3 ${!testimonial.image ? 'justify-center' : ''}`}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-[#4b2c5e]/80 mb-4">&quot;{testimonial.quote}&quot;</p>
                                    <p className="text-sm">
                                        <span className="text-[#4b2c5e] font-medium">{testimonial.name}</span>
                                        <span className="text-[#6B498F]"> • {testimonial.location}</span>
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="bg-[#E1CCEB]/30 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 mb-8">
                            <Heart className="w-12 h-12 text-[#6B498F] mx-auto mb-6" />
                            <p className="text-xl text-[#4b2c5e]/80 mb-6">
                                Zamislite kako bi izgledao Vaš život za 6 mjeseci nakon što savladate
                                tehnike sigurne privrženosti. Koliko bi Vaši odnosi bili dublji,
                                ispunjavajući i stabilniji?
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <ArrowRight className="w-5 h-5 text-[#6B498F]" />
                                <p className="text-[#4b2c5e] font-medium">
                                    Vrijeme je da napravite taj korak
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={scrollToOrderForm}
                            className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-12 py-6 rounded-xl font-semibold text-xl transition-all transform hover:scale-105 mb-4 cursor-pointer"
                        >
                            Započnite svoju transformaciju danas →
                        </button>
                        <p className="text-gray-500">
                            🔒 Sigurno plaćanje • Trenutni pristup • 30-dnevno jamstvo povrata novca
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default NextSection;