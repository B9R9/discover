// Gives the Supabase client a localStorage backed by SQLite: SecureStore caps values at 2 KB, a session often goes over.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Exception to "the app only talks to our API": Supabase Auth handles sign-in and the session, nothing else.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh the session only while the app is in front, as Supabase recommends for React Native.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
