'use client';
import React, { useState, useEffect } from 'react';

interface EmailMessageContentProps {
    bodyHtml?: string;
    bodyText?: string;
}

const EmailMessageContent: React.FC<EmailMessageContentProps> = ({ bodyHtml, bodyText }) => {
    const [latestReplyHtml, setLatestReplyHtml] = useState<string>('');

    useEffect(() => {
        let replyHtml = '';

        const escapeHtml = (str: string) =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

        // Obtain plain-text content first
        let plainText = bodyText;

        if (!plainText && bodyHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(bodyHtml, 'text/html');
            plainText = doc.body.innerText;
        }

        if (plainText) {
            // Normalize line breaks
            const lines = plainText.split(/\r?\n/);
            const replyLines: string[] = [];
            const quoteHeaderPattern = /^(On\s.+wrote:|Dana\s.+napisao\/la:|Le\s.+a ecrit\s*:|Am\s.+schrieb.*:|U\s.+je napisao\/la:|[-]{2,}\s*Original Message\s*[-]{2,}|[-]{2,}\s*Izvorna poruka\s*[-]{2,}|Korisnik.+reagirao je putem Gmaila|[^\n]+je napisao:) /i;
            const isQuoteLine = (l:string)=> l.trim().startsWith('>');

            for (const line of lines) {
                const trimmed = line.trim();

                if (quoteHeaderPattern.test(trimmed) || isQuoteLine(trimmed)) 
                    break;

                if (trimmed.endsWith("reagirao je putem Gmaila"))
                    break;
                
                if (trimmed.includes("-------- Izvorna poruka --------"))
                    break;

                // catch if matches patterns like "On 2025-05-09 14:23, Amela Karic wrote:"
                if (/On \d{4}-\d{2}-\d{2} \d{2}:\d{2}, .+ wrote:/.test(trimmed))
                    break;
                
                replyLines.push(line);
            }

            const replyText = replyLines.join('\n').trim();

            replyHtml = escapeHtml(replyText).replace(/\n/g, '<br />');
        }

        else if (bodyHtml) 
            replyHtml = bodyHtml;        

        setLatestReplyHtml(replyHtml || '(Body not available)');

    }, [bodyHtml, bodyText]);

    return (
        <div className="whitespace-pre-wrap break-words">
            <div dangerouslySetInnerHTML={{ __html: latestReplyHtml }} />
        </div>
    );
};

export default EmailMessageContent; 