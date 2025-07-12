'use client'

import React from 'react';
import Script from 'next/script';
import SokolSessionHandler from '@repo/ui/components/SokolSessionHandler';

interface RootLayoutProps {
    children: React.ReactNode;
    lang: string;
    fontClassName: string;
}

export default function RootLayout({ children, lang, fontClassName }: RootLayoutProps) {
    if (!process.env.NEXT_PUBLIC_CLARITY_ID)
        throw new Error('NEXT_PUBLIC_CLARITY_ID is not set in environment variables for production.');

    return (
        <html lang={lang}>
            <head>
                <link rel="dns-prefetch" href="https://connect.facebook.net" />
                <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
            </head>
            <body className={fontClassName}>
                <noscript>
                    <style dangerouslySetInnerHTML={{ __html: `
                        #noscript-banner {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            background-color: #ffc;
                            border-bottom: 1px solid #e6e6e6;
                            padding: 20px;
                            text-align: center;
                            z-index: 99999;
                            color: #000;
                            font-family: sans-serif;
                        }
                        #noscript-banner a {
                            color: #000;
                            text-decoration: underline;
                        }
                    `}} />
                    <div id="noscript-banner">
                        {lang === 'hr' ? (
                            <p style={{ margin: 0, fontSize: '16px' }}>
                                Ova stranica zahtijeva omogućeni JavaScript za ispravan rad. Pogledajte <a href="https://www.enable-javascript.com/" target="_blank" rel="noopener noreferrer">
                                    upute kako omogućiti JavaScript u vašem pregledniku
                                </a>.
                            </p>
                        ) : (
                            <p style={{ margin: 0, fontSize: '16px' }}>
                                This site requires JavaScript to function properly. Here are the <a href="https://www.enable-javascript.com/" target="_blank" rel="noopener noreferrer">
                                    instructions on how to enable JavaScript in your web browser
                                </a>.
                            </p>
                        )}
                    </div>
                </noscript>
                <SokolSessionHandler lang={lang}>
                    {children}
                </SokolSessionHandler>
                <Script id="microsoft-clarity-analytics">
                    {`
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
                        `}
                </Script>
            </body>
        </html>
    );
} 