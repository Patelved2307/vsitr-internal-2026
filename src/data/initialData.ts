import { ClubCoordinator, EventSettings, FAQItem, TimelineEvent, Rule } from '../types';

export const INITIAL_RULES: Rule[] = [
  { id: 'r1', categoryId: 'official', text: 'Each team must consist of exactly 6 members, including the Team Leader.' },
  { id: 'r2', categoryId: 'official', text: 'Each team must include at least 1 female participant. All-girls teams are welcome and eligible.' },
  { id: 'r3', categoryId: 'official', text: 'All participants must be from the same college (VSITR) — inter-college teams are not permitted.' },
  { id: 'r4', categoryId: 'official', text: 'Members may belong to different years, branches, or disciplines within the same college (IT, CSE, CE).' },
  { id: 'r5', categoryId: 'official', text: 'Each team must use a unique team name that does NOT include the institute\'s name (e.g. VSITR, Vidush Somany).' },
  { id: 'r6', categoryId: 'official', text: 'Each participant (by enrollment number) may be part of only one team.' },
  { id: 'r7', categoryId: 'official', text: 'A team once registered cannot add/replace members after the registration deadline without admin approval.' },
  { id: 'r8', categoryId: 'phases', text: 'Registration is split into two independent phases: (a) Team Registration and (b) Mentor Details Submission. Phase (a) must be completed by deadline; Phase (b) is mandatory for final confirmation.' },
  { id: 'r9', categoryId: 'phases', text: 'Only the Team Leader may register the team and will be the sole point of contact for all official communication.' },
  { id: 'r10', categoryId: 'phases', text: 'All communication (screening schedules, problem statements, presentation dates, selection updates) will be sent only to the Team Leader\'s registered college email.' },
  { id: 'r11', categoryId: 'conduct', text: 'Teams must report on time for screening rounds/presentations as per the schedule communicated via email.' },
  { id: 'r12', categoryId: 'conduct', text: 'Plagiarism, misrepresentation of information, or providing false enrollment/contact details will lead to disqualification.' },
  { id: 'r13', categoryId: 'conduct', text: 'Decisions of the organizing committee (Research, Coding, Design, Soft Skills clubs) and faculty coordinators are final and binding.' },
  { id: 'r14', categoryId: 'conduct', text: 'Any change in team composition or mentor after submission must be communicated to the organizing committee in writing/email — not self-editable post-deadline.' }
];

export const INITIAL_SETTINGS: EventSettings = {
  registrationDeadline: '2026-08-02T18:29:59.000Z',
  isRegistrationOpen: true,
  whatsappGroupLink: 'https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U',
  announcementBanner: 'Internal SIH 2026 PS Selection is LIVE! Deadline: 16 August 2026, 11:59 PM.',
  problemStatementLink: 'https://www.sih.gov.in/sih2025PS',
  problemStatementStatus: 'Problem statement announcements will be announced once we get update from the official SIH website.',
  pptTemplateLink: '#',
  pptTemplateStatus: 'The template will be released soon. Download it from here.',
  // PPT Submission
  pptSubmissionOpen: false,
  pptSubmissionStatus: 'PPT submission portal will open after the registration deadline. Stay tuned.',
  pptSubmissionDeadline: '',
  isExtended: false,
  extendedDeadline: '2026-08-05T18:29:59.000Z',
  customQuote: 'Innovation distinguishes between a leader and a follower.',
  customQuoteAuthor: 'Steve Jobs',
};

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 't1',
    title: 'Phase 1: Team Registration Deadline',
    date: '02 August 2026, 11:59 PM',
    description: 'All teams must complete 6-member team registration with at least 1 female participant.',
    active: true,
  },
  {
    id: 't2',
    title: 'Phase 2: Mentor Details Submission',
    date: '05 August 2026, 11:59 PM',
    description: 'Registered teams submit verified mentor contact details for final confirmation.',
    active: true,
  },
  {
    id: 't3',
    title: 'Problem Statement Selection',
    date: '16 August 2026, 11:59 PM',
    description: 'Select the Problem Statement from team Portal. Once the Problem statement is selected no modification can be done.',
    active: false,
  },
  {
    id: 't4',
    title: 'PPT Submission',
    date: '23 August 2026, 11:59 PM',
    description: 'Submit your team PPT presentation detailing your proposed solution.',
    active: false,
  },
  {
    id: 't5',
    title: 'PPT Presentation Day',
    date: '27 August 2026',
    description: 'In-person pitch deck presentation & technical evaluation before faculty panel.',
    active: false,
  },
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'f1',
    question: 'Who can participate in Internal SIH 2026?',
    answer: 'All enrolled students from Vidush Somany Institute of Technology & Research (VSITR), Kadi across IT, CSE, and CE departments (Semesters 1-8) are eligible to participate.',
  },
  {
    id: 'f2',
    question: 'Is it compulsory to have a female team member?',
    answer: 'Yes! Every team MUST include at least 1 female participant. All-girls teams are also fully welcome and eligible.',
  },
  {
    id: 'f3',
    question: 'Can I register without a mentor initially?',
    answer: 'Yes! Registration is conducted in two phases. In Phase 1, you complete your 6-member Team Registration before the deadline. In Phase 2, you can submit your Mentor Details using your Team ID.',
  },
  {
    id: 'f4',
    question: 'What happens if my team name already exists?',
    answer: 'Team names must be unique across the institute. If your chosen team name is already taken, the registration portal will prompt you to choose another unique name.',
  },
  {
    id: 'f5',
    question: 'Can I edit my team details after submission?',
    answer: 'Post-submission changes to team members or details are not allowed through the portal. Any critical modifications require official approval from the organizing committee.',
  },
  {
    id: 'f6',
    question: 'What if I miss the registration deadline?',
    answer: 'Registrations automatically close on 02 August 2026, 11:59 PM. Late entries will not be entertained under any circumstances.',
  },
  {
    id: 'f7',
    question: 'How will I receive further updates?',
    answer: 'All official updates, screening schedules, and problem statement announcements will be communicated exclusively to the Team Leader via their registered college email and the official WhatsApp group.',
  },
  {
    id: 'f8',
    question: 'Can members be from different departments or semesters?',
    answer: 'Yes! Members can be from different departments (IT, CSE, CE) and different semesters/years, provided all 6 members belong to VSITR.',
  },
  {
    id: 'f9',
    question: 'How do I log back in to see my team status?',
    answer: 'Click "Team Login" in the navbar and enter your Team ID (e.g. SIH2026-001), Team Name, and Team Leader Email ID to access your dedicated Team Portal.',
  },
  {
    id: 'f10',
    question: 'I forgot my Team ID — how do I recover it?',
    answer: 'Check the confirmation email sent to your Team Leader upon registration, or reach out to your club student coordinators with your team leader enrollment number.',
  },
];

export const CLUB_COORDINATORS: ClubCoordinator[] = [
  {
    clubName: 'Research Club',
    facultyCoordinators: ['Dr. Parita Shah', 'Prof. Amit P. Modi'],
    studentCoordinators: [
      { name: 'Sorathiya Jenish', sem: '7th Sem' },
      { name: 'Patel Ved', sem: '5th Sem' },
    ],
  },
  {
    clubName: 'Coding Club',
    facultyCoordinators: ['Prof. Ankit Vaghela', 'Prof. Ridhish Sir'],
    studentCoordinators: [
      { name: 'Patel Devang', sem: '5th Sem' },
      { name: 'Vekariya Jeel', sem: '5th Sem' },
    ],
  },
  {
    clubName: 'Soft Skills Club',
    facultyCoordinators: ['Prof. Nirzari S. Patel', 'Prof. Nehal Shah'],
    studentCoordinators: [
      { name: 'Salina Hirani', sem: '5th Sem' },
      { name: 'Christian Sanyam', sem: '5th Sem' },
    ],
  },
  {
    clubName: 'Design Club',
    facultyCoordinators: ['Prof. Sanjay Makwana'],
    studentCoordinators: [
      { name: 'Patel Dev', sem: 'Kadi' },
      { name: 'Patel Semi', sem: '3rd Sem' },
    ],
  },
];
