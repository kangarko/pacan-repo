import { createPostHandler, createSuccessResponse, validateRequestBody, verifyAdminUser, sendServerEmailRaw, sendServerErrorEmail, createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';
import { ImapFlow } from 'imapflow';
import type { ImapFlowOptions, FetchMessageObject, MessageEnvelopeObject, MailboxLockObject } from 'imapflow';
import { simpleParser, ParsedMail, EmailAddress } from 'mailparser';
import { randomBytes } from 'crypto';
import { EmailMessage as EmailMessageType, EmailThreadSummary } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body, request: Request) => {
    await verifyAdminUser();

    const { action } = body;

    validateRequestBody(body, ['action']);

    let emailAdmin: SupportEmailAdmin | null = null;

    try {
        emailAdmin = new SupportEmailAdmin(request);
        await emailAdmin.connect();

        console.log("Called /email route with action: " + action);

        switch (action) {
            case 'get_threads':
                return await emailAdmin.getThreads();

            case 'get_thread':
                validateRequestBody(body, ['thread_id']);

                return await emailAdmin.getThread(body.thread_id);

            case 'send_reply':
                validateRequestBody(body, ['recipient_email', 'subject', 'reply_body']);

                return await emailAdmin.sendReply(
                    body.recipient_email,
                    body.subject,
                    body.reply_body,
                    body.in_reply_to,
                    body.references
                );

            case 'delete_thread':
                validateRequestBody(body, ['thread_id']);

                return await emailAdmin.deleteThread(body.thread_id);

            case 'move_thread':
                validateRequestBody(body, ['thread_id']);

                return await emailAdmin.moveThread(body.thread_id);

            default:
                throw new Error(`Unknown support action: ${action}`);
        }

    } finally {
        if (emailAdmin)
            try {
                await emailAdmin.disconnect();

            } catch (finalLogoutError: any) {
                throw new Error(`Final logout attempt failed: ${(finalLogoutError as Error).message}`);
            }
    }
});

class SupportEmailAdmin {

    private client: ImapFlow;
    private request: Request;

    constructor(request: Request) {
        this.request = request;

        const config: ImapFlowOptions = {
            host: process.env.IMAP_HOST!,
            port: parseInt(process.env.IMAP_PORT!),
            secure: process.env.IMAP_TLS === 'true',
            auth: {
                user: process.env.ADMIN_EMAIL!,
                pass: process.env.IMAP_PASSWORD!
            },
            tls: { rejectUnauthorized: process.env.NODE_ENV !== 'development' },
            logger: false
        };

        if (!config.auth?.user || !config.auth?.pass || !config.host)
            throw new Error("IMAP environment variables are not properly configured.");

        this.client = new ImapFlow(config);
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        if (this.client && this.client.usable && !this.client.idling) {
            await this.client.logout();
        }
    }

    private generateMessageId(): string {
        const domain = process.env.ADMIN_EMAIL?.split('@')[1];
        return `<${randomBytes(16).toString('hex')}@${domain}>`;
    }

    async getThreads(): Promise<ReturnType<typeof createSuccessResponse>> {
        let inboxLock: MailboxLockObject | null = null;

        try {
            inboxLock = await this.client.getMailboxLock('INBOX');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const searchCriteria = { all: true };
            const fetchOptions = { uid: true, envelope: true, flags: true };
            const threads: Map<string, EmailThreadSummary> = new Map();
            const searchResults = await this.client.search(searchCriteria, { uid: true });

            if (!searchResults || !Array.isArray(searchResults))
                throw new Error('Search results undefined or not an array');

            // --- Fast path: single FETCH call for all UIDs --------------------
            try {
                const uidRange = searchResults.join(',');
                for await (const msg of this.client.fetch(uidRange, fetchOptions, { uid: true })) {
                    try {
                        const envelope = msg.envelope as MessageEnvelopeObject | undefined;
                        const flags = msg.flags || new Set<string>();

                        if (!envelope) continue; // corrupt message

                        const sender = envelope.from?.[0];
                        if (!sender?.address) continue;

                        const senderAddress = sender.address.toLowerCase();
                        if (senderAddress === process.env.ADMIN_EMAIL?.toLowerCase()) continue; // skip our own messages

                        const senderName = sender.name;
                        const subject = envelope.subject || '(No Subject)';
                        const dateObj = envelope.date ? new Date(envelope.date) : new Date();
                        const latestMessageDateString = dateObj.toISOString();
                        const isUnread = !flags.has('\\Seen');

                        const threadIdKey = senderAddress;
                        const existingThread = threads.get(threadIdKey);

                        if (existingThread) {
                            if (dateObj > new Date(existingThread.latestMessageDate)) {
                                existingThread.latestMessageDate = latestMessageDateString;
                                existingThread.subject = subject;
                            }

                            if (isUnread) existingThread.unreadCount = (existingThread.unreadCount || 0) + 1;
                        } else {
                            threads.set(threadIdKey, {
                                threadId: threadIdKey,
                                sender: { name: senderName, address: senderAddress },
                                subject,
                                latestMessageDate: latestMessageDateString,
                                unreadCount: isUnread ? 1 : 0
                            });
                        }
                    } catch (msgErr: any) {
                        throw new Error(`Thread build error: ${msgErr.message}`);
                    }
                }
            } catch (fetchErr: any) {
                throw new Error(`FETCH failed: ${fetchErr.message}`);
            }

            if (inboxLock) {
                inboxLock.release();
                inboxLock = null;
            }

            // Return whatever threads we managed to parse, regardless of errors
            const sortedThreads = Array.from(threads.values()).sort((a, b) => new Date(b.latestMessageDate).getTime() - new Date(a.latestMessageDate).getTime());

            return createSuccessResponse({ threads: sortedThreads });
        } catch (error) {
            if (inboxLock)
                try {
                    inboxLock.release();
                } catch (rlErr: any) {
                    sendServerErrorEmail(this.request, null, `Error releasing inboxLock during handleListThreads error: ${(rlErr as Error).message}`);
                }

            throw error;
        }
    }

    async getThread(threadId: string): Promise<ReturnType<typeof createSuccessResponse>> {
        if (!threadId || typeof threadId !== 'string')
            throw new Error('Invalid threadId provided.');

        const targetEmail = threadId.toLowerCase();
        const fetchOptions = { uid: true, source: true, flags: true, envelope: true };
        const allFetchedMessages: FetchMessageObject[] = [];
        const mailboxesToProcess = [
            { name: 'INBOX', searchCriteria: { from: targetEmail }, isCritical: true },
            { name: process.env.IMAP_SENT_FOLDER_NAME || 'Sent', searchCriteria: { to: targetEmail }, isCritical: true },
            { name: '[Gmail]/Sent Mail', searchCriteria: { to: targetEmail }, isCritical: false }
        ];

        for (const mailboxInfo of mailboxesToProcess) {
            let lock: MailboxLockObject | null = null;

            try {
                lock = await this.client.getMailboxLock(mailboxInfo.name);
                const searchResults = await this.client.search(mailboxInfo.searchCriteria, { uid: true });

                if (searchResults && searchResults.length > 0)
                    for await (const msg of this.client.fetch(searchResults.join(','), fetchOptions, { uid: true }))
                        allFetchedMessages.push(msg);

            } catch (boxError: any) {
                const nonExistent = boxError.message.includes('Mailbox doesn\'t exist') ||
                    boxError.message.includes('does not exist') ||
                    boxError.responseCode === 'NONEXISTENT';

                // Some servers (e.g. Gmail/Yahoo) respond with generic "Command failed" when a UID list is too
                // long or the mailbox refuses the search. Treat this as non-fatal in all cases (we'll just skip that mailbox).
                const commandFailed = boxError.message.includes('Command failed');

                if (nonExistent || commandFailed) {
                    if (nonExistent && mailboxInfo.isCritical)
                        throw new Error(`Critical mailbox ${mailboxInfo.name} does not exist for thread details.`);

                    console.warn(`Skipping mailbox ${mailboxInfo.name} due to ${(nonExistent ? 'non-existent folder' : 'command failed')}: ${(boxError as Error).message}`);

                } else {
                    throw new Error(`Error accessing/searching ${mailboxInfo.name} for thread details: ${(boxError as Error).message}`);
                }

            } finally {
                if (lock)
                    lock.release();
            }
        }

        const uniqueMessagesMap = new Map<string, FetchMessageObject>();

        allFetchedMessages.forEach(msg => {
            if (!uniqueMessagesMap.has(String(msg.uid)))
                uniqueMessagesMap.set(String(msg.uid), msg);
        });

        const messagesToParse = Array.from(uniqueMessagesMap.values());
        const conversation: EmailMessageType[] = [];
        const messagesToTranslate: { id: string, text: string }[] = [];

        for (const item of messagesToParse) {
            const currentUid = item.uid;
            const flags = item.flags || new Set<string>();
            const rawEmail = item.source;
            const envelope = item.envelope as MessageEnvelopeObject | undefined;

            if (!rawEmail || !envelope) {
                sendServerErrorEmail(this.request, null, `Skipping email UID ${currentUid} in thread ${threadId} due to missing source or envelope.`);

                continue;
            }

            let parsedMail: ParsedMail;

            try {
                parsedMail = await simpleParser(rawEmail);
            } catch (parseError: any) {
                throw new Error(`Failed to parse email UID ${currentUid} in thread ${threadId}: ${(parseError as Error).message}`);
            }

            const toAddressesList: EmailAddress[] = parsedMail.to ? (Array.isArray(parsedMail.to) ? parsedMail.to.flatMap(addr => addr.value) : parsedMail.to.value) : [];
            const senderFromParsed = parsedMail.from?.value[0];
            const senderFromEnvelope = envelope.from?.[0];
            const currentReferences = (envelope as any).references;
            const messageText = parsedMail.text || '';
            const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
            const senderAddress = senderFromParsed?.address || senderFromEnvelope?.address || 'Unknown Sender';

            // Only collect messages from the external party for translation
            if (senderAddress.toLowerCase() !== adminEmail && messageText.trim().length > 0) {
                messagesToTranslate.push({
                    id: parsedMail.messageId || `uid-${currentUid}`,
                    text: messageText
                });
            }

            conversation.push({
                id: parsedMail.messageId || `uid-${currentUid}`,
                uid: currentUid,
                sender: {
                    name: senderFromParsed?.name || senderFromEnvelope?.name || undefined,
                    address: senderFromParsed?.address || senderFromEnvelope?.address || 'Unknown Sender'
                },
                recipients: toAddressesList.map((addr: EmailAddress) => ({ name: addr.name, address: addr.address || 'Unknown Recipient' })) || [],
                subject: parsedMail.subject || envelope.subject || '(No Subject)',
                bodyHtml: parsedMail.html || undefined,
                bodyText: parsedMail.text,
                date: (parsedMail.date || (envelope.date ? new Date(envelope.date) : new Date())).toISOString(),
                inReplyTo: parsedMail.inReplyTo || envelope.inReplyTo,
                references: parsedMail.references ? (Array.isArray(parsedMail.references) ? parsedMail.references.join(' ') : parsedMail.references) : (currentReferences ? (Array.isArray(currentReferences) ? currentReferences.join(' ') : currentReferences) : undefined),
                isRead: flags.has('\\Seen')
            });
        }

        conversation.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return createSuccessResponse({ conversation, admin_from: process.env.SMTP_FROM });
    }

    // New method to handle message translation with caching
    async translateMessages(messages: { id: string, text: string }[]): Promise<Map<string, string>> {
        const adminClient = await createSupabaseAdminClient();
        const translationResults = new Map<string, string>();

        if (messages.length === 0) return translationResults;

        // Check cache for existing translations
        const messageIds = messages.map(msg => msg.id);
        const { data: cachedTranslations, error: cacheError } = await adminClient
            .from('translate_cache')
            .select('message_id, translation')
            .in('message_id', messageIds);

        if (cacheError) {
            sendServerErrorEmail(this.request, null, "Error fetching cached translations:", cacheError);
        }

        // Create a map of message ID to cached translation
        const translationCache = new Map<string, string>();
        if (cachedTranslations) {
            cachedTranslations.forEach((item: { message_id: string, translation: string }) => {
                translationCache.set(item.message_id, item.translation);
            });
        }

        // Add all cached translations to results
        translationCache.forEach((translation, id) => {
            translationResults.set(id, translation);
        });

        // Filter to only messages that need translation (not in cache)
        const messagesToTranslateAI = messages.filter(msg => !translationCache.has(msg.id));

        if (messagesToTranslateAI.length === 0) return translationResults;

        // Special handling for single message translation to avoid separator confusion
        if (messagesToTranslateAI.length === 1) {
            try {
                // For a single message, don't use batch processing with separators
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: "claude-3-7-sonnet-latest",
                        max_tokens: messagesToTranslateAI[0].text.length + 200,
                        temperature: 0.2,
                        system: "Translate the following text into English. If it's already in English, return it unchanged.",
                        messages: [
                            { role: 'user', content: messagesToTranslateAI[0].text }
                        ]
                    })
                });

                const data = await response.json();

                if (!data.content || !data.content[0] || !data.content[0].text) {
                    throw new Error("Invalid response from Claude API: " + JSON.stringify(data));
                }

                const translation = data.content[0].text.trim();
                const messageId = messagesToTranslateAI[0].id;

                // Store in results and cache
                translationResults.set(messageId, translation);

                if (translation && translation !== messagesToTranslateAI[0].text) {
                    await adminClient
                        .from('translate_cache')
                        .upsert({
                            message_id: messageId,
                            translation: translation
                        });
                }
            } catch (aiError) {
                sendServerErrorEmail(this.request, null, "Single message translation failed in email:", aiError);
                translationResults.set(messagesToTranslateAI[0].id, messagesToTranslateAI[0].text);
            }

            return translationResults;
        }

        // For multiple messages, use batch processing with separators
        const separator = "---MESSAGE-SEPARATOR---";
        const originalTexts = messagesToTranslateAI.map(msg => msg.text);
        const batchText = originalTexts.join(separator);

        if (!batchText.trim()) return translationResults;

        const systemPrompt = `Translate each of the following text segments into English. The segments are separated by "${separator}". Maintain the same separator in your output. If a segment is already in English or nonsensical, return it unchanged. Output ONLY the translated segments separated by the separator, with no preamble or explanation.`;

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-7-sonnet-latest",
                    max_tokens: batchText.length + (originalTexts.length * 50),
                    temperature: 0.2,
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: batchText }
                    ]
                })
            });

            const data = await response.json();

            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error("Invalid response from Claude API: " + JSON.stringify(data));
            }

            // Clean up the response to handle boundary separators
            let batchTranslationResult = data.content[0].text;

            // Remove leading/trailing separators and whitespace
            batchTranslationResult = batchTranslationResult.trim();
            if (batchTranslationResult.startsWith(separator)) {
                batchTranslationResult = batchTranslationResult.substring(separator.length);
            }
            if (batchTranslationResult.endsWith(separator)) {
                batchTranslationResult = batchTranslationResult.substring(0, batchTranslationResult.length - separator.length);
            }

            const translatedTexts = batchTranslationResult.split(separator);

            // Filter out empty segments
            const filteredTranslations = translatedTexts.filter((text: string) => text.trim().length > 0);

            if (filteredTranslations.length !== originalTexts.length) {
                sendServerErrorEmail(
                    this.request,
                    null,
                    `Batch translation mismatch in email: Expected ${originalTexts.length}, got ${filteredTranslations.length}. Content: ${batchTranslationResult}`
                );

                // If mismatch, don't cache and use original texts
                messagesToTranslateAI.forEach((msg) => {
                    translationResults.set(msg.id, msg.text);
                });
            } else {
                // Store new translations in cache and results
                for (let i = 0; i < messagesToTranslateAI.length; i++) {
                    const messageId = messagesToTranslateAI[i].id;
                    const translation = filteredTranslations[i].trim();

                    if (translation && translation !== originalTexts[i]) {
                        // Add to results
                        translationResults.set(messageId, translation);

                        // Cache the translation
                        await adminClient
                            .from('translate_cache')
                            .upsert({
                                message_id: messageId,
                                translation: translation
                            });
                    } else {
                        // If translation is same as original or empty, just use original
                        translationResults.set(messageId, originalTexts[i]);
                    }
                }
            }
        } catch (aiError) {
            sendServerErrorEmail(this.request, null, "Batch translation AI call failed in email:", aiError);
            // On error, use original texts
            messagesToTranslateAI.forEach((msg) => {
                translationResults.set(msg.id, msg.text);
            });
        }

        return translationResults;
    }

    async sendReply(recipientEmail: string, subject: string, replyBody: string, inReplyTo?: string, references?: string): Promise<ReturnType<typeof createSuccessResponse>> {
        if (!process.env.ADMIN_EMAIL)
            throw new Error('ADMIN_EMAIL environment variable is not set.');

        if (typeof recipientEmail !== 'string' || !recipientEmail.includes('@'))
            throw new Error('Invalid recipient email format.');

        if (typeof subject !== 'string' || subject.trim() === '')
            throw new Error('Subject cannot be empty.');

        if (typeof replyBody !== 'string' || replyBody.trim() === '')
            throw new Error('Reply body cannot be empty.');

        const fromAddress = `<${process.env.SMTP_FROM_NAME}> <${process.env.ADMIN_EMAIL}>`;
        const messageId = this.generateMessageId();
        const sentDate = new Date();

        let rawMessage = `From: ${fromAddress}\r\nTo: ${recipientEmail}\r\nSubject: ${subject}\r\nDate: ${sentDate.toUTCString()}\r\nMessage-ID: ${messageId}\r\n`;

        if (inReplyTo)
            rawMessage += `In-Reply-To: ${inReplyTo}\r\n`;

        if (references)
            rawMessage += `References: ${references}\r\n`;

        rawMessage += `Content-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\nMIME-Version: 1.0\r\n\r\n${replyBody}`;

        await sendServerEmailRaw({
            from: fromAddress, to: recipientEmail, subject: subject, html: replyBody,
            inReplyTo: inReplyTo, references: references, messageId: messageId
        });

        const sentFolderName = process.env.IMAP_SENT_FOLDER_NAME || 'Sent';

        let lock: MailboxLockObject | null = null;

        try {
            lock = await this.client.getMailboxLock(sentFolderName);

        } catch (e: any) {
            if (e.message.includes('does not exist') || e.response_code === 'NONEXISTENT') {
                try {
                    await this.client.mailboxCreate(sentFolderName);

                    lock = await this.client.getMailboxLock(sentFolderName);
                } catch (createError: any) {
                    throw new Error(`Failed to create Sent folder '${sentFolderName}' for IMAP append. Error: ${(createError as Error).message}`);
                }

            } else
                throw new Error(`Could not lock Sent folder '${sentFolderName}': ${(e as Error).message}`);
        }
        try {
            await this.client.append(sentFolderName, rawMessage, ['\\Seen']);
        } catch (appendError: any) {
            throw new Error(`IMAP Error appending message to Sent folder '${sentFolderName}': ${(appendError as Error).message}`);
        } finally {
            if (lock)
                await lock.release();
        }

        return createSuccessResponse({ message: 'Reply sent successfully and append attempt to Sent folder made.' });
    }

    // Method to collect message IDs for a thread
    async getMessageIdsForThread(threadId: string): Promise<string[]> {
        const targetEmail = threadId.toLowerCase();
        const messageIds: string[] = [];

        for (const mailboxName of ['INBOX', 'Sent', '[Gmail]/Sent Mail']) {
            let lock = null;
            try {
                lock = await this.client.getMailboxLock(mailboxName);
                // Get messages from or to this email address
                for (const searchCriteria of [{ from: targetEmail }, { to: targetEmail }]) {
                    const results = await this.client.search(searchCriteria, { uid: true });
                    
                    if (results && results.length) {
                        // Fetch messages to get message IDs
                        for (const uid of results) {
                            try {
                                const fetchResult = await this.client.fetchOne(String(uid), { source: true }, { uid: true });
                                if (fetchResult && fetchResult.source) {
                                    const parsed = await simpleParser(fetchResult.source);
                                    if (parsed.messageId) {
                                        messageIds.push(parsed.messageId);
                                    }
                                }
                            } catch (fetchError) {
                                // Continue with other messages if one fails
                                console.error(`Error fetching message ${uid}: ${fetchError}`);
                            }
                        }
                    }
                }
            } catch (boxError: any) {
                if (!boxError.message.includes('Mailbox doesn\'t exist') &&
                    !boxError.message.includes('does not exist') &&
                    boxError.responseCode !== 'NONEXISTENT') {
                    console.error(`Error searching mailbox ${mailboxName}: ${boxError.message}`);
                }
            } finally {
                if (lock) await lock.release();
            }
        }

        return messageIds;
    }

    // Method to clear translations from cache for a thread
    async clearTranslationsFromCache(threadId: string): Promise<void> {
        try {
            // Get all message IDs associated with this thread
            const messageIds = await this.getMessageIdsForThread(threadId);

            // Delete entries from translate_cache for these message IDs
            if (messageIds.length > 0) {
                const adminClient = await createSupabaseAdminClient();
                for (const messageId of messageIds) {
                    await adminClient
                        .from('translate_cache')
                        .delete()
                        .eq('message_id', messageId);
                }
            }
        } catch (cacheError) {
            // Don't fail the whole operation if cache cleanup fails
            console.error(`Error cleaning up translation cache for thread ${threadId}: ${cacheError}`);
        }
    }

    async deleteThread(threadId: string): Promise<ReturnType<typeof createSuccessResponse>> {
        if (!threadId || typeof threadId !== 'string')
            throw new Error('Invalid threadId provided for flagging thread deleted.');

        const targetEmail = threadId.toLowerCase();


        // Original functionality
        let processedCount = 0;
        const mailboxesToSearch = ['INBOX', 'Sent', '[Gmail]/Sent Mail'];

        for (const mailboxName of mailboxesToSearch) {
            let lock: MailboxLockObject | null = null;
            try {
                lock = await this.client.getMailboxLock(mailboxName);
                const uidsInThisBox: string[] = [];
                const fromResults = await this.client.search({ from: targetEmail }, { uid: true });
                if (fromResults && fromResults.length) 
                    fromResults.forEach(uid => uidsInThisBox.push(String(uid)));
                
                const toResults = await this.client.search({ to: targetEmail }, { uid: true });
                if (toResults && toResults.length) 
                    toResults.forEach(uid => uidsInThisBox.push(String(uid)));
                
                const uniqueUidsInThisBox = [...new Set(uidsInThisBox)];
                if (uniqueUidsInThisBox.length > 0) {
                    await this.client.messageFlagsAdd(uniqueUidsInThisBox.join(','), ['\\Deleted'], { uid: true });
                    processedCount += uniqueUidsInThisBox.length;
                }
            } catch (boxError: any) {
                if (boxError.message.includes('Mailbox doesn\'t exist') || boxError.message.includes('does not exist') || boxError.responseCode === 'NONEXISTENT') {
                    console.warn(`Mailbox ${mailboxName} does not exist, skipping for deletion flagging.`);
                } else {
                    throw new Error(`Error processing mailbox ${mailboxName} for deletion flagging: ${(boxError as Error).message}`);
                }
            } finally {
                if (lock) await lock.release();
            }
        }
        return createSuccessResponse({ message: `Deletion flagging completed. Marked ${processedCount} messages for deletion.` });
    }

    async moveThread(threadId: string): Promise<ReturnType<typeof createSuccessResponse>> {
        if (!threadId || typeof threadId !== 'string')
            throw new Error('Invalid threadId provided for moving thread to tickets.');

        const ticketsFolderName = process.env.IMAP_TICKETS_FOLDER_NAME || 'Tickets';
        const targetEmail = threadId.toLowerCase();

        // Original functionality continues
        let processedCount = 0;
        let ticketsFolderExists = false;

        // First ensure tickets folder exists
        try {
            const mailboxes = await this.client.list();
            ticketsFolderExists = mailboxes.some(box => box.path === ticketsFolderName);

            if (!ticketsFolderExists) {
                await this.client.mailboxCreate(ticketsFolderName);
                ticketsFolderExists = true;
            }
        } catch (folderError: any) {
            throw new Error(`Failed to ensure Tickets folder exists: ${(folderError as Error).message}`);
        }

        if (!ticketsFolderExists) {
            throw new Error('Failed to create or verify Tickets folder.');
        }

        // Process mailboxes to find messages from this thread
        const mailboxesToSearch = ['INBOX', 'Sent', '[Gmail]/Sent Mail'];

        for (const mailboxName of mailboxesToSearch) {
            let lock: MailboxLockObject | null = null;
            try {
                lock = await this.client.getMailboxLock(mailboxName);

                const uidsInThisBox: string[] = [];

                // Find messages from this thread by from or to address
                const fromResults = await this.client.search({ from: targetEmail }, { uid: true });
                if (fromResults && fromResults.length) 
                    fromResults.forEach((uid) => uidsInThisBox.push(String(uid)));

                const toResults = await this.client.search({ to: targetEmail }, { uid: true });
                if (toResults && toResults.length) 
                    toResults.forEach((uid) => uidsInThisBox.push(String(uid)));

                const uniqueUidsInThisBox = [...new Set(uidsInThisBox)];

                if (uniqueUidsInThisBox.length > 0) {
                    // Copy messages to tickets folder
                    for (const uid of uniqueUidsInThisBox) {
                        try {
                            await this.client.messageCopy(uid, ticketsFolderName, { uid: true });
                            processedCount++;
                        } catch (copyError: any) {
                            sendServerErrorEmail(
                                this.request,
                                null,
                                `Error copying message UID ${uid} from ${mailboxName} to ${ticketsFolderName}: ${(copyError as Error).message}`
                            );
                        }
                    }

                    // Delete messages from original folder after copy
                    await this.client.messageFlagsAdd(uniqueUidsInThisBox.join(','), ['\\Deleted'], { uid: true });
                }

            } catch (boxError: any) {
                if (boxError.message.includes('Mailbox doesn\'t exist') || boxError.message.includes('does not exist') || boxError.responseCode === 'NONEXISTENT') {
                    console.warn(`Mailbox ${mailboxName} does not exist, skipping for thread move.`);
                } else {
                    throw new Error(`Error processing mailbox ${mailboxName} for thread move: ${(boxError as Error).message}`);
                }
            } finally {
                if (lock) await lock.release();
            }
        }

        return createSuccessResponse({
            message: `Thread move completed. Moved ${processedCount} messages to Tickets folder.`
        });
    }
}