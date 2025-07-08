import React from 'react';
import Image from 'next/image';

const AboutUs = () => {
    return (
        <section className="container mx-auto px-4 py-20 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Meet Your Mentors
                </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
                {/* Matej */}
                <div>
                    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm p-8 md:p-10 rounded-2xl border border-gray-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-50"></div>
                                <Image 
                                    src="/img/matej.jpg" 
                                    alt="Matej Pacan" 
                                    width={320}
                                    height={320}
                                    className="relative w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full object-cover object-top transition-colors"
                                />
                            </div>
                            
                            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Matej Pacan
                            </h3>
                            <p className="text-indigo-400 text-lg mb-6 font-medium">CEO @ MineAcademy</p>
                            
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                Matej grew coding e-learning company MineAcademy from 0 to 6 figures and helped 3,000+ students get high-paid jobs in Google, Tesla, Bank of America and others.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-indigo-400">3,400+</p>
                                    <p className="text-sm text-gray-400">Students</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-indigo-400">800K+</p>
                                    <p className="text-sm text-gray-400">App Users</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-indigo-400">1,400+</p>
                                    <p className="text-sm text-gray-400">Reviews</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-indigo-400">12</p>
                                    <p className="text-sm text-gray-400">Years of Experience</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vaclav */}
                <div>
                    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm p-8 md:p-10 rounded-2xl border border-gray-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50"></div>
                                <Image 
                                    src="/img/vaclav.jpg" 
                                    alt="Vaclav Gregor" 
                                    width={320}
                                    height={320}
                                    className="relative w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full object-cover transition-colors"
                                />
                            </div>
                            
                            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Vaclav Gregor
                            </h3>
                            <p className="text-purple-400 text-lg mb-6 font-medium">VC & Investor</p>
                            
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                Active investor and fundraising mentor who has helped dozens of founders raise between €250K–€4M. Launched 2 VC funds and achieved 5 successful exits.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-purple-400">100+</p>
                                    <p className="text-sm text-gray-400">Startups Launched</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-purple-400">$14M</p>
                                    <p className="text-sm text-gray-400">Capital Deployed</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-purple-400">17+</p>
                                    <p className="text-sm text-gray-400">VC Investments</p>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <p className="text-2xl font-bold text-purple-400">5</p>
                                    <p className="text-sm text-gray-400">Personal Exits</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;