import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { name, email, region, amount, currency, primary_offer_slug, secondary_offer_slug, order_id, payer_id, user_id } = body;

    validateRequestBody(body, ['name', 'email', 'region', 'amount', 'currency', 'primary_offer_slug', 'secondary_offer_slug', 'order_id', 'payer_id', 'user_id']);

    const adminClient = await createSupabaseAdminClient();

    const { data: existingPaypalPurchase, error: paypalPurchaseError } = await adminClient
        .from('paypal_purchases')
        .select('id')
        .eq('order_id', order_id)
        .maybeSingle();

    if (paypalPurchaseError)
        throw paypalPurchaseError;

    if (existingPaypalPurchase)
        throw new Error(`[server/paypal/save-pending-payment] PayPal order id ${order_id} already exists in paypal database for ${email}`);

    const storeData = {
        user_id: user_id,
        name,
        email,
        region,
        amount,
        currency,
        primary_offer_slug,
        secondary_offer_slug,
        order_id,
        payer_id
    };

    console.log('[server/paypal/save-pending-payment] Storing pending paypal data for ' + email + ': ', storeData);

    const { error: insertError } = await adminClient
        .from('paypal_purchases')
        .insert(storeData);

    if (insertError)
        throw insertError;

    return createSuccessResponse({});
});