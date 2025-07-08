import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

export default function CtaToSalesPageSection() {
    return (
        <section className="py-16 px-4 relative overflow-hidden bg-transparent">
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#E1CCEB]/20 via-[#F1BBB0]/20 to-[#E1CCEB]/20" />
            <div className="hidden md:block absolute top-0 left-1/4 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
            <div className="hidden md:block absolute bottom-0 right-1/4 w-96 h-96 bg-[#F1BBB0]/10 rounded-full blur-3xl" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12 items-center">
                    {/* Image Section */}
                    <div className="lg:col-span-2">
                        <Image
                            src="/img/mockup/Stilovi-privrzenosti.webp"
                            alt="Stilovi privrženosti - knjiga"
                            width={400}
                            height={600}
                            className="relative w-full h-auto mx-auto max-w-sm lg:max-w-md"
                            priority
                        />
                    </div>

                    {/* Text Content */}
                    <div className="lg:col-span-3 text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#4b2c5e] mb-6">
                            Želite li dublje razumjeti svoje obrasce u vezama?
                        </h2>

                        <p className="text-lg text-[#4b2c5e]/80 mb-8">
                            Moja knjiga <span className="text-[#6B498F] font-semibold">Stilovi privrženosti</span> pruža cjeloviti vodič kroz teoriju privrženosti s praktičnim vježbama koje možete odmah primijeniti. Pridružite se tisućama žena koje su već transformirale svoje odnose!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center lg:items-start">
                            <Link
                                href="/knjiga"
                                className="inline-flex items-center bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                            >
                                <BookOpen className="mr-3" size={24} />
                                Saznajte više o knjizi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
} 