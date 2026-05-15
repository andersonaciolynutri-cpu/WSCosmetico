import { supabase } from '../lib/supabaseClient';
import { AppSettings } from '../types';

export const settingsService = {
  async getAppSettings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'main')
      .single();

    // If it doesn't exist, we might need a fallback or create it
    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;
    return data as AppSettings;
  },

  async updateAppSettings(settings: Partial<AppSettings>) {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        { 
          id: 'main', 
          ...settings, 
          updated_at: new Date().toISOString() 
        }, 
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as AppSettings;
  }
};
