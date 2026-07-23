-- =========================================================================================
-- CREATE STORAGE BUCKET FOR HR DOCUMENTS
-- =========================================================================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'hr-documents');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'hr-documents' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their files (optional)
CREATE POLICY "Authenticated users can update files" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'hr-documents' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files (optional)
CREATE POLICY "Authenticated users can delete files" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'hr-documents' 
    AND auth.role() = 'authenticated'
);
