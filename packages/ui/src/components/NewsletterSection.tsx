'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lightbulb, Loader2, CheckCircle } from 'lucide-react';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

export default function NewsletterSection() {
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterName, setNewsletterName] = useState('');
    const [newsletterStep, setNewsletterStep] = useState(1);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterError, setNewsletterError] = useState<string | null>(null);

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewsletterError(null);

        if (newsletterStep === 1) {
            if (newsletterEmail.trim() === '' || !newsletterEmail.includes('@')) {
                setNewsletterError('Molimo unesite ispravnu e-mail adresu.');
                return;
            }
            setNewsletterStep(2);
        } else if (newsletterStep === 2) {
            if (newsletterName.trim() === '') {
                setNewsletterError('Molimo unesite Vaše ime.');
                return;
            }
            setNewsletterLoading(true);
            try {
                await fetchJsonPost('/api/newsletter/subscribe', {
                    email: newsletterEmail,
                    name: newsletterName,
                });
                setNewsletterStep(3);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Došlo je do pogreške.');
                setNewsletterError(error.message);
                sendClientErrorEmail('Newsletter subscription failed', error);
            } finally {
                setNewsletterLoading(false);
            }
        }
    };

    return (
        <section className="py-20 px-4 relative overflow-hidden bg-[#FFEAFF]/70">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E1CCEB]/30 to-[#F1BBB0]/30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />

            <div className="max-w-2xl mx-auto text-center relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#6B498F] to-[#4b2c5e] rounded-2xl mb-8 shadow-2xl">
                        <Mail className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-[#4b2c5e] mb-4">
                        Pridružite se mojoj zajednici
                    </h2>
                    <p className="text-[#4b2c5e]/80 mb-8 text-lg">
                        Primajte korisne savjete o vezama i privrženosti direktno u svoj inbox.
                    </p>

                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        {newsletterStep === 1 && (
                            <>
                                <input
                                    type="email"
                                    placeholder="Vaša e-mail adresa"
                                    className="flex-1 px-6 py-4 rounded-xl bg-white/50 backdrop-blur-sm border border-[#E1CCEB] text-[#4b2c5e] placeholder-[#4b2c5e]/60 focus:outline-none focus:border-[#6B498F] transition-colors"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                                >
                                    Prijavite se
                                </button>
                            </>
                        )}
                        {newsletterStep === 2 && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Vaše ime"
                                    className="flex-1 px-6 py-4 rounded-xl bg-white/50 backdrop-blur-sm border border-[#E1CCEB] text-[#4b2c5e] placeholder-[#4b2c5e]/60 focus:outline-none focus:border-[#6B498F] transition-colors"
                                    value={newsletterName}
                                    onChange={(e) => setNewsletterName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center justify-center"
                                    disabled={newsletterLoading}
                                >
                                    {newsletterLoading ? <Loader2 className="animate-spin" /> : 'Potvrdi'}
                                </button>
                            </>
                        )}
                    </form>

                    {newsletterStep === 3 ? (
                        <div className="text-green-700 mt-4 flex items-center justify-center gap-2">
                            <CheckCircle size={20} />
                            Hvala na prijavi! 🎉
                        </div>
                    ) : newsletterError ? (
                        <p className="text-red-700 mt-4">{newsletterError}</p>
                    ) : (
                        <p className="text-sm text-[#4b2c5e]/70 mt-4">
                            <Lightbulb className="w-4 h-4 inline mr-1" />
                            Besplatno. Bez spama. Odjava jednim klikom u svakom e-mailu.
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
} 