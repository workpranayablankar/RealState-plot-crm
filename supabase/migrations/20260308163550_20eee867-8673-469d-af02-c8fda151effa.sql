
-- Allow service role to delete notifications (add permissive delete policy)
CREATE POLICY "Service can delete old notifications"
  ON public.notifications FOR DELETE
  TO service_role
  USING (true);

-- Allow service role to delete activities
CREATE POLICY "Service can delete old activities"
  ON public.activities FOR DELETE
  TO service_role
  USING (true);

-- Allow service role to delete call_history
CREATE POLICY "Service can delete old call_history"
  ON public.call_history FOR DELETE
  TO service_role
  USING (true);

-- Allow service role to delete leads
CREATE POLICY "Service can delete old leads"
  ON public.leads FOR DELETE
  TO service_role
  USING (true);
