-- Allow agents to insert plots
CREATE POLICY "Agents can insert plots"
ON public.plots FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));