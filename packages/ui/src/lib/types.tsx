import { UUID } from "crypto";

// ---------------------------------------------------------------------
// Table cache ---------------------------------------------------------
// ---------------------------------------------------------------------
export interface Cache {
    year: number;
    month: number;
    day: number;
    currencies: {
        base_currency: string;
        rates: Record<string, number>;
    };
    facebook: {
        account_currency: string;
        campaigns: FacebookInsight[];
        adsets: FacebookInsight[];
        ads: FacebookInsight[];
    };
}

export interface FacebookInsight {
    campaign_id: string;
    adset_id?: string;
    ad_id?: string;
    impressions: number;
    unique_outbound_clicks: number;
    reach: number;
    spend: number;
}

export interface FacebookInsightWithSalesData extends FacebookInsight {
    salesAmount: number;
    cash: number;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table paypal_purchases ----------------------------------------------
// ---------------------------------------------------------------------
export interface PayPalPurchase {
    id: number;
    created_on: string;
    user_id: number;
    name: string;
    email: string;
    region: string;
    amount: number;
    currency: string;
    primary_offer_slug: string;
    secondary_offer_slug: string;
    payment_id: string;
    order_id: string;
    payer_id: string;
    paypal_name: string;
    paypal_email: string;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table tracking ------------------------------------------------------
// ---------------------------------------------------------------------
export interface Tracking {
    id: number;
    date: string;
    type: EventType;
    user_id: number;
    user_agent: string | null;
    ip: string;
    email: string | null;
    url?: string;
    source_type?: string | null;
    source?: string | null;
    campaign_id?: string | null;
    adset_id?: string | null;
    ad_id?: string | null;
    referer?: string | null;
    metadata: {
        payment_method?: PaymentMethod;
        payment_id?: string;
        payment_status?: PaymentStatus;
        name?: string;
        email?: string;
        region?: string;
        value?: number;
        currency?: string;
        primary_offer_slug?: string;
        primary_offer_price?: number;
        secondary_offer_slug?: string;
        secondary_offer_price?: number;
        paypal_name?: string;
        paypal_email?: string;
        paypal_order_id?: string;
        headline_id?: string;
    };
}

export type EventType = 'view' | 'sign_up' | 'buy_click' | 'buy' | 'buy_decline' | 'webinar_name' | 'webinar_email';
export type PaymentMethod = 'stripe' | 'paypal' | 'quick_pay' | 'bank';
export type PaymentStatus = 'succeeded' | 'refunded';

export interface LabeledTracking extends Tracking {
    action: string;
    campaign_name?: string;
    adset_name?: string;
    ad_name?: string;
}

export interface ConvertedTracking extends Tracking {
    local_value: number;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table userdata ------------------------------------------------------
// ---------------------------------------------------------------------
export interface Userdata {
    user_id: number;
    experiment_data: Record<string, string>;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table webinar_sessions ----------------------------------------------
// ---------------------------------------------------------------------
export interface WebinarSession {
    id: UUID;
    webinar_id: UUID;
    user_id: number;
    user_name: string;
    user_email: string;
    start_date: string;
    watchtime_seconds: number;
}

export interface WebinarActiveSession {
    id: UUID;
    status: 'active' | 'upcoming';
    start_date: Date;
    end_date: Date;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table webinar_messages ----------------------------------------------
// ---------------------------------------------------------------------
export interface WebinarMessage {
    id: string;
    webinar_id: string;
    user_id: number;
    user_name: string;
    message: string;
    time_seconds: number;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Table webinars ------------------------------------------------------
// ---------------------------------------------------------------------
export interface Webinar {
    id: string;
    title: string;
    video_url: string;
    duration_seconds: number;
    offer: WebinarOffer;
    schedules: WebinarSchedule[];
    url: string;
    background_image_url: string;
    thank_you_video_url?: string;
    metadata: any;
    created_at: string;
}

export interface WebinarOffer {
    time: number;
    button_text: string;
    button_url: string;
    offer_headline?: string;
    offer_description?: string;
    offer_image_url?: string;
    /** slug of an entry in the "offers" table – used to link this webinar-offer with a real product */
    offer_slug?: string;
}

export enum WebinarScheduleType {
    RECURRING = 'recurring',
    JUST_IN_TIME = 'jit',
    DAILY = 'daily'
}

export interface WebinarSchedule {
    id: string; // Unique ID for this schedule setting rule
    type: WebinarScheduleType;
    label: string; // User-facing label for this type of schedule option, e.g., "Watch Now", "Evening Slot"

    // For RECURRING type:
    // Defines a pattern for recurring webinar sessions.
    recurrence?: {
        frequency: 'WEEKLY';
        days: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[]; // Days of the week
        time: string; // HH:MM (local time for the event, e.g., "19:00"), the slots will be generated accoring to client's local time
    };

    // For JUST_IN_TIME type:
    // Defines settings for generating "just-in-time" webinar slots.
    jit?: {
        // Intervals in minutes from the current hour for JIT slots (e.g., [0, 15, 30, 45]).
        // The API will use these to determine the next available slots.
        intervals?: number[];
        block_out?: {
            holidays?: string[]; // Dates to exclude, e.g., ["2024-12-25", "2025-01-01"] (YYYY-MM-DD)
            days_of_week?: number[]; 
            time_ranges?: { start: string; end: string; }[]; // HH:MM - HH:MM
        };
        slot_amount_to_offer?: number; // How many JIT slots to typically offer. Default: 3.
    };

    // For DAILY type:
    // Defines settings for generating daily slots at specific times
    daily?: {
        time: string; // HH:MM format for the daily time
        days_ahead: number[]; // Array of days ahead (0=today, 1=tomorrow, etc.)
        require_before_time?: boolean; // For "today" slots, only show if current time is before the slot time
    };
}

export interface FoundWebinar {
    webinar_id: string;
    title: string;
    schedules: WebinarSchedule[];
    offer_slug: string;
    active_session: WebinarActiveSession | null;
}

// ---------------------------------------------------------------------
// Table webinar_feedback ----------------------------------------------
// ---------------------------------------------------------------------
export interface WebinarFeedback {
    id: number;
    webinar_id: string;
    user_id: number;
    rating: number; // 1-5
    comment?: string;
    created_at: string;
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// mzda.mineacademy.org
// ---------------------------------------------------------------------

export interface MzdaTransaction {
    id: number;
    transaction_id: string;
    timestamp: number;
    processor: string;
    marketplace: string;
    account: string;
    item: string;
    unit_price: number;
    quantity: number;
    currency: string;
    exchange_rate: number;
    tax_rate: number;
    tax_amount: number;
    fee: number;
    street: string;
    city: string;
    zip: string;
    country_prefix: string;
    company_name: string;
    first_name: string;
    last_name: string;
    email: string;
    userName: string;
    userId: string;
    pendingInvoice: boolean;
    refunded: boolean;
}

// ---------------------------------------------------------------------
// Used in /admin page in sales data
// ---------------------------------------------------------------------

export interface AdminSalesData {
    visitors: Tracking[];
    sign_ups_unique: Tracking[];
    sign_ups_all: SignupInfo[];
    purchases: ConvertedTracking[];
    order_bump_conversion_rate: number;
    total_cash: number;
    total_adspend: number;
    total_profit_loss: number;
    total_roas: number;
    daily_data: AdminSalesDailyData[];
    facebook_sales_data: FacebookSalesData;
    attributed_purchases: AttributedPurchase[];
    id_to_name_mappings: Record<string, string>;
}

export interface AdminSalesDailyData {
    date: string;
    spend: number;
    impressions: number;
    reach: number;
    frequency: number;
    cpc: number;
    cpm: number;
    unique_outbound_clicks: number;
    ctr: number;
    visitors: number;
    leads: number;
    visitToLead: number;
    purchases: number;
    cash: number;
    refundsCount: number;
    refundsAmount: number;
    leadToPurchase: number;
    visitToPurchase: number;
    profitLoss: number;
    roas: number;
}

export interface AttributedPurchase {
    steps: TrackedStep[];
    cash: number;
    purchaseId: number;
    email: string;
    currency: string;
    item: string;
}

export interface TrackedStep {
    date: string;
    formatted: string;
    campaignId?: string;
    campaignName?: string;
    adsetId?: string;
    adsetName?: string;
    adId?: string;
    adName?: string;
    referer?: string;
    source?: string;
    sourceType?: string;
}

export interface SignupInfo extends Tracking {
    nonUniqueReason?: 'duplicate' | 'registered_previously';
    previousRegistrationDate?: string;
}

export interface FacebookSalesData {
    individual: {
        campaigns: CampaignInfo[];
    }
}

export interface CampaignInfo {
    campaign_id: string;
    campaign_name: string;
    impressions: number;
    unique_outbound_clicks: number;
    reach: number;
    spend: number;
    sales: number;
    cash: number;
    adsets: AdSetInfo[]
}

export interface AdSetInfo {
    adset_id: string;
    adset_name: string;
    impressions: number;
    unique_outbound_clicks: number;
    reach: number;
    spend: number;
    sales: number;
    cash: number;
    ads: AdInfo[]
}

export interface AdInfo {
    ad_id: string;
    ad_name: string;
    impressions: number;
    unique_outbound_clicks: number;
    reach: number;
    spend: number;
    sales: number;
    cash: number;
}

// ---------------------------------------------------------------------
// Offer
// ---------------------------------------------------------------------

export enum OfferType {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
}

export interface Offer {
    slug: string;
    name: string;
    short_description?: string;
    description: string;
    type: OfferType;
    file_path: string;
    thumbnail_url?: string;
    price: number;
    currency: string;
    price_eur: number;
    region_prices: Record<string, RegionPrice>;
    metadata: {
        order_form_heading?: string;
        order_form_subtitle?: string;
        icon_name?: string;
    };
}

export interface OfferWithOwnership extends Offer {
    is_owned: boolean;
}

export interface RegionPrice {
    price: number;
    discounted_price: number;
    currency: string;
    discounted_price_eur: number;
}

// ---------------------------------------------------------------------
// User context
// ---------------------------------------------------------------------

export interface UserContextData {
    offers: OfferWithOwnership[];
    isAuthenticated: boolean;
    isAdmin: boolean;
    transactions: Tracking[];
    region: string;
}

export interface SokolData {
    user_id: number;
    headline: Headline | null;
}

// ---------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------

export enum EmailTemplate {
    ORDER_SUCCESS = 'ORDER_SUCCESS',
    ADMIN_ORDER_SUCCESS = 'ADMIN_ORDER_SUCCESS',
    ADMIN_FORM_SUBMITTED = 'ADMIN_FORM_SUBMITTED',
    ADMIN_ERROR = 'ADMIN_ERROR',
    ACCOUNT_CREATED_MANUALLY = 'ACCOUNT_CREATED_MANUALLY',
    ADMIN_FEEDBACK = 'ADMIN_FEEDBACK',
    ADMIN_CONTACT_FORM = 'ADMIN_CONTACT_FORM',
}

export interface EmailThreadSummary {
    threadId: string;
    sender: { name?: string; address: string };
    subject: string;
    latestMessageDate: string;
    unreadCount: number;
}

export interface EmailMessage {
    id: string; // Unique message ID (e.g., message-id header or UID)
    uid: number; // IMAP UID
    sender: {
        name?: string;
        address: string
    };
    recipients: {
        name?: string;
        address: string
    }[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    date: string; // Date comes as string from JSON
    inReplyTo?: string; // Message-ID of the email being replied to
    references?: string; // References header chain for threading
    isRead: boolean; // Indicates if the message has been read
    translated_text?: string; // Added field for translation
}

export interface ConversationMessage {
    sender: {
        address: string
    };
    bodyText?: string;
    bodyHtml?: string;
    date: Date | string; // Accept Date objects or date strings
}

// ---------------------------------------------------------------------
// Facebook Support Types
// ---------------------------------------------------------------------

export interface FacebookThreadSummary {
    threadId: string; // Facebook Conversation ID
    participants: {
        name?: string;
        id: string
    }[]; // Participants (excluding the page itself)
    latestMessageTimestamp: number; // Unix timestamp (milliseconds)
    snippet: string;
    unreadCount: number;
    canReply: boolean; // If the page can reply to the conversation
    platform: 'messenger' | 'instagram_direct' | string; // Allow for other platforms
    lastSenderId?: string; // ID of the sender of the last message
}

export interface FacebookMessage {
    id: string; // Facebook Message ID
    created_time: string; // ISO 8601 date string
    from: {
        name?: string;
        id: string
    }; // Sender (can be page or user)
    to?: {
        data: {
            name?: string;
            id: string
        }[]
    }; // Recipients (usually the page)
    message?: string; // The message text
    // Add other fields as needed, e.g., attachments
    translated_text?: string; // Added field for translation
}

export interface BulletPoint {
    icon: string; // Icon name from lucide-react
    text: string; // Bullet point text
}

export interface Headline {
    id: string; // UUID
    name: string; // Internal name for the variant
    slug: string; // URL-friendly slug for the variant
    headline: string; // Main headline text
    subheadline?: string; // Subheadline text
    bullet_points: BulletPoint[]; // Array of bullet points
    active: boolean; // Whether this headline is active
    created_at: string;
    updated_at: string;
}
