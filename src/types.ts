export type Department = 'IT' | 'CSE' | 'CE';

export type Gender = 'Male' | 'Female' | 'Other';

export type MentorPrefix = 'Dr.' | 'Prof.' | 'Ph.D.' | 'Mr.' | 'Mrs.' | 'Ms.';

export interface TeamMember {
  id: string;
  fullName: string;
  gender: Gender;
  enrollmentNo: string;
  semester: string; // "1" to "8"
  department: Department;
  mobile: string;
  email: string;
  isLeader?: boolean;
}

export interface MentorDetails {
  prefix: MentorPrefix;
  fullName: string;
  contactNumber: string;
  email: string;
  department: Department;
  institute: 'VSITR Kadi' | 'VSITR Gandhinagar' | string;
  officeAddress?: string;
  submittedAt?: string;
}

export type RegistrationStatus = 'pending_mentor' | 'completed';

export interface ProblemStatement {
  id: string;
  title: string;
  category: string; // e.g., 'Software', 'Hardware', 'Both'
  description?: string;
  status: 'open' | 'closed';
  createdAt?: string;
  sdg?: string;
  theme?: string;
}

export interface Team {
  id: string; // e.g. SIH2026-001
  teamName: string;
  leader: TeamMember;
  members: TeamMember[]; // 5 members (total 6 including leader)
  mentor?: MentorDetails;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
  selectedPsId?: string;
  selectedPsTitle?: string;
  psSelectedAt?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  active: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export type RuleCategory = 'official' | 'phases' | 'conduct';

export interface Rule {
  id: string;
  categoryId: RuleCategory;
  text: string;
}


export interface EventSettings {
  registrationDeadline: string; // ISO string e.g., "2026-08-02T23:59:00.000Z"
  isRegistrationOpen: boolean;
  whatsappGroupLink: string;
  announcementBanner?: string;
  problemStatementLink?: string;
  problemStatementStatus?: string;
  pptTemplateLink?: string;
  pptTemplateStatus?: string;
  // PPT Submission
  pptSubmissionOpen?: boolean;
  pptSubmissionStatus?: string;
  pptSubmissionDeadline?: string;
  // Extension & custom closed message
  isExtended?: boolean;
  extendedDeadline?: string;
  customQuote?: string;
  customQuoteAuthor?: string;
}

export interface AdminStats {
  totalTeams: number;
  totalParticipants: number;
  maleParticipants: number;
  femaleParticipants: number;
  departmentStats: Record<Department, number>;
  semesterStats: Record<string, number>;
  pendingMentorCount: number;
  completedMentorCount: number;
  dailyRegistrations: { date: string; count: number }[];
}

export interface ClubCoordinator {
  clubName: string;
  facultyCoordinators: string[];
  studentCoordinators: { name: string; sem: string }[];
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  teamId?: string;
  subject: string;
  body: string;
  type: 'registration_confirmation' | 'deadline_reminder' | 'admin_announcement' | 'ps_selection';
  status: 'sent' | 'simulated' | 'failed';
  sentAt: string;
}

export interface PptSubmission {
  id: string;
  teamId: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  fileUrl: string;
  note?: string;
  submittedAt: string;
}
