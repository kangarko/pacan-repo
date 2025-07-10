import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, verifyAdminOrMarketerUser, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { Headline, Tracking } from '@repo/ui/lib/types';
import { fetchMultiPageData, getNormalizedUrl } from '@repo/ui/lib/utils';

export const POST = createPostHandler(async (body) => {
    const { action } = body;
    validateRequestBody(body, ['action']);

    const adminClient = await createSupabaseAdminClient();

    switch (action) {
        case 'list': {
            await verifyAdminOrMarketerUser();

            const { data: headlines, error } = await adminClient
                .from('headlines')
                .select('*')
                .order('created_at', { ascending: false });

            if (error)
                throw error;

            return createSuccessResponse({
                headlines: headlines as Headline[]
            });
        }

        case 'create': {
            await verifyAdminOrMarketerUser();
            validateRequestBody(body, ['name', 'headline', 'bullet_points']);

            const { name, headline, subheadline, bullet_points, slug } = body;

            // Validate bullet points structure
            if (!Array.isArray(bullet_points))
                return createErrorResponse('Bullet points must be an array');

            for (const point of bullet_points) {
                if (!point.icon || !point.text)
                    return createErrorResponse('Each bullet point must have an icon and text');
            }

            // Generate slug from name if not provided
            const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            // Validate slug format
            if (!/^[a-z0-9-]+$/.test(finalSlug))
                return createErrorResponse('Slug must contain only lowercase letters, numbers, and hyphens');

            const { data: newHeadline, error } = await adminClient
                .from('headlines')
                .insert({
                    name,
                    slug: finalSlug,
                    headline,
                    subheadline: subheadline || null,
                    bullet_points
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505' && error.message.includes('headlines_slug_unique'))
                    return createErrorResponse('A headline with this slug already exists');
                throw error;
            }

            return createSuccessResponse({
                headline: newHeadline as Headline
            });
        }

        case 'update': {
            await verifyAdminOrMarketerUser();
            validateRequestBody(body, ['id']);

            const { id, name, slug, headline, subheadline, bullet_points, active } = body;

            const updateData: any = {};

            if (name !== undefined) updateData.name = name;
            if (slug !== undefined) {
                // Validate slug format
                if (!/^[a-z0-9-]+$/.test(slug))
                    return createErrorResponse('Slug must contain only lowercase letters, numbers, and hyphens');
                updateData.slug = slug;
            }
            if (headline !== undefined) updateData.headline = headline;
            if (subheadline !== undefined) updateData.subheadline = subheadline;
            if (bullet_points !== undefined) {
                // Validate bullet points structure
                if (!Array.isArray(bullet_points))
                    return createErrorResponse('Bullet points must be an array');

                for (const point of bullet_points) {
                    if (!point.icon || !point.text)
                        return createErrorResponse('Each bullet point must have an icon and text');
                }
                updateData.bullet_points = bullet_points;
            }
            if (active !== undefined) updateData.active = active;

            const { data: updatedHeadline, error } = await adminClient
                .from('headlines')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === '23505' && error.message.includes('headlines_slug_unique'))
                    return createErrorResponse('A headline with this slug already exists');
                throw error;
            }

            return createSuccessResponse({
                headline: updatedHeadline as Headline
            });
        }

        case 'delete': {
            // Only allow admins to delete headlines
            const user = await verifyAdminOrMarketerUser();
            if (user.user_metadata.role !== 'admin')
                return createErrorResponse('Only administrators can delete headlines');

            validateRequestBody(body, ['id']);

            const { id } = body;

            const { error } = await adminClient
                .from('headlines')
                .delete()
                .eq('id', id);

            if (error)
                throw error;

            return createSuccessResponse({
                success: true
            });
        }

        case 'get_active': {
            await verifyAdminOrMarketerUser();

            const { data: headlines, error } = await adminClient
                .from('headlines')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error)
                throw error;

            return createSuccessResponse({
                headlines: headlines as Headline[]
            });
        }

        case 'get_stats': {
            await verifyAdminOrMarketerUser();
            validateRequestBody(body, ['start_date', 'end_date']);

            const { start_date, end_date, url } = body;

            // Validate URL parameter
            if (!url || url.trim() === '')
                return createErrorResponse('URL field is required. Use "/" to track visitors from the homepage.');

            const normalizedUrl = getNormalizedUrl(url);

            // Validate dates - parse as local dates to avoid timezone issues
            const [startYear, startMonth, startDay] = start_date.split('-').map(Number);
            const [endYear, endMonth, endDay] = end_date.split('-').map(Number);

            const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
                return createErrorResponse('Invalid date format');

            if (startDate > endDate)
                return createErrorResponse('Start date must be before or equal to end date');

            // Get all active headlines
            const { data: headlines, error: headlinesError } = await adminClient
                .from('headlines')
                .select('*')
                .eq('active', true);

            if (headlinesError)
                throw headlinesError;

            // Get tracking data for the date range - filter views by URL
            const trackingData = await fetchMultiPageData<Tracking>(
                adminClient
                    .from('tracking')
                    .select('type, metadata, email, date, url')
                    .gte('date', startDate.toISOString())
                    .lte('date', endDate.toISOString())
                    .in('type', ['view', 'sign_up', 'buy'])
            );

            console.log(`Found ${trackingData.length} tracking rows`);

            // Calculate stats for each headline
            const stats: Record<string, {
                headline: Headline;
                views: number;
                signups: number;
                purchases: number;
                signupRate: number;
                purchaseRate: number;
            }> = {};

            // Initialize stats for each headline
            for (const headline of headlines || []) {
                stats[headline.id] = {
                    headline: headline as Headline,
                    views: 0,
                    signups: 0,
                    purchases: 0,
                    signupRate: 0,
                    purchaseRate: 0
                };
            }

            // Add a "no headline" category for tracking without headline_id
            stats['no_headline'] = {
                headline: {
                    id: 'no_headline',
                    name: 'No A/B Headline (Control)',
                    slug: 'no-headline',
                    headline: 'Default headline',
                    bullet_points: [],
                    active: true,
                    created_at: '',
                    updated_at: ''
                },
                views: 0,
                signups: 0,
                purchases: 0,
                signupRate: 0,
                purchaseRate: 0
            };

            // Process tracking data
            for (const row of trackingData || []) {
                const headlineId = row.metadata?.headline_id || 'no_headline';

                if (stats[headlineId]) {
                    if (row.type === 'view' && row.url === normalizedUrl) {
                        // Only count views that match the specified URL
                        stats[headlineId].views++;
                    } else if (row.type === 'sign_up') {
                        // Count all signups regardless of URL
                        stats[headlineId].signups++;
                    } else if (row.type === 'buy') {
                        // Count all purchases regardless of URL
                        stats[headlineId].purchases++;
                    }
                }
            }

            // Calculate conversion rates
            for (const stat of Object.values(stats)) {
                if (stat.views > 0) {
                    stat.signupRate = (stat.signups / stat.views) * 100;
                    stat.purchaseRate = (stat.purchases / stat.views) * 100;
                }
            }

            return createSuccessResponse({
                stats: Object.values(stats),
                dateRange: {
                    start: start_date,
                    end: end_date
                },
                url: normalizedUrl
            });
        }

        default:
            return createErrorResponse('Invalid action: ' + action);
    }
}); 