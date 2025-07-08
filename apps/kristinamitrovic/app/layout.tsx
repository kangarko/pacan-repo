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
    siteName: 'Stilovi privrženosti | Kristina Mitrovic',
    description: 'Naučite kako razviti zdravije odnose kroz razumijevanje stilova privrženosti.',
    siteImage: '/img/open-graph-cover.jpg',
    locale: 'hr_HR'
});

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (
        <RootLayout
            lang="hr"
            fontClassName={inter.className}
        >
            {children}
        </RootLayout>
    );
}