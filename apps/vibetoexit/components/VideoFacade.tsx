'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface VideoFacadeProps {
    videoId: string;
    thumbnailUrl?: string;
    title?: string;
}

const VideoFacade: React.FC<VideoFacadeProps> = ({ 
    videoId, 
    thumbnailUrl,
    title = 'Workshop Video' 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleClick = () => {
        setIsLoaded(true);
    };

    // Use Vimeo thumbnail if no custom thumbnail provided
    const thumbUrl = thumbnailUrl || `https://vumbnail.com/${videoId}.jpg`;

    if (isLoaded) {
        return (
            <div className="aspect-video">
                <iframe
                    src={`https://player.vimeo.com/video/${videoId}?h=8c7e4f5d6a&autoplay=1&loop=0&muted=0&title=0&byline=0&portrait=0`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    return (
        <div 
            className="aspect-video relative cursor-pointer group"
            onClick={handleClick}
        >
            {/* Video thumbnail */}
            <div className="absolute inset-0 bg-gray-900 rounded-xl overflow-hidden">
                {!imageError && thumbUrl ? (
                    <Image
                        src={thumbUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    /* Fallback gradient background */
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900"></div>
                )}
                
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
            </div>

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 group-hover:scale-175 transition-transform duration-300"></div>
                    
                    {/* Play button */}
                    <div className="relative bg-red-600 hover:bg-red-700 rounded-full p-6 transition-all duration-300 transform group-hover:scale-110 shadow-2xl">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                </div>
            </div>

            {/* Loading text (shows briefly when clicked) */}
            {isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
                    <p className="text-white animate-pulse">Loading video...</p>
                </div>
            )}
        </div>
    );
};

export default VideoFacade; 