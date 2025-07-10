import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, verifyAdminOrMarketerUser, validateRequestBody } from '@repo/ui/lib/serverUtils';

// Define expected structure for onboarding form data
interface OnboardingFormData {
    age_range: string;
    challenges: string[];
    pain_points: string;
    ninety_day_goals: string;
    relationship_status: string;
    purchase_inspiration: string;
}

export const POST = createPostHandler(async (body) => {
    await verifyAdminOrMarketerUser(); // Allow both admin and marketer roles for read-only access
    
    // Validate that form_slug is provided in the request body
    validateRequestBody(body, ['form_slug']); 
    const { form_slug } = body; 

    const adminClient = await createSupabaseAdminClient();
    let validatedResponses;

    // Handle based on the provided form slug
    switch (form_slug) {
        case 'onboarding':
            const { data: responses, error } = await adminClient
                .from('form_responses')
                .select('id, created_at, user_email, data')
                .eq('form_slug', form_slug)
                .order('created_at', { ascending: false });

            if (error) 
                throw new Error(`Error fetching form responses for ${form_slug}: ${error.message}`);

            // Validate the data structure specifically for onboarding
            validatedResponses = responses.map(r => {
                if (!r.data || typeof r.data !== 'object') 
                    throw new Error(`Invalid data structure for response ID ${r.id} (form: ${form_slug}). Expected object.`);
                
                const data = r.data as Partial<OnboardingFormData>; // Cast for type checking

                // Strict validation for expected keys and types
                const expectedKeys: (keyof OnboardingFormData)[] = ['age_range', 'challenges', 'pain_points', 'ninety_day_goals', 'relationship_status', 'purchase_inspiration'];
                for (const key of expectedKeys) {
                    if (!(key in data)) {
                        throw new Error(`Response ID ${r.id} (form: ${form_slug}) is missing required key: ${key}. Data: ${JSON.stringify(data)}`);
                    }
                }
                
                // Type validation (basic example, can be more complex)
                if (typeof data.age_range !== 'string') throw new Error(`Invalid type for age_range in response ID ${r.id}`);
                if (!Array.isArray(data.challenges)) throw new Error(`Invalid type for challenges in response ID ${r.id}`);
                if (typeof data.pain_points !== 'string') throw new Error(`Invalid type for pain_points in response ID ${r.id}`);
                if (typeof data.ninety_day_goals !== 'string') throw new Error(`Invalid type for ninety_day_goals in response ID ${r.id}`);
                if (typeof data.relationship_status !== 'string') throw new Error(`Invalid type for relationship_status in response ID ${r.id}`);
                if (typeof data.purchase_inspiration !== 'string') throw new Error(`Invalid type for purchase_inspiration in response ID ${r.id}`);

                return {
                    id: r.id,
                    created_at: r.created_at,
                    user_email: r.user_email,
                    age_range: data.age_range!, 
                    challenges: data.challenges!, 
                    pain_points: data.pain_points!, 
                    ninety_day_goals: data.ninety_day_goals!, 
                    relationship_status: data.relationship_status!, 
                    purchase_inspiration: data.purchase_inspiration!, 
                };
            });
            break;

        // Add cases for other form slugs here in the future
        // case 'another_form':
        //     // ... fetch and validate differently ...
        //     break;

        default:
            throw new Error(`Unsupported form slug provided: ${form_slug}`);
    }

    return createSuccessResponse({ responses: validatedResponses });
}); 