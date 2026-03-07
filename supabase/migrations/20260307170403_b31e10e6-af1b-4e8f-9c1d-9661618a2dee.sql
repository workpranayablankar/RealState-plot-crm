
-- Create plot_status enum
CREATE TYPE public.plot_status AS ENUM ('Available', 'Booked', 'Sold');

-- Create plots table
CREATE TABLE public.plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_name text NOT NULL,
  plot_no text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT '',
  status plot_status NOT NULL DEFAULT 'Available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage plots" ON public.plots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Agents can view plots
CREATE POLICY "Agents can view plots" ON public.plots FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'agent'));

-- Trigger for updated_at
CREATE TRIGGER update_plots_updated_at
  BEFORE UPDATE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add interested_plot column to leads (references plots)
ALTER TABLE public.leads ADD COLUMN interested_plot uuid REFERENCES public.plots(id);
