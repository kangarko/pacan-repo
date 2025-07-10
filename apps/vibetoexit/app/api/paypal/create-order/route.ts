import { getBaseUrl, getPricing } from '@repo/ui/lib/utils';
import { Offer } from '@repo/ui/lib/types';
import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, paypalApiRequest, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { email, region, primary_offer_slug, secondary_offer_slug } = body;

    validateRequestBody(body, ['email', 'region', 'primary_offer_slug']);

    const adminClient = await createSupabaseAdminClient();
    const { data: offers, error: offersError } = await adminClient.from('offers').select('*');

    if (offersError)
        throw new Error("Error fetching offers: " + offersError.message);

    const primaryOffer = offers.find((offer: Offer) => offer.slug === primary_offer_slug);
    const secondaryOffer = secondary_offer_slug ? offers.find((offer: Offer) => offer.slug === secondary_offer_slug) : undefined;

    if (!primaryOffer)
        throw new Error(`Failed to find primary offer: ${primary_offer_slug}`);

    if (secondary_offer_slug && !secondaryOffer)
        throw new Error(`Failed to find secondary offer: ${secondary_offer_slug}`);

    const primaryOfferPricing = getPricing(primaryOffer, region);
    const secondaryOfferPricing = secondaryOffer ? getPricing(secondaryOffer, region) : undefined;

    if (secondaryOfferPricing && primaryOfferPricing.currency !== secondaryOfferPricing.currency)
        throw new Error(`Currency mismatch between primary and secondary offer! Primary: ${primaryOfferPricing.currency} != Secondary: ${secondaryOfferPricing.currency}`);

    const paypalOrder = await createPayPalOrder(email,primaryOffer, primaryOfferPricing.discounted_price_eur, secondaryOffer, secondaryOfferPricing?.discounted_price_eur);

    if (paypalOrder.error)
        throw new Error('PayPal order creation failed with error: ' + paypalOrder.error);

    if (!paypalOrder.id)
        throw new Error('No order ID returned from PayPal');

    return createSuccessResponse({
        orderID: paypalOrder.id,
        status: paypalOrder.status
    });
});


async function createPayPalOrder(email: string, primaryOffer: Offer, primaryOfferPrice: number, secondaryOffer: Offer | undefined, secondaryOfferPrice: number | undefined) {
    const siteUrl = getBaseUrl();
    const description = primaryOffer.name + (secondaryOffer ? ' + ' + secondaryOffer.name : '');
    const totalAmount = primaryOfferPrice + (secondaryOfferPrice || 0);

    const paypalOrder = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: 'EUR',
                    value: totalAmount.toFixed(2)
                },
                description: description,
                custom_id: `${primaryOffer.slug}|${primaryOfferPrice}|${secondaryOffer?.slug || ''}|${secondaryOfferPrice || ''}`
            }
        ],
        application_context: {
            brand_name: "Kristina Mitrovic",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${siteUrl}`,
            cancel_url: `${siteUrl}`
        }
    };

    const responseData = await paypalApiRequest(`/v2/checkout/orders`, 'POST', paypalOrder);

    if (!responseData.id)
        throw new Error('PayPal API did not return an order ID');

    console.log('Created PayPal order for ' + email + ' with id ' + responseData.id);

    return responseData;
}