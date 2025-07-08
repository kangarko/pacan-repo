import Stripe from 'stripe';
import { getUserByEmail, createSupabaseAdminClient, getPurchaseByPaymentId, trackServer, createPostHandler, validateRequestBody, createSuccessResponse, sendServerErrorEmail, createErrorResponse, paypalApiRequest } from '@repo/ui/lib/serverUtils';
import { EmailTemplate, PaymentMethod, PayPalPurchase } from '@repo/ui/lib/types';
import { cookies } from 'next/headers';

export const POST = createPostHandler(async (body, request) => {
    const { payment_id } = body;

    validateRequestBody(body, ['payment_id']);

    const adminClient = await createSupabaseAdminClient();
    const cookieStore = await cookies();

    const userId = cookieStore.get('user_id')?.value;

    if (!userId)
        throw new Error('[server/verify-payment] Cookies lack user_id while verifying payment: ' + payment_id);

    const startTime = Date.now();
    let midTime = Date.now();
    console.log("Verifying payment " + payment_id + " for user " + userId);

    let date: string | undefined = undefined;
    let name: string | null = null;
    let email: string | null = null;
    let region: string | null = null;
    let value: number | null = null;
    let currency: string | null = null;
    let primaryOfferSlug: string | null = null;
    let secondaryOfferSlug: string | null = null;
    let paymentMethod: PaymentMethod | null = null;
    let correctedPaymentId: string = payment_id;
    let stripeCustomerId: string | null = null;
    let paypalEmail: string | undefined;
    let paypalName: string | undefined;
    let paypalOrderId: string | undefined;
    let refunded: boolean = false;

    //
    // Check existing purchase
    //
    const existingTransaction = await getPurchaseByPaymentId(payment_id);

    if (existingTransaction) {
        email = existingTransaction.email;
        name = existingTransaction.metadata.name!;
        region = existingTransaction.metadata.region!;
        value = existingTransaction.metadata.value!;
        currency = existingTransaction.metadata.currency!;
        primaryOfferSlug = existingTransaction.metadata.primary_offer_slug!;
        secondaryOfferSlug = existingTransaction.metadata.secondary_offer_slug || null;
        paymentMethod = existingTransaction.metadata.payment_method!;
        refunded = existingTransaction.metadata.payment_status === 'refunded';

        console.log("[took " + (Date.now() - midTime) + "ms] Found existing transaction for " + email + " and user id " + existingTransaction.user_id);
        midTime = Date.now();
    }

    // 
    // If non existing, check Stripe first, then fallback to PayPal
    //
    else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        // Expand to get details about the card used
        let paymentIntent;

        if (payment_id.startsWith('pi_')) {
            console.log("Checking Stripe payment intent: " + payment_id);

            try {
                paymentIntent = await stripe.paymentIntents.retrieve(payment_id, { expand: ['payment_method'] });

            } catch (error: any) {
                if (!error.message.includes('No such payment_intent'))
                    throw error;
            }
        }

        if (paymentIntent) {
            if (paymentIntent.status !== 'succeeded')
                throw new Error(`[server/verify-payment] Expected status: succeeded, got: ${paymentIntent.status} for payment id: ${payment_id}`);

            date = new Date(paymentIntent.created * 1000).toISOString();
            name = paymentIntent.metadata.name;
            email = paymentIntent.metadata.email;
            region = paymentIntent.metadata.region;
            value = paymentIntent.amount / 100;
            currency = paymentIntent.currency.toUpperCase();
            primaryOfferSlug = paymentIntent.metadata.primary_offer_slug;
            secondaryOfferSlug = paymentIntent.metadata.secondary_offer_slug;
            paymentMethod = paymentIntent.metadata.quick_pay ? 'quick_pay' : 'stripe';
            stripeCustomerId = paymentIntent.customer as string;

            console.log("[took " + (Date.now() - midTime) + "ms] Found Stripe payment intent: " + email + ": ", paymentIntent);
            midTime = Date.now();

        } else {
            console.log("Checking PayPal order: " + payment_id);

            const { data: pendingPayPalOrderRaw, error: paypalOrderError } = await adminClient
                .from('paypal_purchases')
                .select('*')
                .or(`order_id.eq.${payment_id},payment_id.eq.${payment_id}`)
                .maybeSingle();

            if (paypalOrderError)
                throw paypalOrderError;

            const pendingPayPalOrder = pendingPayPalOrderRaw as PayPalPurchase;

            if (!pendingPayPalOrder)
                throw new Error('[server/verify-payment] Could not find Stripe or PayPal order from payment id ' + payment_id);

            name = pendingPayPalOrder.name;
            email = pendingPayPalOrder.email;
            region = pendingPayPalOrder.region;
            primaryOfferSlug = pendingPayPalOrder.primary_offer_slug;
            secondaryOfferSlug = pendingPayPalOrder.secondary_offer_slug;
            paymentMethod = 'paypal';

            const verificationResult = await capturePayPalOrder(pendingPayPalOrder.order_id, pendingPayPalOrder.payment_id || payment_id);

            if (!verificationResult.verified) {
                if (verificationResult.declined)
                    return createErrorResponse(verificationResult.error || 'PayPal declined payment, please try again.');

                sendServerErrorEmail(body, request, `PayPal verification failed: ${JSON.stringify(verificationResult)}`);
                return createErrorResponse(verificationResult.error || 'PayPal verification failed.');
            }

            const orderDetails = verificationResult.details;

            if (orderDetails.payer) {
                console.log("Filling data from order object")

                const purchaseUnit = orderDetails.purchase_units[0].payments.captures[0];

                date = purchaseUnit.create_time.toString();
                paypalEmail = orderDetails.payer?.email_address;
                paypalName = orderDetails.payer?.name ? `${orderDetails.payer.name.given_name || ''} ${orderDetails.payer.name.surname || ''}`.trim() : undefined;
                paypalOrderId = pendingPayPalOrder.order_id;
                correctedPaymentId = purchaseUnit.id;
                value = purchaseUnit?.amount?.value ? parseFloat(purchaseUnit?.amount?.value) : -1;
                currency = purchaseUnit?.amount?.currency_code;

            } else if (orderDetails.final_capture) {
                console.log("Filling data from transaction object");

                date = orderDetails.create_time.toString();
                paypalEmail = pendingPayPalOrder.paypal_email;
                paypalName = pendingPayPalOrder.paypal_name;
                paypalOrderId = pendingPayPalOrder.order_id;
                correctedPaymentId = orderDetails.id;
                value = orderDetails?.amount?.value ? parseFloat(orderDetails?.amount?.value) : -1;
                currency = orderDetails?.amount?.currency_code;
            }

            if (!value || isNaN(value) || value <= 0)
                throw new Error('[server/verify-payment] Invalid PayPal payment ' + correctedPaymentId + ' with amount: ' + value);

            console.log('Paired paypal order id ' + pendingPayPalOrder.order_id + ' to payment id ' + correctedPaymentId);

            const { error: updateError } = await adminClient.from('paypal_purchases').update({
                paypal_name: paypalName,
                paypal_email: paypalEmail,
                payment_id: correctedPaymentId
            }).eq('order_id', pendingPayPalOrder.order_id);

            if (updateError)
                throw updateError;
        }
    }

    if (!name || !email || !region || !value || !currency || !primaryOfferSlug || !paymentMethod)
        throw new Error('[server/verify-payment] Transaction ' + correctedPaymentId + ' missing required parameters: ' + JSON.stringify({ name, email, region, value, currency, primaryOfferSlug, paymentMethod }));

    //
    // Now check the user
    //
    let hasAccount = false;
    const user = await getUserByEmail(email);

    if (user && user.id) {
        hasAccount = true;

        if (stripeCustomerId) {
            await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...user.user_metadata,
                    stripe_customer_id: stripeCustomerId
                }
            });
        }
    }

    console.log('[took ' + (Date.now() - midTime) + 'ms] Verified payment for ' + email + ' with payment id ' + correctedPaymentId + '. Has account: ' + hasAccount + '. Existing transaction: ' + (existingTransaction ? 'true' : 'false'));
    midTime = Date.now();

    //
    // Process transaction
    //
    if (!existingTransaction) {
        const data = {
            date: date,
            url: request.url,
            event_id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            user_agent: request.headers.get('user-agent') || '',
            name: name,
            email: email,
            region: region,
            value: value,
            currency: currency,
            primary_offer_slug: primaryOfferSlug,
            secondary_offer_slug: secondaryOfferSlug || undefined,
            payment_method: paymentMethod,
            payment_id: correctedPaymentId,
            payment_status: 'succeeded',
            paypal_email: paypalEmail,
            paypal_name: paypalName,
            paypal_order_id: paypalOrderId,
        };

        await trackServer(request, 'buy', data);

        const emailData = {
            ...data,

            user_id: userId,
            setup_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?payment_id=${correctedPaymentId}&sokol=${userId}`,
            description: primaryOfferSlug + (secondaryOfferSlug ? ' + ' + secondaryOfferSlug : ''),
            has_account: hasAccount,
        };

        console.log('[took ' + (Date.now() - midTime) + 'ms] Saving pending emails...');
        midTime = Date.now();

        await adminClient.from('pending_emails').insert([
            {
                template: EmailTemplate.ORDER_SUCCESS,
                recipient: email,
                data: emailData
            },
            {
                template: EmailTemplate.ADMIN_ORDER_SUCCESS,
                recipient: null,
                data: emailData
            }
        ]);
    }

    const finalResponse = {
        name: name,
        email: email,
        region: region,
        stripe_customer_id: stripeCustomerId,
        has_account: hasAccount,
        existing_transaction: existingTransaction,
        refunded: refunded,
    };

    console.log('[took ' + (Date.now() - startTime) + 'ms] Done!');

    return createSuccessResponse(finalResponse);
});

// ------------------------------------------------------------------------------------------------
// PayPal
// ------------------------------------------------------------------------------------------------

async function capturePayPalOrder(orderId: string, fallbackTransactionId: string): Promise<{ verified: boolean; declined: boolean; error?: string; details?: any }> {
    console.log('Capturing PayPal order id ' + orderId + '...');

    try {
        // Capture the payment to change status to COMPLETED
        const captureResult = await paypalApiRequest(`/v2/checkout/orders/${orderId}/capture`, 'POST');

        console.log('Capture result: ', JSON.stringify(captureResult, null, 2));

        // Update the order details with the capture result
        if (captureResult.status === 'COMPLETED')
            return {
                verified: true,
                declined: false,
                details: captureResult
            };

        else
            throw new Error(`Unexpected stats capturing payment: ${captureResult.status}`);

    } catch (captureError) {
        if (captureError instanceof Error && captureError.message.includes('INSTRUMENT_DECLINED')) {
            return {
                verified: false,
                declined: true,
                error: 'Vaša kartica je odbijena. Provjerite svoje podatke i pokušajte ponovno.'
            };
        }

        if (captureError instanceof Error && (
            captureError.message.includes('RESOURCE_NOT_FOUND') ||
            captureError.message.includes('ORDER_ALREADY_CAPTURED') ||
            captureError.message.includes('UNPROCESSABLE_ENTITY'))) {

            try {
                console.log('Error capturing order, looking for order manually. Got error: ' + captureError.message);

                const orderDetails = await paypalApiRequest(`/v2/checkout/orders/${orderId}`) as {
                    status: string;
                    payer: { payer_id: string; email_address?: string; name?: { given_name?: string; surname?: string; } };
                    purchase_units: Array<{
                        amount: { value: string; currency_code: string };
                        reference_id?: string;
                        description?: string;
                        custom_id?: string;
                        payments?: { captures: Array<any> };
                    }>;
                };

                if (orderDetails.status === 'COMPLETED') {
                    console.log('Successfully fetched already captured order: ', JSON.stringify(orderDetails, null, 2));
                    return {
                        verified: true,
                        declined: false,
                        details: orderDetails
                    };

                } else
                    throw new Error(`Unexpected status fetching already captured order: ${orderDetails.status}`);

            } catch (fetchError) {
                console.log("Manual lookup failed, resorting to fallback transaction id " + fallbackTransactionId + ". Got: " + fetchError);

                try {
                    const transactionDetails = await paypalApiRequest(`/v2/payments/captures/${fallbackTransactionId}`) as {
                        status: string;
                        amount: { value: string; currency_code: string };
                        create_time: string;
                        id: string;
                        custom_id?: string;
                        links?: Array<{ href: string; rel: string; method: string }>;
                    };

                    if (transactionDetails.status === 'COMPLETED') {
                        console.log('Successfully fetched transaction details: ', JSON.stringify(transactionDetails, null, 2));

                        // Construct a response that matches the expected order details format
                        const constructedOrderDetails = {
                            status: 'COMPLETED',
                            purchase_units: [{
                                payments: {
                                    captures: [transactionDetails]
                                }
                            }]
                        };

                        return {
                            verified: true,
                            declined: false,
                            details: constructedOrderDetails
                        };

                    } else
                        throw new Error(`Unexpected status fetching transaction: ${transactionDetails.status}`);

                } catch (transactionError) {
                    console.log(`Failed to fetch transaction details: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`);
                }
            }
        }

        throw new Error(`Failed to capture payment: ${captureError instanceof Error ? captureError.message : 'Unknown error'}`);
    }
}