import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { EmailMessage, FacebookMessage } from '@repo/ui/lib/types';
import { createSupabaseServerClient, createSupabaseAdminClient, sendServerErrorEmail, verifyAdminUser, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { streamAnthropicResponse } from '@repo/ui/lib/serverUtils';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
    let body: any;
    try {
        await verifyAdminUser();

        body = await request.json();

        const { conversation, previous_reply, instruction, translation_only } = body;

        validateRequestBody(body, ['conversation', 'translation_only']);

        console.log("Called /generate-reply route with translationOnly: " + translation_only);

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        const pageId = user?.user_metadata?.facebook_integration?.pageId;

        const adminClient = await createSupabaseAdminClient();
        const { data: offers, error: offersError } = await adminClient.from('offers').select('*');

        if (offersError)
            throw new Error("Error fetching offers: " + offersError.message);

        if (body.source === 'facebook' && !pageId && !translation_only)
            throw new Error("Facebook Page ID not found in user metadata, cannot process Facebook message.");

        if (!process.env.ANTHROPIC_API_KEY)
            throw new Error("AI Service is not configured.");

        if (!Array.isArray(conversation) || conversation.length === 0)
            throw new Error("Invalid or empty conversation provided.");

        // Check cache for translation if this is a translation-only request
        if (translation_only) {
            let messageId = '';
            let content = '';

            if (body.source === 'email') {
                const emailMsg = conversation[0] as EmailMessage;
                messageId = emailMsg.id;
                content = emailMsg.bodyText || emailMsg.bodyHtml || '';
            } else if (body.source === 'facebook') {
                const fbMsg = conversation[0] as FacebookMessage;
                messageId = fbMsg.id;
                content = fbMsg.message || '';
            }

            if (messageId) {
                // Check if translation exists in cache
                const adminClient = await createSupabaseAdminClient();
                const { data: cachedTranslation, error } = await adminClient
                    .from('translate_cache')
                    .select('translation')
                    .eq('message_id', messageId)
                    .maybeSingle();

                if (!error && cachedTranslation) {
                    console.log(`Translation for message ${messageId} found in cache`);
                    // Return cached translation in the expected format
                    const formattedResponse = `[ORIGINAL]
${content}
[/ORIGINAL]

[TRANSLATION]
${cachedTranslation.translation}
[/TRANSLATION]`;
                    return new Response(formattedResponse, {
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                    });
                }
            }
        }

        // Use a different system prompt if this is a translation-only request
        const systemPrompt = translation_only
            ? `
            You are a translation assistant. You will receive a message in Croatian/Serbian/Bosnian or similar Balkan language.
            
            Translate this text accurately to English. Your response must follow this exact format:
            
            [ORIGINAL]
            <paste the original text unchanged>
            [/ORIGINAL]
            
            [TRANSLATION]
            <your accurate English translation>
            [/TRANSLATION]
            
            Only output the formatted response, nothing else.`
            : `
            You are a customer support agent for me, Kristina Mitrović. I am pasting customer messages to you, you generate responses. Be nice and warm, but keep your responses very short and concise. I am Kristina, a woman, make the responses sound like from a woman. End with "Srdačan pozdrav, 
            Kristina"

            When greeting, use the name of the customer verbatim do not change it.

            Write "e-mail" instead of email.

            Your target market is mostly elderly women 35+ in Balkan, not that great with technology. 

            We're selling only a PDF / digital version of this book since paper back is out of print. Sometimes they get this confused. If they can't pay online they can pay with a bank transfer (only alternative payment option right now).

            If they choose bank transfer, here are the details:

            Recipient: Kristina Mitrović
            Bank: PBZ banka
            IBAN: HR3823400093219385216

            We have regional pricing for the book, deduct it from the following code:
            ` + JSON.stringify(offers) + `

            We have a custom built portal which lets them create an account after purchase and download the PDF right away. They will also receive an email with the link to login which is ${process.env.NEXT_PUBLIC_BASE_URL}/login if they forget.

            Keep responses focused to their questions, for example you don't need to tell them where to get the book if they already have it.

            IMPORTANT: You will provide your response in the following format:
            
            [ORIGINAL]
            <your reply in Croatian/Serbian language>
            [/ORIGINAL]
            
            [TRANSLATION]
            <accurate English translation of your reply>
            [/TRANSLATION]
            
            Always follow this format exactly. The translation should be a complete and accurate translation of the original reply.
            If the ticket is an emoji or anything that would not make sense to translate, return literally 'N/A'.`;

        const userMessages: Anthropic.Messages.MessageParam[] = [];
        const adminEmailLower = process.env.ADMIN_EMAIL?.toLowerCase();

        if (translation_only) {
            // For translation-only requests, we just need the message content
            let messageText = '';

            if (body.source === 'email') {
                const emailMsg = conversation[0] as EmailMessage;
                messageText = emailMsg.bodyText || emailMsg.bodyHtml || '';
            } else if (body.source === 'facebook') {
                const fbMsg = conversation[0] as FacebookMessage;
                messageText = fbMsg.message || '';
            }

            const trimmed = messageText.trim();

            if (trimmed.length === 0)
                throw new Error('Message content is empty or missing for translation');

            userMessages.push({ role: "user", content: trimmed });
        } else {
            // For normal support responses, format the conversation
            const formatMessage = (msg: any): string => {
                let senderType = 'Customer';
                let senderIdentifier = '';
                let bodyText = '(empty body)';
                let msgDate = new Date();

                if (body.source === 'email') {
                    const emailMsg = msg as EmailMessage;
                    senderIdentifier = emailMsg.sender?.address || 'Unknown Email';

                    if (adminEmailLower && emailMsg.sender?.address?.toLowerCase() === adminEmailLower)
                        senderType = "Kristina";

                    bodyText = emailMsg.bodyText || emailMsg.bodyHtml || '(empty body)';
                    msgDate = new Date(emailMsg.date);

                } else if (body.source === 'facebook') {
                    const fbMsg = msg as FacebookMessage;
                    senderIdentifier = fbMsg.from?.name || fbMsg.from?.id || 'Unknown FB User';

                    if (pageId && fbMsg.from?.id === pageId)
                        senderType = "Kristina";

                    bodyText = fbMsg.message || '(empty message)';
                    msgDate = new Date(fbMsg.created_time);
                }

                const cleanBody = bodyText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                return `${senderType} (${senderIdentifier} - ${msgDate.toLocaleString()}):\n${cleanBody}\n\n---\n`;
            };

            if (previous_reply && instruction) {
                let readjustPrompt = `Here is the conversation history (latest message last):\n\n`;

                conversation.forEach((msg) => {
                    readjustPrompt += formatMessage(msg);
                });

                readjustPrompt += `\nHere is the previous draft reply I was considering:\n"${previous_reply}"`;
                readjustPrompt += `\n\nPlease revise the draft reply based on this instruction: "${instruction}"`;
                readjustPrompt += `\nMake sure to keep the overall tone and sign-off ("Srdačan pozdrav,\nKristina").`;
                readjustPrompt += `\nRemember to provide both the original Croatian/Serbian response AND its English translation in the format specified.`;

                userMessages.push({ role: "user", content: readjustPrompt });
            } else {
                let initialPrompt = "Here is the conversation history (latest message last):\n\n";

                conversation.forEach((msg) => {
                    initialPrompt += formatMessage(msg);
                });

                initialPrompt += "\nPlease draft a reply to the customer's last message based on the instructions and context provided in the system prompt.";
                initialPrompt += "\nRemember to provide both the original Croatian/Serbian response AND its English translation in the format specified.";

                userMessages.push({ role: "user", content: initialPrompt });
            }
        }

        const stream = await anthropic.messages.create({
            model: "claude-3-7-sonnet-latest", // DO NOT CHANGE EVER
            max_tokens: 64000,
            system: systemPrompt,
            messages: userMessages,
            stream: true,
        });

        // For translation-only requests, cache the result in translate_cache
        if (translation_only) {
            let messageId = '';

            if (body.source === 'email') {
                messageId = (conversation[0] as EmailMessage).id;
            } else if (body.source === 'facebook') {
                messageId = (conversation[0] as FacebookMessage).id;
            }

            if (messageId) {
                const readableStreamWithCaching = new ReadableStream({
                    async start(controller) {
                        let streamData = '';

                        try {
                            for await (const event of stream) {
                                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                                    const chunk = event.delta.text;
                                    streamData += chunk;
                                    controller.enqueue(new TextEncoder().encode(chunk));
                                } else if (event.type === 'message_stop') {
                                    // Extract the translation from the stream data
                                    const translationMatch = streamData.match(/\[TRANSLATION\]([\s\S]*?)\[\/TRANSLATION\]/);

                                    if (translationMatch && translationMatch[1]) {
                                        const translation = translationMatch[1].trim();

                                        // Save to translate_cache
                                        const adminClient = await createSupabaseAdminClient();
                                        const { error } = await adminClient
                                            .from('translate_cache')
                                            .upsert({
                                                message_id: messageId,
                                                translation: translation
                                            });

                                        if (error) {
                                            console.error(`Error saving translation to cache: ${error.message}`);
                                        } else {
                                            console.log(`Translation for message ${messageId} saved to cache`);
                                        }
                                    }

                                    controller.close();
                                }
                            }
                        } catch (error) {
                            controller.error(error);
                        }
                    }
                });

                return new Response(readableStreamWithCaching, {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            }
        }

        const readableStream = streamAnthropicResponse(
            stream,
            { body, request },
            "Error processing Anthropic stream for generate-reply:"
        );

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        sendServerErrorEmail(body || {}, request, "Error in generate-reply handler:", error);

        return NextResponse.json(
            { error: error.message || 'An internal server error occurred' },
            { status: 500 }
        );
    }
} 