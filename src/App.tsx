import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ModalAlert } from './components/ModalAlert';

import { RegistrationRulesView } from './components/RegistrationRulesView';
import { FAQView, SupportView } from './components/InfoViews';
import { RegistrationPage } from './pages/RegistrationPage';
import { TeamLoginPage } from './pages/TeamLoginPage';
import { TeamPortalPage } from './pages/TeamPortalPage';
import { MentorSubmissionPage } from './pages/MentorSubmissionPage';
import { AdminPage } from './pages/AdminPage';
import { PptSubmissionPage } from './pages/PptSubmissionPage';
import { TimelineSection } from './components/TimelineSection';
import { ProblemStatementsPage } from './pages/ProblemStatementsPage';

const MainLayout: React.FC = () => {
  const { activeTab, settings } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FB] text-[#1E1E2A] font-sans selection:bg-[#C1272D] selection:text-white overflow-x-hidden w-full">
      
      {/* Persistent Scrolling Marquee Announcement Bar */}
      {settings.announcementBanner && activeTab !== 'admin' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#C1272D] via-[#1B3F8B] to-[#C1272D] text-white py-2.5 px-4 shadow-md border-b border-red-500/30 flex items-center select-none">
          <div className="shrink-0 bg-white/20 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mr-3 z-10 flex items-center gap-1.5 shadow-2xs border border-white/20">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> LIVE ALERT
          </div>

          <div className="overflow-hidden w-full relative flex items-center">
            <div className="animate-marquee flex items-center gap-12 text-xs font-extrabold tracking-wide">
              <span className="flex items-center gap-2">
                📢 {settings.announcementBanner}
              </span>
              <span className="text-amber-300 font-black flex items-center gap-2">
                ⚡ PPT &amp; Prototype Submission Portal is LIVE! Submit PowerPoint deck (.ppt/.pptx), 2-minute YouTube video pitch link &amp; 20% GitHub prototype code repository before 25 August 2026, 11:59 PM IST!
              </span>
              <span className="flex items-center gap-2">
                📢 {settings.announcementBanner}
              </span>
              <span className="text-amber-300 font-black flex items-center gap-2">
                ⚡ PPT &amp; Prototype Submission Portal is LIVE! Submit PowerPoint deck (.ppt/.pptx), 2-minute YouTube video pitch link &amp; 20% GitHub prototype code repository before 25 August 2026, 11:59 PM IST!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navbar - hidden in admin section */}
      {activeTab !== 'admin' && <Navbar />}

      {/* Dynamic Main View */}
      <main className="flex-grow w-full overflow-x-hidden">
        {activeTab === 'home' && (
          <RegistrationRulesView />
        )}

        {activeTab === 'rules' && (
          <div className="py-6">
            <RegistrationRulesView />
          </div>
        )}

        {activeTab === 'faq' && <FAQView />}

        {activeTab === 'support' && <SupportView />}

        {activeTab === 'register' && <RegistrationPage />}

        {activeTab === 'login' && <TeamLoginPage />}

        {activeTab === 'portal' && <TeamPortalPage />}

        {activeTab === 'mentor' && <MentorSubmissionPage />}

        {activeTab === 'ppt-submit' && <PptSubmissionPage />}

        {activeTab === 'admin' && <AdminPage />}

        {activeTab === 'timeline' && <TimelineSection />}

        {activeTab === 'problem-statements' && <ProblemStatementsPage />}
      </main>

      {/* Footer - hidden in admin section */}
      {activeTab !== 'admin' && <Footer />}

      {/* Custom Alert Modal */}
      <ModalAlert />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
