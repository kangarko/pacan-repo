import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, deleteContactFromWordPressList, verifyAdminUser } from '@repo/ui/lib/serverUtils';
import { User } from '@supabase/supabase-js';

export const POST = createPostHandler(async () => {
    await verifyAdminUser();

    const adminClient = await createSupabaseAdminClient();
    const debugIp = '127.0.0.1';
    const debugEmail = 'matej@matejpacan.com';
    const messages: string[] = [];

    // 1. Find all tracking rows for the debug IP or debug email
    const { data: debugTrackingRows, error: trackingError } = await adminClient
        .from('tracking')
        .select('user_id, email')
        .or(`ip.eq.${debugIp},email.eq.${debugEmail}`);

    if (trackingError)
        throw new Error(`Failed to fetch debug tracking data: ${trackingError.message}`);

    if (!debugTrackingRows || debugTrackingRows.length === 0) {
        return createSuccessResponse({
            success: true,
            message: 'No debug data found to clear.'
        });
    }
    messages.push(`Found ${debugTrackingRows.length} tracking rows for IP ${debugIp} or email ${debugEmail}.`);

    const userIdsToDelete = [...new Set(debugTrackingRows.map(u => u.user_id).filter(id => id != null))] as number[];
    const emailsToDelete = [...new Set(debugTrackingRows.map(u => u.email).filter(email => email && email.trim() !== '' && email.includes('@')))] as string[];

    // 2. Delete rows from related tables using the integer user_ids
    if (userIdsToDelete.length > 0) {
        messages.push(`Found ${userIdsToDelete.length} unique integer user IDs to clean up.`);
        const tablesToDeleteFrom = [
            'webinar_messages',
            'webinar_sessions',
            'webinar_feedback',
            'userdata',
            'paypal_purchases',
        ];

        for (const table of tablesToDeleteFrom) {
            const { error: deleteError } = await adminClient
                .from(table)
                .delete()
                .in('user_id', userIdsToDelete);

            if (deleteError)
                messages.push(`Error deleting from ${table}: ${deleteError.message}`);
            else
                messages.push(`Cleaned up ${table}.`);
        }
    }

    // 3. Handle form_responses and auth.users deletion
    if (emailsToDelete.length > 0) {
        messages.push(`Found ${emailsToDelete.length} unique emails to clean up from auth tables: ` + emailsToDelete.join(', '));

        // Fetch all supabase users
        let allAuthUsers: User[] = [];
        let page = 0;
        while (true) {
            const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ page: page, perPage: 1000 });
            if (usersError)
                throw new Error(`Failed to list Supabase users: ${usersError.message}`);

            allAuthUsers = allAuthUsers.concat(users);
            if (users.length < 1000) break;
            page++;
        }

        const authUsersToDelete = allAuthUsers.filter(u => u.email && emailsToDelete.includes(u.email) && (u.user_metadata?.role !== 'admin' && u.user_metadata?.role !== 'marketer'));
        const authUserIdsToDelete = authUsersToDelete.map(u => u.id);

        if (authUserIdsToDelete.length > 0) {
            messages.push(`Found ${authUserIdsToDelete.length} Supabase auth users to delete: ` + authUserIdsToDelete.join(', '));

            // Delete from form_responses
            const { error: formResponsesError } = await adminClient
                .from('form_responses')
                .delete()
                .in('user_id', authUserIdsToDelete);

            if (formResponsesError)
                messages.push(`Error deleting from form_responses: ${formResponsesError.message}`);
            else
                messages.push(`Cleaned up form_responses.`);

            for (const authUser of authUsersToDelete) {
                try {
                    messages.push('Deleting from WordPress list: ' + authUser.email);
                    await deleteContactFromWordPressList(authUser.email!);
                } catch (error) {
                    messages.push(`Error deleting from WordPress list: ${error}`);
                }
            }

            // Delete auth users
            let deletedUserCount = 0;
            for (const userId of authUserIdsToDelete) {
                const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
                if (deleteUserError) {
                    messages.push(`Error deleting auth user ${userId}: ${deleteUserError.message}`);
                } else {
                    deletedUserCount++;
                }
            }
            messages.push(`Deleted ${deletedUserCount} auth users.`);
        } else {
            messages.push("No matching Supabase auth users found to delete.");
        }
    }

    // 4. Delete the tracking rows themselves
    const { count: deletedTrackingCount, error: deleteTrackingError } = await adminClient
        .from('tracking')
        .delete({ count: 'exact' })
        .or(`ip.eq.${debugIp},email.eq.${debugEmail}`);

    if (deleteTrackingError)
        throw new Error(`Failed to delete debug tracking rows: ${deleteTrackingError.message}`);

    messages.push(`Deleted ${deletedTrackingCount} tracking rows.`);

    return createSuccessResponse({
        success: true,
        message: messages.join('\n')
    });
}); 