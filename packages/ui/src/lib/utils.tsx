import { EventType, MzdaTransaction, Offer, RegionPrice, Tracking } from '@repo/ui/lib/types';
import { Metadata } from 'next';

interface SiteMetadata {
    siteName: string;
    description: string;
    siteImage: string;
    locale: string;
}

export function generateMetadata({ siteName, description, siteImage, locale }: SiteMetadata): Metadata {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_BASE_URL is not defined in environment variables.');
    }
    const metadataBase = new URL(baseUrl);
    
    return {
        title: siteName,
        description: description,
        metadataBase,
        openGraph: {
            title: siteName,
            description: description,
            url: baseUrl,
            siteName: siteName,
            images: [
                {
                    url: siteImage,
                    width: 1200,
                    height: 630,
                    alt: siteName,
                }
            ],
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: siteName,
            description: description,
            images: [
                siteImage
            ],
        },
    };
}

/**
 * Helper function to get the base URL for API calls
 * Works in both development and production environments
 */
export function getBaseUrl(): string {
    if (!process.env.NEXT_PUBLIC_BASE_URL)
        throw new Error('NEXT_PUBLIC_BASE_URL environment variable is not set');

    return process.env.NEXT_PUBLIC_BASE_URL;
}

/**
 * Normalizes a URL by removing leading and trailing slashes and adding the domain
 */
export function getNormalizedUrl(url: string): string {
    if (!process.env.NEXT_PUBLIC_DOMAIN)
        throw new Error('NEXT_PUBLIC_DOMAIN environment variable is not set');

    let normalizedUrl = url.trim() === '/' ? '' : url.trim()

    if (normalizedUrl.startsWith('/'))
        normalizedUrl = normalizedUrl.slice(1)

    if (normalizedUrl.endsWith('/'))
        normalizedUrl = normalizedUrl.slice(0, -1)

    return process.env.NEXT_PUBLIC_DOMAIN + (normalizedUrl ? '/' + normalizedUrl : '')
}


/**
 * Converts an event type to a Facebook event type
 */
export function convertToFacebookEvent(eventType: EventType): string | null {
    if (eventType === 'view')
        return 'PageView';

    else if (eventType === 'sign_up')
        return 'Lead';

    else if (eventType === 'buy_click')
        return 'InitiateCheckout';

    else if (eventType === 'buy')
        return 'Purchase';

    else if (eventType === 'buy_decline' || eventType === 'webinar_name' || eventType === 'webinar_email')
        return null; // Facebook doesn't have a standard event for this

    else
        throw new Error(`Doesnt know how to convert event ${eventType} to Facebook`);
}

/**
 * Delays the execution of the current function for a given number of milliseconds
 */
export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------------------------------------
// Currency and regional utils
// ------------------------------------------------------------------------------------------------

/**
 * Gets the flag URL for a given country code
 */
export const getFlagUrl = (countryCode: string) => {
    if (!countryCode)
        throw new Error('Country code is required for getting flag URL');

    const code = countryCode.toLowerCase();

    if (code === 'default')
        return 'https://flagcdn.com/eu.svg';

    return `https://flagcdn.com/${code}.svg`;
};

/**
 * Format a number as a currency string, removing decimal places if they are zero.
 */
export function formatCurrency(value: number, currencyCode: string): string {
    const isInteger = Number.isInteger(value);

    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: isInteger ? 0 : 2, // Set to 0 if integer, 2 otherwise
        maximumFractionDigits: isInteger ? 0 : 2  // Set to 0 if integer, 2 otherwise
    };

    // Format currency using Croatian locale as a base
    return new Intl.NumberFormat('hr-HR', options).format(value);
}

/**
 * Format date in Europe/Bratislava timezone with HH:MM:SS DD.MM.YYYY format
 */
export function formatDate(date: Date | string | number): string {
    const dateObject = typeof date === 'string' ? new Date(date) :
        typeof date === 'number' ? new Date(date) : date;

    if (!(dateObject instanceof Date) || isNaN(dateObject.getTime()))
        throw new Error(`Invalid date value provided to formatDate: ${date}`);

    return new Intl.DateTimeFormat('sk-SK', {
        timeZone: 'Europe/Bratislava',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
    }).format(dateObject).replace(/(\d{2})\. (\d{2})\./, '$1.$2.').replace(/(\d{2}\.\d{2})\. /, '$1.');
}

/**
 * Format date in Europe/Bratislava timezone with DD.MM.YYYY format
 */
export function formatDateWithDayShort(localDateString: string): string {
    let date: Date;

    if (localDateString.includes('T')) {
        date = new Date(localDateString);
        if (isNaN(date.getTime()))
            throw new Error('Invalid ISO date string: ' + localDateString);
    } else {
        const datePart = localDateString.split(',')[0];
        const [month, day, year] = datePart.split('/');

        if (!month)
            throw new Error('Invalid month component: ' + datePart + " from " + localDateString);
        if (!day)
            throw new Error('Invalid day component: ' + datePart + " from " + localDateString);
        if (!year)
            throw new Error('Invalid year component: ' + datePart + " from " + localDateString);
        if (year.length !== 4)
            throw new Error('Year must be 4 digits: ' + datePart + " from " + localDateString);

        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const optionsDate: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    const optionsDay: Intl.DateTimeFormatOptions = {
        weekday: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('sk-SK', optionsDate);
    const dayFormatter = new Intl.DateTimeFormat('en-US', optionsDay);

    const formattedDatePart = dateFormatter.format(date).replace(/\s/g, '');
    const dayPart = dayFormatter.format(date);

    return `${formattedDatePart} (${dayPart})`;
};

// ------------------------------------------------------------------------------------------------
// Date conversion
// ------------------------------------------------------------------------------------------------

/**
 * Converts a local date string to a UTC date string
 */
export function convertLocalToUTC(localDateString: string, isEndDate: boolean = false): Date {
    if (localDateString.includes('Z') || localDateString.includes('+'))
        return new Date(localDateString);

    const hasTimePart = localDateString.includes('T');
    let dateTimeString = localDateString;

    if (!hasTimePart)
        dateTimeString = isEndDate ? `${localDateString}T23:59:59` : `${localDateString}T00:00:00`;

    const localDate = new Date(dateTimeString);

    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const seconds = localDate.getSeconds();

    const isDST = isEuropeanDST(year, month, day);
    const offset = isDST ? 2 : 1;

    let utcHours = hours - offset;
    let utcDay = day;
    let utcMonth = month;
    let utcYear = year;

    if (utcHours < 0) {
        utcHours += 24;
        utcDay -= 1;

        if (utcDay < 1) {
            utcMonth -= 1;

            if (utcMonth < 0) {
                utcMonth = 11;
                utcYear -= 1;
            }

            const lastDayOfPrevMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
            utcDay = lastDayOfPrevMonth;
        }
    }

    return new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHours, minutes, seconds));
}

/**
 * Checks if a given date is in the European Daylight Saving Time (DST) period
 */
function isEuropeanDST(year: number, month: number, day: number): boolean {
    const lastSundayMarch = getLastSundayOfMonth(year, 2);
    const lastSundayOctober = getLastSundayOfMonth(year, 9);

    const date = new Date(year, month, day);
    const dstStart = new Date(year, 2, lastSundayMarch, 1);
    const dstEnd = new Date(year, 9, lastSundayOctober, 1);

    return date >= dstStart && date < dstEnd;
}

/**
 * Gets the last Sunday of a given month
 */
function getLastSundayOfMonth(year: number, month: number): number {
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = lastDay; day > 0; day--)
        if (new Date(year, month, day).getDay() === 0)
            return day;

    return 1;
}

/**
 * Converts a UTC date string to a local date string
 */
export function convertUtcToLocal(utcDateString: string): string {
    return new Date(utcDateString).toLocaleString("en-US", {
        timeZone: "Europe/Budapest",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

/**
 * Calculates the journey time of a user
 */
export function calculateJourneyTime(journeyData: Tracking[]) {
    if (!journeyData || journeyData.length < 2)
        return null;

    const firstEvent = journeyData[0];
    const lastEvent = journeyData[journeyData.length - 1];

    const diffMs = new Date(lastEvent.date).getTime() - new Date(firstEvent.date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeStr = '';

    if (diffDays > 0)
        timeStr = `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
    else if (diffHours > 0)
        timeStr = `${diffHours}h ${diffMins % 60}m`;
    else
        timeStr = `${diffMins}m`;

    return timeStr;
}

/**
 * Normalizes an account ID by removing the 'act_' prefix
 */
export function normalizeAccountId(id: string | undefined): string {
    if (!id)
        return '';

    return id.toString().replace(/^act_/, '');
};

// ------------------------------------------------------------------------------------------------
// Error handling
// ------------------------------------------------------------------------------------------------

/**
 * Ensures that a value is an Error object
 */
export function ensureError(value: unknown, fallbackMessage: string): Error {
    if (value instanceof Error)
        return value;

    let message = fallbackMessage;

    if (typeof value === 'string' && value.length > 0)
        message = value;

    else if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string')
        message = value.message;

    else
        message = JSON.stringify(value);

    return new Error(message);
}

// ------------------------------------------------------------------------------------------------
// API Fetching Utils
// ------------------------------------------------------------------------------------------------

/**
 * Fetches all data matching a Supabase query, handling pagination.
 */
export async function fetchMultiPageData<T>(queryBuilder: any, pageSize = 1000): Promise<T[]> {
    let allData: T[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const { data: pageData, error } = await queryBuilder
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error)
            throw error;

        if (!pageData || pageData.length === 0)
            break;

        allData = [...allData, ...pageData];
        hasMore = pageData.length === pageSize;

        page++;
    }

    return allData;
}

/**
 * Fetches JSON data from a URL and handles errors.
 * Throws an error for non-OK responses or JSON parsing errors.
 */
export async function fetchJsonPost(url: string, body: any = {}, timeout = 30000, maxRetries = 1): Promise<any> {
    return fetchJson('POST', url, body, timeout, maxRetries);
}

/**
 * Fetches JSON data from a URL and handles errors.
 * Throws an error for non-OK responses or JSON parsing errors.
 */
export async function fetchJsonGet(url: string, timeout = 30000, maxRetries = 1): Promise<any> {
    return fetchJson('GET', url, null, timeout, maxRetries);
}

/**
 * Fetches JSON data from a URL and handles errors.
 * Throws an error for non-OK responses or JSON parsing errors.
 */
async function fetchJson(method: string, url: string, body: any, timeout = 30000, maxRetries = 1): Promise<any> {
    if (method !== 'GET' && method !== 'POST')
        throw new Error(`Invalid HTTP method: ${method}. Only GET and POST are supported.`);

    const response = await fetchWithRetry(url, {
        method: method,
        headers: method === 'POST' ? {
            'Content-Type': 'application/json',
        } : undefined,
        body: body ? JSON.stringify(body) : undefined,

    }, `[${method} ${url}] `, timeout, maxRetries);

    if (!response.ok)
        throw new Error(`Error fetching ${url}: ${response.statusText}`);

    return await response.json();
}

/**
 * Fetches data from a URL with timeout and retry capabilities
 */
export async function fetchWithRetry(url: string, options: RequestInit, logPrefix = '', timeout = 30000, maxRetries = 1): Promise<Response> {
    let lastError: any;

    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                ...options,
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                const errorMessage = `Error fetching ${url}! Got (${response.status}): ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`;

                if (response.status === 500 || response.status === 400) {
                    const err = new Error(errorMessage);
                    (err as any).isNonRetryable = true;

                    throw err;
                }

                lastError = new Error(errorMessage);
                continue;
            }

            return response;

        } catch (error: any) {
            if (error.isNonRetryable) 
                throw error;

            lastError = error;
            console.log(`${logPrefix}Fetch attempt ${retryCount + 1}/${maxRetries + 1} failed.`);

            if (retryCount === maxRetries)
                throw error;

            await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)));
        }
    }

    throw lastError;
}

// ------------------------------------------------------------------------------------------------
// Offer related
// ------------------------------------------------------------------------------------------------

export function hasOffer(transactions: Tracking[], email: string, offerName: string): boolean {
    if (!email || !transactions.length)
        return false;

    return transactions.some(transaction =>
        transaction.metadata.payment_status === 'succeeded' &&
        transaction.email === email &&
        (transaction.metadata.primary_offer_slug === offerName || transaction.metadata.secondary_offer_slug === offerName));
}

export function formatFullPrice(offer: Offer, region: string): string {
    const pricing = getPricing(offer, region);

    return formatCurrency(pricing.price, pricing.currency);
}

export function getPricing(offer: Offer, region: string): RegionPrice {
    return offer.region_prices[region] || {
        price: offer.price * 1.67,
        discounted_price: offer.price,
        currency: offer.currency,
        price_eur: offer.price_eur * 1.67,
        discounted_price_eur: offer.price_eur
    } as RegionPrice;
}

export function getDiscountPercent(offer: Offer, region: string): number {
    const price = offer.region_prices[region]?.price || offer.price;
    const discountedPrice = offer.region_prices[region]?.discounted_price || offer.price;
    const discount = Math.round((price - discountedPrice) / price * 100);

    return discount === 0 ? 67 : discount;
}

export function getFullPriceFloat(offer: Offer, region: string): number {
    const currentPrice = offer.region_prices[region]?.price || offer.price;
    const mainPrice = getPricing(offer, region);

    return currentPrice === mainPrice.price ? Math.round(currentPrice * 1.67) : currentPrice;
}

// ------------------------------------------------------------------------------------------------
// Mzda related
// ------------------------------------------------------------------------------------------------

/**
 * Retrieves payroll transactions from the Mzda API between a fixed start date
 * (2025-02-01) and today's date.
 */
export async function getMzdaTransactions(): Promise<MzdaTransaction[]> {
    const formData = new URLSearchParams();

    if (!process.env.MZDA_PASSWORD)
        throw new Error('MZDA_PASSWORD environment variable is not set');

    formData.append('password', process.env.MZDA_PASSWORD);
    formData.append('from_date', '2025-02-01');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    formData.append('to_date', `${yyyy}-${mm}-${dd}`);

    const response = await fetch('https://mzda.mineacademy.org/api/kristina/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (!response.ok)
        throw new Error(`Error fetching payroll from mzda: ${response.status}`);

    const data = await response.json();

    if (!data)
        throw new Error('No data returned from mzda');

    if (!data.success)
        throw new Error('Failed to fetch payroll from mzda: ' + data.message);

    return (data.data as MzdaTransaction[]).map(transaction => ({
        ...transaction,
        fee: transaction.fee ?? 0
    }));
}

// ------------------------------------------------------------------------------------------------
// Flux related
// ------------------------------------------------------------------------------------------------

/**
 * Generates an image using the Flux API
 */
export async function generateFluxImage(prompt: string, aspect_ratio: string, enhance_by_sam_ovens: boolean, model: string) {
    const fluxApiKey = process.env.FLUX_API_KEY;

    if (!fluxApiKey)
        throw new Error('FLUX_API_KEY is not set in environment variables');

    const samOvensPrompt = "When generating images, include humans in the frame (preferably one male and one female) with visible faces showing natural smiles while standing, not sitting. Ensure their eyes are open and gazing directly at the viewer. Set the scene outdoors with natural elements like sky, trees, grass or water visible in the background. Use bright daylight lighting with clear blue skies and vibrant yet natural colors throughout the composition. Consider adding an animal or pet if it fits the context. Make the image appear authentic and candid rather than posed, using a wide shot that provides environmental context while keeping humans as the focal point. Avoid text overlays completely and steer clear of dark, negative or threatening elements. Create the feeling of a casual moment captured naturally with high contrast and bright lighting to enhance visual appeal and engagement.";
    
    const fluxResponse = await fetch('https://api.us.bfl.ai/v1/' + model, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'x-key': fluxApiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt + (enhance_by_sam_ovens ? (prompt.endsWith('.') ? ' ' + samOvensPrompt : '. ' + samOvensPrompt) : ''),
            aspect_ratio: aspect_ratio,
            prompt_upsampling: false,
            image_prompt_strength: 0,
            raw: true,
            steps: 30,
            safety_tolerance: 6,
            output_format: 'jpeg',
            seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        })
    });

    if (!fluxResponse.ok) {
        const errorText = await fluxResponse.text();
        throw new Error(`Failed to generate image: ${fluxResponse.status} - ${errorText}`);
    }

    const data = await fluxResponse.json();

    console.log("fluxResponse data: ", data);

    if (!data.id)
        throw new Error('No task ID returned from Flux API');

    return data;
}

export function stripAccentTags(html: string): string {
    // Remove <accent> and </accent> tags
    return html.replace(/<\/?accent>/gi, '');
}

export function replaceAccentTags(html: string, isHeadline: boolean = true): string {
    // Replace <accent> tags with styled spans or strong tags
    if (isHeadline) {
        // For headlines and subheadlines: use purple text
        return html.replace(/<accent>/gi, '<span class="accent-headline">').replace(/<\/accent>/gi, '</span>');
    } else {
        // For bullet points: use strong with darker purple
        return html.replace(/<accent>/gi, '<strong class="accent-text">').replace(/<\/accent>/gi, '</strong>');
    }
}
