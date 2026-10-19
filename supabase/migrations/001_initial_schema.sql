-- ============================================================================
-- VOTP REQUEST MATERIAL WEB APP
-- Migration 001: Core Relational Schema, Constraints, Indexes & Triggers
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ASS_COP', 'WHS', 'NGC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_type_enum AS ENUM ('NORMAL', 'WARRANTY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM (
    'DRAFT',
    'PROCESSED',
    'SENT_TO_WHS',
    'COLLECT',
    'READY',
    'RECEIVED',
    'CANCELLED_BY_WHS',
    'ACTION_REQUIRED_ASS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE warehouse_event_type_enum AS ENUM (
    'SENT_TO_WHS',
    'COLLECT',
    'READY',
    'RECEIVED',
    'CANCELLED_BY_WHS',
    'REVISED_RESENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE case_status_enum AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE warranty_status_enum AS ENUM (
    'NOT_APPLICABLE',
    'WARRANTY_PENDING',
    'WARRANTY_APPROVED',
    'WARRANTY_REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. PROFILES TABLE (No separate Admin role; only ASS_COP, WHS, NGC)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'WHS',
  unit_assignment TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. APP SETTINGS TABLE (Managed exclusively by ASS_COP)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'GLOBAL_CONFIG' CHECK (singleton_key = 'GLOBAL_CONFIG'),
  app_name TEXT NOT NULL DEFAULT 'VOTP Material Request System',
  app_subtitle TEXT NOT NULL DEFAULT 'Enterprise Spare Part, Warehouse SLA & Warranty Portal',
  logo_path TEXT,
  primary_color TEXT NOT NULL DEFAULT 'blue' CHECK (primary_color IN ('blue', 'indigo', 'slate', 'emerald', 'violet')),
  warehouse_lead_time_minutes INTEGER NOT NULL DEFAULT 25 CHECK (warehouse_lead_time_minutes BETWEEN 1 AND 1440),
  lead_time_start_event TEXT NOT NULL DEFAULT 'SENT_TO_WHS' CHECK (lead_time_start_event IN ('SENT_TO_WHS', 'COLLECT')),
  lead_time_end_event TEXT NOT NULL DEFAULT 'READY' CHECK (lead_time_end_event IN ('READY', 'RECEIVED')),
  case_close_policy TEXT NOT NULL DEFAULT 'ASS_COP_VERIFY' CHECK (case_close_policy IN ('ASS_COP_VERIFY', 'WHS_DIRECT_WITH_NOTE')),
  cancel_reasons JSONB NOT NULL DEFAULT '["Stok kosong", "Quantity tidak cukup", "Part rusak", "Lokasi tidak sesuai", "DO/TO bermasalah", "Lainnya"]'::jsonb,
  notify_ass_on_cancel BOOLEAN NOT NULL DEFAULT TRUE,
  default_export_format TEXT NOT NULL DEFAULT 'XLSX' CHECK (default_export_format IN ('CSV', 'XLSX')),
  allowed_export_columns JSONB NOT NULL DEFAULT '["request_number","request_date","source_votp_url","requester","unit","request_type","wo_number","po_number","do_number","to_number","material_id","part_number","description","requested_qty","supplied_qty","status","warranty_status","sent_to_whs_at","collect_at","ready_at","received_at","lead_time_minutes","sla_status","case_status","cancel_reason","current_revision","created_by","updated_at"]'::jsonb,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_votp_url TEXT NOT NULL CHECK (source_votp_url ~* '^https?://'),
  requester TEXT NOT NULL CHECK (char_length(trim(requester)) >= 2),
  unit TEXT NOT NULL CHECK (char_length(trim(unit)) >= 1),
  request_type request_type_enum NOT NULL DEFAULT 'NORMAL',
  wo_number TEXT,
  po_number TEXT,
  do_number TEXT,
  to_number TEXT,
  material_id TEXT NOT NULL,
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_qty NUMERIC(12,2) NOT NULL CHECK (requested_qty > 0),
  supplied_qty NUMERIC(12,2) CHECK (supplied_qty IS NULL OR supplied_qty >= 0),
  additional_notes TEXT,
  warranty_note TEXT,
  operational_notes TEXT,
  recipient_name TEXT,
  cancel_reason TEXT,
  cancel_notes TEXT,
  cancelled_by UUID REFERENCES public.profiles(id),
  cancelled_at TIMESTAMPTZ,
  ass_evaluation_note TEXT,
  warranty_followup_wo_gi TEXT,
  status request_status_enum NOT NULL DEFAULT 'DRAFT',
  warranty_status warranty_status_enum NOT NULL DEFAULT 'NOT_APPLICABLE',
  current_revision INTEGER NOT NULL DEFAULT 0 CHECK (current_revision >= 0),
  target_lead_time_snapshot INTEGER NOT NULL DEFAULT 25,
  actual_lead_time_minutes NUMERIC(10,2),
  sent_to_whs_at TIMESTAMPTZ,
  collect_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_wo_or_po_present CHECK (
    status = 'DRAFT' OR
    (COALESCE(NULLIF(trim(wo_number), ''), NULLIF(trim(po_number), '')) IS NOT NULL)
  ),
  CONSTRAINT chk_warranty_note_when_warranty CHECK (
    request_type = 'NORMAL' OR (warranty_note IS NOT NULL AND char_length(trim(warranty_note)) >= 3)
  ),
  CONSTRAINT uq_votp_material_active UNIQUE (source_votp_url, material_id, part_number)
);

-- 5. REQUEST REVISIONS TABLE (Preserves full history across multiple WHS attempts)
CREATE TABLE IF NOT EXISTS public.request_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  previous_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  previous_do_number TEXT,
  new_do_number TEXT,
  previous_to_number TEXT,
  new_to_number TEXT,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  revision_reason TEXT NOT NULL CHECK (char_length(trim(revision_reason)) >= 3),
  revised_by UUID NOT NULL REFERENCES public.profiles(id),
  revised_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, revision_number)
);

-- 6. WAREHOUSE EVENTS TABLE (Granular operational event history per attempt/revision)
CREATE TABLE IF NOT EXISTS public.warehouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES public.request_revisions(id) ON DELETE SET NULL,
  revision_number INTEGER NOT NULL DEFAULT 0,
  event_type warehouse_event_type_enum NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  supplied_qty NUMERIC(12,2),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WAREHOUSE CASES TABLE (Case Open on SLA Breach)
CREATE TABLE IF NOT EXISTS public.warehouse_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES public.request_revisions(id) ON DELETE SET NULL,
  revision_number INTEGER NOT NULL DEFAULT 0,
  target_minutes_snapshot INTEGER NOT NULL CHECK (target_minutes_snapshot > 0),
  actual_minutes NUMERIC(10,2) NOT NULL CHECK (actual_minutes >= 0),
  delay_minutes NUMERIC(10,2) NOT NULL CHECK (delay_minutes > 0),
  root_cause TEXT,
  corrective_action TEXT,
  close_note TEXT,
  pic_id UUID REFERENCES public.profiles(id),
  pic_name TEXT,
  status case_status_enum NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by UUID REFERENCES public.profiles(id),
  closed_at TIMESTAMPTZ,
  CONSTRAINT chk_case_close_requires_note CHECK (
    status = 'OPEN' OR (
      close_note IS NOT NULL AND char_length(trim(close_note)) >= 5
      AND root_cause IS NOT NULL AND char_length(trim(root_cause)) >= 3
      AND corrective_action IS NOT NULL AND char_length(trim(corrective_action)) >= 3
    )
  ),
  -- Prevent duplicate Case Open for the same request and revision attempt
  CONSTRAINT uq_case_per_request_revision UNIQUE (request_id, revision_number)
);

-- 8. WARRANTY ANALYSES TABLE (Parallel NGC Workflow)
CREATE TABLE IF NOT EXISTS public.warranty_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  analysis_status warranty_status_enum NOT NULL DEFAULT 'WARRANTY_PENDING',
  findings TEXT,
  evidence_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_reason TEXT,
  analyst_id UUID REFERENCES public.profiles(id),
  decided_at TIMESTAMPTZ,
  followup_required BOOLEAN NOT NULL DEFAULT FALSE,
  followup_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_rejection_requires_reason CHECK (
    analysis_status <> 'WARRANTY_REJECTED' OR (
      decision_reason IS NOT NULL AND char_length(trim(decision_reason)) >= 5
    )
  )
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role user_role,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE (Immutable System Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_unit ON public.requests(unit);
CREATE INDEX IF NOT EXISTS idx_requests_date ON public.requests(request_date DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_req ON public.warehouse_events(request_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_cases_status ON public.warehouse_cases(status, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_warranty_status ON public.warranty_analyses(analysis_status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- 12. STATE TRANSITION & SLA CALCULATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_enforce_request_workflow_and_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_minutes INTEGER;
  v_lead_minutes NUMERIC(10,2);
  v_delay_minutes NUMERIC(10,2);
  v_case_no TEXT;
BEGIN
  NEW.updated_at := NOW();

  -- Enforce valid Warehouse status transitions
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'DRAFT' AND NEW.status NOT IN ('PROCESSED', 'SENT_TO_WHS') THEN
      RAISE EXCEPTION 'Invalid status transition from DRAFT to %', NEW.status;
    ELSIF OLD.status = 'PROCESSED' AND NEW.status NOT IN ('SENT_TO_WHS', 'DRAFT') THEN
      RAISE EXCEPTION 'Invalid status transition from PROCESSED to %', NEW.status;
    ELSIF OLD.status = 'SENT_TO_WHS' AND NEW.status NOT IN ('COLLECT', 'CANCELLED_BY_WHS') THEN
      RAISE EXCEPTION 'Invalid status transition from SENT_TO_WHS to %', NEW.status;
    ELSIF OLD.status = 'COLLECT' AND NEW.status NOT IN ('READY', 'CANCELLED_BY_WHS') THEN
      RAISE EXCEPTION 'Invalid status transition from COLLECT to %', NEW.status;
    ELSIF OLD.status = 'READY' AND NEW.status NOT IN ('RECEIVED', 'CANCELLED_BY_WHS') THEN
      RAISE EXCEPTION 'Invalid status transition from READY to %', NEW.status;
    ELSIF OLD.status IN ('CANCELLED_BY_WHS', 'ACTION_REQUIRED_ASS') AND NEW.status NOT IN ('ACTION_REQUIRED_ASS', 'SENT_TO_WHS', 'PROCESSED') THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Snapshot active SLA target when sent to WHS
  IF NEW.status = 'SENT_TO_WHS' AND (OLD.status IS DISTINCT FROM 'SENT_TO_WHS') THEN
    SELECT warehouse_lead_time_minutes INTO v_target_minutes
    FROM public.app_settings
    WHERE singleton_key = 'GLOBAL_CONFIG'
    LIMIT 1;

    NEW.target_lead_time_snapshot := COALESCE(v_target_minutes, 25);
    NEW.sent_to_whs_at := COALESCE(NEW.sent_to_whs_at, NOW());
    NEW.collect_at := NULL;
    NEW.ready_at := NULL;
    NEW.received_at := NULL;
    NEW.actual_lead_time_minutes := NULL;
  END IF;

  -- Calculate Lead Time on READY: ready_at - sent_to_whs_at
  IF NEW.status = 'READY' AND (OLD.status IS DISTINCT FROM 'READY') THEN
    NEW.ready_at := COALESCE(NEW.ready_at, NOW());
    IF NEW.sent_to_whs_at IS NOT NULL THEN
      v_lead_minutes := ROUND((EXTRACT(EPOCH FROM (NEW.ready_at - NEW.sent_to_whs_at)) / 60.0)::numeric, 2);
      NEW.actual_lead_time_minutes := v_lead_minutes;

      -- Auto-create Case Open if actual_lead_time_minutes > target_lead_time_snapshot
      IF v_lead_minutes > NEW.target_lead_time_snapshot THEN
        v_delay_minutes := ROUND((v_lead_minutes - NEW.target_lead_time_snapshot)::numeric, 2);
        v_case_no := 'CASE-' || to_char(NOW(), 'YYYYMMDD') || '-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 5);

        INSERT INTO public.warehouse_cases (
          case_number,
          request_id,
          revision_number,
          target_minutes_snapshot,
          actual_minutes,
          delay_minutes,
          status,
          opened_at
        ) VALUES (
           upper(v_case_no),
          NEW.id,
          NEW.current_revision,
          NEW.target_lead_time_snapshot,
          v_lead_minutes,
          v_delay_minutes,
          'OPEN',
          NOW()
        )
        ON CONFLICT (request_id, revision_number) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_request_workflow_and_sla ON public.requests;
CREATE TRIGGER trg_request_workflow_and_sla
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_request_workflow_and_sla();
