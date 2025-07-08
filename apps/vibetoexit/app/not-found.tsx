import Link from 'next/link';
import { AlertTriangle, ArrowRight, Home } from 'lucide-react';

export default function NotFound() {
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

            <div className="min-h-screen relative flex items-center justify-center">
                <div className="max-w-md text-center p-8 relative z-10">
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
                        
                        <div className="relative">
                            <div className="bg-gradient-to-r from-red-600 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
                                <AlertTriangle className="w-8 h-8 text-white" />
                            </div>
                            
                            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                404
                            </h1>
                            
                            <h2 className="text-3xl font-semibold text-white mb-6">
                                Page Not Found
                            </h2>
                            
                            <p className="text-gray-300 mb-8 text-lg">
                                Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            </p>

                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/20"
                            >
                                <Home className="w-5 h-5" />
                                Back to Homepage
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    <p className="mt-8 text-gray-400 text-sm">
                        Need help? Contact us at{' '}
                        <a
                            href="mailto:support@vibetoexit.com"
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            support@vibetoexit.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
} 