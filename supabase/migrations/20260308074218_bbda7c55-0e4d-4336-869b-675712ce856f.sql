-- Allow agents to insert new leads (self-assigned)
CREATE POLICY "Agents can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role)
  AND (assigned_agent = auth.uid() OR assigned_agent IS NULL)
);