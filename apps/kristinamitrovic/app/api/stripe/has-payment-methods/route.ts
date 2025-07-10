import Stripe from 'stripe';
import { createSupabaseAdminClient, createSupabaseServerClient, getPurchasesByEmail, createPostHandler, createSuccessResponse } from '@repo/ui/lib/serverUtils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const POST = createPostHandler(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('Cannot check stripe payment methods for non logged in user');

    const adminClient = await createSupabaseAdminClient();
    const transactions = await getPurchasesByEmail(user.email!);

    let lastCustomerId = '';

    for (const transaction of transactions) {
        if (transaction.metadata.payment_method != 'stripe')
            continue;

        const payment = await stripe.paymentIntents.retrieve(transaction.metadata.payment_id!);
        const customer = await stripe.customers.retrieve(payment.customer as string);

        lastCustomerId = payment.customer as string;

        if (typeof customer !== 'string' && !customer.deleted && 'invoice_settings' in customer && customer.invoice_settings?.default_payment_method) {
            await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...user.user_metadata,
                    stripe_customer_id: payment.customer as string
                }
            });

            return createSuccessResponse({
                has_saved_methods: true,
                customer_id: payment.customer as string
            });
        }

        const paymentMethods = await stripe.paymentMethods.list({
            customer: payment.customer as string,
            type: 'card'
        });

        if (paymentMethods.data.length > 0) {
            await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...user.user_metadata,
                    stripe_customer_id: payment.customer as string
                }
            });

            return createSuccessResponse({
                has_saved_methods: paymentMethods.data.length > 0,
                customer_id: payment.customer as string,
            });
        }
    }

    return createSuccessResponse({
        has_saved_methods: false,
        customer_id: lastCustomerId
    });
});