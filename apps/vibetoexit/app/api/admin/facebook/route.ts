import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, createSupabaseServerClient, sendServerErrorEmail, validateRequestBody, verifyAdminOrMarketerUser } from '@repo/ui/lib/serverUtils';
import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import { fetchJsonGet, fetchWithRetry } from '@repo/ui/lib/utils';

interface AdObject {
    id: string;
    name: string;
}

interface AdSetObject {
    id: string;
    name: string;
    ads: AdObject[];
}

interface CampaignObject {
    id: string;
    name: string;
    adSets: AdSetObject[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const POST = createPostHandler(async (body, request) => {
    await verifyAdminOrMarketerUser();

    const { action } = body;
    validateRequestBody(body, ['action']);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('Not authenticated');

    const fbAdmin = new FacebookAdmin(user, request);

    console.log("Called /facebook route with action: " + action);

    switch (action) {
        case 'get_ad_accounts':
            return await fbAdmin.getAdAccounts();

        case 'save_ad_account':
            validateRequestBody(body, ['ad_account', 'ad_account.id', 'ad_account.name']);
            return await fbAdmin.saveAdAccount(body.ad_account);

        case 'save_page':
            validateRequestBody(body, ['page_id', 'page_name']);
            return await fbAdmin.savePage(body.page_id, body.page_name);

        case 'disconnect':
            return await fbAdmin.disconnect();

        case 'get_fb_data':
            validateRequestBody(body, ['ad_account_id']);
            return await fbAdmin.getFbData(body.ad_account_id);

        case 'get_cache':
            return await fbAdmin.getCache();

        case 'get_threads':
            return await fbAdmin.getThreads();

        case 'get_thread':
            validateRequestBody(body, ['conversation_id']);
            return await fbAdmin.getThread(body.conversation_id);

        case 'send_reply':
            validateRequestBody(body, ['recipient_psid', 'reply_body']);
            return await fbAdmin.sendReply(body.recipient_psid, body.reply_body);

        default:
            throw new Error(`Unknown action: ${action}`);
    }
});

class FacebookAdmin {
    private user: any;
    private facebookIntegration: any;
    private adminClient: any;
    private request: Request;

    constructor(user: any, request: Request) {
        this.user = user;
        this.request = request;
        this.facebookIntegration = user.user_metadata?.facebook_integration;

        if (!this.facebookIntegration)
            throw new Error('Facebook account not connected');
    }

    async initAdminClient() {
        if (!this.adminClient)
            this.adminClient = await createSupabaseAdminClient();

        return this.adminClient;
    }

    async getAdAccounts() {
        if (!this.facebookIntegration.user_access_token)
            throw new Error('Facebook access token not found');

        const data = await fetchJsonGet(`https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status&access_token=${this.facebookIntegration.user_access_token}`);

        const adAccounts = data.data.map((account: any) => ({
            id: account.id,
            name: account.name,
            status: this.formatAccountStatus(account.account_status)
        }));

        return createSuccessResponse({
            data: adAccounts
        });
    }

    formatAccountStatus(status: number): string {
        switch (status) {
            case 1:
                return 'active';
            case 2:
                return 'disabled';
            case 3:
                return 'unsettled';
            case 7:
                return 'pending_risk_review';
            case 8:
                return 'pending_settlement';
            case 9:
                return 'in_grace_period';
            case 100:
                return 'pending_closure';
            case 101:
                return 'closed';
            case 201:
                return 'any_active';
            case 202:
                return 'any_closed';
            default:
                return 'unknown';
        }
    }

    async saveAdAccount(adAccount: any) {
        if (!this.facebookIntegration.user_access_token)
            throw new Error('Facebook not connected or missing access token');

        const accessToken = this.facebookIntegration.user_access_token;
        const adminClient = await this.initAdminClient();

        FacebookAdsApi.init(accessToken);

        let promotablePages: { id: string, name: string }[] = [];

        const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`;
        const pagesResponse = await fetch(pagesUrl);
        const pagesData = await pagesResponse.json();

        if (pagesData.data && pagesData.data.length > 0)
            promotablePages = pagesData.data.map((page: any) => ({ id: page.id, name: page.name }));

        // Update metadata with ONLY the selected Ad Account
        const updatedFacebookIntegration = {
            ...this.facebookIntegration,
            adAccount: adAccount,
            updatedAt: new Date().toISOString()
        };

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            this.user.id,
            {
                user_metadata: {
                    ...this.user.user_metadata,
                    facebook_integration: updatedFacebookIntegration
                }
            }
        );

        if (updateError)
            throw updateError;

        return createSuccessResponse({
            promotablePages: promotablePages
        });
    }

    async savePage(pageId: string, pageName: string) {
        if (!this.facebookIntegration.user_access_token) {
            throw new Error('Facebook integration or user access token not found in user metadata.');
        }

        const adminClient = await this.initAdminClient();
        const userAccessToken = this.facebookIntegration.user_access_token;

        // Fetch the Page Access Token using the User Access Token
        let pageAccessToken: string | null = null;
        try {
            const accountsData = await fetchJsonGet(`https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);

            const targetPage = accountsData?.data?.find((page: any) => page.id === pageId);
            if (targetPage && targetPage.access_token) {
                pageAccessToken = targetPage.access_token;
            } else {
                throw new Error(`Page with ID ${pageId} not found or access token missing in /me/accounts response.`);
            }
        } catch (apiError: any) {
            sendServerErrorEmail(this.request, null, 'Error fetching Page Access Token from /me/accounts', apiError);
            throw new Error(`Failed to get Page Access Token: ${apiError.message}. You might need to re-authenticate Facebook.`);
        }

        const updatedFacebookIntegration = {
            ...this.facebookIntegration,
            pageId: pageId,
            pageName: pageName,
            page_access_token: pageAccessToken,
            updatedAt: new Date().toISOString()
        };

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            this.user.id,
            {
                user_metadata: {
                    ...this.user.user_metadata,
                    facebook_integration: updatedFacebookIntegration
                }
            }
        );

        if (updateError)
            throw updateError;

        return createSuccessResponse({
            data: updatedFacebookIntegration
        });
    }

    async disconnect() {
        const updatedMetadata = { ...this.user.user_metadata };
        updatedMetadata.facebook_integration = null;

        const adminClient = await this.initAdminClient();

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            this.user.id,
            { user_metadata: updatedMetadata }
        );

        if (updateError)
            throw updateError;

        return createSuccessResponse({});
    }

    async getFbData(adAccountId: string) {
        if (!this.facebookIntegration.user_access_token)
            throw new Error('Facebook access token not found');

        const accessToken = this.facebookIntegration.user_access_token;

        // Initialize the Facebook Ads API
        FacebookAdsApi.init(accessToken);
        const account = new AdAccount(adAccountId);

        // Create admin client for caching
        const adminClient = await this.initAdminClient();

        // Fetch campaigns with pagination and throttling
        console.log('Fetching Facebook campaigns');
        const campaigns = await account.getCampaigns(['id', 'name'], { limit: 1000 });
        const result: CampaignObject[] = [];

        // Get a list of already cached campaign IDs
        const { data: cachedCampaigns, error: cachedCampaignsError } = await adminClient
            .from('fb_name_cache')
            .select('object_id')
            .eq('object_type', 'campaign');

        if (cachedCampaignsError)
            throw cachedCampaignsError;

        // Create a set of cached campaign IDs for quick lookup
        const cachedCampaignIds = new Set(
            (cachedCampaigns || []).map((camp: { object_id: string }) => camp.object_id)
        );

        console.log(`Found ${cachedCampaignIds.size} campaigns already cached`);

        // Process campaigns in batches, but skip ones that are already cached
        const newCampaigns = campaigns.filter(campaign => !cachedCampaignIds.has(campaign.id));
        const alreadyCachedCount = campaigns.length - newCampaigns.length;

        console.log(`Processing ${newCampaigns.length} new campaigns, ${alreadyCachedCount} already cached`);

        // Add all campaigns to the result (cached + new)
        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];

            const campaignData: CampaignObject = {
                id: campaign.id,
                name: campaign.name,
                adSets: [],
            };

            // Cache campaign data if it's not already cached
            if (!cachedCampaignIds.has(campaign.id)) {
                console.log(`Caching new campaign ${i + 1}/${newCampaigns.length}: ${campaign.id}`);
                await this.cacheObject('campaign', campaign.id, campaign.name);
            }

            // Add campaign to result
            result.push(campaignData);
        }

        // Process all campaigns with their ad sets and ads
        console.log('Processing all campaigns with their ad sets and ads');

        for (let i = 0; i < newCampaigns.length; i++) {
            const campaign = newCampaigns[i];
            await this.processCampaignAdSets(campaign);

            // Brief delay between processing campaigns to avoid rate limits
            if (i < newCampaigns.length - 1)
                await delay(1000);
        }

        console.log(`Processed all ${newCampaigns.length} campaigns with ${alreadyCachedCount} already cached`);

        return createSuccessResponse({
            data: result,
            processedAdSets: newCampaigns.length > 0,
            cachedCampaigns: alreadyCachedCount
        });
    }

    async getCache() {
        const adminClient = await this.initAdminClient();

        const { data, error: dbError } = await adminClient
            .from('fb_name_cache')
            .select('*')
            .order('object_type', { ascending: true })
            .order('name', { ascending: true });

        if (dbError)
            throw dbError;

        return createSuccessResponse({
            data: data || []
        });
    }

    async getThread(conversationId: string) {
        if (!this.facebookIntegration.pageId || !this.facebookIntegration.page_access_token)
            throw new Error('Facebook integration incomplete: Page ID: ' + this.facebookIntegration.pageId + ' Page Access Token: ' + this.facebookIntegration.page_access_token);

        const pageAccessToken = this.facebookIntegration.page_access_token;
        const graphApiVersion = 'v20.0';

        const fields = [
            'id',
            'created_time',
            'from',
            'to',
            'message'
        ].join(',');

        const initialUrl = `https://graph.facebook.com/${graphApiVersion}/${conversationId}/messages?fields=${fields}&limit=100`;

        const rawMessagesData = await FacebookAdmin.fetchAllPages(initialUrl, pageAccessToken);

        const messagesToTranslate = rawMessagesData.filter(msg => msg.message && msg.message.trim().length > 0);

        // Check cache for existing translations
        const adminClient = await this.initAdminClient();

        // Get message IDs for all messages that need translation
        const messageIds = messagesToTranslate.map(msg => msg.id);

        // Check which translations already exist in cache
        const { data: cachedTranslations, error: cacheError } = await adminClient
            .from('translate_cache')
            .select('message_id, translation')
            .in('message_id', messageIds);

        if (cacheError) {
            sendServerErrorEmail(this.request, null, "Error fetching cached translations:", cacheError);
        }

        // Create a map of message ID to cached translation
        const translationCache = new Map();
        if (cachedTranslations) {
            cachedTranslations.forEach((item: { message_id: string, translation: string }) => {
                translationCache.set(item.message_id, item.translation);
            });
        }

        console.log(`Found ${translationCache.size} cached translations out of ${messageIds.length} messages`);

        // Filter to only messages that need translation (not in cache)
        const messagesToTranslateAI = messagesToTranslate.filter(msg => !translationCache.has(msg.id));

        // Create final results with translations (either from cache or new)
        const translationResults = new Map();

        // Add cached translations to results map
        cachedTranslations?.forEach((item: { message_id: string, translation: string }) => {
            translationResults.set(item.message_id, item.translation);
        });

        // Only call AI translation if there are messages that need it
        if (messagesToTranslateAI.length > 0) {
            const separator = "---MESSAGE-SEPARATOR---";
            const originalTexts: string[] = messagesToTranslateAI.map(msg => msg.message);

            // Special handling for single message translation to avoid separator confusion
            if (originalTexts.length === 1) {
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
                            max_tokens: originalTexts[0].length + 200,
                            temperature: 0.2,
                            system: "Translate the following text into English. If it's already in English, return it unchanged.",
                            messages: [
                                { role: 'user', content: originalTexts[0] }
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

                    if (translation && translation !== originalTexts[0]) {
                        await adminClient
                            .from('translate_cache')
                            .upsert({
                                message_id: messageId,
                                translation: translation
                            });
                    }
                } catch (aiError) {
                    sendServerErrorEmail(this.request, null, "Single message translation failed:", aiError);
                    translationResults.set(messagesToTranslateAI[0].id, originalTexts[0]);
                }
            } else {
                // Multiple messages - use batch processing with separators
                const batchText = originalTexts.join(separator);

                if (batchText) {
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
                                `Batch translation mismatch: Expected ${originalTexts.length}, got ${filteredTranslations.length}. Content: ${batchTranslationResult}`
                            );

                            // If mismatch, use original texts for those that need translation
                            messagesToTranslateAI.forEach(msg => {
                                translationResults.set(msg.id, msg.message);
                            });
                        } else {
                            // Store new translations in cache
                            for (let i = 0; i < messagesToTranslateAI.length; i++) {
                                const messageId = messagesToTranslateAI[i].id;
                                const translation = filteredTranslations[i].trim();

                                if (translation && translation !== originalTexts[i]) {
                                    // Add to results map
                                    translationResults.set(messageId, translation);

                                    // Store in cache
                                    await adminClient
                                        .from('translate_cache')
                                        .upsert({
                                            message_id: messageId,
                                            translation: translation
                                        });
                                } else {
                                    // Use original if translation is same or empty
                                    translationResults.set(messageId, messagesToTranslateAI[i].message);
                                }
                            }
                        }
                    } catch (aiError) {
                        sendServerErrorEmail(this.request, null, "Batch translation AI call failed:", aiError);
                        // Use original texts on error
                        messagesToTranslateAI.forEach(msg => {
                            translationResults.set(msg.id, msg.message);
                        });
                    }
                }
            }
        }

        // Create the final conversation by using translations from our results map
        const conversationWithTranslations = rawMessagesData.map((msg: any) => {
            const isTranslatable = msg.message && msg.message.trim().length > 0;
            let translatedText = msg.message;

            if (isTranslatable && translationResults.has(msg.id)) {
                translatedText = translationResults.get(msg.id);
            }

            return {
                id: msg.id,
                created_time: msg.created_time,
                from: { name: msg.from?.name, id: msg.from?.id },
                to: msg.to,
                message: msg.message,
                translated_text: translatedText
            };
        });

        return createSuccessResponse({ conversation: conversationWithTranslations.reverse() });
    }

    async getThreads() {
        if (!this.facebookIntegration.pageId)
            throw new Error('Facebook Page ID not set');

        if (!this.facebookIntegration.user_access_token)
            throw new Error('Facebook Page Access Token not set');

        const userAccessToken = this.facebookIntegration.user_access_token;
        const targetPageId = this.facebookIntegration.pageId;
        const graphApiVersion = 'v20.0';

        let pageAccessToken: string | null = null;

        try {
            const accountsUrl = `https://graph.facebook.com/${graphApiVersion}/me/accounts?fields=id,name,access_token`;
            const pagesResponse = await fetchWithRetry(accountsUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${userAccessToken}` },
            });
            const pagesData = await pagesResponse.json();

            if (pagesData.error)
                throw new Error(`Failed to fetch pages/accounts: ${pagesData.error.message}`);

            const targetPage = pagesData.data?.find((page: any) => page.id === targetPageId);

            if (!targetPage || !targetPage.access_token) {
                throw new Error(`Could not find matching page or Page Access Token for Page ID ${targetPageId}. Please re-authenticate or check permissions.`);
            }

            pageAccessToken = targetPage.access_token;

        } catch (error: any) {
            throw new Error(`Failed to get Page Access Token: ${error.message}`);
        }

        const fields = [
            'id',
            'participants',
            'updated_time',
            'snippet',
            'unread_count',
            'can_reply',
            'platform',
            'messages.limit(1){from}'
        ].join(',');

        const initialUrl = `https://graph.facebook.com/${graphApiVersion}/${targetPageId}/conversations?platform=messenger&fields=${fields}&limit=100`;

        try {
            if (!pageAccessToken)
                throw new Error("Page Access Token was not obtained successfully.");

            const conversationsData = await FacebookAdmin.fetchAllPages(initialUrl, pageAccessToken);

            const threads = conversationsData.map((conv: any) => ({
                threadId: conv.id,
                participants: conv.participants?.data?.filter((p: any) => p.id !== targetPageId).map((p: any) => ({ name: p.name, id: p.id })) || [],
                latestMessageTimestamp: new Date(conv.updated_time).getTime(),
                snippet: conv.snippet || '(No snippet)',
                unreadCount: conv.unread_count || 0,
                canReply: conv.can_reply || false,
                platform: conv.platform || 'messenger',
                lastSenderId: conv.messages?.data[0]?.from?.id,
            })).sort((a, b) => b.latestMessageTimestamp - a.latestMessageTimestamp);

            return createSuccessResponse({ threads });

        } catch (error: any) {
            sendServerErrorEmail(this.request, null, `Error fetching Facebook threads for page ${targetPageId}`, error);
            throw new Error(`Failed to fetch Facebook threads: ${error.message}`);
        }
    }

    async sendReply(recipientPsid: string, replyBody: string) {
        if (!this.facebookIntegration.page_access_token)
            throw new Error('Page access token not found');

        const pageAccessToken = this.facebookIntegration.page_access_token;
        const pageId = this.facebookIntegration.pageId;
        const graphApiVersion = 'v20.0';

        console.log(`Sending FB message to recipient PSID: ${recipientPsid} from page ID: ${pageId}`);

        const url = `https://graph.facebook.com/${graphApiVersion}/${pageId}/messages`;

        const messageData = {
            recipient: { id: recipientPsid },
            messaging_type: 'RESPONSE', // Required for messages sent > 24 hours after last user message
            message: { text: replyBody }
        };

        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pageAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error("Response not ok: " + JSON.stringify(errorData));
        }

        const responseData = await response.json();

        if (responseData.error)
            throw new Error(`Response errored out: ` + JSON.stringify(responseData.error));

        return createSuccessResponse({ success: true, messageId: responseData.message_id });
    }

    // Process ad sets and ads for a campaign with throttling
    async processCampaignAdSets(campaign: any) {
        const adminClient = await this.initAdminClient();
        console.log(`Fetching ad sets for campaign ${campaign.id}`);

        // Check which ad sets are already cached for this campaign
        const { data: cachedAdSets, error: cachedAdSetsError } = await adminClient
            .from('fb_name_cache')
            .select('object_id')
            .eq('object_type', 'adset')
            .eq('parent_id', campaign.id);

        if (cachedAdSetsError)
            throw cachedAdSetsError;

        // Create a set of cached ad set IDs for quick lookup
        const cachedAdSetIds = new Set(
            (cachedAdSets || []).map((adset: { object_id: string }) => adset.object_id)
        );

        console.log(`Found ${cachedAdSetIds.size} ad sets already cached for campaign ${campaign.id}`);

        // Fetch ad sets with smaller batch size
        const adSets = await campaign.getAdSets(['id', 'name'], { limit: 1000 });

        // Filter to only process new ad sets
        const newAdSets = adSets.filter((adSet: { id: string }) => !cachedAdSetIds.has(adSet.id));

        console.log(`Processing ${newAdSets.length} new ad sets for campaign ${campaign.id}, ${adSets.length - newAdSets.length} already cached`);

        for (let j = 0; j < newAdSets.length; j++) {
            const adSet = newAdSets[j];

            // Cache adset data
            await this.cacheObject('adset', adSet.id, adSet.name, campaign.id);

            // Add delay every few ad sets to avoid rate limits
            if (j > 0 && j % 5 === 0) {
                await delay(1000);
            }

            // Check which ads are already cached for this ad set
            const { data: cachedAds, error: cachedAdsError } = await adminClient
                .from('fb_name_cache')
                .select('object_id')
                .eq('object_type', 'ad')
                .eq('parent_id', adSet.id);

            if (cachedAdsError)
                throw cachedAdsError;

            // Create a set of cached ad IDs for quick lookup
            const cachedAdIds = new Set(
                (cachedAds || []).map((ad: { object_id: string }) => ad.object_id)
            );

            // Fetch small batches of ads to avoid rate limits
            console.log(`Fetching ads for ad set ${adSet.id} (${j + 1}/${newAdSets.length})`);
            const ads = await adSet.getAds(['id', 'name'], { limit: 1000 });

            // Filter to only process new ads
            const newAds = ads.filter((ad: { id: string }) => !cachedAdIds.has(ad.id));

            console.log(`Processing ${newAds.length} new ads for ad set ${adSet.id}, ${ads.length - newAds.length} already cached`);

            // Process ads
            for (let k = 0; k < newAds.length; k++) {
                const ad = newAds[k];
                await this.cacheObject('ad', ad.id, ad.name, adSet.id);

                // Add delay every few ads
                if (k > 0 && k % 10 === 0) {
                    await delay(500);
                }
            }

            // Add delay between ad sets
            if (j < newAdSets.length - 1)
                await delay(1500);
        }
    }

    // Helper function to cache Facebook objects in the fb_name_cache table
    async cacheObject(objectType: string, objectId: string, name: string, parentId?: string) {
        const adminClient = await this.initAdminClient();

        const response = await adminClient
            .from('fb_name_cache')
            .upsert({
                object_type: objectType,
                object_id: objectId,
                name: name,
                parent_id: parentId || null
            }, { onConflict: 'object_type,object_id' });

        if (response.error) {
            throw new Error('Error caching Facebook object ' + objectType + ' value ' + objectId + ' and parent id ' + parentId + ': ' + JSON.stringify(response.error));
        }
    }

    // Static method to fetch all pages from an API endpoint
    static async fetchAllPages(url: string, accessToken: string): Promise<any[]> {
        let allData: any[] = [];
        let nextUrl: string | null = url;

        while (nextUrl) {
            try {
                const response = await fetchWithRetry(nextUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });

                const data = await response.json();

                if (data.error)
                    throw new Error(`Facebook API Error: ${data.error.message} (Code: ${data.error.code}, Type: ${data.error.type})`);

                allData = allData.concat(data.data || []);
                nextUrl = data.paging?.next || null;

            } catch (error) {
                nextUrl = null;

                if (!(error instanceof Error && error.message.includes('Facebook API Error')))
                    throw error;
            }
        }

        return allData;
    }
}