import { Inter } from 'next/font/google';
import '@repo/ui/globals.css';
import './globals.css';
import { registerProcessEventListeners } from '@repo/ui/lib/serverUtils';
import RootLayout from '@repo/ui/components/RootLayout';
import { generateMetadata } from '@repo/ui/lib/utils';
import { Metadata } from 'next';

registerProcessEventListeners();

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = generateMetadata({
    siteName: 'Vibe To Exit - Build, Monetize & Sell Your AI Business',
    description: 'Learn how to launch your MVP in 48 hours and scale to 10K using Vibe Coding. The new AI method to solving for product-market-fit and pocketing your first few million in 3 years or less.',
    siteImage: '/img/open-graph-cover.jpg',
    locale: 'en_US',
});

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (
        <RootLayout
            lang="en"
            fontClassName={inter.className}
        >
            {children}
        </RootLayout>
    );
} 