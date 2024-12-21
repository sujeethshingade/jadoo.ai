import { createClient } from '@supabase/supabase-js';

// Validate environment variables are present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing Supabase URL. Please check your environment variables.');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase Anon Key. Please check your environment variables.');
}

// Create Supabase client with authentication configuration
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
    }
);