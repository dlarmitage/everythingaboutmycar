-- Update documents table to reference service_records instead of maintenance_records
-- Drop the old foreign key constraint
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_maintenance_record_id_fkey;

-- Rename the column from maintenance_record_id to service_record_id
ALTER TABLE public.documents RENAME COLUMN maintenance_record_id TO service_record_id;

-- Add the new foreign key constraint to service_records
ALTER TABLE public.documents 
ADD CONSTRAINT documents_service_record_id_fkey 
FOREIGN KEY (service_record_id) REFERENCES public.service_records(id) ON DELETE SET NULL;
