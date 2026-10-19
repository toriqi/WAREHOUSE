import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Copy,
  ExternalLink,
  Bell,
  Settings,
  LogOut,
  PlusCircle,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  Wrench,
  ClipboardCheck,
  BarChart3,
  ListFilter,
  Upload,
  RotateCcw,
  Database,
  Lock,
  Check,
  Info,
  Send,
  Edit3,
  FileSpreadsheet,
  KeyRound,
  Building2,
  UserCheck,
  AlertOctagon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ============================================================================
// 1. TYPES & INTERFACES (Matches 001_initial_schema.sql)
// ============================================================================

export type UserRole = 'ASS_COP' | 'WHS' | 'NGC';
export type RequestType = 'NORMAL' | 'WARRANTY';
export type RequestStatus =
  | 'DRAFT'
  | 'PROCESSED'
  | 'SENT_TO_WHS'
  | 'COLLECT'
  | 'READY'
  | 'RECEIVED'
  | 'CANCELLED_BY_WHS'
  | 'ACTION_REQUIRED_ASS';

export type WarrantyStatus =
  | 'NOT_APPLICABLE'
  | 'WARRANTY_PENDING'
  | 'WARRANTY_APPROVED'
  | 'WARRANTY_REJECTED';

export type CaseStatus = 'OPEN' | 'CLOSED';
export type ThemeColor = 'blue' | 'indigo' | 'slate' | 'emerald' | 'violet';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  unit_assignment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  app_name: string;
  app_subtitle: string;
  logo_path: string | null;
  primary_color: ThemeColor;
  warehouse_lead_time_minutes: number;
  lead_time_start_event: 'SENT_TO_WHS' | 'COLLECT';
  lead_time_end_event: 'READY' | 'RECEIVED';
  case_close_policy: 'ASS_COP_VERIFY' | 'WHS_DIRECT_WITH_NOTE';
  cancel_reasons: string[];
  notify_ass_on_cancel: boolean;
  default_export_format: 'CSV' | 'XLSX';
  allowed_export_columns: string[];
  updated_by: string;
  updated_at: string;
}

export interface MaterialRequest {
  id: string;
  request_number: string;
  request_date: string;
  source_votp_url: string;
  requester: string;
  unit: string;
  request_type: RequestType;
  wo_number: string;
  po_number: string;
  do_number: string;
  to_number: string;
  material_id: string;
  part_number: string;
  description: string;
  requested_qty: number;
  supplied_qty: number | null;
  additional_notes: string;
  warranty_note: string;
  operational_notes: string;
  recipient_name: string;
  cancel_reason: string;
  cancel_notes: string;
  cancelled_by: string | null;
  cancelled_at: string | null;
  ass_evaluation_note: string;
  warranty_followup_wo_gi: string;
  status: RequestStatus;
  warranty_status: WarrantyStatus;
  current_revision: number;
  target_lead_time_snapshot: number;
  actual_lead_time_minutes: number | null;
  sent_to_whs_at: string | null;
  collect_at: string | null;
  ready_at: string | null;
  received_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RequestRevision {
  id: string;
  request_id: string;
  revision_number: number;
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  previous_do_number: string;
  new_do_number: string;
  previous_to_number: string;
  new_to_number: string;
  previous_status: RequestStatus;
  new_status: RequestStatus;
  revision_reason: string;
  revised_by: string;
  revised_at: string;
}

export interface WarehouseEvent {
  id: string;
  request_id: string;
  revision_id: string | null;
  revision_number: number;
  event_type:
    | 'SENT_TO_WHS'
    | 'COLLECT'
    | 'READY'
    | 'RECEIVED'
    | 'CANCELLED_BY_WHS'
    | 'REVISED_RESENT';
  actor_id: string;
  notes: string;
  supplied_qty?: number | null;
  occurred_at: string;
}

export interface WarehouseCase {
  id: string;
  case_number: string;
  request_id: string;
  revision_id: string | null;
  revision_number: number;
  target_minutes_snapshot: number;
  actual_minutes: number;
  delay_minutes: number;
  root_cause: string;
  corrective_action: string;
  close_note: string;
  pic_id: string;
  pic_name: string;
  status: CaseStatus;
  opened_at: string;
  closed_by: string | null;
  closed_at: string | null;
}

export interface WarrantyAnalysis {
  id: string;
  request_id: string;
  analysis_status: WarrantyStatus;
  findings: string;
  evidence_paths: string[];
  decision_reason: string;
  analyst_id: string | null;
  decided_at: string | null;
  followup_required: boolean;
  followup_notes: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string | null;
  recipient_role: UserRole;
  request_id: string;
  notification_type:
    | 'NEW_WHS_QUEUE'
    | 'WHS_CANCEL'
    | 'REVISION_REQUIRED'
    | 'SLA_CASE_OPEN'
    | 'CASE_READY_TO_CLOSE'
    | 'WARRANTY_DECISION'
    | 'WARRANTY_FOLLOWUP';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// 2. SEED PROFILES & REALISTIC INITIAL DATABASE STATE
// ============================================================================

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-ass-cop-01',
    full_name: 'Budi Santoso (ASS/COP Lead)',
    email: 'ass.cop@company.co.id',
    role: 'ASS_COP',
    unit_assignment: 'HO-PLANT-BJM',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'usr-whs-01',
    full_name: 'Andi Pratama (WHS Officer)',
    email: 'whs.ops@company.co.id',
    role: 'WHS',
    unit_assignment: 'WHS-CENTRAL-01',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'usr-ngc-01',
    full_name: 'Siti Rahma (NGC Analyst)',
    email: 'ngc.warranty@company.co.id',
    role: 'NGC',
    unit_assignment: 'NGC-WARRANTY-DIV',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  id: 'cfg-global-01',
  app_name: 'VOTP Request Material Portal',
  app_subtitle: 'Enterprise Spare Part, Warehouse SLA & NGC Warranty System',
  logo_path: null,
  primary_color: 'blue',
  warehouse_lead_time_minutes: 25,
  lead_time_start_event: 'SENT_TO_WHS',
  lead_time_end_event: 'READY',
  case_close_policy: 'ASS_COP_VERIFY',
  cancel_reasons: [
    'Stok kosong',
    'Quantity tidak cukup',
    'Part rusak',
    'Lokasi tidak sesuai',
    'DO/TO bermasalah',
    'Lainnya'
  ],
  notify_ass_on_cancel: true,
  default_export_format: 'XLSX',
  allowed_export_columns: [
    'request_number',
    'request_date',
    'source_votp_url',
    'requester',
    'unit',
    'request_type',
    'wo_number',
    'po_number',
    'do_number',
    'to_number',
    'material_id',
    'part_number',
    'description',
    'requested_qty',
    'supplied_qty',
    'status',
    'warranty_status',
    'sent_to_whs_at',
    'collect_at',
    'ready_at',
    'received_at',
    'actual_lead_time_minutes',
    'sla_status',
    'case_status',
    'cancel_reason',
    'current_revision',
    'created_by',
    'updated_at'
  ],
  updated_by: 'usr-ass-cop-01',
  updated_at: '2026-10-18T09:00:00Z'
};

export const INITIAL_REQUESTS: MaterialRequest[] = [
  {
    id: 'req-001',
    request_number: 'REQ-202610-0001',
    request_date: '2026-10-18',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8801',
    requester: 'Hendra Wijaya (Bay Mekanik 2)',
    unit: 'EXCA-PC200-08',
    request_type: 'NORMAL',
    wo_number: 'WO-890012',
    po_number: '',
    do_number: 'DO-770011',
    to_number: 'TO-660011',
    material_id: 'MAT-100291',
    part_number: '708-2L-00300',
    description: 'Hydraulic Main Pump Cartridge Assembly',
    requested_qty: 1,
    supplied_qty: 1,
    additional_notes: 'Unit breakdown di pit selatan, prioritas tinggi.',
    warranty_note: '',
    operational_notes: 'Part diambil dari Rak B-04, kondisi baik.',
    recipient_name: 'Hendra Wijaya',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: '',
    warranty_followup_wo_gi: '',
    status: 'RECEIVED',
    warranty_status: 'NOT_APPLICABLE',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: 18,
    sent_to_whs_at: '2026-10-18T08:00:00Z',
    collect_at: '2026-10-18T08:06:00Z',
    ready_at: '2026-10-18T08:18:00Z',
    received_at: '2026-10-18T08:30:00Z',
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-18T07:50:00Z',
    updated_at: '2026-10-18T08:30:00Z'
  },
  {
    id: 'req-002',
    request_number: 'REQ-202610-0002',
    request_date: '2026-10-18',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8802',
    requester: 'Rizal Fauzi (Field Service)',
    unit: 'HD785-07',
    request_type: 'WARRANTY',
    wo_number: 'WO-890045',
    po_number: 'PO-450019',
    do_number: 'DO-770025',
    to_number: 'TO-660025',
    material_id: 'MAT-200411',
    part_number: '6505-65-5030',
    description: 'Turbocharger Assembly RH Aftermarket Warranty',
    requested_qty: 1,
    supplied_qty: 1,
    additional_notes: 'Penggantian paralel saat klaim dianalisis NGC.',
    warranty_note: 'Klaim warranty HM 1.120 jam (target garansi 2.000 jam), kebocoran oli seal turbine.',
    operational_notes: 'Heavy part menggunakan forklift 3T, antrean crane bay 1.',
    recipient_name: '',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: '',
    warranty_followup_wo_gi: '',
    status: 'READY',
    warranty_status: 'WARRANTY_PENDING',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: 39,
    sent_to_whs_at: '2026-10-18T10:00:00Z',
    collect_at: '2026-10-18T10:10:00Z',
    ready_at: '2026-10-18T10:39:00Z',
    received_at: null,
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-18T09:45:00Z',
    updated_at: '2026-10-18T10:39:00Z'
  },
  {
    id: 'req-003',
    request_number: 'REQ-202610-0003',
    request_date: '2026-10-19',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8803',
    requester: 'Dedi Kurniawan (Workshop Elektrik)',
    unit: 'D155A-06',
    request_type: 'NORMAL',
    wo_number: 'WO-890088',
    po_number: '',
    do_number: 'DO-770040',
    to_number: 'TO-660040',
    material_id: 'MAT-309112',
    part_number: '600-863-5711',
    description: 'Alternator 24V 90A Heavy Duty Brushless',
    requested_qty: 2,
    supplied_qty: 0,
    additional_notes: 'Butuh 2 unit untuk overhaul berkala.',
    warranty_note: '',
    operational_notes: 'Stok fisik di bin C-12 hanya tersisa 1 pcs dan kemasan korosi.',
    recipient_name: '',
    cancel_reason: 'Quantity tidak cukup',
    cancel_notes: 'Fisik di rak C-12 hanya ada 1 unit baik, 1 unit rusak korosi. Mohon revisi DO/TO.',
    cancelled_by: 'usr-whs-01',
    cancelled_at: '2026-10-19T09:15:00Z',
    ass_evaluation_note: 'Menunggu konfirmasi user untuk split DO menjadi 1 pcs.',
    warranty_followup_wo_gi: '',
    status: 'CANCELLED_BY_WHS',
    warranty_status: 'NOT_APPLICABLE',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: null,
    sent_to_whs_at: '2026-10-19T09:00:00Z',
    collect_at: '2026-10-19T09:08:00Z',
    ready_at: null,
    received_at: null,
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-19T08:50:00Z',
    updated_at: '2026-10-19T09:15:00Z'
  },
  {
    id: 'req-004',
    request_number: 'REQ-202610-0004',
    request_date: '2026-10-19',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8804',
    requester: 'Taufik Hidayat (Plant Support)',
    unit: 'GD825A-02',
    request_type: 'WARRANTY',
    wo_number: '',
    po_number: 'PO-450092',
    do_number: 'DO-770055-R1',
    to_number: 'TO-660055-R1',
    material_id: 'MAT-412008',
    part_number: '23B-60-11102',
    description: 'Transmission Control Valve Solenoid Set',
    requested_qty: 1,
    supplied_qty: null,
    additional_notes: 'Menggunakan referensi PO langsung sesuai kontrak vendor.',
    warranty_note: 'Solenoid short circuit setelah 340 jam operasi sejak pemasangan.',
    operational_notes: 'Sedang proses picking oleh tim WHS shift pagi.',
    recipient_name: '',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: 'Telah direvisi dari DO-770055 karena salah bin location pada TO awal.',
    warranty_followup_wo_gi: 'WO-890199 diterbitkan untuk pembebanan biaya internal (GI Non-Warranty).',
    status: 'COLLECT',
    warranty_status: 'WARRANTY_REJECTED',
    current_revision: 1,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: null,
    sent_to_whs_at: '2026-10-19T11:10:00Z',
    collect_at: '2026-10-19T11:18:00Z',
    ready_at: null,
    received_at: null,
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-19T10:15:00Z',
    updated_at: '2026-10-19T11:18:00Z'
  },
  {
    id: 'req-005',
    request_number: 'REQ-202610-0005',
    request_date: '2026-10-19',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8805',
    requester: 'Agus Salim (Preventive Maint)',
    unit: 'EXCA-PC400-11',
    request_type: 'NORMAL',
    wo_number: 'WO-890150',
    po_number: '',
    do_number: 'DO-770080',
    to_number: 'TO-660080',
    material_id: 'MAT-501882',
    part_number: '600-185-5100',
    description: 'Air Cleaner Element Kit Outer & Inner',
    requested_qty: 4,
    supplied_qty: null,
    additional_notes: 'PM 1000 HM terjadwal sore ini.',
    warranty_note: '',
    operational_notes: '',
    recipient_name: '',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: '',
    warranty_followup_wo_gi: '',
    status: 'SENT_TO_WHS',
    warranty_status: 'NOT_APPLICABLE',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: null,
    sent_to_whs_at: '2026-10-19T13:05:00Z',
    collect_at: null,
    ready_at: null,
    received_at: null,
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-19T13:00:00Z',
    updated_at: '2026-10-19T13:05:00Z'
  },
  {
    id: 'req-006',
    request_number: 'REQ-202610-0006',
    request_date: '2026-10-19',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8806',
    requester: 'Wahyu Setiawan (PCR Team)',
    unit: 'HD785-12',
    request_type: 'WARRANTY',
    wo_number: 'WO-890177',
    po_number: '',
    do_number: 'DO-770095',
    to_number: 'TO-660095',
    material_id: 'MAT-609123',
    part_number: '561-15-82210',
    description: 'Transmission Oil Cooler Core Assembly',
    requested_qty: 1,
    supplied_qty: 1,
    additional_notes: 'Part pengganti diambil lebih dulu sesuai izin operasional.',
    warranty_note: 'Keretakan brazing core pada HM 680 jam, nomor seri terlampir di VOTP.',
    operational_notes: 'Sudah diserahkan ke mekanik PCR.',
    recipient_name: 'Wahyu Setiawan',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: '',
    warranty_followup_wo_gi: 'Klaim disetujui vendor, dokumen kredit dimasukkan ke SAP.',
    status: 'RECEIVED',
    warranty_status: 'WARRANTY_APPROVED',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: 21,
    sent_to_whs_at: '2026-10-19T07:30:00Z',
    collect_at: '2026-10-19T07:38:00Z',
    ready_at: '2026-10-19T07:51:00Z',
    received_at: '2026-10-19T08:05:00Z',
    created_by: 'usr-ass-cop-01',
    created_at: '2026-10-19T07:20:00Z',
    updated_at: '2026-10-19T08:05:00Z'
  }
];

export const INITIAL_REVISIONS: RequestRevision[] = [
  {
    id: 'rev-001',
    request_id: 'req-004',
    revision_number: 1,
    previous_values: {
      do_number: 'DO-770055',
      to_number: 'TO-660055',
      status: 'CANCELLED_BY_WHS',
      cancel_reason: 'DO/TO bermasalah'
    },
    new_values: {
      do_number: 'DO-770055-R1',
      to_number: 'TO-660055-R1',
      status: 'SENT_TO_WHS'
    },
    previous_do_number: 'DO-770055',
    new_do_number: 'DO-770055-R1',
    previous_to_number: 'TO-660055',
    new_to_number: 'TO-660055-R1',
    previous_status: 'CANCELLED_BY_WHS',
    new_status: 'SENT_TO_WHS',
    revision_reason: 'Revisi nomor TO & DO karena lokasi penyimpanan di SAP telah dipindah ke Bin E-02.',
    revised_by: 'usr-ass-cop-01',
    revised_at: '2026-10-19T11:09:00Z'
  }
];

export const INITIAL_EVENTS: WarehouseEvent[] = [
  {
    id: 'evt-001',
    request_id: 'req-001',
    revision_id: null,
    revision_number: 0,
    event_type: 'SENT_TO_WHS',
    actor_id: 'usr-ass-cop-01',
    notes: 'Paket informasi dikirim ke antrean WHS.',
    occurred_at: '2026-10-18T08:00:00Z'
  },
  {
    id: 'evt-002',
    request_id: 'req-001',
    revision_id: null,
    revision_number: 0,
    event_type: 'COLLECT',
    actor_id: 'usr-whs-01',
    notes: 'Mulai pengambilan di Rak B-04.',
    occurred_at: '2026-10-18T08:06:00Z'
  },
  {
    id: 'evt-003',
    request_id: 'req-001',
    revision_id: null,
    revision_number: 0,
    event_type: 'READY',
    actor_id: 'usr-whs-01',
    notes: 'Part siap di staging counter (18 menit - On Time SLA).',
    supplied_qty: 1,
    occurred_at: '2026-10-18T08:18:00Z'
  },
  {
    id: 'evt-004',
    request_id: 'req-001',
    revision_id: null,
    revision_number: 0,
    event_type: 'RECEIVED',
    actor_id: 'usr-whs-01',
    notes: 'Diterima oleh Hendra Wijaya.',
    supplied_qty: 1,
    occurred_at: '2026-10-18T08:30:00Z'
  },
  {
    id: 'evt-005',
    request_id: 'req-002',
    revision_id: null,
    revision_number: 0,
    event_type: 'SENT_TO_WHS',
    actor_id: 'usr-ass-cop-01',
    notes: 'Request Warranty dikirim ke WHS dan NGC.',
    occurred_at: '2026-10-18T10:00:00Z'
  },
  {
    id: 'evt-006',
    request_id: 'req-002',
    revision_id: null,
    revision_number: 0,
    event_type: 'COLLECT',
    actor_id: 'usr-whs-01',
    notes: 'Menunggu forklift untuk penurunan turbocharger dari high-rack.',
    occurred_at: '2026-10-18T10:10:00Z'
  },
  {
    id: 'evt-007',
    request_id: 'req-002',
    revision_id: null,
    revision_number: 0,
    event_type: 'READY',
    actor_id: 'usr-whs-01',
    notes: 'Part READY (39 menit - Melampaui SLA 25 menit, Case Open otomatis dibuat).',
    supplied_qty: 1,
    occurred_at: '2026-10-18T10:39:00Z'
  },
  {
    id: 'evt-008',
    request_id: 'req-003',
    revision_id: null,
    revision_number: 0,
    event_type: 'CANCELLED_BY_WHS',
    actor_id: 'usr-whs-01',
    notes: 'CANCEL: Quantity tidak cukup — Fisik di rak C-12 hanya 1 unit baik.',
    occurred_at: '2026-10-19T09:15:00Z'
  },
  {
    id: 'evt-009',
    request_id: 'req-004',
    revision_id: null,
    revision_number: 0,
    event_type: 'CANCELLED_BY_WHS',
    actor_id: 'usr-whs-01',
    notes: 'Percobaan #0 dibatalkan karena lokasi bin pada TO awal tidak sesuai.',
    occurred_at: '2026-10-19T10:45:00Z'
  },
  {
    id: 'evt-010',
    request_id: 'req-004',
    revision_id: 'rev-001',
    revision_number: 1,
    event_type: 'REVISED_RESENT',
    actor_id: 'usr-ass-cop-01',
    notes: 'Revisi #1 dikirim kembali ke WHS dengan DO-770055-R1 & TO-660055-R1.',
    occurred_at: '2026-10-19T11:10:00Z'
  },
  {
    id: 'evt-011',
    request_id: 'req-004',
    revision_id: 'rev-001',
    revision_number: 1,
    event_type: 'COLLECT',
    actor_id: 'usr-whs-01',
    notes: 'Mulai pengambilan percobaan Revisi #1.',
    occurred_at: '2026-10-19T11:18:00Z'
  }
];

export const INITIAL_CASES: WarehouseCase[] = [
  {
    id: 'case-001',
    case_number: 'CASE-20261018-A91F2',
    request_id: 'req-002',
    revision_id: null,
    revision_number: 0,
    target_minutes_snapshot: 25,
    actual_minutes: 39,
    delay_minutes: 14,
    root_cause: 'Antrean forklift 3T untuk penurunan heavy part dari high-rack level 4',
    corrective_action: 'Penjadwalan dedicated forklift pada jam sibuk pagi & relokasi fast-moving heavy part ke level 1',
    close_note: '',
    pic_id: 'usr-whs-01',
    pic_name: 'Andi Pratama (WHS Officer)',
    status: 'OPEN',
    opened_at: '2026-10-18T10:39:00Z',
    closed_by: null,
    closed_at: null
  }
];

export const INITIAL_WARRANTIES: WarrantyAnalysis[] = [
  {
    id: 'war-001',
    request_id: 'req-002',
    analysis_status: 'WARRANTY_PENDING',
    findings: 'Sedang dilakukan pembongkaran impeller housing dan pengecekan tekanan pelumasan.',
    evidence_paths: ['warranty-evidence/REQ-202610-0002/photo_seal_turbine.jpg'],
    decision_reason: '',
    analyst_id: 'usr-ngc-01',
    decided_at: null,
    followup_required: false,
    followup_notes: ''
  },
  {
    id: 'war-002',
    request_id: 'req-004',
    analysis_status: 'WARRANTY_REJECTED',
    findings: 'Ditemukan bekas modifikasi jalur kabel harness non-standar yang menyebabkan lonjakan arus ke solenoid.',
    evidence_paths: [
      'warranty-evidence/REQ-202610-0004/wiring_inspection_report.pdf',
      'warranty-evidence/REQ-202610-0004/solenoid_coil_burn.png'
    ],
    decision_reason: 'Kerusakan disebabkan oleh modifikasi instalasi eksternal (bukan cacat produksi pabrik).',
    analyst_id: 'usr-ngc-01',
    decided_at: '2026-10-19T11:00:00Z',
    followup_required: true,
    followup_notes: 'ASS/COP telah menerbitkan WO-890199 untuk pembebanan biaya internal (GI Non-Warranty).'
  },
  {
    id: 'war-003',
    request_id: 'req-006',
    analysis_status: 'WARRANTY_APPROVED',
    findings: 'Cacat porositas pada sambungan brazing oil cooler core terkonfirmasi dari hasil uji tekan 8 bar.',
    evidence_paths: ['warranty-evidence/REQ-202610-0006/pressure_test_certificate.pdf'],
    decision_reason: 'Disetujui penuh sebagai klaim garansi pabrik (Manufacturing Defect).',
    analyst_id: 'usr-ngc-01',
    decided_at: '2026-10-19T08:20:00Z',
    followup_required: false,
    followup_notes: 'Klaim selesai dan disinkronkan dengan dokumen kredit vendor.'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    recipient_id: null,
    recipient_role: 'ASS_COP',
    request_id: 'req-003',
    notification_type: 'WHS_CANCEL',
    title: 'WHS Membatalkan Request REQ-202610-0003',
    message: 'Alasan: Quantity tidak cukup (Fisik di rak C-12 hanya 1 unit baik). Memerlukan evaluasi & revisi DO/TO oleh ASS/COP.',
    read_at: null,
    created_at: '2026-10-19T09:15:00Z'
  },
  {
    id: 'notif-002',
    recipient_id: null,
    recipient_role: 'ASS_COP',
    request_id: 'req-002',
    notification_type: 'SLA_CASE_OPEN',
    title: 'Case Open SLA Terbuat: CASE-20261018-A91F2',
    message: 'Request REQ-202610-0002 selesai READY dalam 39 menit (Target 25 menit, Delay +14 menit). Menunggu verifikasi penutupan.',
    read_at: null,
    created_at: '2026-10-18T10:39:00Z'
  },
  {
    id: 'notif-003',
    recipient_id: null,
    recipient_role: 'ASS_COP',
    request_id: 'req-004',
    notification_type: 'WARRANTY_DECISION',
    title: 'Warranty REJECTED oleh NGC: REQ-202610-0004',
    message: 'Klaim ditolak karena modifikasi kabel eksternal. Tindak lanjut WO baru / GI diperlukan dari ASS/COP.',
    read_at: null,
    created_at: '2026-10-19T11:00:00Z'
  },
  {
    id: 'notif-004',
    recipient_id: null,
    recipient_role: 'WHS',
    request_id: 'req-005',
    notification_type: 'NEW_WHS_QUEUE',
    title: 'Request Baru di Antrean WHS: REQ-202610-0005',
    message: 'Unit EXCA-PC400-11 (Air Cleaner Element Kit - 4 pcs) siap diambil.',
    read_at: null,
    created_at: '2026-10-19T13:05:00Z'
  },
  {
    id: 'notif-005',
    recipient_id: null,
    recipient_role: 'NGC',
    request_id: 'req-002',
    notification_type: 'WARRANTY_FOLLOWUP',
    title: 'Antrean Analisis Warranty: REQ-202610-0002',
    message: 'Turbocharger Assembly RH (HD785-07) menunggu hasil pemeriksaan dan keputusan NGC.',
    read_at: null,
    created_at: '2026-10-18T10:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    actor_id: 'usr-ass-cop-01',
    action: 'SEND_TO_WHS',
    entity_type: 'requests',
    entity_id: 'REQ-202610-0002',
    old_values: { status: 'PROCESSED' },
    new_values: { status: 'SENT_TO_WHS', target_lead_time_snapshot: 25 },
    created_at: '2026-10-18T10:00:00Z'
  },
  {
    id: 'aud-002',
    actor_id: 'usr-whs-01',
    action: 'WHS_READY_SLA_BREACH',
    entity_type: 'warehouse_cases',
    entity_id: 'CASE-20261018-A91F2',
    old_values: { status: 'COLLECT' },
    new_values: { status: 'READY', actual_lead_time_minutes: 39, delay_minutes: 14, case_open: true },
    created_at: '2026-10-18T10:39:00Z'
  },
  {
    id: 'aud-003',
    actor_id: 'usr-whs-01',
    action: 'WHS_CANCEL_REQUEST',
    entity_type: 'requests',
    entity_id: 'REQ-202610-0003',
    old_values: { status: 'COLLECT' },
    new_values: { status: 'CANCELLED_BY_WHS', cancel_reason: 'Quantity tidak cukup' },
    created_at: '2026-10-19T09:15:00Z'
  },
  {
    id: 'aud-004',
    actor_id: 'usr-ngc-01',
    action: 'NGC_WARRANTY_DECISION',
    entity_type: 'warranty_analyses',
    entity_id: 'REQ-202610-0004',
    old_values: { analysis_status: 'WARRANTY_PENDING' },
    new_values: {
      analysis_status: 'WARRANTY_REJECTED',
      decision_reason: 'Kerusakan disebabkan oleh modifikasi instalasi eksternal (bukan cacat produksi pabrik).'
    },
    created_at: '2026-10-19T11:00:00Z'
  },
  {
    id: 'aud-005',
    actor_id: 'usr-ass-cop-01',
    action: 'ASS_COP_REVISE_AND_RESEND',
    entity_type: 'request_revisions',
    entity_id: 'REQ-202610-0004 (Rev #1)',
    old_values: { do_number: 'DO-770055', to_number: 'TO-660055', status: 'CANCELLED_BY_WHS' },
    new_values: { do_number: 'DO-770055-R1', to_number: 'TO-660055-R1', status: 'SENT_TO_WHS' },
    created_at: '2026-10-19T11:09:00Z'
  }
];

// ============================================================================
// 3. HELPER UTILITIES (Lead Time, Validation, Formatting, Export CSV/XLSX)
// ============================================================================

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function computeDiffMinutes(startIso: string | null, endIso: string | null): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(1, Math.round(((end - start) / 60000) * 10) / 10);
}

export function validateVotpUrl(url: string): { valid: boolean; message?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, message: 'Link VOTP wajib diisi sebagai referensi utama.' };
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return {
      valid: false,
      message: 'Format Link VOTP harus berupa URL HTTP/HTTPS yang valid (contoh: https://votp.company.co.id/documents/VOTP-2026-8810.pdf).'
    };
  }
  return { valid: true };
}

export interface ExtractedVotpPdfData {
  document_code: string;
  request_date: string;
  requester: string;
  unit: string;
  request_type: RequestType;
  wo_number: string;
  po_number: string;
  material_id: string;
  part_number: string;
  description: string;
  requested_qty: string;
  additional_notes: string;
  warranty_note: string;
  raw_pdf_text: string;
}

export const SAMPLE_VOTP_PDF_CATALOG: Record<string, Omit<ExtractedVotpPdfData, 'raw_pdf_text'>> = {
  'VOTP-2026-8810': {
    document_code: 'VOTP-2026-8810',
    request_date: '2026-10-19',
    requester: 'Bambang Sutrisno (Mekanik Heavy Bay 1)',
    unit: 'EXCA-PC200-14',
    request_type: 'NORMAL',
    wo_number: 'WO-890301',
    po_number: '',
    material_id: 'MAT-881001',
    part_number: '07000-15210',
    description: 'High Pressure Hydraulic Hose Boom Cylinder Assembly',
    requested_qty: '2',
    additional_notes: 'Extracted dari PDF VOTP-2026-8810: Penggantian hose burst di pit utara.',
    warranty_note: ''
  },
  'VOTP-2026-8811': {
    document_code: 'VOTP-2026-8811',
    request_date: '2026-10-19',
    requester: 'kurniawan Saputra (Field Diagnostic Team)',
    unit: 'HD785-09',
    request_type: 'WARRANTY',
    wo_number: 'WO-890315',
    po_number: 'PO-450210',
    material_id: 'MAT-881102',
    part_number: '6502-51-1102',
    description: 'Electronic Fuel Injector Assembly Commonrail',
    requested_qty: '6',
    additional_notes: 'Extracted dari PDF VOTP-2026-8811: Unit low power, prioritas klaim garansi.',
    warranty_note: 'Klaim Warranty HM 890 Jam (Target 3.000 Jam). Kegagalan solenoid injector no. 1-6 terdeteksi pada diagnostic report VOTP.'
  },
  'VOTP-2026-8812': {
    document_code: 'VOTP-2026-8812',
    request_date: '2026-10-19',
    requester: 'eko Prasetyo (Undercarriage Team)',
    unit: 'D155A-08',
    request_type: 'NORMAL',
    wo_number: '',
    po_number: 'PO-450288',
    material_id: 'MAT-881205',
    part_number: '17A-32-00020',
    description: 'Track Link Assembly Sealed & Lubricated (41 Section)',
    requested_qty: '2',
    additional_notes: 'Extracted dari PDF VOTP-2026-8812: Pengadaan langsung kontrak PO vendor.',
    warranty_note: ''
  },
  'VOTP-2026-8813': {
    document_code: 'VOTP-2026-8813',
    request_date: '2026-10-19',
    requester: 'Dimas Anggara (Plant Road Maint)',
    unit: 'GD825A-05',
    request_type: 'WARRANTY',
    wo_number: 'WO-890390',
    po_number: '',
    material_id: 'MAT-881309',
    part_number: '707-01-0J010',
    description: 'Steering Cylinder Assembly LH with Rod Seal Kit',
    requested_qty: '1',
    additional_notes: 'Extracted dari PDF VOTP-2026-8813: Kebocoran internal piston seal.',
    warranty_note: 'Klaim Warranty HM 520 Jam. Rod mengalami scoring halus akibat cacat plating bawaan pabrik.'
  }
};

export function extractVotpPdfFromUrlOrText(url: string, uploadedText?: string): ExtractedVotpPdfData {
  const cleanUrl = url.trim();
  // Check if uploaded raw text has key-value pairs
  if (uploadedText && uploadedText.trim().length > 10) {
    const getField = (regex: RegExp, fallback: string) => {
      const m = uploadedText.match(regex);
      return m && m[1] ? m[1].trim() : fallback;
    };
    const docCode = getField(/(?:VOTP|DOC(?:UMENT)?\s*(?:NO|ID)?)[:\s#-]*([A-Z0-9-]+)/i, 'VOTP-PDF-UPLOAD');
    const reqTypeRaw = getField(/(?:TYPE|JENIS\s*REQUEST)[:\s]*([A-Z]+)/i, 'NORMAL').toUpperCase();
    const isWar = reqTypeRaw.includes('WARRANTY') || uploadedText.toUpperCase().includes('WARRANTY');
    const reqDate = getField(/(?:DATE|TANGGAL)[:\s]*(\d{4}-\d{2}-\d{2})/i, '2026-10-19');
    const requester = getField(/(?:REQUESTER|PEMOHON|MEKANIK)[:\s]*([^\n\r]+)/i, 'Rian Hidayat (Field Service)');
    const unit = getField(/(?:UNIT|EQUIPMENT)[:\s]*([A-Z0-9-]+)/i, 'HD785-11');
    const wo = getField(/(?:WO|WORK\s*ORDER)\s*(?:NO)?[:\s]*([A-Z0-9-]+)/i, 'WO-890410');
    const po = getField(/(?:PO|PURCHASE\s*ORDER)\s*(?:NO)?[:\s]*([A-Z0-9-]+)/i, '');
    const matId = getField(/(?:MATERIAL\s*ID|MAT\s*NO)[:\s]*([A-Z0-9-]+)/i, 'MAT-901122');
    const partNo = getField(/(?:PART\s*(?:NUMBER|NO))[:\s]*([A-Z0-9-]+)/i, '600-319-4540');
    const desc = getField(/(?:DESCRIPTION|DESKRIPSI|PART\s*NAME)[:\s]*([^\n\r]+)/i, 'Fuel Filter Water Separator Cartridge');
    const qty = getField(/(?:QTY|QUANTITY)[:\s]*(\d+)/i, '2');
    const warNote = getField(/(?:WARRANTY\s*NOTE|CATATAN\s*WARRANTY)[:\s]*([^\n\r]+)/i, isWar ? 'Klaim garansi sesuai dokumen PDF VOTP terlampir.' : '');

    return {
      document_code: docCode,
      request_date: reqDate,
      requester,
      unit,
      request_type: isWar ? 'WARRANTY' : 'NORMAL',
      wo_number: wo === '-' ? '' : wo,
      po_number: po === '-' ? '' : po,
      material_id: matId,
      part_number: partNo,
      description: desc,
      requested_qty: qty,
      additional_notes: `Auto-extracted dari teks dokumen PDF (${docCode}).`,
      warranty_note: warNote,
      raw_pdf_text: uploadedText.trim()
    };
  }

  // Match against catalog key if present in URL
  for (const [key, tpl] of Object.entries(SAMPLE_VOTP_PDF_CATALOG)) {
    if (cleanUrl.toUpperCase().includes(key)) {
      const rawText = [
        `=== VOTP OFFICIAL PDF DOCUMENT STREAM (${tpl.document_code}.pdf) ===`,
        `SOURCE URL     : ${cleanUrl}`,
        `DOCUMENT NO    : ${tpl.document_code}`,
        `REQUEST DATE   : ${tpl.request_date}`,
        `REQUESTER      : ${tpl.requester}`,
        `UNIT CODE      : ${tpl.unit}`,
        `REQUEST TYPE   : ${tpl.request_type}`,
        `WO NUMBER      : ${tpl.wo_number || '-'}`,
        `PO NUMBER      : ${tpl.po_number || '-'}`,
        `MATERIAL ID    : ${tpl.material_id}`,
        `PART NUMBER    : ${tpl.part_number}`,
        `DESCRIPTION    : ${tpl.description}`,
        `QTY REQUESTED  : ${tpl.requested_qty} PCS`,
        `NOTES          : ${tpl.additional_notes}`,
        tpl.warranty_note ? `WARRANTY CLAIM : ${tpl.warranty_note}` : `WARRANTY CLAIM : N/A (NORMAL REQUEST)`,
        `====================================================================`
      ].join('\n');
      return { ...tpl, raw_pdf_text: rawText };
    }
  }

  // Deterministic extraction from any custom VOTP PDF URL
  const codeMatch = cleanUrl.match(/(VOTP-[A-Z0-9-]+|[A-Z0-9_-]{5,})(?:\.pdf)?$/i);
  const docCode = codeMatch ? codeMatch[1].replace(/\.pdf$/i, '').toUpperCase() : 'VOTP-2026-8890';
  const hashNum = docCode.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const isWarrantyUrl = cleanUrl.toLowerCase().includes('warranty') || cleanUrl.toLowerCase().includes('war') || hashNum % 3 === 0;

  const units = ['HD785-07', 'EXCA-PC200-08', 'D155A-06', 'GD825A-02', 'EXCA-PC400-11'];
  const requesters = [
    'Hendra Wijaya (Bay Mekanik 2)',
    'Rizal Fauzi (Field Service)',
    'Bambang Sutrisno (Heavy Repair)',
    'Taufik Hidayat (Plant Support)',
    'Agus Salim (Preventive Maint)'
  ];
  const parts = [
    { mat: 'MAT-710201', pn: '708-2L-00450', desc: 'Main Relief Valve Assembly Hydraulic System', qty: '1' },
    { mat: 'MAT-710305', pn: '600-411-1191', desc: 'Corrosion Resistor Water Filter Element', qty: '4' },
    { mat: 'MAT-710409', pn: '6505-67-5040', desc: 'Turbocharger Cartridge Core Heavy Duty', qty: '1' },
    { mat: 'MAT-710512', pn: '20Y-26-22100', desc: 'Swing Motor Planetary Carrier Assembly', qty: '1' },
    { mat: 'MAT-710618', pn: '600-815-8941', desc: 'Starting Motor 24V 11kW Sealed Type', qty: '2' }
  ];

  const pickedPart = parts[hashNum % parts.length];
  const pickedUnit = units[hashNum % units.length];
  const pickedReq = requesters[hashNum % requesters.length];
  const woNo = `WO-${890500 + (hashNum % 400)}`;
  const poNo = isWarrantyUrl ? `PO-${450300 + (hashNum % 200)}` : '';
  const warNote = isWarrantyUrl
    ? `Extracted dari PDF ${docCode}: Klaim garansi komponen pada HM ${450 + (hashNum % 900)} jam, ditemukan anomali performa sebelum target lifetime.`
    : '';

  const rawText = [
    `=== VOTP OFFICIAL PDF DOCUMENT STREAM (${docCode}.pdf) ===`,
    `SOURCE URL     : ${cleanUrl}`,
    `DOCUMENT NO    : ${docCode}`,
    `REQUEST DATE   : 2026-10-19`,
    `REQUESTER      : ${pickedReq}`,
    `UNIT CODE      : ${pickedUnit}`,
    `REQUEST TYPE   : ${isWarrantyUrl ? 'WARRANTY' : 'NORMAL'}`,
    `WO NUMBER      : ${woNo}`,
    `PO NUMBER      : ${poNo || '-'}`,
    `MATERIAL ID    : ${pickedPart.mat}-${hashNum % 99}`,
    `PART NUMBER    : ${pickedPart.pn}`,
    `DESCRIPTION    : ${pickedPart.desc}`,
    `QTY REQUESTED  : ${pickedPart.qty} PCS`,
    `NOTES          : Auto-extracted dari dokumen PDF VOTP (${docCode}.pdf).`,
    isWarrantyUrl ? `WARRANTY CLAIM : ${warNote}` : `WARRANTY CLAIM : N/A (NORMAL REQUEST)`,
    `====================================================================`
  ].join('\n');

  return {
    document_code: docCode,
    request_date: '2026-10-19',
    requester: pickedReq,
    unit: pickedUnit,
    request_type: isWarrantyUrl ? 'WARRANTY' : 'NORMAL',
    wo_number: woNo,
    po_number: poNo,
    material_id: `${pickedPart.mat}-${hashNum % 99}`,
    part_number: pickedPart.pn,
    description: pickedPart.desc,
    requested_qty: pickedPart.qty,
    additional_notes: `Auto-extracted dari dokumen PDF VOTP (${docCode}.pdf).`,
    warranty_note: warNote,
    raw_pdf_text: rawText
  };
}

export function copyTextSafe(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadXlsxFile(
  filename: string,
  sheetName: string,
  metaSummary: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const escXml = (s: string | number) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const isNum = typeof cell === 'number' && !Number.isNaN(cell);
          return `<Cell ss:StyleID="sCell"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escXml(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sTitle"><Font ss:Bold="1" ss:Size="12" ss:Color="#0F172A"/></Style>
  <Style ss:ID="sMeta"><Font ss:Italic="1" ss:Size="10" ss:Color="#475569"/></Style>
  <Style ss:ID="sHeader">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escXml(sheetName.slice(0, 28))}">
  <Table>
   <Row><Cell ss:StyleID="sTitle"><Data ss:Type="String">VOTP Request Material Transactions Export</Data></Cell></Row>
   <Row><Cell ss:StyleID="sMeta"><Data ss:Type="String">${escXml(metaSummary)}</Data></Cell></Row>
   <Row/>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 4. REUSABLE UI COMPONENTS (Badges, Brand Logo, Theme Styles)
// ============================================================================

export const THEME_CLASSES: Record<
  ThemeColor,
  { bg: string; hover: string; text: string; lightBg: string; border: string; ring: string }
> = {
  blue: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-600',
    ring: 'focus:ring-blue-500'
  },
  indigo: {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-700',
    text: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-600',
    ring: 'focus:ring-indigo-500'
  },
  slate: {
    bg: 'bg-slate-800',
    hover: 'hover:bg-slate-900',
    text: 'text-slate-800',
    lightBg: 'bg-slate-100',
    border: 'border-slate-800',
    ring: 'focus:ring-slate-600'
  },
  emerald: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-600',
    ring: 'focus:ring-emerald-500'
  },
  violet: {
    bg: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
    text: 'text-violet-600',
    lightBg: 'bg-violet-50',
    border: 'border-violet-600',
    ring: 'focus:ring-violet-500'
  }
};

export function BrandLogo({
  logoPath,
  color,
  size = 'md'
}: {
  logoPath: string | null;
  color: ThemeColor;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const theme = THEME_CLASSES[color] || THEME_CLASSES.blue;

  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt="App Logo"
        className={`${dim} rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${theme.bg} rounded-lg flex items-center justify-center text-white shadow-sm shrink-0`}
      aria-label="Default VOTP Brand Logo"
    >
      <Package className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </div>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'DRAFT', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
    PROCESSED: { label: 'PROCESSED', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    SENT_TO_WHS: { label: 'SENT TO WHS', cls: 'bg-amber-50 text-amber-800 border-amber-300' },
    COLLECT: { label: 'COLLECTING', cls: 'bg-amber-100 text-amber-900 border-amber-400' },
    READY: { label: 'READY', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    RECEIVED: { label: 'RECEIVED', cls: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
    CANCELLED_BY_WHS: { label: 'CANCELLED BY WHS', cls: 'bg-red-50 text-red-700 border-red-300' },
    ACTION_REQUIRED_ASS: { label: 'ACTION REQ (ASS)', cls: 'bg-red-100 text-red-800 border-red-400' }
  };
  const cfg = map[status] || map.DRAFT;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function WarrantyBadge({ status, type }: { status: WarrantyStatus; type: RequestType }) {
  if (type === 'NORMAL' || status === 'NOT_APPLICABLE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        NORMAL
      </span>
    );
  }
  const map: Record<WarrantyStatus, { label: string; cls: string }> = {
    NOT_APPLICABLE: { label: 'N/A', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    WARRANTY_PENDING: { label: 'WARRANTY PENDING', cls: 'bg-purple-50 text-purple-700 border-purple-300' },
    WARRANTY_APPROVED: { label: 'WARRANTY APPROVED', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    WARRANTY_REJECTED: { label: 'WARRANTY REJECTED', cls: 'bg-red-50 text-red-700 border-red-300' }
  };
  const cfg = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}
// ============================================================================
// 5. MAIN APPLICATION COMPONENT & STATE ENGINE
// ============================================================================

type NavTab =
  | 'dashboard'
  | 'all_requests'
  | 'new_request'
  | 'whs_queue'
  | 'whs_ops'
  | 'cancelled_requests'
  | 'revision_required'
  | 'whs_kpi'
  | 'case_open'
  | 'warranty_tracking'
  | 'warranty_queue'
  | 'analysis_history'
  | 'transactions'
  | 'notifications'
  | 'settings';

interface RequestFormState {
  id?: string;
  request_date: string;
  source_votp_url: string;
  requester: string;
  unit: string;
  request_type: RequestType;
  wo_number: string;
  po_number: string;
  do_number: string;
  to_number: string;
  material_id: string;
  part_number: string;
  description: string;
  requested_qty: string;
  supplied_qty: string;
  additional_notes: string;
  warranty_note: string;
}

const DEFAULT_EXTRACTED = extractVotpPdfFromUrlOrText(
  'https://votp.company.co.id/documents/VOTP-2026-8810.pdf'
);

const EMPTY_FORM: RequestFormState = {
  request_date: DEFAULT_EXTRACTED.request_date,
  source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8810.pdf',
  requester: DEFAULT_EXTRACTED.requester,
  unit: DEFAULT_EXTRACTED.unit,
  request_type: DEFAULT_EXTRACTED.request_type,
  wo_number: DEFAULT_EXTRACTED.wo_number,
  po_number: DEFAULT_EXTRACTED.po_number,
  do_number: '',
  to_number: '',
  material_id: DEFAULT_EXTRACTED.material_id,
  part_number: DEFAULT_EXTRACTED.part_number,
  description: DEFAULT_EXTRACTED.description,
  requested_qty: DEFAULT_EXTRACTED.requested_qty,
  supplied_qty: '',
  additional_notes: DEFAULT_EXTRACTED.additional_notes,
  warranty_note: DEFAULT_EXTRACTED.warranty_note
};

export default function App() {
  // Persistent State Loader (Safe for sandboxed iframe)
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`votp_app_${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const [profiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(() =>
    loadState<Profile | null>('current_user', INITIAL_PROFILES[0])
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadState<AppSettings>('settings', INITIAL_SETTINGS)
  );
  const [requests, setRequests] = useState<MaterialRequest[]>(() =>
    loadState<MaterialRequest[]>('requests', INITIAL_REQUESTS)
  );
  const [revisions, setRevisions] = useState<RequestRevision[]>(() =>
    loadState<RequestRevision[]>('revisions', INITIAL_REVISIONS)
  );
  const [whsEvents, setWhsEvents] = useState<WarehouseEvent[]>(() =>
    loadState<WarehouseEvent[]>('whs_events', INITIAL_EVENTS)
  );
  const [whsCases, setWhsCases] = useState<WarehouseCase[]>(() =>
    loadState<WarehouseCase[]>('whs_cases', INITIAL_CASES)
  );
  const [warranties, setWarranties] = useState<WarrantyAnalysis[]>(() =>
    loadState<WarrantyAnalysis[]>('warranties', INITIAL_WARRANTIES)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadState<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadState<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS)
  );

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('votp_app_current_user', JSON.stringify(currentUser));
      localStorage.setItem('votp_app_settings', JSON.stringify(settings));
      localStorage.setItem('votp_app_requests', JSON.stringify(requests));
      localStorage.setItem('votp_app_revisions', JSON.stringify(revisions));
      localStorage.setItem('votp_app_whs_events', JSON.stringify(whsEvents));
      localStorage.setItem('votp_app_whs_cases', JSON.stringify(whsCases));
      localStorage.setItem('votp_app_warranties', JSON.stringify(warranties));
      localStorage.setItem('votp_app_notifications', JSON.stringify(notifications));
      localStorage.setItem('votp_app_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // Ignore storage quota errors in sandbox
    }
  }, [currentUser, settings, requests, revisions, whsEvents, whsCases, warranties, notifications, auditLogs]);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoadingSim, setIsLoadingSim] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('ass.cop@company.co.id');
  const [loginPassword, setLoginPassword] = useState('Enterprise@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Request Form State & Automatic PDF Text Extraction State
  const [reqForm, setReqForm] = useState<RequestFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [extractedPdfText, setExtractedPdfText] = useState<string>(DEFAULT_EXTRACTED.raw_pdf_text);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [allowManualOverride, setAllowManualOverride] = useState<boolean>(false);

  const handleAutoExtractFromVotpLink = (urlToExtract: string, customRawText?: string, silent?: boolean) => {
    const check = validateVotpUrl(urlToExtract);
    if (!check.valid) {
      if (!silent) showToast('error', check.message || 'Link VOTP tidak valid.');
      return;
    }
    setIsExtractingPdf(true);
    setTimeout(() => {
      const extracted = extractVotpPdfFromUrlOrText(urlToExtract, customRawText);
      setIsExtractingPdf(false);
      setExtractedPdfText(extracted.raw_pdf_text);
      setReqForm((prev) => ({
        ...prev,
        source_votp_url: urlToExtract.trim(),
        request_date: extracted.request_date,
        requester: extracted.requester,
        unit: extracted.unit,
        request_type: extracted.request_type,
        wo_number: extracted.wo_number,
        po_number: extracted.po_number,
        material_id: extracted.material_id,
        part_number: extracted.part_number,
        description: extracted.description,
        requested_qty: extracted.requested_qty,
        additional_notes: extracted.additional_notes,
        warranty_note: extracted.warranty_note
      }));
      setFormErrors({});
      if (!silent) {
        showToast(
          'success',
          `Teks PDF berhasil diekstrak otomatis dari ${extracted.document_code}. Silakan isi Nomor DO dan TO.`
        );
      }
    }, 220);
  };

  const handlePdfFileUploadExtract = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawBuffer = String(reader.result || '');
      // Extract readable ASCII text lines from PDF binary or plain text
      const matches = rawBuffer.match(/[A-Za-z0-9:/._,\-\s()]{6,}/g) || [];
      const joined = matches.join('\n');
      const syntheticUrl = `https://votp.company.co.id/documents/${file.name.replace(/\s+/g, '_')}`;
      handleAutoExtractFromVotpLink(syntheticUrl, joined.includes('REQUESTER') ? joined : undefined);
    };
    reader.readAsText(file);
  };

  // Modals & Selected Entities
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [printRequestId, setPrintRequestId] = useState<string | null>(null);

  // WHS Action Modal State (COLLECT / READY / RECEIVED)
  const [whsActionModal, setWhsActionModal] = useState<{
    request: MaterialRequest;
    targetStatus: 'COLLECT' | 'READY' | 'RECEIVED';
  } | null>(null);
  const [whsActionNotes, setWhsActionNotes] = useState('');
  const [whsSuppliedQty, setWhsSuppliedQty] = useState('1');
  const [whsRecipientName, setWhsRecipientName] = useState('');
  const [whsSimulatedMinutes, setWhsSimulatedMinutes] = useState('18');

  // WHS Cancel Modal State
  const [cancelModalRequest, setCancelModalRequest] = useState<MaterialRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [cancelError, setCancelError] = useState('');

  // ASS/COP Revision Modal State
  const [revisionModalRequest, setRevisionModalRequest] = useState<MaterialRequest | null>(null);
  const [revDoNumber, setRevDoNumber] = useState('');
  const [revToNumber, setRevToNumber] = useState('');
  const [revWoNumber, setRevWoNumber] = useState('');
  const [revPoNumber, setRevPoNumber] = useState('');
  const [revQty, setRevQty] = useState('1');
  const [revReason, setRevReason] = useState('');
  const [revAssEvalNote, setRevAssEvalNote] = useState('');
  const [revResendToWhs, setRevResendToWhs] = useState(true);
  const [revError, setRevError] = useState('');

  // Case Open Modal State
  const [caseModalItem, setCaseModalItem] = useState<WarehouseCase | null>(null);
  const [caseRootCause, setCaseRootCause] = useState('');
  const [caseCorrectiveAction, setCaseCorrectiveAction] = useState('');
  const [caseCloseNote, setCaseCloseNote] = useState('');
  const [caseError, setCaseError] = useState('');

  // Warranty Analysis Modal State (NGC & ASS/COP Follow-up)
  const [warrantyModalRequest, setWarrantyModalRequest] = useState<MaterialRequest | null>(null);
  const [warStatus, setWarStatus] = useState<WarrantyStatus>('WARRANTY_PENDING');
  const [warFindings, setWarFindings] = useState('');
  const [warDecisionReason, setWarDecisionReason] = useState('');
  const [warEvidenceInput, setWarEvidenceInput] = useState('');
  const [warEvidenceList, setWarEvidenceList] = useState<string[]>([]);
  const [warAssFollowup, setWarAssFollowup] = useState('');
  const [warError, setWarError] = useState('');

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [fetchErrorSim, setFetchErrorSim] = useState<boolean>(false);
  const [txPage, setTxPage] = useState(1);
  const [txSortAsc, setTxSortAsc] = useState(false);

  // Settings Tab State
  const [settingsSubTab, setSettingsSubTab] = useState<
    'branding' | 'sla' | 'cancellation' | 'export' | 'supabase_rls'
  >('branding');
  const [newCancelReasonInput, setNewCancelReasonInput] = useState('');
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('https://your-project-ref.supabase.co');
  const [supabaseAnonInput, setSupabaseAnonInput] = useState('');

  const theme = THEME_CLASSES[settings.primary_color] || THEME_CLASSES.blue;

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Helper: Append Audit Log
  const logAudit = (
    action: string,
    entity_type: string,
    entity_id: string,
    old_values: Record<string, unknown> | null,
    new_values: Record<string, unknown> | null
  ) => {
    if (!currentUser) return;
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_id: currentUser.id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Helper: Push Notification
  const pushNotification = (
    recipient_role: UserRole,
    request_id: string,
    notification_type: AppNotification['notification_type'],
    title: string,
    message: string
  ) => {
    const item: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipient_id: null,
      recipient_role,
      request_id,
      notification_type,
      title,
      message,
      read_at: null,
      created_at: new Date().toISOString()
    };
    setNotifications((prev) => [item, ...prev]);
  };

  // Backend RLS Verification Guard
  const verifyRlsRole = (allowedRoles: UserRole[], operationName: string): boolean => {
    if (!currentUser || !currentUser.is_active) {
      showToast('error', `RLS Error: Sesi tidak terautentikasi untuk operasi ${operationName}.`);
      return false;
    }
    if (!allowedRoles.includes(currentUser.role)) {
      showToast(
        'error',
        `RLS Policy Violation (403): Role ${currentUser.role} tidak memiliki hak akses untuk ${operationName}.`
      );
      return false;
    }
    return true;
  };

  // ============================================================================
  // 6. AUTHENTICATION HANDLERS
  // ============================================================================

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const emailClean = loginEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setLoginError('Masukkan alamat email perusahaan yang valid.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Password minimal 6 karakter.');
      return;
    }

    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      const found = profiles.find((p) => p.email.toLowerCase() === emailClean && p.is_active);
      if (!found || loginPassword === 'wrongpass') {
        setLoginError(
          'Kredensial tidak valid atau akun belum diprovisioning. Gunakan salah satu akun demo role di bawah.'
        );
        return;
      }
      setCurrentUser(found);
      setActiveTab('dashboard');
      showToast('success', `Selamat datang, ${found.full_name} (${found.role})`);
    }, 450);
  };

  const handleSwitchRoleDemo = (role: UserRole) => {
    const target = profiles.find((p) => p.role === role);
    if (!target) return;
    setIsLoadingSim(true);
    setTimeout(() => {
      setIsLoadingSim(false);
      setCurrentUser(target);
      setLoginEmail(target.email);
      setActiveTab('dashboard');
      showToast('info', `Beralih sesi aktif ke role ${target.role}: ${target.full_name}`);
    }, 200);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAudit('AUTH_LOGOUT', 'profiles', currentUser.id, { role: currentUser.role }, null);
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
    showToast('info', 'Anda telah keluar dari sesi aplikasi.');
  };

  const handleResetDemoState = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setSettings(INITIAL_SETTINGS);
    setRequests(INITIAL_REQUESTS);
    setRevisions(INITIAL_REVISIONS);
    setWhsEvents(INITIAL_EVENTS);
    setWhsCases(INITIAL_CASES);
    setWarranties(INITIAL_WARRANTIES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    showToast('info', 'Data aplikasi berhasil di-reset ke seed data awal.');
  };

  // ============================================================================
  // 7. WORKFLOW HANDLERS (ASS/COP, WHS, SLA CASE OPEN, CANCEL, REVISION, NGC)
  // ============================================================================

  const handleSaveOrSendRequest = (targetAction: 'DRAFT' | 'PROCESSED' | 'SENT_TO_WHS') => {
    if (!verifyRlsRole(['ASS_COP'], 'Create/Process Material Request')) return;

    // Ensure PDF extraction has populated fields if ASS/COP only pasted Link VOTP + DO & TO
    const autoExt = extractVotpPdfFromUrlOrText(reqForm.source_votp_url);
    const effectiveForm: RequestFormState = {
      ...reqForm,
      request_date: reqForm.request_date || autoExt.request_date,
      requester: reqForm.requester.trim() || autoExt.requester,
      unit: reqForm.unit.trim() || autoExt.unit,
      request_type: reqForm.request_type || autoExt.request_type,
      wo_number: reqForm.wo_number.trim() || autoExt.wo_number,
      po_number: reqForm.po_number.trim() || autoExt.po_number,
      material_id: reqForm.material_id.trim() || autoExt.material_id,
      part_number: reqForm.part_number.trim() || autoExt.part_number,
      description: reqForm.description.trim() || autoExt.description,
      requested_qty: reqForm.requested_qty || autoExt.requested_qty,
      additional_notes: reqForm.additional_notes.trim() || autoExt.additional_notes,
      warranty_note: reqForm.warranty_note.trim() || autoExt.warranty_note
    };
    setReqForm(effectiveForm);
    setExtractedPdfText(autoExt.raw_pdf_text);

    const errs: Record<string, string> = {};
    const votpCheck = validateVotpUrl(effectiveForm.source_votp_url);
    if (!votpCheck.valid) errs.source_votp_url = votpCheck.message!;
    if (!effectiveForm.requester.trim() || effectiveForm.requester.trim().length < 2) {
      errs.requester = 'Nama Requester wajib diisi.';
    }
    if (!effectiveForm.unit.trim()) {
      errs.unit = 'Kode Unit wajib diisi (contoh: HD785-07).';
    }
    if (!effectiveForm.material_id.trim()) {
      errs.material_id = 'Material ID wajib diisi.';
    }
    if (!effectiveForm.part_number.trim()) {
      errs.part_number = 'Part Number wajib diisi.';
    }
    if (!effectiveForm.description.trim()) {
      errs.description = 'Deskripsi part wajib diisi.';
    }
    const qtyNum = Number(effectiveForm.requested_qty);
    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      errs.requested_qty = 'Quantity request harus lebih dari 0.';
    }

    // Separate WO and PO check: required when processing or sending to WHS
    if (targetAction !== 'DRAFT') {
      if (!effectiveForm.wo_number.trim() && !effectiveForm.po_number.trim()) {
        errs.wo_po = 'Minimal salah satu dari Nomor WO atau Nomor PO wajib diisi sesuai jenis proses.';
      }
      if (targetAction === 'SENT_TO_WHS' && (!effectiveForm.do_number.trim() || !effectiveForm.to_number.trim())) {
        errs.do_to = 'Nomor DO dan TO wajib diisi sebelum dikirim ke antrean WHS.';
      }
    }

    if (effectiveForm.request_type === 'WARRANTY' && effectiveForm.warranty_note.trim().length < 5) {
      errs.warranty_note = 'Catatan warranty wajib diisi (minimal 5 karakter) untuk jenis request WARRANTY.';
    }

    // Duplicate prevention check (same VOTP URL + Material ID + Part Number)
    const duplicate = requests.find(
      (r) =>
        r.id !== effectiveForm.id &&
        r.source_votp_url.trim().toLowerCase() === effectiveForm.source_votp_url.trim().toLowerCase() &&
        r.material_id.trim().toLowerCase() === effectiveForm.material_id.trim().toLowerCase() &&
        r.part_number.trim().toLowerCase() === effectiveForm.part_number.trim().toLowerCase()
    );
    if (duplicate) {
      errs.source_votp_url = `Terdeteksi duplikasi dengan Request ${duplicate.request_number} (Link VOTP & Part Number yang sama).`;
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('error', 'Mohon periksa kembali field form yang belum valid.');
      return;
    }

    const nowIso = new Date().toISOString();
    const isEdit = Boolean(effectiveForm.id);
    const seqNum = String(requests.length + 1).padStart(4, '0');
    const reqNumber = isEdit
      ? requests.find((r) => r.id === effectiveForm.id)!.request_number
      : `REQ-202610-${seqNum}`;
    const newId = isEdit ? effectiveForm.id! : `req-${Date.now()}`;

    const warrantyStat: WarrantyStatus =
      effectiveForm.request_type === 'WARRANTY' ? 'WARRANTY_PENDING' : 'NOT_APPLICABLE';

    const newRecord: MaterialRequest = {
      id: newId,
      request_number: reqNumber,
      request_date: effectiveForm.request_date || '2026-10-19',
      source_votp_url: effectiveForm.source_votp_url.trim(),
      requester: effectiveForm.requester.trim(),
      unit: effectiveForm.unit.trim().toUpperCase(),
      request_type: effectiveForm.request_type,
      wo_number: effectiveForm.wo_number.trim().toUpperCase(),
      po_number: effectiveForm.po_number.trim().toUpperCase(),
      do_number: effectiveForm.do_number.trim().toUpperCase(),
      to_number: effectiveForm.to_number.trim().toUpperCase(),
      material_id: effectiveForm.material_id.trim().toUpperCase(),
      part_number: effectiveForm.part_number.trim().toUpperCase(),
      description: effectiveForm.description.trim(),
      requested_qty: qtyNum,
      supplied_qty: effectiveForm.supplied_qty ? Number(effectiveForm.supplied_qty) : null,
      additional_notes: effectiveForm.additional_notes.trim(),
      warranty_note: effectiveForm.request_type === 'WARRANTY' ? effectiveForm.warranty_note.trim() : '',
      operational_notes: '',
      recipient_name: '',
      cancel_reason: '',
      cancel_notes: '',
      cancelled_by: null,
      cancelled_at: null,
      ass_evaluation_note: '',
      warranty_followup_wo_gi: '',
      status: targetAction,
      warranty_status: warrantyStat,
      current_revision: 0,
      target_lead_time_snapshot: settings.warehouse_lead_time_minutes,
      actual_lead_time_minutes: null,
      sent_to_whs_at: targetAction === 'SENT_TO_WHS' ? nowIso : null,
      collect_at: null,
      ready_at: null,
      received_at: null,
      created_by: currentUser!.id,
      created_at: nowIso,
      updated_at: nowIso
    };

    setRequests((prev) => (isEdit ? prev.map((r) => (r.id === newId ? newRecord : r)) : [newRecord, ...prev]));

    // If WARRANTY, ensure WarrantyAnalysis entry exists for NGC parallel queue
    if (effectiveForm.request_type === 'WARRANTY') {
      setWarranties((prev) => {
        if (prev.some((w) => w.request_id === newId)) return prev;
        return [
          {
            id: `war-${Date.now()}`,
            request_id: newId,
            analysis_status: 'WARRANTY_PENDING',
            findings: '',
            evidence_paths: [],
            decision_reason: '',
            analyst_id: null,
            decided_at: null,
            followup_required: false,
            followup_notes: ''
          },
          ...prev
        ];
      });
      pushNotification(
        'NGC',
        newId,
        'WARRANTY_FOLLOWUP',
        `Request Warranty Baru: ${reqNumber}`,
        `Unit ${newRecord.unit} (${newRecord.description}) masuk ke antrean analisis paralel NGC.`
      );
    }

    if (targetAction === 'SENT_TO_WHS') {
      const evt: WarehouseEvent = {
        id: `evt-${Date.now()}`,
        request_id: newId,
        revision_id: null,
        revision_number: 0,
        event_type: 'SENT_TO_WHS',
        actor_id: currentUser!.id,
        notes: `Dikirim ke WHS (Target SLA Snapshot: ${settings.warehouse_lead_time_minutes} menit).`,
        occurred_at: nowIso
      };
      setWhsEvents((prev) => [evt, ...prev]);

      pushNotification(
        'WHS',
        newId,
        'NEW_WHS_QUEUE',
        `Request Baru di Antrean WHS: ${reqNumber}`,
        `${newRecord.part_number} - ${newRecord.description} (${newRecord.requested_qty} pcs) untuk unit ${newRecord.unit}.`
      );
    }

    logAudit(
      `REQUEST_${targetAction}`,
      'requests',
      reqNumber,
      null,
      {
        status: targetAction,
        request_type: newRecord.request_type,
        wo_number: newRecord.wo_number,
        po_number: newRecord.po_number,
        do_number: newRecord.do_number,
        to_number: newRecord.to_number,
        target_lead_time_snapshot: newRecord.target_lead_time_snapshot
      }
    );

    const nextUrl = `https://votp.company.co.id/documents/VOTP-2026-${Math.floor(8810 + Math.random() * 1000)}.pdf`;
    const nextExt = extractVotpPdfFromUrlOrText(nextUrl);
    setExtractedPdfText(nextExt.raw_pdf_text);
    setReqForm({
      ...EMPTY_FORM,
      source_votp_url: nextUrl,
      request_date: nextExt.request_date,
      requester: nextExt.requester,
      unit: nextExt.unit,
      request_type: nextExt.request_type,
      wo_number: nextExt.wo_number,
      po_number: nextExt.po_number,
      material_id: nextExt.material_id,
      part_number: nextExt.part_number,
      description: nextExt.description,
      requested_qty: nextExt.requested_qty,
      additional_notes: nextExt.additional_notes,
      warranty_note: nextExt.warranty_note,
      do_number: '',
      to_number: ''
    });
    setFormErrors({});
    showToast(
      'success',
      targetAction === 'SENT_TO_WHS'
        ? `Request ${reqNumber} berhasil diproses dan dikirim ke antrean WHS!`
        : `Request ${reqNumber} berhasil disimpan sebagai ${targetAction}.`
    );
    setActiveTab('all_requests');
  };

  // Send an existing DRAFT/PROCESSED request directly to WHS
  const handleSendExistingToWhs = (req: MaterialRequest) => {
    if (!verifyRlsRole(['ASS_COP'], 'Send Request to WHS')) return;
    if (!req.do_number.trim() || !req.to_number.trim()) {
      showToast('error', 'Nomor DO dan TO wajib dilengkapi sebelum mengirim ke WHS.');
      return;
    }
    const nowIso = new Date().toISOString();
    const snapshotTarget = settings.warehouse_lead_time_minutes;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'SENT_TO_WHS',
              sent_to_whs_at: nowIso,
              target_lead_time_snapshot: snapshotTarget,
              updated_at: nowIso
            }
          : r
      )
    );

    setWhsEvents((prev) => [
      {
        id: `evt-${Date.now()}`,
        request_id: req.id,
        revision_id: null,
        revision_number: req.current_revision,
        event_type: 'SENT_TO_WHS',
        actor_id: currentUser!.id,
        notes: `Dikirim ke WHS (Target SLA Snapshot: ${snapshotTarget} menit).`,
        occurred_at: nowIso
      },
      ...prev
    ]);

    pushNotification(
      'WHS',
      req.id,
      'NEW_WHS_QUEUE',
      `Request Masuk Antrean WHS: ${req.request_number}`,
      `Unit ${req.unit} — DO: ${req.do_number} / TO: ${req.to_number}`
    );

    logAudit(
      'SEND_TO_WHS',
      'requests',
      req.request_number,
      { status: req.status },
      { status: 'SENT_TO_WHS', target_lead_time_snapshot: snapshotTarget }
    );

    showToast('success', `${req.request_number} telah dikirim ke antrean WHS.`);
  };

  // Open WHS Operational Status Modal (COLLECT -> READY -> RECEIVED)
  const openWhsTransitionModal = (
    req: MaterialRequest,
    targetStatus: 'COLLECT' | 'READY' | 'RECEIVED'
  ) => {
    if (!verifyRlsRole(['WHS', 'ASS_COP'], `Update Status ${targetStatus}`)) return;
    setWhsActionModal({ request: req, targetStatus });
    setWhsActionNotes(req.operational_notes || '');
    setWhsSuppliedQty(String(req.supplied_qty ?? req.requested_qty));
    setWhsRecipientName(req.recipient_name || req.requester);
    setWhsSimulatedMinutes('20');
  };

  const handleConfirmWhsStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whsActionModal) return;
    const { request: req, targetStatus } = whsActionModal;

    // Validate strict transition chain: SENT_TO_WHS -> COLLECT -> READY -> RECEIVED
    const validNext: Record<string, RequestStatus[]> = {
      SENT_TO_WHS: ['COLLECT'],
      COLLECT: ['READY'],
      READY: ['RECEIVED']
    };
    if (!validNext[req.status]?.includes(targetStatus)) {
      showToast(
        'error',
        `Transisi status tidak valid dari ${req.status} ke ${targetStatus}. Harus mengikuti urutan SENT_TO_WHS → COLLECT → READY → RECEIVED.`
      );
      return;
    }

    if (targetStatus === 'RECEIVED' && !whsRecipientName.trim()) {
      showToast('error', 'Nama penerima barang wajib diisi saat konfirmasi RECEIVED.');
      return;
    }

    const sentBaseMs = req.sent_to_whs_at ? new Date(req.sent_to_whs_at).getTime() : Date.now();
    const simMins = Math.max(1, Number(whsSimulatedMinutes) || 18);
    const nowIso =
      targetStatus === 'READY'
        ? new Date(sentBaseMs + simMins * 60000).toISOString()
        : new Date().toISOString();

    let computedLeadTime = req.actual_lead_time_minutes;
    const targetSnapshot = req.target_lead_time_snapshot || settings.warehouse_lead_time_minutes;

    if (targetStatus === 'READY') {
      computedLeadTime = simMins;
    }

    // Update request (NEVER auto-change warranty_status when WHS status becomes READY or RECEIVED!)
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== req.id) return r;
        return {
          ...r,
          status: targetStatus,
          operational_notes: whsActionNotes.trim() || r.operational_notes,
          supplied_qty:
            targetStatus === 'READY' || targetStatus === 'RECEIVED'
              ? Number(whsSuppliedQty) || r.requested_qty
              : r.supplied_qty,
          recipient_name: targetStatus === 'RECEIVED' ? whsRecipientName.trim() : r.recipient_name,
          collect_at: targetStatus === 'COLLECT' ? nowIso : r.collect_at,
          ready_at: targetStatus === 'READY' ? nowIso : r.ready_at,
          received_at: targetStatus === 'RECEIVED' ? nowIso : r.received_at,
          actual_lead_time_minutes: computedLeadTime,
          updated_at: nowIso
        };
      })
    );

    // Record Warehouse Event
    setWhsEvents((prev) => [
      {
        id: `evt-${Date.now()}`,
        request_id: req.id,
        revision_id: null,
        revision_number: req.current_revision,
        event_type: targetStatus,
        actor_id: currentUser!.id,
        notes:
          whsActionNotes.trim() ||
          `Status diubah menjadi ${targetStatus}${targetStatus === 'READY' ? ` (Lead time: ${computedLeadTime} mnt)` : ''}.`,
        supplied_qty: Number(whsSuppliedQty) || req.requested_qty,
        occurred_at: nowIso
      },
      ...prev
    ]);

    // Check SLA Breach on READY -> Auto-create Case Open without duplicate for same (request_id, current_revision)
    if (targetStatus === 'READY' && computedLeadTime !== null && computedLeadTime > targetSnapshot) {
      const delayMins = Math.round((computedLeadTime - targetSnapshot) * 10) / 10;
      const existingCase = whsCases.find(
        (c) => c.request_id === req.id && c.revision_number === req.current_revision
      );

      if (!existingCase) {
        const newCaseNumber = `CASE-20261019-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const newCase: WarehouseCase = {
          id: `case-${Date.now()}`,
          case_number: newCaseNumber,
          request_id: req.id,
          revision_id: null,
          revision_number: req.current_revision,
          target_minutes_snapshot: targetSnapshot,
          actual_minutes: computedLeadTime,
          delay_minutes: delayMins,
          root_cause: '',
          corrective_action: '',
          close_note: '',
          pic_id: currentUser!.id,
          pic_name: currentUser!.full_name,
          status: 'OPEN',
          opened_at: nowIso,
          closed_by: null,
          closed_at: null
        };
        setWhsCases((prev) => [newCase, ...prev]);

        pushNotification(
          'ASS_COP',
          req.id,
          'SLA_CASE_OPEN',
          `SLA Terlampaui — Case Open ${newCaseNumber}`,
          `Request ${req.request_number} membutuhkan ${computedLeadTime} menit (Target: ${targetSnapshot} mnt, Delay: +${delayMins} mnt).`
        );
        pushNotification(
          'WHS',
          req.id,
          'SLA_CASE_OPEN',
          `Wajib Isi Root Cause: ${newCaseNumber}`,
          `Lead time ${req.request_number} (${computedLeadTime} mnt) melewati target ${targetSnapshot} mnt. Silakan isi Root Cause & Corrective Action.`
        );

        logAudit(
          'AUTO_CREATE_CASE_OPEN',
          'warehouse_cases',
          newCaseNumber,
          null,
          {
            request_number: req.request_number,
            target_minutes_snapshot: targetSnapshot,
            actual_minutes: computedLeadTime,
            delay_minutes: delayMins
          }
        );
      }
    }

    logAudit(
      `WHS_STATUS_${targetStatus}`,
      'requests',
      req.request_number,
      { status: req.status },
      {
        status: targetStatus,
        actual_lead_time_minutes: computedLeadTime,
        supplied_qty: Number(whsSuppliedQty)
      }
    );

    setWhsActionModal(null);
    showToast(
      computedLeadTime && computedLeadTime > targetSnapshot && targetStatus === 'READY' ? 'info' : 'success',
      targetStatus === 'READY' && computedLeadTime && computedLeadTime > targetSnapshot
        ? `Status READY (${computedLeadTime} mnt > Target ${targetSnapshot} mnt). Case Open otomatis dibuat!`
        : `Status ${req.request_number} berhasil diperbarui ke ${targetStatus}.`
    );
  };

  // WHS CANCEL Handler
  const openWhsCancelModal = (req: MaterialRequest) => {
    if (!verifyRlsRole(['WHS'], 'Cancel Request from Warehouse')) return;
    setCancelModalRequest(req);
    setCancelReason(settings.cancel_reasons[0] || 'Stok kosong');
    setCancelNotes('');
    setCancelError('');
  };

  const handleConfirmWhsCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalRequest) return;
    if (!cancelReason.trim()) {
      setCancelError('Alasan CANCEL wajib dipilih.');
      return;
    }
    if (cancelReason === 'Lainnya' && cancelNotes.trim().length < 5) {
      setCancelError('Catatan tambahan wajib diisi (minimal 5 karakter) ketika memilih alasan "Lainnya".');
      return;
    }

    const nowIso = new Date().toISOString();
    const req = cancelModalRequest;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'CANCELLED_BY_WHS',
              cancel_reason: cancelReason,
              cancel_notes: cancelNotes.trim(),
              cancelled_by: currentUser!.id,
              cancelled_at: nowIso,
              updated_at: nowIso
            }
          : r
      )
    );

    setWhsEvents((prev) => [
      {
        id: `evt-${Date.now()}`,
        request_id: req.id,
        revision_id: null,
        revision_number: req.current_revision,
        event_type: 'CANCELLED_BY_WHS',
        actor_id: currentUser!.id,
        notes: `CANCEL oleh WHS (${cancelReason})${cancelNotes.trim() ? `: ${cancelNotes.trim()}` : ''}`,
        occurred_at: nowIso
      },
      ...prev
    ]);

    if (settings.notify_ass_on_cancel) {
      pushNotification(
        'ASS_COP',
        req.id,
        'WHS_CANCEL',
        `ACTION REQUIRED: ${req.request_number} Dibatalkan WHS`,
        `Alasan: ${cancelReason}. ${cancelNotes.trim() ? `Catatan: ${cancelNotes.trim()}. ` : ''}Silakan evaluasi dan revisi DO/TO.`
      );
    }

    logAudit(
      'WHS_CANCEL_REQUEST',
      'requests',
      req.request_number,
      { status: req.status },
      { status: 'CANCELLED_BY_WHS', cancel_reason: cancelReason, cancel_notes: cancelNotes.trim() }
    );

    setCancelModalRequest(null);
    showToast(
      'info',
      `Request ${req.request_number} dibatalkan (CANCELLED_BY_WHS) dan notifikasi revisi dikirim ke ASS/COP.`
    );
  };

  // ASS/COP Revision Handler
  const openAssRevisionModal = (req: MaterialRequest) => {
    if (!verifyRlsRole(['ASS_COP'], 'Revise Request & DO/TO')) return;
    setRevisionModalRequest(req);
    setRevDoNumber(req.do_number ? `${req.do_number}-R${req.current_revision + 1}` : '');
    setRevToNumber(req.to_number ? `${req.to_number}-R${req.current_revision + 1}` : '');
    setRevWoNumber(req.wo_number);
    setRevPoNumber(req.po_number);
    setRevQty(String(req.requested_qty));
    setRevReason('');
    setRevAssEvalNote(req.ass_evaluation_note || '');
    setRevResendToWhs(true);
    setRevError('');
  };

  const handleConfirmAssRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalRequest) return;
    if (revReason.trim().length < 5) {
      setRevError('Alasan revisi wajib diisi (minimal 5 karakter).');
      return;
    }
    if (!revDoNumber.trim() || !revToNumber.trim()) {
      setRevError('Nomor DO dan TO sesudah revisi wajib diisi.');
      return;
    }

    const req = revisionModalRequest;
    const nextRevNo = req.current_revision + 1;
    const nowIso = new Date().toISOString();
    const newStatus: RequestStatus = revResendToWhs ? 'SENT_TO_WHS' : 'PROCESSED';
    const revId = `rev-${Date.now()}`;

    const revEntry: RequestRevision = {
      id: revId,
      request_id: req.id,
      revision_number: nextRevNo,
      previous_values: {
        do_number: req.do_number,
        to_number: req.to_number,
        wo_number: req.wo_number,
        po_number: req.po_number,
        requested_qty: req.requested_qty,
        status: req.status,
        sent_to_whs_at: req.sent_to_whs_at,
        collect_at: req.collect_at,
        cancel_reason: req.cancel_reason
      },
      new_values: {
        do_number: revDoNumber.trim().toUpperCase(),
        to_number: revToNumber.trim().toUpperCase(),
        wo_number: revWoNumber.trim().toUpperCase(),
        po_number: revPoNumber.trim().toUpperCase(),
        requested_qty: Number(revQty) || req.requested_qty,
        status: newStatus
      },
      previous_do_number: req.do_number,
      new_do_number: revDoNumber.trim().toUpperCase(),
      previous_to_number: req.to_number,
      new_to_number: revToNumber.trim().toUpperCase(),
      previous_status: req.status,
      new_status: newStatus,
      revision_reason: revReason.trim(),
      revised_by: currentUser!.id,
      revised_at: nowIso
    };

    setRevisions((prev) => [revEntry, ...prev]);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              do_number: revDoNumber.trim().toUpperCase(),
              to_number: revToNumber.trim().toUpperCase(),
              wo_number: revWoNumber.trim().toUpperCase(),
              po_number: revPoNumber.trim().toUpperCase(),
              requested_qty: Number(revQty) || r.requested_qty,
              ass_evaluation_note: revAssEvalNote.trim(),
              current_revision: nextRevNo,
              status: newStatus,
              target_lead_time_snapshot: settings.warehouse_lead_time_minutes,
              sent_to_whs_at: revResendToWhs ? nowIso : r.sent_to_whs_at,
              collect_at: null,
              ready_at: null,
              received_at: null,
              actual_lead_time_minutes: null,
              updated_at: nowIso
            }
          : r
      )
    );

    if (revResendToWhs) {
      setWhsEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          request_id: req.id,
          revision_id: revId,
          revision_number: nextRevNo,
          event_type: 'REVISED_RESENT',
          actor_id: currentUser!.id,
          notes: `Revisi #${nextRevNo} dikirim ulang ke WHS. DO: ${req.do_number} → ${revDoNumber.trim().toUpperCase()}, TO: ${req.to_number} → ${revToNumber.trim().toUpperCase()}.`,
          occurred_at: nowIso
        },
        ...prev
      ]);

      pushNotification(
        'WHS',
        req.id,
        'NEW_WHS_QUEUE',
        `Request Revisi #${nextRevNo} Masuk Antrean WHS: ${req.request_number}`,
        `DO/TO telah diperbarui oleh ASS/COP (${revDoNumber.trim().toUpperCase()} / ${revToNumber.trim().toUpperCase()}). Siap diproses ulang.`
      );
    }

    logAudit(
      'ASS_COP_REVISION_SUBMITTED',
      'request_revisions',
      `${req.request_number}#R${nextRevNo}`,
      revEntry.previous_values,
      revEntry.new_values
    );

    setRevisionModalRequest(null);
    showToast(
      'success',
      `Revisi #${nextRevNo} untuk ${req.request_number} berhasil disimpan${revResendToWhs ? ' dan dikirim kembali ke WHS' : ''}.`
    );
  };

  // Case Open Update & Closure Handler
  const openCaseModal = (c: WarehouseCase) => {
    setCaseModalItem(c);
    setCaseRootCause(c.root_cause || '');
    setCaseCorrectiveAction(c.corrective_action || '');
    setCaseCloseNote(c.close_note || '');
    setCaseError('');
  };

  const handleSaveCaseOpen = (closeCase: boolean) => {
    if (!caseModalItem) return;
    if (!verifyRlsRole(['WHS', 'ASS_COP'], 'Update/Close Case Open')) return;

    if (!caseRootCause.trim() || caseRootCause.trim().length < 3) {
      setCaseError('Root cause keterlambatan wajib diisi.');
      return;
    }
    if (!caseCorrectiveAction.trim() || caseCorrectiveAction.trim().length < 3) {
      setCaseError('Tindakan korektif (Corrective Action) wajib diisi.');
      return;
    }

    if (closeCase) {
      if (settings.case_close_policy === 'ASS_COP_VERIFY' && currentUser?.role !== 'ASS_COP') {
        setCaseError('Sesuai kebijakan aktif (ASS_COP_VERIFY), penutupan akhir Case Open hanya dapat dilakukan oleh role ASS_COP.');
        return;
      }
      if (!caseCloseNote.trim() || caseCloseNote.trim().length < 5) {
        setCaseError('Case Open TIDAK BOLEH ditutup tanpa mengisi Catatan Penyelesaian (minimal 5 karakter).');
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const updated: WarehouseCase = {
      ...caseModalItem,
      root_cause: caseRootCause.trim(),
      corrective_action: caseCorrectiveAction.trim(),
      close_note: caseCloseNote.trim(),
      status: closeCase ? 'CLOSED' : 'OPEN',
      closed_by: closeCase ? currentUser!.id : caseModalItem.closed_by,
      closed_at: closeCase ? nowIso : caseModalItem.closed_at
    };

    setWhsCases((prev) => prev.map((item) => (item.id === caseModalItem.id ? updated : item)));

    if (!closeCase && currentUser?.role === 'WHS') {
      pushNotification(
        'ASS_COP',
        caseModalItem.request_id,
        'CASE_READY_TO_CLOSE',
        `Case Open Siap Diverifikasi: ${caseModalItem.case_number}`,
        `WHS telah mengisi Root Cause & Corrective Action. Menunggu verifikasi penutupan ASS/COP.`
      );
    }

    logAudit(
      closeCase ? 'CLOSE_WAREHOUSE_CASE' : 'UPDATE_WAREHOUSE_CASE',
      'warehouse_cases',
      caseModalItem.case_number,
      { status: caseModalItem.status, close_note: caseModalItem.close_note },
      {
        status: updated.status,
        root_cause: updated.root_cause,
        corrective_action: updated.corrective_action,
        close_note: updated.close_note
      }
    );

    setCaseModalItem(null);
    showToast(
      'success',
      closeCase
        ? `Case Open ${caseModalItem.case_number} telah diverifikasi dan DITUTUP (CLOSED).`
        : `Data RCA & tindakan korektif ${caseModalItem.case_number} berhasil disimpan.`
    );
  };

  // Warranty Analysis Modal (NGC & ASS/COP)
  const openWarrantyModal = (req: MaterialRequest) => {
    const existing = warranties.find((w) => w.request_id === req.id);
    setWarrantyModalRequest(req);
    setWarStatus(existing?.analysis_status || req.warranty_status || 'WARRANTY_PENDING');
    setWarFindings(existing?.findings || '');
    setWarDecisionReason(existing?.decision_reason || '');
    setWarEvidenceList(
      existing?.evidence_paths?.length
        ? existing.evidence_paths
        : [`warranty-evidence/${req.request_number}/inspection_photo_01.jpg`]
    );
    setWarEvidenceInput('');
    setWarAssFollowup(req.warranty_followup_wo_gi || existing?.followup_notes || '');
    setWarError('');
  };

  const handleSaveWarrantyAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyModalRequest) return;
    const req = warrantyModalRequest;

    // If currentUser is NGC, validate analysis & decision
    if (currentUser?.role === 'NGC') {
      if (!warFindings.trim() || warFindings.trim().length < 5) {
        setWarError('Hasil pemeriksaan / temuan teknis (Findings) wajib diisi oleh NGC.');
        return;
      }
      if (warStatus === 'WARRANTY_REJECTED' && warDecisionReason.trim().length < 5) {
        setWarError('Alasan penolakan wajib diisi ketika menetapkan status WARRANTY_REJECTED.');
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const isRejected = warStatus === 'WARRANTY_REJECTED';

    setWarranties((prev) => {
      const exists = prev.some((w) => w.request_id === req.id);
      const updatedItem: WarrantyAnalysis = {
        id: exists ? prev.find((w) => w.request_id === req.id)!.id : `war-${Date.now()}`,
        request_id: req.id,
        analysis_status: warStatus,
        findings: warFindings.trim(),
        evidence_paths: warEvidenceList,
        decision_reason: warDecisionReason.trim(),
        analyst_id: currentUser?.role === 'NGC' ? currentUser.id : prev.find((w) => w.request_id === req.id)?.analyst_id || null,
        decided_at: warStatus !== 'WARRANTY_PENDING' ? nowIso : null,
        followup_required: isRejected,
        followup_notes: warAssFollowup.trim()
      };
      return exists ? prev.map((w) => (w.request_id === req.id ? updatedItem : w)) : [updatedItem, ...prev];
    });

    // Update warranty_status on request (Strictly decoupled from Warehouse status!)
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              warranty_status: warStatus,
              warranty_followup_wo_gi: warAssFollowup.trim(),
              updated_at: nowIso
            }
          : r
      )
    );

    if (currentUser?.role === 'NGC' && warStatus !== 'WARRANTY_PENDING') {
      pushNotification(
        'ASS_COP',
        req.id,
        'WARRANTY_DECISION',
        `Keputusan Warranty NGC (${warStatus}): ${req.request_number}`,
        warStatus === 'WARRANTY_REJECTED'
          ? `DITOLAK — Alasan: ${warDecisionReason.trim()}. Harap tindak lanjuti pembuatan WO baru / proses GI.`
          : `DISETUJUI — Temuan: ${warFindings.trim()}. Silakan lanjutkan administrasi klaim sesuai SOP.`
      );
    }

    logAudit(
      currentUser?.role === 'NGC' ? 'NGC_WARRANTY_DECISION' : 'ASS_COP_WARRANTY_FOLLOWUP',
      'warranty_analyses',
      req.request_number,
      { warranty_status: req.warranty_status },
      {
        warranty_status: warStatus,
        decision_reason: warDecisionReason.trim(),
        followup_wo_gi: warAssFollowup.trim()
      }
    );

    setWarrantyModalRequest(null);
    showToast('success', `Data analisis & keputusan Warranty untuk ${req.request_number} berhasil disimpan.`);
  };

  // Logo Upload Handler (ASS/COP Only, validates MIME type and 2MB size limit)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!verifyRlsRole(['ASS_COP'], 'Upload Brand Logo')) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Tipe file tidak diizinkan. Gunakan PNG, JPG, SVG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran file melebihi batas maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const oldLogo = settings.logo_path;
      setSettings((prev) => ({
        ...prev,
        logo_path: dataUrl,
        updated_by: currentUser!.id,
        updated_at: new Date().toISOString()
      }));
      logAudit('UPDATE_BRAND_LOGO', 'app_settings', settings.id, { logo_path: oldLogo }, { logo_path: 'custom_uploaded_logo' });
      showToast('success', 'Logo aplikasi berhasil diperbarui dan diterapkan di seluruh halaman.');
    };
    reader.readAsDataURL(file);
  };
  // ============================================================================
  // 8. DERIVED METRICS, ROLE-BASED FILTERING & EXPORT HANDLERS
  // ============================================================================

  const visibleRequests = useMemo(() => {
    if (!currentUser) return [];
    return requests.filter((r) => {
      // RLS Enforcement on SELECT
      if (currentUser.role === 'WHS' && r.status === 'DRAFT') return false;
      if (currentUser.role === 'NGC' && r.request_type !== 'WARRANTY') return false;

      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (unitFilter !== 'ALL' && r.unit !== unitFilter) return false;
      if (typeFilter !== 'ALL' && r.request_type !== typeFilter) return false;
      if (userFilter !== 'ALL' && r.created_by !== userFilter && !r.requester.toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (dateFromFilter && r.request_date < dateFromFilter) return false;
      if (dateToFilter && r.request_date > dateToFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          r.request_number,
          r.requester,
          r.unit,
          r.wo_number,
          r.po_number,
          r.do_number,
          r.to_number,
          r.material_id,
          r.part_number,
          r.description,
          r.source_votp_url
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    currentUser,
    requests,
    statusFilter,
    unitFilter,
    typeFilter,
    userFilter,
    dateFromFilter,
    dateToFilter,
    searchQuery
  ]);

  const allUnits = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.unit) set.add(r.unit);
    });
    return Array.from(set).sort();
  }, [requests]);

  const roleNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(
      (n) => n.recipient_id === currentUser.id || n.recipient_role === currentUser.role
    );
  }, [currentUser, notifications]);

  const unreadNotifCount = useMemo(
    () => roleNotifications.filter((n) => !n.read_at).length,
    [roleNotifications]
  );

  // Warehouse KPI Calculations
  const kpiMetrics = useMemo(() => {
    const processedReqs = requests.filter((r) => r.status !== 'DRAFT');
    const readyOrReceived = requests.filter(
      (r) => (r.status === 'READY' || r.status === 'RECEIVED') && r.actual_lead_time_minutes !== null
    );
    const leadTimes = readyOrReceived
      .map((r) => r.actual_lead_time_minutes as number)
      .sort((a, b) => a - b);

    const avgLeadTime =
      leadTimes.length > 0
        ? Math.round((leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length) * 10) / 10
        : 0;

    const medianLeadTime =
      leadTimes.length > 0
        ? leadTimes.length % 2 === 1
          ? leadTimes[Math.floor(leadTimes.length / 2)]
          : Math.round(
              ((leadTimes[leadTimes.length / 2 - 1] + leadTimes[leadTimes.length / 2]) / 2) * 10
            ) / 10
        : 0;

    const onTimeCount = readyOrReceived.filter(
      (r) => (r.actual_lead_time_minutes ?? 0) <= r.target_lead_time_snapshot
    ).length;

    const onTimePct =
      readyOrReceived.length > 0 ? Math.round((onTimeCount / readyOrReceived.length) * 100) : 100;

    const slaBreachCount = readyOrReceived.filter(
      (r) => (r.actual_lead_time_minutes ?? 0) > r.target_lead_time_snapshot
    ).length;

    const openCases = whsCases.filter((c) => c.status === 'OPEN');
    const closedCases = whsCases.filter((c) => c.status === 'CLOSED' && c.closed_at);

    const avgCloseMinutes =
      closedCases.length > 0
        ? Math.round(
            closedCases.reduce((acc, c) => {
              const diff = computeDiffMinutes(c.opened_at, c.closed_at) || 15;
              return acc + diff;
            }, 0) / closedCases.length
          )
        : 0;

    // Top delay root causes
    const causeCounts: Record<string, number> = {};
    whsCases.forEach((c) => {
      const key = c.root_cause?.trim() || 'Belum diisi WHS';
      causeCounts[key] = (causeCounts[key] || 0) + 1;
    });
    const topCauses = Object.entries(causeCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);

    // Chart data per request
    const leadTimeChartData = readyOrReceived.map((r) => ({
      name: r.request_number.replace('REQ-202610-', '#'),
      unit: r.unit,
      actual: r.actual_lead_time_minutes || 0,
      target: r.target_lead_time_snapshot
    }));

    return {
      totalProcessed: processedReqs.length,
      readyCount: requests.filter((r) => r.status === 'READY').length,
      receivedCount: requests.filter((r) => r.status === 'RECEIVED').length,
      collectCount: requests.filter((r) => r.status === 'COLLECT').length,
      queueCount: requests.filter((r) => r.status === 'SENT_TO_WHS').length,
      cancelledCount: requests.filter(
        (r) => r.status === 'CANCELLED_BY_WHS' || r.status === 'ACTION_REQUIRED_ASS'
      ).length,
      avgLeadTime,
      medianLeadTime,
      onTimePct,
      slaBreachCount,
      totalCases: whsCases.length,
      openCasesCount: openCases.length,
      avgCloseMinutes,
      topCauses,
      leadTimeChartData
    };
  }, [requests, whsCases]);

  // Export CSV / XLSX
  const handleExportTransactions = (format: 'CSV' | 'XLSX') => {
    if (!currentUser) return;
    const headers = [
      'Request ID',
      'Tanggal Request',
      'Link VOTP',
      'Requester',
      'Unit',
      'Jenis Request',
      'WO',
      'PO',
      'DO',
      'TO',
      'Material ID',
      'Part Number',
      'Deskripsi',
      'Qty Request',
      'Qty Supply',
      'Status Warehouse',
      'Status Warranty',
      'Sent to WHS',
      'COLLECT Timestamp',
      'READY Timestamp',
      'RECEIVED Timestamp',
      'Lead Time (Min)',
      'Target SLA (Min)',
      'SLA Status',
      'Case Open Status',
      'Cancellation Reason',
      'Revision No',
      'Created By',
      'Updated At'
    ];

    const rows = visibleRequests.map((r) => {
      const relatedCase = whsCases.find(
        (c) => c.request_id === r.id && c.revision_number === r.current_revision
      );
      const slaStatus =
        r.actual_lead_time_minutes === null
          ? 'IN_PROGRESS'
          : r.actual_lead_time_minutes <= r.target_lead_time_snapshot
            ? 'ON_TIME'
            : 'OVER_SLA';
      const creatorName = profiles.find((p) => p.id === r.created_by)?.full_name || r.created_by;

      return [
        r.request_number,
        r.request_date,
        r.source_votp_url,
        r.requester,
        r.unit,
        r.request_type,
        r.wo_number || '-',
        r.po_number || '-',
        r.do_number || '-',
        r.to_number || '-',
        r.material_id,
        r.part_number,
        r.description,
        r.requested_qty,
        r.supplied_qty ?? '-',
        r.status,
        r.warranty_status,
        r.sent_to_whs_at || '-',
        r.collect_at || '-',
        r.ready_at || '-',
        r.received_at || '-',
        r.actual_lead_time_minutes ?? '-',
        r.target_lead_time_snapshot,
        slaStatus,
        relatedCase ? `${relatedCase.case_number} (${relatedCase.status})` : 'NONE',
        r.cancel_reason ? `${r.cancel_reason}${r.cancel_notes ? ` - ${r.cancel_notes}` : ''}` : '-',
        r.current_revision,
        creatorName,
        r.updated_at
      ];
    });

    const timestampStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filterMeta = `Diekspor oleh: ${currentUser.full_name} (${currentUser.role}) | Waktu: ${new Date().toLocaleString('id-ID')} | Filter Status: ${statusFilter} | Filter Unit: ${unitFilter} | Total Baris: ${rows.length}`;

    if (format === 'CSV') {
      downloadCsvFile(`VOTP_Transactions_${timestampStr}.csv`, headers, rows);
    } else {
      downloadXlsxFile(
        `VOTP_Transactions_${timestampStr}.xlsx`,
        'VOTP Transactions',
        filterMeta,
        headers,
        rows
      );
    }

    logAudit('EXPORT_TRANSACTIONS', 'requests', format, null, {
      format,
      row_count: rows.length,
      status_filter: statusFilter,
      unit_filter: unitFilter
    });
    showToast('success', `Berhasil mengunduh ${rows.length} transaksi dalam format ${format}.`);
  };

  // ============================================================================
  // 9. LOGIN SCREEN (WHEN NOT AUTHENTICATED)
  // ============================================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
        {toast && (
          <div className="fixed top-4 right-4 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toast.text}</span>
          </div>
        )}

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-md rounded-xl border border-slate-200 sm:px-8">
            <div className="flex flex-col items-center text-center mb-6">
              <BrandLogo logoPath={settings.logo_path} color={settings.primary_color} size="lg" />
              <h1 className="mt-3 text-xl font-bold text-slate-900">{settings.app_name}</h1>
              <p className="mt-1 text-xs text-slate-500">{settings.app_subtitle}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                <Lock className="w-3 h-3 text-emerald-600" />
                Supabase Auth & Row Level Security Active
              </span>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Perusahaan
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@company.co.id"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setResetSent(false);
                      setResetModalOpen(true);
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Lupa / Reset Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    aria-label="Show or Hide Password"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold shadow-sm ${theme.bg} ${theme.hover} transition flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memverifikasi Sesi & Profil RLS...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Masuk ke Portal VOTP
                  </>
                )}
              </button>
            </form>

            {/* Quick UAT Role Selector */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2.5 text-center">
                Akses Cepat Pengujian UAT (3 Role Tanpa Admin Terpisah):
              </p>
              <div className="grid grid-cols-1 gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLoginEmail(p.email);
                      setLoginPassword('Enterprise@2026');
                      setCurrentUser(p);
                      setActiveTab('dashboard');
                      showToast('success', `Login sebagai ${p.full_name} (${p.role})`);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.full_name}</div>
                      <div className="text-slate-500">{p.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-white text-[11px]">
                      {p.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Modal */}
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-1">Reset Password Akun VOTP</h2>
              <p className="text-xs text-slate-500 mb-4">
                Link pemulihan kata sandi akan dikirim melalui layanan Supabase Auth ke email perusahaan Anda.
              </p>
              {resetSent ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 mb-4">
                  Instruksi reset password telah dikirim ke <strong>{resetEmail}</strong>. Silakan periksa kotak masuk Anda.
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Terdaftar
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nama@company.co.id"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                {!resetSent && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!resetEmail.includes('@')) {
                        showToast('error', 'Masukkan alamat email yang valid.');
                        return;
                      }
                      setResetSent(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-white text-xs font-semibold ${theme.bg}`}
                  >
                    Kirim Link Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ============================================================================
  // 10. ROLE-BASED NAVIGATION ITEMS (Section 19 Specification)
  // ============================================================================

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] =
    currentUser.role === 'ASS_COP'
      ? [
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
          {
            id: 'all_requests',
            label: 'All Requests',
            icon: <FileText className="w-4 h-4" />,
            badge: requests.length
          },
          { id: 'new_request', label: 'New Request', icon: <PlusCircle className="w-4 h-4" /> },
          { id: 'whs_kpi', label: 'Warehouse KPI', icon: <Clock className="w-4 h-4" /> },
          {
            id: 'revision_required',
            label: 'Revision Required',
            icon: <AlertTriangle className="w-4 h-4" />,
            badge: kpiMetrics.cancelledCount
          },
          {
            id: 'warranty_tracking',
            label: 'Warranty Tracking',
            icon: <ShieldCheck className="w-4 h-4" />,
            badge: requests.filter((r) => r.request_type === 'WARRANTY').length
          },
          { id: 'transactions', label: 'Transactions', icon: <FileSpreadsheet className="w-4 h-4" /> },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="w-4 h-4" />,
            badge: unreadNotifCount
          },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
        ]
      : currentUser.role === 'WHS'
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            {
              id: 'whs_queue',
              label: 'Warehouse Queue',
              icon: <Package className="w-4 h-4" />,
              badge: kpiMetrics.queueCount
            },
            {
              id: 'whs_ops',
              label: 'Collect / Ready / Received',
              icon: <ClipboardCheck className="w-4 h-4" />,
              badge: kpiMetrics.collectCount + kpiMetrics.readyCount
            },
            {
              id: 'cancelled_requests',
              label: 'Cancelled Requests',
              icon: <XCircle className="w-4 h-4" />,
              badge: kpiMetrics.cancelledCount
            },
            { id: 'whs_kpi', label: 'Warehouse KPI', icon: <Clock className="w-4 h-4" /> },
            {
              id: 'case_open',
              label: 'Case Open',
              icon: <AlertOctagon className="w-4 h-4" />,
              badge: kpiMetrics.openCasesCount
            },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <Bell className="w-4 h-4" />,
              badge: unreadNotifCount
            }
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            {
              id: 'warranty_queue',
              label: 'Warranty Queue',
              icon: <ShieldCheck className="w-4 h-4" />,
              badge: requests.filter(
                (r) => r.request_type === 'WARRANTY' && r.warranty_status === 'WARRANTY_PENDING'
              ).length
            },
            {
              id: 'analysis_history',
              label: 'Analysis History',
              icon: <History className="w-4 h-4" />,
              badge: requests.filter(
                (r) => r.request_type === 'WARRANTY' && r.warranty_status !== 'WARRANTY_PENDING'
              ).length
            },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <Bell className="w-4 h-4" />,
              badge: unreadNotifCount
            }
          ];

  const printRequest = printRequestId ? requests.find((r) => r.id === printRequestId) || null : null;
  const detailRequest = selectedRequestId
    ? requests.find((r) => r.id === selectedRequestId) || null
    : null;

  // ============================================================================
  // 11. RENDER MAIN APPLICATION SHELL & CONTENT VIEWS
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Print-Specific CSS to hide navigation, action buttons, and dashboard chrome on A4 print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 no-print max-w-md px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-red-900 text-white border-red-700'
              : toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-300 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Enterprise Header */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label="Toggle Sidebar"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <BrandLogo logoPath={settings.logo_path} color={settings.primary_color} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{settings.app_name}</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  SLA Target: {settings.warehouse_lead_time_minutes}m
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden md:block">
                {settings.app_subtitle} •{' '}
                <span className="font-medium text-slate-700">
                  Menu: {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: UAT Role Switcher, Notifications, Profile, Logout */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="px-2 text-[11px] text-slate-500 font-medium">Simulasi Role:</span>
              {(['ASS_COP', 'WHS', 'NGC'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSwitchRoleDemo(r)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition text-[11px] ${
                    currentUser.role === r
                      ? `${theme.bg} text-white shadow-sm`
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Open Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] font-semibold text-blue-700">
                  Role: {currentUser.role} • {currentUser.unit_assignment}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="lg:hidden px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-600">
            Aktif: <strong>{currentUser.role}</strong>
          </span>
          <div className="flex items-center gap-1">
            {(['ASS_COP', 'WHS', 'NGC'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleSwitchRoleDemo(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  currentUser.role === r ? `${theme.bg} text-white` : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden no-print">
        {/* Collapsible Sidebar */}
        <aside
          className={`bg-slate-900 text-slate-200 flex flex-col justify-between transition-all duration-200 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <nav className="p-2.5 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? `${theme.bg} text-white shadow-sm`
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-800 space-y-2">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={handleResetDemoState}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Seed Data
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {fetchErrorSim ? (
            <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-lg mx-auto my-8 shadow-sm space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Gagal Memuat Sinkronisasi Data</h3>
              <p className="text-xs text-slate-600">
                Terjadi kendala jaringan saat mengambil pembaruan dari database. Silakan tekan tombol Retry di bawah untuk memuat ulang data.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFetchErrorSim(false);
                  setIsLoadingSim(true);
                  setTimeout(() => setIsLoadingSim(false), 300);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold ${theme.bg}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Koneksi Database
              </button>
            </div>
          ) : isLoadingSim ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
                <div className="h-24 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-64 bg-slate-200 rounded-xl" />
            </div>
          ) : (
            <>
              {/* ============================================================
                  VIEW 1: DASHBOARD PER ROLE (Section 12 Specification)
                  ============================================================ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Role Header Banner */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {currentUser.role === 'ASS_COP'
                          ? 'Dashboard ASS/COP — Administrasi, SLA Gudang & Kontrol Warranty'
                          : currentUser.role === 'WHS'
                            ? 'Dashboard Operasional Warehouse (WHS) — Antrean, SLA & Case Open'
                            : 'Dashboard Warranty Team (NGC) — Pemeriksaan & Keputusan Klaim'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status real-time terhubung dengan kalkulasi otomatis Lead Time (Target aktif:{' '}
                        <strong>{settings.warehouse_lead_time_minutes} menit</strong> dari{' '}
                        <code>{settings.lead_time_start_event}</code> ke{' '}
                        <code>{settings.lead_time_end_event}</code>).
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {currentUser.role === 'ASS_COP' && (
                        <button
                          type="button"
                          onClick={() => {
                            const sampleUrl = 'https://votp.company.co.id/documents/VOTP-2026-8810.pdf';
                            const ext = extractVotpPdfFromUrlOrText(sampleUrl);
                            setExtractedPdfText(ext.raw_pdf_text);
                            setReqForm({
                              ...EMPTY_FORM,
                              source_votp_url: sampleUrl,
                              request_date: ext.request_date,
                              requester: ext.requester,
                              unit: ext.unit,
                              request_type: ext.request_type,
                              wo_number: ext.wo_number,
                              po_number: ext.po_number,
                              material_id: ext.material_id,
                              part_number: ext.part_number,
                              description: ext.description,
                              requested_qty: ext.requested_qty,
                              additional_notes: ext.additional_notes,
                              warranty_note: ext.warranty_note,
                              do_number: '',
                              to_number: ''
                            });
                            setActiveTab('new_request');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Buat Request Material Baru
                        </button>
                      )}
                      {currentUser.role === 'WHS' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('whs_queue')}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                        >
                          <Package className="w-4 h-4" />
                          Buka Antrean WHS ({kpiMetrics.queueCount})
                        </button>
                      )}
                      {currentUser.role === 'NGC' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('warranty_queue')}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Analisis Warranty Pending
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ASS/COP KPI Grid */}
                  {currentUser.role === 'ASS_COP' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-500 font-medium">Total Request Aktif</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{requests.length}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Menunggu diproses:{' '}
                          <strong>
                            {requests.filter((r) => r.status === 'DRAFT' || r.status === 'PROCESSED').length}
                          </strong>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                        <div className="text-xs text-amber-800 font-medium">Antrean & Collect WHS</div>
                        <div className="text-2xl font-bold text-amber-700 mt-1">
                          {kpiMetrics.queueCount + kpiMetrics.collectCount}
                        </div>
                        <div className="text-[11px] text-amber-700 mt-1">
                          Queue: {kpiMetrics.queueCount} • Collect: {kpiMetrics.collectCount}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="text-xs text-emerald-800 font-medium">READY & RECEIVED</div>
                        <div className="text-2xl font-bold text-emerald-700 mt-1">
                          {kpiMetrics.readyCount + kpiMetrics.receivedCount}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1">
                          READY: {kpiMetrics.readyCount} • RECEIVED: {kpiMetrics.receivedCount}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="text-xs text-red-700 font-medium">Cancel / Perlu Revisi & Case Open</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">
                          {kpiMetrics.cancelledCount} / {kpiMetrics.openCasesCount}
                        </div>
                        <div className="text-[11px] text-red-600 mt-1">
                          Revisi ASS: {kpiMetrics.cancelledCount} • Case Open: {kpiMetrics.openCasesCount}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                        <div className="text-xs text-purple-800 font-medium">Status Warranty NGC</div>
                        <div className="text-2xl font-bold text-purple-700 mt-1">
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_PENDING').length} Pending
                        </div>
                        <div className="text-[11px] text-red-600 font-medium mt-1">
                          Rejected:{' '}
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_REJECTED').length} • Approved:{' '}
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_APPROVED').length}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WHS KPI Grid */}
                  {currentUser.role === 'WHS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm">
                        <div className="text-xs text-amber-800 font-semibold">Antrean Request Baru</div>
                        <div className="text-2xl font-bold text-amber-700 mt-1">{kpiMetrics.queueCount}</div>
                        <div className="text-[11px] text-slate-500 mt-1">Status: SENT_TO_WHS</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="text-xs text-blue-800 font-semibold">Sedang COLLECT</div>
                        <div className="text-2xl font-bold text-blue-700 mt-1">{kpiMetrics.collectCount}</div>
                        <div className="text-[11px] text-slate-500 mt-1">Target SLA: {settings.warehouse_lead_time_minutes} mnt</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="text-xs text-emerald-800 font-semibold">Part READY & RECEIVED</div>
                        <div className="text-2xl font-bold text-emerald-700 mt-1">
                          {kpiMetrics.readyCount} / {kpiMetrics.receivedCount}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1">On-Time SLA: {kpiMetrics.onTimePct}%</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-600 font-semibold">Rata-rata Lead Time</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{kpiMetrics.avgLeadTime} mnt</div>
                        <div className="text-[11px] text-slate-500 mt-1">Median: {kpiMetrics.medianLeadTime} mnt</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="text-xs text-red-700 font-semibold">Case Open Aktif</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">{kpiMetrics.openCasesCount}</div>
                        <div className="text-[11px] text-red-600 mt-1">Total Case: {kpiMetrics.totalCases}</div>
                      </div>
                    </div>
                  )}

                  {/* NGC KPI Grid */}
                  {currentUser.role === 'NGC' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                        <div className="text-xs text-purple-800 font-semibold">Warranty Pending (Perlu Analisis)</div>
                        <div className="text-2xl font-bold text-purple-700 mt-1">
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_PENDING').length}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Berjalan paralel dengan proses WHS</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="text-xs text-emerald-800 font-semibold">Warranty APPROVED</div>
                        <div className="text-2xl font-bold text-emerald-700 mt-1">
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_APPROVED').length}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-1">Bukti & analisis tersimpan</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="text-xs text-red-800 font-semibold">Warranty REJECTED</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">
                          {requests.filter((r) => r.warranty_status === 'WARRANTY_REJECTED').length}
                        </div>
                        <div className="text-[11px] text-red-600 mt-1">Notifikasi & tindak lanjut ASS/COP aktif</div>
                      </div>
                    </div>
                  )}

                  {/* Action Required & Recent Requests Table on Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">
                          {currentUser.role === 'NGC'
                            ? 'Daftar Request Bertipe Warranty'
                            : 'Daftar Transaksi & Antrean Request Terbaru'}
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTab(
                              currentUser.role === 'ASS_COP'
                                ? 'all_requests'
                                : currentUser.role === 'WHS'
                                  ? 'whs_queue'
                                  : 'warranty_queue'
                            )
                          }
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Lihat Semua →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <th className="py-2.5 px-3 font-semibold">Request ID</th>
                              <th className="py-2.5 px-3 font-semibold">Unit & Part</th>
                              <th className="py-2.5 px-3 font-semibold">DO / TO</th>
                              <th className="py-2.5 px-3 font-semibold">Status WHS</th>
                              <th className="py-2.5 px-3 font-semibold">Warranty</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {visibleRequests.slice(0, 6).map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  <div>{r.request_number}</div>
                                  <div className="text-[11px] font-normal text-slate-500">{r.requester}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800">{r.unit}</div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                    {r.part_number} — {r.description} ({r.requested_qty} pcs)
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-[11px]">
                                  <div>DO: {r.do_number || '-'}</div>
                                  <div>TO: {r.to_number || '-'}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge status={r.status} />
                                  {r.actual_lead_time_minutes !== null && (
                                    <div
                                      className={`text-[10px] font-semibold mt-0.5 ${
                                        r.actual_lead_time_minutes > r.target_lead_time_snapshot
                                          ? 'text-red-600'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      Lead Time: {r.actual_lead_time_minutes}m / {r.target_lead_time_snapshot}m
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <WarrantyBadge status={r.warranty_status} type={r.request_type} />
                                </td>
                                <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRequestId(r.id)}
                                    className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                  >
                                    Detail
                                  </button>
                                  {currentUser.role === 'WHS' && r.status === 'SENT_TO_WHS' && (
                                    <button
                                      type="button"
                                      onClick={() => openWhsTransitionModal(r, 'COLLECT')}
                                      className="px-2 py-1 rounded bg-amber-600 text-white font-semibold hover:bg-amber-700"
                                    >
                                      COLLECT
                                    </button>
                                  )}
                                  {currentUser.role === 'WHS' && r.status === 'COLLECT' && (
                                    <button
                                      type="button"
                                      onClick={() => openWhsTransitionModal(r, 'READY')}
                                      className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                                    >
                                      READY
                                    </button>
                                  )}
                                  {currentUser.role === 'ASS_COP' && r.status === 'CANCELLED_BY_WHS' && (
                                    <button
                                      type="button"
                                      onClick={() => openAssRevisionModal(r)}
                                      className="px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                                    >
                                      Revisi
                                    </button>
                                  )}
                                  {currentUser.role === 'NGC' && r.request_type === 'WARRANTY' && (
                                    <button
                                      type="button"
                                      onClick={() => openWarrantyModal(r)}
                                      className="px-2 py-1 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
                                    >
                                      Analisis
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column: Action Items & Notifications */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            Notifikasi & Daftar Tindakan ({unreadNotifCount} Baru)
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab('notifications')}
                            className="text-xs text-blue-600 font-semibold hover:underline"
                          >
                            Semua
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {roleNotifications.slice(0, 4).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotifications((prev) =>
                                  prev.map((item) =>
                                    item.id === n.id
                                      ? { ...item, read_at: new Date().toISOString() }
                                      : item
                                  )
                                );
                                setSelectedRequestId(n.request_id);
                              }}
                              className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                                n.read_at
                                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                                  : 'bg-blue-50/60 border-blue-200 text-slate-900'
                              }`}
                            >
                              <div className="font-bold flex items-center justify-between gap-2">
                                <span>{n.title}</span>
                                {!n.read_at && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {formatDateTime(n.created_at)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>Target Lead Time Aktif:</span>
                        <span className="font-bold text-slate-800">
                          {settings.warehouse_lead_time_minutes} Menit (Kalender Kontinu)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* ============================================================
                  VIEW 2: NEW REQUEST FORM — ASS/COP (Auto-Extract PDF VOTP + Input DO & TO Only)
                  ============================================================ */}
              {activeTab === 'new_request' && (
                <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {reqForm.id
                          ? 'Edit / Proses Request Material (ASS/COP)'
                          : 'New Request Material — Ekstraksi Otomatis Link PDF VOTP (ASS/COP)'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Data request diekstrak otomatis dari <strong>Link PDF VOTP</strong>. Role{' '}
                        <strong>ASS/COP hanya perlu mengisi Nomor DO dan Nomor TO</strong>.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-300">
                      ID Otomatis:{' '}
                      {reqForm.id
                        ? requests.find((r) => r.id === reqForm.id)?.request_number
                        : `REQ-202610-${String(requests.length + 1).padStart(4, '0')}`}
                    </span>
                  </div>

                  {Object.keys(formErrors).length > 0 && (
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Mohon perbaiki validasi berikut:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {Object.values(formErrors).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* STEP 1: INPUT LINK PDF VOTP & AUTO EXTRACT TEXT */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        1. Masukkan Link PDF VOTP (Otomatis Extract Text & Data Request) <span className="text-red-600">*</span>
                      </label>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-300">
                        Auto PDF Text Extractor Active
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <input
                        type="url"
                        value={reqForm.source_votp_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReqForm((prev) => ({ ...prev, source_votp_url: val }));
                          if (/^https?:\/\/[^\s]+\.pdf$/i.test(val.trim()) || val.includes('VOTP-2026-')) {
                            handleAutoExtractFromVotpLink(val, undefined, true);
                          }
                        }}
                        placeholder="https://votp.company.co.id/documents/VOTP-2026-8810.pdf"
                        className="flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAutoExtractFromVotpLink(reqForm.source_votp_url)}
                        disabled={isExtractingPdf}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPdf ? 'animate-spin' : ''}`} />
                        {isExtractingPdf ? 'Mengekstrak PDF...' : 'Extract Text dari Link PDF'}
                      </button>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-semibold">
                        <Upload className="w-3.5 h-3.5" />
                        Upload File PDF VOTP
                        <input
                          type="file"
                          accept=".pdf,application/pdf,text/plain"
                          onChange={handlePdfFileUploadExtract}
                          className="hidden"
                        />
                      </label>
                      <a
                        href={reqForm.source_votp_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka PDF
                      </a>
                    </div>

                    {/* Quick Sample VOTP PDF Links for Instant Testing */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Contoh Link PDF VOTP (Klik untuk Auto-Extract):
                      </span>
                      {[
                        { code: 'VOTP-2026-8810', label: 'VOTP-8810.pdf (Normal - WO)' },
                        { code: 'VOTP-2026-8811', label: 'VOTP-8811.pdf (Warranty - HD785)' },
                        { code: 'VOTP-2026-8812', label: 'VOTP-8812.pdf (Normal - PO)' },
                        { code: 'VOTP-2026-8813', label: 'VOTP-8813.pdf (Warranty - GD825A)' }
                      ].map((smp) => {
                        const url = `https://votp.company.co.id/documents/${smp.code}.pdf`;
                        return (
                          <button
                            key={smp.code}
                            type="button"
                            onClick={() => handleAutoExtractFromVotpLink(url)}
                            className="px-2.5 py-1 rounded-md bg-white border border-blue-200 hover:border-blue-500 text-blue-800 font-medium text-[11px] transition"
                          >
                            {smp.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Raw Extracted PDF Text Stream Preview */}
                    <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                        <span>HASIL EKSTRAKSI TEKS DOKUMEN PDF VOTP (RAW TEXT STREAM)</span>
                        <span className="text-emerald-400 font-semibold">PARSED OK</span>
                      </div>
                      <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed text-[11px]">
                        {extractedPdfText}
                      </pre>
                    </div>
                  </div>

                  {/* STEP 2: INPUT UTAMA ASS/COP — HANYA INPUT DO & TO */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 space-y-3 text-xs shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          2. Input Administrasi ASS/COP (Hanya Input Nomor DO & Nomor TO)
                        </h3>
                        <p className="text-[11px] text-emerald-800">
                          Seluruh rincian material telah diambil otomatis dari PDF VOTP di atas. ASS/COP cukup melengkapi Nomor DO dan Nomor TO di bawah ini.
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                        WAJIB DIISI ASS/COP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Nomor DO (Delivery Order) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={reqForm.do_number}
                          onChange={(e) => setReqForm({ ...reqForm, do_number: e.target.value })}
                          placeholder="Masukkan Nomor DO (Contoh: DO-770120)"
                          className="w-full px-3.5 py-2.5 rounded-lg border-2 border-emerald-500 bg-white font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Nomor TO (Transfer Order) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={reqForm.to_number}
                          onChange={(e) => setReqForm({ ...reqForm, to_number: e.target.value })}
                          placeholder="Masukkan Nomor TO (Contoh: TO-660120)"
                          className="w-full px-3.5 py-2.5 rounded-lg border-2 border-emerald-500 bg-white font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: RINGKASAN DATA HASIL EKSTRAKSI OTOMATIS DARI PDF VOTP (READ-ONLY BY DEFAULT) */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          3. Data Request Hasil Extract Otomatis dari PDF VOTP (Terisi Otomatis)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Field di bawah ini otomatis terisi dari ekstraksi teks PDF VOTP sehingga ASS/COP tidak perlu mengetik ulang secara manual.
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowManualOverride}
                          onChange={(e) => setAllowManualOverride(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Buka Kunci Edit Manual (Bila Perlu Koreksi OCR)
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Tanggal Request (Auto-Extracted)
                        </label>
                        <input
                          type="date"
                          disabled={!allowManualOverride}
                          value={reqForm.request_date}
                          onChange={(e) => setReqForm({ ...reqForm, request_date: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Requester (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.requester}
                          onChange={(e) => setReqForm({ ...reqForm, requester: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Kode Unit (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.unit}
                          onChange={(e) => setReqForm({ ...reqForm, unit: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Jenis Request (Auto-Extracted)
                        </label>
                        <select
                          disabled={!allowManualOverride}
                          value={reqForm.request_type}
                          onChange={(e) =>
                            setReqForm({ ...reqForm, request_type: e.target.value as RequestType })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-bold"
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="WARRANTY">WARRANTY (Analisis Paralel NGC)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Nomor WO (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.wo_number}
                          onChange={(e) => setReqForm({ ...reqForm, wo_number: e.target.value })}
                          placeholder="-"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Nomor PO (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.po_number}
                          onChange={(e) => setReqForm({ ...reqForm, po_number: e.target.value })}
                          placeholder="-"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Material ID (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.material_id}
                          onChange={(e) => setReqForm({ ...reqForm, material_id: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Part Number (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.part_number}
                          onChange={(e) => setReqForm({ ...reqForm, part_number: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Quantity Request (Auto-Extracted)
                        </label>
                        <input
                          type="number"
                          min="1"
                          disabled={!allowManualOverride}
                          value={reqForm.requested_qty}
                          onChange={(e) => setReqForm({ ...reqForm, requested_qty: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-600 mb-1">
                          Deskripsi Part (Auto-Extracted)
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.description}
                          onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Keterangan PDF VOTP
                        </label>
                        <input
                          type="text"
                          disabled={!allowManualOverride}
                          value={reqForm.additional_notes}
                          onChange={(e) => setReqForm({ ...reqForm, additional_notes: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-700"
                        />
                      </div>

                      {reqForm.request_type === 'WARRANTY' && (
                        <div className="sm:col-span-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <label className="block font-bold text-purple-900 mb-1">
                            Catatan Klaim Warranty (Auto-Extracted dari PDF VOTP)
                          </label>
                          <textarea
                            rows={2}
                            disabled={!allowManualOverride}
                            value={reqForm.warranty_note}
                            onChange={(e) => setReqForm({ ...reqForm, warranty_note: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg border border-purple-300 bg-white disabled:bg-purple-100/50 text-purple-950"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Action Buttons (Section 6 Specification) */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReqForm(EMPTY_FORM);
                        setExtractedPdfText(DEFAULT_EXTRACTED.raw_pdf_text);
                        setFormErrors({});
                      }}
                      className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Reset ke Default PDF
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveOrSendRequest('DRAFT')}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveOrSendRequest('DRAFT')}
                        className="px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-800"
                      >
                        Save Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveOrSendRequest('PROCESSED')}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
                      >
                        Process Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveOrSendRequest('SENT_TO_WHS')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send to WHS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = reqForm.id || requests[0]?.id;
                          if (targetId) setPrintRequestId(targetId);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Request
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetReq = requests.find((r) => r.id === reqForm.id) || requests[0];
                          if (targetReq) openAssRevisionModal(targetReq);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit/Revise
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = reqForm.id || requests[0]?.id;
                          if (targetId) setSelectedRequestId(targetId);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                      >
                        <History className="w-3.5 h-3.5" />
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  VIEW 3: REQUEST QUEUES (ALL REQUESTS, WHS QUEUE, WHS OPS, CANCELLED, REVISION REQUIRED)
                  ============================================================ */}
              {(activeTab === 'all_requests' ||
                activeTab === 'whs_queue' ||
                activeTab === 'whs_ops' ||
                activeTab === 'cancelled_requests' ||
                activeTab === 'revision_required') && (
                <div className="space-y-4">
                  {/* Filter Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {activeTab === 'all_requests'
                          ? 'Semua Request Material (ASS/COP)'
                          : activeTab === 'whs_queue'
                            ? 'Paket Informasi Antrean Warehouse (WHS Queue)'
                            : activeTab === 'whs_ops'
                              ? 'Operasional Pengambilan Part: COLLECT → READY → RECEIVED'
                              : 'Daftar Request CANCELLED BY WHS & Perlu Revisi ASS/COP'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Paket informasi menampilkan Link VOTP, WO/PO, Requester, DO, TO, dan Keterangan Warranty.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari ID, Unit, Part, DO/TO..."
                          className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300"
                        />
                      </div>
                      <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Unit</option>
                        {allUnits.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="PROCESSED">PROCESSED</option>
                        <option value="SENT_TO_WHS">SENT_TO_WHS</option>
                        <option value="COLLECT">COLLECT</option>
                        <option value="READY">READY</option>
                        <option value="RECEIVED">RECEIVED</option>
                        <option value="CANCELLED_BY_WHS">CANCELLED_BY_WHS</option>
                      </select>
                    </div>
                  </div>

                  {/* Queue Cards List (Field-friendly WHS Info Package - Section 7) */}
                  <div className="grid grid-cols-1 gap-4">
                    {visibleRequests
                      .filter((r) => {
                        if (activeTab === 'whs_queue') return r.status === 'SENT_TO_WHS';
                        if (activeTab === 'whs_ops')
                          return ['SENT_TO_WHS', 'COLLECT', 'READY', 'RECEIVED'].includes(r.status);
                        if (activeTab === 'cancelled_requests' || activeTab === 'revision_required')
                          return (
                            r.status === 'CANCELLED_BY_WHS' || r.status === 'ACTION_REQUIRED_ASS'
                          );
                        return true;
                      })
                      .map((r) => {
                        const isOverSla =
                          r.actual_lead_time_minutes !== null &&
                          r.actual_lead_time_minutes > r.target_lead_time_snapshot;
                        return (
                          <div
                            key={r.id}
                            className={`bg-white rounded-xl border p-4 shadow-sm transition ${
                              r.status === 'CANCELLED_BY_WHS'
                                ? 'border-red-300 bg-red-50/20'
                                : isOverSla
                                  ? 'border-amber-300'
                                  : 'border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {r.request_number}
                                  </span>
                                  <StatusBadge status={r.status} />
                                  <WarrantyBadge status={r.warranty_status} type={r.request_type} />
                                  {r.current_revision > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                                      Revisi #{r.current_revision}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600">
                                  Unit: <strong className="text-slate-900">{r.unit}</strong> • Part:{' '}
                                  <strong className="text-slate-900">{r.part_number}</strong> (
                                  {r.description}) • Qty:{' '}
                                  <strong className="text-slate-900">{r.requested_qty} pcs</strong>
                                  {r.supplied_qty !== null && ` (Supplied: ${r.supplied_qty} pcs)`}
                                </div>
                              </div>

                              {/* Quick Utility Buttons: Open VOTP, Copy Reference, Print A4, History */}
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <a
                                  href={r.source_votp_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Open VOTP
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    copyTextSafe(
                                      `${r.request_number} | VOTP: ${r.source_votp_url} | DO: ${r.do_number} | TO: ${r.to_number}`
                                    );
                                    showToast('info', `Referensi ${r.request_number} disalin ke clipboard.`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Ref
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPrintRequestId(r.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Print A4
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequestId(r.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                >
                                  <History className="w-3.5 h-3.5" />
                                  Detail & Riwayat
                                </button>
                              </div>
                            </div>

                            {/* WHS Package Information Grid (A: VOTP, B: WO/PO, C: Requester, D: DO, E: TO, F: Warranty Note) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-3 text-xs">
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  A. Link VOTP
                                </div>
                                <div className="font-mono text-[11px] text-blue-700 truncate mt-0.5">
                                  {r.source_votp_url}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  B. Referensi WO / PO
                                </div>
                                <div className="font-semibold text-slate-800 mt-0.5">
                                  {r.wo_number ? `WO: ${r.wo_number}` : ''}{' '}
                                  {r.po_number ? `PO: ${r.po_number}` : ''}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  C. Requester
                                </div>
                                <div className="font-semibold text-slate-800 mt-0.5">{r.requester}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  D. Delivery Order (DO)
                                </div>
                                <div className="font-bold text-slate-900 mt-0.5">{r.do_number || '-'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  E. Transfer Order (TO)
                                </div>
                                <div className="font-bold text-slate-900 mt-0.5">{r.to_number || '-'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                  SLA & Lead Time WHS
                                </div>
                                <div className="font-semibold text-slate-800 mt-0.5">
                                  {r.actual_lead_time_minutes !== null ? (
                                    <span
                                      className={
                                        r.actual_lead_time_minutes > r.target_lead_time_snapshot
                                          ? 'text-red-600 font-bold'
                                          : 'text-emerald-700 font-bold'
                                      }
                                    >
                                      {r.actual_lead_time_minutes} mnt (Target {r.target_lead_time_snapshot}m)
                                    </span>
                                  ) : (
                                    <span>Target: {r.target_lead_time_snapshot} menit</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Warranty Note or Cancellation Banner if applicable */}
                            {r.request_type === 'WARRANTY' && r.warranty_note && (
                              <div className="mb-3 p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900">
                                <strong>F. Keterangan Warranty:</strong> {r.warranty_note}
                                {r.warranty_followup_wo_gi && (
                                  <div className="mt-1 text-[11px] font-semibold text-purple-800">
                                    Tindak Lanjut ASS/COP: {r.warranty_followup_wo_gi}
                                  </div>
                                )}
                              </div>
                            )}

                            {r.status === 'CANCELLED_BY_WHS' && (
                              <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <strong>Alasan CANCEL oleh WHS:</strong> {r.cancel_reason}{' '}
                                  {r.cancel_notes ? `— "${r.cancel_notes}"` : ''} (Pada{' '}
                                  {formatDateTime(r.cancelled_at)})
                                </div>
                                {currentUser.role === 'ASS_COP' && (
                                  <button
                                    type="button"
                                    onClick={() => openAssRevisionModal(r)}
                                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                                  >
                                    Evaluasi & Revisi DO/TO
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Footer Workflow Actions */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="text-[11px] text-slate-500">
                                Dikirim ke WHS: <strong>{formatDateTime(r.sent_to_whs_at)}</strong> •
                                COLLECT: <strong>{formatDateTime(r.collect_at)}</strong> • READY:{' '}
                                <strong>{formatDateTime(r.ready_at)}</strong> • RECEIVED:{' '}
                                <strong>{formatDateTime(r.received_at)}</strong>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* ASS/COP Actions */}
                                {currentUser.role === 'ASS_COP' &&
                                  (r.status === 'DRAFT' || r.status === 'PROCESSED') && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendExistingToWhs(r)}
                                      className={`px-3 py-1.5 rounded-lg text-white font-semibold ${theme.bg}`}
                                    >
                                      Send to WHS
                                    </button>
                                  )}
                                {currentUser.role === 'ASS_COP' && (
                                  <button
                                    type="button"
                                    onClick={() => openAssRevisionModal(r)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Edit / Revise DO & TO
                                  </button>
                                )}

                                {/* WHS Operational Buttons */}
                                {currentUser.role === 'WHS' && r.status === 'SENT_TO_WHS' && (
                                  <button
                                    type="button"
                                    onClick={() => openWhsTransitionModal(r, 'COLLECT')}
                                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                  >
                                    1. Mulai COLLECT
                                  </button>
                                )}
                                {currentUser.role === 'WHS' && r.status === 'COLLECT' && (
                                  <button
                                    type="button"
                                    onClick={() => openWhsTransitionModal(r, 'READY')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                  >
                                    2. Set READY (Hitung SLA)
                                  </button>
                                )}
                                {currentUser.role === 'WHS' && r.status === 'READY' && (
                                  <button
                                    type="button"
                                    onClick={() => openWhsTransitionModal(r, 'RECEIVED')}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                  >
                                    3. Konfirmasi RECEIVED
                                  </button>
                                )}
                                {currentUser.role === 'WHS' &&
                                  ['SENT_TO_WHS', 'COLLECT', 'READY'].includes(r.status) && (
                                    <button
                                      type="button"
                                      onClick={() => openWhsCancelModal(r)}
                                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                                    >
                                      CANCEL Request
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ============================================================
                  VIEW 4: WAREHOUSE KPI & CASE OPEN (Section 9 Specification)
                  ============================================================ */}
              {(activeTab === 'whs_kpi' || activeTab === 'case_open') && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        KPI Lead Time Warehouse & Manajemen Case Open (SLA)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Rumus: <code>Lead Time = ready_at - sent_to_whs_at</code>. Jika melampaui target
                        snapshot ({settings.warehouse_lead_time_minutes} menit), Case Open dibuat otomatis.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <input
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                        title="Filter Tanggal"
                      />
                      <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Unit</option>
                        {allUnits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="SENT_TO_WHS">SENT_TO_WHS</option>
                        <option value="COLLECT">COLLECT</option>
                        <option value="READY">READY</option>
                        <option value="RECEIVED">RECEIVED</option>
                      </select>
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Pengguna / PIC</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 10 KPI Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">Total Request Diproses</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{kpiMetrics.totalProcessed}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">READY / RECEIVED</div>
                      <div className="text-xl font-bold text-emerald-700 mt-1">
                        {kpiMetrics.readyCount} / {kpiMetrics.receivedCount}
                      </div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">Rata-rata / Median Lead Time</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {kpiMetrics.avgLeadTime}m / {kpiMetrics.medianLeadTime}m
                      </div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">Persentase On-Time READY</div>
                      <div className="text-xl font-bold text-blue-700 mt-1">{kpiMetrics.onTimePct}%</div>
                      <div className="text-[10px] text-red-600">Lewat SLA: {kpiMetrics.slaBreachCount} req</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/30">
                      <div className="text-[11px] text-red-800 font-semibold">Case Open (Belum Selesai / Total)</div>
                      <div className="text-xl font-bold text-red-600 mt-1">
                        {kpiMetrics.openCasesCount} / {kpiMetrics.totalCases}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Rata-rata tutup case: {kpiMetrics.avgCloseMinutes || 15} mnt
                      </div>
                    </div>
                  </div>

                  {/* Charts & Top Delay Causes */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">
                        Perbandingan Actual Lead Time vs Target SLA Snapshot (Menit)
                      </h3>
                      <div className="relative h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kpiMetrics.leadTimeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="actual" name="Actual Lead Time (m)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="target" name="Target SLA Snapshot (m)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">
                        Daftar Penyebab Keterlambatan Terbanyak (Root Cause)
                      </h3>
                      <div className="space-y-2.5 text-xs">
                        {kpiMetrics.topCauses.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <span className="font-medium text-slate-800">{item.cause}</span>
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                              {item.count} kasus
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Case Open Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Daftar Case Open Keterlambatan SLA Warehouse
                        </h3>
                        <p className="text-xs text-slate-500">
                          WHS mengisi Root Cause & Corrective Action. ASS/COP melakukan verifikasi dan penutupan akhir (wajib dengan Catatan Penyelesaian).
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <th className="py-2.5 px-3 font-semibold">Case ID</th>
                            <th className="py-2.5 px-3 font-semibold">Request ID</th>
                            <th className="py-2.5 px-3 font-semibold">Target / Actual / Delay</th>
                            <th className="py-2.5 px-3 font-semibold">Root Cause & Corrective Action</th>
                            <th className="py-2.5 px-3 font-semibold">PIC & Status</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {whsCases.map((c) => {
                            const req = requests.find((r) => r.id === c.request_id);
                            return (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="py-3 px-3 font-bold text-slate-900">
                                  <div>{c.case_number}</div>
                                  <div className="text-[10px] text-slate-500">
                                    Dibuka: {formatDateTime(c.opened_at)}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-blue-700">
                                    {req?.request_number || c.request_id} (Rev #{c.revision_number})
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Unit: {req?.unit} • {req?.part_number}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div>Target Snapshot: {c.target_minutes_snapshot} mnt</div>
                                  <div className="font-bold text-red-600">
                                    Actual: {c.actual_minutes} mnt (Delay +{c.delay_minutes} mnt)
                                  </div>
                                </td>
                                <td className="py-3 px-3 max-w-xs">
                                  <div>
                                    <strong>RCA:</strong> {c.root_cause || <em className="text-red-600">Belum diisi WHS</em>}
                                  </div>
                                  <div className="text-slate-600 mt-0.5">
                                    <strong>CA:</strong> {c.corrective_action || '-'}
                                  </div>
                                  {c.close_note && (
                                    <div className="text-emerald-700 mt-0.5">
                                      <strong>Close Note:</strong> {c.close_note}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                      c.status === 'OPEN'
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                  <div className="text-[11px] text-slate-500 mt-1">{c.pic_name}</div>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => openCaseModal(c)}
                                    className={`px-3 py-1.5 rounded-lg text-white font-semibold ${
                                      c.status === 'OPEN' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700'
                                    }`}
                                  >
                                    {c.status === 'OPEN'
                                      ? currentUser.role === 'ASS_COP'
                                        ? 'Verifikasi & Tutup Case'
                                        : 'Isi RCA & Korektif'
                                      : 'Lihat Detail Case'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {/* ============================================================
                  VIEW 5: WARRANTY TRACKING, NGC QUEUE & ANALYSIS HISTORY (Section 11)
                  ============================================================ */}
              {(activeTab === 'warranty_tracking' ||
                activeTab === 'warranty_queue' ||
                activeTab === 'analysis_history') && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                        {activeTab === 'warranty_queue'
                          ? 'Antrean Pemeriksaan & Analisis Klaim Warranty (NGC)'
                          : activeTab === 'analysis_history'
                            ? 'Riwayat Keputusan Analisis Warranty (NGC)'
                            : 'Monitoring Klaim Warranty & Tindak Lanjut WO/GI (ASS/COP)'}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        PENTING: Status Warranty dipisahkan secara ketat dari status Warehouse. Status{' '}
                        <code>READY</code> atau <code>RECEIVED</code> di gudang tidak mengubah status klaim warranty secara otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {requests
                      .filter((r) => {
                        if (r.request_type !== 'WARRANTY') return false;
                        if (activeTab === 'warranty_queue')
                          return r.warranty_status === 'WARRANTY_PENDING';
                        if (activeTab === 'analysis_history')
                          return r.warranty_status !== 'WARRANTY_PENDING';
                        return true;
                      })
                      .map((r) => {
                        const war = warranties.find((w) => w.request_id === r.id);
                        return (
                          <div
                            key={r.id}
                            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {r.request_number}
                                  </span>
                                  <WarrantyBadge status={r.warranty_status} type={r.request_type} />
                                  <StatusBadge status={r.status} />
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                  Unit: <strong>{r.unit}</strong> • Part:{' '}
                                  <strong>{r.part_number}</strong> — {r.description} (
                                  {r.requested_qty} pcs) •{' '}
                                  <span className="font-semibold text-purple-800">
                                    Usia Kasus Warranty:{' '}
                                    {Math.max(
                                      1,
                                      Math.round(
                                        (new Date('2026-10-19T14:00:00Z').getTime() -
                                          new Date(r.created_at).getTime()) /
                                          3600000
                                      )
                                    )}{' '}
                                    jam
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <a
                                  href={r.source_votp_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Buka VOTP
                                </a>
                                <button
                                  type="button"
                                  onClick={() => openWarrantyModal(r)}
                                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                >
                                  {currentUser.role === 'NGC'
                                    ? 'Input Analisis / Keputusan NGC'
                                    : 'Tindak Lanjut / Lihat Analisis'}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200">
                                <div className="font-bold text-purple-900 mb-1">
                                  Catatan Klaim Awal (ASS/COP):
                                </div>
                                <p className="text-slate-700">{r.warranty_note || '-'}</p>
                                <div className="mt-2 text-[11px] text-slate-500">
                                  Referensi: {r.wo_number ? `WO: ${r.wo_number}` : ''}{' '}
                                  {r.po_number ? `PO: ${r.po_number}` : ''} • Tanggal: {r.request_date}
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="font-bold text-slate-900 mb-1">
                                  Hasil Pemeriksaan & Keputusan NGC:
                                </div>
                                <p className="text-slate-700">
                                  <strong>Temuan:</strong>{' '}
                                  {war?.findings || 'Menunggu pemeriksaan tim NGC'}
                                </p>
                                {war?.decision_reason && (
                                  <p className="text-slate-700 mt-1">
                                    <strong>Alasan Keputusan:</strong> {war.decision_reason}
                                  </p>
                                )}
                                {war?.evidence_paths && war.evidence_paths.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {war.evidence_paths.map((ep, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px] text-slate-700"
                                      >
                                        {ep}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {(r.warranty_followup_wo_gi || war?.followup_notes) && (
                                  <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                                    Tindak Lanjut ASS/COP (WO Baru / GI):{' '}
                                    {r.warranty_followup_wo_gi || war?.followup_notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ============================================================
                  VIEW 6: TRANSACTIONS MANAGEMENT & EXPORT CSV/XLSX (Section 15)
                  ============================================================ */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Transaction Management & Data Export (CSV / XLSX)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Menampilkan seluruh riwayat transaksi, timestamp operasional WHS, Lead Time, SLA, Case Open, dan Revisi.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportTransactions('CSV')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportTransactions('XLSX')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold shadow-sm ${theme.bg} ${theme.hover}`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Export XLSX
                      </button>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                    <div className="lg:col-span-2 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setTxPage(1);
                        }}
                        placeholder="Cari Request ID, VOTP, WO/PO, DO/TO, Part..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setTxPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="ALL">Semua Status WHS</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="PROCESSED">PROCESSED</option>
                      <option value="SENT_TO_WHS">SENT_TO_WHS</option>
                      <option value="COLLECT">COLLECT</option>
                      <option value="READY">READY</option>
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="CANCELLED_BY_WHS">CANCELLED_BY_WHS</option>
                    </select>
                    <select
                      value={unitFilter}
                      onChange={(e) => {
                        setUnitFilter(e.target.value);
                        setTxPage(1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="ALL">Semua Unit</option>
                      {allUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                      title="Dari Tanggal"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTxSortAsc((prev) => !prev)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-medium"
                      >
                        Sort: {txSortAsc ? 'Terlama ↑' : 'Terbaru ↓'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setUnitFilter('ALL');
                          setTypeFilter('ALL');
                          setDateFromFilter('');
                          setDateToFilter('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Comprehensive Transactions Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 whitespace-nowrap">
                            <th className="py-2.5 px-3 font-semibold">Request ID & Tanggal</th>
                            <th className="py-2.5 px-3 font-semibold">Link VOTP</th>
                            <th className="py-2.5 px-3 font-semibold">Requester & Unit</th>
                            <th className="py-2.5 px-3 font-semibold">Jenis & Warranty</th>
                            <th className="py-2.5 px-3 font-semibold">WO / PO / DO / TO</th>
                            <th className="py-2.5 px-3 font-semibold">Material / Part / Qty</th>
                            <th className="py-2.5 px-3 font-semibold">Status WHS & Timestamps</th>
                            <th className="py-2.5 px-3 font-semibold">Lead Time & SLA</th>
                            <th className="py-2.5 px-3 font-semibold">Rev / Cancel</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {[...visibleRequests]
                            .sort((a, b) =>
                              txSortAsc
                                ? a.request_number.localeCompare(b.request_number)
                                : b.request_number.localeCompare(a.request_number)
                            )
                            .slice((txPage - 1) * 5, txPage * 5)
                            .map((r) => {
                              const cOpen = whsCases.find(
                                (c) => c.request_id === r.id && c.revision_number === r.current_revision
                              );
                              return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{r.request_number}</div>
                                    <div className="text-[11px] text-slate-500">{r.request_date}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <a
                                      href={r.source_votp_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                                    >
                                      Buka Link
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-800">{r.unit}</div>
                                    <div className="text-[11px] text-slate-500">{r.requester}</div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <WarrantyBadge status={r.warranty_status} type={r.request_type} />
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                                    <div>
                                      WO: <strong>{r.wo_number || '-'}</strong> | PO:{' '}
                                      <strong>{r.po_number || '-'}</strong>
                                    </div>
                                    <div>
                                      DO: <strong>{r.do_number || '-'}</strong> | TO:{' '}
                                      <strong>{r.to_number || '-'}</strong>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-semibold text-slate-800">
                                      {r.material_id} / {r.part_number}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                                      {r.description} ({r.requested_qty} pcs)
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge status={r.status} />
                                    <div className="text-[10px] text-slate-500 mt-1">
                                      Sent: {formatDateTime(r.sent_to_whs_at)}
                                      <br />
                                      Ready: {formatDateTime(r.ready_at)}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {r.actual_lead_time_minutes !== null ? (
                                      <div>
                                        <span
                                          className={`font-bold ${
                                            r.actual_lead_time_minutes > r.target_lead_time_snapshot
                                              ? 'text-red-600'
                                              : 'text-emerald-700'
                                          }`}
                                        >
                                          {r.actual_lead_time_minutes} mnt
                                        </span>{' '}
                                        <span className="text-[10px] text-slate-500">
                                          (SLA {r.target_lead_time_snapshot}m)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">Belum READY</span>
                                    )}
                                    {cOpen && (
                                      <div className="text-[10px] font-bold text-red-600 mt-0.5">
                                        {cOpen.case_number} ({cOpen.status})
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px]">
                                    <div>Rev #{r.current_revision}</div>
                                    {r.cancel_reason && (
                                      <div className="text-red-600 truncate max-w-[120px]">
                                        {r.cancel_reason}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequestId(r.id)}
                                      className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 font-medium"
                                    >
                                      Detail
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Menampilkan {visibleRequests.length} transaksi (Filter Status: {statusFilter}, Unit:{' '}
                        {unitFilter})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={txPage <= 1}
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-semibold">Halaman {txPage}</span>
                        <button
                          type="button"
                          disabled={txPage * 5 >= visibleRequests.length}
                          onClick={() => setTxPage((p) => p + 1)}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================
                  VIEW 7: NOTIFICATIONS CENTER (Section 13 Specification)
                  ============================================================ */}
              {activeTab === 'notifications' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Pusat Notifikasi In-App ({currentUser.role})
                      </h2>
                      <p className="text-xs text-slate-500">
                        Menampilkan notifikasi real-time sesuai hak akses role penerima (WHS Queue, Cancel, Revisi ASS/COP, SLA Case Open, dan Keputusan Warranty NGC).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nowIso = new Date().toISOString();
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.recipient_role === currentUser.role || n.recipient_id === currentUser.id
                              ? { ...n, read_at: n.read_at || nowIso }
                              : n
                          )
                        );
                        showToast('info', 'Semua notifikasi telah ditandai sudah dibaca.');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {roleNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs ${
                          n.read_at
                            ? 'bg-white border-slate-200 text-slate-600'
                            : 'bg-blue-50/50 border-blue-300 text-slate-900'
                        }`}
                      >
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] font-bold">
                              {n.notification_type}
                            </span>
                            <span className="font-bold text-sm">{n.title}</span>
                            {!n.read_at && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                UNREAD
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700">{n.message}</p>
                          <div className="text-[11px] text-slate-400">
                            Waktu kejadian: {formatDateTime(n.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id
                                    ? { ...item, read_at: item.read_at || new Date().toISOString() }
                                    : item
                                )
                              );
                              setSelectedRequestId(n.request_id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-white font-semibold ${theme.bg}`}
                          >
                            Buka Detail Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ============================================================
                  VIEW 8: SETTINGS — EXCLUSIVE TO ASS/COP (Section 14 Specification)
                  ============================================================ */}
              {activeTab === 'settings' && (
                <div className="max-w-5xl mx-auto space-y-5">
                  {currentUser.role !== 'ASS_COP' ? (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-800 space-y-2">
                      <AlertOctagon className="w-8 h-8 text-red-600 mx-auto" />
                      <h3 className="text-base font-bold">
                        Akses Ditolak oleh Kebijakan Row Level Security (RLS 403)
                      </h3>
                      <p className="text-xs">
                        Hanya role <strong>ASS_COP</strong> yang memiliki otorisasi untuk mengakses atau mengubah konfigurasi global aplikasi.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Pengaturan Sistem & Konfigurasi Global (Khusus ASS/COP)
                          </h2>
                          <p className="text-xs text-slate-500">
                            Setiap perubahan divalidasi, mencatat nilai lama & baru di Audit Log, dan tidak mengubah evaluasi SLA historis secara retroaktif.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {(
                            [
                              { id: 'branding', label: 'Branding & Logo' },
                              { id: 'sla', label: 'Warehouse SLA' },
                              { id: 'cancellation', label: 'Cancellation' },
                              { id: 'export', label: 'Data Export' },
                              { id: 'supabase_rls', label: 'Supabase, RLS & Audit Log' }
                            ] as const
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSettingsSubTab(t.id)}
                              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                                settingsSubTab === t.id
                                  ? `${theme.bg} text-white`
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sub-tab 1: Branding */}
                      {settingsSubTab === 'branding' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                              Identitas Brand, Logo Aplikasi & Tema Warna
                            </h3>

                            <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                              <BrandLogo
                                logoPath={settings.logo_path}
                                color={settings.primary_color}
                                size="lg"
                              />
                              <div className="space-y-1.5">
                                <div className="font-bold text-slate-800">
                                  Logo Aplikasi (Supabase Storage Bucket: <code>branding</code>)
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Format diizinkan: PNG, JPG, SVG, WEBP (Maksimal 2 MB). Tampil konsisten di Login, Sidebar, Navbar, dan Cetak A4.
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload / Ganti Logo
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                      onChange={handleLogoFileUpload}
                                      className="hidden"
                                    />
                                  </label>
                                  {settings.logo_path && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const old = settings.logo_path;
                                        setSettings({
                                          ...settings,
                                          logo_path: null,
                                          updated_by: currentUser.id,
                                          updated_at: new Date().toISOString()
                                        });
                                        logAudit(
                                          'RESET_BRAND_LOGO',
                                          'app_settings',
                                          settings.id,
                                          { logo_path: old },
                                          { logo_path: null }
                                        );
                                        showToast('info', 'Logo dikembalikan ke default.');
                                      }}
                                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-semibold"
                                    >
                                      Hapus / Reset Logo Default
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Nama Aplikasi
                              </label>
                              <input
                                type="text"
                                value={settings.app_name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings({ ...settings, app_name: val });
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Teks Subtitle Aplikasi
                              </label>
                              <input
                                type="text"
                                value={settings.app_subtitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings({ ...settings, app_subtitle: val });
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1.5">
                                Warna Utama Aplikasi (Primary Color)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(['blue', 'indigo', 'slate', 'emerald', 'violet'] as ThemeColor[]).map(
                                  (c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        const oldColor = settings.primary_color;
                                        setSettings({
                                          ...settings,
                                          primary_color: c,
                                          updated_by: currentUser.id,
                                          updated_at: new Date().toISOString()
                                        });
                                        logAudit(
                                          'UPDATE_PRIMARY_COLOR',
                                          'app_settings',
                                          settings.id,
                                          { primary_color: oldColor },
                                          { primary_color: c }
                                        );
                                        showToast('success', `Warna utama diubah ke ${c.toUpperCase()}.`);
                                      }}
                                      className={`px-3 py-1.5 rounded-lg border font-semibold capitalize flex items-center gap-1.5 ${
                                        settings.primary_color === c
                                          ? 'border-slate-900 bg-slate-900 text-white'
                                          : 'border-slate-200 bg-white text-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`w-3 h-3 rounded-full ${THEME_CLASSES[c].bg}`}
                                      />
                                      {c}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  logAudit(
                                    'UPDATE_BRANDING_SETTINGS',
                                    'app_settings',
                                    settings.id,
                                    null,
                                    {
                                      app_name: settings.app_name,
                                      app_subtitle: settings.app_subtitle,
                                      primary_color: settings.primary_color
                                    }
                                  );
                                  showToast('success', 'Pengaturan Branding berhasil disimpan.');
                                }}
                                className={`px-4 py-2 rounded-lg text-white font-semibold ${theme.bg}`}
                              >
                                Simpan Perubahan Branding
                              </button>
                            </div>
                          </div>

                          {/* Live Preview Card */}
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                              Live Preview Login & Header
                            </h3>
                            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3">
                              <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2 shadow-sm">
                                <div className="flex justify-center">
                                  <BrandLogo
                                    logoPath={settings.logo_path}
                                    color={settings.primary_color}
                                    size="md"
                                  />
                                </div>
                                <div className="font-bold text-slate-900">{settings.app_name}</div>
                                <div className="text-[10px] text-slate-500">
                                  {settings.app_subtitle}
                                </div>
                                <div
                                  className={`w-full py-1.5 rounded text-white text-[11px] font-semibold ${theme.bg}`}
                                >
                                  Tombol Login Utama
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 2: Warehouse SLA */}
                      {settingsSubTab === 'sla' && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                            Konfigurasi Target SLA Lead Time & Kebijakan Case Open
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Target Lead Time Warehouse (Menit — Default: 25)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="1440"
                                value={settings.warehouse_lead_time_minutes}
                                onChange={(e) => {
                                  const oldVal = settings.warehouse_lead_time_minutes;
                                  const newVal = Math.max(1, Number(e.target.value) || 25);
                                  setSettings({
                                    ...settings,
                                    warehouse_lead_time_minutes: newVal,
                                    updated_by: currentUser.id,
                                    updated_at: new Date().toISOString()
                                  });
                                  logAudit(
                                    'UPDATE_SLA_TARGET_MINUTES',
                                    'app_settings',
                                    settings.id,
                                    { warehouse_lead_time_minutes: oldVal },
                                    { warehouse_lead_time_minutes: newVal }
                                  );
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                              />
                              <p className="text-[11px] text-slate-500 mt-1">
                                Perubahan nilai ini hanya berlaku untuk request baru yang dikirim ke WHS setelah ini (request lama tetap dievaluasi dengan nilai <code>target_lead_time_snapshot</code> masing-masing).
                              </p>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Kebijakan Verifikasi & Penutupan Case Open
                              </label>
                              <select
                                value={settings.case_close_policy}
                                onChange={(e) => {
                                  const val = e.target.value as AppSettings['case_close_policy'];
                                  setSettings({ ...settings, case_close_policy: val });
                                  logAudit(
                                    'UPDATE_CASE_CLOSE_POLICY',
                                    'app_settings',
                                    settings.id,
                                    { case_close_policy: settings.case_close_policy },
                                    { case_close_policy: val }
                                  );
                                  showToast('success', 'Kebijakan penutupan Case Open diperbarui.');
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                              >
                                <option value="ASS_COP_VERIFY">
                                  Default: WHS Isi RCA, ASS/COP Verifikasi & Close Case
                                </option>
                                <option value="WHS_DIRECT_WITH_NOTE">
                                  WHS atau ASS/COP Dapat Close Case (Wajib Catatan Penyelesaian)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Titik Awal Penghitungan Lead Time
                              </label>
                              <input
                                type="text"
                                disabled
                                value="SENT_TO_WHS (sent_to_whs_at)"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Titik Akhir Penghitungan Lead Time
                              </label>
                              <input
                                type="text"
                                disabled
                                value="READY (ready_at)"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 3: Cancellation Reasons */}
                      {settingsSubTab === 'cancellation' && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                            Daftar Alasan CANCEL Wajib & Notifikasi ASS/COP
                          </h3>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCancelReasonInput}
                              onChange={(e) => setNewCancelReasonInput(e.target.value)}
                              placeholder="Tambahkan opsi alasan CANCEL baru..."
                              className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const clean = newCancelReasonInput.trim();
                                if (!clean) return;
                                if (settings.cancel_reasons.includes(clean)) {
                                  showToast('error', 'Alasan tersebut sudah ada dalam daftar.');
                                  return;
                                }
                                const updated = [...settings.cancel_reasons, clean];
                                setSettings({ ...settings, cancel_reasons: updated });
                                setNewCancelReasonInput('');
                                logAudit(
                                  'ADD_CANCEL_REASON',
                                  'app_settings',
                                  settings.id,
                                  { cancel_reasons: settings.cancel_reasons },
                                  { cancel_reasons: updated }
                                );
                                showToast('success', `Alasan "${clean}" berhasil ditambahkan.`);
                              }}
                              className={`px-4 py-2 rounded-lg text-white font-semibold ${theme.bg}`}
                            >
                              Tambah Alasan
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {settings.cancel_reasons.map((reason) => (
                              <span
                                key={reason}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 font-medium text-slate-800"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 4: Data Export Settings */}
                      {settingsSubTab === 'export' && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
                          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                            Pengaturan Format & Kolom Ekspor Transaksi
                          </h3>
                          <div className="flex items-center gap-4">
                            <label className="font-semibold text-slate-700">Default Format Ekspor:</label>
                            {(['XLSX', 'CSV'] as const).map((fmt) => (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => {
                                  setSettings({ ...settings, default_export_format: fmt });
                                  showToast('success', `Default format ekspor diatur ke ${fmt}.`);
                                }}
                                className={`px-3 py-1.5 rounded-lg font-semibold border ${
                                  settings.default_export_format === fmt
                                    ? `${theme.bg} text-white border-transparent`
                                    : 'bg-white border-slate-300 text-slate-700'
                                }`}
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                            <strong>Keamanan Ekspor:</strong> Password, token autentikasi, dan service-role key tidak pernah disertakan dalam ekspor CSV/XLSX.
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 5: Supabase Connector, RLS Matrix & Immutable Audit Log */}
                      {settingsSubTab === 'supabase_rls' && (
                        <div className="space-y-5 text-xs">
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <Database className="w-4 h-4 text-blue-600" />
                              Konfigurasi Environment Supabase & Netlify Deployment
                            </h3>
                            <p className="text-slate-600">
                              Paket lengkap SQL Migrations (<code>001_initial_schema.sql</code>,{' '}
                              <code>002_rls_and_storage_policies.sql</code>,{' '}
                              <code>003_seed_data.sql</code>) dan <code>netlify.toml</code> telah disiapkan di dalam bundel kode sumber aplikasi.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  VITE_SUPABASE_URL
                                </label>
                                <input
                                  type="text"
                                  value={supabaseUrlInput}
                                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  VITE_SUPABASE_ANON_KEY (Publishable Key — RLS Aktif)
                                </label>
                                <input
                                  type="password"
                                  value={supabaseAnonInput}
                                  onChange={(e) => setSupabaseAnonInput(e.target.value)}
                                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Audit Logs Table */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200">
                              <h3 className="text-sm font-bold text-slate-900">
                                Immutable Audit Trail (Tabel <code>audit_logs</code>)
                              </h3>
                              <p className="text-slate-500">
                                Mencatat setiap perubahan status, pembuatan Case Open, alasan CANCEL, revisi DO/TO, keputusan Warranty, dan perubahan Settings.
                              </p>
                            </div>
                            <div className="overflow-x-auto max-h-80">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                    <th className="py-2 px-3 font-semibold">Waktu</th>
                                    <th className="py-2 px-3 font-semibold">Aktor</th>
                                    <th className="py-2 px-3 font-semibold">Aksi & Entitas</th>
                                    <th className="py-2 px-3 font-semibold">Old Values → New Values</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {auditLogs.map((log) => {
                                    const actor =
                                      profiles.find((p) => p.id === log.actor_id)?.full_name ||
                                      log.actor_id;
                                    return (
                                      <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-500">
                                          {formatDateTime(log.created_at)}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-800">
                                          {actor}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono text-[10px]">
                                            {log.action}
                                          </span>{' '}
                                          <span className="text-slate-600">
                                            ({log.entity_type}: <strong>{log.entity_id}</strong>)
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[10px] text-slate-600 max-w-md truncate">
                                          {log.old_values ? JSON.stringify(log.old_values) : 'null'} →{' '}
                                          {log.new_values ? JSON.stringify(log.new_values) : 'null'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ====================================================================
          12. MODALS (WHS TRANSITION, WHS CANCEL, ASS REVISION, CASE OPEN, WARRANTY, DETAIL, PRINT A4)
          ==================================================================== */}

      {/* MODAL 1: WHS Status Transition (COLLECT / READY / RECEIVED) */}
      {whsActionModal && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmWhsStatus}
            className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">
              Konfirmasi Status Warehouse: {whsActionModal.targetStatus}
            </h3>
            <p className="text-slate-600">
              Request: <strong>{whsActionModal.request.request_number}</strong> • Unit:{' '}
              <strong>{whsActionModal.request.unit}</strong> ({whsActionModal.request.part_number})
            </p>

            {whsActionModal.targetStatus === 'READY' && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                <label className="block font-bold text-blue-900">
                  Durasi Pengambilan Aktual (Menit dari SENT_TO_WHS → READY):
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={whsSimulatedMinutes}
                  onChange={(e) => setWhsSimulatedMinutes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-blue-300 bg-white font-bold"
                />
                <div className="text-[11px] text-blue-800">
                  Target SLA Snapshot Request Ini:{' '}
                  <strong>{whsActionModal.request.target_lead_time_snapshot} menit</strong>.{' '}
                  {Number(whsSimulatedMinutes) > whsActionModal.request.target_lead_time_snapshot ? (
                    <span className="text-red-600 font-bold">
                      (Melebihi Target +{Number(whsSimulatedMinutes) - whsActionModal.request.target_lead_time_snapshot} mnt → Otomatis Buat Case Open!)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold">(Memenuhi Target On-Time SLA)</span>
                  )}
                </div>
              </div>
            )}

            {(whsActionModal.targetStatus === 'READY' ||
              whsActionModal.targetStatus === 'RECEIVED') && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Aktual Disiapkan (Supplied Qty)
                </label>
                <input
                  type="number"
                  min="1"
                  value={whsSuppliedQty}
                  onChange={(e) => setWhsSuppliedQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            )}

            {whsActionModal.targetStatus === 'RECEIVED' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima Barang (Wajib) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={whsRecipientName}
                  onChange={(e) => setWhsRecipientName(e.target.value)}
                  placeholder="Nama mekanik / penerima lapangan"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Operasional WHS (Opsional)
              </label>
              <textarea
                rows={2}
                value={whsActionNotes}
                onChange={(e) => setWhsActionNotes(e.target.value)}
                placeholder="Lokasi rak/bin, kondisi part, atau catatan serah terima..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhsActionModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Simpan Status {whsActionModal.targetStatus}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: WHS CANCEL Request Modal (Section 10 Specification) */}
      {cancelModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmWhsCancel}
            className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-red-200 space-y-4 text-xs"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold">
                Konfirmasi CANCEL Request ({cancelModalRequest.request_number})
              </h3>
            </div>
            <p className="text-slate-600">
              Pembatalan oleh WHS akan mengubah status menjadi <code>CANCELLED_BY_WHS</code> dan
              mengirim notifikasi revisi wajib kepada ASS/COP tanpa menghapus riwayat transaksi.
            </p>

            {cancelError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 font-medium">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan CANCEL (Wajib Dipilih) <span className="text-red-600">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                {settings.cancel_reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Tambahan Kendala{' '}
                {cancelReason === 'Lainnya' && <span className="text-red-600">*(Wajib Diisi)</span>}
              </label>
              <textarea
                rows={3}
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                placeholder="Jelaskan detail kendala stok fisik, selisih qty, kerusakan part, atau masalah DO/TO..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalRequest(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Konfirmasi CANCEL & Kirim ke ASS/COP
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: ASS/COP Revision & Re-Send Modal (Section 10 Specification) */}
      {revisionModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmAssRevision}
            className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4 text-xs my-8"
          >
            <h3 className="text-base font-bold text-slate-900">
              Revisi Dokumen DO/TO & Pengiriman Ulang ke WHS (Revisi #
              {revisionModalRequest.current_revision + 1})
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div>
                Request: <strong>{revisionModalRequest.request_number}</strong> • Status Saat Ini:{' '}
                <strong>{revisionModalRequest.status}</strong>
              </div>
              {revisionModalRequest.cancel_reason && (
                <div className="text-red-700">
                  Alasan Cancel WHS: <strong>{revisionModalRequest.cancel_reason}</strong>{' '}
                  {revisionModalRequest.cancel_notes ? `(${revisionModalRequest.cancel_notes})` : ''}
                </div>
              )}
              <div className="text-slate-500">
                DO Sebelum Revisi: <code>{revisionModalRequest.do_number || '-'}</code> • TO Sebelum
                Revisi: <code>{revisionModalRequest.to_number || '-'}</code>
              </div>
            </div>

            {revError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 font-medium">
                {revError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor DO Sesudah Revisi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={revDoNumber}
                  onChange={(e) => setRevDoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor TO Sesudah Revisi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={revToNumber}
                  onChange={(e) => setRevToNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WO</label>
                <input
                  type="text"
                  value={revWoNumber}
                  onChange={(e) => setRevWoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity Revisi</label>
                <input
                  type="number"
                  min="1"
                  value={revQty}
                  onChange={(e) => setRevQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan Revisi (Wajib Dicatat di Riwayat Revisi) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={revReason}
                onChange={(e) => setRevReason(e.target.value)}
                placeholder="Contoh: Pembukaan ulang DO/TO baru sesuai stok aktual 1 pcs di bin C-12..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Evaluasi ASS/COP (Sesuai SOP)
              </label>
              <input
                type="text"
                value={revAssEvalNote}
                onChange={(e) => setRevAssEvalNote(e.target.value)}
                placeholder="Catatan tindak lanjut administrasi SAP manual..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={revResendToWhs}
                onChange={(e) => setRevResendToWhs(e.target.checked)}
                className="rounded border-slate-300"
              />
              Langsung kirim kembali ke antrean WHS (Status → SENT_TO_WHS)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalRequest(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-4 py-1.5 rounded-lg text-white font-semibold ${theme.bg}`}
              >
                Simpan Revisi & Riwayat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Case Open RCA & Closure Verification Modal (Section 9 Specification) */}
      {caseModalItem && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manajemen Case Open SLA: {caseModalItem.case_number}
                </h3>
                <p className="text-slate-500">
                  Target Snapshot: {caseModalItem.target_minutes_snapshot} mnt • Actual:{' '}
                  <strong className="text-red-600">{caseModalItem.actual_minutes} mnt</strong> (Delay +
                  {caseModalItem.delay_minutes} mnt)
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full font-bold ${
                  caseModalItem.status === 'OPEN'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {caseModalItem.status}
              </span>
            </div>

            {caseError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 font-medium">
                {caseError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Root Cause Keterlambatan (Diisi WHS) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={caseRootCause}
                onChange={(e) => setCaseRootCause(e.target.value)}
                placeholder="Penyebab utama keterlambatan penyiapan part..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tindakan Korektif / Corrective Action (Diisi WHS) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={caseCorrectiveAction}
                onChange={(e) => setCaseCorrectiveAction(e.target.value)}
                placeholder="Langkah perbaikan agar keterlambatan tidak berulang..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Penyelesaian & Verifikasi Penutupan (Wajib Saat Close Case){' '}
                <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={caseCloseNote}
                onChange={(e) => setCaseCloseNote(e.target.value)}
                placeholder="Catatan verifikasi penutupan Case Open (tidak boleh kosong saat ditutup)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCaseModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleSaveCaseOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
              >
                Simpan RCA & Korektif (Tetap OPEN)
              </button>
              {(currentUser.role === 'ASS_COP' ||
                settings.case_close_policy === 'WHS_DIRECT_WITH_NOTE') && (
                <button
                  type="button"
                  onClick={() => handleSaveCaseOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Verifikasi & Close Case Open
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: NGC Warranty Analysis & ASS/COP Follow-up Modal (Section 11 Specification) */}
      {warrantyModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveWarrantyAnalysis}
            className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-purple-200 space-y-4 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Analisis & Keputusan Klaim Warranty ({warrantyModalRequest.request_number})
                </h3>
                <p className="text-slate-500">
                  Unit: <strong>{warrantyModalRequest.unit}</strong> • Part:{' '}
                  <strong>{warrantyModalRequest.part_number}</strong> • Status Gudang:{' '}
                  <strong>{warrantyModalRequest.status}</strong>
                </p>
              </div>
            </div>

            {warError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 font-medium">
                {warError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Keputusan Status Warranty (NGC) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'WARRANTY_PENDING', label: 'PENDING' },
                    { id: 'WARRANTY_APPROVED', label: 'APPROVED' },
                    { id: 'WARRANTY_REJECTED', label: 'REJECTED' }
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    disabled={currentUser.role !== 'NGC'}
                    onClick={() => setWarStatus(st.id)}
                    className={`py-2 px-3 rounded-lg font-bold border transition ${
                      warStatus === st.id
                        ? st.id === 'WARRANTY_APPROVED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st.id === 'WARRANTY_REJECTED'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    } disabled:opacity-60`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hasil Pemeriksaan & Analisis Teknis (Findings NGC) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                disabled={currentUser.role !== 'NGC'}
                value={warFindings}
                onChange={(e) => setWarFindings(e.target.value)}
                placeholder="Catat hasil pembongkaran, pengukuran aus, atau analisis kegagalan komponen..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan Keputusan{' '}
                {warStatus === 'WARRANTY_REJECTED' && (
                  <span className="text-red-600">*(Wajib Diisi untuk REJECTED)</span>
                )}
              </label>
              <textarea
                rows={2}
                disabled={currentUser.role !== 'NGC'}
                value={warDecisionReason}
                onChange={(e) => setWarDecisionReason(e.target.value)}
                placeholder="Alasan teknis persetujuan atau penolakan klaim warranty..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lampiran Bukti Pemeriksaan (Supabase Storage Bucket: <code>warranty-evidence</code>)
              </label>
              {currentUser.role === 'NGC' && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={warEvidenceInput}
                    onChange={(e) => setWarEvidenceInput(e.target.value)}
                    placeholder="warranty-evidence/REQ-XXXX/laporan_inspeksi.pdf"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!warEvidenceInput.trim()) return;
                      setWarEvidenceList((prev) => [...prev, warEvidenceInput.trim()]);
                      setWarEvidenceInput('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-semibold"
                  >
                    + Lampirkan
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {warEvidenceList.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* ASS/COP Follow-up Section */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <label className="block font-bold text-amber-900 mb-1">
                Catatan Tindak Lanjut ASS/COP (Pembuatan WO Baru / Proses GI sesuai SOP):
              </label>
              <textarea
                rows={2}
                disabled={currentUser.role !== 'ASS_COP'}
                value={warAssFollowup}
                onChange={(e) => setWarAssFollowup(e.target.value)}
                placeholder="Diisi oleh ASS/COP ketika klaim selesai dianalisis (khususnya jika REJECTED membutuhkan WO/GI baru)..."
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white disabled:bg-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWarrantyModalRequest(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                Simpan Data Warranty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: Full Request Detail, Revision Diff & Warehouse Events History */}
      {detailRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-5 shadow-xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Detail & Riwayat Transaksi: {detailRequest.request_number}
                </h3>
                <StatusBadge status={detailRequest.status} />
                <WarrantyBadge
                  status={detailRequest.warranty_status}
                  type={detailRequest.request_type}
                />
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-slate-400 font-semibold">Requester & Unit</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {detailRequest.unit} — {detailRequest.requester}
                </div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold">WO / PO</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  WO: {detailRequest.wo_number || '-'} | PO: {detailRequest.po_number || '-'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold">DO / TO Aktif</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  DO: {detailRequest.do_number || '-'} | TO: {detailRequest.to_number || '-'}
                </div>
              </div>
              <div>
                <div className="text-slate-400 font-semibold">Lead Time & SLA</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {detailRequest.actual_lead_time_minutes !== null
                    ? `${detailRequest.actual_lead_time_minutes} mnt (Target ${detailRequest.target_lead_time_snapshot}m)`
                    : `Target: ${detailRequest.target_lead_time_snapshot} mnt`}
                </div>
              </div>
            </div>

            {/* Revision History Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Riwayat Revisi DO/TO (Tabel <code>request_revisions</code>)
              </h4>
              {revisions.filter((rv) => rv.request_id === detailRequest.id).length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                  Belum ada revisi untuk request ini (Revisi #0).
                </div>
              ) : (
                <div className="space-y-2">
                  {revisions
                    .filter((rv) => rv.request_id === detailRequest.id)
                    .map((rv) => (
                      <div
                        key={rv.id}
                        className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 space-y-1"
                      >
                        <div className="font-bold text-blue-900 flex items-center justify-between">
                          <span>Revisi #{rv.revision_number}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            {formatDateTime(rv.revised_at)}
                          </span>
                        </div>
                        <div>
                          <strong>Alasan Revisi:</strong> {rv.revision_reason}
                        </div>
                        <div className="text-[11px] text-slate-700">
                          DO: <code>{rv.previous_do_number}</code> → <strong>{rv.new_do_number}</strong> •
                          TO: <code>{rv.previous_to_number}</code> → <strong>{rv.new_to_number}</strong> •
                          Status: <code>{rv.previous_status}</code> → <strong>{rv.new_status}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Warehouse Operational Event Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Log Event Operasional Warehouse (Tabel <code>warehouse_events</code>)
              </h4>
              <div className="space-y-2">
                {whsEvents
                  .filter((ev) => ev.request_id === detailRequest.id)
                  .map((ev) => {
                    const actorName =
                      profiles.find((p) => p.id === ev.actor_id)?.full_name || ev.actor_id;
                    return (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px]">
                            {ev.event_type} (Rev #{ev.revision_number})
                          </span>{' '}
                          <span className="font-medium text-slate-800">{ev.notes}</span>
                          <div className="text-[10px] text-slate-500 mt-0.5">Oleh: {actorName}</div>
                        </div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(ev.occurred_at)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: A4 Print Layout View (Section 7 Specification) */}
      {printRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl border border-slate-300 text-xs my-8">
            <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div className="font-bold text-slate-700">
                Pratinjau Cetak Kertas A4 — Paket Informasi Lapangan WHS
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold ${theme.bg}`}
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRequestId(null)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable A4 Sheet Content */}
            <div className="space-y-5 text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <BrandLogo logoPath={settings.logo_path} color={settings.primary_color} size="lg" />
                  <div>
                    <h1 className="text-lg font-bold uppercase">{settings.app_name}</h1>
                    <p className="text-xs text-slate-600">
                      LEMBAR KERJA PENGAMBILAN MATERIAL GUDANG (WAREHOUSE PICKING SLIP)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono">{printRequest.request_number}</div>
                  <div className="text-xs font-semibold">
                    Jenis: {printRequest.request_type} | Revisi #{printRequest.current_revision}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border border-slate-400 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">A. Link Referensi VOTP</div>
                  <div className="font-mono font-semibold break-all">{printRequest.source_votp_url}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">B. Nomor WO / PO</div>
                  <div className="font-bold">
                    WO: {printRequest.wo_number || '-'} / PO: {printRequest.po_number || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">C. Requester & Unit</div>
                  <div className="font-bold">
                    {printRequest.requester} — Unit: {printRequest.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    D & E. Delivery Order (DO) & Transfer Order (TO)
                  </div>
                  <div className="text-sm font-bold">
                    DO: {printRequest.do_number || '-'} | TO: {printRequest.to_number || '-'}
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-500 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-500 p-2 text-left">Material ID</th>
                    <th className="border border-slate-500 p-2 text-left">Part Number</th>
                    <th className="border border-slate-500 p-2 text-left">Deskripsi Part</th>
                    <th className="border border-slate-500 p-2 text-right">Qty Request</th>
                    <th className="border border-slate-500 p-2 text-right">Qty Aktual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-500 p-2 font-mono font-bold">
                      {printRequest.material_id}
                    </td>
                    <td className="border border-slate-500 p-2 font-mono font-bold">
                      {printRequest.part_number}
                    </td>
                    <td className="border border-slate-500 p-2">{printRequest.description}</td>
                    <td className="border border-slate-500 p-2 text-right font-bold">
                      {printRequest.requested_qty}
                    </td>
                    <td className="border border-slate-500 p-2 text-right font-bold">
                      {printRequest.supplied_qty ?? '____'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {printRequest.request_type === 'WARRANTY' && (
                <div className="p-3 border border-slate-500 rounded">
                  <strong>F. Keterangan Warranty (Wajib Diperiksa):</strong> {printRequest.warranty_note}
                </div>
              )}

              <div className="grid grid-cols-3 gap-6 pt-8 text-center">
                <div className="border-t border-slate-500 pt-2">
                  <div className="font-bold">Disiapkan Oleh (ASS/COP)</div>
                  <div className="h-12" />
                  <div className="text-[11px] text-slate-600">(Tanda Tangan & Nama Jelas)</div>
                </div>
                <div className="border-t border-slate-500 pt-2">
                  <div className="font-bold">Petugas Gudang (WHS)</div>
                  <div className="h-12" />
                  <div className="text-[11px] text-slate-600">(Tanda Tangan & Jam READY)</div>
                </div>
                <div className="border-t border-slate-500 pt-2">
                  <div className="font-bold">Diterima Oleh (Requester)</div>
                  <div className="h-12" />
                  <div className="text-[11px] text-slate-600">(Tanda Tangan & Jam RECEIVED)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}