'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Cookie, Bell, Settings, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { COMPANY_INFO } from '@repo/ui/lib/types';
import GradientBackground from '@repo/ui/components/GradientBackground';

export default function Privacy() {
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
                        <Lock className="w-12 h-12 text-[#6B498F] mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-[#4b2c5e] mb-4">Pravila Privatnosti</h1>
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

                    <div className="space-y-8">
                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Cookie className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Politika Kolačića</h2>
                            </div>
                            <div className="prose max-w-none">
                                <p className="text-[#4b2c5e]/80">
                                    Kako bi naše web-stranice radile ispravno te da bismo bili u stanju vršiti daljnja
                                    unapređenja tih istih stranica u svrhu poboljšanja korisničkog iskustva pregledavanja,
                                    moramo na tvoje računalo spremiti malu količinu informacija u posebnu datoteku (ili
                                    datoteke) pod nazivom kolačić (engl. Cookies).
                                </p>

                                <p className="text-[#4b2c5e]/80">
                                    Više od 90 posto svih web-stranica koristi ovu praksu. Prema odredbama Europske unije
                                    od 25. ožujka 2011. obvezni smo prije spremanja kolačića zatražiti tvoj pristanak.
                                    Korištenjem web-stranice pristaješ na uporabu kolačića.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Cookie className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Što je kolačić?</h2>
                            </div>
                            <div className="prose max-w-none">
                                <p className="text-[#4b2c5e]/80">
                                    Kolačić je informacija spremljena na računalo od strane web stranice koju posjetiš.
                                    Uobičajeno je da sprema tvoje postavke i postavke za web-stranicu, kao što su na
                                    primjer preferirani jezik ili adresa.
                                </p>

                                <p className="text-[#4b2c5e]/80">
                                    Kasnije, kada opet otvoriš istu web-stranicu, internetski preglednik šalje natrag
                                    kolačiće koji pripadaju toj stranici. Ovo omogućava stranici da prikaže
                                    personalizirane informacije.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Vrste kolačića</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Privremeni kolačići</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Privremeni kolačići ili kolačići sesije uklanjaju se s računala po zatvaranju
                                        internetskog preglednika. Pomoću njih web-mjesta pohranjuju privremene podatke.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Stalni kolačići</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Stalni ili spremljeni kolačići ostaju na računalu nakon zatvaranja internetskog
                                        preglednika. Pomoću njih web-mjesta pohranjuju podatke, kao što su korisničko ime
                                        za prijavu i zaporka.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Kolačići prve strane</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Kolačići prve strane dolaze s web-mjesta koje gledaš, a mogu biti privremeni ili
                                        stalni. Pomoću njih web-mjesta mogu pohraniti podatke koje će ponovo koristiti
                                        prilikom sljedećeg posjeta.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Kolačići treće strane</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Kolačići treće strane dolaze sa sadržaja drugih web-mjesta, na primjer reklame,
                                        koje se nalaze na web-mjestu koje trenutno gledaš. Pomoću tih kolačića web-mjesta
                                        mogu pratiti korištenje interneta u marketinške svrhe.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Naši kolačići</h2>
                            </div>
                            <div className="space-y-6">
                                <p className="text-[#4b2c5e]/80">
                                    Koristimo kolačiće s primarnim ciljem kako bi naše web-stranice omogućile bolje
                                    korisničko iskustvo. Konkretno koristimo:
                                </p>

                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Privremeni kolačići</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        To su privremeni kolačići koji ističu (i automatski se brišu) kada zatvoriš
                                        internetski preglednik. Koristimo ih da omogućimo pristup sadržaju.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Trajni kolačići</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Obično imaju datum isteka daleko u budućnosti te će ostati u tvojem pregledniku.
                                        Koristimo ih kako bismo bolje razumjeli navike korisnika. Ova informacija je
                                        anonimna.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Kolačići trećih strana</h2>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[#4b2c5e]/80">
                                    Koristimo nekoliko vanjskih servisa koji korisniku spremaju limitirane kolačiće:
                                </p>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Mjerenje posjećenosti</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Koristimo Facebook Pixel, Google Analytics i Google Search Console za mjerenje posjećenosti.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-medium text-[#4b2c5e] mb-2">Remarketing</h3>
                                    <p className="text-[#4b2c5e]/80">
                                        Ponekad za oglašavanje upotrebljavamo oglase za tzv. remarketing u usluzi Facebook Pixel i Google
                                        Analytics. Dobavljači treće strane, uključujući Google, prikazuju naše oglase na
                                        web-lokacijama na cijelom internetu.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Upravljanje kolačićima</h2>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[#4b2c5e]/80">
                                    Možete upravljati postavkama kolačića u Vašem internetskom pregledniku:
                                </p>

                                <ul className="list-disc list-inside space-y-2 text-[#6B498F]">
                                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="hover:text-[#4b2c5e]">Google Chrome</a></li>
                                    <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="hover:text-[#4b2c5e]">Mozilla Firefox</a></li>
                                    <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="hover:text-[#4b2c5e]">Microsoft Edge</a></li>
                                    <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="hover:text-[#4b2c5e]">Safari</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Bell className="w-6 h-6 text-[#6B498F]" />
                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Kontakt</h2>
                            </div>
                            <p className="text-[#4b2c5e]/80 mb-4">
                                Za sva pitanja vezana uz privatnost i korištenje osobnih podataka, možete nas kontaktirati:
                            </p>
                            <div className="text-[#4b2c5e]/80">
                                <p>{COMPANY_INFO.name}</p>
                                <p>{COMPANY_INFO.email}</p>
                                <p>{COMPANY_INFO.address}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
