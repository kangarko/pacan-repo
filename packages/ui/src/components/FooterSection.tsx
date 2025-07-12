'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MapPin, Shield, AlertCircle, FileText, Phone, Calendar, User } from 'lucide-react';

const FooterSection = ({ showLinks = true, showMain = true }: { showLinks?: boolean, showMain?: boolean }) => {
    return (
        <footer className="bg-[#FFEAFF]/60 backdrop-blur-sm pt-18 pb-8 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#E1CCEB]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#F1BBB0]/20 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4">

                <div className="max-w-6xl mx-auto">

                    {showMain && (
                        <div className={`grid md:grid-cols-2 ${showLinks ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-12 mb-6 md:mb-16`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-5 h-5 text-[#6B498F]" />
                                    <h3 className="text-[#4b2c5e] font-semibold">Kontakt</h3>
                                </div>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-[#6B498F]" />
                                        <a href="tel:+385991904855" className="text-[#4b2c5e]/80 hover:text-[#6B498F] transition-colors duration-300">
                                            +385 99 190 4855
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-[#6B498F]" />
                                        <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-[#4b2c5e]/80 hover:text-[#6B498F] transition-colors duration-300">
                                            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#6B498F]" />
                                        <span className="text-[#4b2c5e]/80">{process.env.NEXT_PUBLIC_SITE_ADDRESS}</span>
                                    </li>
                                </ul>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-5 h-5 text-[#6B498F]" />
                                    <h3 className="text-[#4b2c5e] font-semibold">Medicinska napomena</h3>
                                </div>
                                <p className="text-[#4b2c5e]/80 text-sm">
                                    Informacije u ovoj knjizi nisu zamjena za profesionalnu medicinsku pomoć.
                                    Uvijek se posavjetujte sa zdravstvenim stručnjakom prije početka bilo
                                    kakvog programa samopomoći.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="w-5 h-5 text-[#6B498F]" />
                                    <h3 className="text-[#4b2c5e] font-semibold">Napomena o uspjehu</h3>
                                </div>
                                <p className="text-[#4b2c5e]/80 text-sm">
                                    Rezultati se mogu razlikovati od osobe do osobe. Uspjeh ovisi o
                                    individualnom trudu, predanosti i okolnostima.
                                </p>
                                <div className="mt-4 pt-4 border-t border-[#E1CCEB]">
                                    <p className="text-[#4b2c5e]/80 text-sm">
                                        {process.env.NEXT_PUBLIC_SITE_NAME} nije povezana s Facebookom niti ju Facebook na bilo koji način podržava.
                                        Facebook je zaštitni znak tvrtke Meta Platforms, Inc.
                                    </p>
                                </div>
                            </motion.div>

                            {showLinks && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="order-first md:order-none"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-[#6B498F]" />
                                        <h3 className="text-[#4b2c5e] font-semibold">Linkovi</h3>
                                    </div>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#6B498F]" />
                                            <Link href="/poziv" className="text-[#4b2c5e]/80 hover:text-[#6B498F] transition-colors duration-300">
                                                Rezerviraj besplatni poziv
                                            </Link>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-[#6B498F]" />
                                            <Link href="/login" className="text-[#4b2c5e]/80 hover:text-[#6B498F] transition-colors duration-300">
                                                Korisnički portal
                                            </Link>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#6B498F]" />
                                            <Link href="/kontakt" className="text-[#4b2c5e]/80 hover:text-[#6B498F] transition-colors duration-300">
                                                Kontakt
                                            </Link>
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row md:justify-between text-[#4b2c5e]/70 text-sm border-t border-[#E1CCEB] pt-8 space-y-4 md:space-y-0">
                        <p className="text-[#4b2c5e]/70 text-center md:text-left">
                            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME}. Sva prava pridržana.
                        </p>
                        <div className="flex items-center gap-2 text-sm justify-center md:justify-end">
                            <Link href="/terms" className="hover:text-[#6B498F] transition-colors duration-300">Pravila korištenja</Link>
                            <span>•</span>
                            <Link href="/privacy" className="hover:text-[#6B498F] transition-colors duration-300">Pravila privatnosti</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;