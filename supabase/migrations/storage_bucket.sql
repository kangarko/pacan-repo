INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-thumbnails', 'offer-thumbnails', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-files', 'offer-files', true);

-- Bucket for webinar background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('webinar-backgrounds', 'webinar-backgrounds', true);

CREATE POLICY "Public Access to Generated Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Public Access to Offer Thumbnails" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'offer-thumbnails');

CREATE POLICY "Public Access to Offer Files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'offer-files');

CREATE POLICY "Public Access to Webinar Backgrounds" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'webinar-backgrounds');

CREATE POLICY "Authenticated Users Can Upload Images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Authenticated Users Can Upload Thumbnails" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'offer-thumbnails');

CREATE POLICY "Authenticated Users Can Upload Files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'offer-files');

CREATE POLICY "Admin Users Can Update Images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'generated-images' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
);

CREATE POLICY "Admin Users Can Update Thumbnails" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'offer-thumbnails' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
);

CREATE POLICY "Admin Users Can Update Files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'offer-files' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
);

CREATE POLICY "Admin Users Can Delete Images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'generated-images' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
);

CREATE POLICY "Admin Users Can Delete Thumbnails" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'offer-thumbnails' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
);

CREATE POLICY "Admin Users Can Delete Files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'offer-files' AND 
    (auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.raw_user_meta_data->>'role' = 'admin'))
); 