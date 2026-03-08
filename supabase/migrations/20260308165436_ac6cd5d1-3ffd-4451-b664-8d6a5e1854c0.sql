ALTER TABLE public.leads ADD COLUMN contacted_by uuid DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN contacted_at timestamp with time zone DEFAULT NULL;