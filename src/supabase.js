import { createClient } from '@supabase/supabase-js';

// Supabase Anon Key is a PUBLIC key, safe to include in frontend code
// See: https://supabase.com/docs/guides/api/api-keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sxmpsrlysmxuldqyridd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bXBzcmx5c214dWxkcXlyaWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjI3ODcsImV4cCI6MjEwMTgzODc4N30.aka9O6aeHprUHZ8rk41URFnfIawAb6GSL6yht4pwdQw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
