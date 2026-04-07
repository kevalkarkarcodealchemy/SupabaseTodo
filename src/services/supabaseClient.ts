import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wbvavbbgvlpdukrnhxlb.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndidmF2YmJndmxwZHVrcm5oeGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzQ3MDksImV4cCI6MjA4NTk1MDcwOX0.Edcrsyk1E1eoahbru3EtKVrBVUFLPv2KQvRF7i0erxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
