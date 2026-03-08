-- Drop all existing RESTRICTIVE policies on leads
DROP POLICY IF EXISTS "Admins can do everything with leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can insert leads" ON public.leads;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can do everything with leads"
ON public.leads FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view assigned leads"
ON public.leads FOR SELECT TO authenticated
USING (assigned_agent = auth.uid());

CREATE POLICY "Agents can update assigned leads"
ON public.leads FOR UPDATE TO authenticated
USING (assigned_agent = auth.uid());

CREATE POLICY "Agents can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role)
  AND (assigned_agent = auth.uid() OR assigned_agent IS NULL)
);