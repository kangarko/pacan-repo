import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, verifyAdminUser, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    await verifyAdminUser();

    const { userId, name, email, role, region } = body;
    validateRequestBody(body, ['userId']);

    const adminClient = await createSupabaseAdminClient();

    // Fetch the user to get existing metadata
    const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
    
    if (getUserError) 
        throw new Error(`User with ID ${userId} not found: ${getUserError.message}`);
    
    const newMetadata = { ...user?.user_metadata };
    
    if (name !== undefined) {
        newMetadata.name = name;

        newMetadata.display_name = name; // Also update display_name
    }

    if (role !== undefined) {
        if (!['user', 'admin', 'marketer'].includes(role)) 
            return createErrorResponse('Invalid role specified.', 400);
        
        newMetadata.role = role;
    }

    if (region !== undefined) 
        newMetadata.region = region;    

    const updatePayload: any = {
        user_metadata: newMetadata,
    };

    if (email !== undefined && email !== user?.email) 
        updatePayload.email = email;    

    const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
        userId,
        updatePayload
    );

    if (updateError) 
        throw updateError;    

    return createSuccessResponse({ user: updatedUser.user });
});