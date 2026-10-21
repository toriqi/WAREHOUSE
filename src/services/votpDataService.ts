import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Full-Stack Supabase Database & Storage Service Layer
 * Connects all UI actions to PostgreSQL tables with RLS enforcement when
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
 */
export const votpDataService = {
  isLive: isSupabaseConfigured,

  async fetchAllAppData() {
    if (!supabase) return null;
    const [
      { data: settings, error: settingsErr },
      { data: profiles, error: profilesErr },
      { data: requests, error: reqErr },
      { data: revisions, error: revErr },
      { data: events, error: evtErr },
      { data: cases, error: caseErr },
      { data: warranties, error: warErr },
      { data: notifications, error: notifErr },
      { data: auditLogs, error: audErr }
    ] = await Promise.all([
      supabase.from('app_settings').select('*').eq('singleton_key', 'GLOBAL_CONFIG').single(),
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('request_revisions').select('*').order('revised_at', { ascending: false }),
      supabase.from('warehouse_events').select('*').order('occurred_at', { ascending: false }),
      supabase.from('warehouse_cases').select('*').order('opened_at', { ascending: false }),
      supabase.from('warranty_analyses').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
    ]);

    if (reqErr) throw reqErr;
    return {
      settings,
      profiles: profiles || [],
      requests: requests || [],
      revisions: revisions || [],
      events: events || [],
      cases: cases || [],
      warranties: warranties || [],
      notifications: notifications || [],
      auditLogs: auditLogs || [],
      errors: [settingsErr, profilesErr, revErr, evtErr, caseErr, warErr, notifErr, audErr].filter(Boolean)
    };
  },

  async uploadBrandLogo(file: File): Promise<string | null> {
    if (!supabase) return null;
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `logos/brand-logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('branding').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    const { data } = supabase.storage.from('branding').getPublicUrl(filePath);
    return data.publicUrl;
  }
};
