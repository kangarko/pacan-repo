import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, verifyAdminUser, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { Offer } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body) => {
    await verifyAdminUser();

    await validateRequestBody(body, ['action']);

    const { action } = body;
    const adminClient = await createSupabaseAdminClient();

    switch (action) {
        case 'list': {
            const { data: offers, error } = await adminClient
                .from('offers')
                .select('*')
                .order('slug', { ascending: true });

            if (error)
                throw error;

            return createSuccessResponse({
                offers: offers as Offer[]
            });
        }

        case 'upload': {
            await validateRequestBody(body, ['fileData', 'fileName', 'contentType', 'uploadType']);
            
            const { fileData, fileName, contentType, uploadType } = body;
            
            if (!fileData || !fileName || !contentType || !uploadType)
                throw new Error('Missing required upload parameters');
                
            // Decode base64 data
            const buffer = Buffer.from(fileData.split(',')[1], 'base64');
            
            // Determine the storage path and bucket based on upload type
            const bucketName = uploadType === 'file' ? 'offer-files' : 'offer-thumbnails';
            
            // Create a unique filename to avoid collisions
            const fileExt = fileName.split('.').pop();
            const uniqueFileName = `${Date.now()}.${fileExt}`;
            const filePath = `${uniqueFileName}`;
            
            // Upload the file to the appropriate Supabase storage bucket
            const { error: uploadError } = await adminClient.storage
                .from(bucketName)
                .upload(filePath, buffer, {
                    contentType,
                    cacheControl: '3600',
                    upsert: true
                });
                
            if (uploadError)
                throw uploadError;
                
            // Get the public URL
            const { data: urlData } = adminClient.storage
                .from(bucketName)
                .getPublicUrl(filePath);
                
            return createSuccessResponse({
                success: true,
                url: urlData.publicUrl
            });
        }

        case 'save': {
            await validateRequestBody(body, ['offer']);
            const { offer } = body;

            // Validate all required fields and return error response instead of throwing
            if (!offer.slug)
                return createErrorResponse('Offer slug is required');

            if (!offer.name)
                return createErrorResponse('Offer name is required');

            if (!offer.description)
                return createErrorResponse('Offer description is required');

            if (!offer.type)
                return createErrorResponse('Offer type is required');

            if (typeof offer.price !== 'number')
                return createErrorResponse('Offer price must be a number');

            if (!offer.currency)
                return createErrorResponse('Offer currency is required');

            if (typeof offer.price_eur !== 'number')
                return createErrorResponse('Offer price_eur must be a number');

            // Check if offer exists (for update vs create)
            const { data: existingOffer, error: queryError } = await adminClient
                .from('offers')
                .select('id')
                .eq('slug', offer.slug)
                .maybeSingle();

            if (queryError)
                throw queryError;

            let result;

            if (existingOffer) {
                // Update
                result = await adminClient
                    .from('offers')
                    .update({
                        name: offer.name,
                        short_description: offer.short_description,
                        description: offer.description,
                        type: offer.type,
                        file_path: offer.file_path || '',
                        thumbnail_url: offer.thumbnail_url || '',
                        price: offer.price,
                        currency: offer.currency,
                        price_eur: offer.price_eur,
                        region_prices: offer.region_prices || {},
                        metadata: offer.metadata || {}
                    })
                    .eq('slug', offer.slug)
                    .select()
                    .single();
            } else {
                // Create
                result = await adminClient
                    .from('offers')
                    .insert({
                        slug: offer.slug,
                        name: offer.name,
                        short_description: offer.short_description,
                        description: offer.description,
                        type: offer.type,
                        file_path: offer.file_path || '',
                        thumbnail_url: offer.thumbnail_url || '',
                        price: offer.price,
                        currency: offer.currency,
                        price_eur: offer.price_eur,
                        region_prices: offer.region_prices || {},
                        metadata: offer.metadata || {}
                    })
                    .select()
                    .single();
            }

            if (result.error)
                throw result.error;

            return createSuccessResponse({
                success: true,
                offer: result.data,
                message: existingOffer ? 'Offer updated successfully' : 'Offer created successfully'
            });
        }
        case 'delete': {
            await validateRequestBody(body, ['slug']);
            const { slug } = body;

            if (!slug)
                throw new Error('Offer slug is required');

            const { error } = await adminClient
                .from('offers')
                .delete()
                .eq('slug', slug);

            if (error)
                throw error;

            return createSuccessResponse({
                success: true,
                message: 'Offer deleted successfully'
            });
        }
        default:
            return createErrorResponse('Invalid action: ' + action);
    }
}); 