'use client';

import React from 'react';
import { ArrowRight, CheckCircle, Clock, DollarSign, Rocket, Sparkles, Trophy } from 'lucide-react';
import dynamic from 'next/dynamic';
import AboutUs from '@/components/AboutUs';
import VideoFacade from '@/components/VideoFacade';
import { EverwebinarSliderOptin } from '@repo/ui/components/EverwebinarSliderOptin';
import TopAnnouncementBar from './TopAnnouncementBar';

const webinarId = 5;

// Lazy load non-critical sections
const LogosSection = dynamic(() => import('./LogosSection'), {
    loading: () => null,
    ssr: true
});

const ChallengeRegistration = () => {
    const whatYoullLearn = [
        {
            title: "Product Market Fit",
            description: "Identify a problem worth solving using our AI-powered market research framework"
        },
        {
            title: "Agentic MVP Building",
            description: "No coding - build a complete product using agentic AI tools at low cost."
        },
        {
            title: "Collecting Payments",
            description: "Connect Stripe and PayPal to collect revenue immediately."
        },
        {
            title: "Exit Strategy",
            description: "Choose your outcome: cashflow, funding, or sale with our exit strategy."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden">
            {/* Bokeh Background */}
            <div className="absolute inset-0 overflow-hidden opacity-50">
                <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/40 blur-3xl -top-64 -left-64"></div>
                <div className="absolute w-[300px] h-[300px] rounded-full bg-purple-600/30 blur-3xl top-20 right-20"></div>
                <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-600/30 blur-3xl bottom-0 left-1/3"></div>
                <div className="absolute w-[250px] h-[250px] rounded-full bg-indigo-500/40 blur-3xl top-1/2 -right-32"></div>
                <div className="absolute w-[350px] h-[350px] rounded-full bg-purple-500/30 blur-3xl -bottom-32 left-20"></div>

                {/* Low poly triangles */}
                <svg className="absolute top-0 left-0 w-full h-full opacity-30" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="0,0 500,200 300,500" fill="rgba(99, 102, 241, 0.3)" />
                    <polygon points="1000,0 800,400 1000,600" fill="rgba(139, 92, 246, 0.25)" />
                    <polygon points="0,1000 200,800 500,1000" fill="rgba(79, 70, 229, 0.3)" />
                    <polygon points="1000,1000 600,800 800,600" fill="rgba(124, 58, 237, 0.25)" />
                    <polygon points="500,300 700,500 500,700 300,500" fill="rgba(109, 40, 217, 0.2)" />
                </svg>
            </div>

            <TopAnnouncementBar />

            {/* Hero Section - Redesigned */}
            <section className="container mx-auto px-4 pt-8 pb-8 md:pt-12 md:pb-6">
                <div className="text-center mb-8 lg:mb-12 relative z-10 max-w-6xl mx-auto">
                    <h1 className="relative text-3xl font-extrabold leading-tight mb-6 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-lg tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                        <span className="block lg:inline-flex lg:items-baseline lg:gap-x-4">
                            The Step-by-Step Vibe Coding Playbook
                        </span>
                        <span className="block mt-4 lg:mt-2 lg:text-5xl text-white/90 font-semibold">
                            to Grow Your SaaS to <span className="text-green-400 font-extrabold">$10k/mo</span> Even If You're <span className="underline decoration-pink-400 decoration-2 underline-offset-4">Starting From Zero</span>
                        </span>
                    </h1>
                    <p className="text-xl text-gray-300 mx-auto">
                        (Without hardcosts, investors or spending months on learning to code)
                    </p>
                </div>

                <div className="max-w-md mx-auto relative z-10" id="registration-form">
                    <EverwebinarSliderOptin webinarId={webinarId} />
                </div>
            </section>

            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10">
                        <div className="relative rounded-xl overflow-hidden shadow-2xl">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-xl opacity-50"></div>
                            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                                <VideoFacade
                                    videoId="1091115596"
                                    title="Vibe To Exit Workshop"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-6 text-white sm:text-3xl">On This Workshop, You Will Learn...</h2>
                        <ul className="space-y-4">
                            {whatYoullLearn.map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="bg-green-500/20 rounded-full p-1.5 mt-0.5 flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                        <p className="text-gray-400">{item.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>


            {/* Collaboration Section */}
            <LogosSection />

            {/* What You'll Build Section */}
            <section id="how-it-works" className="relative py-20 overflow-hidden">
                {/* Shadow gradients from both sides */}
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-gray-900 via-gray-900/50 to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-gray-900 via-gray-900/50 to-transparent z-10"></div>

                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent sm:text-4xl md:text-5xl">
                            What You&apos;ll Learn
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        <div className="group relative">
                            <div className="relative bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg h-12 w-12 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                        <span className="font-bold text-lg">1</span>
                                    </div>
                                    <div className="w-16 h-1 bg-gradient-to-r from-indigo-600/0 via-indigo-600/50 to-indigo-600/0"></div>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-white">Product Market Fit</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">Identify a problem worth solving using our AI-powered market research framework</p>
                            </div>
                        </div>

                        <div className="group relative">
                            <div className="relative bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg h-12 w-12 flex items-center justify-center shadow-lg shadow-purple-600/20">
                                        <span className="font-bold text-lg">2</span>
                                    </div>
                                    <div className="w-16 h-1 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0"></div>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-white">Agentic MVP Building</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">No coding - build a complete product using agentic AI tools at low cost.</p>
                            </div>
                        </div>

                        <div className="group relative">
                            <div className="relative bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-lg h-12 w-12 flex items-center justify-center shadow-lg shadow-pink-600/20">
                                        <span className="font-bold text-lg">3</span>
                                    </div>
                                    <div className="w-16 h-1 bg-gradient-to-r from-pink-600/0 via-pink-600/50 to-pink-600/0"></div>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-white">Collecting Payments</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">Connect Stripe and PayPal to collect revenue immediately. </p>
                            </div>
                        </div>

                        <div className="group relative">
                            <div className="relative bg-gray-800/90 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-rose-500/50 transition-all duration-300 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-lg h-12 w-12 flex items-center justify-center shadow-lg shadow-rose-600/20">
                                        <span className="font-bold text-lg">4</span>
                                    </div>
                                    <div className="w-16 h-1 bg-gradient-to-r from-rose-600/0 via-rose-600/50 to-rose-600/0"></div>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-white">Exit Strategy</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">Choose your outcome: cashflow, funding, or sale with our exit strategy.</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom decorative element */}
                    <div className="flex justify-center mt-12">
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent to-indigo-600"></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                            <div className="w-20 h-0.5 bg-gradient-to-l from-transparent to-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </section>

            <AboutUs />

            {/* Why Now Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-orange-600/5 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
                            Come Build With Us!
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-r from-orange-600 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-600/20">
                                        <Clock className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent sm:text-2xl">
                                        The AI Gold Rush Has a Countdown Timer
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        Every week, the barrier to entry gets higher. Google releases a new AI tool and instantly devalues dozens of SaaS platforms.
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <p className="text-3xl font-bold text-orange-400">-15%</p>
                                        <p className="text-sm text-gray-400">Opportunities vanishing weekly</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-amber-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-r from-amber-600 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-600/20">
                                        <Trophy className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent sm:text-2xl">
                                        Pick an Underserved Niche Before It&apos;s Saturated
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        Build defensible distribution before ad costs explode. Position for acquisition before the consolidation wave.
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <p className="text-3xl font-bold text-amber-400">3-6mo</p>
                                        <p className="text-sm text-gray-400">Window to establish market resonance</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-r from-yellow-600 to-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-600/20">
                                        <DollarSign className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent sm:text-2xl">
                                        72% of AI Startups Will Be Acquired or Fail
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        McKinsey reports that most AI startups will be acquired or fail in the next 24 months. The winners are building NOW.
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <p className="text-3xl font-bold text-yellow-400">72%</p>
                                        <p className="text-sm text-gray-400">Exit or fail rate by 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who This Is For */}
            <section className="relative py-20 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
                            Who This Is For
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 mx-auto">
                                        <span className="text-2xl">💼</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Ex-Tech Employees
                                    </h3>
                                    <p className="text-gray-300 text-center leading-relaxed">
                                        Ready to build their own equity instead of someone else&apos;s
                                    </p>
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-blue-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Perfect timing to start</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-600/20 mx-auto">
                                        <span className="text-2xl">🚀</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Solo Founders
                                    </h3>
                                    <p className="text-gray-300 text-center leading-relaxed">
                                        Who want a clear path to exit (not another lifestyle business)
                                    </p>
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-purple-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Exit strategy included</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-pink-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-br from-pink-600 to-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-600/20 mx-auto">
                                        <span className="text-2xl">⚡</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Indie Hackers
                                    </h3>
                                    <p className="text-gray-300 text-center leading-relaxed">
                                        Tired of projects that don&apos;t monetize or scale properly
                                    </p>
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-pink-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Proven monetization</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-all duration-300 transform h-full">
                                    <div className="bg-gradient-to-br from-indigo-600 to-pink-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20 mx-auto">
                                        <span className="text-2xl">🌟</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Complete Beginners
                                    </h3>
                                    <p className="text-gray-300 text-center leading-relaxed">
                                        Who see the AI opportunity but need the roadmap to success
                                    </p>
                                    <div className="mt-6 text-center">
                                        <div className="inline-flex items-center gap-2 text-indigo-400 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>No experience needed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                            <span className="text-blue-400 font-semibold">No matter your background</span>, if you&apos;re ready to build
                            something meaningful and profitable in the AI space, this workshop will show you exactly how.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="relative py-20 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-0 w-[700px] h-[700px] bg-teal-600/5 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
                            Common Questions
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-cyan-600 to-teal-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">🎥</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-cyan-400 sm:text-xl">
                                                Is this a live workshop or pre-recorded?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                This is an on-demand stream.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-teal-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-teal-600 to-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">💻</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-teal-400 sm:text-xl">
                                                Do I need coding experience?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                We&apos;ve worked with both technical and non-technical founders and will show you both paths.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-emerald-600 to-green-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">📺</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-emerald-400 sm:text-xl">
                                                What if I can&apos;t attend live?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                We will provide a replay for 24 hours after the event.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-green-600 to-cyan-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">🎯</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-green-400 sm:text-xl">
                                                What do I need to prepare?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                Just bring your laptop and an open mind! We&apos;ll provide all the resources, tools, and guidance you need during the challenge.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-cyan-600 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">💰</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-cyan-400 sm:text-xl">
                                                Will there be a pitch at the end?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                Yes, at the end we&apos;ll share an invite for our incubator program for founders wanting to continue their journey with more support. However, you&apos;ll get massive value from the workshop alone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group">
                            <div className="relative h-full">
                                <div className="relative bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 transform h-full">
                                    <div className="flex items-start">
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-lg">🚀</span>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold mb-3 text-blue-400 sm:text-xl">
                                                How are you different?
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                Most AI courses focus only on the technology. We focus on the entire business: finding the right problem, building a solution that people will pay for, and creating a business that can either generate sustainable income or be sold for a significant exit.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA - Matrix Style */}
            <section className="relative py-24 overflow-hidden">
                {/* Background matching rest of page */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-indigo-900/20 to-gray-900"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-indigo-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-indigo-900/50 backdrop-blur-xl rounded-3xl p-12 md:p-16 text-center shadow-2xl border border-indigo-500/20 relative overflow-hidden">
                            {/* Subtle grid overlay */}
                            <div className="absolute inset-0 opacity-10">
                                <Sparkles className="absolute top-10 left-10 text-indigo-400 h-8 w-8 animate-pulse" />
                                <Sparkles className="absolute bottom-10 right-10 text-purple-400 h-7 w-7 animate-pulse delay-150" />
                            </div>

                            <div className="relative">
                                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent sm:text-5xl md:text-6xl">
                                    Choose Your Pill
                                </h2>
                                <p className="text-gray-300 mb-12 text-lg">This is your last chance. After this, there is no turning back.</p>

                                <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
                                    {/* Blue Pill */}
                                    <div className="group relative">
                                        <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 h-full transform hover:scale-105">
                                            <div className="mb-6">
                                                <div className="w-20 h-20 mx-auto relative">
                                                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-50"></div>
                                                    <div className="relative w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                                                        <div className="w-14 h-14 bg-blue-500 rounded-full shadow-inner"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4 sm:text-2xl">Blue Pill</h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                The story ends. You wake up in your bed and believe whatever you want to believe. Keep watching as others build and exit.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Red Pill */}
                                    <div className="group relative">
                                        <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 h-full transform hover:scale-105">
                                            <div className="mb-6">
                                                <div className="w-20 h-20 mx-auto relative">
                                                    <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                                    <div className="relative w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                                                        <div className="w-14 h-14 bg-red-500 rounded-full shadow-inner"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent mb-4 sm:text-2xl">Red Pill</h3>
                                            <p className="text-gray-300 leading-relaxed">
                                                Join us <span className="text-red-400 font-semibold">at the next workshop</span> and I show you how deep the rabbit hole goes.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                    className="inline-block group relative"
                                >
                                    {/* Button container with hover effect */}
                                    <div className="relative overflow-hidden rounded-xl">
                                        {/* Animated background gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-600 bg-[length:200%_100%] bg-[position:0%_50%] group-hover:bg-[position:100%_50%] transition-all duration-700 ease-in-out"></div>

                                        {/* Button content */}
                                        <div className="relative text-white font-bold py-5 px-10 text-xl flex items-center gap-3">
                                            TAKE THE RED PILL
                                            <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                                        </div>
                                    </div>
                                </a>

                                <div className="mt-12 space-y-4 text-left max-w-2xl mx-auto">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-red-500/20 rounded-full p-1 mt-1">
                                            <Clock className="h-4 w-4 text-red-400" />
                                        </div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">P.S. -</span> Can&apos;t join live? Register anyway. The replay will be transmitted.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-red-500/20 rounded-full p-1 mt-1">
                                            <Rocket className="h-4 w-4 text-red-400" />
                                        </div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">P.P.S. -</span> Bring your desktop or laptop. You&apos;ll be building something in the Matrix.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 relative z-10 mt-4 mb-4">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Company Info and Links */}
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="text-center md:text-left">
                                <p className="text-gray-300 font-semibold mb-2">© {new Date().getFullYear()} Vibe To Exit. All rights reserved.</p>
                                <p className="text-gray-400 text-sm">
                                    Operated by PACAN ENTERPRISES LLC<br />
                                    7901 4th St N STE 300<br />
                                    St. Petersburg, FL 33702<br />
                                    USA
                                </p>
                            </div>

                            <div className="text-center md:text-right">
                                <div className="space-x-6">
                                    <a href="/privacy" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</a>
                                    <a href="/terms" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</a>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimers */}
                        <div className="text-sm text-gray-400 pt-8 flex flex-col gap-6">
                            <p className="leading-relaxed">This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.</p>
                            <p className="leading-relaxed">The results mentioned on this page are not typical and are the result of years of hard work, dedication, and expertise. Your results will vary based on a number of factors including but not limited to your background, experience, and work ethic. Building a successful business takes time, effort, and dedication. We make no guarantees regarding your ability to achieve results or earn money with our ideas, information, tools, or strategies. Nothing on this page is a promise or guarantee of future earnings.</p>
                            <p className="leading-relaxed">The information provided in this workshop is for educational purposes only. We are not providing legal, accounting, or other professional services. Any financial figures referenced are for illustrative purposes only and should not be considered as average earnings, exact earnings, or promises for actual or future performance.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ChallengeRegistration;