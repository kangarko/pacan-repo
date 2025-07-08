import { createPostHandler, createSuccessResponse } from '@repo/ui/lib/serverUtils';
import { createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';

const currencyRates: { [key: string]: number } = {
    'BAM': 1.96,
    'RSD': 117.24,
}

export const POST = createPostHandler(async () => {
    const adminClient = await createSupabaseAdminClient();

    // Fetch all purchase events with necessary metadata
    const { data: purchaseEvents, error: purchaseError } = await adminClient
        .from('tracking')
        .select('email, metadata->>name, metadata->>value, metadata->>currency')
        .eq('type', 'buy')
        .not('email', 'is', null);

    if (purchaseError)
        throw new Error(`Error fetching purchase events: ${purchaseError.message}`);

    const userPurchaseData = new Map<string, { name: string | null; totalValueEur: number }>();

    (purchaseEvents || []).forEach((event: any) => {
        const email = typeof event.email === 'string' ? event.email.trim().toLowerCase() : null;

        if (!email)
            throw new Error(`Invalid email: ${event.email}`);

        const name = typeof event.name === 'string' ? event.name.trim() : null;
        const value = typeof event.value === 'number' ? event.value : parseFloat(event.value);
        const currency = typeof event.currency === 'string' ? event.currency.toUpperCase() : null;

        if (!currency)
            throw new Error(`Missing currency for purchase by ${email}, value: ${value}`);

        if (isNaN(value))
            throw new Error(`Invalid value: ${value}`);

        let valueEur = value;

        if (currency !== 'EUR' && currencyRates[currency])
            valueEur = Math.round(value / currencyRates[currency]);

        else if (currency !== 'EUR')
            throw new Error(`Missing exchange rate for currency: ${currency}. Value: ${value}`);

        const existingData = userPurchaseData.get(email);
        const currentName = existingData?.name || name;
        const newTotalValue = (existingData?.totalValueEur || 0) + valueEur;

        userPurchaseData.set(email, {
            name: currentName,
            totalValueEur: newTotalValue
        });
    });

    const result = Array.from(userPurchaseData.entries()).map(([email, data]) => ({
        email: email,
        name: data.name,
        totalValueEur: Math.round(data.totalValueEur * 100) / 100
    }));

    return createSuccessResponse(result);
}); 