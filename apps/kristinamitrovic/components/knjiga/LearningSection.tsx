'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Heart, Shield, Users } from 'lucide-react';

const LearningSection = () => {
    return (
        <div className="bg-[#E1CCEB]/40 py-16 relative overflow-hidden">
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
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-[#FFEAFF]/80 px-6 py-2 rounded-full mb-6">
                        <BookOpen className="w-4 h-4 text-[#6B498F]" />
                        <span className="text-sm font-medium text-[#6B498F]">
                            Sveobuhvatni program
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-6">
                        Što ćete naučiti
                    </h2>
                    <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                        Kompletan vodič kroz sve aspekte stvaranja sigurne privrženosti
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        {
                            icon: Brain,
                            title: "Razumijevanje obrazaca",
                            description: "Prepoznajte i transformirajte svoje obrasce privrženosti"
                        },
                        {
                            icon: Heart,
                            title: "Emocionalna regulacija",
                            description: "Savladajte tehnike za upravljanje anksioznošću u vezama"
                        },
                        {
                            icon: Shield,
                            title: "Zdrave granice",
                            description: "Naučite postaviti granice bez osjećaja krivnje"
                        },
                        {
                            icon: Users,
                            title: "Izgradnja povjerenja",
                            description: "Razvijte vještine za stvaranje duboke intimnosti"
                        }
                    ].map((module, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 text-center"
                        >
                            <div className="bg-[#E1CCEB]/50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <module.icon className="w-6 h-6 text-[#6B498F]" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-[#4b2c5e]">
                                {module.title}
                            </h3>
                            <p className="text-[#4b2c5e]/80 text-sm">
                                {module.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearningSection;