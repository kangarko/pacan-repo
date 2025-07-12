import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { NextResponse } from "next/server";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { EmailTemplate, EventType, LabeledTracking, Offer, PaymentMethod, Tracking } from "@repo/ui/lib/types";
import { convertToFacebookEvent, convertUtcToLocal, ensureError, fetchWithRetry, getPricing } from "@repo/ui/lib/utils";
import crypto from 'crypto';
import React from "react";
import { OrderConfirmationEmail } from "@repo/ui/email/OrderConfirmationEmail";
import { render } from "@react-email/render";
import AdminOrderCompleteEmail from "@repo/ui/email/AdminOrderCompleteEmail";
import AdminFormSubmissionEmail from "@repo/ui/email/AdminFormSubmissionEmail";
import AdminErrorEmail from "@repo/ui/email/AdminErrorEmail";
import Anthropic from "@anthropic-ai/sdk";
import AdminWebinarFeedbackEmail from "@repo/ui/email/AdminWebinarFeedbackEmail";
import AdminContactFormEmail from "@repo/ui/email/AdminContactFormEmail";
import AccountCreatedManuallyEmail from "@repo/ui/email/AccountCreatedManuallyEmail";

export function registerProcessEventListeners() {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
        return;
    }

    process.on('unhandledRejection', (reason) => {
        try {
            const errorToSend = reason instanceof Error ? reason : new Error(String(reason));
            sendServerErrorEmail({ rejectionReason: String(reason) }, null, 'Unhandled promise rejection', errorToSend);
        } catch (emailError) {
            console.error('Failed to send error email for unhandled rejection:', emailError);
        }
    });

    process.on('uncaughtException', (error) => {
        sendServerErrorEmail({}, null, 'Uncaught exception', error);
    });
}

/**
 * Creates a Supabase server client
 */
export async function createSupabaseServerClient() {
    'use server';

    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates an admin client
 */
export async function createSupabaseAdminClient(): Promise<SupabaseClient> {
    'use server';

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

/**
 * Sends an email
 */
export async function sendServerEmail(template: EmailTemplate, data: any, recipient: string | undefined = undefined, replyTo: string | undefined = undefined) {
    'use server';

    let email: React.ComponentType<any>;
    let subject: string;
    let to = recipient;

    if (process.env.NODE_ENV === 'development' && template === EmailTemplate.ADMIN_ERROR) {
        console.log('Skipping sending error email in development environment');

        return;
    }

    console.log('Preparing email ' + template + ' to ' + recipient + ' with reply to ' + replyTo);

    switch (template) {
        case EmailTemplate.ORDER_SUCCESS: {
            email = OrderConfirmationEmail;
            subject = "Hvala na Vašoj narudžbi! 🎉";

            break;
        }

        case EmailTemplate.ACCOUNT_CREATED_MANUALLY: {
            email = AccountCreatedManuallyEmail;
            subject = "Vaš račun je kreiran";

            break;
        }

        case EmailTemplate.ADMIN_ORDER_SUCCESS: {
            const journey = await getJourneyData(data.user_id, data.email);
            data.journey = journey.data;

            subject = 'Nova narudžba: ' + data.value + " " + data.currency + " - " + data.name + " (" + data.email + ")";
            email = AdminOrderCompleteEmail;
            to = process.env.ADMIN_EMAIL;

            break;
        }

        case EmailTemplate.ADMIN_FORM_SUBMITTED: {
            subject = `Novi upitnik ispunjen (${data.form_slug}) - ${data.name} (${data.email})`;
            email = AdminFormSubmissionEmail;
            to = process.env.ADMIN_EMAIL;

            break;
        }

        case EmailTemplate.ADMIN_ERROR: {
            subject = '🚨 Error Alert - ' + process.env.NEXT_PUBLIC_BASE_URL;
            email = AdminErrorEmail;
            to = process.env.ADMIN_EMAIL;

            break;
        }

        case EmailTemplate.ADMIN_FEEDBACK: {
            const { webinar_title, rating } = data;

            subject = `Webinar feedback (${rating}/5) - ${webinar_title}`;
            email = AdminWebinarFeedbackEmail;
            to = process.env.ADMIN_EMAIL;

            break;
        }

        case EmailTemplate.ADMIN_CONTACT_FORM: {
            subject = `Novi kontakt s weba - ${data.name}`;
            email = AdminContactFormEmail;
            to = process.env.ADMIN_EMAIL;

            break;
        }

        default:
            throw new Error(`Unknown email template: ${template}`);
    }

    if (!to)
        throw new Error('Recipient is required to send ' + template + ' email');

    await sendServerEmailRaw({
        to: to,
        subject: subject,
        html: await render(React.createElement(email, data)),
        replyTo: replyTo
    });
}

/**
 * Sends an email using raw Nodemailer options.
 */
export async function sendServerEmailRaw(mailOptions: Mail.Options) {
    'use server';

    if (!mailOptions.from)
        mailOptions.from = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`;

    const maxRetries = 4;
    const delayMs = 5000;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 30000,
        socketTimeout: 20000,
        greetingTimeout: 20000,
    });

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Email to ${mailOptions.to} sending attempt ${attempt} of ${maxRetries}`);
            const info = await transporter.sendMail(mailOptions);

            return info;
        } catch (error) {
            lastError = error;
            console.log(`Email to ${mailOptions.to} sending attempt ${attempt} failed:`, error);

            if (attempt < maxRetries)
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }

    console.error(`Failed to send email to ${mailOptions.to} after ${maxRetries} attempts.`);
    throw lastError;
}

/**
 * Verifies that the current user is authenticated and has admin role
 */
export async function verifyAdminUser() {
    'use server';

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('Unauthorized: You are not logged in, please log in to continue.');

    if (user.user_metadata.role !== 'admin')
        throw new Error('Unauthorized: You are not an admin, please contact support if you believe this is an error.');
}

/**
 * Verifies that the current user is authenticated and has admin or marketer role
 */
export async function verifyAdminOrMarketerUser() {
    'use server';

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('Unauthorized: You are not logged in, please log in to continue.');

    if (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'marketer')
        throw new Error('Unauthorized: You are not an admin or marketer, please contact support if you believe this is an error.');

    return user;
}

/**
 * Extracts the client IP address from a Next.js request object
 */
export async function getClientIp(request: Request): Promise<string | undefined> {
    'use server';

    if (!request)
        throw new Error('No request object provided');

    if (!request.headers)
        return undefined;

    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const ip = forwardedFor?.split(',')[0].trim() || realIp;

    if (!ip)
        throw new Error('No IP address found');

    return ip == '::1' || ip == '::ffff:127.0.0.1' ? '127.0.0.1' : ip;
}

/**
 * Gets a customer by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    'use server';

    const adminClient = await createSupabaseAdminClient();

    let page = 1;
    const perPage = 1000;
    const maxPages = 1000; // Safety limit: check up to 1M users

    while (page <= maxPages) {
        const { data, error } = await adminClient.auth.admin.listUsers({
            page: page,
            perPage: perPage,
        });

        if (error)
            throw new Error('Error listing users for ' + email + ': ' + error.message);

        if (!data || data.users.length === 0)
            return null;

        const user = data.users.find(user => user.email === email);

        if (user)
            return user;

        if (data.users.length < perPage)
            return null;

        page++;
    }

    return null;
}

/**
 * Gets a purchase by payment ID
 */
export async function getPurchaseByPaymentId(paymentId: string): Promise<Tracking | null> {
    'use server';

    const adminClient = await createSupabaseAdminClient();
    const { data, error } = await adminClient
        .from('tracking')
        .select('*')
        .eq('type', 'buy')
        .or(`metadata->>payment_id.eq.${paymentId},metadata->>paypal_order_id.eq.${paymentId}`)
        .maybeSingle();

    if (error)
        throw error;

    if (data)
        data.date = convertUtcToLocal(data.date);

    return data ? validateTrackingRow(data) : null;
}

/**
 * Gets purchases by email
 */
export async function getPurchasesByEmail(email: string): Promise<Tracking[]> {
    'use server';

    const adminClient = await createSupabaseAdminClient();
    const { data, error } = await adminClient
        .from('tracking')
        .select('*')
        .eq('type', 'buy')
        .eq('email', email)
        .order('date', { ascending: false });

    if (error)
        throw error;

    data.forEach(row => {
        row.date = convertUtcToLocal(row.date);
    });

    return data.map(purchase => validateTrackingRow(purchase));
}

/**
 * Converts a tracking row to a purchase
 */
export function validateTrackingRow(row: any): Tracking {
    if (row.id === undefined)
        throw new Error(`Missing id field from: ${JSON.stringify(row)}`);

    if (row.date === undefined)
        throw new Error(`Missing date field from: ${JSON.stringify(row)}`);

    if (row.type === undefined)
        throw new Error(`Missing type field from: ${JSON.stringify(row)}`);

    if (row.user_id === undefined)
        throw new Error(`Missing user_id field from: ${JSON.stringify(row)}`);

    if (row.ip === undefined)
        throw new Error(`Missing ip field from: ${JSON.stringify(row)}`);

    if (row.metadata === undefined)
        throw new Error(`Missing metadata field from: ${JSON.stringify(row)}`);

    if (row.type === 'buy') {
        if (row.metadata.payment_method === undefined)
            throw new Error(`Missing payment_method field from: ${JSON.stringify(row)}`);

        if (row.metadata.payment_id === undefined)
            throw new Error(`Missing payment_id field from: ${JSON.stringify(row)}`);

        if (row.metadata.payment_status === undefined)
            throw new Error(`Missing payment_status field from: ${JSON.stringify(row)}`);

        if (row.metadata.name === undefined)
            throw new Error(`Missing name field from: ${JSON.stringify(row)}`);

        if (row.metadata.email === undefined)
            throw new Error(`Missing email field from: ${JSON.stringify(row)}`);

        if (row.metadata.region === undefined)
            throw new Error(`Missing region field from: ${JSON.stringify(row)}`);

        if (row.metadata.value === undefined)
            throw new Error(`Missing value field from: ${JSON.stringify(row)}`);

        if (row.metadata.currency === undefined)
            throw new Error(`Missing currency field from: ${JSON.stringify(row)}`);

        if (row.metadata.primary_offer_slug === undefined)
            throw new Error(`Missing primary_offer_slug field from: ${JSON.stringify(row)}`);

        if (row.metadata.primary_offer_price === undefined)
            throw new Error(`Missing primary_offer_price field from: ${JSON.stringify(row)}`);

        if (row.metadata.secondary_offer_slug !== undefined && row.metadata.secondary_offer_price === undefined)
            throw new Error(`Missing secondary_offer_price field when secondary_offer_slug is set (${row.metadata.secondary_offer_slug}) from: ${JSON.stringify(row)}`);

        if (row.metadata.secondary_offer_slug === undefined && row.metadata.secondary_offer_price !== undefined)
            throw new Error(`Missing secondary_offer_slug field when secondary_offer_price is set from: ${JSON.stringify(row)}`);
    }

    return row;
}

/**
 * Track server-side event
 */
export async function trackServer(request: Request, eventType: EventType, data: {
    date?: string;
    url: string;
    event_id: string;
    ip?: string;
    user_agent?: string;
    referer?: string;
    source_type?: string;
    source?: string;
    campaign_id?: string;
    adset_id?: string;
    ad_id?: string;
    fbclid?: string;
    fbc?: string;
    fbp?: string;
    sokol_id?: string;
    user_id?: string | number;
    headline_id?: string;
    // additional
    name?: string;
    email?: string;
    region?: string;
    value?: number;
    currency?: string;
    primary_offer_slug?: string;
    primary_offer_price?: number;
    secondary_offer_slug?: string;
    secondary_offer_price?: number;
    payment_method?: PaymentMethod;
    payment_id?: string;
    payment_status?: string;
    paypal_email?: string;
    paypal_name?: string;
    paypal_order_id?: string;
}) {
    'use server';

    // Basic validation
    if (!['view', 'sign_up', 'buy_click', 'buy', 'buy_decline', 'webinar_name', 'webinar_email'].includes(eventType))
        throw new Error('[server/track] Invalid event type: ' + eventType);

    if (!data.url || !data.event_id)
        throw new Error('[server/track] Missing required url and event_id parameters: ' + JSON.stringify(data));

    if (eventType === 'webinar_email') {
        if (!data.email)
            throw new Error('[server/track] Missing email parameter for ' + eventType + ' event.');

        if (!data.region)
            throw new Error('[server/track] Missing region parameter for ' + eventType + ' event.');

        if (!data.primary_offer_slug)
            throw new Error('[server/track] Missing primary_offer_slug parameter for ' + eventType + ' event.');
    }

    if (eventType === 'webinar_name') {
        if (!data.name)
            throw new Error('[server/track] Missing name parameter for ' + eventType + ' event.');

        if (!data.email)
            throw new Error('[server/track] Missing email parameter for ' + eventType + ' event.');

        if (!data.region)
            throw new Error('[server/track] Missing region parameter for ' + eventType + ' event.');

        if (!data.primary_offer_slug)
            throw new Error('[server/track] Missing primary_offer_slug parameter for ' + eventType + ' event.');
    }

    if (eventType === 'sign_up') {
        if (!data.name)
            throw new Error('[server/track] Missing name parameter for ' + eventType + ' event.');

        if (!data.email)
            throw new Error('[server/track] Missing email parameter for ' + eventType + ' event.');

        if (!data.region)
            throw new Error('[server/track] Missing region parameter for ' + eventType + ' event.');

        if (!data.primary_offer_slug)
            throw new Error('[server/track] Missing primary_offer_slug parameter for ' + eventType + ' event.');
    }

    if (eventType === 'buy') {
        if (!data.name)
            throw new Error('[server/track] Missing name parameter for ' + eventType + ' event.');

        if (!data.email)
            throw new Error('[server/track] Missing email parameter for ' + eventType + ' event.');

        if (!data.region)
            throw new Error('[server/track] Missing region parameter for ' + eventType + ' event.');

        if (!data.payment_id)
            throw new Error('[server/track] Missing payment_id parameter for ' + eventType + ' event.');

        if (!data.payment_method)
            throw new Error('[server/track] Missing payment_method parameter for ' + eventType + ' event.');

        if (!data.payment_status)
            throw new Error('[server/track] Missing payment_status parameter for ' + eventType + ' event.');

        if (!data.value)
            throw new Error('[server/track] Missing value parameter for ' + eventType + ' event.');

        if (!data.currency)
            throw new Error('[server/track] Missing currency parameter for ' + eventType + ' event.');

        if (!data.primary_offer_slug)
            throw new Error('[server/track] Missing primary_offer_slug parameter for ' + eventType + ' event.');
    }

    let ip = data.ip;
    if (ip) {
        delete data.ip; // Remove it so it doesn't get into metadata.
    } else {
        ip = await getClientIp(request);
    }

    if (!ip)
        throw new Error('[server/track] Missing client IP: ' + JSON.stringify(data));

    // Date can be earlier for example the date of the purchase
    const date = data.date || new Date().toISOString();

    // But we dont want to store it in the metadata since the date column itself is modified 
    if (data.date)
        delete data.date;

    // If email is not provided but the user is logged in, use his email
    if (!data.email) {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user)
            data.email = user.email;
    }

    const adminClient = await createSupabaseAdminClient();
    const cookieStore = await cookies();

    const { data: offers, error: offersError } = await adminClient.from('offers').select('*');

    if (offersError)
        throw new Error("Error fetching offers: " + offersError.message);

    const urlObj = new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`);
    const url = urlObj.hostname + (urlObj.pathname === '/' ? '' : urlObj.pathname);
    const isIgnored = ip.startsWith('2a03:2880:') || data.user_agent?.includes('bot') || data.user_agent?.includes('spider') || data.user_agent?.includes('crawler');

    // Check if user_id is provided in params first, otherwise get from cookies
    let userId = data.user_id;
    if (userId)
        delete data.user_id;
    else
        userId = cookieStore.get('user_id')?.value;

    if (!userId)
        throw new Error('[server/track] No user_id found in params or cookies. This is a critical error - user_id MUST be set by SokolSessionHandler before any tracking can occur.');

    if (userId == '1')
        throw new Error('[server/track] User ID is 1');

    let fbc = cookieStore.get('_fbc')?.value;
    let fbp = cookieStore.get('_fbp')?.value;

    if (!fbc && !fbp) {

        // Try to find fbc and fbp from the user
        const { data: oldestAttributedRow, error: oldestAttributedRowError } = await adminClient
            .from('tracking')
            .select('metadata')
            .eq('user_id', userId)
            .not('metadata->>fbc', 'is', null)
            .not('metadata->>fbp', 'is', null)
            .order('date', { ascending: true })
            .limit(1)
            .single();

        if (oldestAttributedRowError && oldestAttributedRowError.code !== 'PGRST116')
            throw new Error('[server/track] Error fetching oldest metadata row: ' + JSON.stringify(oldestAttributedRowError));

        if (!data.fbclid && oldestAttributedRow && oldestAttributedRow.metadata) {
            fbc = String(oldestAttributedRow.metadata.fbc);
            fbp = String(oldestAttributedRow.metadata.fbp);

            cookieStore.set('_fbc', fbc, { path: '/', expires: 365 * 2 * 24 * 60 * 60, sameSite: 'lax' });
            cookieStore.set('_fbp', fbp, { path: '/', expires: 365 * 2 * 24 * 60 * 60, sameSite: 'lax' });
        }
    }

    if (data.fbclid && !fbc)
        fbc = generateFbc(data.fbclid);

    if (!fbp)
        fbp = generateFbp();

    // Only save fbc and fbp if fbclid is present in query params
    if (data.fbclid) {
        data.fbc = fbc;

        data.fbp = fbp;
    }

    if (eventType === 'buy') {
        const isPayPal = data.payment_method === 'paypal';

        if (isPayPal) {
            if (!data.paypal_name)
                throw new Error('Missing paypal_name field from PayPal payment: ' + JSON.stringify(data));

            if (!data.paypal_email)
                throw new Error('Missing paypal_email field from PayPal payment: ' + JSON.stringify(data));

            if (!data.paypal_order_id)
                throw new Error('Missing paypal_order_id field from PayPal payment: ' + JSON.stringify(data));
        }

        {
            const { data: existingTracking, error: existingTrackingError } = await adminClient
                .from('tracking')
                .select('metadata')
                .eq('metadata->>payment_id', data.payment_id)
                .limit(1)
                .single();

            if (existingTrackingError && existingTrackingError.code !== 'PGRST116')
                throw new Error('Failed to check if tracking already has metadata column with matching payment_id: ' + JSON.stringify(existingTrackingError));

            if (existingTracking)
                throw new Error('Tracking already has a metadata column with matching payment_id. Got: ' + JSON.stringify(data));
        }

        {
            const primaryOffer = offers.find((offer: Offer) => offer.slug === data.primary_offer_slug);

            if (!primaryOffer)
                throw new Error('Invalid primary offer slug: ' + data.primary_offer_slug);

            const primaryPricing = getPricing(primaryOffer, data.region!);

            data.primary_offer_price = isPayPal ? primaryPricing.discounted_price_eur : primaryPricing.discounted_price;
        }

        if (data.secondary_offer_slug) {
            const secondaryOffer = offers.find((offer: Offer) => offer.slug === data.secondary_offer_slug);

            if (!secondaryOffer)
                throw new Error('Invalid secondary offer slug: ' + data.secondary_offer_slug);

            const secondaryPricing = getPricing(secondaryOffer, data.region!);

            data.secondary_offer_price = isPayPal ? secondaryPricing.discounted_price_eur : secondaryPricing.discounted_price;
        }

        data.payment_status = 'succeeded';
    }

    if (!isIgnored) {
        const metadata = { ...data };

        delete (metadata as any).event_type;
        delete (metadata as any).url;
        delete (metadata as any).event_id;
        delete metadata.user_agent;
        delete metadata.referer;
        delete metadata.source_type;
        delete metadata.source;
        delete metadata.campaign_id;
        delete metadata.adset_id;
        delete metadata.ad_id;
        delete metadata.sokol_id;

        if (eventType == 'view' && metadata.email)
            delete metadata.email;

        Object.keys(metadata).forEach(key => {
            if (metadata[key as keyof typeof metadata] === null)
                delete metadata[key as keyof typeof metadata];
        });

        const headlineId = cookieStore.get('headline_id')?.value;

        if (headlineId)
            metadata.headline_id = headlineId;
        else
            sendServerErrorEmail(null, request, '[Warning] No headline_id found in cookies while tracking ' + eventType, new Error('[Warning] No headline_id found in cookies while tracking ' + eventType));

        const trackingData = {
            date: date,
            type: eventType,
            user_id: parseInt(String(userId!)),
            email: data.email || '',
            ip: ip,
            referer: data.referer || '',
            source_type: data.source_type || null,
            source: data.source || null,
            campaign_id: data.campaign_id || null,
            adset_id: data.adset_id || null,
            ad_id: data.ad_id || null,
            user_agent: data.user_agent || '',
            url: url,
            metadata: metadata
        }

        if (eventType !== 'view') {
            const filteredData = Object.fromEntries(Object.entries(trackingData).filter(([, value]) => value !== null && value !== ''));

            console.log(`[Tracking/backend] Inserting ${eventType}:`, JSON.stringify(filteredData, null, 2));
        }

        const result = await adminClient
            .from('tracking')
            .insert(trackingData);

        if (result.error)
            throw new Error(`Error inserting ${eventType} tracking data: ` + result.error.message);
    }

    if (eventType === 'sign_up' || eventType === 'webinar_name') {
        const nameParts = data.name!.split(' ');
        const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
        const lastName = nameParts.slice(1).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
        const tags = eventType === 'sign_up' ? `Region ${data.region}, signup-for-${data.primary_offer_slug}` : `Region ${data.region}, webinar-${data.primary_offer_slug}`;

        await addContactToWordPressList(firstName, lastName, data.email!, tags);
    }

    else if (eventType == 'buy_click' || eventType == 'buy_decline' || eventType == 'buy') {
        const prefix = eventType === 'buy_click' ? 'buy-click-for-' : eventType === 'buy_decline' ? 'buy-decline-for-' : 'purchased-';
        const tags = new Array<string>();

        tags.push(`${prefix}${data.primary_offer_slug}`);

        if (data.secondary_offer_slug)
            tags.push(`${prefix}${data.secondary_offer_slug}`);

        await addContactTagToWordPressList(data.email!, tags.join(', '));
    }

    const facebookEventType = convertToFacebookEvent(eventType);

    if (facebookEventType) {
        const facebookData: Record<string, any> = {
            name: data.name || cookieStore.get('lead_name')?.value,
            email: data.email || cookieStore.get('lead_email')?.value,
            region: data.region,
            url: data.url,
            ip: ip,
            user_agent: data.user_agent,
            event_id: data.event_id,
            fbp: fbp,
            fbc: fbc,
            user_id: userId
        };

        if (eventType === 'buy' || eventType === 'buy_click') {
            facebookData.content_ids = [data.primary_offer_slug];
            facebookData.content_type = 'product';
            facebookData.currency = data.currency;
            facebookData.value = data.value;

            if (data.secondary_offer_slug)
                facebookData.content_ids.push(data.secondary_offer_slug);
        }

        const eventTime = Math.floor(new Date(date).getTime() / 1000);

        const payload = {
            data: [
                {
                    event_name: facebookEventType,
                    event_time: eventTime,
                    event_id: data.event_id,
                    event_source_url: data.url,
                    action_source: 'website',
                    user_data: prepareUserData(facebookData),
                    custom_data: prepareCustomData(facebookData)
                }
            ],
            test_event_code: process.env.FB_TEST_EVENT_CODE ? process.env.FB_TEST_EVENT_CODE : undefined
        };

        //if (eventType !== 'view')
        //    console.log(`[Tracking/backend] Sending ${facebookEventType} payload:`, JSON.stringify(payload, null, 2));

        if (!isIgnored && process.env.NODE_ENV !== 'development') {
            const response = await fetch(`https://graph.facebook.com/v22.0/${process.env.NEXT_PUBLIC_FB_PIXEL_ID}/events?access_token=${process.env.FB_API_ACCESS_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            //console.log('Facebook response:', result);

            if ((!response.ok || result.error))
                throw new Error('Error from Facebook API: ' + JSON.stringify(result, null, 2));
        }
    }

    // set fbc and fbp in cookies if they are not already set
    if (fbc && !cookieStore.get('_fbc')?.value)
        cookieStore.set('_fbc', fbc, {
            path: '/',
            maxAge: 365 * 2 * 24 * 60 * 60, // 2 years
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // Needs to be accessible by client-side JS (e.g., track function)
        });

    if (fbp && !cookieStore.get('_fbp')?.value)
        cookieStore.set('_fbp', fbp, {
            path: '/',
            maxAge: 365 * 2 * 24 * 60 * 60, // 2 years
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // Needs to be accessible by client-side JS (e.g., track function)
        });
}

function generateFbp() {
    const version = 1;
    const timestamp = Math.floor(Date.now() / 1000);
    const randomNum = Math.floor(Math.random() * 10000000000);

    return `fb.${version}.${timestamp}.${randomNum}`;
}

function generateFbc(fbclid: string) {
    const version = 1;
    const timestamp = Math.floor(Date.now() / 1000);

    return `fb.${version}.${timestamp}.${fbclid}`;
}

function prepareCustomData(data: Record<string, any>): Record<string, any> {
    const customData: Record<string, any> = {};

    if (data.content_ids)
        customData.content_ids = data.content_ids;

    if (data.content_type)
        customData.content_type = data.content_type;

    if (data.currency)
        customData.currency = data.currency;

    if (data.value)
        customData.value = data.value;

    return customData;
}

function prepareUserData(userData: Record<string, any>): Record<string, any> {
    const hashedData: Record<string, string> = {};

    if (userData.email)
        hashedData.em = hashData(userData.email.trim().toLowerCase());

    if (userData.name) {
        const nameParts = userData.name.trim().split(/\s+/);

        if (nameParts.length > 0) {
            hashedData.fn = hashData(nameParts[0].toLowerCase().trim());

            if (nameParts.length > 1) {
                const lastName = nameParts.slice(1).join(' ').toLowerCase().trim();

                hashedData.ln = hashData(lastName);
            }
        }
    }

    if (userData.region)
        hashedData.country = hashData(userData.region.toLowerCase());

    if (userData.user_id)
        hashedData.external_id = hashData(userData.user_id);

    if (userData.ip)
        hashedData.client_ip_address = userData.ip;

    if (userData.user_agent)
        hashedData.client_user_agent = userData.user_agent;

    if (userData.fbc)
        hashedData.fbc = userData.fbc;

    if (userData.fbp)
        hashedData.fbp = userData.fbp;

    return hashedData;
}

function hashData(data: any): string {
    const dataString = typeof data === 'string' ? data : String(data);

    return crypto.createHash('sha256').update(dataString).digest('hex');
}

export async function addContactToWordPressList(firstName: string, lastName: string = '', email: string, tags: string) {
    const formData = new URLSearchParams();

    if (!process.env.WP_FLUENTCRM_SECRET)
        throw new Error('WP_FLUENTCRM_SECRET is not set');

    if (!process.env.WP_FLUENTCRM_DOMAIN)
        throw new Error('WP_FLUENTCRM_DOMAIN is not set');

    formData.append('list_id', '1');
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('tags', tags);
    formData.append('password', process.env.WP_FLUENTCRM_SECRET);

    const response = await fetch(`${process.env.WP_FLUENTCRM_DOMAIN}/api/email/add_contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        cache: 'no-store'
    });

    const dataText = await response.text();

    let data;

    try {
        data = JSON.parse(dataText);

    } catch (error) {
        throw new Error('Error parsing JSON response when adding contact to WordPress list! Got: ' + dataText + " and error: " + error);
    }

    if (data.status == 'error')
        throw new Error('Failed to add contact to WordPress list: ' + data.message);
}

async function addContactTagToWordPressList(email: string, tags: string) {
    const formData = new URLSearchParams();

    if (!process.env.WP_FLUENTCRM_SECRET)
        throw new Error('WP_FLUENTCRM_SECRET is not set');

    if (!process.env.WP_FLUENTCRM_DOMAIN)
        throw new Error('WP_FLUENTCRM_DOMAIN is not set');

    formData.append('email', email);
    formData.append('tags', tags);
    formData.append('password', process.env.WP_FLUENTCRM_SECRET);

    const response = await fetch(`${process.env.WP_FLUENTCRM_DOMAIN}/api/email/add_tag`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        cache: 'no-store'
    });

    const dataText = await response.text();
    let data;

    try {
        data = JSON.parse(dataText);

    } catch (error) {
        throw new Error('Error parsing JSON response when adding tag to WordPress contact! Got: ' + dataText + " and error: " + error);
    }

    if (data.status == 'error')
        throw new Error(data.message || 'Failed to add tag to WordPress contact');
}

export async function deleteContactFromWordPressList(email: string) {
    'use server';

    const formData = new URLSearchParams();

    if (!process.env.WP_FLUENTCRM_SECRET)
        throw new Error('WP_FLUENTCRM_SECRET is not set');

    if (!process.env.WP_FLUENTCRM_DOMAIN)
        throw new Error('WP_FLUENTCRM_DOMAIN is not set');

    formData.append('email', email);
    formData.append('password', process.env.WP_FLUENTCRM_SECRET);

    const response = await fetch(`${process.env.WP_FLUENTCRM_DOMAIN}/api/email/delete_contact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        cache: 'no-store'
    });

    const dataText = await response.text();
    let data;

    try {
        data = JSON.parse(dataText);

    } catch (error) {
        throw new Error('Error parsing JSON response when deleting contact from WordPress list! Got: ' + dataText + " and error: " + error);
    }

    if (data.status == 'error')
        throw new Error(data.message || 'Failed to delete contact from WordPress list');
}

export async function getJourneyData(userId: string, email: string): Promise<{ userRegion: string, data: LabeledTracking[] }> {
    'use server';

    const adminClient = await createSupabaseAdminClient();
    const allTrackingData: any[] = [];

    if (userId === '-1') {
        const { data: trackingData, error: trackingError } = await adminClient
            .from('tracking')
            .select('*')
            .eq('user_id', userId);

        if (trackingError)
            throw new Error('Error fetching tracking data by user_id ' + userId + ': ' + trackingError.message);

        allTrackingData.push(...trackingData);
    }

    const { data: emailMatchingTrackingData, error: trackingByEmailError } = await adminClient
        .from('tracking')
        .select('user_id')
        .eq('email', email);

    if (trackingByEmailError)
        throw new Error('Error fetching tracking data by email ' + email + ': ' + trackingByEmailError.message);

    const { data: paypalEmailMatchingTrackingData, error: trackingByPaypalEmailError } = await adminClient
        .from('tracking')
        .select('user_id')
        .eq('metadata->>paypal_email', email);

    if (trackingByPaypalEmailError)
        throw new Error('Error fetching tracking data by PayPal email ' + email + ': ' + trackingByPaypalEmailError.message);

    const combinedByEmail = [...emailMatchingTrackingData, ...paypalEmailMatchingTrackingData];

    const uniqueUserIds = [...new Set(combinedByEmail.map(row => row.user_id))];
    const uniqueEmailMatchingTrackingData = uniqueUserIds.map(user_id => ({ user_id }));

    for (const row of uniqueEmailMatchingTrackingData) {
        if (!row.user_id)
            throw new Error('User ID is missing for in row ' + JSON.stringify(row, null, 2) + " for email " + email);

        const { data: trackingData, error: trackingError } = await adminClient
            .from('tracking')
            .select('*')
            .eq('user_id', row.user_id);

        if (trackingError)
            throw new Error('Error fetching tracking data from email matching user_id ' + row.user_id + ': ' + trackingError.message);

        trackingData.forEach(row => {
            if (!allTrackingData.some(existingRow => existingRow.id === row.id))
                allTrackingData.push(row);
        });
    }

    if (allTrackingData.length === 0)
        return {
            data: [],
            userRegion: ''
        };

    allTrackingData.forEach(row => {
        row.date = convertUtcToLocal(row.date);
    });

    // get the user's region from the most recent sign_up event
    const signUpEvents = allTrackingData.filter(row =>
        row.email === email &&
        row.type === "sign_up" &&
        row.metadata?.region
    ) || [];

    const userRegion = signUpEvents.length > 0 ? signUpEvents[signUpEvents.length - 1].metadata.region : '';

    // Collect all unique Facebook IDs to look up
    const campaignIds = new Set<string>();
    const adSetIds = new Set<string>();
    const adIds = new Set<string>();

    // Extract all FB IDs from tracking data
    (allTrackingData || []).forEach(event => {
        if (event.campaign_id) campaignIds.add(event.campaign_id);
        if (event.adset_id) adSetIds.add(event.adset_id);
        if (event.ad_id) adIds.add(event.ad_id);
    });

    // Look up Facebook cache data
    const fbCacheData: { [key: string]: string } = {};

    // Fetch campaign names
    if (campaignIds.size > 0) {
        const { data: campaignsData } = await adminClient
            .from('fb_name_cache')
            .select('object_id, name')
            .eq('object_type', 'campaign')
            .in('object_id', Array.from(campaignIds));

        (campaignsData || []).forEach(item => {
            fbCacheData[`campaign_${item.object_id}`] = item.name;
        });
    }

    // Fetch ad set names
    if (adSetIds.size > 0) {
        const { data: adSetsData } = await adminClient
            .from('fb_name_cache')
            .select('object_id, name')
            .eq('object_type', 'adset')
            .in('object_id', Array.from(adSetIds));

        (adSetsData || []).forEach(item => {
            fbCacheData[`adset_${item.object_id}`] = item.name;
        });
    }

    // Fetch ad names
    if (adIds.size > 0) {
        const { data: adsData } = await adminClient
            .from('fb_name_cache')
            .select('object_id, name')
            .eq('object_type', 'ad')
            .in('object_id', Array.from(adIds));

        (adsData || []).forEach(item => {
            fbCacheData[`ad_${item.object_id}`] = item.name;
        });
    }

    const labeledTrackingEvents: LabeledTracking[] = [];

    for (const event of allTrackingData) {
        const campaignName = event.campaign_id ? fbCacheData[`campaign_${event.campaign_id}`] : undefined;
        const adSetName = event.adset_id ? fbCacheData[`adset_${event.adset_id}`] : undefined;
        const adName = event.ad_id ? fbCacheData[`ad_${event.ad_id}`] : undefined;

        try {
            labeledTrackingEvents.push({
                id: event.id,
                date: event.date,
                type: event.type,
                user_id: event.user_id,
                email: event.email,
                url: event.url,
                user_agent: event.user_agent,
                ip: event.ip,
                source_type: event.source_type,
                source: event.source,
                campaign_id: event.campaign_id,
                adset_id: event.adset_id,
                ad_id: event.ad_id,
                referer: event.referer,
                metadata: event.metadata,

                action: formatAction(event.type, event.url, event.metadata),
                campaign_name: campaignName,
                adset_name: adSetName,
                ad_name: adName
            });

        } catch (error) {
            throw new Error('Error formatting tracking event: ' + JSON.stringify(event) + ' ' + error);
        }
    }

    labeledTrackingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        data: labeledTrackingEvents,
        userRegion
    };
}

/**
 * Format the action description based on event type and metadata
 */
function formatAction(eventType: string, url: string, metadata: any): string {
    switch (eventType) {
        case 'view':
            return `Visited ${url}${metadata?.referer ? ' from ' + metadata.referer.split('?')[0] : ''}`;

        case 'sign_up':
            return `Signed up as ${metadata?.name || 'Unknown'} at ${metadata?.email || 'unknown email'} on ${url}`;

        case 'buy_click':
            return `Initiated checkout for ${metadata?.primary_offer_slug}` + (metadata?.secondary_offer_slug ? ` and ${metadata?.secondary_offer_slug}` : '') + ` on ${url}`;

        case 'buy':
            return `Purchased ${metadata?.primary_offer_slug}` + (metadata?.secondary_offer_slug ? ` and ${metadata?.secondary_offer_slug}` : '') + ` for ${metadata?.value} ${metadata?.currency || ''} via ${metadata?.payment_method || 'unknown'}`;

        case 'buy_decline':
            return `Got checkout decline for ${metadata?.primary_offer_slug}` + (metadata?.secondary_offer_slug ? ` and ${metadata?.secondary_offer_slug}` : '') + ` due to ${metadata?.error || 'unknown error'} on ${url}`;

        default:
            return `${eventType} on ${url}`;
    }
}

// ------------------------------------------------------------------------------------------------
// Error handling
// ------------------------------------------------------------------------------------------------

/**
 * Sends an error notification email to the admin
 */
export async function sendServerErrorEmail(bodyText: any, request: Request | null, message: string, errorUnknown: unknown | undefined = undefined) {
    'use server';

    const cookieStore = await cookies();
    const ip = request && request.headers ? await getClientIp(request) : 'N/A';
    const url = request && request.url ? new URL(request.url) : null;
    const error = errorUnknown ? ensureError(errorUnknown, message) : new Error(message);

    let combinedMessage = message;

    if (message !== error.message) {
        combinedMessage = `${message}: ${error.message}`;

        console.error(error.message);
    }

    console.error(message);

    if (error.stack)
        console.error(error.stack);

    try {
        // Check rate limit
        const adminClient = await createSupabaseAdminClient();

        // Create hash of the error for deduplication
        const errorHash = crypto
            .createHash('sha256')
            .update(combinedMessage + (error.stack ? error.stack.split('\n')[0] : ''))
            .digest('hex')
            .substring(0, 16);

        // Check if we've sent too many emails in the last 20 seconds
        const twentySecondsAgo = new Date(Date.now() - 20000).toISOString();
        const { count: recentEmailCount, error: countError } = await adminClient
            .from('error_email_rate_limit')
            .select('*', { count: 'exact', head: true })
            .gte('sent_at', twentySecondsAgo);

        if (countError) {
            console.error('Failed to check error email rate limit:', countError);
            // Continue sending email if we can't check the limit
        } else if (recentEmailCount !== null && recentEmailCount >= 10) {
            console.log(`Rate limit exceeded: ${recentEmailCount} error emails sent in last 20 seconds. Skipping email for: ${combinedMessage}`);
            return;
        }

        // Check if we've already sent this exact error recently (within 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentDuplicate } = await adminClient
            .from('error_email_rate_limit')
            .select('id')
            .eq('error_hash', errorHash)
            .gte('sent_at', fiveMinutesAgo)
            .limit(1)
            .maybeSingle();

        if (recentDuplicate) {
            console.log(`Duplicate error email suppressed (sent within 5 minutes): ${combinedMessage}`);
            return;
        }

        // Send the email
        await sendServerEmail(EmailTemplate.ADMIN_ERROR, {
            message: combinedMessage,
            stack: error && error.stack ? error.stack : 'No stack trace',
            url: '[server-side]',
            name: cookieStore.get('lead_name')?.value,
            email: cookieStore.get('lead_email')?.value,
            region: cookieStore.get('region')?.value,
            user_id: cookieStore.get('user_id')?.value,
            ip: ip,
            user_agent: request && request.headers ? request.headers.get('user-agent') : 'N/A',
            get_params: url ? url.searchParams.toString() : '',
            post_params: bodyText,
        }, process.env.ADMIN_EMAIL!);

        // Record that we sent this email
        const { error: insertError } = await adminClient
            .from('error_email_rate_limit')
            .insert({
                sent_at: new Date().toISOString(),
                error_hash: errorHash,
                error_type: 'server'
            });

        if (insertError)
            console.error('Failed to record error email in rate limit table:', insertError);

        // Clean up old entries (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await adminClient
            .from('error_email_rate_limit')
            .delete()
            .lt('sent_at', oneHourAgo);

    } catch (sendError) {
        console.error('Error sending error notification:', sendError);
    }
}

// ------------------------------------------------------------------------------------------------
// API Route Handlers
// ------------------------------------------------------------------------------------------------

/**
 * Creates a handler for POST requests with automatic error handling and request body parsing
 */
export function createPostHandler<T = any>(handler: (body: T, request: Request) => Promise<NextResponse>) {
    return async (request: Request) => {
        const clonedRequest = request.clone();
        let requestText = '';
        const url = new URL(request.url);
        const routePath = url.pathname;

        try {
            requestText = await request.text();
            const parsedBody = parseRequestBody<T>(requestText);
            const response = await handler(parsedBody, clonedRequest);

            return response;

        } catch (error) {
            sendServerErrorEmail(requestText, clonedRequest, `API Error in POST route [${routePath}]:`, error);

            return NextResponse.json(
                { success: false, error: error instanceof Error ? error.message : 'Unknown error', route: routePath },
                { status: 500 }
            );
        }
    };
}

/**
 * Creates a handler for GET requests with automatic error handling
 */
export function createGetHandler<T = any>(handler: (body: T, request: Request) => Promise<NextResponse>) {
    return async (request: Request) => {
        const clonedRequest = request.clone();
        let requestText = '';
        const url = new URL(request.url);
        const routePath = url.pathname;

        try {
            requestText = await request.text();
            const parsedBody = parseRequestBody<T>(requestText);
            const response = await handler(parsedBody, clonedRequest);

            return response;

        } catch (error) {
            sendServerErrorEmail(requestText, clonedRequest, `API Error in GET route [${routePath}]`, error);

            return NextResponse.json(
                { success: false, error: error instanceof Error ? error.message : 'Unknown error', route: routePath },
                { status: 500 }
            );
        }
    };
}

/**
 * Creates a NextResponse success response
 */
export function createSuccessResponse(data: any = { success: true }, status: number = 200) {
    return NextResponse.json(
        data,
        { status: status }
    );
}

/**
 * Creates a NextResponse error response
 */
export function createErrorResponse(error: string, status: number = 400) {
    return NextResponse.json(
        { success: false, error: error },
        { status: status }
    );
}

/**
 * Parses request body text, handling nested JSON in 'body' property
 */
function parseRequestBody<T>(requestText: string): T {
    if (!requestText)
        return {} as T;

    try {
        const jsonData = JSON.parse(requestText);

        // Check if the data is nested in a "body" property and is a string
        if (jsonData.body && typeof jsonData.body === 'string')
            try {
                return JSON.parse(jsonData.body) as T;

            } catch {
                return jsonData as T;
            }
        else
            return jsonData as T;

    } catch {
        return {} as T;
    }
}

// ------------------------------------------------------------------------------------------------
// Validation Utils
// ------------------------------------------------------------------------------------------------

/**
 * Validates that required fields are present and not undefined in the request body.
 * Handles nested fields specified with dot notation (e.g., 'adAccount.id').
 */
export async function validateRequestBody(body: Record<string, any>, requiredFields: string[]): Promise<void> {
    'use server';

    if (!body || typeof body !== 'object') {
        throw new Error('Invalid request body: must be a non-null object.');
    }

    for (const fieldPath of requiredFields) {
        const fieldParts = fieldPath.split('.');
        let currentLevel = body;
        let currentPath = '';

        for (let i = 0; i < fieldParts.length; i++) {
            const part = fieldParts[i];
            currentPath = currentPath ? `${currentPath}.${part}` : part;

            if (currentLevel === null || typeof currentLevel !== 'object' || currentLevel[part] === undefined) {
                throw new Error(`Missing required field in request body: ${fieldPath}. Got: ${JSON.stringify(body)}`);
            }

            currentLevel = currentLevel[part];
        }
    }
}

/**
 * Converts an IANA timezone string to a GMT offset string.
 * @param timeZone The IANA timezone string (e.g., 'Europe/Bratislava').
 * @returns The GMT offset string (e.g., 'GMT+2').
 */
export function convertTimeZoneToGmtOffset(timeZone: string): string {
    if (!timeZone)
        throw new Error('Timezone cannot be empty.');

    try {
        const date = new Date();
        const parts = new Intl.DateTimeFormat('en', {
            timeZone,
            timeZoneName: 'longOffset',
        }).formatToParts(date);

        const timeZoneNamePart = parts.find((part) => part.type === 'timeZoneName');

        if (!timeZoneNamePart)
            throw new Error(`Could not determine GMT offset for timezone: ${timeZone}`);
        
        let gmtString = timeZoneNamePart.value;

        if (gmtString === 'GMT') return gmtString;

        const match = gmtString.match(/GMT([+-])(\d{1,2}):(\d{2})/);

        if (match) {
            const sign = match[1];
            const hours = parseInt(match[2], 10);
            const minutes = parseInt(match[3], 10);

            if (minutes === 0)
                return `GMT${sign}${hours}`;
            else
                return `GMT${sign}${hours}:${minutes}`;
        }

        return gmtString;
    } catch (e) {
        if (e instanceof RangeError)
            throw new Error(`Invalid timezone provided: ${timeZone}`);
        
        throw e;
    }
}

// ------------------------------------------------------------------------------------------------
// PayPal
// ------------------------------------------------------------------------------------------------

/**
 * Makes a request to the PayPal API
 */
export async function paypalApiRequest(endpoint: string, method: string = 'GET', body: any = null) {
    const baseUrl = process.env.PAYPAL_ENV === 'development' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    let response = await fetchWithRetry(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_KEY}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok)
        throw new Error(`Failed to get PayPal access token: ${response.status} ${await response.text()}`);

    const data = await response.json();
    const accessToken = data.access_token;

    response = await fetchWithRetry(`${baseUrl}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: body ? JSON.stringify(body) : null
    });

    if (!response.ok)
        throw new Error(`PayPal API error: ${response.status} ${await response.text()}`);

    return response.json();
}

// ------------------------------------------------------------------------------------------------
// Anthropic Utilities
// ------------------------------------------------------------------------------------------------

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Streams translated text from Anthropic.
 */
export async function streamTranslateText(textToTranslate: string, targetLanguage: string = 'en', sourceLanguage?: string): Promise<AsyncIterable<Anthropic.Messages.MessageStreamEvent>> {
    if (!process.env.ANTHROPIC_API_KEY)
        throw new Error("AI Service API key is not configured.");

    if (!textToTranslate.trim()) {
        // Return an empty async iterable if there's nothing to translate
        async function* emptyGenerator() { }
        return emptyGenerator();
    }

    const sourceLangInstruction = sourceLanguage ? ` from ${sourceLanguage}` : '';
    const systemPrompt = `You are a translation assistant. Translate the following text accurately to ${targetLanguage}${sourceLangInstruction}. Only output the translated text, nothing else.`;
    const userMessage = textToTranslate;

    const stream = await anthropic.messages.create({
        model: "claude-3-7-sonnet-latest", // DO NOT UNDER ANY CIRCUMSTANCES CHANGE THIS MODEL
        max_tokens: 64000, // DO NOT CHANGE EVER
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
    });

    return stream;
}

/**
 * Processes an Anthropic Messages stream and returns a ReadableStream for the client.
 */
export function streamAnthropicResponse(
    anthropicStream: AsyncIterable<Anthropic.Messages.MessageStreamEvent>,
    errorContext: { body: any, request: Request },
    errorPrefix: string
): ReadableStream {
    return new ReadableStream({
        async start(controller) {
            let isClosed = false;
            try {
                for await (const event of anthropicStream) {
                    if (isClosed) break;

                    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                        if (!isClosed) {
                            controller.enqueue(new TextEncoder().encode(event.delta.text));
                        }
                    } else if (event.type === 'message_stop' || (event.type === 'message_delta' && event.delta.stop_reason)) {
                        if (!isClosed) {
                            controller.close();
                            isClosed = true;
                        }
                    }
                }
                // Final check to ensure closure if loop finishes unexpectedly
                if (!isClosed) {
                    controller.close();
                    isClosed = true;
                }
            } catch (streamError: any) {
                // Use provided context for error reporting
                sendServerErrorEmail(errorContext.body || {}, errorContext.request, errorPrefix, streamError);
                if (!isClosed) {
                    controller.error(streamError);
                    isClosed = true;
                }
            }
        },
        cancel() {
            // Optional: Implement cancellation logic if needed, e.g., aborting Anthropic request
            console.log("Anthropic stream cancelled by client.");
        }
    });
}

/**
 * Reads a ReadableStream completely and returns its content as a string.
 */
export async function readStreamToString(stream: ReadableStream): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done)
            break;

        result += decoder.decode(value, { stream: true });
    }

    result += decoder.decode();

    return result;
}