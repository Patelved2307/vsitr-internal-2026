import { ClubCoordinator, EventSettings, FAQItem, TimelineEvent } from '../types';

export const INITIAL_SETTINGS: EventSettings = {
  registrationDeadline: '2026-08-02T23:59:59.000Z',
  isRegistrationOpen: true,
  whatsappGroupLink: 'https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U',
  announcementBanner: 'Internal SIH 2026 Registrations are now OPEN! Deadline: 02 August 2026, 11:59 PM.',
  problemStatementLink: 'https://www.sih.gov.in/sih2025PS',
  problemStatementStatus: 'Problem statement announcements will be announced once we get update from the official SIH website.',
  pptTemplateLink: '#',
  pptTemplateStatus: 'The template will be released soon. Download it from here.',
  // PPT Submission
  pptSubmissionOpen: false,
  pptSubmissionStatus: 'PPT submission portal will open after the registration deadline. Stay tuned.',
  pptSubmissionDeadline: '',
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
    title: 'Internal Screening & Presentation Round',
    date: '08 August 2026',
    description: 'In-person pitch deck presentation & technical evaluation before faculty panel.',
    active: false,
  },
  {
    id: 't4',
    title: 'Final Selected Teams Announcement',
    date: '12 August 2026',
    description: 'Official nomination of top teams representing VSITR at National SIH 2026.',
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
