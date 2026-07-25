import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClubCoordinator, EventSettings, FAQItem, Team, TimelineEvent } from '../types';
import { CLUB_COORDINATORS, INITIAL_FAQS, INITIAL_SETTINGS, INITIAL_TIMELINE_EVENTS } from '../data/initialData';
import { api } from '../services/api';

interface AuthContextType {
  // Team Session
  team: Team | null;
  isTeamLoggedIn: boolean;
  loginTeamSession: (team: Team) => void;
  logoutTeamSession: () => void;
  refreshTeamSession: () => Promise<void>;

  // Admin Session
  isAdminLoggedIn: boolean;
  adminToken: string | null;
  loginAdminSession: (token: string) => void;
  logoutAdminSession: () => void;

  // Portal Data & Settings
  settings: EventSettings;
  timeline: TimelineEvent[];
  faqs: FAQItem[];
  rules: string[];
  clubCoordinators: ClubCoordinator[];
  isLoadingSettings: boolean;
  reloadPortalData: () => Promise<void>;

  // UI Navigation view
  activeTab: 'home' | 'rules' | 'faq' | 'support' | 'register' | 'login' | 'portal' | 'mentor' | 'admin' | 'ppt-submit';
  setActiveTab: (tab: 'home' | 'rules' | 'faq' | 'support' | 'register' | 'login' | 'portal' | 'mentor' | 'admin' | 'ppt-submit') => void;
  
  // Custom Modal Alerts
  modalAlert: { show: boolean; title: string; message: string; type?: 'error' | 'success' | 'info' } | null;
  showAlert: (title: string, message: string, type?: 'error' | 'success' | 'info') => void;
  closeAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [team, setTeam] = useState<Team | null>(() => {
    const saved = localStorage.getItem('sih_2026_team');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('sih_2026_admin_token');
  });

  const [settings, setSettings] = useState<EventSettings>(INITIAL_SETTINGS);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [rules, setRules] = useState<string[]>([]);
  const [clubCoordinators, setClubCoordinators] = useState<ClubCoordinator[]>(CLUB_COORDINATORS);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'home' | 'rules' | 'faq' | 'support' | 'register' | 'login' | 'portal' | 'mentor' | 'admin' | 'ppt-submit'>('home');

  const [modalAlert, setModalAlert] = useState<{ show: boolean; title: string; message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setModalAlert({ show: true, title, message, type });
  };

  const closeAlert = () => {
    setModalAlert(null);
  };

  const reloadPortalData = async () => {
    try {
      setIsLoadingSettings(true);
      const data = await api.getSettings();
      if (data.settings) setSettings(data.settings);
      if (data.timeline) setTimeline(data.timeline);
      if (data.faqs) setFaqs(data.faqs);
      if (data.rules) setRules(data.rules);
      if (data.clubCoordinators) setClubCoordinators(data.clubCoordinators);
    } catch (err) {
      console.error('Error loading settings', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    reloadPortalData();
  }, []);

  const loginTeamSession = (newTeam: Team) => {
    setTeam(newTeam);
    localStorage.setItem('sih_2026_team', JSON.stringify(newTeam));
  };

  const logoutTeamSession = () => {
    setTeam(null);
    localStorage.removeItem('sih_2026_team');
    setActiveTab('home');
  };

  const refreshTeamSession = async () => {
    if (!team?.id) return;
    try {
      const data = await api.verifyTeam(team.id);
      if (data.team) {
        setTeam(data.team);
        localStorage.setItem('sih_2026_team', JSON.stringify(data.team));
      }
    } catch (err) {
      console.error('Failed to refresh team session', err);
    }
  };

  const loginAdminSession = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('sih_2026_admin_token', token);
  };

  const logoutAdminSession = () => {
    setAdminToken(null);
    localStorage.removeItem('sih_2026_admin_token');
    setActiveTab('home');
  };

  return (
    <AuthContext.Provider
      value={{
        team,
        isTeamLoggedIn: !!team,
        loginTeamSession,
        logoutTeamSession,
        refreshTeamSession,
        isAdminLoggedIn: !!adminToken,
        adminToken,
        loginAdminSession,
        logoutAdminSession,
        settings,
        timeline,
        faqs,
        rules,
        clubCoordinators,
        isLoadingSettings,
        reloadPortalData,
        activeTab,
        setActiveTab,
        modalAlert,
        showAlert,
        closeAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
