import Stripe from 'stripe';
import { createSupabaseServerClient, createPostHandler, createSuccessResponse, validateRequestBody, createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';
import { cookies } from 'next/headers';
import { getPricing } from '@repo/ui/lib/utils';
import { Offer } from '@repo/ui/lib/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = createPostHandler(async (body) => {
    const { name, email, region, primary_offer_slug, secondary_offer_slug } = body;
    validateRequestBody(body, ['name', 'email', 'region', 'primary_offer_slug']);

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId)
        throw new Error('Missing user id from cookies for Stripe payment intent: ' + JSON.stringify(body));

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminClient = await createSupabaseAdminClient();
    const { data: offers, error: offersError } = await adminClient.from('offers').select('*');

    if (offersError)
        throw new Error("Error fetching offers: " + offersError.message);

    const primaryOffer = offers.find((offer: Offer) => offer.slug === primary_offer_slug);
    const secondaryOffer = secondary_offer_slug ? offers.find((offer: Offer) => offer.slug === secondary_offer_slug) : null;

    if (!primaryOffer)
        throw new Error(`Failed to find primary offer: ${primary_offer_slug}`);

    if (secondary_offer_slug && !secondaryOffer)
        throw new Error(`Failed to find secondary offer: ${secondary_offer_slug}`);

    const primaryOfferPricing = getPricing(primaryOffer, region);
    const secondaryOfferPricing = secondaryOffer ? getPricing(secondaryOffer, region) : null;

    if (secondaryOfferPricing && primaryOfferPricing.currency !== secondaryOfferPricing.currency)
        throw new Error(`Currency mismatch between primary and secondary offer! Primary: ${primaryOfferPricing.currency} != Secondary: ${secondaryOfferPricing.currency}`);

    let customer = null;

    if (user?.user_metadata?.stripe_customer_id) {
        try {
            customer = await stripe.customers.retrieve(user?.user_metadata?.stripe_customer_id);
        } catch (error) {
            if (error instanceof Error && error.message.includes('No such customer'))
                customer = null;
            else
                throw error;
        }

        if (customer && typeof customer !== 'string' && !customer.deleted && (customer.name !== name || customer.email !== email)) {
            console.log(`Updating customer ${customer.id} with name ${name} and email ${email}`);

            customer = await stripe.customers.update(customer.id, {
                ...(customer.name !== name && { name }),
                ...(customer.email !== email && { email }),
            });
        }
    }

    if (!customer) {
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });

        if (existingCustomers.data.length > 0) 
            customer = await stripe.customers.update(existingCustomers.data[0].id, {
                name: name,
                metadata: {
                    region: region,
                },
            });

        else
            customer = await stripe.customers.create({
                name: name,
                email: email,
                metadata: {
                    region: region,
                },
            });
    }

    if (user && user.id)
        await supabase.auth.updateUser({
            data: {
                stripe_customer_id: customer.id
            }
        });

    const description = primaryOffer.name + (secondaryOffer ? ' + ' + secondaryOffer.name : '');
    const data: Stripe.PaymentIntentCreateParams = {
        amount: Math.round((primaryOfferPricing.discounted_price + (secondaryOfferPricing?.discounted_price || 0)) * 100),
        currency: primaryOfferPricing.currency.toLowerCase(),
        customer: customer.id,
        description: description,
        statement_descriptor_suffix: "KRISTINA MITROVIC",
        setup_future_usage: 'off_session',
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: {
            offer_name: description, // for legacy compatibility
            name: name,
            email: email,
            region: region,
            user_id: userId,
            primary_offer_slug: primary_offer_slug,
            primary_offer_price: primaryOfferPricing.discounted_price,
            secondary_offer_slug: secondary_offer_slug,
            secondary_offer_price: secondaryOfferPricing?.discounted_price || null,
        },
    };

    const paymentIntent = await stripe.paymentIntents.create(data);

    return createSuccessResponse({
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id
    });
});