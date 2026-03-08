
-- Create lead_sources table
CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead_sources" ON public.lead_sources
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view lead_sources" ON public.lead_sources
  FOR SELECT TO authenticated USING (true);

-- Seed defaults
INSERT INTO public.lead_sources (label, sort_order) VALUES
  ('Website', 1),
  ('Facebook Ads', 2),
  ('Google Ads', 3),
  ('WhatsApp', 4),
  ('Manual Entry', 5),
  ('Referral', 6);

-- Create assignment_settings table (single-row config)
CREATE TABLE public.assignment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL DEFAULT 'manual' CHECK (method IN ('round_robin', 'manual')),
  last_assigned_index integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignment_settings" ON public.assignment_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view assignment_settings" ON public.assignment_settings
  FOR SELECT TO authenticated USING (true);

-- Seed default config
INSERT INTO public.assignment_settings (method) VALUES ('manual');
