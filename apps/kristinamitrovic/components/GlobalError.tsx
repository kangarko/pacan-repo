'use client'
import { AlertTriangle, RefreshCw } from 'lucide-react';
import GradientBackground from "@repo/ui/components/GradientBackground";

export default function KristinaGlobalError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
            <GradientBackground />

            <div className="max-w-md text-center p-8 relative z-10">
                <div className="bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50">
                    <div className="bg-[#E1CCEB]/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-[#6B498F]" />
                    </div>
                    <h1 className="text-2xl font-semibold text-[#4b2c5e] mb-4">Dogodila se neočekivana greška</h1>
                    <p className="text-[#4b2c5e]/80 mb-8">
                        Naš tim je obaviješten o problemu. Molimo pokušajte ponovno.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Pokušaj ponovno</span>
                    </button>
                </div>
            </div>
        </div>
    );
} 