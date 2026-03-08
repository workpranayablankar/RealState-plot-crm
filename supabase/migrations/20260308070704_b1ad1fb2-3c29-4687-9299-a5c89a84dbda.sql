
-- Add phone and is_active to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create lead_statuses table for customizable pipeline
CREATE TABLE public.lead_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- Only admins can manage lead statuses
CREATE POLICY "Admins can manage lead_statuses" ON public.lead_statuses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view lead statuses
CREATE POLICY "Authenticated users can view lead_statuses" ON public.lead_statuses
  FOR SELECT TO authenticated USING (true);

-- Seed default statuses
INSERT INTO public.lead_statuses (label, sort_order, is_default) VALUES
  ('New Lead', 1, true),
  ('Contacted', 2, true),
  ('Interested', 3, true),
  ('Site Visit Scheduled', 4, true),
  ('Negotiation', 5, true),
  ('Deal Closed', 6, true),
  ('Not Interested', 7, true),
  ('Follow Up Later', 8, true);
