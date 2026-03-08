
-- Add address column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address text DEFAULT '';

-- Add new values to lead_source enum
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'Facebook';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'Instagram';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'Referral';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'Direct Call';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'Other';
