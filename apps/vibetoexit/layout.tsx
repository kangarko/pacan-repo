import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@repo/ui/globals.css';
import './globals.css';
import { sendServerErrorEmail } from '@repo/ui/lib/serverUtils';
import SokolSessionHandler from '@repo/ui/components/SokolSessionHandler';
import Script from 'next/script';

if (typeof window === 'undefined') {
    process.on('unhandledRejection', (reason) => {
        try {
            const errorToSend = reason instanceof Error ? reason : new Error(String(reason));

            sendServerErrorEmail({ rejectionReason: String(reason) }, null, 'Unhandled promise rejection', errorToSend);

        } catch (emailError) {
            console.error('Failed to send error email for unhandled rejection:', emailError);
        }
    });

    process.on('uncaughtException', (error) => {
        sendServerErrorEmail('', null, 'Uncaught exception', error);
    });
}

const inter = Inter({ subsets: ['latin'] });

const siteName = 'Stilovi privrženosti | Kristina Mitrovic';
const siteDescription = 'Naučite kako razviti zdravije odnose kroz razumijevanje stilova privrženosti.';
const siteImage = '/img/open-graph-cover.jpg';

export const metadata: Metadata = {
    title: siteName,
    description: siteDescription,
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || ''),
    openGraph: {
        title: siteName,
        description: siteDescription,
        url: process.env.NEXT_PUBLIC_BASE_URL,
        siteName: siteName,
        images: [
            {
                url: siteImage,
                width: 1200,
                height: 630,
                alt: siteName,
            }
        ],
        locale: 'hr_HR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: siteName,
        description: siteDescription,
        images: [
            siteImage
        ],
    },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="hr">
            <head>
                <link rel="dns-prefetch" href="https://connect.facebook.net" />
                <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
            </head>
            <body className={inter.className}>
                <SokolSessionHandler>
                    {children}
                </SokolSessionHandler>
            </body>
            <Script id="microsoft-clarity-analytics">
                {`
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
                `}
            </Script>
        </html>
    );
}