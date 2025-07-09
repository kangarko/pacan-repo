'use client';

import Image from 'next/image';
import React from 'react';

const LogosSection = () => {
    return (
        <section className="relative py-16 overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center">
                    <p className="text-sm md:text-base text-gray-400 uppercase tracking-[0.2em] mb-10 font-medium">
                        IN COLLABORATION WITH
                    </p>

                    {/* Logo Grid */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 md:gap-x-12 lg:gap-x-16 gap-y-6 max-w-6xl mx-auto">
                        {/* Google Cloud */}
                        <div className="flex items-center justify-center h-12 md:h-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo/google-cloud.svg"
                                alt="Google Cloud"
                                width={100}
                                height={32}
                                className="h-8 md:h-8 w-auto filter brightness-0 invert"
                                loading="lazy"
                                style={{ width: 'auto' }}
                            />
                        </div>

                        {/* Microsoft */}
                        <div className="flex items-center justify-center h-12 md:h-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo/microsoft.webp"
                                alt="Microsoft for Startups"
                                width={100}
                                height={32}
                                className="h-8 md:h-22 w-auto filter grayscale"
                                loading="lazy"
                                style={{ width: 'auto' }}
                            />
                        </div>

                        {/* JetBrains */}
                        <div className="flex items-center justify-center h-12 md:h-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo/jetbrains.webp"
                                alt="JetBrains"
                                width={100}
                                height={32}
                                className="h-8 md:h-18 w-auto filter grayscale"
                                loading="lazy"
                                style={{ width: 'auto' }}
                            />
                        </div>

                        {/* OpenAI */}
                        <div className="flex items-center justify-center h-12 md:h-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo/openai.svg"
                                alt="OpenAI"
                                width={100}
                                height={40}
                                className="h-8 md:h-10 w-auto filter brightness-0 invert"
                                loading="lazy"
                                style={{ width: 'auto' }}
                            />
                        </div>

                        {/* FounderPass */}
                        <div className="flex items-center justify-center h-12 md:h-16 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/logo/founderpass.webp"
                                alt="FounderPass"
                                width={100}
                                height={24}
                                className="h-6 md:h-6 w-auto filter brightness-0 invert"
                                loading="lazy"
                                style={{ width: 'auto' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default React.memo(LogosSection); 