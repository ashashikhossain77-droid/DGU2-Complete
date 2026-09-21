/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RoleTier,
  UserProfile,
  DashboardLayout,
  TodoItem,
  ScheduleItem,
  LeanMethod,
  LeanActionItem,
  NotificationItem,
  ChecklistStatus
} from './types';

export const ROLE_TIERS: RoleTier[] = [
  {
    id: 'tier_0',
    level: 0,
    name: 'System Administrator / Super User',
    shortCode: 'T0',
    color: '#0e7490',
    description: 'Unrestricted access across all operational lines, system parameters, data resets, and user roles.',
    systemRole: 'ADMIN',
    systemEdit: 'Full',
    deletionReset: 'Authorized',
    checklistSignoff: 'Authorized',
    managesTiers: 'T0, T1, T2, T3, T4',
    canManageLines: true,
    canEditLineData: true,
    canApproveChecklist: true,
    canCreateTodos: true,
    canExport: true
  },
  {
    id: 'tier_1',
    level: 1,
    name: 'Head of Department (HOD) - Industrial Engineering',
    shortCode: 'T1',
    color: '#7c3aed',
    description: 'Executive oversight of factory-wide targets, efficiency benchmarks, departmental approvals, and line configurations.',
    systemRole: 'HOD',
    systemEdit: 'Full',
    deletionReset: 'Authorized',
    checklistSignoff: 'Authorized',
    managesTiers: 'T1, T2, T3, T4',
    canManageLines: true,
    canEditLineData: true,
    canApproveChecklist: true,
    canCreateTodos: true,
    canExport: true
  },
  {
    id: 'tier_2',
    level: 2,
    name: 'IE Manager / Production Lead',
    shortCode: 'T2',
    color: '#0284c7',
    description: 'Floor operations management, daily balancing sign-offs, SMV calibrations, and line layout approvals.',
    systemRole: 'MANAGER',
    systemEdit: 'Full',
    deletionReset: 'Restricted',
    checklistSignoff: 'Authorized',
    managesTiers: 'T2, T3, T4',
    canManageLines: true,
    canEditLineData: true,
    canApproveChecklist: true,
    canCreateTodos: true,
    canExport: true
  },
  {
    id: 'tier_3',
    level: 3,
    name: 'Assistant Manager IE / Work Study Lead',
    shortCode: 'T3',
    color: '#059669',
    description: 'Technical study supervisor, bottleneck remediation, line balancing optimization, and 12-task checklist review.',
    systemRole: 'IE_ASST_MANAGER',
    systemEdit: 'Full',
    deletionReset: 'Restricted',
    checklistSignoff: 'Authorized',
    managesTiers: 'T3, T4',
    canManageLines: true,
    canEditLineData: true,
    canApproveChecklist: true,
    canCreateTodos: true,
    canExport: true
  },
  {
    id: 'tier_4',
    level: 4,
    name: 'Line IE Officer / Work Study Executive',
    shortCode: 'T4',
    color: '#ea580c',
    description: 'Frontline operational control, hourly cycle time capture, daily 12-point audits, and operator skill matrix updates.',
    systemRole: 'LINE_IE',
    systemEdit: 'Full',
    deletionReset: 'Restricted',
    checklistSignoff: 'Submit Only',
    managesTiers: 'Self Only',
    canManageLines: false,
    canEditLineData: true,
    canApproveChecklist: false,
    canCreateTodos: true,
    canExport: true
  }
];

export const IE_12_TASKS = [
  {
    id: 1,
    category: 'Target & Ramp-Up',
    title: 'Review Day 1 Ramp-Up Target',
    hint: 'Confirm starting production target, operator line-in plan, and pitch time synchronization.'
  },
  {
    id: 2,
    category: 'Line Balancing',
    title: 'Verify Day 2 Line Balancing Graph',
    hint: 'Inspect work-station pitch diagram, identify initial cycle spikes, and adjust floater operators.'
  },
  {
    id: 3,
    category: 'Efficiency Benchmark',
    title: 'Evaluate Day 3 Peak 70% Attainment',
    hint: 'Check piece flow stability, bundle feeding cadence, and hourly target board accuracy.'
  },
  {
    id: 4,
    category: 'Peak Output',
    title: 'Audit Day 4 Peak 90% Target Adherence',
    hint: 'Verify full line capacity, ensure needle downtime is minimized, and confirm helper allocations.'
  },
  {
    id: 5,
    category: 'Stability Check',
    title: 'Conduct Day 5 & 6 Style Stabilization Check',
    hint: 'Validate steady-state line efficiency, confirm quality pass rate, and document learning curve progress.'
  },
  {
    id: 6,
    category: 'Time & Motion',
    title: 'Execute 5-Cycle Stopwatch Time Study',
    hint: 'Measure bottleneck workstation operations, record rating factors, and establish standard SMV.'
  },
  {
    id: 7,
    category: 'Floor Communication',
    title: 'Facilitate Morning Top 5 Line Meeting',
    hint: 'Engage line supervisor, mechanic, and quality in-charge on daily efficiency targets and issues.'
  },
  {
    id: 8,
    category: 'Machine & Tooling',
    title: 'Inspect Machine Guides, Jigs & Attachments',
    hint: 'Verify folder attachments, pneumatic presser feet, and gauge settings are properly deployed.'
  },
  {
    id: 9,
    category: 'Skill Matrix',
    title: 'Update Operator Multi-Skill Matrix',
    hint: 'Assess cross-trained operators at critical workstations to mitigate absenteeism shocks.'
  },
  {
    id: 10,
    category: 'Gemba Audit',
    title: 'Perform Daily Gemba Walk on Waste & WIP',
    hint: 'Detect excess bundle buildup, ergonomics fatigue, and non-value-added material transit.'
  },
  {
    id: 11,
    category: 'Quality & Method',
    title: 'Verify Technical Room Sample & SMV Alignment',
    hint: 'Compare floor execution against tech pack operation breakdown and sewing sequence.'
  },
  {
    id: 12,
    category: 'Daily Sign-Off',
    title: 'Submit End-of-Day IE Output & Line Handoff',
    hint: 'Reconcile total pieces produced, calculate earned hours, and record closing line remarks.'
  }
];

export const SL_TASKS = [
  {
    id: 1,
    category: 'SL Control',
    title: 'Learning Curve Plan',
    hint: 'Set the style ramp-up plan, daily efficiency milestones, operator loading, and review owners.'
  },
  {
    id: 2,
    category: 'SL Control',
    title: 'Line Balancing Graph (1st Day Output - 2nd Day Completion)',
    hint: 'Compare first-day output against second-day completion and record the balancing actions needed to close the gap.'
  },
  {
    id: 3,
    category: 'SL Control',
    title: 'Learning Curve First 3 Days (Pick Target 70% Production)',
    hint: 'Verify the first three-day learning curve and confirm the 70% production pick target is realistic.'
  },
  {
    id: 4,
    category: 'SL Control',
    title: 'Line Balancing Graph - 4th Day',
    hint: 'Review the fourth-day balance graph, cycle-time spread, and any remaining overloaded operations.'
  },
  {
    id: 5,
    category: 'SL Control',
    title: 'Line Estimate Report (6-7 Day)',
    hint: 'Prepare the six-to-seven-day line estimate using output, efficiency, manpower, and learning-curve evidence.'
  },
  {
    id: 6,
    category: 'SL Control',
    title: 'Line Study & Bottleneck Flow Analysis',
    hint: 'Study the line flow, isolate the bottleneck operation, and document the countermeasure path.'
  },
  {
    id: 7,
    category: 'SL Control',
    title: 'Next Style Input Date File Submit (Before 10 Days)',
    hint: 'Submit the next-style input date file at least ten days before changeover and flag missing inputs.'
  },
  {
    id: 8,
    category: 'SL Control',
    title: 'T.R Sample Make Follow-up Update',
    hint: 'Follow up on the T.R sample make, capture the latest status, and record open technical actions.'
  },
  {
    id: 9,
    category: 'SL Control',
    title: 'Floor Status Update',
    hint: 'Update floor status across active lines, manpower, machines, WIP, quality, and immediate risks.'
  },
  {
    id: 10,
    category: 'SL Control',
    title: 'Individual Operator Performance Tracking',
    hint: 'Track operator performance, attendance, skill progression, and support needs at critical stations.'
  },
  {
    id: 11,
    category: 'SL Control',
    title: 'Kaizen Work / Continuous Improvement',
    hint: 'Log the active Kaizen or continuous-improvement work, owner, expected benefit, and verification date.'
  },
  {
    id: 12,
    category: 'SL Control',
    title: 'Running Line Efficiency % & Production',
    hint: 'Record running line efficiency and production against target for the current shift.'
  },
  {
    id: 13,
    category: 'SL Control',
    title: 'Tomorrow Target Forecast Report',
    hint: 'Forecast tomorrow’s target using current output, learning curve, manpower, style readiness, and constraints.'
  }
] as const;

export const IE_DAILY_TASKS = [...SL_TASKS];
export const CHECKLIST_TASK_COUNT = IE_DAILY_TASKS.length;

export function normalizeChecklistStatuses(statuses?: ChecklistStatus[]): ChecklistStatus[] {
  return Array.from({ length: CHECKLIST_TASK_COUNT }, (_, index) => statuses?.[index] ?? 'pending');
}

export const LEAN_METHODS: LeanMethod[] = [
  {
    id: '5s-audit',
    name: '5S Workplace Audit',
    title: '5S Workplace Audit',
    category: 'Workplace Organization',
    description: 'Sort, Set in order, Shine, Standardize, and Sustain floor workstations.',
    purpose: 'Eliminate cluttered workspaces and reduce tool search time across sewing lines.',
    icon: 'Sparkles',
    index: '01',
    accent: 'teal',
    steps: [
      'Sort out unnecessary tools and excess bundles from machine beds',
      'Set required scissors, tweezers, and jigs in standardized marked holders',
      'Shine machine beds, thread guides, and oil sumps daily',
      'Standardize visual labeling and colored line boundaries',
      'Sustain through weekly supervisor audits and 5S scores'
    ],
    typicalBenefit: '12% reduction in handling motion waste'
  },
  {
    id: '7-wastes',
    name: '7 Wastes (Muda) Analysis',
    title: '7 Wastes (Muda) Analysis',
    category: 'Waste Elimination',
    description: 'Identify overproduction, waiting, transport, inappropriate processing, excess inventory, unnecessary motion, and defects.',
    purpose: 'Systematically pinpoint and remove non-value-added activities from garment assembly.',
    icon: 'Trash2',
    index: '02',
    accent: 'orange',
    steps: [
      'Identify operator waiting time caused by bundle starved stations',
      'Shorten material transport distances between cutting and sewing bins',
      'Eliminate duplicate piece inspections and re-trimming',
      'Streamline operator pickup, positioning, and dispose trajectories'
    ],
    typicalBenefit: '8-15% increase in operator value-added sewing time'
  },
  {
    id: 'kaizen-pdca',
    name: 'Kaizen & PDCA Improvement',
    title: 'Kaizen & PDCA Improvement',
    category: 'Continuous Improvement',
    description: 'Plan, Do, Check, Act cycles for micro-innovations on sewing stations.',
    purpose: 'Empower floor operators and mechanics to execute daily work method improvements.',
    icon: 'RotateCw',
    index: '03',
    accent: 'teal',
    steps: [
      'Plan: Brainstorm workstation improvements with frontline operators',
      'Do: Implement simple low-cost physical jigs or guide modifications',
      'Check: Measure 10 consecutive pieces for cycle time reduction',
      'Act: Standardize proven jigs across all parallel style lines'
    ],
    typicalBenefit: '+4.5% line productivity lift per Kaizen cycle'
  },
  {
    id: 'smed-changeover',
    name: 'SMED Line Changeover',
    title: 'SMED Line Changeover',
    category: 'Quick Changeover',
    description: 'Single Minute Exchange of Dies applied to sewing line style changes.',
    purpose: 'Slash style changeover downtime from 4 hours down to under 45 minutes.',
    icon: 'Timer',
    index: '04',
    accent: 'orange',
    steps: [
      'Pre-load needle gauges and folder brackets before line stoppage',
      'Color-code quick-change thread spool cones for external preparation',
      'Synchronize mechanical technician teams with designated station zones',
      'Conduct immediate golden sample run on first 5 units'
    ],
    typicalBenefit: '65% reduction in style changeover idle time'
  },
  {
    id: 'takt-yamazumi',
    name: 'Takt Time & Yamazumi Board',
    title: 'Takt Time & Yamazumi Board',
    category: 'Line Balancing',
    description: 'Visual operator workload stacking against customer demand takt time.',
    purpose: 'Visually balance workstation cycle times to eliminate line starvation and pile-ups.',
    icon: 'BarChart3',
    index: '05',
    accent: 'teal',
    steps: [
      'Calculate customer takt time = Available Net Working Sec / Target Demand',
      'Plot individual operator cycle times onto the Yamazumi bar chart',
      'Split over-takt operations into sub-elements or parallel work stations',
      'Redistribute helper assistance to achieve uniform pitch line pace'
    ],
    typicalBenefit: 'Achieve >92% theoretical line balance ratio'
  },
  {
    id: 'andon-board',
    name: 'Andon Visual Alert Board',
    title: 'Andon Visual Alert Board',
    category: 'Visual Factory',
    description: 'Real-time visual signal system for line stoppages, quality defects, and parts shortages.',
    purpose: 'Instantly notify mechanics and supervisors when sewing lines experience downtime.',
    icon: 'AlertTriangle',
    index: '06',
    accent: 'orange',
    steps: [
      'Operator flips station alert switch when encountering needle/feed issues',
      'Visual Andon beacon lights up red for quality, amber for maintenance',
      'Mechanic responds within the mandatory 3-minute SLA window',
      'System logs root cause and repairs into daily line downtime ledger'
    ],
    typicalBenefit: 'Drop machine downtime response time by 70%'
  },
  {
    id: 'oee-tpm',
    name: 'OEE & TPM Machine Health',
    title: 'OEE & TPM Machine Health',
    category: 'Total Productive Maintenance',
    description: 'Overall Equipment Effectiveness tracking Availability, Performance, and Quality.',
    purpose: 'Maximize sewing machine operational uptime through preventive maintenance.',
    icon: 'Gauge',
    index: '07',
    accent: 'teal',
    steps: [
      'Ensure 5-minute morning autonomous cleaning and oiling by operators',
      'Track scheduled weekly technician PM (Preventive Maintenance)',
      'Record micro-stops, thread breaks, and speed degradation causes',
      'Calculate OEE = Availability% × Performance% × Quality%'
    ],
    typicalBenefit: 'Maintain machine uptime above 98.5%'
  },
  {
    id: 'a3-problem-solving',
    name: 'A3 Problem Solving',
    title: 'A3 Problem Solving',
    category: 'Structured Root Cause',
    description: 'One-page structured problem solving methodology covering 5-Whys and countermeasures.',
    purpose: 'Resolve recurring sewing defects and major bottlenecks collaboratively.',
    icon: 'FileText',
    index: '08',
    accent: 'slate',
    steps: [
      'Define defect condition with photos and factual frequency count',
      'Map the precise sub-operation where variance originates',
      'Perform 5-Why root cause drill-down with technician and supervisor',
      'Execute corrective countermeasures with assigned owners and deadlines'
    ],
    typicalBenefit: 'Eliminate repeat defect occurrences'
  },
  {
    id: 'kanban-wip',
    name: 'Kanban & WIP Control',
    title: 'Kanban & WIP Control',
    category: 'Flow Management',
    description: 'Visual pull signals controlling Work-In-Progress between sewing bundles.',
    purpose: 'Prevent floor crowding, reduce bundle soiling, and shorten manufacturing lead time.',
    icon: 'Columns3',
    index: '09',
    accent: 'orange',
    steps: [
      'Set maximum 3-bundle buffer limit per sewing station',
      'Implement color-tagged visual Kanban bins at feeding tables',
      'Halt upstream parts feeding if downstream buffer exceeds threshold',
      'Maintain strict FIFO (First-In, First-Out) bundle numbering discipline'
    ],
    typicalBenefit: 'Reduce floor WIP inventory by 40%'
  },
  {
    id: 'gemba-walk',
    name: 'Gemba Walk Inspection',
    title: 'Gemba Walk Inspection',
    category: 'Shop Floor Leadership',
    description: 'Daily systematic shop-floor observational routine by IE leaders.',
    purpose: 'Observe actual process execution, show respect to operators, and ask probing questions.',
    icon: 'Glasses',
    index: '10',
    accent: 'teal',
    steps: [
      'Walk the line counter-flow from finishing packing toward front placket input',
      'Observe operator ergonomics, posture, and manual material reaching distance',
      'Interview operators on tool friction and bundle handling difficulty',
      'Identify immediate floor kaizen opportunities on the spot'
    ],
    typicalBenefit: 'Fast resolution of frontline operational roadblocks'
  },
  {
    id: 'standard-work',
    name: 'Standard Work Combination',
    title: 'Standard Work Combination',
    category: 'Process Standardization',
    description: 'Standard Operating Sheets detailing manual time, machine time, and walking time.',
    purpose: 'Anchor the best-known method across all sewing operators for consistent quality.',
    icon: 'ClipboardCheck',
    index: '11',
    accent: 'slate',
    steps: [
      'Document standard pick, position, sew, and dispose motions',
      'Set target standard cycle time in seconds for the operation',
      'Establish standardized in-process WIP piece count',
      'Display pictorial Standard Operating Sheet (SOP) at each workstation'
    ],
    typicalBenefit: 'Standard deviation in cycle time cut by 50%'
  },
  {
    id: 'poka-yoke',
    name: 'Poka-Yoke (Mistake Proofing)',
    title: 'Poka-Yoke (Mistake Proofing)',
    category: 'Zero Defect Quality',
    description: 'Mechanical jigs, sensors, and stops that prevent stitching errors before they happen.',
    purpose: 'Design fail-safe mechanisms directly onto sewing machines and folders.',
    icon: 'ShieldCheck',
    index: '12',
    accent: 'teal',
    steps: [
      'Analyze defect pareto to identify top recurring assembly mistakes',
      'Install physical guide stops to enforce correct margin allowances',
      'Deploy magnetic sensors to ensure complete seam coverage before cutting',
      'Conduct pilot verification to prove impossibility of backward assembly'
    ],
    typicalBenefit: 'Zero stitching alignment rejections'
  },
  {
    id: 'capacity-calculator',
    name: 'Capacity Calculator',
    title: 'Theoretical Line Capacity Calculator',
    category: 'Production Planning',
    description: 'Calculate theoretical daily capacity, machine hour loading, and takt pitch time from planned SMV.',
    purpose: 'Allows IEs to input total machine hours and planned SMV to determine theoretical daily production capacity and target pacing for any specific line.',
    icon: 'Calculator',
    index: '13',
    accent: 'orange',
    steps: [
      'Select a factory production line or configure custom line parameters',
      'Input total machine hours (or specify active machines × shift hours)',
      'Input planned garment SMV (Standard Minute Value)',
      'Simulate target line efficiency % (100% theoretical vs 85% target)',
      'Determine theoretical daily capacity, hourly rate, and takt pitch pace',
      'Apply computed target directly to line planning or export IE scenario'
    ],
    typicalBenefit: 'Eliminates line underloading and ensures mathematically grounded production commitments'
  }
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Ashik Hossain',
  jobTitle: 'Head of Department (HOD) - Industrial Engineering',
  role: 'hod',
  tierId: 'tier_1',
  email: 'ashikhossainkr@gmail.com',
  employeeId: 'IE-7701',
  assignedUnit: 'Unit 4 - Knit Garments Floor',
  shift: 'General Shift (8:00 AM - 5:00 PM)'
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  showHero: true,
  showStats: true,
  showQuickReports: true,
  showQuickActions: true,
  showAbsents: true,
  showBalancingGraph: true,
  showIO: true,
  showUpcoming: true
};

export const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Line 18 Collar Attach Bottleneck Rebalancing',
    description: 'Split collar attach operation into parallel sub-stations to bring cycle time from 52s down to 38s.',
    category: 'bottleneck_study',
    priority: 'urgent',
    status: 'in_progress',
    targetDate: new Date().toISOString().slice(0, 10),
    dueTime: '11:30 AM',
    lineNo: '18',
    assignedToRole: 'IE Assistant Manager',
    assignedToName: 'Sultan Mahmud',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [
      { id: 'sub-1', title: 'Record 5-cycle motion video of collar attach', completed: true },
      { id: 'sub-2', title: 'Prepare secondary single needle lockstitch station', completed: true },
      { id: 'sub-3', title: 'Reallocate bundle feeding sequence', completed: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-2',
    title: 'Line 21 Style Transition & Machine Gauge Verification',
    description: 'Inspect needle gauge sets, folders, and swing guides for tomorrow morning style transition.',
    category: 'line_balancing',
    priority: 'high',
    status: 'pending',
    targetDate: new Date().toISOString().slice(0, 10),
    dueTime: '03:00 PM',
    lineNo: '21',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'Rakib Hasan',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [
      { id: 'sub-4', title: 'Check folder clearance for 1/4 gauge twin needle', completed: false },
      { id: 'sub-5', title: 'Verify mechanic machine trial sample', completed: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-3',
    title: 'Operator Skill Matrix Quarterly Cross-Training Review',
    description: 'Evaluate Grade-B operators for side-seam and sleeve attachment stations.',
    category: 'kaizen_ci',
    priority: 'medium',
    status: 'pending',
    targetDate: new Date().toISOString().slice(0, 10),
    dueTime: '04:30 PM',
    lineNo: '19',
    assignedToRole: 'IE Officer',
    assignedToName: 'Tanvir Hossain',
    assignedByRole: 'IE Assistant Manager',
    assignedByName: 'Sultan Mahmud',
    subtasks: [
      { id: 'sub-6', title: 'Test 4 operators on high-speed overlock test bed', completed: false }
    ],
    createdAt: new Date().toISOString()
  }
];

const SL_TODO_DATE = new Date().toISOString().slice(0, 10);

export const SL_TASK_TODOS: TodoItem[] = [
  {
    id: 'sl-task-1',
    title: 'Learning Curve Plan',
    description: 'Set the style ramp-up plan, daily efficiency milestones, operator loading, and review owners.',
    category: 'line_balancing',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '09:30 AM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-2',
    title: 'Line Balancing Graph (1st Day Output - 2nd Day Completion)',
    description: 'Compare first-day output against second-day completion and record the balancing actions needed to close the gap.',
    category: 'line_balancing',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '10:00 AM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Manager',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-3',
    title: 'Learning Curve First 3 Days (Pick Target 70% Production)',
    description: 'Verify the first three-day learning curve and confirm the 70% production pick target is realistic.',
    category: 'line_balancing',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '10:30 AM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Manager',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-4',
    title: 'Line Balancing Graph - 4th Day',
    description: 'Review the fourth-day balance graph, cycle-time spread, and remaining overloaded operations.',
    category: 'line_balancing',
    priority: 'medium',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '11:00 AM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-5',
    title: 'Line Estimate Report (6-7 Day)',
    description: 'Prepare the six-to-seven-day line estimate using output, efficiency, manpower, and learning-curve evidence.',
    category: 'general',
    priority: 'medium',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '11:30 AM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Manager',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-6',
    title: 'Line Study & Bottleneck Flow Analysis',
    description: 'Study the line flow, isolate the bottleneck operation, and document the countermeasure path.',
    category: 'bottleneck_study',
    priority: 'urgent',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '12:00 PM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Assistant Manager',
    assignedToName: 'Sultan Mahmud',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-7',
    title: 'Next Style Input Date File Submit (Before 10 Days)',
    description: 'Submit the next-style input date file at least ten days before changeover and flag missing inputs.',
    category: 'line_balancing',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '01:00 PM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-8',
    title: 'T.R Sample Make Follow-up Update',
    description: 'Follow up on the T.R sample make, capture the latest status, and record open technical actions.',
    category: 'tr_sample',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '01:30 PM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-9',
    title: 'Floor Status Update',
    description: 'Update floor status across active lines, manpower, machines, WIP, quality, and immediate risks.',
    category: 'general',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '02:00 PM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-10',
    title: 'Individual Operator Performance Tracking',
    description: 'Track operator performance, attendance, skill progression, and support needs at critical stations.',
    category: 'kaizen_ci',
    priority: 'medium',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '02:30 PM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'IE Assistant Manager',
    assignedByName: 'Sultan Mahmud',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-11',
    title: 'Kaizen Work / Continuous Improvement',
    description: 'Log the active Kaizen or continuous-improvement work, owner, expected benefit, and verification date.',
    category: 'kaizen_ci',
    priority: 'medium',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '03:00 PM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Assistant Manager',
    assignedToName: 'Sultan Mahmud',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-12',
    title: 'Running Line Efficiency % & Production',
    description: 'Record running line efficiency and production against target for the current shift.',
    category: 'general',
    priority: 'urgent',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '04:00 PM',
    lineNo: 'All Lines',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'IE Team',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sl-task-13',
    title: 'Tomorrow Target Forecast Report',
    description: 'Forecast tomorrow’s target using current output, learning curve, manpower, style readiness, and constraints.',
    category: 'general',
    priority: 'high',
    status: 'pending',
    targetDate: SL_TODO_DATE,
    dueTime: '04:30 PM',
    lineNo: 'All Lines',
    assignedToRole: 'IE Manager',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sched-1',
    title: 'Morning Top 5 Operational Review & Efficiency Target Setup',
    description: 'Floor gathering with sewing supervisors, line mechanics, and quality managers to align on hourly targets.',
    startTime: '08:15 AM',
    endTime: '08:35 AM',
    targetDate: new Date().toISOString().slice(0, 10),
    lineNo: 'All Lines',
    category: 'Floor Meeting',
    assignedToRole: 'All Floor IEs',
    assignedToName: 'IE Team',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    status: 'completed',
    alertMinutesBefore: 15,
    locationOrFloor: 'Floor 3 Central Meeting Zone'
  },
  {
    id: 'sched-2',
    title: 'Mid-Day Gemba Walk: Line 18 & Line 20 WIP Audit',
    description: 'Inspect bundle pileups and verify physical WIP compliance against 3-bundle Kanban rule.',
    startTime: '11:45 AM',
    endTime: '12:30 PM',
    targetDate: new Date().toISOString().slice(0, 10),
    lineNo: '18',
    category: 'Gemba Walk',
    assignedToRole: 'IE Assistant Manager',
    assignedToName: 'Sultan Mahmud',
    assignedByRole: 'IE Manager',
    assignedByName: 'Fahim Ahmed',
    status: 'in_progress',
    alertMinutesBefore: 10,
    locationOrFloor: 'Sewing Floor Lines 18-20'
  },
  {
    id: 'sched-3',
    title: 'Style Changeover Pre-Setup Briefing (Line 21)',
    description: 'Technical room trial sign-off and layout execution review for Polo Shirt style changeover.',
    startTime: '03:15 PM',
    endTime: '04:00 PM',
    targetDate: new Date().toISOString().slice(0, 10),
    lineNo: '21',
    category: 'Technical Review',
    assignedToRole: 'Line IE Officer',
    assignedToName: 'Rakib Hasan',
    assignedByRole: 'Head of Department (HOD)',
    assignedByName: 'Ashik Hossain',
    status: 'upcoming',
    alertMinutesBefore: 15,
    locationOrFloor: 'Line 21 Head Table'
  }
];

export const INITIAL_LEAN_ACTIONS: LeanActionItem[] = [
  {
    id: 'lean-act-1',
    methodId: '5s-audit',
    methodName: '5S Workplace Audit',
    lineNo: '18',
    title: 'Install Dedicated Scissor & Thread Holders on Overlock Machines',
    issue: 'Operators spending 3.5 seconds per piece searching for scissors on crowded table beds.',
    solution: '3D printed magnetic holders mounted directly on overlock machine heads.',
    expectedBenefit: 'Shaves 3.5s per cycle; expected +32 pieces per hour line throughput.',
    status: 'completed',
    owner: 'Ashik Hossain',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  },
  {
    id: 'lean-act-2',
    methodId: 'smed-changeover',
    methodName: 'SMED Line Changeover',
    lineNo: '21',
    title: 'Pre-Gauge Setting Kit for Line 21 Style Transition',
    issue: 'Mechanics previously took 3 hours adjusting presser foot height after sewing stopped.',
    solution: 'Pre-calibrated gauge block sets prepared during external run time.',
    expectedBenefit: 'Cut line style changeover downtime from 180 min to 42 min.',
    status: 'in_progress',
    owner: 'Sultan Mahmud',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lean-act-3',
    methodId: 'kanban-wip',
    methodName: 'Kanban & WIP Control',
    lineNo: '20',
    title: '3-Bundle Floor Boundary Tape Marking',
    issue: 'Excess bundle accumulation between stations 12 and 14 causing bundle soilage.',
    solution: 'Bright yellow floor tape designating maximum 3-bundle storage limits.',
    expectedBenefit: 'Eliminates WIP congestion and establishes clear FIFO visual pull.',
    status: 'in_progress',
    owner: 'Rakib Hasan',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Line 18 Efficiency Benchmark Alert',
    message: 'Line 18 has achieved 89.2% efficiency, exceeding the 85.0% shift target.',
    type: 'line',
    timestamp: '10:45 AM',
    read: false,
    lineNo: '18'
  },
  {
    id: 'notif-2',
    title: 'Collar Station Bottleneck Flagged',
    message: 'Workstation 14 cycle time is currently 52s (exceeding target 38s). Action required.',
    type: 'warning',
    timestamp: '11:15 AM',
    read: false,
    lineNo: '18'
  },
  {
    id: 'notif-3',
    title: 'SL Control Check List Pending',
    message: 'Tasks remain for today’s inspection sign-off. Please complete before 05:00 PM.',
    type: 'todo',
    timestamp: '01:00 PM',
    read: false
  }
];
