/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = 'light' | 'dark' | 'forest' | 'sunset' | 'industrial';
export type DensityType = 'normal' | 'compact';
export type SaveStatus = 'idle' | 'saving' | 'saved';

export interface DayWiseSummary {
  date: string;
  formattedDate: string;
  linesCount: number;
  totalLines: number;
  totalTargetProd: number;
  targetProd: number;
  totalAchievedProd: number;
  achievedProd: number;
  targetVariance: number;
  variancePcs: number;
  overallEfficiency: number;
  efficiencyPct: number;
  totalPresentMP: number;
  presentMP: number;
  totalAbsentMP: number;
  absentMP: number;
  attendanceRate: number;
  producedMinutes: number;
  availableMinutes: number;
  checklistCompletionPct: number;
  checklistCompliancePct: number;
  totalWip?: number;
  isDebonair?: boolean;
}

export interface DayOverDayVariance {
  hasPreviousData: boolean;
  currentDate: string;
  previousDate: string | null;
  outputDiffPcs: number;
  outputDiffPct: number;
  efficiencyDiffPts: number;
  attendanceDiffPts: number;
}

export interface DashboardLayout {
  showHero: boolean;
  showStats: boolean;
  showQuickReports?: boolean;
  showQuickActions: boolean;
  showAbsents: boolean;
  showBalancingGraph: boolean;
  showIO: boolean;
  showUpcoming: boolean;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'security';
  user: string;
}

export interface PrivacySecuritySettings {
  privacyModeEnabled: boolean;
  blurSensitiveProductionFigures: boolean;
  autoLockMinutes: number; // 0 = disabled, 5, 15, 30
  pinLockEnabled: boolean;
  pinCode?: string;
  isLocked: boolean;
  dataEncryptionNoticeAcknowledged: boolean;
}

export interface ManpowerBreakdown {
  present: number;
  absent: number;
}

export interface LineManpower {
  Operator: ManpowerBreakdown;
  Helper: ManpowerBreakdown;
  'Iron Man': ManpowerBreakdown;
}

export interface BottleneckInfo {
  station: string;
  cycleTime: number; // in seconds
  targetCT: number; // in seconds
  status: 'ok' | 'high' | 'critical';
  action: string;
  notes?: string;
}

export interface Top5Meeting {
  held: 'yes' | 'no';
  attendance: number;
  items: string[];
  notes?: string;
}

export interface TimeStudy {
  done: 'yes' | 'no' | 'partial';
  type: 'time' | 'production' | 'both';
  observedRate: number;
  standardRate: number;
  findings?: string;
}

export interface BuildUpCurve {
  day: '1' | '2' | '3' | '4' | '5' | '6' | 'stable' | string;
  plannedPct: number;
  achievedPct: number;
  operators: number;
  notes?: string;
}

export type StyleNature = 'new' | 'repeat'; // Repeat = within 3 months in same line
export type SMVWeight = 'light' | 'medium' | 'heavy'; // Light: 0-30 min, Medium: 31-60 min, Heavy: >60 min

export interface LearningCurveDayRecord {
  day: number; // 1 to 6 (or up to 40)
  plannedEff: number; // % e.g. 20
  achievedEff: number; // % e.g. 22
  plannedQty: number; // pcs
  achievedQty: number; // pcs
  variancePcs?: number;
  variancePct?: number;
  notes?: string;
}

export interface LineLearningCurve {
  periodDays: number; // default 6 days
  currentDay: number; // 1 to 6
  styleNature: StyleNature;
  smvWeight: SMVWeight;
  history: LearningCurveDayRecord[];
  isRepeatWithin3Months: boolean;
  notes?: string;
}

export interface BalancingLossAnalysis {
  tacctSeconds: number; // ΣT in seconds
  totalOperators: number; // N
  maxCTSeconds: number; // CTmax in seconds
  pitchTimeSeconds?: number;
  balancingLossPct: number; // Balancing Loss %
  balancingStatus: 'High Loss' | 'Overloaded/Verify Data' | 'Critical' | 'Stable';
  potentialPcsPerHour: number; // Potential
  estimatePcsPerHour: number; // Estimate
  minCapacityPcsPerHour: number; // Min Cap
  currentProductionPcsPerHour: number; // Current Prdn
  estimatedLossPct: number; // Estimated Loss %
  remarks?: string;
  // IE Standards from Image 2
  theoreticalBalancePct: number; // Target > 95%
  balancingErrorPct: number; // Target < 5%
  capacityEstimatePct: number; // Target > 10%
  rightManInRightProcess: boolean; // Target 100%
  rightMachineForProcess: boolean; // Target 100%
  needleDowntimeMinutes: number; // Target 18 Min
}

export interface LineIELead {
  name: string;
  level: string;
  period: string;
  weeklyNotes?: string;
  monthlyNotes?: string;
  additionalInfo?: string;
}

export interface LineTeamMember {
  id: string;
  name: string;
  role: string;
  contact?: string;
  shift?: string;
  skillGrade?: 'A+' | 'A' | 'B+' | 'B' | string;
  assignedStation?: string;
  fitScore?: number;
  rationale?: string;
  specialties?: string[];
  efficiencyRating?: number;
}

export interface CandidateTeamMember {
  id: string;
  name: string;
  primaryRole: string;
  skillGrade: 'A+' | 'A' | 'B+' | 'B';
  overallScore: number;
  experienceYears: number;
  efficiencyRatingPct: number;
  qualityPassRatePct: number;
  attendancePct: number;
  specialties: string[];
  machineCompetencies: string[];
  criticalOperations: string[];
  preferredShifts: string[];
  contact: string;
  currentLine?: string;
  status: 'Available' | 'Assigned' | 'Floater Pool';
}

export interface SuggestedTeamAssignment {
  memberId: string;
  name: string;
  role: string;
  skillGrade: string;
  assignedWorkstation: string;
  fitScore: number;
  rationale: string;
  matchedSkills: string[];
  contact: string;
  shift: string;
  efficiencyRating?: number;
}

export interface TeamAssignmentRecommendation {
  lineNo: string;
  style: string;
  recommendationTitle: string;
  predictedEfficiency: number;
  efficiencyLift: string;
  balancingScore: number;
  bottleneckStrategy: string;
  suggestedAssignments: SuggestedTeamAssignment[];
  ieAnalysisNotes: string;
  generatedAt: string;
}

export type LineStatus = 'Active' | 'Maintenance' | 'Stopped';

export interface LineEntry {
  id: number;
  date: string; // YYYY-MM-DD
  lineNo: string;
  floor: string;
  apartment?: string;
  isActive?: boolean;
  status?: LineStatus;
  statusReason?: string;
  floorOrder?: number; // Physical shop-floor position index for IE visual floor layout
  buyer: string;
  style: string;
  smv: number; // Standard Minute Value
  plannedMP: number;
  workingHours: number;
  targetEff: number;
  targetProd: number;
  achievedProd: number;
  efficiency: number;
  remarks: string;
  orderQty: number;
  dailyInput: number;
  dailyOutput: number;
  wip: number;
  balancingGraph: 'day1' | 'day2' | 'day3' | 'day4' | 'complete';
  nextStyle: string;
  nextStyleDate: string;
  mp: LineManpower;
  balanceMethod: string;
  balanceNotes: string;
  top5: Top5Meeting;
  bottleneck: BottleneckInfo;
  timeStudy: TimeStudy;
  buildUp: BuildUpCurve;
  lineIE: LineIELead;
  learningCurve?: LineLearningCurve;
  balancingAnalysis?: BalancingLossAnalysis;
  teamMembers?: LineTeamMember[];
  machineCount?: number;
}

export type ChecklistStatus = 'yes' | 'no' | 'pending';

export interface ChecklistMap {
  [date: string]: ChecklistStatus[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  category: 'line_balancing' | 'time_study' | 'bottleneck_study' | 'tr_sample' | 'kaizen_ci' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  targetDate: string;
  dueTime: string;
  lineNo: string;
  assignedToRole: string;
  assignedToName: string;
  assignedByRole: string;
  assignedByName: string;
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
  isPointOfWork?: boolean;
  leanMethod?: string;
  stationLocation?: string;
  urgencyLevel?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  targetDate: string;
  lineNo: string;
  category: string;
  assignedToRole: string;
  assignedToName: string;
  assignedByRole: string;
  assignedByName: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  alertMinutesBefore: number;
  locationOrFloor: string;
}

export interface LeanMethod {
  id: string;
  name?: string;
  tagline?: string;
  description?: string;
  category: string;
  garmentApplication?: string;
  steps?: string[];
  typicalBenefit?: string;
  title?: string;
  purpose?: string;
  icon?: string;
  index?: string;
  accent?: 'teal' | 'orange' | 'gold' | 'slate';
  walkTip?: string;
  focusMetric?: string;
}

export interface LeanAction {
  id: string;
  methodId: string;
  methodTitle?: string;
  methodName?: string;
  lineNo: string;
  stationOrLocation?: string;
  actionText?: string;
  title?: string;
  issue?: string;
  solution?: string;
  expectedBenefit?: string;
  assignee?: string;
  owner?: string;
  urgency?: 'immediate' | 'shift_end' | 'next_day';
  status: 'pending' | 'in_progress' | 'completed' | 'planned';
  createdAt: string;
  completedAt?: string;
}

export type LeanActionItem = LeanAction;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'todo' | 'alert' | 'line' | 'sync' | 'warning';
  timestamp: string;
  read: boolean;
  lineNo?: string;
  targetRole?: string;
}

export interface RoleTier {
  id: string;
  level: number;
  name: string;
  shortCode: string;
  color: string;
  description: string;
  systemRole: string; // e.g. 'ADMIN', 'HOD', 'MANAGER', 'IE_ASST_MANAGER', 'LINE_IE'
  systemEdit: string; // 'Full', 'Read-Only'
  deletionReset: string; // 'Authorized', 'Restricted'
  checklistSignoff: string; // 'Authorized', 'Submit Only'
  managesTiers: string; // 'T1, T2, T3, T4', 'Self Only', etc.
  canManageLines: boolean;
  canEditLineData: boolean;
  canApproveChecklist: boolean;
  canCreateTodos: boolean;
  canExport: boolean;
}

export interface UserProfile {
  name: string;
  jobTitle: string;
  role: 'admin' | 'hod' | 'assistant_manager' | 'officer' | 'manager' | 'sr_executive' | 'executive';
  tierId: string;
  email: string;
  employeeId?: string;
  assignedUnit?: string;
  shift?: string;
  photoURL?: string;
  googleUid?: string;
}

export interface SyncState {
  status: 'live' | 'syncing' | 'idle' | 'error' | 'connected';
  latencyMs: number;
  lastSyncTime: string;
  cloudEndpoint?: string;
}

export interface AppStore {
  lineEntries: LineEntry[];
  checklists: ChecklistMap;
  todos: TodoItem[];
  schedules: ScheduleItem[];
  leanActions: LeanActionItem[];
  notifications: NotificationItem[];
  profile: UserProfile;
  dashboardLayout: DashboardLayout;
  theme: ThemeType;
  density: DensityType;
  syncState: SyncState;
}

export interface OperationStep {
  id: string;
  opNo: number;
  name: string;
  section: 'preparation' | 'assembly' | 'finishing';
  machineType: string;
  smvSec: number;
  operators: number;
  cycleTimeSec: number;
  pitchStatus: 'ok' | 'bottleneck' | 'underloaded';
  folderOrAttachment?: string;
  operatorGrade?: 'A' | 'B' | 'C';
}

export interface MachineRequirement {
  type: string;
  name: string;
  requiredCount: number;
  installedCount: number;
  calibratedCount: number;
  gaugeSpec?: string;
}

export interface HandoffCheckItem {
  id: string;
  category: 'machine_mechanical' | 'attachments_jigs' | 'quality_sample' | 'manpower_skill' | 'material_wip';
  item: string;
  standard: string;
  status: 'pass' | 'fail' | 'pending';
  responsible: string;
  notes?: string;
}

export interface LineHandoffSignoff {
  role: string;
  title: string;
  signedByName: string;
  status: 'approved' | 'pending' | 'flagged';
  signedAt?: string;
  comments?: string;
}

export interface IESimulatorPreset {
  id: string;
  styleName: string;
  buyer: string;
  garmentCategory: string;
  totalSMV: number; // in minutes
  recommendedOperators: number;
  recommendedHelpers: number;
  recommendedIroners: number;
  operations: OperationStep[];
  machines: MachineRequirement[];
}

export interface ScorecardPillar {
  name: string;
  weightPct: number; // e.g. 40
  scorePct: number; // 0 - 100
  weightedScore: number; // e.g. 34.5
  status: 'excellent' | 'good' | 'warning' | 'critical';
  headline: string;
  details: string;
}

export interface ScorecardResult {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  gradeColor: string;
  pillars: {
    efficiency: ScorecardPillar;
    checklist: ScorecardPillar;
    bottleneck: ScorecardPillar;
  };
  efficiencyPillar: {
    averageAchievedEff: number;
    averageTargetEff: number;
    attainmentRatio: number;
    linesOnTargetCount: number;
    linesCount: number;
    criticalLinesCount: number;
  };
  checklistPillar: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    notDoneTasks: number;
    completionPct: number;
  };
  bottleneckPillar: {
    totalBottlenecks: number;
    resolvedCount: number;
    highRiskCount: number;
    criticalCount: number;
    averageCycleTime: number;
    averageTargetCT: number;
    mitigationAdherencePct: number;
  };
  recommendations: string[];
}
