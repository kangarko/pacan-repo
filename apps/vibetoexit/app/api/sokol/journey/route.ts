import { getJourneyData, createPostHandler, validateRequestBody, createSuccessResponse, getUserByEmail } from '@repo/ui/lib/serverUtils';
import { LabeledTracking } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body) => {
    const { email } = body;
    validateRequestBody(body, ['email']);

    const [journeyResponse, user] = await Promise.all([
        getJourneyData('-1', email),
        getUserByEmail(email)
    ]);
    
    const journey = journeyResponse.data as LabeledTracking[];

    let ltv = 0;
    const offers = new Set<string>();
    const currencyRates: { [key: string]: number } = {
        'BAM': 1.96,
        'RSD': 117.24,
    };

    journey.forEach(event => {
        if (event.type === 'buy' && event.metadata.value) {
            const value = event.metadata.value;
            const currency = event.metadata.currency?.toUpperCase() || 'EUR';
            let valueEur = value;

            if (currency !== 'EUR') {
                if (currencyRates[currency]) {
                    valueEur = value / currencyRates[currency];
                } else {
                    console.warn(`Missing exchange rate for currency: ${currency}. Using raw value for LTV calculation.`);
                }
            }
            
            ltv += valueEur;
            
            if (event.metadata.primary_offer_slug) {
                offers.add(event.metadata.primary_offer_slug);
            }
            if (event.metadata.secondary_offer_slug) {
                offers.add(event.metadata.secondary_offer_slug);
            }
        }
    });

    return createSuccessResponse({
        region: journeyResponse.userRegion,
        data: journey,
        user: user,
        ltv: ltv,
        offers: Array.from(offers)
    });
});