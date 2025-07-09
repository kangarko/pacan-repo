import React from 'react';
import { Rocket } from 'lucide-react';

const Header = () => (
    <header className="relative z-50 pt-6 hidden md:block">
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Rocket className="h-8 w-8 text-indigo-400 transform rotate-45" />
                        <div className="absolute inset-0 animate-pulse">
                            <Rocket className="h-8 w-8 text-indigo-300 opacity-50 transform rotate-45" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Vibe To Exit
                        </span>
                        <span className="text-xs text-gray-400 -mt-1">Build, Monetize & Sell Your AI Business</span>
                    </div>
                </div>
            </div>
        </div>
    </header>
);

export default Header;