
-- Create system_preferences table (single-row config)
CREATE TABLE public.system_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'My Real Estate CRM',
  currency text NOT NULL DEFAULT '₹',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  default_lead_status text NOT NULL DEFAULT 'New Lead',
  default_assignment text NOT NULL DEFAULT 'manual',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_preferences" ON public.system_preferences
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view system_preferences" ON public.system_preferences
  FOR SELECT TO authenticated USING (true);

-- Seed default
INSERT INTO public.system_preferences (company_name) VALUES ('My Real Estate CRM');

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL UNIQUE,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT false,
  sms boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification_preferences" ON public.notification_preferences
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view notification_preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (true);

-- Seed defaults
INSERT INTO public.notification_preferences (event_type, in_app, email) VALUES
  ('new_lead_assigned', true, true),
  ('follow_up_reminder', true, true),
  ('site_visit_scheduled', true, false),
  ('deal_closed', true, true);
