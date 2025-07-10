import { convertUtcToLocal, delay, fetchJsonGet, fetchMultiPageData, getMzdaTransactions, getNormalizedUrl } from '@repo/ui/lib/utils';
import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, createSupabaseServerClient, validateRequestBody, validateTrackingRow, verifyAdminOrMarketerUser } from '@repo/ui/lib/serverUtils';
import { AdminSalesData, Tracking, MzdaTransaction, ConvertedTracking, AdminSalesDailyData, AttributedPurchase, TrackedStep, Cache, FacebookInsight, CampaignInfo, AdSetInfo, AdInfo, SignupInfo } from '@repo/ui/lib/types';
import Cursor from 'facebook-nodejs-business-sdk/src/cursor';
import { AdAccount, FacebookAdsApi, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';
import { SupabaseClient } from '@supabase/supabase-js';

export const POST = createPostHandler(async (body) => {
    await verifyAdminOrMarketerUser();

    const { start_date, end_date, base_currency, url } = body;
    validateRequestBody(body, ['start_date', 'end_date', 'base_currency', 'url']);

    if (!url || url.trim() === '')
        throw new Error('URL field is required. Use "/" to track visitors from the homepage.');

    const normalizedUrl = getNormalizedUrl(url);
    const adminClient = await createSupabaseAdminClient();

    // ---------------------------------------------------------------------
    // 0. Smart filtering - First get purchases in date range
    // ---------------------------------------------------------------------

    // Create dates that respect the local timezone without forcing UTC
    const startDateObject = new Date(start_date);
    startDateObject.setHours(0, 0, 0, 0);

    const endDateObject = new Date(end_date);
    endDateObject.setHours(23, 59, 59, 999);

    if (isNaN(startDateObject.getTime())) throw new Error('Invalid start date: ' + start_date);
    if (isNaN(endDateObject.getTime())) throw new Error('Invalid end date: ' + end_date);

    console.log(`Date range: ${start_date} to ${end_date} (local) => ${startDateObject.toUTCString()} to ${endDateObject.toUTCString()}`);

    // Fetch all buy events within the date range
    const { data: purchasesInRange, error: purchasesError } = await adminClient
        .from('tracking')
        .select('email, metadata')
        .eq('type', 'buy')
        .gte('date', startDateObject.toUTCString())
        .lte('date', endDateObject.toUTCString());

    if (purchasesError)
        throw new Error('Error fetching purchases in date range: ' + purchasesError.message);

    // Extract unique emails (including paypal_email from metadata)
    const uniqueEmails = new Set<string>();
    purchasesInRange.forEach(purchase => {
        if (purchase.email)
            uniqueEmails.add(purchase.email);
        if (purchase.metadata?.paypal_email)
            uniqueEmails.add(purchase.metadata.paypal_email);
    });

    console.log(`Found ${purchasesInRange.length} purchases from ${uniqueEmails.size} unique emails in date range`);

    // Get all user_ids associated with these emails for complete journey data
    const emailArray = Array.from(uniqueEmails);
    const userIdSet = new Set<number>();

    if (emailArray.length > 0) {
        // Batch the email queries to avoid too large queries
        const batchSize = 100;
        for (let i = 0; i < emailArray.length; i += batchSize) {
            const emailBatch = emailArray.slice(i, i + batchSize);

            // Query for regular email matches
            const { data: emailMatches, error: emailError } = await adminClient
                .from('tracking')
                .select('user_id')
                .in('email', emailBatch);

            if (emailError)
                throw new Error('Error fetching user_ids by email: ' + emailError.message);

            // Query for paypal_email matches in metadata
            const { data: paypalMatches, error: paypalError } = await adminClient
                .from('tracking')
                .select('user_id')
                .or(emailBatch.map(email => `metadata->>paypal_email.eq.${email}`).join(','));

            if (paypalError)
                throw new Error('Error fetching user_ids by paypal_email: ' + paypalError.message);

            [...(emailMatches || []), ...(paypalMatches || [])].forEach(row => {
                if (row.user_id)
                    userIdSet.add(row.user_id);
            });
        }
    }

    const purchaserUserIds = Array.from(userIdSet);

    // ---------------------------------------------------------------------
    // 1. Fetch all data needed
    // ---------------------------------------------------------------------
    const mzdaTransactions: MzdaTransaction[] = await getMzdaTransactions();

    console.log("Fetching visitors in " + normalizedUrl);

    // Fetch ALL visitors within date range (maintains accurate visitor count)
    const visitorsInRange = await fetchMultiPageData<Tracking>(
        adminClient
            .from('tracking')
            .select('*')
            .eq('type', 'view')
            .eq('url', normalizedUrl)
            .gte('date', startDateObject.toUTCString())
            .lte('date', endDateObject.toUTCString())
    );
    console.log(`Fetched ${visitorsInRange.length} visitors in date range`);

    // Fetch ALL signups within date range (maintains accurate signup count)
    const signupsInRange = await fetchMultiPageData<Tracking>(
        adminClient
            .from('tracking')
            .select('*')
            .eq('type', 'sign_up')
            .gte('date', startDateObject.toUTCString())
            .lte('date', endDateObject.toUTCString())
    );
    console.log(`Fetched ${signupsInRange.length} signups in date range`);

    // Fetch ALL signups ever (for uniqueness checking)
    const allSignupsEver = await fetchMultiPageData<Tracking>(
        adminClient
            .from('tracking')
            .select('*')
            .eq('type', 'sign_up')
    );
    console.log(`Fetched ${allSignupsEver.length} total signups ever`);

    // For attribution, fetch complete journey data only for purchasers
    let purchaserTrackingRows: Tracking[] = [];

    if (purchaserUserIds.length > 0) {
        // Fetch tracking data in batches to avoid query size limits
        const userBatchSize = 500;
        for (let i = 0; i < purchaserUserIds.length; i += userBatchSize) {
            const userBatch = purchaserUserIds.slice(i, i + userBatchSize);
            const batchData = await fetchMultiPageData<Tracking>(
                adminClient.from('tracking').select('*').in('user_id', userBatch)
            );
            purchaserTrackingRows = purchaserTrackingRows.concat(batchData);
        }
    }

    console.log(`Fetched ${purchaserTrackingRows.length} tracking rows for purchasers (for attribution)`);

    // Combine all tracking data: visitors + signups + purchaser journeys
    // Remove duplicates by tracking row ID
    const trackingRowMap = new Map<number, Tracking>();

    // Add all data, using Map to automatically handle duplicates
    [...visitorsInRange, ...signupsInRange, ...purchaserTrackingRows].forEach(row => {
        trackingRowMap.set(row.id, row);
    });

    const trackingRows = Array.from(trackingRowMap.values());

    // Performance comparison: Instead of 32k+ rows, we now fetch:
    // - Visitors in date range (~hundreds)
    // - Signups in date range (~dozens to hundreds)  
    // - Complete journey data only for purchasers (~thousands)
    // This maintains 100% data accuracy while reducing data volume significantly

    const nameCache = await fetchMultiPageData<{ object_id: string; name: string; object_type: string; parent_id: string | null }>(adminClient.from('fb_name_cache').select('*'));

    // ---------------------------------------------------------------------
    // 2. Initialize Calculator and Load Cache
    // ---------------------------------------------------------------------
    console.log("Initializing calculator and loading cache...");
    const calculator = new SalesDataCalculator(start_date, end_date, startDateObject, endDateObject, base_currency, trackingRows, mzdaTransactions, nameCache, allSignupsEver, normalizedUrl);
    await calculator.loadCache(adminClient);

    // ---------------------------------------------------------------------
    // 3. Calculate core metrics
    // ---------------------------------------------------------------------
    const visitors = calculator.getVisitors();
    const signups = calculator.getSignUps();
    const purchases = calculator.getPurchases();
    const attributedPurchases = await calculator.getAttributedPurchases(purchases.items);

    // ---------------------------------------------------------------------
    // 4. Calculate Facebook Sales Data
    // ---------------------------------------------------------------------
    console.log("Calculating Facebook sales data...");
    const facebookSalesData = await calculator.calculateFacebookSalesData(attributedPurchases);

    // ---------------------------------------------------------------------
    // 5. Calculate Daily Data and Totals
    // ---------------------------------------------------------------------
    console.log("Calculating daily data and totals...");
    const dailyData = calculator.getDailyData(visitors.items, signups.unique_items, purchases.items); // Depends on cache being loaded
    const totalAdspend = facebookSalesData.totals.spend; // Use the calculated total spend from FB data
    const totalProfitLoss = purchases.totalAmount - totalAdspend; // Recalculate P/L based on accurate spend
    const totalRoas = totalAdspend > 0 ? (purchases.totalAmount / totalAdspend) : 0;

    // ---------------------------------------------------------------------
    // 6. Validation
    // ---------------------------------------------------------------------
    if (isNaN(visitors.items.length)) throw new Error('Visitors items is NaN');
    if (isNaN(signups.unique_items.length)) throw new Error('Signups unique items is NaN');
    if (isNaN(signups.all_items.length)) throw new Error('Signups all items is NaN');
    if (isNaN(purchases.items.length)) throw new Error('Purchases items is NaN');
    if (isNaN(facebookSalesData.individual.size)) throw new Error('Facebook sales data (individual) is NaN');
    if (isNaN(dailyData.length)) throw new Error('Daily data is NaN');
    if (isNaN(attributedPurchases.length)) throw new Error('Attributed purchases is NaN');
    if (isNaN(totalAdspend)) throw new Error('Total adspend is NaN');
    if (isNaN(totalProfitLoss)) throw new Error('Total profit loss is NaN');
    if (isNaN(totalRoas)) throw new Error('Total roas is NaN');
    if (isNaN(purchases.secondaryConversionRate)) throw new Error('Secondary conversion rate is NaN');
    if (isNaN(purchases.totalAmount)) throw new Error('Total cash is NaN');

    // ---------------------------------------------------------------------
    // 7. Prepare Response
    // ---------------------------------------------------------------------

    const data: AdminSalesData = {
        visitors: visitors.items,
        sign_ups_unique: signups.unique_items,
        sign_ups_all: signups.all_items,
        purchases: purchases.items,
        order_bump_conversion_rate: purchases.secondaryConversionRate,
        total_cash: purchases.totalAmount,
        total_adspend: totalAdspend,
        total_profit_loss: totalProfitLoss,
        total_roas: totalRoas,
        daily_data: dailyData,
        attributed_purchases: attributedPurchases,
        facebook_sales_data: { // Adapt to the new structure expected by the frontend
            individual: { campaigns: Array.from(facebookSalesData.individual.values()) }
        },
        id_to_name_mappings: calculator.getIdToNameMappings()
    };
    
    return createSuccessResponse(data);
});

class SalesDataCalculator {
    private readonly startDateString: string;
    private readonly endDateString: string;
    private readonly startDateObject: Date;
    private readonly endDateObject: Date;
    private readonly baseCurrency: string;
    private readonly rows: Tracking[];
    private readonly mzdaTransactions: MzdaTransaction[];
    private readonly nameCache: { object_id: string; name: string; object_type: string; parent_id: string | null }[];
    private readonly allSignupsEver: Tracking[];
    private readonly trackingUrl: string;

    // Populated during processing
    private dailyCache: Map<string, Cache> = new Map();
    private idToNameMappings: Record<string, string> = {};

    constructor(
        startDateString: string,
        endDateString: string,
        startDateObject: Date,
        endDateObject: Date,
        baseCurrency: string,
        rows: Tracking[],
        mzdaTransactions: MzdaTransaction[],
        nameCache: { object_id: string; name: string; object_type: string; parent_id: string | null }[],
        allSignupsEver: Tracking[],
        trackingUrl: string
    ) {
        this.startDateString = startDateString;
        this.endDateString = endDateString;
        this.startDateObject = startDateObject;
        this.endDateObject = endDateObject;

        this.baseCurrency = baseCurrency;
        this.rows = this.preprocessTrackingRows(rows);
        this.mzdaTransactions = mzdaTransactions;
        this.nameCache = nameCache;
        this.allSignupsEver = allSignupsEver;
        this.trackingUrl = trackingUrl;

        // Build ID to Name mappings immediately
        this.nameCache.forEach(item => {
            this.idToNameMappings[item.object_id] = item.name;
        });
    }

    private preprocessTrackingRows(rows: Tracking[]): Tracking[] {
        // Keep dates in UTC for accurate comparison
        // Convert to local only for display purposes
        const processedRows = rows.map(row => {
            validateTrackingRow(row); // Validate the row
            return row;
        });
        processedRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return processedRows;
    }

    public async loadCache(adminClient: SupabaseClient): Promise<void> {
        // For cache loading, we need to iterate over local dates, not UTC dates
        const startDateLocal = new Date(this.startDateString + 'T00:00:00');
        const endDateLocal = new Date(this.endDateString + 'T23:59:59');

        console.log(`Fetching or building cache for range: ${this.startDateString} to ${this.endDateString}`);

        const { data: existingCache, error: fetchError } = await adminClient
            .from('cache')
            .select('*')
            .gte('year', startDateLocal.getFullYear())
            .lte('year', endDateLocal.getFullYear()); // Initial filter by year for efficiency

        if (fetchError) {
            throw new Error('Error fetching cache: ' + fetchError.message);
        }

        const existingCacheMap = new Map<string, Cache>();
        existingCache.forEach(row => {
            const dateKey = `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`;
            existingCacheMap.set(dateKey, row);
        });

        const facebookIntegration = await this.getLoggedInUserFacebookIntegration();
        const accountCurrency = await this.getAccountCurrency(facebookIntegration.account);

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        for (let currentDate = new Date(startDateLocal); currentDate <= endDateLocal; currentDate.setDate(currentDate.getDate() + 1)) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const day = currentDate.getDate();
            const currentDateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = currentDateKey === todayKey;

            let cachedRow = existingCacheMap.get(currentDateKey);

            if (cachedRow && !isToday) {
                // Basic validation of existing cache structure
                if (!cachedRow.currencies || !cachedRow.facebook || !cachedRow.facebook.campaigns) {
                    throw new Error(`Invalid cache structure for ${currentDateKey}`);

                } else {
                    this.dailyCache.set(currentDateKey, cachedRow);
                    continue;
                }
            }

            // --- Cache miss, invalid cache, or is today, fetch and build ---
            console.log(isToday ? `Fetching fresh data for today (${currentDateKey})...` : `Cache miss or invalid for ${currentDateKey}. Fetching fresh data...`);
            cachedRow = {
                year: year,
                month: month,
                day: day,
                currencies: { base_currency: '', rates: {} },
                facebook: { account_currency: accountCurrency, campaigns: [], adsets: [], ads: [] }
            };

            // Currency rates
            try {
                if (!process.env.EXCHANGE_RATE_API_KEY)
                    throw new Error('Exchange rate API key is not set');

                const currencyData = await fetchJsonGet(`https://openexchangerates.org/api/historical/${currentDateKey}.json?app_id=${process.env.EXCHANGE_RATE_API_KEY}&base=USD`);

                if (!currencyData.rates)
                    throw new Error(`No currency rates returned from API for ${currentDateKey}. Got: ${JSON.stringify(currencyData)}`);

                cachedRow.currencies = { base_currency: 'USD', rates: currencyData.rates };
            } catch (error: any) {
                throw new Error(`Failed to fetch currency rates for ${currentDateKey}: ${error.message}`);
            }

            // Facebook data
            try {
                const campaignInsights = await this.getFacebookInsights(facebookIntegration.account, 'campaign', currentDateKey);
                await delay(300);
                const adsetInsights = await this.getFacebookInsights(facebookIntegration.account, 'adset', currentDateKey);
                await delay(300);
                const adInsights = await this.getFacebookInsights(facebookIntegration.account, 'ad', currentDateKey);

                cachedRow.facebook.campaigns = this.processInsights(campaignInsights);
                cachedRow.facebook.adsets = this.processInsights(adsetInsights);
                cachedRow.facebook.ads = this.processInsights(adInsights);

                this.validateInsights(cachedRow.facebook.campaigns, 'campaign');
                this.validateInsights(cachedRow.facebook.adsets, 'adset');
                this.validateInsights(cachedRow.facebook.ads, 'ad');

            } catch (error: any) {
                throw new Error(`Failed to fetch Facebook insights for ${currentDateKey}: ${error.message}`);
            }

            // Save to DB if not today
            if (!isToday) {
                try {
                    const { error: insertError } = await adminClient
                        .from('cache')
                        .upsert(cachedRow, { onConflict: 'year, month, day' }); // Use upsert to handle potential race conditions or re-runs
                    if (insertError) throw insertError;
                } catch (insertError: any) {
                    throw new Error(`Failed to insert cache for ${currentDateKey}: ${insertError.message}`);
                }
            }

            this.dailyCache.set(currentDateKey, cachedRow);
            console.log(`Successfully fetched and cached data for ${currentDateKey}.`);
            await delay(500); // Add a small delay between days to avoid hitting rate limits
        }
        console.log(`Cache loaded for ${this.dailyCache.size} days.`);
    }

    private processInsights(insights: any[]): FacebookInsight[] {
        return insights.map(insight => {
            try {
                const data = insight._data;
                // Provide defaults (0) for potentially missing numeric fields expected by FacebookInsight type
                const row: FacebookInsight = {
                    campaign_id: data.campaign_id,
                    adset_id: data.adset_id, // Might be undefined at campaign level
                    ad_id: data.ad_id,       // Might be undefined at campaign/adset level
                    impressions: data.impressions ? parseFloat(data.impressions) : 0,
                    // Assuming unique_outbound_clicks structure is an array like [{ value: '123' }]
                    unique_outbound_clicks: data.unique_outbound_clicks && data.unique_outbound_clicks.length > 0 && data.unique_outbound_clicks[0].value
                        ? parseFloat(data.unique_outbound_clicks[0].value)
                        : 0,
                    reach: data.reach ? parseFloat(data.reach) : 0,
                    spend: data.spend ? parseFloat(data.spend) : 0,
                };

                // Additional check for NaN after parseFloat, default to 0 if NaN
                row.impressions = isNaN(row.impressions) ? 0 : row.impressions;
                row.unique_outbound_clicks = isNaN(row.unique_outbound_clicks) ? 0 : row.unique_outbound_clicks;
                row.reach = isNaN(row.reach) ? 0 : row.reach;
                row.spend = isNaN(row.spend) ? 0 : row.spend;

                return row;

            } catch (error: any) {
                throw new Error(`Error processing insight: ${error.message}. Data: ${JSON.stringify(insight?._data)}`);
            }
        });
    }

    private validateInsights(insights: FacebookInsight[], level: string): void {
        for (const insight of insights) {
            if (!insight.campaign_id) throw new Error(`Missing campaign_id for ${level} insight: ${JSON.stringify(insight)}`);
            if (level === 'adset' && !insight.adset_id) throw new Error(`Missing adset_id for adset insight: ${JSON.stringify(insight)}`);
            if (level === 'ad' && (!insight.adset_id || !insight.ad_id)) throw new Error(`Missing adset_id or ad_id for ad insight: ${JSON.stringify(insight)}`);

            const fieldsToValidate: (keyof FacebookInsight)[] = ['impressions', 'unique_outbound_clicks', 'reach', 'spend'];
            for (const field of fieldsToValidate) {
                if (insight[field] === undefined || insight[field] === null || isNaN(insight[field] as number)) {
                    throw new Error(`Invalid or missing value for field '${field}' in ${level} insight: ${JSON.stringify(insight)}`);
                }
            }
        }
    }

    private async getLoggedInUserFacebookIntegration(): Promise<{ account: AdAccount; accessToken: string }> {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not logged in.');

        const fbIntegration = user?.user_metadata?.facebook_integration;
        if (!fbIntegration?.connected || !fbIntegration.user_access_token) {
            throw new Error('Facebook account is not connected.');
        }

        const accountId: string | undefined = fbIntegration.adAccount?.id;
        if (!accountId) throw new Error('Facebook ad account ID is missing.');

        FacebookAdsApi.init(fbIntegration.user_access_token);
        return { account: new AdAccount(accountId), accessToken: fbIntegration.user_access_token };
    }

    private async getAccountCurrency(account: AdAccount): Promise<string> {
        try {
            const fields = ['currency'];
            const accountData = await account.get(fields) as any;

            if (!accountData?.currency)
                throw new Error('Could not retrieve account currency');

            return accountData.currency;

        } catch (error) {
            throw new Error(`[fb-revenue] Error fetching account currency: ${error}`);
        }
    }

    private async getFacebookInsights(account: AdAccount, level: 'campaign' | 'adset' | 'ad', dateStr: string): Promise<any[]> {
        try {
            const cursor = await account.getInsights(['impressions', 'clicks', 'cpc', 'reach', 'frequency', 'unique_outbound_clicks', 'spend', 'date_start', 'campaign_id', 'adset_id', 'ad_id'], {
                level,
                time_range: { since: dateStr, until: dateStr },
                time_increment: 1,
                limit: 1000,
            });

            return await this.fetchFacebookCursor(cursor);

        } catch (error) {
            throw new Error(`[fb-revenue] Error fetching ${level} insights for date ${dateStr}:` + error);
        }
    }

    private async fetchFacebookCursor(cursor: Cursor | null, delayMs = 300): Promise<Cursor[]> {
        const all: any[] = [];
        let cur = cursor;

        while (cur) {
            all.push(...cur);

            if (cur.hasNext?.()) {
                await delay(delayMs);

                cur = await cur.next();

            } else
                cur = null;
        }
        return all;
    }

    public getVisitors(): { total: number; items: Tracking[]; } {
        const visitorsByIp: Tracking[] = [];

        for (const row of this.rows)
            if (row.type === 'view' && row.url == this.trackingUrl && this.isWithinDateRange(row))
                visitorsByIp.push(row);

        visitorsByIp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            total: visitorsByIp.length,
            items: visitorsByIp
        };
    }

    public getSignUps(): { unique_total: number; unique_items: Tracking[]; all_total: number; all_items: SignupInfo[]; } {
        const signupsInDateRange = this.rows.filter(row => row.type === 'sign_up' && this.isWithinDateRange(row));
        
        // Find the earliest signup FOR EACH EMAIL across ALL time
        const earliestSignupsEver: Record<string, Date> = {};
        for (const signup of this.allSignupsEver) {
            if (!signup.email) continue;
            
            const signupDate = new Date(signup.date);
            if (!earliestSignupsEver[signup.email] || signupDate < earliestSignupsEver[signup.email]) {
                earliestSignupsEver[signup.email] = signupDate;
            }
        }

        const unique_items: Tracking[] = [];
        const all_items: SignupInfo[] = [];
        const processedEmails = new Set<string>();

        // Sort by date to process chronologically within the range
        signupsInDateRange.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const signup of signupsInDateRange) {
            if (!signup.email) {
                // Should not happen, but handle it. It's unique in its own way.
                unique_items.push(signup);
                all_items.push({ ...signup });
                continue;
            }

            const signupInfo: SignupInfo = { ...signup };
            const earliestDate = earliestSignupsEver[signup.email];
            
            if (earliestDate) {
                // Check if the earliest registration happened before the current date range
                if (earliestDate < this.startDateObject) {
                    signupInfo.nonUniqueReason = 'registered_previously';
                    signupInfo.previousRegistrationDate = earliestDate.toISOString();
                } else {
                    // Earliest registration is within the date range
                    // Has this email been processed in this loop already?
                    if (processedEmails.has(signup.email)) {
                        signupInfo.nonUniqueReason = 'duplicate';
                    } else {
                        // First occurrence in the date range, and it's the first ever.
                        unique_items.push(signup);
                        processedEmails.add(signup.email);
                    }
                }
            } else {
                // This case should ideally not happen if allSignupsEver is comprehensive.
                // It means this is the first time we've ever seen this email.
                unique_items.push(signup);
                processedEmails.add(signup.email);
            }
            all_items.push(signupInfo);
        }

        all_items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        unique_items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            unique_total: unique_items.length,
            unique_items: unique_items,
            all_total: all_items.length,
            all_items: all_items
        };
    }

    public getPurchases(): { totalAmount: number; secondaryConversionRate: number; items: ConvertedTracking[]; } {
        const purchases: ConvertedTracking[] = [];
        let totalPrimaryOfferPurchases = 0; // Count purchases including the primary offer
        let totalSecondaryOfferPurchases = 0; // Count purchases including the secondary offer
        let totalAmount = 0;

        for (const row of this.rows) {
            if (row.type === 'buy' && this.isWithinDateRange(row)) {
                const transaction = this.mzdaTransactions.find(t => t.transaction_id === row.metadata.payment_id);

                if (!transaction) {
                    throw new Error(`Data integrity issue: No mzda transaction found for purchase with payment_id ${row.metadata.payment_id}`);
                }

                if (isNaN(transaction.unit_price)) throw new Error(`Unit price is NaN for transaction ${transaction.transaction_id}`);
                if (isNaN(transaction.fee)) throw new Error(`Fee is NaN for transaction ${transaction.transaction_id}`);
                if (!transaction.currency) throw new Error(`Currency is missing for transaction ${transaction.transaction_id}`);

                // Use net amount (price - fee) for value calculation
                const netAmountInTransactionCurrency = transaction.unit_price - transaction.fee;
                const netAmountInBaseCurrency = this.convertCurrency(row.date, netAmountInTransactionCurrency, transaction.currency);

                if (isNaN(netAmountInBaseCurrency)) {
                    throw new Error(`Converted net amount is NaN for purchase ${row.metadata.payment_id}`);
                }

                // Count primary/secondary offers based on the tracking row metadata
                if (row.metadata.primary_offer_slug) {
                    totalPrimaryOfferPurchases++;
                    if (row.metadata.secondary_offer_slug) {
                        totalSecondaryOfferPurchases++;
                    }
                } else {
                    throw new Error(`Purchase tracking row ID ${row.id} with payment_id ${row.metadata.payment_id} is missing primary_offer_slug.`);
                }


                purchases.push({
                    ...row,
                    local_value: netAmountInBaseCurrency // Store the value in the base currency
                });

                totalAmount += netAmountInBaseCurrency;
            }
        }

        purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate secondary conversion rate based on primary offers that *could* have had a secondary offer
        const secondaryConversionRate = totalPrimaryOfferPurchases > 0
            ? (totalSecondaryOfferPurchases / totalPrimaryOfferPurchases)
            : 0;

        if (isNaN(totalAmount)) throw new Error("Calculated total purchase amount is NaN");
        if (isNaN(secondaryConversionRate)) throw new Error("Calculated secondary conversion rate is NaN");


        return {
            totalAmount: totalAmount,
            secondaryConversionRate: secondaryConversionRate,
            items: purchases,
        };
    }

    private convertCurrency(dateString: string, amount: number, fromCurrency: string): number {
        if (this.baseCurrency === fromCurrency) {
            return amount;
        }

        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cache = this.dailyCache.get(dateKey);

        if (!cache) {
            throw new Error(`Missing cache entry for date ${dateKey}, cannot perform currency conversion. Found for: ` + JSON.stringify(this.dailyCache.keys()));
        }

        if (!cache.currencies || !cache.currencies.rates || !cache.currencies.base_currency) {
            throw new Error(`Invalid currency cache structure for date ${dateKey}.`);
        }

        const rates = cache.currencies.rates;
        const cacheBase = cache.currencies.base_currency; // e.g., USD

        if (!rates[fromCurrency]) {
            throw new Error(`Missing exchange rate for source currency '${fromCurrency}' on ${dateKey}. Available rates: ${Object.keys(rates).join(', ')}`);
        }
        if (!rates[this.baseCurrency]) {
            throw new Error(`Missing exchange rate for target currency '${this.baseCurrency}' on ${dateKey}. Available rates: ${Object.keys(rates).join(', ')}`);
        }

        let amountInCacheBase: number;
        if (fromCurrency === cacheBase) {
            amountInCacheBase = amount;
        } else {
            amountInCacheBase = amount / rates[fromCurrency]; // Convert 'from' currency to cache base (USD)
        }

        if (isNaN(amountInCacheBase)) {
            throw new Error(`Amount in cache base currency ('${cacheBase}') calculated as NaN for ${amount} ${fromCurrency} on ${dateKey}. Rate: ${rates[fromCurrency]}`);
        }

        let targetAmount: number;
        if (this.baseCurrency === cacheBase) {
            targetAmount = amountInCacheBase;
        } else {
            targetAmount = amountInCacheBase * rates[this.baseCurrency]; // Convert from cache base (USD) to target currency
        }

        if (isNaN(targetAmount)) {
            throw new Error(`Final target amount calculated as NaN for ${amount} ${fromCurrency} to ${this.baseCurrency} on ${dateKey}. Rate: ${rates[this.baseCurrency]}, Base Amount: ${amountInCacheBase}`);
        }


        return targetAmount;
    }

    public getDailyData(visitors: Tracking[], signups: Tracking[], purchases: ConvertedTracking[]): AdminSalesDailyData[] {
        const dailyDataMap = new Map<string, AdminSalesDailyData>();

        // Initialize daily data structure
        for (let date = new Date(this.startDateObject); date <= this.endDateObject; date.setDate(date.getDate() + 1)) {
            // Convert UTC date to local date for proper day boundary calculation
            const localDateString = convertUtcToLocal(date.toISOString());
            const [datePart] = localDateString.split(',');
            const [month, day, year] = datePart.split('/');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            const dayOfMonth = parseInt(day);
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);

            // Get the day of week in local time
            const localDate = new Date(yearNum, monthNum - 1, dayOfMonth);
            const weekDay = localDate.toLocaleDateString('en-US', { weekday: 'short' });

            const cache = this.dailyCache.get(dateKey);

            if (!cache)
                throw new Error(`Missing cache for date ${dateKey} when calculating daily data. Skipping day.`);

            if (!cache.facebook || !cache.facebook.campaigns)
                throw new Error(`Invalid Facebook cache structure for date ${dateKey} when calculating daily data. Skipping day.`);

            // Aggregate spend and metrics from FB cache for the day
            let dailySpendRaw = 0;
            let dailyImpressions = 0;
            let dailyReach = 0;
            let dailyOutboundClicks = 0;
            const accountCurrency = cache.facebook.account_currency;

            if (!accountCurrency)
                throw new Error(`Missing account currency in cache for ${dateKey}. Cannot convert spend accurately. Skipping day.`);

            cache.facebook.campaigns.forEach(c => {
                dailySpendRaw += c.spend; // Spend in account currency
                dailyImpressions += c.impressions;
                dailyReach += c.reach;
                dailyOutboundClicks += c.unique_outbound_clicks;
            });

            // Convert daily spend to base currency
            const dailySpendConverted = this.convertCurrency(dateKey, dailySpendRaw, accountCurrency);

            if (isNaN(dailySpendConverted)) {
                throw new Error(`Daily spend conversion resulted in NaN for ${dateKey}. Raw spend: ${dailySpendRaw} ${accountCurrency}. Skipping day.`);
            }


            dailyDataMap.set(dateKey, {
                date: `${dayOfMonth.toString().padStart(2, '0')}.${monthNum.toString().padStart(2, '0')}.${yearNum} (${weekDay})`,
                spend: dailySpendConverted,
                impressions: dailyImpressions,
                reach: dailyReach,
                frequency: dailyReach > 0 ? (dailyImpressions / dailyReach) : 0,
                cpm: dailyImpressions > 0 ? (dailySpendConverted / dailyImpressions) * 1000 : 0,
                unique_outbound_clicks: dailyOutboundClicks,
                cpc: dailyOutboundClicks > 0 ? (dailySpendConverted / dailyOutboundClicks) : 0,
                ctr: dailyImpressions > 0 ? (dailyOutboundClicks / dailyImpressions) * 100 : 0,
                visitors: 0, // Initialize counts
                leads: 0,
                visitToLead: 0,
                purchases: 0,
                cash: 0,
                refundsCount: 0,
                refundsAmount: 0,
                leadToPurchase: 0,
                visitToPurchase: 0,
                profitLoss: 0, // Will be calculated later
                roas: 0,       // Will be calculated later
            });
        }

        // Aggregate events into daily data
        visitors.forEach(v => {
            // Convert UTC date to local date for grouping by day
            const localDate = convertUtcToLocal(v.date);
            // Extract the date part in YYYY-MM-DD format from local date string
            const [datePart] = localDate.split(',');
            const [month, day, year] = datePart.split('/');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const dayData = dailyDataMap.get(dateKey);
            if (dayData) dayData.visitors++;
        });

        signups.forEach(s => {
            // Convert UTC date to local date for grouping by day
            const localDate = convertUtcToLocal(s.date);
            // Extract the date part in YYYY-MM-DD format from local date string
            const [datePart] = localDate.split(',');
            const [month, day, year] = datePart.split('/');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const dayData = dailyDataMap.get(dateKey);
            if (dayData) dayData.leads++;
        });

        purchases.forEach(p => {
            // Convert UTC date to local date for grouping by day
            const localDate = convertUtcToLocal(p.date);
            // Extract the date part in YYYY-MM-DD format from local date string
            const [datePart] = localDate.split(',');
            const [month, day, year] = datePart.split('/');
            const dateKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const dayData = dailyDataMap.get(dateKey);
            if (dayData) {
                dayData.purchases++;
                dayData.cash += p.local_value; // Already in base currency
                if (p.metadata.payment_status === 'refunded') {
                    dayData.refundsCount++;
                    dayData.refundsAmount += p.local_value; // Refund amount in base currency
                }
            }
        });

        // Calculate derived metrics for each day
        dailyDataMap.forEach(dayData => {
            dayData.visitToLead = dayData.visitors > 0 ? (dayData.leads / dayData.visitors) * 100 : 0;
            dayData.leadToPurchase = dayData.leads > 0 ? (dayData.purchases / dayData.leads) * 100 : 0;
            dayData.visitToPurchase = dayData.visitors > 0 ? (dayData.purchases / dayData.visitors) * 100 : 0;
            dayData.profitLoss = dayData.cash - dayData.spend - dayData.refundsAmount;
            dayData.roas = dayData.spend > 0 ? (dayData.cash / dayData.spend) : 0;

            // Final validation for the day's data
            for (const field of Object.keys(dayData)) {
                const value = dayData[field as keyof AdminSalesDailyData];

                if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
                    throw new Error(`Invalid daily data for ${dayData.date}: Field '${field}' is NaN or Infinite (${value}).`);

                } else if (value === undefined || value === null) {
                    throw new Error(`Invalid daily data for ${dayData.date}: Field '${field}' is undefined or null.`);
                }
            }
        });

        return Array.from(dailyDataMap.values()).sort((a, b) => {
            // Sort by date string YYYY-MM-DD extracted from the formatted date
            const dateA = a.date.substring(6, 10) + a.date.substring(3, 5) + a.date.substring(0, 2);
            const dateB = b.date.substring(6, 10) + b.date.substring(3, 5) + b.date.substring(0, 2);
            return dateA.localeCompare(dateB);
        });
    }

    public async getAttributedPurchases(purchases: ConvertedTracking[]): Promise<AttributedPurchase[]> {
        const attributedPurchases: AttributedPurchase[] = [];

        for (const purchase of purchases) {
            const userIds: Set<number> = new Set();
            const trackedSteps: TrackedStep[] = [];

            for (const row of this.rows)
                if (purchase.email == row.email || purchase.email == row.metadata.paypal_email)
                    userIds.add(row.user_id);

            for (const row of this.rows) {
                if (userIds.has(row.user_id) && new Date(row.date) <= new Date(purchase.date)) {
                    if (row.referer) {
                        const url = new URL(row.referer);
                        const campaignId = url.searchParams.get('camp');
                        const adsetId = url.searchParams.get('adset');
                        const adId = url.searchParams.get('ad');

                        if (campaignId && campaignId != '{{campaign.id}}')
                            row.campaign_id = campaignId;

                        if (adsetId && adsetId != '{{adset.id}}')
                            row.adset_id = adsetId;

                        if (adId && adId != '{{ad.id}}')
                            row.ad_id = adId;
                    }

                    if (row.campaign_id) {
                        if (!row.adset_id)
                            throw new Error('Adset id is missing for visitor event, skipping step: ' + JSON.stringify(row));

                        if (!row.ad_id)
                            throw new Error('Ad id is missing for visitor event, skipping step: ' + JSON.stringify(row));

                        let campaignName = this.idToNameMappings[row.campaign_id];
                        if (!campaignName) {
                            campaignName = await this.fetchCampaignNameFromFacebook(row.campaign_id);
                            await this.cacheObject('campaign', row.campaign_id, campaignName);
                            this.idToNameMappings[row.campaign_id] = campaignName;
                        }

                        let adsetName = this.idToNameMappings[row.adset_id];
                        if (!adsetName) {
                            adsetName = await this.fetchAdSetNameFromFacebook(row.adset_id);
                            await this.cacheObject('adset', row.adset_id, adsetName, row.campaign_id);
                            this.idToNameMappings[row.adset_id] = adsetName;
                        }

                        let adName = this.idToNameMappings[row.ad_id];
                        if (!adName) {
                            adName = await this.fetchAdNameFromFacebook(row.ad_id);
                            await this.cacheObject('ad', row.ad_id, adName, row.adset_id);
                            this.idToNameMappings[row.ad_id] = adName;
                        }

                        const formattedValue = `${campaignName} > ${adsetName} > ${adName}`;
                        let found = false;

                        for (const step of trackedSteps)
                            if (step.formatted === formattedValue)
                                found = true;

                        if (!found)
                            trackedSteps.push({
                                date: row.date,
                                formatted: formattedValue,
                                campaignId: row.campaign_id,
                                campaignName: campaignName,
                                adsetId: row.adset_id,
                                adsetName: adsetName,
                                adId: row.ad_id,
                                adName: adName,
                            });

                    } else if (row.source) {
                        if (!row.source_type)
                            throw new Error('Source type is missing for visitor event, skipping step: ' + JSON.stringify(row));

                        let found = false;

                        for (const step of trackedSteps)
                            if (step.formatted === `${row.source_type}-${row.source}`)
                                found = true;

                        if (!found)
                            trackedSteps.push({
                                date: row.date,
                                formatted: `${row.source_type}-${row.source}`,
                                source: row.source,
                                sourceType: row.source_type
                            });

                    } else if (row.referer) {
                        let referer = row.referer.replace("https://", "").replace("http://", "").replace("www.", "");

                        referer = referer.replace(/^m\.facebook\.com/, 'facebook.com');
                        referer = referer.replace(/^l\.facebook\.com/, 'facebook.com');
                        referer = referer.replace(/^lm\.facebook\.com/, 'facebook.com');

                        referer = referer.replace(/\/$/, '');

                        if (!referer.startsWith("facebook.com")) {
                            let found = false

                            for (const step of trackedSteps)
                                if (step.formatted === referer)
                                    found = true;

                            if (!found)
                                trackedSteps.push({
                                    date: row.date,
                                    formatted: referer,
                                    referer: referer
                                });
                        }
                    }
                }
            }

            // Sort steps chronologically before selecting first/last
            trackedSteps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (trackedSteps.length > 0)
                attributedPurchases.push({
                    purchaseId: purchase.id,
                    steps: trackedSteps,
                    cash: purchase.local_value, // Already in base currency
                    email: purchase.email!,
                    currency: this.baseCurrency, // Report in base currency
                    item: purchase.metadata.primary_offer_slug! + (purchase.metadata.secondary_offer_slug ? ' + ' + purchase.metadata.secondary_offer_slug : '')
                });
        }

        return attributedPurchases;
    }

    // New method to calculate Facebook sales data
    public async calculateFacebookSalesData(attributedPurchases: AttributedPurchase[]): Promise<{
        individual: Map<string, CampaignInfo>; // Campaign ID -> CampaignInfo
        totals: { spend: number; sales: number; cash: number; roas: number; };
    }> {
        const individualHierarchy = this.buildFacebookHierarchy();

        await this.populateMetricsInHierarchy(individualHierarchy);
        this.populateSalesInHierarchy(individualHierarchy, attributedPurchases);
        this.rollUpAndAdjustHierarchy(individualHierarchy);

        const totals = this.calculateHierarchyTotals(individualHierarchy);

        return {
            individual: individualHierarchy,
            totals: totals
        };
    }

    private buildFacebookHierarchy(): Map<string, CampaignInfo> {
        const campaigns = new Map<string, CampaignInfo>();
        const adsets = new Map<string, AdSetInfo>(); // Temp map for linking ads

        // 1. Create Campaigns
        this.nameCache.filter(item => item.object_type === 'campaign').forEach(item => {
            if (!campaigns.has(item.object_id)) {
                campaigns.set(item.object_id, {
                    campaign_id: item.object_id,
                    campaign_name: item.name,
                    impressions: 0, unique_outbound_clicks: 0, reach: 0, spend: 0, sales: 0, cash: 0,
                    adsets: [] // Initialize adsets array
                });
            }
        });

        // 2. Create AdSets and link to Campaigns
        this.nameCache.filter(item => item.object_type === 'adset').forEach(item => {
            const parentCampaign = campaigns.get(item.parent_id!);
            if (parentCampaign && !adsets.has(item.object_id)) {
                const newAdset: AdSetInfo = {
                    adset_id: item.object_id,
                    adset_name: item.name,
                    impressions: 0, unique_outbound_clicks: 0, reach: 0, spend: 0, sales: 0, cash: 0,
                    ads: [] // Initialize ads array
                };
                parentCampaign.adsets.push(newAdset);
                adsets.set(item.object_id, newAdset); // Store for linking ads
            } else if (!parentCampaign) {
                // Skip silently - missing campaign will be created during populateMetricsInHierarchy if needed
            }
        });

        // 3. Create Ads and link to AdSets
        this.nameCache.filter(item => item.object_type === 'ad').forEach(item => {
            const parentAdset = adsets.get(item.parent_id!);
            if (parentAdset) {
                parentAdset.ads.push({
                    ad_id: item.object_id,
                    ad_name: item.name,
                    impressions: 0, unique_outbound_clicks: 0, reach: 0, spend: 0, sales: 0, cash: 0,
                });
            } else {
                // Skip silently - missing adset and campaign will be created during populateMetricsInHierarchy if needed
            }
        });

        return campaigns;
    }

    private async populateMetricsInHierarchy(hierarchy: Map<string, CampaignInfo>): Promise<void> {
        for (const [dateKey, dayCache] of this.dailyCache.entries()) {
            if (!dayCache.facebook || !dayCache.facebook.account_currency) {
                throw new Error(`Skipping metric population for ${dateKey} due to missing facebook data or account currency.`);
            }
            const accountCurrency = dayCache.facebook.account_currency;

            // Populate Campaigns
            if (dayCache.facebook.campaigns) {
                for (const insight of dayCache.facebook.campaigns) {
                    let campaign = hierarchy.get(insight.campaign_id);
                    if (!campaign) {
                        // Try to fetch the actual name from Facebook
                        const campaignName = await this.fetchCampaignNameFromFacebook(insight.campaign_id);
                        
                        // Save campaign to cache
                        await this.cacheObject('campaign', insight.campaign_id, campaignName);
                        
                        // Create the campaign in hierarchy
                        campaign = {
                            campaign_id: insight.campaign_id,
                            campaign_name: campaignName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0,
                            adsets: []
                        };
                        hierarchy.set(insight.campaign_id, campaign);
                        
                        // Also add to idToNameMappings
                        this.idToNameMappings[insight.campaign_id] = campaign.campaign_name;
                    }
                    
                    const spendConverted = this.convertCurrency(dateKey, insight.spend, accountCurrency);
                    if (isNaN(spendConverted)) {
                        throw new Error(`NaN spend conversion for campaign ${insight.campaign_id} on ${dateKey}. Raw: ${insight.spend} ${accountCurrency}`);
                    } else {
                        campaign.spend += spendConverted;
                    }
                    campaign.impressions += insight.impressions;
                    campaign.reach += insight.reach;
                    campaign.unique_outbound_clicks += insight.unique_outbound_clicks;
                }
            }

            // Populate AdSets
            if (dayCache.facebook.adsets) {
                for (const insight of dayCache.facebook.adsets) {
                    let campaign = hierarchy.get(insight.campaign_id);
                    if (!campaign) {
                        // Try to fetch the actual name from Facebook
                        const campaignName = await this.fetchCampaignNameFromFacebook(insight.campaign_id);
                        
                        // Save campaign to cache
                        await this.cacheObject('campaign', insight.campaign_id, campaignName);
                        
                        campaign = {
                            campaign_id: insight.campaign_id,
                            campaign_name: campaignName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0,
                            adsets: []
                        };
                        hierarchy.set(insight.campaign_id, campaign);
                        this.idToNameMappings[insight.campaign_id] = campaign.campaign_name;
                    }
                    
                    if (!insight.adset_id) continue;

                    let adset = campaign.adsets.find((a: AdSetInfo) => a.adset_id === insight.adset_id);
                    if (!adset) {
                        // Try to fetch the actual name from Facebook
                        const adsetName = await this.fetchAdSetNameFromFacebook(insight.adset_id);
                        
                        // Save adset to cache
                        await this.cacheObject('adset', insight.adset_id, adsetName, insight.campaign_id);
                        
                        // Create the adset in hierarchy
                        adset = {
                            adset_id: insight.adset_id,
                            adset_name: adsetName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0,
                            ads: []
                        };
                        campaign.adsets.push(adset);
                        
                        // Also add to idToNameMappings
                        this.idToNameMappings[insight.adset_id] = adset.adset_name;
                    }
                    
                    const spendConverted = this.convertCurrency(dateKey, insight.spend, accountCurrency);
                    if (isNaN(spendConverted)) {
                        throw new Error(`NaN spend conversion for adset ${insight.adset_id} on ${dateKey}. Raw: ${insight.spend} ${accountCurrency}`);
                    } else {
                        adset.spend += spendConverted;
                    }
                    adset.impressions += insight.impressions;
                    adset.reach += insight.reach;
                    adset.unique_outbound_clicks += insight.unique_outbound_clicks;
                }
            }

            // Populate Ads
            if (dayCache.facebook.ads) {
                for (const insight of dayCache.facebook.ads) {
                    let campaign = hierarchy.get(insight.campaign_id);
                    if (!campaign) {
                        // Try to fetch the actual name from Facebook
                        const campaignName = await this.fetchCampaignNameFromFacebook(insight.campaign_id);
                        
                        // Save campaign to cache
                        await this.cacheObject('campaign', insight.campaign_id, campaignName);
                        
                        campaign = {
                            campaign_id: insight.campaign_id,
                            campaign_name: campaignName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0,
                            adsets: []
                        };
                        hierarchy.set(insight.campaign_id, campaign);
                        this.idToNameMappings[insight.campaign_id] = campaign.campaign_name;
                    }
                    
                    if (!insight.adset_id || !insight.ad_id) continue;

                    let adset = campaign.adsets.find((a: AdSetInfo) => a.adset_id === insight.adset_id);
                    if (!adset) {
                        // Try to fetch the actual name from Facebook
                        const adsetName = await this.fetchAdSetNameFromFacebook(insight.adset_id);
                        
                        // Save adset to cache
                        await this.cacheObject('adset', insight.adset_id, adsetName, insight.campaign_id);
                        
                        adset = {
                            adset_id: insight.adset_id,
                            adset_name: adsetName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0,
                            ads: []
                        };
                        campaign.adsets.push(adset);
                        this.idToNameMappings[insight.adset_id] = adset.adset_name;
                    }

                    let ad = adset.ads.find((ad: AdInfo) => ad.ad_id === insight.ad_id);
                    if (!ad) {
                        // Try to fetch the actual name from Facebook
                        const adName = await this.fetchAdNameFromFacebook(insight.ad_id);
                        
                        // Save ad to cache
                        await this.cacheObject('ad', insight.ad_id, adName, insight.adset_id);
                        
                        // Create the ad in hierarchy
                        ad = {
                            ad_id: insight.ad_id,
                            ad_name: adName,
                            impressions: 0,
                            unique_outbound_clicks: 0,
                            reach: 0,
                            spend: 0,
                            sales: 0,
                            cash: 0
                        };
                        adset.ads.push(ad);
                        
                        // Also add to idToNameMappings
                        this.idToNameMappings[insight.ad_id] = ad.ad_name;
                    }
                    
                    const spendConverted = this.convertCurrency(dateKey, insight.spend, accountCurrency);
                    if (isNaN(spendConverted)) {
                        throw new Error(`NaN spend conversion for ad ${insight.ad_id} on ${dateKey}. Raw: ${insight.spend} ${accountCurrency}`);
                    } else {
                        ad.spend += spendConverted;
                    }
                    ad.impressions += insight.impressions;
                    ad.reach += insight.reach;
                    ad.unique_outbound_clicks += insight.unique_outbound_clicks;
                }
            }
        }
    }

    private populateSalesInHierarchy(hierarchy: Map<string, CampaignInfo>, attributedPurchases: AttributedPurchase[]): void {
        attributedPurchases.forEach(purchase => {
            // Find the *last* Facebook step in the journey for attribution
            let lastFbStep: TrackedStep | null = null;
            for (let i = purchase.steps.length - 1; i >= 0; i--) {
                const step = purchase.steps[i];
                // Check if it's a FB step (has campaign/adset/ad IDs and names)
                if (step.campaignId && step.campaignName && step.adsetId && step.adsetName && step.adId && step.adName) {
                    lastFbStep = step;
                    break;
                }
            }

            if (lastFbStep) {
                const campaign = hierarchy.get(lastFbStep.campaignId!);
                if (!campaign) {
                    throw new Error(`Attributed purchase ${purchase.purchaseId} points to campaign ${lastFbStep.campaignId} which is not in hierarchy.`);
                }

                const adset = campaign.adsets.find((a: AdSetInfo) => a.adset_id === lastFbStep!.adsetId);
                if (!adset) {
                    throw new Error(`Attributed purchase ${purchase.purchaseId} points to adset ${lastFbStep.adsetId} which is not in hierarchy under campaign ${lastFbStep.campaignId}.`);
                }

                const ad = adset.ads.find((ad: AdInfo) => ad.ad_id === lastFbStep!.adId);
                if (!ad) {
                    throw new Error(`Attributed purchase ${purchase.purchaseId} points to ad ${lastFbStep.adId} which is not in hierarchy under adset ${lastFbStep.adsetId}.`);
                }

                ad.sales++;
                ad.cash += purchase.cash;
            }
        });
    }

    private calculateHierarchyTotals(hierarchy: Map<string, CampaignInfo>): {
        spend: number; sales: number; cash: number; roas: number;
    } {
        let totalSpend = 0;
        let totalSales = 0;
        let totalCash = 0;

        hierarchy.forEach(campaign => {
            totalSpend += campaign.spend;
            totalSales += campaign.sales;
            totalCash += campaign.cash;
        });

        const totalRoas = totalSpend > 0 ? totalCash / totalSpend : 0;

        return { spend: totalSpend, sales: totalSales, cash: totalCash, roas: totalRoas };
    }

    private rollUpAndAdjustHierarchy(hierarchy: Map<string, CampaignInfo>): void {
        hierarchy.forEach(campaign => {
            let adsetsSpendSum = 0;
            let adsetsSalesSum = 0;
            let adsetsCashSum = 0;
            let adsetsImpressionsSum = 0;
            let adsetsReachSum = 0;
            let adsetsClicksSum = 0;

            campaign.adsets.forEach(adset => {
                let adsSpendSum = 0;
                let adsSalesSum = 0;
                let adsCashSum = 0;
                let adsImpressionsSum = 0;
                let adsReachSum = 0;
                let adsClicksSum = 0;

                adset.ads.forEach(ad => {
                    adsSpendSum += ad.spend;
                    adsSalesSum += ad.sales;
                    adsCashSum += ad.cash;
                    adsImpressionsSum += ad.impressions;
                    adsReachSum += ad.reach;
                    adsClicksSum += ad.unique_outbound_clicks;
                });

                // Adset level rollup
                // For spend and metrics from FB, we take the max to account for deleted children.
                adset.spend = Math.max(adset.spend, adsSpendSum);
                adset.impressions = Math.max(adset.impressions, adsImpressionsSum);
                adset.reach = Math.max(adset.reach, adsReachSum);
                adset.unique_outbound_clicks = Math.max(adset.unique_outbound_clicks, adsClicksSum);

                // For sales and cash, we sum up from children.
                adset.sales = adsSalesSum;
                adset.cash = adsCashSum;

                adsetsSpendSum += adset.spend;
                adsetsSalesSum += adset.sales;
                adsetsCashSum += adset.cash;
                adsetsImpressionsSum += adset.impressions;
                adsetsReachSum += adset.reach;
                adsetsClicksSum += adset.unique_outbound_clicks;
            });

            // Campaign level rollup
            campaign.spend = Math.max(campaign.spend, adsetsSpendSum);
            campaign.impressions = Math.max(campaign.impressions, adsetsImpressionsSum);
            campaign.reach = Math.max(campaign.reach, adsetsReachSum);
            campaign.unique_outbound_clicks = Math.max(campaign.unique_outbound_clicks, adsetsClicksSum);

            // For sales and cash, we sum up from children.
            campaign.sales = adsetsSalesSum;
            campaign.cash = adsetsCashSum;
        });
    }

    private isWithinDateRange(row: Tracking): boolean {
        return new Date(row.date) >= this.startDateObject && new Date(row.date) <= this.endDateObject;
    }

    public getIdToNameMappings() {
        return this.idToNameMappings;
    }

    private async fetchCampaignNameFromFacebook(campaignId: string): Promise<string> {
        try {
            await this.getLoggedInUserFacebookIntegration();
            
            const campaign = new Campaign(campaignId);
            const fields = ['name'];
            const data = await campaign.get(fields) as any;
            
            if (!data?.name)
                throw new Error('Could not retrieve campaign name');
                
            return data.name;
        } catch (error) {
            console.error(`Failed to fetch campaign name for ${campaignId}:`, error);
            return `Unknown Campaign (${campaignId})`;
        }
    }

    private async fetchAdSetNameFromFacebook(adsetId: string): Promise<string> {
        try {
            await this.getLoggedInUserFacebookIntegration();
            
            const adset = new AdSet(adsetId);
            const fields = ['name'];
            const data = await adset.get(fields) as any;
            
            if (!data?.name)
                throw new Error('Could not retrieve adset name');
                
            return data.name;
        } catch (error) {
            console.error(`Failed to fetch adset name for ${adsetId}:`, error);
            return `Unknown AdSet (${adsetId})`;
        }
    }

    private async fetchAdNameFromFacebook(adId: string): Promise<string> {
        try {
            await this.getLoggedInUserFacebookIntegration();
            
            const ad = new Ad(adId);
            const fields = ['name'];
            const data = await ad.get(fields) as any;
            
            if (!data?.name)
                throw new Error('Could not retrieve ad name');
                
            return data.name;
        } catch (error) {
            console.error(`Failed to fetch ad name for ${adId}:`, error);
            return `Unknown Ad (${adId})`;
        }
    }

    private async cacheObject(objectType: string, objectId: string, name: string, parentId?: string): Promise<void> {
        const adminClient = await createSupabaseAdminClient();

        const { error } = await adminClient
            .from('fb_name_cache')
            .upsert({
                object_type: objectType,
                object_id: objectId,
                name: name,
                parent_id: parentId || null
            }, { onConflict: 'object_type,object_id' });

        if (error) {
            throw new Error('Error caching Facebook object ' + objectType + ' value ' + objectId + ' and parent id ' + parentId + ': ' + JSON.stringify(error));
        }
        
        // Also update the nameCache array if the object was successfully saved
        this.nameCache.push({
            object_type: objectType,
            object_id: objectId,
            name: name,
            parent_id: parentId || null
        });
    }
}