'use client';

import React from 'react';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: "Andrea",
        location: "",
        image: "",
        text: "Iskrena da budem, mnogo se bavim sa sobom već godinama od porodičnih konstelacija do rada sa terapeutima, dosta sam i knjiga pročitala i čitam stalno. Ovaj način na koji ste objasnili stilove privrženosti je veoma lagan i lako prihvatljiv, ja sam u dilemi između prvog i četvrtog, mada nisam stigla test uraditi još. Sviđa mi se što je sve na jednom mjestu, obuhvatili ste neke stvari na koje sam ja nailazila u različitim knjigama.",
        role: ""
    },
    {
        name: "Azra",
        location: "",
        image: "",
        text: "Čak su mi i bliski ljudi rekli da puno bolje reagujem na neke situacije. Iznenadili su se. To je zahvaljujuci vasoj knjizi i primjeni knjige. Vase su mi neke rijeci iz knjige odzvanjale u usima. Takodjer su se i stari obrasci pojavili gdje sam odreagovala kao uvjek i sa tim mi upravo nije uopste dobro. Napravila sam dva koraka naprijed a tri nazad. Ne mogu da opisem. Tako mi tesko pada neke obrasce odbaciti. Imala sam odlicnu priliku da vidim da li sam razumjela sebe kroz vasu knjigu.",
        role: ""
    },
    {
        name: "Mika",
        location: "",
        image: "",
        text: "Vrlo zanimljiva, sažeta i lepo objašnjena. Utkana u nadu.",
        role: "Specijalizacija iz medicine"
    }
];

const TestimonialsSection = () => {
    return (
        <div className="relative py-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9E9] via-[#FFEAFF]/30 to-[#E1CCEB]/20" />
            
            {/* Watercolor-like blobs */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#F1BBB0]/20 to-[#E1CCEB]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-gradient-to-tr from-[#D4B5A0]/15 to-[#FFEAFF]/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#E1CCEB]/10 to-transparent rounded-full blur-2xl" />
            
            {/* Subtle pattern overlay */}
            <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #6B498F 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#4b2c5e] mb-4">
                        Što kažu čitateljice
                    </h2>
                    <p className="text-[#6B498F] text-lg max-w-2xl mx-auto">
                        Pridružite se tisućama žena koje su već transformirale svoje odnose uz pomoć &quot;Stilova privrženosti&quot;
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-[#FFF9E9]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB] relative group hover:shadow-xl transition-all duration-300"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#F1BBB0]/0 to-[#E1CCEB]/0 group-hover:from-[#F1BBB0]/5 group-hover:to-[#E1CCEB]/10 rounded-2xl transition-all duration-300" />
                            
                            {/* Decorative corner accent */}
                            <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-[#E1CCEB]/20 to-[#F1BBB0]/10 rounded-full blur-xl" />
                            
                            <Quote className="absolute -top-4 -left-4 w-8 h-8 text-[#6B498F] z-10" />

                            <div className="relative z-10 flex items-center gap-4 mb-6">
                                {testimonial.image && (
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                                        <Image
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            fill
                                            sizes="64px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-[#4b2c5e]">{testimonial.name}</h3>
                                    <p className="text-sm text-[#6B498F]">{testimonial.location}</p>
                                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4 text-yellow-400 fill-current"
                                    />
                                ))}
                            </div>

                            <p className="relative z-10 text-[#4b2c5e]/80 leading-relaxed">
                                {testimonial.text}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-[#E1CCEB]/30 px-6 py-3 rounded-full">
                        <span className="text-[#6B498F] font-medium">
                            ⭐️ 4.85/5 prosječna ocjena na temelju 1,000+ čitatelja
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsSection;