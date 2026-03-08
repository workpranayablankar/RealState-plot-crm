-- Allow admins to delete follow_ups (the ALL policy is restrictive, add permissive DELETE)
-- First check: the admin ALL policy already covers DELETE if permissive
-- Let's verify and add explicit delete policy
CREATE POLICY "Admins can delete follow_ups"
ON public.follow_ups FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));