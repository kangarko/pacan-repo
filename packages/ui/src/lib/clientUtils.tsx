import { createBrowserClient } from "@supabase/ssr";
import { EmailTemplate, EventType, Offer, UserContextData } from "@repo/ui/lib/types";
import Cookies from 'js-cookie';
import { convertToFacebookEvent, ensureError, fetchJsonPost, formatCurrency, getPricing } from "@repo/ui/lib/utils";

declare global {
    interface Window {
        fbq: (action: string, eventName: string, params?: Record<string, any>, options?: { eventID?: string }) => void;
    }
}

/**
 * Creates a supabase client
 */
export function createSupabaseClient() {
    'use client';

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Formats the discounted price for the current user based on the region cookie
 * @param offer The offer to format the price for
 * @param region The region to use if the region cookie is not set
 * @param source The source of the request
 * @returns The formatted price
 */
export function formatDiscountedPriceForCurrentUser(offer: Offer, region: string, source: string): string {
    if (!region)
        throw new Error('No region found in cookies from ' + source);

    const pricing = getPricing(offer, region);

    return formatCurrency(pricing.discounted_price, pricing.currency);
}

/**
 * Detects the region of the user based on their IP address
 */
export async function retrieveData(fetchTransactions: boolean = false): Promise<UserContextData> {
    'use client';

    try {
        const data = await fetchJsonPost('/api/auth/retrieve-data', {
            fetchTransactions: fetchTransactions
        }, 30000, 2);

        if (!data.region)
            throw new Error('No region detected from /api/auth/retrieve-data endpoint. Got: ' + JSON.stringify(data));

        if (data.region.length !== 2)
            throw new Error('Region is not a two letter code: ' + JSON.stringify(data.region));

        Cookies.set('region', data.region, { path: '/', expires: 365, sameSite: 'lax' });

        if (data.email && !Cookies.get('lead_email')) {
            let trimmedEmail = data.email.charAt(0).toLowerCase() + data.email.slice(1);
            trimmedEmail = trimmedEmail.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

            Cookies.set('lead_email', trimmedEmail, { path: '/', expires: 365, sameSite: 'lax' });
        }

        if (data.name && !Cookies.get('lead_name'))
            Cookies.set('lead_name', data.name, { path: '/', expires: 365, sameSite: 'lax' });

        if (typeof data.region !== 'string')
            throw new Error('Region is not a string: ' + JSON.stringify(data.region));

        return {
            offers: data.offers,
            isAuthenticated: data.isAuthenticated,
            isAdmin: data.isAdmin,
            transactions: fetchTransactions ? data.transactions : [],
            region: data.region,
        };

    } catch (error) {
        sendClientErrorEmail('[Tracking/client] Error retrieving data, falling back to hardcoded data:', error);

        return {
            isAuthenticated: false,
            isAdmin: false,
            transactions: [],
            offers: [],
            region: 'HR',
        };
    }
}

/**
 * Main tracking function that handles all event types from both client and server contexts
 */
export async function track(eventType: EventType, eventData: Record<string, any>) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sourceType = urlParams.get('st') || null;
        const source = urlParams.get('sc') || null;
        let campaign_id = urlParams.get('camp') || null;
        let adset_id = urlParams.get('adset') || null;
        let ad_id = urlParams.get('ad') || null;
        const fbclid = urlParams.get('fbclid') || null;
        const sokol_id = urlParams.get('sokol') || null;
        const userAgent = navigator.userAgent || '';
        const referrer = document.referrer || '';
        const currentUrl = window.location.href;

        // This is a bug where sometimes facebook does not resolve campaign names...
        if (campaign_id == '{{campaign.id}}') 
            campaign_id = null;

        if (adset_id == '{{adset.id}}')
            adset_id = null;

        if (ad_id == '{{ad.id}}')
            ad_id = null;

        if (userAgent.includes('HeadlessChrome'))
            return;

        const fbEvent = convertToFacebookEvent(eventType);
        const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

        if (fbEvent) {
            const pixelEventData: Record<string, any> = {
                eventID: eventId,
            };

            if (eventType === 'buy' || eventType === 'buy_click') {
                pixelEventData.value = eventData.value;
                pixelEventData.currency = eventData.currency;
                pixelEventData.content_type = 'product';

                const contentIds = [];

                if (eventData.primary_offer_slug)
                    contentIds.push(eventData.primary_offer_slug);

                if (eventData.secondary_offer_slug)
                    contentIds.push(eventData.secondary_offer_slug);

                pixelEventData.content_ids = contentIds;
            }

            window.fbq('track', fbEvent, pixelEventData);
        }

        const body = {
            event_type: eventType,
            event_data: {
                url: currentUrl,
                event_id: eventId,
                user_agent: userAgent,
                referer: referrer,
                source_type: sourceType,
                source: source,
                campaign_id: campaign_id,
                adset_id: adset_id,
                ad_id: ad_id,
                fbclid: fbclid,
                sokol_id: sokol_id,

                // Spread the rest of event_data, potentially overriding extracted params if passed explicitly
                ...eventData
            }
        };

        try {
            await fetchJsonPost('/api/sokol/send', body);

        } catch (error) {
            sendClientErrorEmail(`[Tracking] Error in track(${eventType}) while fetching! Body: ${JSON.stringify(body)}`, error);
        }

    } catch (error) {
        sendClientErrorEmail(`[Tracking] General error in track() function for ${eventType}:`, error);
    }
}

/**
 * Sends an error notification email to the admin
 * @param message The message to send
 * @param error The error object
 */
export async function sendClientErrorEmail(message: string, errorUnknown: unknown | undefined = undefined) {
    'use client';

    const error = errorUnknown ? ensureError(errorUnknown, message) : new Error(message);
    let combinedMessage = message;

    if (message !== error.message && error.message && error.message.length > 0) 
        combinedMessage = `${message}: ${error.message}`;
    
    console.log(message);
    
    if (error) 
        console.error(error);
    
    try {
        // Create hash of the error for deduplication
        const errorContent = combinedMessage + (error.stack ? error.stack.split('\n')[0] : '');
        const errorHash = await hashString(errorContent);
        
        const emailData: Record<string, any> = {
            message: combinedMessage,
            stack: error && error.stack ? error.stack : 'No stack trace',
            url: window ? window.location.href : '',
            name: Cookies.get('lead_name') || '',
            email: Cookies.get('lead_email') || '',
            region: Cookies.get('region') || '',
            user_id: Cookies.get('user_id') || '',
            user_agent: navigator.userAgent || '',
            get_params: window ? new URLSearchParams(window.location.search).toString() : '',
            error_hash: errorHash.substring(0, 16),
        };

        if (errorUnknown) {
            emailData.error_type = typeof errorUnknown;
            
            if (typeof errorUnknown === 'object' && errorUnknown !== null) {
                try {
                    emailData.error_keys = Object.keys(errorUnknown);
                } catch (e) {
                    emailData.error_keys = ["Failed to get keys"];
                }
                
                try {
                    emailData.error_string = String(errorUnknown);
                } catch (e) {
                    emailData.error_string = "Failed to stringify error";
                }
            }
        }

        await sendClientEmail(EmailTemplate.ADMIN_ERROR, emailData);

    } catch (sendError) {
        console.error('Error sending error notification:', sendError);
    }
}

/**
 * Simple hash function for client-side use
 */
async function hashString(str: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Sends an email on the client side
 */
export async function sendClientEmail(template: EmailTemplate, data: any, recipient: string | undefined = undefined, replyTo: string | undefined = undefined): Promise<void> {
    'use client';

    await fetchJsonPost('/api/email/send', {
        template: template,
        data: data,
        recipient: recipient,
        reply_to: replyTo,
    }, 30000, 4);
}

export const scrollToOrderForm = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) e.preventDefault();
    
    const orderForm = document.getElementById('order-form');
    if (!orderForm) return;
    
    // Scroll to the order form
    orderForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add highlight classes
    const parentContainer = orderForm.parentElement;
    if (parentContainer) {
        // Add a pulsing border effect
        parentContainer.classList.add('order-form-highlight');
        
        // Remove the highlight after animation completes
        setTimeout(() => {
            parentContainer.classList.remove('order-form-highlight');
        }, 3000);
    }
};