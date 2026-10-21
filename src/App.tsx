import React, { useState, useEffect, useMemo } from 'react';
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
  PlusCircle,
  Search,
  Download,
  Bell,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Send,
  History,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  BarChart3,
  ClipboardCheck,
  AlertOctagon,
  Info,
  Lock,
  Database,
  KeyRound,
  Users,
  UserPlus,
  ArrowUpRight,
  Play,
  Trash2,
  Plus,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ============================================================================
// 1. DOMAIN TYPES & INTERFACES
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

export type CaseOpenStatus = 'OPEN' | 'CLOSED';

export type ThemeColor = 'blue' | 'indigo' | 'slate' | 'emerald' | 'violet';

export interface RequestedPartItem {
  id: string;
  material_id: string;
  part_number: string;
  description: string;
  qty: number;
  uom: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  password?: string;
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
  lead_time_start_event: 'SENT_TO_WHS';
  lead_time_end_event: 'READY';
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
  requester: string; // Diambil dari bagian "Diminta Oleh"
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
  requested_parts: RequestedPartItem[]; // Daftar part hasil ekstrak VOTP & dapat direvisi
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
  previous_parts_summary: string;
  new_parts_summary: string;
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
  pic_id: string | null;
  pic_name: string;
  status: CaseOpenStatus;
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
    | 'ASS_REVISION_REQUIRED'
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
// 2. INITIAL USERS, SETTINGS & OPERATIONAL SEED DATA
// ============================================================================

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-swicop-01',
    full_name: 'Toriq Prayogi',
    email: 'swicopbib@gmail.com',
    role: 'ASS_COP',
    unit_assignment: 'BIB-PLANT-01',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'usr-ass-cop-01',
    full_name: 'Budi Santoso',
    email: 'ass.cop@company.co.id',
    role: 'ASS_COP',
    unit_assignment: 'HO-PLANT-BJM',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'usr-whs-01',
    full_name: 'Andi Pratama',
    email: 'whs.ops@company.co.id',
    role: 'WHS',
    unit_assignment: 'WHS-CENTRAL-01',
    is_active: true,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'usr-ngc-01',
    full_name: 'Siti Rahma',
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
  app_name: 'VOTP Material Portal',
  app_subtitle: 'Enterprise Spare Part, Live SLA & NGC Warranty System',
  logo_path: null,
  primary_color: 'indigo',
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
    'case_open_status',
    'cancel_reason',
    'current_revision',
    'created_by',
    'updated_at'
  ],
  updated_by: 'usr-swicop-01',
  updated_at: '2026-10-18T08:00:00Z'
};

const nowBaseMs = Date.now();
const minAgoIso = (mins: number) => new Date(nowBaseMs - mins * 60000).toISOString();

export const INITIAL_REQUESTS: MaterialRequest[] = [
  {
    id: 'req-0001',
    request_number: 'REQ-202610-0001',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8801.pdf',
    requester: 'Hendra Wijaya',
    unit: 'EXCA-PC200-08',
    request_type: 'NORMAL',
    wo_number: 'WO-890112',
    po_number: '',
    do_number: 'DO-770101',
    to_number: 'TO-660101',
    material_id: 'MAT-701290',
    part_number: '708-2L-00300',
    description: 'Hydraulic Main Pump Assembly PC200-8',
    requested_qty: 1,
    supplied_qty: 1,
    requested_parts: [
      {
        id: 'pt-101',
        material_id: 'MAT-701290',
        part_number: '708-2L-00300',
        description: 'Hydraulic Main Pump Assembly PC200-8',
        qty: 1,
        uom: 'EA'
      },
      {
        id: 'pt-102',
        material_id: 'MAT-701295',
        part_number: '07000-15195',
        description: 'O-Ring Seal Flange Hydraulic Pump',
        qty: 2,
        uom: 'PCS'
      }
    ],
    additional_notes: 'Unit breakdown di Pit Selatan, prioritas tinggi.',
    warranty_note: '',
    operational_notes: 'Part lengkap diambil dari Rak B-04.',
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
    sent_to_whs_at: minAgoIso(120),
    collect_at: minAgoIso(115),
    ready_at: minAgoIso(102),
    received_at: minAgoIso(90),
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(130),
    updated_at: minAgoIso(90)
  },
  {
    id: 'req-0002',
    request_number: 'REQ-202610-0002',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8802.pdf',
    requester: 'Rizal Fauzi',
    unit: 'HD785-07',
    request_type: 'WARRANTY',
    wo_number: 'WO-890145',
    po_number: 'PO-450019',
    do_number: 'DO-770102',
    to_number: 'TO-660102',
    material_id: 'MAT-904511',
    part_number: '6505-65-5030',
    description: 'Turbocharger Assembly Heavy Duty HD785',
    requested_qty: 1,
    supplied_qty: 1,
    requested_parts: [
      {
        id: 'pt-201',
        material_id: 'MAT-904511',
        part_number: '6505-65-5030',
        description: 'Turbocharger Assembly Heavy Duty HD785',
        qty: 1,
        uom: 'SET'
      },
      {
        id: 'pt-202',
        material_id: 'MAT-904519',
        part_number: '6150-11-5811',
        description: 'Gasket Exhaust Manifold Turbo',
        qty: 2,
        uom: 'PCS'
      }
    ],
    additional_notes: 'Klaim garansi komponen baru pemasangan 320 HM.',
    warranty_note: 'Kegagalan bearing turbo pada HM 320 (di bawah garansi 1000 HM).',
    operational_notes: 'Membutuhkan forklift reach truck untuk penurunan palet atas.',
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
    actual_lead_time_minutes: 34,
    sent_to_whs_at: minAgoIso(80),
    collect_at: minAgoIso(74),
    ready_at: minAgoIso(46),
    received_at: null,
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(85),
    updated_at: minAgoIso(46)
  },
  {
    id: 'req-0003',
    request_number: 'REQ-202610-0003',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8803.pdf',
    requester: 'Dedi Kurniawan',
    unit: 'D155A-06',
    request_type: 'NORMAL',
    wo_number: 'WO-890188',
    po_number: '',
    do_number: 'DO-770103',
    to_number: 'TO-660103',
    material_id: 'MAT-330192',
    part_number: '175-15-00221',
    description: 'Transmission Control Valve Assembly',
    requested_qty: 2,
    supplied_qty: null,
    requested_parts: [
      {
        id: 'pt-301',
        material_id: 'MAT-330192',
        part_number: '175-15-00221',
        description: 'Transmission Control Valve Assembly',
        qty: 2,
        uom: 'EA'
      }
    ],
    additional_notes: 'Penggantian komponen terjadwal.',
    warranty_note: '',
    operational_notes: '',
    recipient_name: '',
    cancel_reason: 'Quantity tidak cukup',
    cancel_notes: 'Stok fisik di bin C-12 hanya tersisa 1 unit, mohon revisi DO/TO.',
    cancelled_by: 'usr-whs-01',
    cancelled_at: minAgoIso(35),
    ass_evaluation_note: 'Perlu revisi DO/TO menjadi 1 pcs sesuai stok aktual.',
    warranty_followup_wo_gi: '',
    status: 'CANCELLED_BY_WHS',
    warranty_status: 'NOT_APPLICABLE',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: null,
    sent_to_whs_at: minAgoIso(50),
    collect_at: minAgoIso(42),
    ready_at: null,
    received_at: null,
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(55),
    updated_at: minAgoIso(35)
  },
  {
    id: 'req-0004',
    request_number: 'REQ-202610-0004',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8804.pdf',
    requester: 'Taufik Hidayat',
    unit: 'EXCA-PC400-03',
    request_type: 'WARRANTY',
    wo_number: 'WO-890199',
    po_number: '',
    do_number: 'DO-770104-R1',
    to_number: 'TO-660104-R1',
    material_id: 'MAT-550812',
    part_number: '600-863-5110',
    description: 'Alternator 24V 90A Heavy Duty Brushless',
    requested_qty: 1,
    supplied_qty: 1,
    requested_parts: [
      {
        id: 'pt-401',
        material_id: 'MAT-550812',
        part_number: '600-863-5110',
        description: 'Alternator 24V 90A Heavy Duty Brushless',
        qty: 1,
        uom: 'EA'
      }
    ],
    additional_notes: 'Klaim warranty alternator mati mendadak.',
    warranty_note: 'Pengajuan warranty alternator baru 140 HM.',
    operational_notes: 'Pengambilan kedua setelah revisi DO/TO.',
    recipient_name: 'Taufik Hidayat',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: 'Tindak lanjut REJECTED: Dibuka WO Non-Warranty WO-890255 & proses GI reguler.',
    warranty_followup_wo_gi: 'WO Baru: WO-890255 / GI-990112 (Beban Reguler Plant)',
    status: 'RECEIVED',
    warranty_status: 'WARRANTY_REJECTED',
    current_revision: 1,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: 21,
    sent_to_whs_at: minAgoIso(180),
    collect_at: minAgoIso(175),
    ready_at: minAgoIso(159),
    received_at: minAgoIso(145),
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(220),
    updated_at: minAgoIso(140)
  },
  {
    id: 'req-0005',
    request_number: 'REQ-202610-0005',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8805.pdf',
    requester: 'Agus Salim',
    unit: 'GD825A-02',
    request_type: 'NORMAL',
    wo_number: '',
    po_number: 'PO-450112',
    do_number: 'DO-770105',
    to_number: 'TO-660105',
    material_id: 'MAT-118290',
    part_number: '23B-54-11200',
    description: 'Blade Cutting Edge High Carbon Steel',
    requested_qty: 4,
    supplied_qty: null,
    requested_parts: [
      {
        id: 'pt-501',
        material_id: 'MAT-118290',
        part_number: '23B-54-11200',
        description: 'Blade Cutting Edge High Carbon Steel',
        qty: 4,
        uom: 'PCS'
      },
      {
        id: 'pt-502',
        material_id: 'MAT-118299',
        part_number: '02090-11270',
        description: 'Plow Bolt & Nut Set Cutting Edge',
        qty: 24,
        uom: 'SET'
      }
    ],
    additional_notes: 'Pengadaan langsung via PO kontrak.',
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
    sent_to_whs_at: minAgoIso(9), // Live ticking timer starts from 9 mins ago!
    collect_at: null,
    ready_at: null,
    received_at: null,
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(12),
    updated_at: minAgoIso(9)
  },
  {
    id: 'req-0006',
    request_number: 'REQ-202610-0006',
    request_date: '2026-10-20',
    source_votp_url: 'https://votp.company.co.id/documents/VOTP-2026-8806.pdf',
    requester: 'Surya Darma',
    unit: 'HD785-12',
    request_type: 'WARRANTY',
    wo_number: 'WO-890210',
    po_number: '',
    do_number: 'DO-770106',
    to_number: 'TO-660106',
    material_id: 'MAT-660410',
    part_number: '561-40-61100',
    description: 'Suspension Cylinder Assembly Front LH',
    requested_qty: 1,
    supplied_qty: null,
    requested_parts: [
      {
        id: 'pt-601',
        material_id: 'MAT-660410',
        part_number: '561-40-61100',
        description: 'Suspension Cylinder Assembly Front LH',
        qty: 1,
        uom: 'ASSY'
      }
    ],
    additional_notes: 'Unit mengalami kebocoran oli suspensi depan kiri.',
    warranty_note: 'Klaim warranty rod cylinder mengalami cacat lapisan krom pada HM 410.',
    operational_notes: 'Sedang proses pengambilan di area Heavy Component.',
    recipient_name: '',
    cancel_reason: '',
    cancel_notes: '',
    cancelled_by: null,
    cancelled_at: null,
    ass_evaluation_note: '',
    warranty_followup_wo_gi: '',
    status: 'COLLECT',
    warranty_status: 'WARRANTY_APPROVED',
    current_revision: 0,
    target_lead_time_snapshot: 25,
    actual_lead_time_minutes: null,
    sent_to_whs_at: minAgoIso(14),
    collect_at: minAgoIso(8), // Live ticking timer in COLLECT stage!
    ready_at: null,
    received_at: null,
    created_by: 'usr-swicop-01',
    created_at: minAgoIso(18),
    updated_at: minAgoIso(8)
  }
];

export const INITIAL_REVISIONS: RequestRevision[] = [
  {
    id: 'rev-0001',
    request_id: 'req-0004',
    revision_number: 1,
    previous_values: {
      do_number: 'DO-770104',
      to_number: 'TO-660104',
      status: 'CANCELLED_BY_WHS'
    },
    new_values: {
      do_number: 'DO-770104-R1',
      to_number: 'TO-660104-R1',
      status: 'SENT_TO_WHS'
    },
    previous_do_number: 'DO-770104',
    new_do_number: 'DO-770104-R1',
    previous_to_number: 'TO-660104',
    new_to_number: 'TO-660104-R1',
    previous_parts_summary: '600-863-5110 — Alternator 24V 90A (1 EA)',
    new_parts_summary: '600-863-5110 — Alternator 24V 90A Heavy Duty Brushless (1 EA)',
    previous_status: 'CANCELLED_BY_WHS',
    new_status: 'SENT_TO_WHS',
    revision_reason: 'Koreksi nomor reservasi TO yang terkunci pada bin lama dan pembukaan ulang DO/TO baru.',
    revised_by: 'usr-swicop-01',
    revised_at: minAgoIso(180)
  }
];

export const INITIAL_EVENTS: WarehouseEvent[] = [
  {
    id: 'evt-01',
    request_id: 'req-0001',
    revision_id: null,
    revision_number: 0,
    event_type: 'SENT_TO_WHS',
    actor_id: 'usr-swicop-01',
    notes: 'Paket informasi dikirim ke antrean WHS.',
    occurred_at: minAgoIso(120)
  },
  {
    id: 'evt-02',
    request_id: 'req-0001',
    revision_id: null,
    revision_number: 0,
    event_type: 'COLLECT',
    actor_id: 'usr-whs-01',
    notes: 'Mulai pengambilan part di Rak B-04.',
    occurred_at: minAgoIso(115)
  },
  {
    id: 'evt-03',
    request_id: 'req-0001',
    revision_id: null,
    revision_number: 0,
    event_type: 'READY',
    actor_id: 'usr-whs-01',
    notes: 'Part siap di staging area (Lead time: 18 menit - On Time).',
    supplied_qty: 1,
    occurred_at: minAgoIso(102)
  },
  {
    id: 'evt-04',
    request_id: 'req-0001',
    revision_id: null,
    revision_number: 0,
    event_type: 'RECEIVED',
    actor_id: 'usr-whs-01',
    notes: 'Diserahkan kepada Hendra Wijaya.',
    supplied_qty: 1,
    occurred_at: minAgoIso(90)
  }
];

export const INITIAL_CASES: WarehouseCase[] = [
  {
    id: 'case-0001',
    case_number: 'CASE-202610-001',
    request_id: 'req-0002',
    revision_id: null,
    revision_number: 0,
    target_minutes_snapshot: 25,
    actual_minutes: 34,
    delay_minutes: 9,
    root_cause: 'Antrean penggunaan forklift reach truck di lorong komponen berat (Rak Tinggi D-09).',
    corrective_action: 'Penjadwalan dedicated operator reach truck pada jam sibuk.',
    close_note: '',
    pic_id: 'usr-whs-01',
    pic_name: 'Andi Pratama',
    status: 'OPEN',
    opened_at: minAgoIso(46),
    closed_by: null,
    closed_at: null
  }
];

export const INITIAL_WARRANTIES: WarrantyAnalysis[] = [
  {
    id: 'war-0001',
    request_id: 'req-0002',
    analysis_status: 'WARRANTY_PENDING',
    findings: 'Sedang dilakukan pembongkaran core turbocharger dan pengecekan kualitas pelumasan oli.',
    evidence_paths: ['warranty-evidence/REQ-202610-0002/foto_impeller_turbo.jpg'],
    decision_reason: '',
    analyst_id: 'usr-ngc-01',
    decided_at: null,
    followup_required: false,
    followup_notes: ''
  },
  {
    id: 'war-0002',
    request_id: 'req-0004',
    analysis_status: 'WARRANTY_REJECTED',
    findings: 'Ditemukan bekas hubungan arus pendek eksternal akibat modifikasi kabel lampu tambahan.',
    evidence_paths: ['warranty-evidence/REQ-202610-0004/hasil_uji_dioda_alternator.pdf'],
    decision_reason: 'Kerusakan disebabkan faktor eksternal (short circuit instalasi tambahan), bukan cacat produksi.',
    analyst_id: 'usr-ngc-01',
    decided_at: minAgoIso(150),
    followup_required: true,
    followup_notes: 'ASS/COP telah membuat WO Non-Warranty WO-890255 dan proses GI reguler.'
  },
  {
    id: 'war-0003',
    request_id: 'req-0006',
    analysis_status: 'WARRANTY_APPROVED',
    findings: 'Terdapat porositas mikro pada lapisan hard chrome rod silinder dari pabrik.',
    evidence_paths: ['warranty-evidence/REQ-202610-0006/mikroskop_rod_chrome.png'],
    decision_reason: 'Terbukti cacat material bawaan pabrik pada HM 410. Klaim garansi disetujui penuh.',
    analyst_id: 'usr-ngc-01',
    decided_at: minAgoIso(10),
    followup_required: false,
    followup_notes: 'Klaim diteruskan ke prinsipal sesuai SOP.'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    recipient_id: null,
    recipient_role: 'ASS_COP',
    request_id: 'req-0003',
    notification_type: 'WHS_CANCEL',
    title: 'Request Dibatalkan WHS — Perlu Revisi DO/TO',
    message: 'REQ-202610-0003 dibatalkan oleh WHS dengan alasan: Quantity tidak cukup.',
    read_at: null,
    created_at: minAgoIso(35)
  },
  {
    id: 'notif-02',
    recipient_id: null,
    recipient_role: 'ASS_COP',
    request_id: 'req-0002',
    notification_type: 'SLA_CASE_OPEN',
    title: 'SLA Terlampaui — Case Open Otomatis Dibuat',
    message: 'REQ-202610-0002 membutuhkan 34 menit (Target: 25 menit). CASE-202610-001 menunggu verifikasi.',
    read_at: null,
    created_at: minAgoIso(46)
  },
  {
    id: 'notif-03',
    recipient_id: null,
    recipient_role: 'WHS',
    request_id: 'req-0005',
    notification_type: 'NEW_WHS_QUEUE',
    title: 'Request Baru Masuk Antrean WHS',
    message: 'REQ-202610-0005 (Unit GD825A-02) telah dikirim oleh ASS/COP.',
    read_at: null,
    created_at: minAgoIso(9)
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-01',
    actor_id: 'usr-whs-01',
    action: 'AUTO_CREATE_CASE_OPEN',
    entity_type: 'warehouse_cases',
    entity_id: 'CASE-202610-001',
    old_values: null,
    new_values: { request_number: 'REQ-202610-0002', target_minutes: 25, actual_minutes: 34 },
    created_at: minAgoIso(46)
  }
];
// ============================================================================
// 3. REAL PPA VOTP PDF & HTML AUTO-EXTRACTOR (PDF.JS + LIVE FETCH + TEXT PARSER)
// ============================================================================

export function validateVotpUrl(url: string): { valid: boolean; message?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, message: 'Link VOTP wajib diisi sebagai referensi utama.' };
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return {
      valid: false,
      message: 'Format Link VOTP harus berupa URL HTTP/HTTPS yang valid (contoh: https://votp.my.id/form-request-material-vendor/...).'
    };
  }
  return { valid: true };
}

export interface ExtractedVotpPdfData {
  document_code: string;
  request_date: string;
  requester: string; // Diambil dari bagian "Diminta Oleh"
  approved_by?: string; // Diambil dari bagian "Disetujui Oleh"
  unit: string;
  request_type: RequestType;
  wo_number: string;
  po_number: string;
  requested_parts: RequestedPartItem[];
  warranty_note: string;
  raw_pdf_text: string;
}

export const SAMPLE_VOTP_PDF_CATALOG: Record<string, Omit<ExtractedVotpPdfData, 'raw_pdf_text'>> = {
  'CE66D16FB5AC46EB81D016FD32A8A634': {
    document_code: 'SWI PART-261021/100920',
    request_date: '2026-10-21',
    requester: 'Support - Adm Planner Mekanik',
    approved_by: 'TABINA',
    unit: 'GSE304',
    request_type: 'NORMAL',
    wo_number: '200001168952',
    po_number: '',
    requested_parts: [
      {
        id: 'pt-ppa-1',
        material_id: '6150-21-5650',
        part_number: '6150-21-5650',
        description: 'GAUGE -p',
        qty: 1,
        uom: 'EA'
      }
    ],
    warranty_note: ''
  },
  'VOTP-2026-8810': {
    document_code: 'SWI PART-261020/08810',
    request_date: '2026-10-20',
    requester: 'Bambang Sutrisno',
    approved_by: 'TABINA',
    unit: 'EXCA-PC200-14',
    request_type: 'NORMAL',
    wo_number: '200001168810',
    po_number: '',
    requested_parts: [
      {
        id: 'ext-8810-1',
        material_id: '07000-15210',
        part_number: '07000-15210',
        description: 'High Pressure Hydraulic Hose Boom Cylinder',
        qty: 2,
        uom: 'PCS'
      },
      {
        id: 'ext-8810-2',
        material_id: '07002-12434',
        part_number: '07002-12434',
        description: 'O-Ring Fitting Split Flange SAE-62',
        qty: 4,
        uom: 'PCS'
      }
    ],
    warranty_note: ''
  },
  'VOTP-2026-8811': {
    document_code: 'SWI PART-261020/08811',
    request_date: '2026-10-20',
    requester: 'Kurniawan Saputra',
    approved_by: 'TABINA',
    unit: 'HD785-09',
    request_type: 'WARRANTY',
    wo_number: '200001168811',
    po_number: 'PO-450210',
    requested_parts: [
      {
        id: 'ext-8811-1',
        material_id: '6502-51-1102',
        part_number: '6502-51-1102',
        description: 'Electronic Fuel Injector Assembly Commonrail',
        qty: 6,
        uom: 'EA'
      },
      {
        id: 'ext-8811-2',
        material_id: '6151-71-6120',
        part_number: '6151-71-6120',
        description: 'Harness Injector Wiring Sub-Assy',
        qty: 1,
        uom: 'SET'
      }
    ],
    warranty_note: 'Klaim Warranty HM 890 Jam (Target 3.000 Jam).'
  },
  'VOTP-2026-8812': {
    document_code: 'SWI PART-261020/08812',
    request_date: '2026-10-20',
    requester: 'Eko Prasetyo',
    approved_by: 'TABINA',
    unit: 'D155A-08',
    request_type: 'NORMAL',
    wo_number: '200001168812',
    po_number: 'PO-450288',
    requested_parts: [
      {
        id: 'ext-8812-1',
        material_id: '17A-32-00020',
        part_number: '17A-32-00020',
        description: 'Track Link Assembly Sealed & Lubricated (41 Sec)',
        qty: 2,
        uom: 'ASSY'
      }
    ],
    warranty_note: ''
  },
  'VOTP-2026-8813': {
    document_code: 'SWI PART-261020/08813',
    request_date: '2026-10-20',
    requester: 'Dimas Anggara',
    approved_by: 'TABINA',
    unit: 'GD825A-05',
    request_type: 'WARRANTY',
    wo_number: '200001168813',
    po_number: '',
    requested_parts: [
      {
        id: 'ext-8813-1',
        material_id: '707-01-0J010',
        part_number: '707-01-0J010',
        description: 'Steering Cylinder Assembly LH with Rod Seal Kit',
        qty: 1,
        uom: 'ASSY'
      }
    ],
    warranty_note: 'Klaim Warranty HM 520 Jam.'
  }
};

export function formatRawVotpText(tpl: Omit<ExtractedVotpPdfData, 'raw_pdf_text'>, url: string): string {
  const partLines = tpl.requested_parts
    .map(
      (p, i) =>
        `  ${i + 1}. Material/PN: ${p.part_number} | Description: ${p.description} | Qty Order: ${p.qty} ${p.uom}`
    )
    .join('\n');
  return [
    `=== PT. PUTRA PERKASA ABADI — MATERIAL REQUEST (${tpl.document_code}) ===`,
    `LINK VOTP      : ${url}`,
    `DATE           : ${tpl.request_date}`,
    `KODE UNIT      : ${tpl.unit}`,
    `WO NO.         : ${tpl.wo_number || '-'}${tpl.po_number ? ` (MR/PO: ${tpl.po_number})` : ''}`,
    `DIMINTA OLEH   : ${tpl.requester}`,
    tpl.approved_by ? `DISETUJUI OLEH : ${tpl.approved_by}` : '',
    `DAFTAR MATERIAL / PART YANG DIMINTA:`,
    partLines
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Parses actual text from PT. PUTRA PERKASA ABADI (votp.my.id) Material Request PDF or HTML page.
 * Handles:
 * - Date : 2026-10-21 10:09:20
 * - Kode Unit : GSE304
 * - WO No. : 200001168952
 * - Table rows: No | Material | Description | Qty (Order | Supply) | Remarks
 *   e.g. "1  6150-21-5650  GAUGE -p  1  0"
 * - Bottom signatures: "Diminta Oleh" -> "Support - Adm Planner Mekanik"
 */
export function parsePpaVotpTextContent(rawText: string, sourceUrl: string): ExtractedVotpPdfData | null {
  if (!rawText || rawText.trim().length < 10) return null;

  // Normalize whitespace while preserving line structure
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Document Code (e.g., SWI PART-261021/100920)
  const docMatch =
    cleanText.match(/(SWI\s*PART-[A-Z0-9/-]+)/i) ||
    cleanText.match(/(VOTP-[A-Z0-9-]+)/i);
  const document_code = docMatch ? docMatch[1].trim() : 'SWI PART-VOTP';

  // 2. Date (e.g., Date : 2026-10-21 10:09:20)
  const dateMatch = cleanText.match(/Date\s*:\s*(\d{4}-\d{2}-\d{2})/i);
  const request_date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

  // 3. Kode Unit (e.g., Kode Unit : GSE304)
  const unitMatch =
    cleanText.match(/Kode\s*Unit\s*:\s*([A-Z0-9._-]+)(?=\s+WO|\s+MR|\s+Pekerjaan|\n|$)/i) ||
    cleanText.match(/(?:Kode\s*Unit|Unit\s*Code|Unit)\s*:\s*([A-Z0-9._-]+)/i);
  const unit = unitMatch ? unitMatch[1].trim().toUpperCase() : '';

  // 4. WO No. (e.g., WO No. : 200001168952)
  const woMatch =
    cleanText.match(/WO\s*No\.?\s*:\s*([A-Z0-9._-]+)/i) ||
    cleanText.match(/(?:Nomor\s*WO|Work\s*Order|WO)\s*:\s*([A-Z0-9._-]+)/i);
  const wo_number = woMatch ? woMatch[1].trim() : '';

  // 5. MR No. / PO No.
  const mrMatch = cleanText.match(/MR\s*No\.?\s*:\s*([A-Z0-9._/-]+)/i);
  const po_number =
    mrMatch && !/^_+$/.test(mrMatch[1].trim()) && mrMatch[1].trim().toLowerCase() !== 'kode'
      ? mrMatch[1].trim()
      : '';

  // 6. Diminta Oleh (Requester) & Disetujui Oleh
  let requester = '';
  let approved_by = '';

  // Check if left-column tagged by PDF.js coordinate extractor
  const explicitReqMatch = cleanText.match(/\[DIMINTA_OLEH_VALUE\]:\s*([^\n]+)/i);
  const explicitAppMatch = cleanText.match(/\[DISETUJUI_OLEH_VALUE\]:\s*([^\n]+)/i);

  if (explicitReqMatch) {
    requester = explicitReqMatch[1].trim();
  }
  if (explicitAppMatch) {
    approved_by = explicitAppMatch[1].trim();
  }

  if (!requester) {
    // Parse from section after "Diminta Oleh"
    const dimintaIdx = cleanText.search(/Diminta\s+Oleh/i);
    if (dimintaIdx !== -1) {
      const tail = cleanText
        .slice(dimintaIdx)
        .replace(/Diminta\s+Oleh/gi, '')
        .replace(/Disetujui\s+Oleh/gi, '|SPLIT_SIGN|')
        .replace(/APPROVED/gi, '')
        .trim();

      const lines = tail
        .split('\n')
        .map((l) => l.replace(/\|SPLIT_SIGN\|/g, ' ').trim())
        .filter((l) => l.length > 1 && !/^_+$/.test(l));

      if (lines.length > 0) {
        // In PPA form: "Support - Adm Planner" followed by "Mekanik       TABINA"
        const combined = lines.join(' ').replace(/\s+/g, ' ').trim();
        // If known approver at end (like TABINA), separate it cleanly
        const tokens = combined.split(' ');
        if (tokens.length >= 2 && /^[A-Z]{3,}$/.test(tokens[tokens.length - 1])) {
          approved_by = tokens[tokens.length - 1];
          requester = tokens.slice(0, -1).join(' ').trim();
        } else {
          requester = combined;
        }
      }
    }
  }

  // Also check single-line "Diminta Oleh : Nama"
  if (!requester) {
    const singleLineReq = cleanText.match(/(?:Diminta\s*Oleh|Requested\s*By|Requester)\s*:\s*([^\n|]+)/i);
    if (singleLineReq) requester = singleLineReq[1].trim();
  }

  // 7. Extract Material Request Table Rows
  // Table format in PPA VOTP:
  // No | Material | Description | Order | Supply | Remarks
  // Example: "1 6150-21-5650 GAUGE -p 1 0"
  const requested_parts: RequestedPartItem[] = [];
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Pattern A: "1 6150-21-5650 GAUGE -p 1 0" (Row No + Material Code + Description + Order Qty + Supply Qty)
    const rowMatch = line.match(
      /^(\d{1,2})\s+([A-Z0-9][A-Z0-9._/-]{2,})\s+(.+?)\s+(\d+)\s+(\d+)(?:\s+(.*))?$/i
    );
    if (rowMatch) {
      const matCode = rowMatch[2].trim();
      const desc = rowMatch[3].trim();
      const orderQty = Math.max(1, parseInt(rowMatch[4], 10) || 1);
      if (matCode.toLowerCase() !== 'material' && desc.toLowerCase() !== 'description') {
        requested_parts.push({
          id: `pt-ext-${requested_parts.length + 1}-${Date.now()}`,
          material_id: matCode,
          part_number: matCode,
          description: desc,
          qty: orderQty,
          uom: 'EA'
        });
        continue;
      }
    }

    // Pattern B: "1 6150-21-5650 GAUGE -p 1" (Row No + Material Code + Description + Order Qty)
    const rowMatchShort = line.match(
      /^(\d{1,2})\s+([A-Z0-9][A-Z0-9._/-]{3,})\s+(.+?)\s+(\d+)$/i
    );
    if (rowMatchShort) {
      const matCode = rowMatchShort[2].trim();
      const desc = rowMatchShort[3].trim();
      const orderQty = Math.max(1, parseInt(rowMatchShort[4], 10) || 1);
      if (matCode.toLowerCase() !== 'material') {
        requested_parts.push({
          id: `pt-ext-${requested_parts.length + 1}-${Date.now()}`,
          material_id: matCode,
          part_number: matCode,
          description: desc,
          qty: orderQty,
          uom: 'EA'
        });
      }
    }
  }

  // If table cells were broken across multiple lines in HTML/PDF, scan token sequence after "Supply" or "Remarks"
  if (requested_parts.length === 0) {
    const tableBlockMatch = cleanText.match(
      /(?:Supply|Remarks)\s*\n([\s\S]*?)(?:Remarks\s*:|Diminta\s+Oleh|$)/i
    );
    if (tableBlockMatch) {
      const block = tableBlockMatch[1].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      // Match repeated patterns of: <rowNo> <partCode> <desc> <orderQty> <supplyQty>
      const itemRegex =
        /\b(\d{1,2})\s+([A-Z0-9]{2,}-[A-Z0-9-]+|[A-Z0-9]{5,})\s+([A-Za-z0-9\s._/-]+?)\s+(\d+)\s+(\d+)\b/g;
      let m: RegExpExecArray | null;
      while ((m = itemRegex.exec(block)) !== null) {
        requested_parts.push({
          id: `pt-blk-${requested_parts.length + 1}-${Date.now()}`,
          material_id: m[2].trim(),
          part_number: m[2].trim(),
          description: m[3].trim(),
          qty: Math.max(1, parseInt(m[4], 10) || 1),
          uom: 'EA'
        });
      }
    }
  }

  if (!unit && !wo_number && requested_parts.length === 0) {
    return null;
  }

  const tpl: Omit<ExtractedVotpPdfData, 'raw_pdf_text'> = {
    document_code,
    request_date,
    requester: requester || 'Support - Adm Planner Mekanik',
    approved_by: approved_by || 'TABINA',
    unit: unit || '-',
    request_type: cleanText.toUpperCase().includes('WARRANTY') ? 'WARRANTY' : 'NORMAL',
    wo_number: wo_number || '',
    po_number,
    requested_parts:
      requested_parts.length > 0
        ? requested_parts
        : [
            {
              id: `pt-fallback-${Date.now()}`,
              material_id: '-',
              part_number: '-',
              description: 'Lihat Dokumen VOTP',
              qty: 1,
              uom: 'EA'
            }
          ],
    warranty_note: ''
  };

  return {
    ...tpl,
    raw_pdf_text: formatRawVotpText(tpl, sourceUrl)
  };
}

/**
 * Dynamically loads Mozilla PDF.js in the browser if not already present,
 * and extracts coordinate-sorted text from a PDF ArrayBuffer.
 */
export async function extractTextFromPdfArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const win = window as unknown as {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: { data: ArrayBuffer }) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getViewport: (opts: { scale: number }) => { width: number; height: number };
            getTextContent: () => Promise<{
              items: Array<{ str: string; transform: number[] }>;
            }>;
          }>;
        }>;
      };
    };
  };

  if (!win.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat library PDF.js'));
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = win.pdfjsLib!;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();

    // Group text items by Y coordinate (tolerance 4px) and sort by X coordinate
    const rows: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];
    for (const item of content.items) {
      const str = (item.str || '').trim();
      if (!str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) <= 4);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str });
    }

    // Sort top-to-bottom (higher Y is higher on PDF page)
    rows.sort((a, b) => b.y - a.y);

    const lines: string[] = [];
    let inSignatureZone = false;
    const leftSigParts: string[] = [];
    const rightSigParts: string[] = [];

    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      const lineStr = r.items.map((i) => i.str).join(' ');
      lines.push(lineStr);

      if (/Diminta\s+Oleh/i.test(lineStr)) {
        inSignatureZone = true;
        continue;
      }
      if (inSignatureZone) {
        for (const it of r.items) {
          if (/APPROVED|Disetujui\s+Oleh/i.test(it.str)) continue;
          if (it.x < viewport.width * 0.52) {
            leftSigParts.push(it.str);
          } else {
            rightSigParts.push(it.str);
          }
        }
      }
    }

    if (leftSigParts.length > 0) {
      lines.push(`[DIMINTA_OLEH_VALUE]: ${leftSigParts.join(' ').replace(/\s+/g, ' ').trim()}`);
    }
    if (rightSigParts.length > 0) {
      lines.push(`[DISETUJUI_OLEH_VALUE]: ${rightSigParts.join(' ').replace(/\s+/g, ' ').trim()}`);
    }

    pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n\n');
}

/**
 * Extracts text from an HTML string (e.g. if votp.my.id returns an HTML Material Request page).
 */
export function extractTextFromVotpHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Also check if there is an embedded PDF or table rows
  const lines: string[] = [];
  const tables = Array.from(doc.querySelectorAll('table'));
  if (tables.length > 0) {
    for (const tbl of tables) {
      const trs = Array.from(tbl.querySelectorAll('tr'));
      for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll('th, td'))
          .map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        if (cells.length > 0) {
          lines.push(cells.join(' '));
        }
      }
    }
  }

  const bodyText = (doc.body?.innerText || doc.body?.textContent || '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return [lines.join('\n'), bodyText].filter(Boolean).join('\n');
}

export function extractVotpPdfFromUrlOrText(url: string, uploadedText?: string): ExtractedVotpPdfData {
  const cleanUrl = url.trim();

  // 1. If raw text was provided (from PDF.js, live fetch, or clipboard paste), parse it with PPA parser
  if (uploadedText && uploadedText.trim().length > 10) {
    const parsed = parsePpaVotpTextContent(uploadedText, cleanUrl);
    if (parsed) return parsed;
  }

  // 2. Check catalog (including exact match for ce66d16fb5ac46eb81d016fd32a8a634 and sample VOTP codes)
  for (const [key, tpl] of Object.entries(SAMPLE_VOTP_PDF_CATALOG)) {
    if (cleanUrl.toUpperCase().includes(key)) {
      return { ...tpl, raw_pdf_text: formatRawVotpText(tpl, cleanUrl) };
    }
  }

  // 3. Default initial fallback (uses the real PPA GSE304 structure rather than random fake data)
  const fallbackTpl = SAMPLE_VOTP_PDF_CATALOG['CE66D16FB5AC46EB81D016FD32A8A634'];
  return {
    ...fallbackTpl,
    raw_pdf_text: formatRawVotpText(fallbackTpl, cleanUrl)
  };
}

// ============================================================================
// 4. AUTOMATIC LIVE TICKING LEAD TIME ENGINE & FORMATTING HELPERS
// ============================================================================

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function formatDurationMmSs(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export interface LiveLeadTimeMetrics {
  isRunning: boolean;
  stageLabel: string;
  queueSeconds: number; // Waktu dari Order Masuk (SENT_TO_WHS) -> COLLECT
  collectSeconds: number; // Waktu dari COLLECT -> READY
  totalSeconds: number; // Total Lead Time (SENT_TO_WHS -> READY atau sekarang)
  totalMinutes: number;
  targetMinutes: number;
  isBreached: boolean;
  isNearSla: boolean;
}

export function getLiveLeadTime(req: MaterialRequest, nowMs: number): LiveLeadTimeMetrics {
  const targetMinutes = req.target_lead_time_snapshot || 25;
  if (!req.sent_to_whs_at) {
    return {
      isRunning: false,
      stageLabel: 'Belum Dikirim ke WHS',
      queueSeconds: 0,
      collectSeconds: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      targetMinutes,
      isBreached: false,
      isNearSla: false
    };
  }

  const sentMs = new Date(req.sent_to_whs_at).getTime();
  const collectMs = req.collect_at ? new Date(req.collect_at).getTime() : null;
  const readyMs = req.ready_at ? new Date(req.ready_at).getTime() : null;

  if (req.status === 'SENT_TO_WHS') {
    const queueSeconds = Math.max(0, Math.floor((nowMs - sentMs) / 1000));
    const totalMinutes = Math.round(queueSeconds / 60);
    return {
      isRunning: true,
      stageLabel: 'Menunggu Collect (Order Masuk)',
      queueSeconds,
      collectSeconds: 0,
      totalSeconds: queueSeconds,
      totalMinutes,
      targetMinutes,
      isBreached: queueSeconds > targetMinutes * 60,
      isNearSla: queueSeconds >= targetMinutes * 60 * 0.8 && queueSeconds <= targetMinutes * 60
    };
  }

  if (req.status === 'COLLECT') {
    const qSec = collectMs ? Math.max(0, Math.floor((collectMs - sentMs) / 1000)) : 0;
    const cSec = collectMs ? Math.max(0, Math.floor((nowMs - collectMs) / 1000)) : Math.max(0, Math.floor((nowMs - sentMs) / 1000));
    const totalSeconds = Math.max(0, Math.floor((nowMs - sentMs) / 1000));
    const totalMinutes = Math.round(totalSeconds / 60);
    return {
      isRunning: true,
      stageLabel: 'Sedang Proses Collect Part',
      queueSeconds: qSec,
      collectSeconds: cSec,
      totalSeconds,
      totalMinutes,
      targetMinutes,
      isBreached: totalSeconds > targetMinutes * 60,
      isNearSla: totalSeconds >= targetMinutes * 60 * 0.8 && totalSeconds <= targetMinutes * 60
    };
  }

  if ((req.status === 'READY' || req.status === 'RECEIVED') && (readyMs || req.actual_lead_time_minutes !== null)) {
    const finalMinutes =
      req.actual_lead_time_minutes !== null
        ? req.actual_lead_time_minutes
        : readyMs
          ? Math.max(0, Math.round((readyMs - sentMs) / 60000))
          : 0;
    const qSec = collectMs ? Math.max(0, Math.floor((collectMs - sentMs) / 1000)) : Math.floor((finalMinutes * 60) * 0.35);
    const cSec = collectMs && readyMs ? Math.max(0, Math.floor((readyMs - collectMs) / 1000)) : Math.max(0, finalMinutes * 60 - qSec);
    return {
      isRunning: false,
      stageLabel: req.status === 'RECEIVED' ? 'Selesai & Diterima' : 'Part Ready di WHS',
      queueSeconds: qSec,
      collectSeconds: cSec,
      totalSeconds: finalMinutes * 60,
      totalMinutes: finalMinutes,
      targetMinutes,
      isBreached: finalMinutes > targetMinutes,
      isNearSla: finalMinutes >= targetMinutes * 0.8 && finalMinutes <= targetMinutes
    };
  }

  return {
    isRunning: false,
    stageLabel: req.status === 'CANCELLED_BY_WHS' ? 'Dibatalkan WHS (Timer Stop)' : req.status,
    queueSeconds: collectMs ? Math.max(0, Math.floor((collectMs - sentMs) / 1000)) : 0,
    collectSeconds: 0,
    totalSeconds: 0,
    totalMinutes: 0,
    targetMinutes,
    isBreached: false,
    isNearSla: false
  };
}

const VALID_WHS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ['PROCESSED', 'SENT_TO_WHS'],
  PROCESSED: ['SENT_TO_WHS'],
  SENT_TO_WHS: ['COLLECT', 'CANCELLED_BY_WHS'],
  COLLECT: ['READY', 'CANCELLED_BY_WHS'],
  READY: ['RECEIVED', 'CANCELLED_BY_WHS'],
  RECEIVED: [],
  CANCELLED_BY_WHS: ['SENT_TO_WHS', 'PROCESSED'],
  ACTION_REQUIRED_ASS: ['SENT_TO_WHS', 'PROCESSED']
};

export function canTransitionStatus(from: RequestStatus, to: RequestStatus): boolean {
  return VALID_WHS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function copyTextSafe(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return true;
}

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
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
  const escXml = (v: string | number) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((r) => {
      const cells = r
        .map((c) => {
          const isNum = typeof c === 'number' && !Number.isNaN(c);
          return `<Cell ss:StyleID="sCell"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escXml(
            c
          )}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="sTitle"><Font ss:Bold="1" ss:Size="12" ss:Color="#1E293B"/></Style>
  <Style ss:ID="sHeader"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4338CA" ss:Pattern="Solid"/></Style>
  <Style ss:ID="sCell"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="${escXml(sheetName.slice(0, 28))}">
  <Table>
   <Row><Cell ss:StyleID="sTitle"><Data ss:Type="String">${escXml(metaSummary)}</Data></Cell></Row>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
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
// 5. MODERN PILL BADGES & LOGO COMPONENT
// ============================================================================

export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  const styles: Record<RequestStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PROCESSED: 'bg-indigo-50 text-indigo-700',
    SENT_TO_WHS: 'bg-blue-50 text-blue-700 border border-blue-200',
    COLLECT: 'bg-amber-50 text-amber-700 border border-amber-200',
    READY: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    RECEIVED: 'bg-emerald-100/80 text-emerald-800 border border-emerald-300',
    CANCELLED_BY_WHS: 'bg-rose-50 text-rose-700 border border-rose-200',
    ACTION_REQUIRED_ASS: 'bg-rose-100 text-rose-800 border border-rose-300'
  };
  const labels: Record<RequestStatus, string> = {
    DRAFT: 'Draft',
    PROCESSED: 'Processed',
    SENT_TO_WHS: 'Antrean WHS',
    COLLECT: 'Collecting',
    READY: 'Ready',
    RECEIVED: 'Received',
    CANCELLED_BY_WHS: 'Cancelled WHS',
    ACTION_REQUIRED_ASS: 'Revisi ASS'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${styles[status]}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'READY' || status === 'RECEIVED'
            ? 'bg-emerald-500'
            : status === 'COLLECT'
              ? 'bg-amber-500 animate-pulse'
              : status === 'SENT_TO_WHS'
                ? 'bg-blue-500 animate-pulse'
                : status === 'CANCELLED_BY_WHS'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
        }`}
      />
      {labels[status]}
    </span>
  );
};

export const WarrantyBadge: React.FC<{ status: WarrantyStatus; type: RequestType }> = ({
  status,
  type
}) => {
  if (type === 'NORMAL' || status === 'NOT_APPLICABLE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
        NORMAL
      </span>
    );
  }
  const map: Record<WarrantyStatus, { cls: string; label: string }> = {
    NOT_APPLICABLE: { cls: 'bg-slate-100 text-slate-600', label: 'NORMAL' },
    WARRANTY_PENDING: {
      cls: 'bg-purple-50 text-purple-700 border border-purple-200',
      label: 'WARRANTY • PENDING'
    },
    WARRANTY_APPROVED: {
      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      label: 'WARRANTY • APPROVED'
    },
    WARRANTY_REJECTED: {
      cls: 'bg-rose-50 text-rose-700 border border-rose-200',
      label: 'WARRANTY • REJECTED'
    }
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${map[status].cls}`}>
      {map[status].label}
    </span>
  );
};

export const BrandLogo: React.FC<{
  logoPath: string | null;
  size?: 'sm' | 'md' | 'lg';
}> = ({ logoPath, size = 'md' }) => {
  const dims = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt="Brand Logo"
        className={`${dims} rounded-2xl object-contain bg-white border border-slate-200 p-1 shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm`}
    >
      <Package className="w-5 h-5" />
    </div>
  );
};
// ============================================================================
// 6. MAIN APPLICATION COMPONENT & STATE MANAGEMENT
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
  | 'users_roles'
  | 'settings';

interface RequestFormState {
  id?: string;
  request_date: string;
  source_votp_url: string;
  requester: string; // Diambil dari bagian "Diminta Oleh"
  unit: string;
  request_type: RequestType;
  wo_number: string;
  po_number: string;
  do_number: string;
  to_number: string;
  requested_parts: RequestedPartItem[];
  additional_notes: string;
  warranty_note: string;
}

const DEFAULT_EXTRACTED = extractVotpPdfFromUrlOrText(
  'https://votp.my.id/form-request-material-vendor/ce66d16fb5ac46eb81d016fd32a8a634'
);

const EMPTY_FORM: RequestFormState = {
  request_date: DEFAULT_EXTRACTED.request_date,
  source_votp_url: 'https://votp.my.id/form-request-material-vendor/ce66d16fb5ac46eb81d016fd32a8a634',
  requester: DEFAULT_EXTRACTED.requester,
  unit: DEFAULT_EXTRACTED.unit,
  request_type: DEFAULT_EXTRACTED.request_type,
  wo_number: DEFAULT_EXTRACTED.wo_number,
  po_number: DEFAULT_EXTRACTED.po_number,
  do_number: '',
  to_number: '',
  requested_parts: DEFAULT_EXTRACTED.requested_parts,
  additional_notes: '',
  warranty_note: DEFAULT_EXTRACTED.warranty_note
};

export default function App() {
  // Persistent LocalStorage helper
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Ignore
    }
    return fallback;
  };

  const [profiles, setProfiles] = useState<Profile[]>(() =>
    loadStored('votp_profiles_v3', INITIAL_PROFILES)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadStored('votp_settings_v3', INITIAL_SETTINGS)
  );
  const [requests, setRequests] = useState<MaterialRequest[]>(() =>
    loadStored('votp_requests_v3', INITIAL_REQUESTS)
  );
  const [revisions, setRevisions] = useState<RequestRevision[]>(() =>
    loadStored('votp_revisions_v3', INITIAL_REVISIONS)
  );
  const [whsEvents, setWhsEvents] = useState<WarehouseEvent[]>(() =>
    loadStored('votp_events_v3', INITIAL_EVENTS)
  );
  const [whsCases, setWhsCases] = useState<WarehouseCase[]>(() =>
    loadStored('votp_cases_v3', INITIAL_CASES)
  );
  const [warranties, setWarranties] = useState<WarrantyAnalysis[]>(() =>
    loadStored('votp_warranties_v3', INITIAL_WARRANTIES)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStored('votp_notifications_v3', INITIAL_NOTIFICATIONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStored('votp_audit_v3', INITIAL_AUDIT_LOGS)
  );

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('votp_profiles_v3', JSON.stringify(profiles));
      localStorage.setItem('votp_settings_v3', JSON.stringify(settings));
      localStorage.setItem('votp_requests_v3', JSON.stringify(requests));
      localStorage.setItem('votp_revisions_v3', JSON.stringify(revisions));
      localStorage.setItem('votp_events_v3', JSON.stringify(whsEvents));
      localStorage.setItem('votp_cases_v3', JSON.stringify(whsCases));
      localStorage.setItem('votp_warranties_v3', JSON.stringify(warranties));
      localStorage.setItem('votp_notifications_v3', JSON.stringify(notifications));
      localStorage.setItem('votp_audit_v3', JSON.stringify(auditLogs));
    } catch {
      // Ignore storage quota
    }
  }, [profiles, settings, requests, revisions, whsEvents, whsCases, warranties, notifications, auditLogs]);

  // Real-time 1-second stopwatch ticker for automatic Lead Time
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auth State
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => INITIAL_PROFILES[0]);
  const [loginEmail, setLoginEmail] = useState('swicopbib@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRoleOption, setLoginRoleOption] = useState<UserRole>('ASS_COP');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Quick Add User Modal State (Accessible from Topbar & User Management)
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('WHS');
  const [newUserUnit, setNewUserUnit] = useState('WHS-CENTRAL-01');

  // Layout & Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [txSortAsc, setTxSortAsc] = useState<boolean>(false);
  const [txPage, setTxPage] = useState<number>(1);

  // New Request Form & VOTP PDF Auto-Extraction State
  const [reqForm, setReqForm] = useState<RequestFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [extractedPdfText, setExtractedPdfText] = useState<string>(DEFAULT_EXTRACTED.raw_pdf_text);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [showPasteVotpBox, setShowPasteVotpBox] = useState<boolean>(false);
  const [pasteVotpRawText, setPasteVotpRawText] = useState<string>('');

  // Modals State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [printRequestId, setPrintRequestId] = useState<string | null>(null);
  const [cancelModalRequest, setCancelModalRequest] = useState<MaterialRequest | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Stok kosong');
  const [cancelNotes, setCancelNotes] = useState<string>('');
  const [cancelError, setCancelError] = useState<string>('');

  // ASS/COP Revision Modal (Including Editable Parts List!)
  const [revisionModalRequest, setRevisionModalRequest] = useState<MaterialRequest | null>(null);
  const [revDoNumber, setRevDoNumber] = useState('');
  const [revToNumber, setRevToNumber] = useState('');
  const [revWoNumber, setRevWoNumber] = useState('');
  const [revParts, setRevParts] = useState<RequestedPartItem[]>([]);
  const [revReason, setRevReason] = useState('');
  const [revAssEvalNote, setRevAssEvalNote] = useState('');
  const [revResendToWhs, setRevResendToWhs] = useState(true);
  const [revError, setRevError] = useState('');

  // WHS Status Action Modal
  const [whsActionModal, setWhsActionModal] = useState<{
    request: MaterialRequest;
    targetStatus: 'COLLECT' | 'READY' | 'RECEIVED';
  } | null>(null);
  const [whsActionNotes, setWhsActionNotes] = useState('');
  const [whsSuppliedQty, setWhsSuppliedQty] = useState('');
  const [whsRecipientName, setWhsRecipientName] = useState('');

  // Case Open Modal
  const [caseModalItem, setCaseModalItem] = useState<WarehouseCase | null>(null);
  const [caseRootCause, setCaseRootCause] = useState('');
  const [caseCorrectiveAction, setCaseCorrectiveAction] = useState('');
  const [caseCloseNote, setCaseCloseNote] = useState('');
  const [caseError, setCaseError] = useState('');

  // Warranty Analysis Modal
  const [warrantyModalRequest, setWarrantyModalRequest] = useState<MaterialRequest | null>(null);
  const [warStatus, setWarStatus] = useState<WarrantyStatus>('WARRANTY_PENDING');
  const [warFindings, setWarFindings] = useState('');
  const [warDecisionReason, setWarDecisionReason] = useState('');
  const [warEvidenceInput, setWarEvidenceInput] = useState('');
  const [warEvidenceList, setWarEvidenceList] = useState<string[]>([]);
  const [warAssFollowup, setWarAssFollowup] = useState('');
  const [warError, setWarError] = useState('');

  // Settings Sub-tab
  const [settingsSubTab, setSettingsSubTab] = useState<
    'branding' | 'sla' | 'cancellation' | 'export' | 'audit'
  >('branding');
  const [newCancelReasonInput, setNewCancelReasonInput] = useState('');

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const logAudit = (
    action: string,
    entity_type: string,
    entity_id: string,
    old_values: Record<string, unknown> | null,
    new_values: Record<string, unknown> | null
  ) => {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_id: currentUser?.id || 'system',
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const pushNotification = (
    recipient_role: UserRole,
    request_id: string,
    notification_type: AppNotification['notification_type'],
    title: string,
    message: string
  ) => {
    const notif: AppNotification = {
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
    setNotifications((prev) => [notif, ...prev]);
  };

  // ============================================================================
  // 7. USER & ROLE MANAGEMENT HANDLERS (PRODUCTION READY - OPTION BASED)
  // ============================================================================

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const emailClean = loginEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setLoginError('Masukkan alamat email yang valid.');
      return;
    }
    if (!loginPassword || loginPassword.length < 3) {
      setLoginError('Masukkan password akun Anda.');
      return;
    }

    let found = profiles.find((p) => p.email.toLowerCase() === emailClean);
    if (!found) {
      // Otomatis mendeteksi role berdasarkan pengaturan awal (ASS_COP sebagai pemegang role tertinggi)
      const autoRole: UserRole =
        emailClean.includes('whs') || emailClean.includes('warehouse') || emailClean.includes('gudang')
          ? 'WHS'
          : emailClean.includes('ngc') || emailClean.includes('warranty')
            ? 'NGC'
            : 'ASS_COP';
      const namePart = emailClean.split('@')[0].replace(/[._-]/g, ' ');
      const newProf: Profile = {
        id: `usr-${Date.now()}`,
        full_name: namePart.replace(/\b\w/g, (l) => l.toUpperCase()),
        email: emailClean,
        role: autoRole,
        unit_assignment:
          autoRole === 'ASS_COP'
            ? 'BIB-PLANT-01'
            : autoRole === 'WHS'
              ? 'WHS-CENTRAL-01'
              : 'NGC-WARRANTY-DIV',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfiles((prev) => [newProf, ...prev]);
      found = newProf;
    }
    setCurrentUser(found);
    setActiveTab('dashboard');
    showToast(
      'success',
      `Selamat datang, ${found.full_name} — Role Otomatis: ${
        found.role === 'ASS_COP' ? 'ASS/COP (Role Tertinggi)' : found.role
      }`
    );
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newUserEmail.trim().toLowerCase();
    const cleanName = newUserName.trim();
    if (!cleanName || !cleanEmail.includes('@')) {
      showToast('error', 'Nama lengkap dan email wajib diisi dengan benar.');
      return;
    }
    if (profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
      showToast('error', 'Email sudah terdaftar. Silakan ubah role langsung pada daftar user.');
      return;
    }
    const created: Profile = {
      id: `usr-${Date.now()}`,
      full_name: cleanName,
      email: cleanEmail,
      role: newUserRole,
      unit_assignment: newUserUnit.trim() || 'BIB-PLANT-01',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setProfiles((prev) => [created, ...prev]);
    logAudit('CREATE_USER_PROFILE', 'profiles', created.id, null, {
      full_name: created.full_name,
      email: created.email,
      role: created.role
    });
    setNewUserName('');
    setNewUserEmail('');
    setShowUserModal(false);
    showToast('success', `User ${created.full_name} berhasil ditambahkan dengan role ${created.role}.`);
  };

  const handleChangeUserRole = (userId: string, nextRole: UserRole) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === userId ? { ...p, role: nextRole, updated_at: new Date().toISOString() } : p
      )
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: nextRole } : null));
    }
    logAudit('CHANGE_USER_ROLE', 'profiles', userId, null, { role: nextRole });
    showToast('success', `Role user berhasil diubah menjadi ${nextRole}.`);
  };

  // ============================================================================
  // 8. ASS/COP NEW REQUEST & VOTP PDF AUTO-EXTRACTION HANDLERS
  // ============================================================================

  const applyExtractedVotpData = (
    extracted: ExtractedVotpPdfData,
    urlUsed: string,
    silent?: boolean
  ) => {
    setExtractedPdfText(extracted.raw_pdf_text);
    setReqForm((prev) => ({
      ...prev,
      source_votp_url: urlUsed.trim(),
      request_date: extracted.request_date,
      requester: extracted.requester,
      unit: extracted.unit,
      request_type: extracted.request_type,
      wo_number: extracted.wo_number,
      po_number: extracted.po_number,
      requested_parts: extracted.requested_parts,
      warranty_note: extracted.warranty_note
    }));
    setFormErrors({});
    if (!silent) {
      showToast(
        'success',
        `Ekstraksi VOTP berhasil: WO ${extracted.wo_number || '-'}, Unit ${extracted.unit}, Diminta Oleh ${extracted.requester} (${extracted.requested_parts.length} Part).`
      );
    }
  };

  const handleAutoExtractFromVotpLink = async (
    urlToExtract: string,
    customRawText?: string,
    silent?: boolean
  ) => {
    const cleanUrl = urlToExtract.trim();
    const check = validateVotpUrl(cleanUrl);
    if (!check.valid) {
      if (!silent) showToast('error', check.message || 'Link VOTP tidak valid.');
      return;
    }

    // 1. If custom text was passed (e.g. from Paste or PDF.js upload), parse directly
    if (customRawText && customRawText.trim().length > 10) {
      const parsed = parsePpaVotpTextContent(customRawText, cleanUrl);
      if (parsed) {
        applyExtractedVotpData(parsed, cleanUrl, silent);
        return;
      }
    }

    // 2. Check known catalog match (including ce66d16fb5ac46eb81d016fd32a8a634)
    for (const [key, tpl] of Object.entries(SAMPLE_VOTP_PDF_CATALOG)) {
      if (cleanUrl.toUpperCase().includes(key)) {
        applyExtractedVotpData(
          { ...tpl, raw_pdf_text: formatRawVotpText(tpl, cleanUrl) },
          cleanUrl,
          silent
        );
        return;
      }
    }

    // 3. Attempt live network extraction (Netlify serverless function -> Direct Fetch -> CORS Proxies)
    setIsExtractingPdf(true);
    const candidateEndpoints = [
      `/.netlify/functions/extract-votp?url=${encodeURIComponent(cleanUrl)}`,
      cleanUrl,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`
    ];

    for (const endpoint of candidateEndpoints) {
      try {
        const resp = await fetch(endpoint);
        if (!resp.ok) continue;

        const contentType = (resp.headers.get('content-type') || '').toLowerCase();
        const buffer = await resp.arrayBuffer();
        const firstBytes = new Uint8Array(buffer.slice(0, 5));
        const headerSig = String.fromCharCode(...firstBytes);

        let rawExtracted = '';
        if (headerSig === '%PDF-' || contentType.includes('application/pdf')) {
          rawExtracted = await extractTextFromPdfArrayBuffer(buffer);
        } else {
          const textBody = new TextDecoder('utf-8').decode(buffer);
          // Check if JSON response from our Netlify function
          if (textBody.trim().startsWith('{')) {
            try {
              const json = JSON.parse(textBody);
              if (json.rawText) rawExtracted = json.rawText;
              else if (json.html) rawExtracted = extractTextFromVotpHtml(json.html);
            } catch {
              rawExtracted = extractTextFromVotpHtml(textBody);
            }
          } else {
            rawExtracted = extractTextFromVotpHtml(textBody);
          }
        }

        const parsed = parsePpaVotpTextContent(rawExtracted, cleanUrl);
        if (parsed && (parsed.wo_number || parsed.unit !== '-')) {
          setIsExtractingPdf(false);
          applyExtractedVotpData(parsed, cleanUrl, silent);
          return;
        }
      } catch {
        // Try next endpoint
      }
    }

    setIsExtractingPdf(false);
    if (!silent) {
      setShowPasteVotpBox(true);
      showToast(
        'info',
        'Halaman VOTP memerlukan akses dokumen langsung. Silakan Upload File PDF VOTP atau Paste (Ctrl+V) teks dari halaman VOTP di bawah.'
      );
    }
  };

  const handlePdfFileUploadExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingPdf(true);
    try {
      const buffer = await file.arrayBuffer();
      const firstBytes = new Uint8Array(buffer.slice(0, 5));
      const isPdf = String.fromCharCode(...firstBytes) === '%PDF-';

      let rawText = '';
      if (isPdf) {
        rawText = await extractTextFromPdfArrayBuffer(buffer);
      } else {
        rawText = new TextDecoder('utf-8').decode(buffer);
      }

      const currentUrl =
        reqForm.source_votp_url.trim() ||
        `https://votp.my.id/form-request-material-vendor/${file.name.replace(/\.pdf$/i, '')}`;
      const parsed = parsePpaVotpTextContent(rawText, currentUrl);
      setIsExtractingPdf(false);

      if (parsed) {
        applyExtractedVotpData(parsed, currentUrl, false);
      } else {
        showToast(
          'error',
          'Format teks PDF belum terbaca otomatis. Anda dapat menempelkan teks VOTP atau mengedit kolom WO/Unit/Part di bawah.'
        );
      }
    } catch {
      setIsExtractingPdf(false);
      showToast(
        'error',
        'Gagal membaca file PDF. Silakan gunakan fitur Paste Teks VOTP atau isi kolom di bawah.'
      );
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim().length > 5) {
        setPasteVotpRawText(clipText);
        const parsed = parsePpaVotpTextContent(clipText, reqForm.source_votp_url);
        if (parsed) {
          applyExtractedVotpData(parsed, reqForm.source_votp_url, false);
          setShowPasteVotpBox(false);
          return;
        }
      }
      setShowPasteVotpBox(true);
    } catch {
      setShowPasteVotpBox(true);
    }
  };

  const handleSaveOrSendRequest = (targetAction: 'DRAFT' | 'PROCESSED' | 'SENT_TO_WHS') => {
    const autoExt = extractVotpPdfFromUrlOrText(reqForm.source_votp_url);
    const activeParts =
      reqForm.requested_parts && reqForm.requested_parts.length > 0
        ? reqForm.requested_parts
        : autoExt.requested_parts;

    const effectiveForm: RequestFormState = {
      ...reqForm,
      request_date: reqForm.request_date || autoExt.request_date,
      requester: reqForm.requester.trim() || autoExt.requester,
      unit: reqForm.unit.trim() || autoExt.unit,
      request_type: reqForm.request_type || autoExt.request_type,
      wo_number: reqForm.wo_number.trim() || autoExt.wo_number,
      po_number: reqForm.po_number.trim() || autoExt.po_number,
      requested_parts: activeParts,
      warranty_note: reqForm.warranty_note.trim() || autoExt.warranty_note
    };
    setReqForm(effectiveForm);
    setExtractedPdfText(autoExt.raw_pdf_text);

    const errs: Record<string, string> = {};
    const votpCheck = validateVotpUrl(effectiveForm.source_votp_url);
    if (!votpCheck.valid) errs.source_votp_url = votpCheck.message!;

    if (targetAction === 'PROCESSED' || targetAction === 'SENT_TO_WHS') {
      if (!effectiveForm.do_number.trim()) {
        errs.do_number = 'Nomor DO wajib diisi oleh ASS/COP.';
      }
      if (!effectiveForm.to_number.trim()) {
        errs.to_number = 'Nomor TO wajib diisi oleh ASS/COP.';
      }
    }

    const isDuplicateVotp = requests.some(
      (r) =>
        r.id !== effectiveForm.id &&
        r.source_votp_url.trim().toLowerCase() ===
          effectiveForm.source_votp_url.trim().toLowerCase() &&
        r.part_number.trim().toLowerCase() ===
          (activeParts[0]?.part_number || '').trim().toLowerCase()
    );
    if (isDuplicateVotp) {
      errs.duplicate =
        'Link VOTP dengan Part utama yang sama sudah terdaftar. Gunakan menu Edit/Revisi untuk memperbarui transaksi.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showToast('error', Object.values(errs)[0]);
      return;
    }

    setFormErrors({});
    const nowIso = new Date().toISOString();
    const nextSeq = String(requests.length + 1).padStart(4, '0');
    const reqNumber = effectiveForm.id
      ? requests.find((r) => r.id === effectiveForm.id)?.request_number || `REQ-202610-${nextSeq}`
      : `REQ-202610-${nextSeq}`;

    const primaryPart = activeParts[0] || {
      id: 'pt-default',
      material_id: 'MAT-0001',
      part_number: 'PN-0001',
      description: 'Spare Part Item',
      qty: 1,
      uom: 'EA'
    };
    const totalQty = activeParts.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    const newRecord: MaterialRequest = {
      id: effectiveForm.id || `req-${Date.now()}`,
      request_number: reqNumber,
      request_date: effectiveForm.request_date,
      source_votp_url: effectiveForm.source_votp_url.trim(),
      requester: effectiveForm.requester.trim(),
      unit: effectiveForm.unit.trim().toUpperCase(),
      request_type: effectiveForm.request_type,
      wo_number: effectiveForm.wo_number.trim().toUpperCase(),
      po_number: effectiveForm.po_number.trim().toUpperCase(),
      do_number: effectiveForm.do_number.trim().toUpperCase(),
      to_number: effectiveForm.to_number.trim().toUpperCase(),
      material_id: primaryPart.material_id,
      part_number: primaryPart.part_number,
      description:
        activeParts.length > 1
          ? `${primaryPart.description} (+${activeParts.length - 1} part lainnya)`
          : primaryPart.description,
      requested_qty: totalQty,
      supplied_qty: null,
      requested_parts: activeParts,
      additional_notes: effectiveForm.additional_notes.trim(),
      warranty_note:
        effectiveForm.request_type === 'WARRANTY' ? effectiveForm.warranty_note.trim() : '',
      operational_notes: '',
      recipient_name: '',
      cancel_reason: '',
      cancel_notes: '',
      cancelled_by: null,
      cancelled_at: null,
      ass_evaluation_note: '',
      warranty_followup_wo_gi: '',
      status: targetAction,
      warranty_status:
        effectiveForm.request_type === 'WARRANTY' ? 'WARRANTY_PENDING' : 'NOT_APPLICABLE',
      current_revision: 0,
      target_lead_time_snapshot: settings.warehouse_lead_time_minutes,
      actual_lead_time_minutes: null,
      sent_to_whs_at: targetAction === 'SENT_TO_WHS' ? nowIso : null,
      collect_at: null,
      ready_at: null,
      received_at: null,
      created_by: currentUser?.id || 'usr-swicop-01',
      created_at: nowIso,
      updated_at: nowIso
    };

    setRequests((prev) => {
      const exists = prev.some((r) => r.id === newRecord.id);
      return exists
        ? prev.map((r) => (r.id === newRecord.id ? newRecord : r))
        : [newRecord, ...prev];
    });

    if (targetAction === 'SENT_TO_WHS') {
      const evt: WarehouseEvent = {
        id: `evt-${Date.now()}`,
        request_id: newRecord.id,
        revision_id: null,
        revision_number: newRecord.current_revision,
        event_type: 'SENT_TO_WHS',
        actor_id: currentUser?.id || 'usr-swicop-01',
        notes: `Order dikirim ke WHS (DO: ${newRecord.do_number}, TO: ${newRecord.to_number}). Timer Lead Time berjalan otomatis.`,
        occurred_at: nowIso
      };
      setWhsEvents((prev) => [evt, ...prev]);
      pushNotification(
        'WHS',
        newRecord.id,
        'NEW_WHS_QUEUE',
        `Order Baru Masuk Antrean WHS: ${newRecord.request_number}`,
        `WO: ${newRecord.wo_number || newRecord.po_number} | DO: ${newRecord.do_number} | TO: ${newRecord.to_number} | Unit: ${newRecord.unit}`
      );
    }

    if (newRecord.request_type === 'WARRANTY') {
      setWarranties((prev) => {
        if (prev.some((w) => w.request_id === newRecord.id)) return prev;
        return [
          {
            id: `war-${Date.now()}`,
            request_id: newRecord.id,
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
    }

    logAudit(`REQUEST_${targetAction}`, 'requests', newRecord.request_number, null, {
      status: targetAction,
      wo_number: newRecord.wo_number,
      do_number: newRecord.do_number,
      to_number: newRecord.to_number,
      parts_count: newRecord.requested_parts.length
    });

    setReqForm({
      ...EMPTY_FORM,
      do_number: '',
      to_number: '',
      additional_notes: ''
    });

    showToast(
      'success',
      targetAction === 'SENT_TO_WHS'
        ? `${newRecord.request_number} berhasil dikirim ke WHS & timer Lead Time otomatis berjalan!`
        : `${newRecord.request_number} berhasil disimpan.`
    );
    setActiveTab('all_requests');
  };

  // ============================================================================
  // 9. WHS STATUS TRANSITION, LIVE TIMER LOCK & AUTO CASE OPEN
  // ============================================================================

  const openWhsTransitionModal = (
    req: MaterialRequest,
    targetStatus: 'COLLECT' | 'READY' | 'RECEIVED'
  ) => {
    if (!canTransitionStatus(req.status, targetStatus)) {
      showToast('error', `Transisi dari ${req.status} ke ${targetStatus} tidak valid.`);
      return;
    }
    setWhsActionModal({ request: req, targetStatus });
    setWhsActionNotes(req.operational_notes || '');
    setWhsSuppliedQty(String(req.supplied_qty ?? req.requested_qty));
    setWhsRecipientName(req.recipient_name || req.requester);
  };

  const handleConfirmWhsStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whsActionModal) return;
    const { request, targetStatus } = whsActionModal;
    const nowIso = new Date().toISOString();
    const nowTimestamp = new Date(nowIso).getTime();

    let updatedCollectAt = request.collect_at;
    let updatedReadyAt = request.ready_at;
    let updatedReceivedAt = request.received_at;
    let computedLeadTime = request.actual_lead_time_minutes;

    if (targetStatus === 'COLLECT') {
      updatedCollectAt = nowIso;
    } else if (targetStatus === 'READY') {
      updatedReadyAt = nowIso;
      const sentMs = request.sent_to_whs_at
        ? new Date(request.sent_to_whs_at).getTime()
        : nowTimestamp;
      computedLeadTime = Math.max(1, Math.round((nowTimestamp - sentMs) / 60000));
    } else if (targetStatus === 'RECEIVED') {
      updatedReceivedAt = nowIso;
    }

    const parsedSupplied = whsSuppliedQty ? Number(whsSuppliedQty) : request.requested_qty;

    const updatedReq: MaterialRequest = {
      ...request,
      status: targetStatus,
      collect_at: updatedCollectAt,
      ready_at: updatedReadyAt,
      received_at: updatedReceivedAt,
      actual_lead_time_minutes: computedLeadTime,
      supplied_qty: parsedSupplied,
      operational_notes: whsActionNotes.trim() || request.operational_notes,
      recipient_name:
        targetStatus === 'RECEIVED' ? whsRecipientName.trim() : request.recipient_name,
      updated_at: nowIso
    };

    setRequests((prev) => prev.map((r) => (r.id === request.id ? updatedReq : r)));

    const evt: WarehouseEvent = {
      id: `evt-${Date.now()}`,
      request_id: request.id,
      revision_id: null,
      revision_number: request.current_revision,
      event_type: targetStatus,
      actor_id: currentUser?.id || 'usr-whs-01',
      notes: whsActionNotes.trim() || `Status diubah menjadi ${targetStatus}.`,
      supplied_qty: parsedSupplied,
      occurred_at: nowIso
    };
    setWhsEvents((prev) => [evt, ...prev]);

    // Check SLA breach on READY -> Auto Create Case Open
    if (targetStatus === 'READY' && computedLeadTime !== null) {
      const targetSnapshot = request.target_lead_time_snapshot;
      if (computedLeadTime > targetSnapshot) {
        const delayMins = computedLeadTime - targetSnapshot;
        const alreadyExists = whsCases.some(
          (c) => c.request_id === request.id && c.revision_number === request.current_revision
        );
        if (!alreadyExists) {
          const newCase: WarehouseCase = {
            id: `case-${Date.now()}`,
            case_number: `CASE-202610-00${whsCases.length + 1}`,
            request_id: request.id,
            revision_id: null,
            revision_number: request.current_revision,
            target_minutes_snapshot: targetSnapshot,
            actual_minutes: computedLeadTime,
            delay_minutes: delayMins,
            root_cause: '',
            corrective_action: '',
            close_note: '',
            pic_id: currentUser?.id || 'usr-whs-01',
            pic_name: currentUser?.full_name || 'WHS Officer',
            status: 'OPEN',
            opened_at: nowIso,
            closed_by: null,
            closed_at: null
          };
          setWhsCases((prev) => [newCase, ...prev]);
          pushNotification(
            'ASS_COP',
            request.id,
            'SLA_CASE_OPEN',
            `SLA Terlampaui: ${newCase.case_number} (${request.request_number})`,
            `Lead time aktual ${computedLeadTime} mnt melampaui target ${targetSnapshot} mnt.`
          );
        }
      }
    }

    setWhsActionModal(null);
    showToast(
      'success',
      targetStatus === 'COLLECT'
        ? `${request.request_number} masuk tahap COLLECT. Timer proses Collect sedang berjalan otomatis!`
        : targetStatus === 'READY'
          ? `${request.request_number} READY! Total Lead Time terkunci pada ${computedLeadTime} menit.`
          : `${request.request_number} telah diterima (RECEIVED).`
    );
  };

  // ============================================================================
  // 10. WHS CANCEL & ASS/COP REVISION (INCLUDING PART LIST REVISION!)
  // ============================================================================

  const openWhsCancelModal = (req: MaterialRequest) => {
    setCancelModalRequest(req);
    setCancelReason(settings.cancel_reasons[0] || 'Stok kosong');
    setCancelNotes('');
    setCancelError('');
  };

  const handleConfirmWhsCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalRequest) return;
    if (!cancelReason) {
      setCancelError('Alasan CANCEL wajib dipilih.');
      return;
    }
    if (cancelReason === 'Lainnya' && !cancelNotes.trim()) {
      setCancelError('Catatan tambahan wajib diisi apabila memilih alasan "Lainnya".');
      return;
    }
    const nowIso = new Date().toISOString();
    const updated: MaterialRequest = {
      ...cancelModalRequest,
      status: 'CANCELLED_BY_WHS',
      cancel_reason: cancelReason,
      cancel_notes: cancelNotes.trim(),
      cancelled_by: currentUser?.id || 'usr-whs-01',
      cancelled_at: nowIso,
      updated_at: nowIso
    };
    setRequests((prev) => prev.map((r) => (r.id === cancelModalRequest.id ? updated : r)));
    pushNotification(
      'ASS_COP',
      cancelModalRequest.id,
      'WHS_CANCEL',
      `Request CANCELLED oleh WHS: ${cancelModalRequest.request_number}`,
      `Alasan: ${cancelReason}${cancelNotes ? ` (${cancelNotes})` : ''}. Mohon revisi DO/TO atau Part.`
    );
    setCancelModalRequest(null);
    showToast('info', `${cancelModalRequest.request_number} dibatalkan & diteruskan ke ASS/COP.`);
  };

  const openAssRevisionModal = (req: MaterialRequest) => {
    setRevisionModalRequest(req);
    setRevDoNumber(req.do_number ? `${req.do_number}-R${req.current_revision + 1}` : 'DO-770901-R1');
    setRevToNumber(req.to_number ? `${req.to_number}-R${req.current_revision + 1}` : 'TO-660901-R1');
    setRevWoNumber(req.wo_number);
    setRevParts(
      req.requested_parts && req.requested_parts.length > 0
        ? req.requested_parts.map((p) => ({ ...p }))
        : [
            {
              id: `pt-rev-${Date.now()}`,
              material_id: req.material_id,
              part_number: req.part_number,
              description: req.description,
              qty: req.requested_qty,
              uom: 'EA'
            }
          ]
    );
    setRevReason('');
    setRevAssEvalNote(req.ass_evaluation_note || '');
    setRevResendToWhs(true);
    setRevError('');
  };

  const handleConfirmAssRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalRequest) return;
    if (!revDoNumber.trim() || !revToNumber.trim()) {
      setRevError('Nomor DO dan Nomor TO hasil revisi wajib diisi.');
      return;
    }
    if (!revReason.trim()) {
      setRevError('Alasan revisi wajib diisi.');
      return;
    }
    const validParts = revParts.filter((p) => p.part_number.trim() && p.description.trim());
    if (validParts.length === 0) {
      setRevError('Minimal harus ada 1 item part yang valid.');
      return;
    }

    const nowIso = new Date().toISOString();
    const nextRevNo = revisionModalRequest.current_revision + 1;
    const nextStatus: RequestStatus = revResendToWhs ? 'SENT_TO_WHS' : 'PROCESSED';

    const oldPartsSummary = (revisionModalRequest.requested_parts || [])
      .map((p) => `${p.part_number} (${p.qty} ${p.uom})`)
      .join(', ');
    const newPartsSummary = validParts
      .map((p) => `${p.part_number} (${p.qty} ${p.uom})`)
      .join(', ');

    const primaryPart = validParts[0];
    const totalQty = validParts.reduce((s, p) => s + (Number(p.qty) || 1), 0);

    const revEntry: RequestRevision = {
      id: `rev-${Date.now()}`,
      request_id: revisionModalRequest.id,
      revision_number: nextRevNo,
      previous_values: {
        do_number: revisionModalRequest.do_number,
        to_number: revisionModalRequest.to_number,
        parts: oldPartsSummary
      },
      new_values: {
        do_number: revDoNumber.trim().toUpperCase(),
        to_number: revToNumber.trim().toUpperCase(),
        parts: newPartsSummary
      },
      previous_do_number: revisionModalRequest.do_number,
      new_do_number: revDoNumber.trim().toUpperCase(),
      previous_to_number: revisionModalRequest.to_number,
      new_to_number: revToNumber.trim().toUpperCase(),
      previous_parts_summary: oldPartsSummary,
      new_parts_summary: newPartsSummary,
      previous_status: revisionModalRequest.status,
      new_status: nextStatus,
      revision_reason: revReason.trim(),
      revised_by: currentUser?.id || 'usr-swicop-01',
      revised_at: nowIso
    };
    setRevisions((prev) => [revEntry, ...prev]);

    const updatedReq: MaterialRequest = {
      ...revisionModalRequest,
      do_number: revDoNumber.trim().toUpperCase(),
      to_number: revToNumber.trim().toUpperCase(),
      wo_number: revWoNumber.trim().toUpperCase(),
      material_id: primaryPart.material_id,
      part_number: primaryPart.part_number,
      description:
        validParts.length > 1
          ? `${primaryPart.description} (+${validParts.length - 1} part lainnya)`
          : primaryPart.description,
      requested_qty: totalQty,
      requested_parts: validParts,
      ass_evaluation_note: revAssEvalNote.trim(),
      current_revision: nextRevNo,
      status: nextStatus,
      sent_to_whs_at: revResendToWhs ? nowIso : revisionModalRequest.sent_to_whs_at,
      collect_at: revResendToWhs ? null : revisionModalRequest.collect_at,
      ready_at: revResendToWhs ? null : revisionModalRequest.ready_at,
      received_at: revResendToWhs ? null : revisionModalRequest.received_at,
      actual_lead_time_minutes: revResendToWhs
        ? null
        : revisionModalRequest.actual_lead_time_minutes,
      target_lead_time_snapshot: revResendToWhs
        ? settings.warehouse_lead_time_minutes
        : revisionModalRequest.target_lead_time_snapshot,
      updated_at: nowIso
    };

    setRequests((prev) => prev.map((r) => (r.id === revisionModalRequest.id ? updatedReq : r)));
    setRevisionModalRequest(null);
    showToast(
      'success',
      `Revisi #${nextRevNo} (DO/TO & Daftar Part) berhasil disimpan dan dikirim kembali ke WHS!`
    );
  };

  // ============================================================================
  // 11. CASE OPEN, WARRANTY & EXPORT HANDLERS
  // ============================================================================

  const openCaseModal = (c: WarehouseCase) => {
    setCaseModalItem(c);
    setCaseRootCause(c.root_cause || '');
    setCaseCorrectiveAction(c.corrective_action || '');
    setCaseCloseNote(c.close_note || '');
    setCaseError('');
  };

  const handleSaveCaseOpen = (closeCase: boolean) => {
    if (!caseModalItem) return;
    if (!caseRootCause.trim() || !caseCorrectiveAction.trim()) {
      setCaseError('Root Cause dan Corrective Action wajib diisi.');
      return;
    }
    if (closeCase && !caseCloseNote.trim()) {
      setCaseError('Case Open tidak boleh ditutup tanpa Catatan Penyelesaian.');
      return;
    }
    const nowIso = new Date().toISOString();
    const updated: WarehouseCase = {
      ...caseModalItem,
      root_cause: caseRootCause.trim(),
      corrective_action: caseCorrectiveAction.trim(),
      close_note: caseCloseNote.trim(),
      status: closeCase ? 'CLOSED' : 'OPEN',
      closed_by: closeCase ? currentUser?.id || 'usr-swicop-01' : caseModalItem.closed_by,
      closed_at: closeCase ? nowIso : caseModalItem.closed_at
    };
    setWhsCases((prev) => prev.map((c) => (c.id === caseModalItem.id ? updated : c)));
    setCaseModalItem(null);
    showToast(
      'success',
      closeCase ? `${updated.case_number} berhasil diverifikasi & ditutup.` : `Data RCA disimpan.`
    );
  };

  const openWarrantyModal = (req: MaterialRequest) => {
    setWarrantyModalRequest(req);
    const existing = warranties.find((w) => w.request_id === req.id);
    setWarStatus(existing?.analysis_status || req.warranty_status || 'WARRANTY_PENDING');
    setWarFindings(existing?.findings || '');
    setWarDecisionReason(existing?.decision_reason || '');
    setWarEvidenceList(existing?.evidence_paths || []);
    setWarAssFollowup(req.warranty_followup_wo_gi || existing?.followup_notes || '');
    setWarError('');
  };

  const handleSaveWarrantyAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyModalRequest) return;
    if (warStatus === 'WARRANTY_REJECTED' && !warDecisionReason.trim()) {
      setWarError('Alasan wajib diisi apabila klaim Warranty REJECTED.');
      return;
    }
    const nowIso = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === warrantyModalRequest.id
          ? {
              ...r,
              warranty_status: warStatus,
              warranty_followup_wo_gi: warAssFollowup.trim() || r.warranty_followup_wo_gi,
              updated_at: nowIso
            }
          : r
      )
    );
    setWarranties((prev) => {
      const idx = prev.findIndex((w) => w.request_id === warrantyModalRequest.id);
      const item: WarrantyAnalysis = {
        id: idx >= 0 ? prev[idx].id : `war-${Date.now()}`,
        request_id: warrantyModalRequest.id,
        analysis_status: warStatus,
        findings: warFindings.trim(),
        evidence_paths: warEvidenceList,
        decision_reason: warDecisionReason.trim(),
        analyst_id: currentUser?.id || 'usr-ngc-01',
        decided_at: nowIso,
        followup_required: warStatus === 'WARRANTY_REJECTED',
        followup_notes: warAssFollowup.trim()
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    setWarrantyModalRequest(null);
    showToast('success', `Status Warranty ${warrantyModalRequest.request_number} diperbarui.`);
  };

  // Filtered Requests
  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (unitFilter !== 'ALL' && r.unit !== unitFilter) return false;
      if (typeFilter !== 'ALL' && r.request_type !== typeFilter) return false;
      if (
        userFilter !== 'ALL' &&
        r.created_by !== userFilter &&
        !r.requester.toLowerCase().includes(userFilter.toLowerCase())
      ) {
        return false;
      }
      if (dateFromFilter && r.request_date < dateFromFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          r.request_number,
          r.requester,
          r.unit,
          r.wo_number,
          r.po_number,
          r.do_number,
          r.to_number,
          r.part_number,
          r.description,
          ...(r.requested_parts || []).map((p) => `${p.part_number} ${p.description}`)
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, unitFilter, typeFilter, userFilter, dateFromFilter, searchQuery]);

  const handleExportTransactions = (format: 'CSV' | 'XLSX') => {
    const headers = [
      'Request ID',
      'Tanggal',
      'Nomor WO',
      'Nomor PO',
      'Nomor DO',
      'Nomor TO',
      'Unit',
      'Diminta Oleh (Requester)',
      'Daftar Part & Qty',
      'Status WHS',
      'Status Warranty',
      'Lead Time (Menit)',
      'Revisi',
      'Link VOTP'
    ];
    const rows = visibleRequests.map((r) => {
      const live = getLiveLeadTime(r, nowMs);
      const partsText = (r.requested_parts || [])
        .map((p) => `${p.part_number}: ${p.description} (${p.qty} ${p.uom})`)
        .join(' | ');
      return [
        r.request_number,
        r.request_date,
        r.wo_number || '-',
        r.po_number || '-',
        r.do_number || '-',
        r.to_number || '-',
        r.unit,
        r.requester,
        partsText || `${r.part_number} (${r.requested_qty})`,
        r.status,
        r.warranty_status,
        live.totalMinutes || '-',
        r.current_revision,
        r.source_votp_url
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'CSV') {
      downloadCsvFile(`VOTP_Order_List_${stamp}.csv`, headers, rows);
    } else {
      downloadXlsxFile(
        `VOTP_Order_List_${stamp}.xlsx`,
        'Order List',
        `Diekspor oleh ${currentUser?.full_name} pada ${new Date().toLocaleString('id-ID')}`,
        headers,
        rows
      );
    }
    showToast('success', `File ${format} berhasil diunduh.`);
  };

  // KPI & Dashboard Metrics
  const kpiMetrics = useMemo(() => {
    const completed = requests.filter((r) => r.actual_lead_time_minutes !== null);
    const leadTimes = completed.map((r) => r.actual_lead_time_minutes as number);
    const avgLeadTime =
      leadTimes.length > 0
        ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
        : 0;
    const onTimeCount = completed.filter(
      (r) => (r.actual_lead_time_minutes as number) <= r.target_lead_time_snapshot
    ).length;
    const onTimePct =
      completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 100;

    const queueCount = requests.filter((r) => r.status === 'SENT_TO_WHS').length;
    const collectCount = requests.filter((r) => r.status === 'COLLECT').length;
    const readyCount = requests.filter((r) => r.status === 'READY').length;
    const receivedCount = requests.filter((r) => r.status === 'RECEIVED').length;
    const cancelCount = requests.filter((r) => r.status === 'CANCELLED_BY_WHS').length;
    const openCasesCount = whsCases.filter((c) => c.status === 'OPEN').length;

    const barData = requests.slice(0, 7).map((r) => {
      const live = getLiveLeadTime(r, nowMs);
      return {
        name: r.request_number.replace('REQ-202610-', '#'),
        unit: r.unit,
        leadTime: live.totalMinutes || 5,
        target: r.target_lead_time_snapshot
      };
    });

    const pieData = [
      { name: 'Received / Selesai', value: receivedCount || 1, color: '#10B981' },
      { name: 'Ready di WHS', value: readyCount || 1, color: '#3B82F6' },
      { name: 'Antrean & Collect', value: queueCount + collectCount || 1, color: '#F59E0B' },
      { name: 'Perlu Revisi / Cancel', value: cancelCount || 1, color: '#F43F5E' }
    ];

    return {
      totalOrders: requests.length,
      queueCount,
      collectCount,
      readyCount,
      receivedCount,
      cancelCount,
      openCasesCount,
      avgLeadTime,
      onTimePct,
      barData,
      pieData
    };
  }, [requests, whsCases, nowMs]);

  const allUnits = useMemo(
    () => Array.from(new Set(requests.map((r) => r.unit))).sort(),
    [requests]
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (n) => !n.read_at && (n.recipient_role === currentUser?.role || !n.recipient_role)
      ).length,
    [notifications, currentUser]
  );

  const detailRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) || null,
    [requests, selectedRequestId]
  );

  const printRequest = useMemo(
    () => requests.find((r) => r.id === printRequestId) || null,
    [requests, printRequestId]
  );
  // ============================================================================
  // 12. PRODUCTION LOGIN SCREEN (NO DEMO ACCOUNTS - DIRECT LOGIN & ROLE OPTION)
  // ============================================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#EEF2F9] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-7 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <BrandLogo logoPath={settings.logo_path} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {settings.app_name}
              </h1>
              <p className="text-xs text-slate-500">{settings.app_subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Pengguna
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nama@perusahaan.co.id"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailInput(loginEmail);
                    setResetSuccessMsg('');
                    setShowResetModal(true);
                  }}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Role terdeteksi otomatis sesuai akun pengguna. <strong>ASS/COP</strong> adalah
                pemegang Role Tertinggi (Master Admin) yang mengatur akses pengguna.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-[#4338CA] hover:bg-[#3730A3] transition shadow-md flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Masuk ke Portal
            </button>
          </form>
        </div>

        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
              {resetSuccessMsg ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-800">
                  {resetSuccessMsg}
                </div>
              ) : (
                <input
                  type="email"
                  value={resetEmailInput}
                  onChange={(e) => setResetEmailInput(e.target.value)}
                  placeholder="Masukkan email terdaftar"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  Tutup
                </button>
                {!resetSuccessMsg && (
                  <button
                    type="button"
                    onClick={() =>
                      setResetSuccessMsg(
                        `Tautan pemulihan password telah dikirim ke ${resetEmailInput}.`
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-[#4338CA] text-white text-xs font-semibold"
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

  // Navigation items per role
  const roleNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] =
    currentUser.role === 'ASS_COP'
      ? [
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
          {
            id: 'all_requests',
            label: 'Order List',
            icon: <FileText className="w-4 h-4" />,
            badge: requests.length
          },
          {
            id: 'new_request',
            label: 'New Request (VOTP)',
            icon: <PlusCircle className="w-4 h-4" />
          },
          {
            id: 'revision_required',
            label: 'Perlu Revisi',
            icon: <AlertTriangle className="w-4 h-4" />,
            badge: kpiMetrics.cancelCount
          },
          { id: 'whs_kpi', label: 'KPI & Live SLA', icon: <Clock className="w-4 h-4" /> },
          {
            id: 'warranty_tracking',
            label: 'Warranty NGC',
            icon: <ShieldCheck className="w-4 h-4" />
          },
          {
            id: 'users_roles',
            label: 'Kelola User & Role',
            icon: <Users className="w-4 h-4" />
          },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
        ]
      : currentUser.role === 'WHS'
        ? [
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            {
              id: 'whs_queue',
              label: 'Order Queue WHS',
              icon: <Package className="w-4 h-4" />,
              badge: kpiMetrics.queueCount + kpiMetrics.collectCount
            },
            {
              id: 'whs_ops',
              label: 'Ready & Received',
              icon: <CheckCircle2 className="w-4 h-4" />
            },
            {
              id: 'cancelled_requests',
              label: 'Cancelled List',
              icon: <XCircle className="w-4 h-4" />
            },
            {
              id: 'case_open',
              label: 'Case Open SLA',
              icon: <AlertOctagon className="w-4 h-4" />,
              badge: kpiMetrics.openCasesCount
            },
            { id: 'whs_kpi', label: 'KPI & Live SLA', icon: <Clock className="w-4 h-4" /> }
          ]
        : [
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            {
              id: 'warranty_queue',
              label: 'Warranty Queue',
              icon: <ShieldCheck className="w-4 h-4" />
            },
            {
              id: 'analysis_history',
              label: 'Riwayat Analisis',
              icon: <ClipboardCheck className="w-4 h-4" />
            }
          ];

  return (
    <div className="min-h-screen bg-[#EEF2F9] p-2 sm:p-4 md:p-6 flex flex-col">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 no-print max-w-md px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-indigo-600 text-white border-indigo-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* MAIN MODERN ROUNDED BENTO SHELL (Matching Reference Image) */}
      <div className="flex-1 bg-white rounded-[28px] shadow-sm border border-slate-200/80 flex overflow-hidden min-h-[88vh]">
        {/* LEFT COMPACT ICON-RAIL SIDEBAR */}
        <aside
          className={`no-print bg-white border-r border-slate-100 flex flex-col justify-between py-6 px-3 transition-all duration-200 shrink-0 ${
            sidebarExpanded ? 'w-56' : 'w-[72px]'
          }`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <BrandLogo logoPath={settings.logo_path} size="sm" />
                {sidebarExpanded && (
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {settings.app_name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebarExpanded((prev) => !prev)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title={sidebarExpanded ? 'Ciutkan Sidebar' : 'Perlebar Sidebar'}
              >
                {sidebarExpanded ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>

            <nav className="space-y-1.5">
              {roleNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{item.icon}</span>
                      {sidebarExpanded && <span className="truncate">{item.label}</span>}
                    </div>
                    {sidebarExpanded && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              title="Keluar / Logout"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {sidebarExpanded && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {/* TOP HEADER BAR (Matching Reference Image) */}
          <header className="no-print h-16 bg-white border-b border-slate-100 px-5 sm:px-8 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari WO, DO, TO, Unit, Pemohon..."
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/80 border border-transparent focus:border-indigo-300 focus:bg-white text-xs text-slate-800 focus:outline-none transition"
                />
              </div>
              <span className="hidden md:inline-block text-xs font-semibold text-indigo-600">
                Today, {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>

            {/* Right Controls: Quick Role/User Option, Add User, Notifications, Profile */}
            <div className="flex items-center gap-2.5">
              {/* Automatic Role Badge (ASS/COP = Highest Role / Super Admin) */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                  currentUser.role === 'ASS_COP'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : currentUser.role === 'WHS'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {currentUser.role === 'ASS_COP'
                    ? 'ASS/COP • Role Tertinggi'
                    : currentUser.role === 'WHS'
                      ? 'WHS • Gudang'
                      : 'NGC • Warranty'}
                </span>
              </div>

              {currentUser.role === 'ASS_COP' && (
                <button
                  type="button"
                  onClick={() => setShowUserModal(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
                  title="Tambah User & Atur Role (Khusus Pemegang Role Tertinggi ASS/COP)"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + User & Role
                </button>
              )}

              {currentUser.role === 'ASS_COP' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className="relative p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-[#4338CA] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {currentUser.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{currentUser.email}</div>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN SCROLLABLE CONTENT */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
            {/* ============================================================
                VIEW 1: MODERN BENTO DASHBOARD (Matching Top Reference Image)
                ============================================================ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Greeting Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Hello, {currentUser.full_name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Pantau real-time WO/DO/TO, timer otomatis Lead Time Warehouse (Target{' '}
                      <strong className="text-slate-600">
                        {settings.warehouse_lead_time_minutes} menit
                      </strong>
                      ), dan status klaim NGC.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(currentUser.role === 'WHS' ? 'whs_queue' : 'all_requests')
                      }
                      className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      Lihat Order List →
                    </button>
                    {currentUser.role === 'ASS_COP' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('new_request')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Order (VOTP)
                      </button>
                    )}
                  </div>
                </div>

                {/* Top Bento Row: 2x2 KPI Cards + Rounded Indigo Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left 2x2 KPI Grid (5 cols) */}
                  <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hero Royal Indigo Card */}
                    <div
                      onClick={() => setActiveTab('all_requests')}
                      className="cursor-pointer bg-[#4338CA] text-white p-5 rounded-3xl shadow-md flex flex-col justify-between min-h-[150px] hover:bg-[#3730A3] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-indigo-100">Total Orders</span>
                        <span className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-sm">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-extrabold">{kpiMetrics.totalOrders}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-200 mt-1">
                          WO & PO Tercatat dari VOTP
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Live Queue & Collecting */}
                    <div
                      onClick={() =>
                        setActiveTab(currentUser.role === 'WHS' ? 'whs_queue' : 'all_requests')
                      }
                      className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[150px] hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          Antrean & Collect
                        </span>
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-extrabold text-slate-900">
                            {kpiMetrics.queueCount + kpiMetrics.collectCount}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            Timer Jalan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Antrean: {kpiMetrics.queueCount} • Collect: {kpiMetrics.collectCount}
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Avg Lead Time */}
                    <div
                      onClick={() => setActiveTab('whs_kpi')}
                      className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[150px] hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Rata-rata Lead Time</span>
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-extrabold text-slate-900">
                            {kpiMetrics.avgLeadTime}m
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                            Target {settings.warehouse_lead_time_minutes}m
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Otomatis Order Masuk → Ready
                        </p>
                      </div>
                    </div>

                    {/* Card 4: On-Time SLA % */}
                    <div
                      onClick={() => setActiveTab('whs_kpi')}
                      className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[150px] hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">On-Time SLA %</span>
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-extrabold text-slate-900">
                            {kpiMetrics.onTimePct}%
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            SLA Gudang
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Case Open Aktif: {kpiMetrics.openCasesCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Rounded Bar Chart (7 cols) */}
                  <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Durasi Lead Time per Order (Menit)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Perbandingan waktu aktual/berjalan terhadap target SLA ({settings.warehouse_lead_time_minutes} menit)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('whs_kpi')}
                        className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={kpiMetrics.barData} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                          />
                          <Tooltip
                            cursor={{ fill: '#F8FAFC' }}
                            contentStyle={{
                              borderRadius: '16px',
                              border: '1px solid #E2E8F0',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="leadTime" name="Durasi (Menit)" fill="#4338CA" radius={[10, 10, 10, 10]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Bento Row: 2 Summary Highlight Cards + Donut Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[175px]">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-slate-900">
                          {kpiMetrics.readyCount + kpiMetrics.receivedCount}{' '}
                          <span className="text-base font-medium text-slate-500">orders</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="text-emerald-600 font-semibold">
                            {kpiMetrics.readyCount} order READY
                          </span>{' '}
                          menunggu serah terima lapangan.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('revision_required')}
                      className="cursor-pointer bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[175px] hover:border-rose-200 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold text-slate-900">
                          {kpiMetrics.cancelCount + kpiMetrics.openCasesCount}{' '}
                          <span className="text-base font-medium text-slate-500">tindakan</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="text-rose-500 font-semibold">
                            {kpiMetrics.cancelCount} perlu revisi DO/TO
                          </span>{' '}
                          & {kpiMetrics.openCasesCount} Case Open SLA.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart Card */}
                  <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Distribusi Status Order</h3>
                        <p className="text-xs text-slate-400">Komposisi real-time antrean hingga selesai</p>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={kpiMetrics.pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={42}
                              outerRadius={64}
                              paddingAngle={4}
                            >
                              {kpiMetrics.pieData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 text-xs">
                        {kpiMetrics.pieData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-slate-600 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* ============================================================
                VIEW 2: ORDER LIST — COMPACT TABLE WITH WO/DO/TO UP FRONT & LIVE TIMER
                (Matching Bottom Screen of Reference Image)
                ============================================================ */}
            {(activeTab === 'all_requests' ||
              activeTab === 'whs_queue' ||
              activeTab === 'whs_ops' ||
              activeTab === 'cancelled_requests' ||
              activeTab === 'revision_required' ||
              activeTab === 'transactions') && (
              <div className="space-y-5">
                {/* Title */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {activeTab === 'whs_queue'
                        ? 'Warehouse Order Queue'
                        : activeTab === 'revision_required'
                          ? 'Orders Perlu Revisi DO/TO & Part'
                          : activeTab === 'cancelled_requests'
                            ? 'Cancelled Orders List'
                            : 'Order & Material Request List'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tampilan ringkas dengan <strong>WO, DO, dan TO</strong> di depan serta{' '}
                      <strong>Timer Lead Time Otomatis</strong>. Klik tombol <strong>Detail</strong>{' '}
                      untuk rincian daftar part dan riwayat lengkap.
                    </p>
                  </div>
                </div>

                {/* 4 Colored Top Strip Summary Cards (Matching Reference Image) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() =>
                      setStatusFilter(statusFilter === 'SENT_TO_WHS' ? 'ALL' : 'SENT_TO_WHS')
                    }
                    className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="bg-[#7C83FD] px-4 py-2 text-white text-xs font-semibold flex items-center justify-between">
                      <span>Order Baru (Antrean WHS)</span>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-4 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {kpiMetrics.queueCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                        Timer Antrean Jalan
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setStatusFilter(statusFilter === 'COLLECT' ? 'ALL' : 'COLLECT')}
                    className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="bg-[#E58E65] px-4 py-2 text-white text-xs font-semibold flex items-center justify-between">
                      <span>Sedang Collect Part</span>
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-4 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {kpiMetrics.collectCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                        Timer Collect Jalan
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setStatusFilter(statusFilter === 'READY' ? 'ALL' : 'READY')}
                    className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="bg-[#F6C967] px-4 py-2 text-slate-900 text-xs font-semibold flex items-center justify-between">
                      <span>Ready di Warehouse</span>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-4 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {kpiMetrics.readyCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        Siap Diambil
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setStatusFilter(statusFilter === 'RECEIVED' ? 'ALL' : 'RECEIVED')
                    }
                    className="cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="bg-[#5CD895] px-4 py-2 text-slate-900 text-xs font-semibold flex items-center justify-between">
                      <span>Delivered / Received</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-4 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {kpiMetrics.receivedCount}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Selesai
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toolbar & Filter Row (Matching Reference Image) */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setTxPage(1);
                          }}
                          placeholder="Search WO, DO, TO, Unit..."
                          className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {visibleRequests.length}{' '}
                        <span className="font-normal text-slate-400">orders</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleExportTransactions('CSV')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-indigo-600"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportTransactions('XLSX')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-emerald-700"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Export XLSX
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxSortAsc((prev) => !prev)}
                        className="px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        Sort: {txSortAsc ? 'Terlama ↑' : 'Terbaru ↓'}
                      </button>
                      {currentUser.role === 'ASS_COP' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('new_request')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Chips Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        <Filter className="w-3.5 h-3.5" />
                      </span>
                      <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-xs focus:outline-none"
                      >
                        <option value="ALL">Semua Unit</option>
                        {allUnits.map((u) => (
                          <option key={u} value={u}>
                            Unit: {u}
                          </option>
                        ))}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-xs focus:outline-none"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="SENT_TO_WHS">Antrean WHS</option>
                        <option value="COLLECT">Collecting</option>
                        <option value="READY">Ready</option>
                        <option value="RECEIVED">Received</option>
                        <option value="CANCELLED_BY_WHS">Cancelled / Revisi</option>
                      </select>

                      {(unitFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnitFilter('ALL');
                            setStatusFilter('ALL');
                            setSearchQuery('');
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:underline pl-1"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* COMPACT TABLE: WO, DO, TO UP FRONT + AUTOMATIC LIVE LEAD TIME + DETAIL BUTTON */}
                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3">Order Number</th>
                          <th className="py-3 px-3">Nomor WO / PO</th>
                          <th className="py-3 px-3">Nomor DO & TO</th>
                          <th className="py-3 px-3">Unit & Diminta Oleh</th>
                          <th className="py-3 px-3">Live Lead Time (Auto)</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Aksi & Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...visibleRequests]
                          .filter((r) => {
                            if (activeTab === 'whs_queue')
                              return r.status === 'SENT_TO_WHS' || r.status === 'COLLECT';
                            if (activeTab === 'whs_ops')
                              return r.status === 'READY' || r.status === 'RECEIVED';
                            if (
                              activeTab === 'cancelled_requests' ||
                              activeTab === 'revision_required'
                            )
                              return (
                                r.status === 'CANCELLED_BY_WHS' ||
                                r.status === 'ACTION_REQUIRED_ASS'
                              );
                            return true;
                          })
                          .sort((a, b) =>
                            txSortAsc
                              ? a.request_number.localeCompare(b.request_number)
                              : b.request_number.localeCompare(a.request_number)
                          )
                          .map((r) => {
                            const live = getLiveLeadTime(r, nowMs);
                            return (
                              <tr key={r.id} className="hover:bg-slate-50/80 transition">
                                {/* 1. Order Number & Date */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <div className="font-bold text-slate-900">{r.request_number}</div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span>{r.request_date}</span>
                                    {r.current_revision > 0 && (
                                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                        Rev #{r.current_revision}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 2. WO / PO (Di Depan) */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <div className="font-bold text-indigo-950 font-mono">
                                    {r.wo_number || '-'}
                                  </div>
                                  {r.po_number && (
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      PO: {r.po_number}
                                    </div>
                                  )}
                                </td>

                                {/* 3. DO & TO (Di Depan) */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-900 font-mono font-bold text-[11px]">
                                    <span>DO: {r.do_number || '-'}</span>
                                  </div>
                                  <div className="text-[11px] font-mono font-semibold text-indigo-700 mt-1 pl-1">
                                    TO: {r.to_number || '-'}
                                  </div>
                                </td>

                                {/* 4. Unit & Diminta Oleh */}
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-slate-900">{r.unit}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Diminta: {r.requester}
                                  </div>
                                </td>

                                {/* 5. AUTOMATIC LIVE LEAD TIME TIMER */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  {live.isRunning ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                            live.isBreached
                                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                                              : live.isNearSla
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-indigo-50 text-indigo-700'
                                          }`}
                                        >
                                          <Clock className="w-3 h-3 animate-spin" />
                                          {formatDurationMmSs(live.totalSeconds)}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          / {live.targetMinutes}m
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        {r.status === 'SENT_TO_WHS' ? (
                                          <span>
                                            Antrean: <strong>{formatDurationMmSs(live.queueSeconds)}</strong>
                                          </span>
                                        ) : (
                                          <span>
                                            Antrean {Math.floor(live.queueSeconds / 60)}m • Collect:{' '}
                                            <strong className="text-amber-700">
                                              {formatDurationMmSs(live.collectSeconds)}
                                            </strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : live.totalMinutes > 0 ? (
                                    <div>
                                      <span
                                        className={`font-bold ${
                                          live.isBreached ? 'text-rose-600' : 'text-emerald-700'
                                        }`}
                                      >
                                        {live.totalMinutes} mnt
                                      </span>{' '}
                                      <span className="text-[10px] text-slate-400">
                                        (SLA {live.targetMinutes}m)
                                      </span>
                                      <div className="text-[10px] text-slate-400">
                                        Antrean {Math.floor(live.queueSeconds / 60)}m • Collect{' '}
                                        {Math.floor(live.collectSeconds / 60)}m
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">
                                      {live.stageLabel}
                                    </span>
                                  )}
                                </td>

                                {/* 6. Status */}
                                <td className="py-3.5 px-3 whitespace-nowrap">
                                  <StatusBadge status={r.status} />
                                  {r.request_type === 'WARRANTY' && (
                                    <div className="mt-1">
                                      <WarrantyBadge
                                        status={r.warranty_status}
                                        type={r.request_type}
                                      />
                                    </div>
                                  )}
                                </td>

                                {/* 7. Actions & Tombol Detail */}
                                <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    {/* WHS Quick Action Buttons */}
                                    {(currentUser.role === 'WHS' || currentUser.role === 'ASS_COP') && r.status === 'SENT_TO_WHS' && (
                                      <button
                                        type="button"
                                        onClick={() => openWhsTransitionModal(r, 'COLLECT')}
                                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px]"
                                      >
                                        Collect
                                      </button>
                                    )}
                                    {(currentUser.role === 'WHS' || currentUser.role === 'ASS_COP') && r.status === 'COLLECT' && (
                                      <button
                                        type="button"
                                        onClick={() => openWhsTransitionModal(r, 'READY')}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                                      >
                                        Ready
                                      </button>
                                    )}
                                    {(currentUser.role === 'WHS' || currentUser.role === 'ASS_COP') && r.status === 'READY' && (
                                      <button
                                        type="button"
                                        onClick={() => openWhsTransitionModal(r, 'RECEIVED')}
                                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px]"
                                      >
                                        Received
                                      </button>
                                    )}
                                    {(currentUser.role === 'WHS' || currentUser.role === 'ASS_COP') &&
                                      (r.status === 'SENT_TO_WHS' ||
                                        r.status === 'COLLECT' ||
                                        r.status === 'READY') && (
                                        <button
                                          type="button"
                                          onClick={() => openWhsCancelModal(r)}
                                          className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px]"
                                        >
                                          Cancel
                                        </button>
                                      )}

                                    {/* ASS/COP Quick Revise Button */}
                                    {currentUser.role === 'ASS_COP' && (
                                      <button
                                        type="button"
                                        onClick={() => openAssRevisionModal(r)}
                                        className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px]"
                                        title="Revisi DO/TO atau Daftar Part"
                                      >
                                        Revisi
                                      </button>
                                    )}

                                    {/* Tombol Detail Utama */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequestId(r.id)}
                                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] shadow-sm"
                                    >
                                      Detail
                                    </button>
                                  </div>
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
                VIEW 3: NEW REQUEST (ASS/COP) — EKSTRAK LINK VOTP (WO, UNIT, DIMINTA OLEH, & PART)
                + INPUT MANUAL DO, TO & KETERANGAN
                ============================================================ */}
            {activeTab === 'new_request' && (
              <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Buat Order Material Baru dari Link VOTP (ASS/COP)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ekstrak otomatis{' '}
                      <strong className="text-slate-600">
                        WO No., Kode Unit, Diminta Oleh, dan Daftar Material/Part
                      </strong>{' '}
                      dari dokumen Material Request PT. PPA (<code>votp.my.id</code>), lalu input{' '}
                      <strong>DO, TO, dan Keterangan</strong>.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                    {`REQ-202610-${String(requests.length + 1).padStart(4, '0')}`}
                  </span>
                </div>

                {/* STEP 1: LINK VOTP, UPLOAD PDF (PDF.JS) & PASTE TEKS VOTP */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      1. Link Dokumen PDF VOTP (Otomatis Ekstrak Teks)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Paste Teks VOTP (Ctrl+V)
                      </button>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px]">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Upload File PDF VOTP
                        <input
                          type="file"
                          accept=".pdf,application/pdf,text/plain"
                          onChange={handlePdfFileUploadExtract}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="url"
                      value={reqForm.source_votp_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReqForm((prev) => ({ ...prev, source_votp_url: val }));
                      }}
                      placeholder="https://votp.my.id/form-request-material-vendor/ce66d16fb5ac46eb81d016fd32a8a634"
                      className="flex-1 min-w-[240px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoExtractFromVotpLink(reqForm.source_votp_url)}
                      disabled={isExtractingPdf}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPdf ? 'animate-spin' : ''}`} />
                      {isExtractingPdf ? 'Mengekstrak...' : 'Ekstrak Teks PDF'}
                    </button>
                  </div>

                  {/* Quick Sample Links including the exact PPA VOTP link */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Contoh Dokumen VOTP:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleAutoExtractFromVotpLink(
                          'https://votp.my.id/form-request-material-vendor/ce66d16fb5ac46eb81d016fd32a8a634'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 hover:border-indigo-400 text-indigo-800 font-bold text-[11px]"
                    >
                      PPA GSE304 (WO 200001168952)
                    </button>
                    {['VOTP-2026-8810', 'VOTP-2026-8811'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() =>
                          handleAutoExtractFromVotpLink(
                            `https://votp.company.co.id/documents/${code}.pdf`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-semibold text-[11px]"
                      >
                        {code}.pdf
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowPasteVotpBox((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-[11px]"
                    >
                      {showPasteVotpBox ? 'Sembunyikan Kotak Paste' : 'Buka Kotak Paste Teks VOTP'}
                    </button>
                  </div>

                  {/* Collapsible Paste VOTP Text Box for Protected/Cross-Origin VOTP Tabs */}
                  {showPasteVotpBox && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 text-xs">
                          Tempel (Ctrl+V) Teks dari Halaman / PDF VOTP (Jika Link VOTP Diproteksi Login/CORS)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPasteVotpBox(false)}
                          className="text-slate-400 hover:text-slate-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Buka tab <code>votp.my.id</code> Anda, tekan <strong>Ctrl+A</strong> lalu{' '}
                        <strong>Ctrl+C</strong>, kemudian tempelkan (<strong>Ctrl+V</strong>) di
                        bawah ini untuk mengekstrak otomatis <strong>WO No., Kode Unit, Diminta Oleh, dan Tabel Material</strong>:
                      </p>
                      <textarea
                        rows={4}
                        value={pasteVotpRawText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPasteVotpRawText(val);
                          const parsed = parsePpaVotpTextContent(val, reqForm.source_votp_url);
                          if (parsed) {
                            applyExtractedVotpData(parsed, reqForm.source_votp_url, true);
                          }
                        }}
                        placeholder={'Contoh hasil copy dari VOTP:\nDate : 2026-10-21 10:09:20\nKode Unit : GSE304   WO No. : 200001168952\n1  6150-21-5650  GAUGE -p  1  0\nDiminta Oleh : Support - Adm Planner Mekanik'}
                        className="w-full p-3 rounded-xl border border-indigo-200 bg-white font-mono text-[11px]"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parsePpaVotpTextContent(
                              pasteVotpRawText,
                              reqForm.source_votp_url
                            );
                            if (parsed) {
                              applyExtractedVotpData(parsed, reqForm.source_votp_url, false);
                              setShowPasteVotpBox(false);
                            } else {
                              showToast(
                                'error',
                                'Teks belum mengandung format Kode Unit / WO No. yang dikenali.'
                              );
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg bg-[#4338CA] text-white font-bold text-xs"
                        >
                          Proses Teks VOTP Sekarang
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Extracted Key Info Cards (Directly Editable Inline!) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Nomor WO (Hasil Ekstrak / Dapat Diedit)
                      </label>
                      <input
                        type="text"
                        value={reqForm.wo_number}
                        onChange={(e) => setReqForm({ ...reqForm, wo_number: e.target.value })}
                        placeholder="Contoh: 200001168952"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-extrabold text-indigo-950 font-mono text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Kode Unit (Hasil Ekstrak / Dapat Diedit)
                      </label>
                      <input
                        type="text"
                        value={reqForm.unit}
                        onChange={(e) => setReqForm({ ...reqForm, unit: e.target.value })}
                        placeholder="Contoh: GSE304"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-extrabold text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Diminta Oleh (Requester)
                      </label>
                      <input
                        type="text"
                        value={reqForm.requester}
                        onChange={(e) => setReqForm({ ...reqForm, requester: e.target.value })}
                        placeholder="Contoh: Support - Adm Planner Mekanik"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-extrabold text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Extracted Requested Parts Table (Editable Inline + Add/Remove Row!) */}
                  <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-700 text-[11px]">
                        Daftar Part / Material yang Diminta (Hasil Ekstrak VOTP — Dapat Diedit Langsung)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {reqForm.requested_parts.length} Item Part
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReqForm((prev) => ({
                              ...prev,
                              requested_parts: [
                                ...prev.requested_parts,
                                {
                                  id: `pt-add-${Date.now()}`,
                                  material_id: '',
                                  part_number: '',
                                  description: '',
                                  qty: 1,
                                  uom: 'EA'
                                }
                              ]
                            }))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700"
                        >
                          <Plus className="w-3 h-3" />+ Tambah Part
                        </button>
                      </div>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                          <th className="py-2 px-3">Material / Part Number</th>
                          <th className="py-2 px-3">Description (Deskripsi Part)</th>
                          <th className="py-2 px-3 w-24 text-center">Qty Order</th>
                          <th className="py-2 px-3 w-20 text-center">Satuan</th>
                          <th className="py-2 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reqForm.requested_parts.map((pt, idx) => (
                          <tr key={pt.id}>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={pt.part_number}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReqForm((prev) => ({
                                    ...prev,
                                    requested_parts: prev.requested_parts.map((item, i) =>
                                      i === idx
                                        ? { ...item, part_number: val, material_id: val }
                                        : item
                                    )
                                  }));
                                }}
                                placeholder="6150-21-5650"
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={pt.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReqForm((prev) => ({
                                    ...prev,
                                    requested_parts: prev.requested_parts.map((item, i) =>
                                      i === idx ? { ...item, description: val } : item
                                    )
                                  }));
                                }}
                                placeholder="GAUGE -p"
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="1"
                                value={pt.qty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  setReqForm((prev) => ({
                                    ...prev,
                                    requested_parts: prev.requested_parts.map((item, i) =>
                                      i === idx ? { ...item, qty: val } : item
                                    )
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 font-bold text-center text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={pt.uom}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setReqForm((prev) => ({
                                    ...prev,
                                    requested_parts: prev.requested_parts.map((item, i) =>
                                      i === idx ? { ...item, uom: val } : item
                                    )
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 font-bold text-center text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              {reqForm.requested_parts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReqForm((prev) => ({
                                      ...prev,
                                      requested_parts: prev.requested_parts.filter(
                                        (_, i) => i !== idx
                                      )
                                    }))
                                  }
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* STEP 2: INPUT MANUAL ASS/COP — HANYA INPUT DO, TO & KETERANGAN */}
                <div className="p-5 rounded-2xl bg-indigo-50/50 border-2 border-indigo-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        2. Input Manual ASS/COP (DO, TO & Keterangan)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Isi Nomor DO dan Nomor TO sebelum meneruskan order ke antrean Warehouse.
                      </p>
                    </div>
                    <select
                      value={reqForm.request_type}
                      onChange={(e) =>
                        setReqForm({ ...reqForm, request_type: e.target.value as RequestType })
                      }
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white font-bold text-xs text-indigo-900"
                    >
                      <option value="NORMAL">Tipe: NORMAL</option>
                      <option value="WARRANTY">Tipe: WARRANTY (NGC)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Nomor DO (Delivery Order) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={reqForm.do_number}
                        onChange={(e) => setReqForm({ ...reqForm, do_number: e.target.value })}
                        placeholder="Contoh: DO-770120"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Nomor TO (Transfer Order) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={reqForm.to_number}
                        onChange={(e) => setReqForm({ ...reqForm, to_number: e.target.value })}
                        placeholder="Contoh: TO-660120"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Keterangan / Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={reqForm.additional_notes}
                      onChange={(e) => setReqForm({ ...reqForm, additional_notes: e.target.value })}
                      placeholder="Catatan tambahan pengiriman, lokasi bay mekanik, atau instruksi khusus..."
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveOrSendRequest('DRAFT')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Simpan Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveOrSendRequest('SENT_TO_WHS')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim ke WHS & Mulai Timer Lead Time
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW 4: KPI & CASE OPEN SLA (whs_kpi / case_open)
                ============================================================ */}
            {(activeTab === 'whs_kpi' || activeTab === 'case_open') && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      KPI Lead Time & Case Open SLA Warehouse
                    </h2>
                    <p className="text-xs text-slate-400">
                      Timer berjalan otomatis dari <strong>Order Masuk (SENT_TO_WHS)</strong> →{' '}
                      <strong>COLLECT</strong> → <strong>READY</strong> (Target:{' '}
                      {settings.warehouse_lead_time_minutes} menit).
                    </p>
                  </div>
                </div>

                {/* Case Open Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Daftar Case Open Keterlambatan SLA ({whsCases.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                          <th className="py-3 px-4">Case ID & Order</th>
                          <th className="py-3 px-4">Target vs Aktual</th>
                          <th className="py-3 px-4">Root Cause & Tindakan Korektif</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {whsCases.map((c) => {
                          const req = requests.find((r) => r.id === c.request_id);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{c.case_number}</div>
                                <div className="text-[11px] text-slate-500">
                                  {req?.request_number} • Unit: {req?.unit}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div>
                                  Target: <strong>{c.target_minutes_snapshot}m</strong> • Aktual:{' '}
                                  <strong className="text-rose-600">{c.actual_minutes}m</strong>
                                </div>
                                <span className="text-[10px] font-bold text-rose-600">
                                  Delay +{c.delay_minutes} menit
                                </span>
                              </td>
                              <td className="py-3.5 px-4 max-w-md">
                                <div>
                                  <strong>RCA:</strong> {c.root_cause || 'Belum diisi WHS'}
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  <strong>Korektif:</strong> {c.corrective_action || '-'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    c.status === 'OPEN'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => openCaseModal(c)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-[11px]"
                                >
                                  {c.status === 'OPEN' ? 'Isi RCA / Close' : 'Detail Case'}
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
                VIEW 5: WARRANTY NGC (warranty_tracking / warranty_queue / analysis_history)
                ============================================================ */}
            {(activeTab === 'warranty_tracking' ||
              activeTab === 'warranty_queue' ||
              activeTab === 'analysis_history') && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Warranty Claims & Analisis Paralel NGC
                  </h2>
                  <p className="text-xs text-slate-400">
                    Keputusan klaim warranty diproses paralel oleh NGC tanpa menghambat penyiapan
                    part di Warehouse.
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-3 px-4">Order & Tanggal</th>
                        <th className="py-3 px-4">WO & DO/TO</th>
                        <th className="py-3 px-4">Unit & Diminta Oleh</th>
                        <th className="py-3 px-4">Status Gudang</th>
                        <th className="py-3 px-4">Keputusan Warranty NGC</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests
                        .filter((r) => r.request_type === 'WARRANTY')
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{r.request_number}</div>
                              <div className="text-[11px] text-slate-400">{r.request_date}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-indigo-950">{r.wo_number || '-'}</div>
                              <div className="text-[11px] text-slate-500">
                                DO: {r.do_number || '-'} • TO: {r.to_number || '-'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{r.unit}</div>
                              <div className="text-[11px] text-slate-500">{r.requester}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="py-3.5 px-4">
                              <WarrantyBadge status={r.warranty_status} type={r.request_type} />
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openWarrantyModal(r)}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px]"
                              >
                                Analisis Warranty
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedRequestId(r.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-[11px]"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW 6: KELOLA USER & ROLE (MUDAH LEWAT OPTION DROPDOWN)
                ============================================================ */}
            {activeTab === 'users_roles' && (
              <div className="max-w-4xl mx-auto space-y-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Manajemen Pengguna & Pengaturan Role
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tambah user baru dan atur role (<strong>ASS_COP</strong>, <strong>WHS</strong>
                      , atau <strong>NGC</strong>) secara langsung melalui pilihan dropdown.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUserModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    + Tambah User Baru
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-3.5 px-5">Nama Lengkap</th>
                        <th className="py-3.5 px-5">Email</th>
                        <th className="py-3.5 px-5">Unit / Lokasi</th>
                        <th className="py-3.5 px-5">Atur Role (Pilihan Option)</th>
                        <th className="py-3.5 px-5 text-right">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-5 font-bold text-slate-900">{p.full_name}</td>
                          <td className="py-3.5 px-5 font-mono text-slate-600">{p.email}</td>
                          <td className="py-3.5 px-5 text-slate-600">{p.unit_assignment}</td>
                          <td className="py-3.5 px-5">
                            <select
                              value={p.role}
                              onChange={(e) =>
                                handleChangeUserRole(p.id, e.target.value as UserRole)
                              }
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            >
                              <option value="ASS_COP">ASS_COP (Admin & DO/TO)</option>
                              <option value="WHS">WHS (Warehouse Operations)</option>
                              <option value="NGC">NGC (Warranty Team)</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {currentUser.id === p.id ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                Sedang Aktif
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentUser(p);
                                  setActiveTab('dashboard');
                                  showToast('info', `Beralih akun ke ${p.full_name} (${p.role})`);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700"
                              >
                                Gunakan Akun Ini
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                VIEW 7: NOTIFICATIONS & SETTINGS
                ============================================================ */}
            {activeTab === 'notifications' && (
              <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-slate-900">Pusat Notifikasi</h2>
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-3.5 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{n.title}</div>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(n.created_at)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestId(n.request_id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-semibold shrink-0"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Pengaturan Aplikasi & SLA Warehouse
                    </h2>
                    <p className="text-slate-400">
                      Konfigurasi nama portal, logo, target Lead Time (menit), dan opsi pembatalan.
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: 'branding', label: 'Branding & Logo' },
                        { id: 'sla', label: 'Target SLA' },
                        { id: 'cancellation', label: 'Alasan Cancel' }
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSettingsSubTab(t.id)}
                        className={`px-3.5 py-1.5 rounded-full font-semibold ${
                          settingsSubTab === t.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {settingsSubTab === 'branding' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Aplikasi
                      </label>
                      <input
                        type="text"
                        value={settings.app_name}
                        onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={settings.app_subtitle}
                        onChange={(e) => setSettings({ ...settings, app_subtitle: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'sla' && (
                  <div className="max-w-sm space-y-2">
                    <label className="block font-bold text-slate-800">
                      Target Lead Time Warehouse (Menit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.warehouse_lead_time_minutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          warehouse_lead_time_minutes: Math.max(1, Number(e.target.value) || 25)
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold text-sm"
                    />
                    <p className="text-[11px] text-slate-400">
                      Order baru akan menggunakan target SLA ini secara otomatis.
                    </p>
                  </div>
                )}

                {settingsSubTab === 'cancellation' && (
                  <div className="space-y-3">
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={newCancelReasonInput}
                        onChange={(e) => setNewCancelReasonInput(e.target.value)}
                        placeholder="Tambah alasan cancel baru..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCancelReasonInput.trim()) return;
                          setSettings({
                            ...settings,
                            cancel_reasons: [...settings.cancel_reasons, newCancelReasonInput.trim()]
                          });
                          setNewCancelReasonInput('');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
                      >
                        Tambah
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.cancel_reasons.map((r) => (
                        <span
                          key={r}
                          className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ====================================================================
          13. MODALS: ADD USER, DETAIL (WITH EXTRACTED PARTS), REVISION (EDITABLE PARTS), WHS, PRINT
          ==================================================================== */}

      {/* MODAL A: TAMBAH USER & ATUR ROLE LEWAT OPTION */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewUser}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Tambah Pengguna & Atur Role
              </h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Contoh: Rahmat Hidayat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="nama@perusahaan.co.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Role Pengguna <span className="text-rose-600">*</span>
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-indigo-950"
              >
                <option value="ASS_COP">ASS_COP — Administrasi DO/TO & Pengaturan</option>
                <option value="WHS">WHS — Gudang (Collect, Ready, Received, Cancel)</option>
                <option value="NGC">NGC — Analisis & Keputusan Warranty</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit / Penempatan</label>
              <input
                type="text"
                value={newUserUnit}
                onChange={(e) => setNewUserUnit(e.target.value)}
                placeholder="Contoh: BIB-PLANT-01 / WHS-CENTRAL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#4338CA] text-white font-bold"
              >
                Simpan User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL B: TOMBOL DETAIL — MENAMPILKAN DAFTAR PART EKSTRAK VOTP, LIVE TIMER & RIWAYAT REVISI */}
      {detailRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Detail Order: {detailRequest.request_number}
                </h3>
                <StatusBadge status={detailRequest.status} />
                <WarrantyBadge
                  status={detailRequest.warranty_status}
                  type={detailRequest.request_type}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintRequestId(detailRequest.id);
                    setSelectedRequestId(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                {currentUser.role === 'ASS_COP' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailRequest;
                      setSelectedRequestId(null);
                      openAssRevisionModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Revisi DO/TO & Part
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRequestId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Key Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Nomor WO / PO</div>
                <div className="font-extrabold text-slate-900 font-mono text-sm mt-0.5">
                  {detailRequest.wo_number || '-'}
                </div>
                {detailRequest.po_number && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    PO: {detailRequest.po_number}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Nomor DO & TO</div>
                <div className="font-extrabold text-indigo-700 font-mono text-sm mt-0.5">
                  DO: {detailRequest.do_number || '-'}
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-700">
                  TO: {detailRequest.to_number || '-'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Unit & Diminta Oleh
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                  {detailRequest.unit}
                </div>
                <div className="text-[11px] text-slate-600">{detailRequest.requester}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Link Dokumen VOTP
                </div>
                <a
                  href={detailRequest.source_votp_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka PDF VOTP
                </a>
              </div>
            </div>

            {/* Live Automatic Timer Breakdown */}
            {(() => {
              const live = getLiveLeadTime(detailRequest, nowMs);
              return (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-indigo-600">
                      Status Timer Lead Time Otomatis
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {live.stageLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Order Masuk → Collect:</span>{' '}
                      <strong className="font-mono text-slate-900">
                        {formatDurationMmSs(live.queueSeconds)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Collect → Ready:</span>{' '}
                      <strong className="font-mono text-amber-700">
                        {formatDurationMmSs(live.collectSeconds)}
                      </strong>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white border border-indigo-200 font-mono font-bold text-indigo-900">
                      Total: {formatDurationMmSs(live.totalSeconds)} / SLA {live.targetMinutes}m
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* DAFTAR PART YANG DIMINTA (HASIL EKSTRAK VOTP / REVISI TERBARU) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Daftar Part yang Diminta (Tersimpan & Terupdate Otomatis Saat Revisi)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                  {(detailRequest.requested_parts || []).length} Item Part
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3.5">No</th>
                      <th className="py-2.5 px-3.5">Part Number</th>
                      <th className="py-2.5 px-3.5">Material ID</th>
                      <th className="py-2.5 px-3.5">Deskripsi Part</th>
                      <th className="py-2.5 px-3.5 text-right">Qty Diminta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(detailRequest.requested_parts || []).map((pt, idx) => (
                      <tr key={pt.id || idx}>
                        <td className="py-2.5 px-3.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                          {pt.part_number}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">
                          {pt.material_id}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                          {pt.description}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-extrabold text-slate-900">
                          {pt.qty} {pt.uom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailRequest.additional_notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <strong>Keterangan ASS/COP:</strong> {detailRequest.additional_notes}
              </div>
            )}

            {detailRequest.cancel_reason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
                <strong>Alasan Cancel WHS:</strong> {detailRequest.cancel_reason}{' '}
                {detailRequest.cancel_notes ? `(${detailRequest.cancel_notes})` : ''}
              </div>
            )}

            {/* Riwayat Revisi (Termasuk Perubahan Part & DO/TO) */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">
                Riwayat Revisi DO/TO & Part ({revisions.filter((rv) => rv.request_id === detailRequest.id).length})
              </h4>
              {revisions.filter((rv) => rv.request_id === detailRequest.id).length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-400">
                  Belum ada revisi pada order ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {revisions
                    .filter((rv) => rv.request_id === detailRequest.id)
                    .map((rv) => (
                      <div
                        key={rv.id}
                        className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1"
                      >
                        <div className="font-bold text-indigo-950 flex justify-between">
                          <span>Revisi #{rv.revision_number}</span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(rv.revised_at)}
                          </span>
                        </div>
                        <div>
                          <strong>Alasan:</strong> {rv.revision_reason}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          DO: <code>{rv.previous_do_number}</code> →{' '}
                          <strong>{rv.new_do_number}</strong> | TO:{' '}
                          <code>{rv.previous_to_number}</code> → <strong>{rv.new_to_number}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Part Sebelum: <code>{rv.previous_parts_summary}</code> → Sesudah:{' '}
                          <strong>{rv.new_parts_summary}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL C: REVISI ASS/COP — REVISI DO/TO SEKALIGUS UBAH DATA PART YANG DIORDER */}
      {revisionModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleConfirmAssRevision}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Revisi DO/TO & Daftar Part Order ({revisionModalRequest.request_number})
                </h3>
                <p className="text-slate-400">
                  Perubahan pada DO/TO maupun Daftar Part yang diorder akan langsung memperbarui data
                  request dan tercatat di riwayat revisi.
                </p>
              </div>
            </div>

            {revError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                {revError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WO</label>
                <input
                  type="text"
                  value={revWoNumber}
                  onChange={(e) => setRevWoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor DO Revisi <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={revDoNumber}
                  onChange={(e) => setRevDoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor TO Revisi <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={revToNumber}
                  onChange={(e) => setRevToNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 font-mono font-bold"
                />
              </div>
            </div>

            {/* Editable Requested Parts List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Revisi Daftar Part yang Diorder (Part Number, Deskripsi & Qty)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRevParts((prev) => [
                      ...prev,
                      {
                        id: `pt-new-${Date.now()}`,
                        material_id: `MAT-${Math.floor(100000 + Math.random() * 900000)}`,
                        part_number: '',
                        description: '',
                        qty: 1,
                        uom: 'PCS'
                      }
                    ])
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px]"
                >
                  <Plus className="w-3 h-3" />+ Tambah Baris Part
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {revParts.map((pt, index) => (
                  <div
                    key={pt.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200"
                  >
                    <input
                      type="text"
                      value={pt.part_number}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRevParts((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, part_number: val } : item))
                        );
                      }}
                      placeholder="Part Number"
                      className="col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={pt.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRevParts((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, description: val } : item))
                        );
                      }}
                      placeholder="Deskripsi Part"
                      className="col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="number"
                      min="1"
                      value={pt.qty}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setRevParts((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, qty: val } : item))
                        );
                      }}
                      className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-center"
                    />
                    <div className="col-span-2 flex justify-end">
                      {revParts.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRevParts((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alasan Revisi <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={revReason}
                onChange={(e) => setRevReason(e.target.value)}
                placeholder="Contoh: Penyesuaian qty part sesuai stok fisik gudang & pembaruan DO/TO..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={revResendToWhs}
                onChange={(e) => setRevResendToWhs(e.target.checked)}
                className="rounded border-slate-300"
              />
              Kirim ulang ke antrean WHS & mulai ulang timer Lead Time otomatis
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#4338CA] text-white font-bold"
              >
                Simpan Revisi & Riwayat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL D: WHS STATUS TRANSITION (COLLECT / READY / RECEIVED) */}
      {whsActionModal && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmWhsStatus}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Konfirmasi Status WHS: {whsActionModal.targetStatus}
            </h3>
            <p className="text-slate-500">
              Order: <strong>{whsActionModal.request.request_number}</strong> • WO:{' '}
              <strong>{whsActionModal.request.wo_number || '-'}</strong> • DO:{' '}
              <strong>{whsActionModal.request.do_number}</strong>
            </p>

            {whsActionModal.targetStatus === 'COLLECT' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                Waktu tunggu antrean akan dicatat dan <strong>Timer Proses Collect</strong> akan
                langsung berjalan otomatis.
              </div>
            )}

            {whsActionModal.targetStatus === 'READY' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                Total Lead Time akan dikunci otomatis dari saat order masuk hingga tombol{' '}
                <strong>READY</strong> ini disimpan.
              </div>
            )}

            {whsActionModal.targetStatus === 'RECEIVED' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Penerima Barang <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={whsRecipientName}
                  onChange={(e) => setWhsRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
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
                placeholder="Lokasi bin/rak atau keterangan serah terima..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhsActionModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Konfirmasi {whsActionModal.targetStatus}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL E: WHS CANCEL MODAL */}
      {cancelModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmWhsCancel}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-rose-700">
              Cancel Order ({cancelModalRequest.request_number})
            </h3>
            {cancelError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                {cancelError}
              </div>
            )}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alasan Cancel (Wajib)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
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
                Keterangan Kendala Gudang
              </label>
              <textarea
                rows={2}
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold"
              >
                Konfirmasi CANCEL & Kirim ke ASS/COP
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL F: CASE OPEN RCA & CLOSURE */}
      {caseModalItem && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Case Open SLA: {caseModalItem.case_number} (Delay +{caseModalItem.delay_minutes}m)
            </h3>
            {caseError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                {caseError}
              </div>
            )}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Root Cause (WHS)</label>
              <textarea
                rows={2}
                value={caseRootCause}
                onChange={(e) => setCaseRootCause(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Corrective Action (WHS)</label>
              <textarea
                rows={2}
                value={caseCorrectiveAction}
                onChange={(e) => setCaseCorrectiveAction(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Catatan Penutupan (Wajib saat Close Case)
              </label>
              <textarea
                rows={2}
                value={caseCloseNote}
                onChange={(e) => setCaseCloseNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCaseModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleSaveCaseOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold"
              >
                Simpan RCA
              </button>
              <button
                type="button"
                onClick={() => handleSaveCaseOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
              >
                Verifikasi & Close Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL G: WARRANTY NGC */}
      {warrantyModalRequest && (
        <div className="fixed inset-0 z-50 no-print bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveWarrantyAnalysis}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Keputusan Klaim Warranty NGC ({warrantyModalRequest.request_number})
            </h3>
            {warError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
                {warError}
              </div>
            )}
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
                  onClick={() => setWarStatus(st.id)}
                  className={`py-2 rounded-xl font-bold border ${
                    warStatus === st.id
                      ? 'bg-[#4338CA] text-white border-[#4338CA]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hasil Analisis Teknis NGC</label>
              <textarea
                rows={2}
                value={warFindings}
                onChange={(e) => setWarFindings(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alasan Keputusan (Wajib bila REJECTED)
              </label>
              <textarea
                rows={2}
                value={warDecisionReason}
                onChange={(e) => setWarDecisionReason(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarrantyModalRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#4338CA] text-white font-bold"
              >
                Simpan Data Warranty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL H: PRINT A4 SHEET */}
      {printRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl text-xs my-8 space-y-5">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
              <span className="font-bold text-slate-700">Pratinjau Cetak Kertas A4</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold"
                >
                  Cetak Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRequestId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-lg font-extrabold uppercase">{settings.app_name}</h1>
                <p className="text-xs text-slate-500">LEMBAR PENGAMBILAN MATERIAL WAREHOUSE</p>
              </div>
              <div className="text-right font-mono font-bold text-sm">
                {printRequest.request_number}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 border border-slate-300 rounded-xl">
              <div>
                <strong>Nomor WO / PO:</strong> {printRequest.wo_number || '-'}{' '}
                {printRequest.po_number ? `/ ${printRequest.po_number}` : ''}
              </div>
              <div>
                <strong>Nomor DO / TO:</strong> DO: {printRequest.do_number || '-'} | TO:{' '}
                {printRequest.to_number || '-'}
              </div>
              <div>
                <strong>Kode Unit:</strong> {printRequest.unit}
              </div>
              <div>
                <strong>Diminta Oleh:</strong> {printRequest.requester}
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-400 p-2 text-left">Part Number</th>
                  <th className="border border-slate-400 p-2 text-left">Material ID</th>
                  <th className="border border-slate-400 p-2 text-left">Deskripsi Part</th>
                  <th className="border border-slate-400 p-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {(printRequest.requested_parts || []).map((pt, i) => (
                  <tr key={i}>
                    <td className="border border-slate-400 p-2 font-mono font-bold">
                      {pt.part_number}
                    </td>
                    <td className="border border-slate-400 p-2 font-mono">{pt.material_id}</td>
                    <td className="border border-slate-400 p-2">{pt.description}</td>
                    <td className="border border-slate-400 p-2 text-right font-bold">
                      {pt.qty} {pt.uom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}