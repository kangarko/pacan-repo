import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, verifyAdminUser } from '@repo/ui/lib/serverUtils';
import { convertUtcToLocal, fetchMultiPageData, getMzdaTransactions } from '@repo/ui/lib/utils';
import { Tracking } from '@repo/ui/lib/types';
import Stripe from 'stripe';

export const POST = createPostHandler(async () => {
    await verifyAdminUser();

    const adminClient = await createSupabaseAdminClient();

    // ---------------------------------------------------------------------
    // 0. Check basic data integrity
    // ---------------------------------------------------------------------

    console.log("Fetching all tracking data...");

    const allTrackingRows = await fetchMultiPageData<Tracking>(adminClient
        .from('tracking')
        .select('*'));

    console.log("Converting tracking data...");

    allTrackingRows.forEach(row => {
        row.date = convertUtcToLocal(row.date);
    });

    const mzdaTransactions = await getMzdaTransactions();
    const trackingPurchases: Tracking[] = [];
    const signups: Tracking[] = [];

    for (const row of allTrackingRows) {
        if (row.date === undefined || row.type === undefined || row.user_id === undefined || row.ip === undefined || row.metadata === undefined)
            throw new Error('Invalid row: ' + JSON.stringify(row));

        if (row.type == 'buy')
            trackingPurchases.push(row);

        if (row.type == 'sign_up')
            signups.push(row);
    }

    let totalPurchasesValueEur = 0;
    let totalMzdaValueEur = 0;

    const missingTransactions: Tracking[] = [];

    for (const trackingPurchase of trackingPurchases) {
        let valueEur = trackingPurchase.metadata.value!;
        const currency = trackingPurchase.metadata.currency!;

        if (currency != 'EUR') {
            let eurExchangeRate;

            if (currency == 'BAM')
                eurExchangeRate = 0.51;
            else if (currency == 'RSD')
                eurExchangeRate = 0.0085;
            else
                throw new Error('Invalid currency: ' + currency);

            valueEur = Math.round(valueEur * eurExchangeRate);
        }

        totalPurchasesValueEur += valueEur;

        let mzdaFound = false;

        for (const mzdaTransaction of mzdaTransactions)
            if (mzdaTransaction.transaction_id == trackingPurchase.metadata.payment_id || mzdaTransaction.transaction_id == trackingPurchase.metadata.paypal_order_id) {
                mzdaFound = true;

                // check if our date matches mzda date
                /*const mzdaDate = new Date(mzdaTransaction.timestamp * 1000);
                const purchaseDate = new Date(purchase.date);

                if (mzdaDate.getTime() != purchaseDate.getTime()) {
                    console.log(`Updating time of ${purchase.metadata.email} with id ${purchase.metadata.payment_id} from ${purchaseDate} to ${mzdaDate}`);

                    await adminClient
                        .from('tracking')
                        .update({
                            date: mzdaDate
                        })
                        .eq('id', purchase.id);
                }*/

                const mzdaValueEur = mzdaTransaction.unit_price * mzdaTransaction.exchange_rate;

                if (Math.round(mzdaValueEur) != Math.round(valueEur))
                    console.log("Transaction " + mzdaTransaction.transaction_id + " has a different value than tracking: " + valueEur + " != mzda " + mzdaValueEur);

                break;
            }


        if (!mzdaFound)
            missingTransactions.push(trackingPurchase);
    }

    if (missingTransactions.length > 0)
        throw new Error('Mzda transaction not found for purchases: ' + missingTransactions.map(t => t.metadata.payment_id).join(', '));

    for (const mzdaTransaction of mzdaTransactions) {
        totalMzdaValueEur += Math.round(mzdaTransaction.unit_price * mzdaTransaction.exchange_rate);

        let purchaseFound = false;

        for (const purchase of trackingPurchases)
            if (purchase.metadata.payment_id == mzdaTransaction.transaction_id || purchase.metadata.paypal_order_id == mzdaTransaction.transaction_id) {
                purchaseFound = true;

                break;
            }

        if (!purchaseFound)
            throw new Error('Purchase not found for mzda transaction: ' + mzdaTransaction.transaction_id);
    }
    // ---------------------------------------------------------------------
    // 1. Fetch all purchase tracking rows
    // ---------------------------------------------------------------------
    const purchaseRows = allTrackingRows
        .filter(row => row.type === 'buy')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ---------------------------------------------------------------------
    // 2. Build a set of all emails associated with purchases
    //    We consider metadata.email, metadata.paypal_email and row.email
    // ---------------------------------------------------------------------
    const purchaseEmailDetails = new Map<string, any>(); // No stripe_customer_id initially
    const refundedEmailSet = new Set<string>();

    for (const row of purchaseRows) {
        const email = row.email?.trim().toLowerCase();

        if (!email)
            throw new Error(`Purchase row with ID ${row.id} is missing required email field.`);

        if (!purchaseEmailDetails.has(email)) {
            const name = row.metadata?.name;
            const paymentId = row.metadata?.payment_id;
            const paymentMethod = row.metadata?.payment_method;
            const region = row.metadata?.region;

            if (!name)
                throw new Error(`Purchase row for email ${email} (ID: ${row.id}) is missing required metadata field: name`);

            if (!paymentId)
                throw new Error(`Purchase row for email ${email} (ID: ${row.id}) is missing required metadata field: payment_id`);

            if (!paymentMethod)
                throw new Error(`Purchase row for email ${email} (ID: ${row.id}) is missing required metadata field: payment_method`);

            if (!region)
                throw new Error(`Purchase row for email ${email} (ID: ${row.id}) is missing required metadata field: region`);

            purchaseEmailDetails.set(email, {
                email: email,
                name: name,
                payment_id: paymentId,
                payment_method: paymentMethod,
                date: row.date,
                region: region
                // stripe_customer_id will be fetched later if needed
            });
        }

        if (row.metadata?.payment_status === 'refunded') {
            //console.log("Found a refunded purchase for email " + email + " (ID: " + row.id + ")");

            refundedEmailSet.add(email);
        }
    }

    console.log("Found " + refundedEmailSet.size + " refunds");

    // ---------------------------------------------------------------------
    // 3. Fetch ALL Supabase users (paginated)
    // ---------------------------------------------------------------------
    console.log("Fetching all Supabase users...");

    const supabaseEmailSet = new Set<string>();
    let page = 1;
    const perPage = 1000;

    while (true) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

        if (error)
            throw error;

        if (!data || data.users.length === 0)
            break;

        for (const user of data.users) {
            if (!user.email)
                throw new Error(`Supabase user object with ID ${user.id} is missing required email field.`);

            if (user.user_metadata?.role === 'admin')
                continue;

            supabaseEmailSet.add(user.email.trim().toLowerCase());
        }

        if (data.users.length < perPage)
            break;

        page++;
    }

    // ---------------------------------------------------------------------
    // 4. Compute results
    // ---------------------------------------------------------------------
    const missingAccountsInfo: any[] = [];
    for (const [email, details] of purchaseEmailDetails.entries())
        if (!supabaseEmailSet.has(email) && !refundedEmailSet.has(email))
            missingAccountsInfo.push(details);

    // ---------------------------------------------------------------------
    // 4b. Fetch Stripe Customer ID ONLY for missing accounts
    // ---------------------------------------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    for (const accountInfo of missingAccountsInfo) {
        if (accountInfo.payment_method === 'stripe' || accountInfo.payment_method === 'quick_pay') {
            const paymentIntent = await stripe.paymentIntents.retrieve(accountInfo.payment_id);

            if (!paymentIntent.customer)
                throw new Error(`Stripe PaymentIntent ${accountInfo.payment_id} for email ${accountInfo.email} is missing the customer ID.`);

            else if (typeof paymentIntent.customer !== 'string')
                throw new Error(`Stripe PaymentIntent ${accountInfo.payment_id} for email ${accountInfo.email} has an invalid customer ID type: ${typeof paymentIntent.customer}`);

            else
                accountInfo.stripe_customer_id = paymentIntent.customer;
        }
    }

    const refundedStillActiveEmails: string[] = Array.from(refundedEmailSet).filter(e => supabaseEmailSet.has(e));
    const accountsWithoutPurchaseEmails: string[] = Array.from(supabaseEmailSet).filter(e => !purchaseEmailDetails.has(e));

    missingAccountsInfo.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const response: any = {
        purchases_count: trackingPurchases.length,
        purchases_value: Math.round(totalPurchasesValueEur),
        mzda_transactions_count: mzdaTransactions.length,
        mzda_transactions_value: Math.round(totalMzdaValueEur),
        missing_accounts: missingAccountsInfo,
        refunded_still_active: refundedStillActiveEmails.sort(),
        accounts_without_purchase: accountsWithoutPurchaseEmails.sort(),
    };

    return createSuccessResponse(response);
});