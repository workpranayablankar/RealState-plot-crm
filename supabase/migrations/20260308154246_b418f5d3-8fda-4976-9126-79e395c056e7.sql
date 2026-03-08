
-- Create call_history table
CREATE TABLE public.call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  call_date timestamptz NOT NULL DEFAULT now(),
  duration text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- RLS for call_history
CREATE POLICY "Admins can manage call_history" ON public.call_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own call_history" ON public.call_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own call_history" ON public.call_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Telecaller RLS policies on leads
CREATE POLICY "Telecallers can view assigned leads" ON public.leads FOR SELECT TO authenticated USING (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can update assigned leads" ON public.leads FOR UPDATE TO authenticated USING (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'telecaller') AND (assigned_agent = auth.uid() OR assigned_agent IS NULL));

-- Telecaller RLS on plots (view only)
CREATE POLICY "Telecallers can view plots" ON public.plots FOR SELECT TO authenticated USING (has_role(auth.uid(), 'telecaller'));

-- Telecaller RLS on follow_ups
CREATE POLICY "Telecallers can view own follow_ups" ON public.follow_ups FOR SELECT TO authenticated USING (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can insert follow_ups" ON public.follow_ups FOR INSERT TO authenticated WITH CHECK (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can update own follow_ups" ON public.follow_ups FOR UPDATE TO authenticated USING (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can delete own follow_ups" ON public.follow_ups FOR DELETE TO authenticated USING (assigned_agent = auth.uid() AND has_role(auth.uid(), 'telecaller'));

-- Telecaller RLS on activities
CREATE POLICY "Telecallers can view own activities" ON public.activities FOR SELECT TO authenticated USING (user_id = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'telecaller'));

-- Telecaller RLS on notifications
CREATE POLICY "Telecallers can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() AND has_role(auth.uid(), 'telecaller'));

-- Telecaller can view own profile and roles
CREATE POLICY "Telecallers can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id AND has_role(auth.uid(), 'telecaller'));
CREATE POLICY "Telecallers can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id AND has_role(auth.uid(), 'telecaller'));

-- Enable realtime for call_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_history;
