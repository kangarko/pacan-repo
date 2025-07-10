import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody, verifyAdminUser, verifyAdminOrMarketerUser, createSupabaseServerClient } from '@repo/ui/lib/serverUtils';
import { generateFluxImage } from '@repo/ui/lib/utils';


const processingImages = new Set<string>();

export const POST = createPostHandler(async (body) => {
    const { action } = body;
    validateRequestBody(body, ['action']);

    // For list and check actions, allow both admin and marketer
    if (action === 'list_images' || action === 'check_image' || action === 'generate_image') {
        await verifyAdminOrMarketerUser();
    } else {
        // For all other actions (generate, delete, update), require admin
        await verifyAdminUser();
    }

    const imageAdmin = new ImageAdmin();

    switch (action) {
        case 'check_image':
            validateRequestBody(body, ['task_id', 'image_id']);
            return await imageAdmin.checkImage(body.task_id, body.image_id);

        case 'delete_image':
            validateRequestBody(body, ['image_id']);
            return await imageAdmin.deleteImage(body.image_id);

        case 'generate_image':
            validateRequestBody(body, ['prompt', 'aspect_ratio', 'enhance_by_sam_ovens', 'model']);
            return await imageAdmin.generateImage(body.prompt, body.aspect_ratio, body.enhance_by_sam_ovens, body.model, body.image_id);

        case 'list_images':
            return await imageAdmin.listImages();

        case 'update_image':
            validateRequestBody(body, ['image_id', 'prompt']);
            return await imageAdmin.updateImage(body.image_id, body.prompt);

        default:
            throw new Error(`Unknown image action: ${action}`);
    }
});

class ImageAdmin {

    async checkImage(task_id: string, image_id: number): Promise<ReturnType<typeof createSuccessResponse>> {
        // Create a unique key for this image
        const imageKey = `${image_id}-${task_id}`;

        // If this image is already being processed, return pending status
        if (processingImages.has(imageKey)) {
            return createSuccessResponse({
                status: 'Pending',
                message: 'Image is currently being processed',
                progress: 0.9 // Indicate we're close to being done
            });
        }

        const adminClient = await createSupabaseAdminClient();

        // Get the image record from the database
        // We don't use .single() because it gives the same error for both "no rows" and "multiple rows"
        // By fetching all records, we can differentiate between these cases
        const { data: imageRecords, error: fetchError } = await adminClient
            .from('generated_images')
            .select('*')
            .eq('id', image_id)
            .eq('flux_task_id', task_id);

        if (fetchError)
            throw new Error(`[Check Image] Error fetching image record: ${fetchError.message}`);

        if (!imageRecords || imageRecords.length === 0)
            return createSuccessResponse({
                status: 'error',
                message: `No image record found for ID ${image_id} with task ${task_id}. The task may have expired or the IDs are incorrect.`,
                debug: {
                    reason: 'no_rows_found',
                    image_id,
                    task_id
                }
            });

        if (imageRecords.length > 1) {
            const recordDetails = imageRecords.map(record => ({
                id: record.id,
                flux_task_id: record.flux_task_id,
                status: record.status,
                created_at: record.created_at,
                image_url: record.image_url,
                user_id: record.user_id
            }));
            
            throw new Error(`[Check Image] Multiple image records (${imageRecords.length}) found for ID ${image_id} with task ${task_id}. Records: ${JSON.stringify(recordDetails, null, 2)}`);
        }

        const imageRecord = imageRecords[0];

        // If the image already has an error status, don't check again
        if (imageRecord.status === 'error')
            return createSuccessResponse({
                status: 'error',
                message: imageRecord.error_message || 'Image generation failed'
            });

        // If the image is already completed, return the status
        if (imageRecord.status === 'completed' && imageRecord.image_url)
            return createSuccessResponse({
                status: 'Ready',
                image_url: imageRecord.image_url
            });

        // Call the Flux API to check the image status
        const fluxApiKey = process.env.FLUX_API_KEY;

        if (!fluxApiKey)
            throw new Error('FLUX_API_KEY is not set in environment variables');

        const fluxResponse = await fetch(`https://api.us.bfl.ai/v1/get_result?id=${task_id}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-key': fluxApiKey
            }
        });


        if (!fluxResponse.ok) {
            const errorText = await fluxResponse.text();
            const errorMessage = fluxResponse.status === 404 
                ? 'Image generation task not found. It may have expired or failed.'
                : `Failed to check image status: ${fluxResponse.status} - ${errorText}`;

            console.log("response error, errorText: ", errorText);

            // Update the image status to error instead of deleting
            await adminClient
                .from('generated_images')
                .update({
                    status: 'error',
                    error_message: errorMessage
                })
                .eq('id', image_id);

            return createSuccessResponse({
                status: 'error',
                message: errorMessage
            });
        }

        const data = await fluxResponse.json();

        console.log("response success, data: ", data);

        // Check if the request was moderated/censored
        if (data.status === 'Request Moderated') {
            const moderationReasons = data.details?.['Moderation Reasons']?.join(', ') || 'Content policy violation';
            
            // Update the image status to error
            await adminClient
                .from('generated_images')
                .update({
                    status: 'error',
                    error_message: `Image generation blocked by safety filter: ${moderationReasons}`
                })
                .eq('id', image_id);

            return createSuccessResponse({
                status: 'error',
                message: `The image could not be generated because it was blocked by the safety filter. Reason: ${moderationReasons}`
            });
        }

        // If the image is ready, process the upload and return the permanent URL
        if (data.status === 'Ready' && data.result && data.result.sample) {
            // If the image already has a URL in our database, return that
            if (imageRecord.image_url) {
                return createSuccessResponse({
                    status: 'Ready',
                    image_url: imageRecord.image_url
                });
            }

            // Mark as processing to prevent concurrent requests
            processingImages.add(imageKey);

            try {
                // Process the image upload and wait for completion
                const permanentUrl = await this.processImageUpload(adminClient, image_id, data.result.sample, imageKey);

                // Return the permanent URL
                return createSuccessResponse({
                    status: 'Ready',
                    image_url: permanentUrl
                });

            } catch (error) {
                processingImages.delete(imageKey);
                throw error;
            }
        }

        // If the image is still pending, return the status and progress
        return createSuccessResponse({
            status: data.status,
            progress: data.progress
        });
    }

    private async processImageUpload(adminClient: any, image_id: number, sampleUrl: string, imageKey: string): Promise<string> {
        try {
            // Download the image from the temporary URL
            const imageResponse = await fetch(sampleUrl);

            if (!imageResponse.ok)
                throw new Error(`Failed to download image: ${imageResponse.status}`);

            const imageBuffer = await imageResponse.arrayBuffer();
            const fileExt = this.getFileExtensionFromUrl(sampleUrl);
            const filename = `image-${image_id}.${fileExt}`;
            const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

            // Upload to Supabase Storage
            const { error: uploadError } = await adminClient.storage
                .from('generated-images')
                .upload(filename, imageBuffer, {
                    contentType,
                    cacheControl: (31536000 * 5).toString(),
                    upsert: true
                });

            if (uploadError)
                throw new Error(`Error uploading to storage: ${uploadError.message}`);

            // Get public URL for the uploaded image
            const { data: publicUrlData } = adminClient.storage
                .from('generated-images')
                .getPublicUrl(filename);

            const permanentImageUrl = publicUrlData.publicUrl;

            // Update the database with the permanent image URL
            const { error: updateError } = await adminClient
                .from('generated_images')
                .update({
                    image_url: permanentImageUrl,
                    status: 'completed'
                })
                .eq('id', image_id);

            if (updateError) {
                throw new Error(`Error updating image record: ${updateError.message}`);
            }

            return permanentImageUrl;

        } catch (error) {

            // Update status to error in case of failure
            await adminClient
                .from('generated_images')
                .update({
                    status: 'error',
                    error_message: error instanceof Error ? error.message : 'Failed to process image upload'
                })
                .eq('id', image_id);

            throw error;

        } finally {
            // Always remove from processing set when done
            processingImages.delete(imageKey);
        }
    }

    private getFileExtensionFromUrl(url: string): string {
        try {
            const parsedUrl = new URL(url);
            const pathname = parsedUrl.pathname;
            const lastDotIndex = pathname.lastIndexOf('.');

            if (lastDotIndex !== -1) {
                return pathname.substring(lastDotIndex + 1).toLowerCase();
            }

            // Default to png if no extension found
            return 'png';

        } catch (error) {
            throw new Error('Error getting file extension from URL ' + url + ' - ' + error);
        }
    }

    async deleteImage(image_id: number): Promise<ReturnType<typeof createSuccessResponse>> {
        const adminClient = await createSupabaseAdminClient();

        // Get the image record to find the storage path
        const { data: imageRecords, error: fetchError } = await adminClient
            .from('generated_images')
            .select('image_url')
            .eq('id', image_id);

        if (fetchError)
            throw new Error(`[Delete Image] Error fetching image record: ${fetchError.message}`);

        // Since id is a primary key, we should only ever get 0 or 1 record
        const imageRecord = imageRecords && imageRecords.length > 0 ? imageRecords[0] : null;

        // If the image has a URL, try to delete it from storage
        if (imageRecord?.image_url) {
            try {
                // Extract the filename from the URL
                const url = new URL(imageRecord.image_url);
                const pathParts = url.pathname.split('/');
                const filename = pathParts[pathParts.length - 1];

                if (filename) {
                    // Delete from storage bucket
                    const { error: storageError } = await adminClient.storage
                        .from('generated-images')
                        .remove([filename]);

                    if (storageError) {
                        throw new Error(`Error deleting from storage: ${storageError.message}`);
                    }
                }
            } catch (error) {
                throw new Error('Error parsing image URL or deleting from storage: ' + error);
            }
        }

        // Delete the image record from the database
        const { error } = await adminClient
            .from('generated_images')
            .delete()
            .eq('id', image_id);

        if (error)
            throw new Error(`Error deleting image record: ${error.message}`);

        return createSuccessResponse({
            success: true,
            message: 'Image deleted successfully'
        });
    }

    async generateImage(prompt: string, aspect_ratio: string, enhance_by_sam_ovens: boolean, model: string, image_id?: number): Promise<ReturnType<typeof createSuccessResponse>> {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user)
            throw new Error('User not authenticated');

        const adminClient = await createSupabaseAdminClient();

        // If image_id is provided, we're regenerating an existing image
        if (image_id) {

            // Fetch the original image to get its aspect ratio
            const { data: existingImage, error: fetchError } = await adminClient
                .from('generated_images')
                .select('aspect_ratio')
                .eq('id', image_id)
                .single();

            if (fetchError)
                throw new Error(`Error fetching original image: ${fetchError.message}`);

            const data = await generateFluxImage(prompt, existingImage.aspect_ratio, enhance_by_sam_ovens, model);

            const { data: imageRecord, error } = await adminClient
                .from('generated_images')
                .insert({
                    user_id: user.id,
                    prompt: prompt,
                    flux_task_id: data.id,
                    aspect_ratio: existingImage.aspect_ratio,
                    status: 'pending'
                })
                .select('id')
                .single();

            if (error)
                throw new Error(`Error saving to database: ${error.message}`);

            return createSuccessResponse({
                task_id: data.id,
                image_id: imageRecord.id
            });
        }

        // Otherwise, generate a new image
        // Call the Flux API to generate the image
        const data = await generateFluxImage(prompt, aspect_ratio, enhance_by_sam_ovens, model);

        // Store the task in Supabase
        const { data: imageRecord, error } = await adminClient
            .from('generated_images')
            .insert({
                user_id: user.id,
                prompt: prompt,
                flux_task_id: data.id,
                aspect_ratio: aspect_ratio,
                status: 'pending'
            })
            .select('id')
            .single();

        if (error)
            throw new Error(`Error saving to database: ${error.message}`);

        return createSuccessResponse({
            task_id: data.id,
            image_id: imageRecord.id
        });
    }

    async listImages(): Promise<ReturnType<typeof createSuccessResponse>> {
        const adminClient = await createSupabaseAdminClient();

        // Get all image records from the database
        const { data: imageRecords, error } = await adminClient
            .from('generated_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error)
            throw new Error(`[List Images] Error fetching image records: ${error.message}`);

        return createSuccessResponse({
            images: imageRecords || []
        });
    }

    async updateImage(image_id: number, prompt: string): Promise<ReturnType<typeof createSuccessResponse>> {
        const adminClient = await createSupabaseAdminClient();

        // Update the image prompt in the database
        const { error } = await adminClient
            .from('generated_images')
            .update({
                prompt: prompt
            })
            .eq('id', image_id);

        if (error)
            throw new Error(`Error updating image prompt: ${error.message}`);

        return createSuccessResponse({
            success: true,
            message: 'Image prompt updated successfully'
        });
    }
} 