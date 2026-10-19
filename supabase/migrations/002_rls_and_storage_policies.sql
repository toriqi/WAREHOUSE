-- ============================================================================
-- VOTP REQUEST MATERIAL WEB APP
-- Migration 002: Row Level Security (RLS) & Storage Bucket Policies
-- ============================================================================

-- Helper functions to verify current authenticated user role from profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
$$;

CREATE OR REPLACE FUNCTION public.is_ass_cop()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ASS_COP' AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_whs()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'WHS' AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ngc()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'NGC' AND is_active = TRUE
  );
$$;

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Authenticated active users can read profiles; users cannot self-escalate roles.
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own_basic_or_ass_cop"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_ass_cop())
  WITH CHECK (
    public.is_ass_cop() OR (
      id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- 2. APP SETTINGS POLICIES (Read by all authenticated + login branding; Update ONLY by ASS_COP)
CREATE POLICY "app_settings_select_all"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "app_settings_update_ass_cop_only"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (public.is_ass_cop())
  WITH CHECK (public.is_ass_cop());

-- 3. REQUESTS POLICIES
-- ASS_COP: Full read/create/update access
-- WHS: Read non-draft requests; Update operational status (COLLECT, READY, RECEIVED, CANCELLED_BY_WHS)
-- NGC: Read WARRANTY requests
CREATE POLICY "requests_select_by_role"
  ON public.requests FOR SELECT
  TO authenticated
  USING (
    public.is_ass_cop()
    OR (public.is_whs() AND status <> 'DRAFT')
    OR (public.is_ngc() AND request_type = 'WARRANTY')
  );

CREATE POLICY "requests_insert_ass_cop_only"
  ON public.requests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_ass_cop() AND created_by = auth.uid());

CREATE POLICY "requests_update_ass_cop_or_whs"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (
    public.is_ass_cop()
    OR (public.is_whs() AND status IN ('SENT_TO_WHS', 'COLLECT', 'READY'))
  )
  WITH CHECK (
    public.is_ass_cop()
    OR (
      public.is_whs()
      AND status IN ('COLLECT', 'READY', 'RECEIVED', 'CANCELLED_BY_WHS')
    )
  );

-- 4. REQUEST REVISIONS POLICIES
CREATE POLICY "request_revisions_select_authenticated"
  ON public.request_revisions FOR SELECT
  TO authenticated
  USING (public.is_ass_cop() OR public.is_whs() OR public.is_ngc());

CREATE POLICY "request_revisions_insert_ass_cop_only"
  ON public.request_revisions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_ass_cop() AND revised_by = auth.uid());

-- 5. WAREHOUSE EVENTS POLICIES
CREATE POLICY "warehouse_events_select_authenticated"
  ON public.warehouse_events FOR SELECT
  TO authenticated
  USING (public.is_ass_cop() OR public.is_whs() OR public.is_ngc());

CREATE POLICY "warehouse_events_insert_ass_or_whs"
  ON public.warehouse_events FOR INSERT
  TO authenticated
  WITH CHECK ((public.is_ass_cop() OR public.is_whs()) AND actor_id = auth.uid());

-- 6. WAREHOUSE CASES (CASE OPEN) POLICIES
CREATE POLICY "warehouse_cases_select_ass_or_whs"
  ON public.warehouse_cases FOR SELECT
  TO authenticated
  USING (public.is_ass_cop() OR public.is_whs());

CREATE POLICY "warehouse_cases_update_whs_or_ass"
  ON public.warehouse_cases FOR UPDATE
  TO authenticated
  USING (public.is_ass_cop() OR public.is_whs())
  WITH CHECK (
    public.is_ass_cop()
    OR (
      -- WHS can populate root_cause and corrective_action; closing requires ASS_COP unless policy allows
      public.is_whs() AND status = 'OPEN'
    )
  );

-- 7. WARRANTY ANALYSES POLICIES (NGC & ASS_COP)
CREATE POLICY "warranty_analyses_select_role"
  ON public.warranty_analyses FOR SELECT
  TO authenticated
  USING (public.is_ass_cop() OR public.is_ngc() OR public.is_whs());

CREATE POLICY "warranty_analyses_insert_ngc_or_ass"
  ON public.warranty_analyses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_ngc() OR public.is_ass_cop());

CREATE POLICY "warranty_analyses_update_ngc_or_ass"
  ON public.warranty_analyses FOR UPDATE
  TO authenticated
  USING (public.is_ngc() OR public.is_ass_cop())
  WITH CHECK (public.is_ngc() OR public.is_ass_cop());

-- 8. NOTIFICATIONS POLICIES (Only recipient user or matching recipient_role can read/mark read)
CREATE POLICY "notifications_select_recipient_only"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid()
    OR recipient_role = public.get_current_user_role()
  );

CREATE POLICY "notifications_update_read_recipient_only"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid()
    OR recipient_role = public.get_current_user_role()
  )
  WITH CHECK (
    recipient_id = auth.uid()
    OR recipient_role = public.get_current_user_role()
  );

CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. AUDIT LOGS POLICIES (Append-only, immutable; no UPDATE or DELETE policies exist)
CREATE POLICY "audit_logs_select_ass_cop_or_actor"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_ass_cop() OR actor_id = auth.uid());

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- 10. SUPABASE STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('branding', 'branding', TRUE, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('warranty-evidence', 'warranty-evidence', FALSE, 10485760, ARRAY['image/png', 'image/jpeg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'branding');

CREATE POLICY "branding_ass_cop_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding' AND public.is_ass_cop());

CREATE POLICY "branding_ass_cop_update_delete"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'branding' AND public.is_ass_cop());

CREATE POLICY "warranty_evidence_read_authorized"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'warranty-evidence' AND (public.is_ngc() OR public.is_ass_cop()));

CREATE POLICY "warranty_evidence_ngc_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'warranty-evidence' AND public.is_ngc());
