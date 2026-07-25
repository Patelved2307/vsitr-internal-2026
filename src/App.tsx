import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ModalAlert } from './components/ModalAlert';

import { RegistrationRulesView } from './components/RegistrationRulesView';
import { MentorPendingCard } from './components/MentorPendingCard';
import { RegistrationPage } from './pages/RegistrationPage';
import { TeamLoginPage } from './pages/TeamLoginPage';
import { TeamPortalPage } from './pages/TeamPortalPage';
import { MentorSubmissionPage } from './pages/MentorSubmissionPage';
import { AdminPage } from './pages/AdminPage';

const MainLayout: React.FC = () => {
  const { activeTab, settings } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FB] text-[#1E1E2A] font-sans selection:bg-[#C1272D] selection:text-white">
      
      {/* Announcement Bar */}
      {settings.announcementBanner && activeTab !== 'admin' && (
        <div className="bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] text-white py-2 px-4 text-center text-xs font-bold tracking-wide shadow-xs">
          <span>📢 {settings.announcementBanner}</span>
        </div>
      )}

      {/* Navbar - hidden in admin section */}
      {activeTab !== 'admin' && <Navbar />}

      {/* Dynamic Main View */}
      <main className="flex-grow">
        {activeTab === 'home' && (
          <>
            <MentorPendingCard />
            <RegistrationRulesView />
          </>
        )}

        {activeTab === 'rules' && (
          <div className="py-6">
            <RegistrationRulesView />
          </div>
        )}

        {activeTab === 'register' && <RegistrationPage />}

        {activeTab === 'login' && <TeamLoginPage />}

        {activeTab === 'portal' && <TeamPortalPage />}

        {activeTab === 'mentor' && <MentorSubmissionPage />}

        {activeTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <Footer />

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
