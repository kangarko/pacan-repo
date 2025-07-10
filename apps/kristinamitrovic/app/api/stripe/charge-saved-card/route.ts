import Stripe from 'stripe';
import { getBaseUrl } from '@repo/ui/lib/utils';
import { createSupabaseServerClient, sendServerErrorEmail, createPostHandler, validateRequestBody, createErrorResponse, createSuccessResponse } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body, request) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const { client_secret, customer_id } = body;
    validateRequestBody(body, ['client_secret', 'customer_id']);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('User not found');

    try {
        const paymentIntentId = client_secret.split('_secret_')[0];
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer_id,
            type: 'card'
        });

        if (paymentMethods.data.length === 0)
            return createErrorResponse('No saved payment methods found',);

        const customer = await stripe.customers.retrieve(customer_id);

        let paymentMethod: string;

        if (typeof customer !== 'string' && !customer.deleted && 'invoice_settings' in customer && customer.invoice_settings?.default_payment_method)
            paymentMethod = customer.invoice_settings.default_payment_method as string;
        else
            paymentMethod = paymentMethods.data[0].id;

        console.log("[charge saved card] Customer: " + customer_id + " Payment Method: " + paymentMethod);

        await stripe.paymentIntents.update(paymentIntentId, {
            customer: customer_id,
            metadata: {
                ...paymentIntent.metadata,
                quick_pay: 'true'
            }
        });

        const confirmedPayment = await stripe.paymentIntents.confirm(
            paymentIntentId,
            {
                payment_method: paymentMethod,
                return_url: `${getBaseUrl()}/success`
            }
        );

        if (confirmedPayment.status === 'requires_action')
            return createSuccessResponse({
                next_action: confirmedPayment.next_action,
                payment_intent_id: confirmedPayment.id
            });

        if (confirmedPayment.status === 'succeeded') {
            await stripe.customers.update(customer_id, {
                invoice_settings: {
                    default_payment_method: paymentMethod
                }
            });

            return createSuccessResponse({
                payment_id: confirmedPayment.id
            });
        }

        sendServerErrorEmail(body, request, 'Payment returned unexpected status: ' + confirmedPayment.status);
        return createErrorResponse(`Payment returned unexpected status: ${confirmedPayment.status}`);

    } catch (error: any) {
        if (error?.message === 'Your card was declined for making repeated attempts too frequently or exceeding its amount limit')
            return createErrorResponse('Vaša kartica je odbijena zbog previše pokušaja ili prekoračenja limita. Molimo pokušajte s drugom karticom ili kontaktirajte svoju banku.')

        throw error;
    }
});