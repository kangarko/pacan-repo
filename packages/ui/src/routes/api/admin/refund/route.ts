import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, verifyAdminUser, getPurchasesByEmail, validateTrackingRow, deleteContactFromWordPressList, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    await verifyAdminUser();
    
    const { action } = body;
    validateRequestBody(body, ['action']);
    
    const adminClient = await createSupabaseAdminClient();

    switch (action) {
        case 'get_purchases': {
            if (!body.email)
                throw new Error('Email is required');

            const purchases = await getPurchasesByEmail(body.email);

            // Filter out already refunded purchases
            const activePurchases = purchases.filter(p => p.metadata.payment_status !== 'refunded');

            return createSuccessResponse({ purchases: activePurchases });
        }

        case 'process_refund': {
            if (!body.purchase_id)
                throw new Error('Purchase ID is required');

            // Get the purchase to refund
            const { data: purchase, error: fetchError } = await adminClient
                .from('tracking')
                .select('*')
                .eq('id', body.purchase_id)
                .eq('type', 'buy')
                .single();

            if (fetchError || !purchase)
                throw new Error('Purchase not found');

            const validatedPurchase = validateTrackingRow(purchase);

            if (validatedPurchase.metadata.payment_status === 'refunded')
                throw new Error('This purchase has already been refunded');

            // Update payment status to refunded
            const { error: updateError } = await adminClient
                .from('tracking')
                .update({
                    metadata: {
                        ...validatedPurchase.metadata,
                        payment_status: 'refunded'
                    }
                })
                .eq('id', body.purchase_id);

            if (updateError)
                throw new Error('Failed to update payment status: ' + updateError.message);

            // Delete contact from WordPress list
            try {
                await deleteContactFromWordPressList(validatedPurchase.metadata.email!);
            } catch (error) {
                throw new Error('Failed to delete from WordPress list: ' + error);
            }

            // Prepare refund links based on payment method
            let refundLink = null;
            let refundInstructions = '';

            switch (validatedPurchase.metadata.payment_method) {
                case 'stripe':
                case 'quick_pay':
                    refundLink = `https://dashboard.stripe.com/payments/${validatedPurchase.metadata.payment_id}`;
                    refundInstructions = 'Click the link to view this payment in Stripe Dashboard and issue a refund.';
                    break;

                case 'paypal':
                    refundLink = `https://www.paypal.com/activity/payment/${validatedPurchase.metadata.paypal_order_id || validatedPurchase.metadata.payment_id}`;
                    refundInstructions = 'Click the link to view this payment in PayPal and issue a refund.';
                    break;

                case 'bank':
                    refundInstructions = 'Bank transfer refunds must be processed manually through your bank.';
                    break;

                default:
                    refundInstructions = 'The payment method ' + validatedPurchase.metadata.payment_method + ' requires manual refund processing.';
            }

            return createSuccessResponse({
                success: true,
                purchase: validatedPurchase,
                refundLink,
                refundInstructions,
                googleSheetsLink: 'https://docs.google.com/spreadsheets/d/1-UxrQ_QSBJOSaSM9ZKoQ5BzBZWfyS6jhn9bm6-QdGvE/edit?gid=2093636178#gid=2093636178'
            });
        }

        default:
            throw new Error('Invalid action: ' + action);
    }
}); 