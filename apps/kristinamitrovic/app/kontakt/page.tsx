'use client';

import { useState } from 'react';
import Navigation from '@repo/ui/components/Navigation';
import { MessageSquare, Send, HelpCircle, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { sendClientEmail } from '@repo/ui/lib/clientUtils';
import { EmailTemplate } from '@repo/ui/lib/types';
import FooterSection from '@repo/ui/components/FooterSection';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await sendClientEmail(EmailTemplate.ADMIN_CONTACT_FORM, formData, undefined, formData.email);
            
            setSuccess(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Došlo je do greške. Molimo pokušajte ponovno.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9E9]">
            <Navigation />

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-[#E1CCEB]/20 to-[#FFF9E9]">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-[#4b2c5e] mb-6">Kontakt</h1>
                    <p className="text-xl text-[#4b2c5e]/80">
                        Javite se s pitanjima ili podijelite svoju priču
                    </p>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="px-4 -mt-8 mb-8">
                <div className="max-w-2xl mx-auto">
                    {/* FAQ Link - Moved above form with enhanced design */}
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#6B498F]/20 to-[#F1BBB0]/20 rounded-2xl" />
                        <div className="relative bg-gradient-to-r from-[#FFEAFF]/40 to-[#FFEAFF]/40 rounded-2xl p-8 border border-[#D4B5A0]/30 hover:border-[#6B498F]/30 transition-all group">
                            <div className="flex items-start gap-4">
                                <div className="bg-[#6B498F]/20 p-3 rounded-xl group-hover:bg-[#6B498F]/30 transition-colors">
                                    <HelpCircle className="w-8 h-8 text-[#6B498F]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-[#4b2c5e] mb-2">
                                        Imate pitanja o knjizi?
                                    </h3>
                                    <p className="text-[#4b2c5e]/80 mb-4">
                                        Prije nego što nas kontaktirate, pogledajte odgovore na najčešća pitanja - možda ćete pronaći ono što tražite!
                                    </p>
                                    <a
                                        href="/knjiga#faq"
                                        className="inline-flex items-center gap-2 text-[#6B498F] hover:text-[#4b2c5e] font-medium group-hover:gap-3 transition-all"
                                    >
                                        Pogledajte FAQ
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]">
                        <h2 className="text-2xl font-bold text-[#4b2c5e] mb-6 flex items-center gap-3">
                            <MessageSquare className="text-[#6B498F]" />
                            Pošaljite poruku
                        </h2>

                        {success && (
                            <div className="bg-green-100/50 border border-green-300 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="text-green-800 text-sm">Vaša poruka je uspješno poslana! Odgovorit ćemo Vam u najkraćem mogućem roku.</p>
                                </div>
                            </div>
                        )}

                        {error && (
                             <div className="bg-red-100/50 border border-red-300 rounded-lg p-4 mb-6">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                        Ime
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/50 border border-[#E1CCEB] text-[#4b2c5e] placeholder-[#4b2c5e]/60 focus:outline-none focus:border-[#6B498F] transition"
                                        placeholder="Vaše ime"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                        E-mail adresa
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/50 border border-[#E1CCEB] text-[#4b2c5e] placeholder-[#4b2c5e]/60 focus:outline-none focus:border-[#6B498F] transition"
                                        placeholder="vasa.adresa@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-[#4b2c5e]/80 mb-2">
                                        Poruka
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-white/50 border border-[#E1CCEB] text-[#4b2c5e] placeholder-[#4b2c5e]/60 focus:outline-none focus:border-[#6B498F] transition resize-none"
                                        placeholder="Vaša poruka..."
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Slanje...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Pošaljite poruku
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            <FooterSection 
                showMain={false}
            />
        </div>
    );
} 