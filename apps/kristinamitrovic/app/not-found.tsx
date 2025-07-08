import GradientBackground from '@repo/ui/components/GradientBackground';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />

            <div className="max-w-md text-center p-8 relative z-10">
                <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                    <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-[#6B498F]" />
                    </div>
                    <h1 className="text-4xl font-bold text-[#4b2c5e] mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-[#4b2c5e] mb-6">
                        Stranica nije pronađena
                    </h2>
                    <p className="text-[#4b2c5e]/80 mb-8">
                        Nažalost, stranica koju tražite ne postoji ili je premještena.
                    </p>

                    <Link
                        href="/"
                        className="inline-block bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Povratak na početnu stranicu
                    </Link>
                </div>

                <p className="mt-8 text-[#4b2c5e]/80 text-sm">
                    Trebate pomoć? Kontaktirajte nas na{' '}
                    <Link
                        href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                        className="text-[#6B498F] hover:text-[#4b2c5e]"
                    >
                        {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                    </Link>
                </p>
            </div>
        </div>
    );
} 