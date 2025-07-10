import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody, verifyAdminUser, verifyAdminOrMarketerUser } from '@repo/ui/lib/serverUtils';
import { convertUtcToLocal, fetchMultiPageData } from '@repo/ui/lib/utils';

export const POST = createPostHandler(async (body) => {
    const { action } = body;
    validateRequestBody(body, ['action']);

    // For list action, allow both admin and marketer
    if (action === 'list') {
        await verifyAdminOrMarketerUser();
    } else {
        // For all other actions (create, update, delete, toggle_active), require admin
        await verifyAdminUser();
    }

    const adminClient = await createSupabaseAdminClient();

    // Handle different actions
    switch (action) {
        case 'list':
            return await handleListExperiments(adminClient);

        case 'create':
            validateRequestBody(body, ['experiment']);
            return await handleCreateExperiment(adminClient, body.experiment);

        case 'update':
            validateRequestBody(body, ['experiment']);
            return await handleUpdateExperiment(adminClient, body.experiment);

        case 'delete':
            validateRequestBody(body, ['id']);
            return await handleDeleteExperiment(adminClient, body.id);

        case 'toggle_active':
            validateRequestBody(body, ['id', 'active']);
            return await handleToggleActive(adminClient, body.id, body.active);

        default:
            throw new Error(`Unknown action: ${action}`);
    }
});

async function handleListExperiments(adminClient: any) {
    // Get all experiments
    const experiments = await fetchMultiPageData(adminClient.from('experiments').select('*').order('created_at', { ascending: false }));

    const experimentsWithStats = await Promise.all(
        (experiments || []).map(async (experiment: any) => {
            try {
                const statsData = await fetchMultiPageData(adminClient.from('userdata').select('user_id, experiment_data').not('experiment_data->>' + experiment.name, 'is', null));

                const totalUsers = statsData?.length || 0;
                const variantDistribution: Record<string, number> = {};
                const variantUsers: Record<string, number[]> = {};

                experiment.variants.forEach((v: string) => {
                    variantDistribution[v] = 0;
                    variantUsers[v] = [];
                });

                statsData?.forEach((row: any) => {
                    const variant = row.experiment_data[experiment.name];
                    if (variant && variantDistribution[variant] !== undefined) {
                        variantDistribution[variant]++;
                        variantUsers[variant].push(row.user_id);
                    }
                });

                // Collect all user_ids involved in this experiment
                const allUserIds: number[] = [];
                Object.values(variantUsers).forEach(arr => allUserIds.push(...arr));

                const conversions = {
                    sign_up: {} as Record<string, number>,
                    buy: {} as Record<string, number>
                };

                experiment.variants.forEach((v: string) => {
                    conversions.sign_up[v] = 0;
                    conversions.buy[v] = 0;
                });

                if (allUserIds.length > 0) {
                    const trackRows = await fetchMultiPageData(adminClient
                        .from('tracking')
                        .select('user_id, type, date, email')
                        .in('user_id', allUserIds)
                        .in('type', ['sign_up', 'buy']));

                    const start = new Date(convertUtcToLocal(experiment.start_date));
                    const end = experiment.end_date ? new Date(convertUtcToLocal(experiment.end_date)) : new Date();

                    end.setHours(23, 59, 59, 999);

                    // Keep track of unique user IDs that signed up per variant
                    const uniqueSignupUserIds: Record<string, Set<number>> = {};
                    experiment.variants.forEach((v: string) => {
                        uniqueSignupUserIds[v] = new Set<number>();
                    });

                    trackRows?.forEach((row: any) => {
                        row.date = convertUtcToLocal(row.date);

                        // TODO Broken on netlify due to timezone
                        const rowDate = new Date(row.date);

                        if (rowDate < start || rowDate > end) 
                            return;

                        const variant = Object.keys(variantUsers).find(v => variantUsers[v].includes(row.user_id));

                        if (!variant) 
                            return;

                        if (row.type === 'sign_up') {

                            // Only count if user_id hasn't signed up yet for this variant
                            if (!uniqueSignupUserIds[variant].has(row.user_id)) {
                            
                                conversions.sign_up[variant]++;
                                uniqueSignupUserIds[variant].add(row.user_id);
                            }
                        } else if (row.type === 'buy') {
                            // Buys are still counted per event
                            conversions.buy[variant]++;
                        }
                    });
                }

                return {
                    ...experiment,
                    stats: {
                        total_users: totalUsers,
                        variant_distribution: variantDistribution,
                        conversions
                    }
                };
            } catch (err) {
                console.error('Error fetching stats for experiment:', experiment.name, err);
                return experiment;
            }
        })
    );

    return createSuccessResponse({
        experiments: experimentsWithStats
    });
}

async function handleCreateExperiment(adminClient: any, experimentData: any) {
    // Basic validation
    if (!experimentData.name) {
        throw new Error('Experiment name is required');
    }

    if (!experimentData.variants || experimentData.variants.length < 2) {
        throw new Error('At least two variants are required');
    }

    // Filter out empty variant names
    const filteredVariants = experimentData.variants.filter((v: string) => v.trim() !== '');
    if (filteredVariants.length < 2) {
        throw new Error('At least two non-empty variants are required');
    }

    const { data, error } = await adminClient
        .from('experiments')
        .insert([{
            name: experimentData.name,
            description: experimentData.description || null,
            active: experimentData.active !== undefined ? experimentData.active : true,
            variants: filteredVariants,
            end_date: experimentData.end_date || null
        }])
        .select();

    if (error) throw error;

    return createSuccessResponse({
        experiment: data[0]
    });
}

async function handleUpdateExperiment(adminClient: any, experimentData: any) {
    // Basic validation
    if (!experimentData.id) {
        throw new Error('Experiment id is required');
    }

    if (!experimentData.name) {
        throw new Error('Experiment name is required');
    }

    if (!experimentData.variants || experimentData.variants.length < 2) {
        throw new Error('At least two variants are required');
    }

    // Filter out empty variant names
    const filteredVariants = experimentData.variants.filter((v: string) => v.trim() !== '');
    if (filteredVariants.length < 2) {
        throw new Error('At least two non-empty variants are required');
    }

    const { data, error } = await adminClient
        .from('experiments')
        .update({
            name: experimentData.name,
            description: experimentData.description,
            active: experimentData.active,
            variants: filteredVariants,
            end_date: experimentData.end_date
        })
        .eq('id', experimentData.id)
        .select();

    if (error) throw error;

    return createSuccessResponse({
        experiment: data[0]
    });
}

async function handleDeleteExperiment(adminClient: any, id: number) {
    const { error } = await adminClient
        .from('experiments')
        .delete()
        .eq('id', id);

    if (error) throw error;

    return createSuccessResponse({
        success: true,
        message: `Experiment with ID ${id} deleted successfully`
    });
}

async function handleToggleActive(adminClient: any, id: number, currentActive: boolean) {
    const { data, error } = await adminClient
        .from('experiments')
        .update({ active: !currentActive })
        .eq('id', id)
        .select();

    if (error) throw error;

    return createSuccessResponse({
        experiment: data[0]
    });
} 