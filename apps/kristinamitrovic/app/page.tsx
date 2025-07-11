'use client';

import Navigation from '@repo/ui/components/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Book, Heart, Users, Sparkles, Star, Quote, Brain, Shield } from 'lucide-react';
import NewsletterSection from '@repo/ui/components/NewsletterSection';
import { useEffect, useState } from 'react';
import { fetchJsonGet } from '@repo/ui/lib/utils';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import FooterSection from '@repo/ui/components/FooterSection';
import TestimonialsSection from '@/components/TestimonialsSection';

export default function HomePage() {
    const [latestPosts, setLatestPosts] = useState<any[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    useEffect(() => {
        const getPosts = async () => {
            try {
                const data = await fetchJsonGet('/api/blog/latest');
                
                if (data.posts) 
                    setLatestPosts(data.posts);
                
            } catch (err) {
                sendClientErrorEmail('Failed to fetch latest posts', err);
                
            } finally {
                setPostsLoading(false);
            }
        };

        getPosts();
    }, []);

    return (
        <div className="min-h-screen">
            <Navigation />

            {/* Hero Section with Enhanced Design */}
            <section className="relative py-12 md:py-24 px-4 overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#E1CCEB]/30 via-[#FFF9E9] to-[#FFF9E9]" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#4b2c5e] mb-6 leading-tight">
                                Transformirajte svoje odnose kroz razumijevanje
                                <span className="text-[#6B498F]"> privrženosti</span>
                            </h1>

                            <p
                                className="text-xl mb-8 text-[#4b2c5e]/80"
                            >
                                Ja sam Kristina Mitrović, autorica i stručnjakinja za stilove privrženosti.
                                Pomažem ženama da razumiju svoje obrasce u vezama i stvore sigurne, ispunjene odnose.
                            </p>

                            <div
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <Link
                                    href="/knjiga"
                                    className="inline-flex items-center justify-center bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                                >
                                    Saznajte više o knjizi
                                    <ArrowRight className="ml-2" size={20} />
                                </Link>
                            </div>

                            {/* Social Proof */}
                            <div
                                className="flex items-center gap-6 mt-8"
                            >
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full border-2 border-white overflow-hidden"
                                        >
                                            <Image
                                                src={`/img/testimonial/testimonial-${i}.webp`}
                                                alt={`Testimonial ${i}`}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-[#4b2c5e]/80">
                                        1000+ zadovoljnih čitateljica
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="relative"
                        >
                            <div className="relative">
                                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                                    <Image
                                        src="/img/kristina.jpg"
                                        alt="Kristina Mitrović"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                                </div>
                            </div>

                            {/* Floating testimonial card */}
                            <div
                                className="absolute -bottom-6 -left-6 bg-[#E1CCEB]/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl max-w-xs border border-[#E1CCEB]/50"
                            >
                                <Quote className="w-8 h-8 text-[#6B498F] mb-3" />
                                <p className="text-sm text-[#4b2c5e]/80 mb-2">
                                    &quot;Kristina mi je pomogla razumjeti zašto uvijek biram iste tipove partnera. Njezina knjiga je promijenila moj život!&quot;
                                </p>
                                <p className="text-xs text-[#6B498F]">— Ana M., Zagreb</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section with Better Design */}
            <section className="py-20 px-4 bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-[#4b2c5e] mb-4">
                            Kako vam mogu pomoći
                        </h2>
                        <p className="text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto">
                            Kroz godine rada s klijentima, razvila sam jedinstveni pristup koji pomaže ženama transformirati svoje obrasce u vezama
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Razumijevanje stilova privrženosti",
                                description: "Otkrijte kako vaši rani odnosi oblikuju vaše sadašnje veze i naučite prepoznati svoje obrasce.",
                                gradient: "from-[#F1BBB0] to-[#E1CCEB]"
                            },
                            {
                                icon: Users,
                                title: "Stvaranje sigurnih veza",
                                description: "Naučite praktične tehnike za razvijanje sigurne privrženosti i zdravijih odnosa.",
                                gradient: "from-[#E1CCEB] to-[#6B498F]"
                            },
                            {
                                icon: Sparkles,
                                title: "Transformacija obrazaca",
                                description: "Prekinite ciklus toksičnih obrazaca i stvorite prostor za ljubav koju zaslužujete.",
                                gradient: "from-[#6B498F] to-[#4b2c5e]"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="group relative h-full"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 ${feature.gradient}`} />
                                <div className="relative bg-[#FFEAFF]/30 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 group-hover:border-[#D4B5A0]/40 transition-all duration-300 h-full flex flex-col">
                                    <div className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-[#4b2c5e]/80 flex-grow">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Book Showcase Section */}
            <section className="py-20 px-4 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-[#FFEAFF]/80 px-6 py-3 rounded-full mb-6 border border-[#E1CCEB]/50">
                            <Book className="w-5 h-5 text-[#6B498F]" />
                            <span className="font-medium text-[#6B498F]">Nova knjiga</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#4b2c5e] mb-6">
                            Stilovi privrženosti
                        </h2>
                        <p className="text-xl text-[#4b2c5e]/80 max-w-4xl mx-auto">
                            Moja knjiga pruža znanstveno utemeljene, ali praktične alate za razumijevanje i transformaciju vaših obrazaca u vezama. Posebno prilagođena ženama iz naše regije.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Brain,
                                        title: "Znanstveno utemeljena",
                                        description: "Bazirana na najnovijim istraživanjima iz neuroznanosti i psihologije privrženosti"
                                    },
                                    {
                                        icon: Shield,
                                        title: "Praktične vježbe",
                                        description: "Konkretni alati i tehnike koje možete odmah početi primjenjivati"
                                    },
                                    {
                                        icon: Heart,
                                        title: "Transformativna moć",
                                        description: "Dubinska promjena koja mijenja način na koji se povezujete s drugima"
                                    }
                                ].map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="bg-[#E1CCEB]/40 p-3 rounded-lg flex-shrink-0">
                                            <benefit.icon className="w-6 h-6 text-[#6B498F]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#4b2c5e] mb-2">
                                                {benefit.title}
                                            </h3>
                                            <p className="text-[#4b2c5e]/80">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="mt-8"
                            >
                                <Link
                                    href="/knjiga"
                                    className="inline-flex items-center bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 w-full sm:w-auto justify-center"
                                >
                                    Saznajte više o knjizi
                                    <ArrowRight className="ml-2" size={24} />
                                </Link>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="relative mx-auto max-w-sm">
                                <div className="relative bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                                    <div className="mb-6">
                                        <Image
                                            src="/img/mockup/Stilovi-privrzenosti.webp"
                                            alt="Stilovi privrženosti - knjiga"
                                            width={500}
                                            height={300}
                                        />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#4b2c5e] mb-4">
                                        Stilovi privrženosti
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-[#4b2c5e]/80">4.85/5 (1000+ čitatelja)</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Blog Preview Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-12"
                    >
                        <div>
                            <h2 className="text-4xl font-bold text-[#4b2c5e] mb-2">Najnoviji članci</h2>
                            <p className="text-[#4b2c5e]/80">Uvidi i savjeti za vaše putovanje prema sigurnoj privrženosti</p>
                        </div>
                        <Link
                            href="/blog"
                            className="text-[#6B498F] hover:text-[#4b2c5e] font-semibold inline-flex items-center transition-colors"
                        >
                            Svi članci
                            <ArrowRight className="ml-2" size={20} />
                        </Link>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {postsLoading ? (
                            [...Array(3)].map((_, index) => (
                                <div key={index} className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl overflow-hidden border border-[#E1CCEB]/50 animate-pulse">
                                    <div className="h-48 bg-[#E1CCEB]/40"></div>
                                    <div className="p-6">
                                        <div className="h-4 bg-[#E1CCEB]/40 rounded w-1/4 mb-4"></div>
                                        <div className="h-6 bg-[#E1CCEB]/40 rounded w-3/4 mb-3"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-[#E1CCEB]/40 rounded w-full"></div>
                                            <div className="h-4 bg-[#E1CCEB]/40 rounded w-5/6"></div>
                                        </div>
                                        <div className="h-4 bg-[#E1CCEB]/40 rounded w-1/3 mt-4"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            latestPosts.map((article, index) => (
                                <motion.article
                                    key={article.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="group cursor-pointer"
                                >
                                    <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-xl overflow-hidden border border-[#E1CCEB]/50 transition-all">
                                        <Link href={`/blog/${article.slug}`} className="block relative h-48 bg-gradient-to-br from-[#E1CCEB]/50 to-[#F1BBB0]/50">
                                            {article.headerImage ? (
                                                <Image
                                                    src={article.headerImage}
                                                    alt={article.headerImageAlt || article.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            ) : (
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-[#6B498F]/80 text-white text-xs px-3 py-1 rounded-full">
                                                        {article.category}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-[#FFF9E9]/10"></div>
                                        </Link>
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="bg-[#E1CCEB]/50 text-[#6B498F] text-xs px-3 py-1 rounded-full">
                                                    {article.category}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3 group-hover:text-[#6B498F] transition-colors">
                                                <Link href={`/blog/${article.slug}`}>
                                                    {article.title}
                                                </Link>
                                            </h3>
                                            <p className="text-[#4b2c5e]/80 mb-4 line-clamp-3">
                                                {article.excerpt}
                                            </p>
                                            <Link
                                                href={`/blog/${article.slug}`}
                                                className="text-[#6B498F] hover:text-[#4b2c5e] font-medium inline-flex items-center transition-colors"
                                            >
                                                Pročitajte više
                                                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.article>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Newsletter Section with Enhanced Design */}
            <NewsletterSection />

            <FooterSection />
        </div>
    );
}
