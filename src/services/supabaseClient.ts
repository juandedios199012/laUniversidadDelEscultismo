import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://TU_PROJECT_URL.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TU_PUBLIC_ANON_KEY'
);
