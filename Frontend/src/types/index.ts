// User roles
export type UserRole = 'superadmin' | 'admin' | 'student';

// User type
export interface User {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  groupId?: string;
  branchId?: string;
  createdAt: Date;
  group?: Group;
  xp: number;
  level: number;
}

// Branch type
export interface Branch {
  id: string;
  name: string;
  createdAt: Date;
}

// Group type
export interface Group {
  id: string;
  name: string;
  teacherId: string;
  branchId?: string;
  createdAt: Date;
  // Extended fields from API
  teacher?: User;
  branch?: Branch;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _count?: {
    students: number;
    assignments: number;
  };
}

// Dashboard stats - API returns all fields except role specific
export interface DashboardStats {
  totalBranches?: number;
  totalGroups: number;
  totalTeachers?: number;
  totalStudents: number;
  activeAssignments: number;
  completionRate: number;
  recentActivity?: {
    id: string;
    action: string;
    details: string;
    createdAt: string | Date;
  }[];
  statsByType?: {
    quiz: number;
    scratch: number;
    python: number;
  };
  teacherPerformance?: {
    id: string;
    name: string;
    goodPercent: number;
    badPercent: number;
    totalAssignments: number;
  }[];
  studentPerformance?: {
    id: string;
    name: string;
    groupName: string;
    completionRate: number;
  }[];
}

// Assignment Types
export type AssignmentType = 'QUIZ' | 'SCRATCH_BLOCKS' | 'PYTHON_BLOCKS';
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface QuizContent {
  questions: QuizQuestion[];
}

// Block Types
export type BlockCategory = 'events' | 'control' | 'operators' | 'variables' | 'looks' | 'motion';

export interface Block {
  id: string;
  type: string;
  label: string;
  category: BlockCategory; // strict type
  indent?: number;
}

export interface BlockTask {
  id: string;
  title: string;
  description?: string;
  blocks: Block[];
  solution: string[];
  customBlocks?: Block[];
  mode: 'ORDER';
}

export interface BlocksContent {
  mode: 'ORDER';
  blocks: Block[];
  solution: string[];
  customBlocks?: Block[];
  // Multi-task support
  tasks?: BlockTask[];
}


export interface QuizQuestion {
  id: string;
  question: string;
  questionImage?: string;
  options: string[];
  optionImages?: string[];
  correctIndex: number;
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: AssignmentType;
  status: AssignmentStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any; // Flexible content based on type
  createdById: string;
  groups?: { id: string; name: string }[];
  assignedStudents?: { id: string; firstName: string; lastName: string }[];
  groupIds: string[];
  studentIds: string[];
  dueAt?: Date;
  isPublic?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentAssignment {
  id: string;
  studentId: string;
  assignmentId: string;
  status: 'NEW' | 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'PASSED' | 'FAILED' | 'OVERDUE';
  score?: number;
  bestScore?: number;
  attempts?: number;
  isLate?: boolean;
  feedback?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submission?: any;
  startedAt?: Date;
  completedAt?: Date;
  assignment?: Assignment;
  student?: any; // For results view
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers: any;
  score?: number;
  maxScore: number;
  submittedAt: Date;
}
