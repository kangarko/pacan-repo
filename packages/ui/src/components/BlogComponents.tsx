import Image from 'next/image';
import { Info, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';

interface CalloutProps {
    type?: 'info' | 'warning' | 'tip' | 'success';
    children: React.ReactNode;
}

export function Callout({ type = 'info', children }: CalloutProps) {
    const styles = {
        info: {
            bg: 'bg-blue-100/50',
            border: 'border-blue-300',
            icon: <Info className="w-5 h-5 text-blue-600" />,
            iconBg: 'bg-blue-200/50'
        },
        warning: {
            bg: 'bg-amber-100/50',
            border: 'border-amber-300',
            icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
            iconBg: 'bg-amber-200/50'
        },
        tip: {
            bg: 'bg-[#E1CCEB]/40',
            border: 'border-[#6B498F]',
            icon: <Lightbulb className="w-5 h-5 text-[#6B498F]" />,
            iconBg: 'bg-[#E1CCEB]/70'
        },
        success: {
            bg: 'bg-emerald-100/50',
            border: 'border-emerald-300',
            icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
            iconBg: 'bg-emerald-200/50'
        }
    };

    const style = styles[type];

    return (
        <div className={`my-6 p-6 rounded-xl border-l-4 ${style.bg} ${style.border}`}>
            <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${style.iconBg}`}>
                    {style.icon}
                </div>
                <div className="flex-1 text-[#4b2c5e]">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ImageWithCaptionProps {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
}

export function ImageWithCaption({ src, alt, caption, credit }: ImageWithCaptionProps) {
    return (
        <figure className="my-8">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                />
            </div>
            {(caption || credit) && (
                <figcaption className="mt-3 text-center text-sm text-[#4b2c5e]/70">
                    {caption && <span>{caption}</span>}
                    {caption && credit && <span> • </span>}
                    {credit && <span className="italic">{credit}</span>}
                </figcaption>
            )}
        </figure>
    );
}

interface HighlightBoxProps {
    title: string;
    children: React.ReactNode;
}

export function HighlightBox({ title, children }: HighlightBoxProps) {
    return (
        <div className="my-8 p-6 bg-gradient-to-br from-[#E1CCEB]/30 to-[#FFEAFF]/50 rounded-xl border border-[#D4B5A0]/30">
            <h4 className="text-xl font-bold text-[#6B498F] mb-3">{title}</h4>
            <div className="text-[#4b2c5e]">
                {children}
            </div>
        </div>
    );
}

interface StatsCardProps {
    number: string;
    label: string;
}

export function StatsCard({ number, label }: StatsCardProps) {
    return (
        <div className="text-center p-6 bg-[#FFEAFF]/50 rounded-xl border border-[#E1CCEB]">
            <div className="text-3xl font-bold text-[#6B498F] mb-2">{number}</div>
            <div className="text-sm text-[#4b2c5e]/80">{label}</div>
        </div>
    );
}

interface ImageGalleryProps {
    images: Array<{
        src: string;
        alt: string;
    }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
    return (
        <div className="grid grid-cols-2 gap-4 my-8">
            {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden shadow-xl">
                    <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                </div>
            ))}
        </div>
    );
} 