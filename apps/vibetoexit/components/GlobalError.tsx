'use client'
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function VibetoexitGlobalError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gray-900 text-white">
            <div className="absolute inset-0 bg-grid-gray-800 [mask-image:linear-gradient(to_bottom,white_30%,transparent_100%)]"></div>
            
            <div className="max-w-md text-center p-8 relative z-10">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-lg">
                    <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-4">An Unexpected Error Occurred</h1>
                    <p className="text-gray-400 mb-8">
                        Our team has been notified. Please try again.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try again</span>
                    </button>
                </div>
            </div>
        </div>
    );
} 