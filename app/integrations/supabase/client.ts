import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://bicjjpxzvgeqqzujhxfo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY2pqcHh6dmdlcXF6dWpoeGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzcyNDUsImV4cCI6MjA2NDI1MzI0NX0.n_azq_On3EKwkkzDqvv6268_OEi4NBaRtJCIzOz0dC0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
