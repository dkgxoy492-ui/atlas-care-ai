-- Create profiles table for user health data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  profile_photo_url TEXT,
  emergency_contact_1_name TEXT,
  emergency_contact_1_phone TEXT,
  emergency_contact_1_relation TEXT,
  emergency_contact_2_name TEXT,
  emergency_contact_2_phone TEXT,
  emergency_contact_2_relation TEXT,
  medical_history JSONB DEFAULT '{"allergies": [], "chronic_conditions": [], "medications": []}'::jsonb,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_language TEXT DEFAULT 'en',
  data_collection_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create daily routines table
CREATE TABLE IF NOT EXISTS public.daily_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  routine_date DATE NOT NULL DEFAULT CURRENT_DATE,
  yoga_exercises JSONB DEFAULT '[]'::jsonb,
  diet_plan JSONB DEFAULT '{"breakfast": [], "lunch": [], "dinner": [], "snacks": []}'::jsonb,
  hydration_goal_ml INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, routine_date)
);

-- Enable RLS
ALTER TABLE public.daily_routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own routines"
  ON public.daily_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines"
  ON public.daily_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
  ON public.daily_routines FOR UPDATE
  USING (auth.uid() = user_id);

-- Create routine completions tracking
CREATE TABLE IF NOT EXISTS public.routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  routine_id UUID REFERENCES public.daily_routines(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('yoga', 'meal', 'hydration')),
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own completions"
  ON public.routine_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.routine_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create AI chat logs for monitoring
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  input_text TEXT NOT NULL,
  output_text TEXT,
  confidence_score INTEGER,
  sources JSONB DEFAULT '[]'::jsonb,
  body_part TEXT,
  language TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only view their own logs)
CREATE POLICY "Users can view their own chat logs"
  ON public.ai_chat_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs"
  ON public.ai_chat_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_routines_updated_at
  BEFORE UPDATE ON public.daily_routines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();