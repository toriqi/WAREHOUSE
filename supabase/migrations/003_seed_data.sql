-- ============================================================================
-- VOTP REQUEST MATERIAL WEB APP
-- Migration 003: Development Seed Data (App Settings & Reference Configuration)
-- ============================================================================

INSERT INTO public.app_settings (
  singleton_key,
  app_name,
  app_subtitle,
  logo_path,
  primary_color,
  warehouse_lead_time_minutes,
  lead_time_start_event,
  lead_time_end_event,
  case_close_policy,
  cancel_reasons,
  notify_ass_on_cancel,
  default_export_format
) VALUES (
  'GLOBAL_CONFIG',
  'VOTP Request Material Portal',
  'Integrated ASS/COP, Warehouse SLA & NGC Warranty Management',
  NULL,
  'blue',
  25,
  'SENT_TO_WHS',
  'READY',
  'ASS_COP_VERIFY',
  '["Stok kosong", "Quantity tidak cukup", "Part rusak", "Lokasi tidak sesuai", "DO/TO bermasalah", "Lainnya"]'::jsonb,
  TRUE,
  'XLSX'
)
ON CONFLICT (singleton_key) DO NOTHING;

-- Note: After creating 3 users in Supabase Auth:
-- 1. ass.cop@company.co.id (Role: ASS_COP)
-- 2. whs.ops@company.co.id (Role: WHS)
-- 3. ngc.warranty@company.co.id (Role: NGC)
-- Map their auth.users UUIDs into public.profiles using an authorized administrator SQL execution.
