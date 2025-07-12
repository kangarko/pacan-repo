import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, createSupabaseServerClient, getPurchasesByEmail, sendServerErrorEmail } from '@repo/ui/lib/serverUtils';
import { Offer, OfferWithOwnership, Tracking } from '@repo/ui/lib/types';
import { cookies } from 'next/headers';
import { getClientIp } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body, request) => {
    const shouldFetchTransactions = body.fetchTransactions === true;

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient();
    const adminClient = await createSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: offers, error: offersError } = await adminClient.from('offers').select('*');

    if (offersError)
        throw new Error("Error fetching offers: " + offersError.message);

    const responseData: Record<string, any> = {
        region: request.headers.get('x-user-region') || cookieStore.get('region')?.value || undefined
    };

    // if region is not a two letter code, null it
    if (responseData.region && responseData.region.length !== 2)
        responseData.region = undefined;

    let transactions = [] as Tracking[];

    if (user) {
        responseData.isAuthenticated = true;
        responseData.isAdmin = user.user_metadata?.role === 'admin';

        responseData.email = user.email;
        responseData.name = user.user_metadata?.name || '';
        responseData.region = user.user_metadata?.region || '';

        if (user.email)
            transactions = await getPurchasesByEmail(user.email);
    }

    if (shouldFetchTransactions)
        responseData.transactions = transactions;

    let ip = await getClientIp(request);
    const FAIL_REGION = 'HR';

    if (process.env.NODE_ENV === 'development') {
        responseData.region = FAIL_REGION;
        //ip = '295.168.105.36'; // HU > '217.197.178.133'; // HR > '95.168.105.36'; // BA '31.223.155.211'; // ME > '62.113.31.78';

    } else {
        if (!responseData.region) {
            try {
                const response = await fetch(`http://ip-api.com/json/${ip}`);

                if (response.ok) {
                    const data = await response.json();

                    if (data.status === 'success' && data.countryCode)
                        responseData.region = data.countryCode;

                    else
                        throw new Error(`ip-api.com error for IP ${ip}: ${JSON.stringify(data)}`);

                } else
                    throw new Error(`ip-api.com service returned ${response.status}`);

            } catch (error) {
                console.error(`ip-api.com service error (app continues to fallback): ${error instanceof Error ? error.message : String(error)}`);
            }

            if (!responseData.region)
                try {
                    const response = await fetch(`https://ipapi.co/${ip}/json/`);

                    if (response.ok) {
                        const data = await response.json();

                        if (!data.error && data.country_code)
                            responseData.region = data.country_code;
                        else
                            throw new Error(`ipapi.co error for IP ${ip}: ${JSON.stringify(data)}`);

                    } else
                        throw new Error(`ipapi.co service returned ${response.status}`);

                } catch (error) {
                    sendServerErrorEmail(body, request, `ipapi.co service error: ${error instanceof Error ? error.message : String(error)}`);
                }
        }

        if (!responseData.region) {
            sendServerErrorEmail(body, request, `All geolocation services failed, using default region ${FAIL_REGION} for IP ${ip}`);

            responseData.region = FAIL_REGION;
        }
    }

    responseData.offers = offers.map((offer: Offer) => ({ ...offer, is_owned: false }));

    if (responseData.isAuthenticated && user) {
        const offersWithOwnership: OfferWithOwnership[] = [];

        for (const offer of responseData.offers) {
            const isOwned = transactions.some(transaction => (transaction.metadata.primary_offer_slug === offer.slug || transaction.metadata.secondary_offer_slug === offer.slug) && transaction.metadata.payment_status === 'succeeded') || false;

            offersWithOwnership.push({ ...offer, is_owned: isOwned });
        }

        responseData.offers = offersWithOwnership;
    }

    return createSuccessResponse(responseData);
});