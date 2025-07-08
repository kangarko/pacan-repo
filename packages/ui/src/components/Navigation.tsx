'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { href: '/knjiga', label: 'Knjiga' },
        { href: '/recenzije', label: 'Recenzije' },
        { href: '/blog', label: 'Blog' },
        { href: '/o-meni', label: 'O meni' },
        { href: '/kontakt', label: 'Kontakt' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-[#FFF9E9]/80 backdrop-blur-sm border-b border-[#E1CCEB]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/img/site-logo-5.png"
                            alt="Kristina Mitrović"
                            width={500}
                            height={150}
                            className="max-h-[80px] w-auto"
                        />
                    </Link>

                    {/* Desktop navigation - centered */}
                    <div className="hidden md:flex items-center justify-center flex-1">
                        <div className="flex items-center space-x-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-[#4b2c5e] hover:text-[#6B498F] transition-colors font-medium"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Prijava button */}
                    <div className="hidden md:flex items-center">
                        <Link
                            href="/login"
                            className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-5 py-2 rounded-lg font-medium transition-all"
                        >
                            Prijava
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-[#4b2c5e] hover:text-[#6B498F] p-2"
                            aria-label="Otvori izbornik"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block px-3 py-2 text-[#4b2c5e] hover:text-[#6B498F] font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className="block mt-2 px-3 py-3 rounded-md text-base font-medium bg-[#6B498F] text-white hover:bg-[#4b2c5e] text-center"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Prijava
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
} 