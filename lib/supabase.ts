import { createClient } from '@supabase/supabase-js';

// Mengambil kunci rahasia dari file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Membuat jembatan (client) ke database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);