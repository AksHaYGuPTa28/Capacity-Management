export type Role = 'ADMIN' | 'RESOURCE_MANAGER' | 'TEAM_MANAGER' | 'VIEWER';

export type ResourceStatus = 'AVAILABLE' | 'PARTIAL' | 'FULLY_ALLOCATED' | 'OVER_ALLOCATED' | 'LEAVE';

export type ProjectStatus = 'PLANNING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Skill {
  id: string;
  name: string;
  category?: string | null;
  _count?: { resources: number };
}

export interface ResourceSkill {
  skillId: string;
  level: number;
  skill: Skill;
}

export interface TimeOff {
  id: string;
  type: 'VACATION' | 'PUBLIC_HOLIDAY';
  startDate: string;
  endDate: string;
  label?: string | null;
}

export interface Team {
  id: string;
  name: string;
  department: string;
  managerId?: string | null;
  manager?: { id: string; name: string; email: string } | null;
  memberCount?: number;
  totalCapacity?: number;
  allocatedHours?: number;
  utilization?: number;
  members?: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  photoUrl?: string | null;
  jobTitle: string;
  teamId?: string | null;
  team?: Team | null;
  department: string;
  location: string;
  employmentPct: number;
  weeklyCapacityHours: number;
  status: ResourceStatus;
  skills: ResourceSkill[];
  timeOffs: TimeOff[];
  allocations: Allocation[];
  effectiveCapacity: number;
  allocatedHours: number;
  remainingCapacity: number;
  utilization: number;
  computedStatus: ResourceStatus;
}

export interface Project {
  id: string;
  name: string;
  customer?: string | null;
  priority: ProjectPriority;
  startDate: string;
  endDate?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  requiredCapacity?: number | null;
  projectManagerId?: string | null;
  projectManager?: { id: string; name: string; jobTitle: string } | null;
  isInternal: boolean;
  allocations: Allocation[];
  allocatedHours: number;
  staffedCount: number;
  staffingPct: number | null;
}

export interface Allocation {
  id: string;
  resourceId: string;
  projectId: string;
  hoursPerWeek: number;
  startDate: string;
  endDate?: string | null;
  resource?: { id: string; name: string };
  project?: { id: string; name: string; status: ProjectStatus };
}

export interface Kpis {
  totalEmployees: number;
  availableCapacity: number;
  allocatedCapacity: number;
  utilizationPct: number;
  projectsRunning: number;
  peopleOverallocated: number;
  peopleUnderallocated: number;
}

export interface MatrixRow {
  resource: { id: string; name: string; jobTitle: string; weeklyCapacityHours: number; employmentPct: number };
  effectiveCapacity: number;
  allocatedHours: number;
  remainingCapacity: number;
  utilization: number;
  cells: Record<string, { id: string; hoursPerWeek: number }>;
}

export interface AllocationMatrix {
  projects: { id: string; name: string; status: ProjectStatus }[];
  rows: MatrixRow[];
}

export interface NotificationItem {
  id?: string;
  type: 'OVER_ALLOCATION' | 'VACATION_CONFLICT' | 'PROJECT_ENDING' | 'RESOURCE_AVAILABLE';
  message: string;
  resourceId?: string | null;
  projectId?: string | null;
  read?: boolean;
  createdAt?: string;
}

export interface AiAnswer {
  answer: string;
  candidates: {
    id: string;
    name: string;
    jobTitle: string;
    team: string | null;
    utilization: number;
    remainingCapacity: number;
    status: string;
    skills: { name: string; level: number }[];
  }[];
  [key: string]: unknown;
}
