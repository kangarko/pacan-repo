import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, verifyAdminOrMarketerUser, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { Tracking } from '@repo/ui/lib/types';
import { fetchMultiPageData, getNormalizedUrl } from '@repo/ui/lib/utils';

export const POST = createPostHandler(async (body) => {
    await verifyAdminOrMarketerUser();
    validateRequestBody(body, ['start_date', 'end_date', 'url']);

    const { start_date, end_date, url } = body;

    if (!url || url.trim() === '')
        return createErrorResponse('URL field is required.');

    const normalizedUrl = getNormalizedUrl(url);
    const adminClient = await createSupabaseAdminClient();

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
        return createErrorResponse('Invalid date format');

    if (startDate > endDate)
        return createErrorResponse('Start date must be before or equal to end date');

    const trackingData = await fetchMultiPageData<Tracking>(
        adminClient
            .from('tracking')
            .select('date, user_id, ip')
            .eq('type', 'view')
            .eq('url', normalizedUrl)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString())
    );

    const dailyStats: Record<string, { total: number; unique: number; seen: Set<string | number> }> = {};
    const overallUniqueVisitors = new Set<string | number>();

    for (const row of trackingData) {
        const dateKey = row.date.split('T')[0];
        
        if (!dailyStats[dateKey]) {
            dailyStats[dateKey] = { total: 0, unique: 0, seen: new Set() };
        }
        
        dailyStats[dateKey].total++;
        
        const uniqueIdentifier = row.user_id && row.user_id !== -1 ? row.user_id : row.ip;
        
        if (!dailyStats[dateKey].seen.has(uniqueIdentifier)) {
            dailyStats[dateKey].unique++;
            dailyStats[dateKey].seen.add(uniqueIdentifier);
        }

        overallUniqueVisitors.add(uniqueIdentifier);
    }
    
    const totalVisitors = trackingData.length;
    const totalUniqueVisitors = overallUniqueVisitors.size;

    const dailyStatsArray = Object.entries(dailyStats).map(([date, data]) => ({
        date,
        totalVisitors: data.total,
        uniqueVisitors: data.unique,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return createSuccessResponse({
        stats: {
            daily: dailyStatsArray,
            total: totalVisitors,
            total_unique: totalUniqueVisitors,
        },
        dateRange: {
            start: start_date,
            end: end_date
        },
        url: normalizedUrl
    });
}); 