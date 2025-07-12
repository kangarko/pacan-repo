'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Shield, Lock, FileCheck, AlertCircle, Mail, Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@repo/ui/components/GradientBackground';

export default function Terms() {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen relative py-24 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="text-center mb-12">
                        <ScrollText className="w-12 h-12 text-[#6B498F] mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-[#4b2c5e] mb-4">Uvjeti Korištenja</h1>
                        <p className="text-[#4b2c5e]/80">Posljednje ažurirano: 22. veljače 2025</p>
                    </div>

                    <div className="mb-8 text-center">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-[#6B498F] hover:text-[#4b2c5e] transition-colors bg-[#E1CCEB]/30 hover:bg-[#E1CCEB]/50 px-4 py-2 rounded-lg border border-[#D4B5A0]/30"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Natrag</span>
                        </button>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">1. Opće Odredbe</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80">
                                Korištenjem ove knjige i povezanih materijala pristajete na ove Uvjete korištenja.
                                {process.env.NEXT_PUBLIC_SITE_NAME} (&quot;mi&quot;, &quot;naš&quot; ili &quot;nas&quot;) zadržava pravo izmjene ovih uvjeta u bilo
                                kojem trenutku, a Vaša kontinuirana upotreba materijala nakon takvih promjena znači
                                prihvaćanje novih uvjeta.
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">2. Intelektualno Vlasništvo</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80 mb-4">
                                Svi materijali, uključujući ali ne ograničavajući se na tekst, grafike, logotipe,
                                ikone, slike i softver, su vlasništvo {process.env.NEXT_PUBLIC_SITE_NAME} ili naših davatelja licenci
                                i zaštićeni su hrvatskim i međunarodnim zakonima o autorskim pravima.
                            </p>
                            <p className="text-[#4b2c5e]/80">
                                Nije dozvoljeno kopiranje, reproduciranje, distribuiranje, objavljivanje, preuzimanje,
                                prikazivanje, objavljivanje ili prenošenje bilo kojeg materijala u bilo kojem obliku
                                ili na bilo koji način bez našeg izričitog pismenog dopuštenja.
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileCheck className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">3. Uvjeti Kupnje</h2>
                            </div>
                            <ul className="list-disc pl-6 text-[#4b2c5e]/80 space-y-2">
                                <li>
                                    Kupnjom knjige dobivate neekskluzivnu, neprenosivu licencu za pristup i korištenje
                                    materijala za osobnu, nekomercijalnu upotrebu.
                                </li>
                                <li>
                                    Sva plaćanja su sigurna i procesiraju se putem ovlaštenih pružatelja usluga plaćanja.
                                </li>
                                <li>
                                    Nudimo 30-dnevno jamstvo povrata novca ako niste zadovoljni kupljenim materijalima.
                                </li>
                                <li>
                                    Nakon uspješne transakcije, dobit ćete trenutni pristup digitalnim materijalima.
                                </li>
                            </ul>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">4. Ograničenje Odgovornosti</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80 mb-4">
                                Materijali su namijenjeni samo u informativne i edukativne svrhe. Ne predstavljaju
                                zamjenu za profesionalnu medicinsku pomoć, dijagnozu ili liječenje. Uvijek se
                                posavjetujte s kvalificiranim zdravstvenim stručnjakom prije početka bilo kojeg
                                programa samopomoći.
                            </p>
                            <p className="text-[#4b2c5e]/80">
                                Ne dajemo nikakva jamstva ili garancije o točnosti, pravovremenosti, prikladnosti
                                ili potpunosti informacija sadržanih u materijalima.
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">5. Privatnost</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80">
                                Vaša privatnost nam je važna. Prikupljanje i korištenje Vaših osobnih podataka
                                regulirano je našom Politikom privatnosti, koja je sastavni dio ovih Uvjeta korištenja.
                            </p>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Mail className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e] m-0">6. Kontakt</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80 mb-4">
                                Ako imate pitanja ili nedoumice vezane uz ove Uvjete korištenja, molimo kontaktirajte nas:
                            </p>
                            <div className="text-[#4b2c5e]/80">
                                <p>{process.env.NEXT_PUBLIC_SITE_NAME}</p>
                                <p>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</p>
                                <p>{process.env.NEXT_PUBLIC_SITE_ADDRESS}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
