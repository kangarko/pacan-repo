import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody, verifyAdminOrMarketerUser } from '@repo/ui/lib/serverUtils';
import { delay, fetchJsonGet } from '@repo/ui/lib/utils';
import { AdAccount, FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { createSupabaseServerClient } from '@repo/ui/lib/serverUtils';
import { FacebookInsight } from '@repo/ui/lib/types';
import Cursor from 'facebook-nodejs-business-sdk/src/cursor';

export const POST = createPostHandler(async (body) => {
    await verifyAdminOrMarketerUser();

    const { start_date, end_date, check_only = false } = body;
    validateRequestBody(body, ['start_date', 'end_date']);

    const adminClient = await createSupabaseAdminClient();

    // Always delete today's cache to ensure it's always fresh
    const todayForDelete = new Date();
    const todayYear = todayForDelete.getFullYear();
    const todayMonth = todayForDelete.getMonth() + 1;
    const todayDay = todayForDelete.getDate();

    console.log(`Clearing cache for today (${todayYear}-${todayMonth}-${todayDay}) if it exists.`);
    const { error: deleteError } = await adminClient
        .from('cache')
        .delete()
        .eq('year', todayYear)
        .eq('month', todayMonth)
        .eq('day', todayDay);

    if (deleteError) {
        // Log the error but don't block the process
        console.error("Error deleting today's cache:", deleteError.message);
    }

    // For cache iteration, we need to work with local dates
    const startDateLocal = new Date(start_date + 'T00:00:00');
    const endDateLocal = new Date(end_date + 'T23:59:59.999');

    // Calculate total days
    const datesToCheck: string[] = [];
    for (let currentDate = new Date(startDateLocal); currentDate <= endDateLocal; currentDate.setDate(currentDate.getDate() + 1)) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        datesToCheck.push(dateKey);
    }

    // Check existing cache
    const { data: existingCache, error: fetchError } = await adminClient
        .from('cache')
        .select('year, month, day')
        .gte('year', startDateLocal.getFullYear())
        .lte('year', endDateLocal.getFullYear());

    if (fetchError)
        throw new Error('Error checking cache: ' + fetchError.message);

    const existingDates = new Set(
        existingCache.map(row => 
            `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`
        )
    );

    // Don't cache today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const datesToCache = datesToCheck.filter(dateKey => 
        !existingDates.has(dateKey) && dateKey !== todayKey
    );

    console.log(`Total days: ${datesToCheck.length}, Already cached: ${existingDates.size}, Need to cache: ${datesToCache.length}`);

    // If only checking, return the status
    if (check_only) {
        return createSuccessResponse({
            total_days: datesToCheck.length,
            cached_days: datesToCheck.length - datesToCache.length,
            missing_days: datesToCache.length,
            missing_dates: datesToCache,
            cache_complete: datesToCache.length === 0
        });
    }

    // If no dates to cache, return success
    if (datesToCache.length === 0) {
        return createSuccessResponse({
            message: 'Cache already complete',
            total_days: datesToCheck.length,
            cached_days: datesToCheck.length,
            newly_cached_days: 0
        });
    }

    // Get Facebook integration for fetching data
    const fbIntegration = await getLoggedInUserFacebookIntegration();
    const accountCurrency = await getAccountCurrency(fbIntegration.account);

    // Cache the missing dates
    let cachedCount = 0;
    const errors: string[] = [];

    for (const dateKey of datesToCache) {
        try {
            console.log(`Caching data for ${dateKey}...`);
            
            const [year, month, day] = dateKey.split('-').map(Number);
            const cacheRow = {
                year,
                month,
                day,
                currencies: { base_currency: '', rates: {} as Record<string, number> },
                facebook: { 
                    account_currency: accountCurrency, 
                    campaigns: [] as FacebookInsight[], 
                    adsets: [] as FacebookInsight[], 
                    ads: [] as FacebookInsight[] 
                }
            };

            // Fetch currency rates
            try {
                if (!process.env.EXCHANGE_RATE_API_KEY)
                    throw new Error('Exchange rate API key is not set');

                const currencyData = await fetchJsonGet(
                    `https://openexchangerates.org/api/historical/${dateKey}.json?app_id=${process.env.EXCHANGE_RATE_API_KEY}&base=USD`
                );

                if (!currencyData.rates)
                    throw new Error(`No currency rates returned for ${dateKey}`);

                cacheRow.currencies = { base_currency: 'USD', rates: currencyData.rates };
            } catch (error: any) {
                throw new Error(`Currency fetch failed for ${dateKey}: ${error.message}`);
            }

            // Fetch Facebook data
            try {
                const [campaignInsights, adsetInsights, adInsights] = await Promise.all([
                    getFacebookInsights(fbIntegration.account, 'campaign', dateKey),
                    delay(100).then(() => getFacebookInsights(fbIntegration.account, 'adset', dateKey)),
                    delay(200).then(() => getFacebookInsights(fbIntegration.account, 'ad', dateKey))
                ]);

                cacheRow.facebook.campaigns = processInsights(campaignInsights);
                cacheRow.facebook.adsets = processInsights(adsetInsights);
                cacheRow.facebook.ads = processInsights(adInsights);

            } catch (error: any) {
                throw new Error(`Facebook fetch failed for ${dateKey}: ${error.message}`);
            }

            // Save to database
            const { error: insertError } = await adminClient
                .from('cache')
                .upsert(cacheRow, { onConflict: 'year, month, day' });
                
            if (insertError)
                throw new Error(`Database insert failed for ${dateKey}: ${insertError.message}`);

            cachedCount++;
            console.log(`Successfully cached ${dateKey} (${cachedCount}/${datesToCache.length})`);

            // Add delay to avoid rate limits
            if (cachedCount < datesToCache.length)
                await delay(500);

        } catch (error: any) {
            const errorMsg = `Failed to cache ${dateKey}: ${error.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            
            // Continue with other dates even if one fails
        }
    }

    return createSuccessResponse({
        message: errors.length > 0 ? 'Cache warming completed with errors' : 'Cache warming completed successfully',
        total_days: datesToCheck.length,
        cached_days: datesToCheck.length - datesToCache.length + cachedCount,
        newly_cached_days: cachedCount,
        failed_days: datesToCache.length - cachedCount,
        errors: errors.length > 0 ? errors : undefined
    });
});

// Helper functions (simplified versions from main route)
async function getLoggedInUserFacebookIntegration(): Promise<{ account: AdAccount; accessToken: string }> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in.');

    const fbIntegration = user?.user_metadata?.facebook_integration;
    if (!fbIntegration?.connected || !fbIntegration.user_access_token)
        throw new Error('Facebook account is not connected.');

    const accountId = fbIntegration.adAccount?.id;
    if (!accountId) throw new Error('Facebook ad account ID is missing.');

    FacebookAdsApi.init(fbIntegration.user_access_token);
    return { account: new AdAccount(accountId), accessToken: fbIntegration.user_access_token };
}

async function getAccountCurrency(account: AdAccount): Promise<string> {
    try {
        const accountData = await account.get(['currency']) as any;
        if (!accountData?.currency) 
            throw new Error('Could not retrieve account currency');
        return accountData.currency;
    } catch (error) {
        throw new Error(`Error fetching account currency: ${error}`);
    }
}

async function getFacebookInsights(account: AdAccount, level: 'campaign' | 'adset' | 'ad', dateStr: string): Promise<any[]> {
    try {
        const cursor = await account.getInsights(
            ['impressions', 'clicks', 'cpc', 'reach', 'frequency', 'unique_outbound_clicks', 'spend', 'date_start', 'campaign_id', 'adset_id', 'ad_id'],
            {
                level,
                time_range: { since: dateStr, until: dateStr },
                time_increment: 1,
                limit: 1000,
            }
        );

        const results: any[] = [];
        let cur: Cursor | null = cursor;

        while (cur) {
            results.push(...cur);
            if (cur.hasNext?.()) {
                await delay(300);
                cur = await cur.next();
            } else {
                cur = null;
            }
        }
        
        return results;
    } catch (error) {
        throw new Error(`Error fetching ${level} insights for ${dateStr}: ${error}`);
    }
}

function processInsights(insights: any[]): FacebookInsight[] {
    return insights.map(insight => {
        const data = insight._data;
        return {
            campaign_id: data.campaign_id,
            adset_id: data.adset_id,
            ad_id: data.ad_id,
            impressions: data.impressions ? parseFloat(data.impressions) : 0,
            unique_outbound_clicks: data.unique_outbound_clicks && data.unique_outbound_clicks.length > 0 && data.unique_outbound_clicks[0].value
                ? parseFloat(data.unique_outbound_clicks[0].value)
                : 0,
            reach: data.reach ? parseFloat(data.reach) : 0,
            spend: data.spend ? parseFloat(data.spend) : 0,
        };
    });
} 