import { localSecrets } from './environment.local';

export const environment = {
  production: false,
  rawg: {
    apiUrl: 'https://api.rawg.io/api',
    apiKey: localSecrets.rawg.apiKey,
    pageSize: 20,
    syncWithSupabase: true
  },
  supabase: {
    url: localSecrets.supabase.url,
    anonKey: localSecrets.supabase.anonKey
  }
};
