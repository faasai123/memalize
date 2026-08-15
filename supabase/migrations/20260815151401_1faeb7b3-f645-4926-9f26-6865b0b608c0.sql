CREATE TABLE public.survey_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gender text,
  age_group text,
  ratings jsonb NOT NULL,
  groups jsonb NOT NULL,
  collected text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.survey_results TO authenticated;
GRANT ALL ON public.survey_results TO service_role;

ALTER TABLE public.survey_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own survey results"
  ON public.survey_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own survey results"
  ON public.survey_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX survey_results_user_created_idx ON public.survey_results (user_id, created_at DESC);