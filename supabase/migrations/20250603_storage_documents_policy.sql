-- Create storage policy for documents bucket
-- This policy allows authenticated users to upload, read, update and delete their own files

-- Policy for inserting files (uploading)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Documents Insert Policy',
  'documents',
  '(bucket_id = ''documents'' AND auth.role() = ''authenticated'')'
);

-- Policy for selecting files (viewing)
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Documents Select Policy',
  'documents',
  '(bucket_id = ''documents'' AND auth.role() = ''authenticated'')',
  'SELECT'
);

-- Policy for updating files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Documents Update Policy',
  'documents',
  '(bucket_id = ''documents'' AND auth.role() = ''authenticated'')',
  'UPDATE'
);

-- Policy for deleting files
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Documents Delete Policy',
  'documents',
  '(bucket_id = ''documents'' AND auth.role() = ''authenticated'')',
  'DELETE'
);
