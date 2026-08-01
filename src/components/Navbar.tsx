import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCheck, LayoutDashboard, Menu, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/rainbow-borders-button';

export const Navbar: React.FC = () => {
  const {
    isTeamLoggedIn,
    team,
    logoutTeamSession,
    isAdminLoggedIn,
    logoutAdminSession,
    activeTab,
    setActiveTab,
    settings,
  } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const now = new Date();
  const deadline = new Date(settings.registrationDeadline);
  const isDeadlinePassed = !settings.isRegistrationOpen || now > deadline;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-2.5 border-b border-slate-200'
          : 'bg-white py-3 border-b border-slate-100'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Left: 3 Logos + Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <img
                src="/logos/sih-logo.png"
                alt="SIH Official Logo"
                className="h-7 w-7 sm:h-9 md:h-11 object-contain"
              />
              <img
                src="/logos/ksv-logo.png"
                alt="KSV Logo"
                className="h-7 w-7 sm:h-9 md:h-11 object-contain"
              />
              <img
                src="/logos/vsitr-logo.png"
                alt="VSITR Logo"
                className="h-7 w-7 sm:h-9 md:h-11 object-contain"
              />
            </div>

            <div className="flex flex-col min-w-0 shrink-0">
              <span className="text-sm sm:text-lg md:text-xl font-black tracking-tight whitespace-nowrap bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] bg-clip-text text-transparent">
                Internal SIH 2026
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                VSITR • KSV Kadi
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => setActiveTab('home')}
              className={`relative py-1 text-sm font-semibold transition ${activeTab === 'home'
                  ? 'text-[#1B3F8B]'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Register Team
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`relative py-1 text-sm font-semibold transition ${activeTab === 'rules'
                  ? 'text-[#1B3F8B]'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Rules &amp; Guidelines
              {activeTab === 'rules' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`relative py-1 text-sm font-semibold transition ${activeTab === 'timeline'
                  ? 'text-[#1B3F8B]'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Event Timeline
              {activeTab === 'timeline' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`relative py-1 text-sm font-semibold transition flex items-center gap-1.5 ${activeTab === 'admin'
                  ? 'text-[#1B3F8B]'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <ShieldAlert className="h-4 w-4 text-[#C1272D]" />
              {isAdminLoggedIn ? 'Admin Panel' : 'Admin Login'}
              {activeTab === 'admin' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] rounded-full" />
              )}
            </button>
          </nav>

          {/* Action Buttons Area */}
          <div className="hidden lg:flex items-center gap-3">
            {isTeamLoggedIn ? (
              /* Logged-In State: Exactly 2 buttons -> "Team Portal" & "Logout" */
              <>
                <button
                  onClick={() => setActiveTab('portal')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1B3F8B] to-indigo-700 hover:opacity-95 shadow-md shadow-blue-900/10 transition transform active:scale-95"
                >
                  <UserCheck className="h-4 w-4" />
                  Team Portal
                  <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-md">
                    {team?.id}
                  </span>
                </button>

                <button
                  onClick={logoutTeamSession}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-700 transition"
                  title="Logout Team"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              /* Logged-Out State: "Register Your Team" + "Team Login" */
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 text-sm font-bold text-[#1B3F8B] border-2 border-[#1B3F8B]/20 hover:border-[#1B3F8B] hover:bg-blue-50/50 rounded-xl transition"
                >
                  Team Login
                </button>

                <Button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 text-sm font-bold"
                >
                  Register Your Team
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg font-medium text-sm ${activeTab === 'home' ? 'bg-blue-50 text-[#1B3F8B] font-bold' : 'text-slate-700'
                }`}
            >
              Register Team
            </button>
            <button
              onClick={() => {
                setActiveTab('rules');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg font-medium text-sm ${activeTab === 'rules' ? 'bg-blue-50 text-[#1B3F8B] font-bold' : 'text-slate-700'
                }`}
            >
              Rules &amp; Guidelines
            </button>
            <button
              onClick={() => {
                setActiveTab('timeline');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg font-medium text-sm ${activeTab === 'timeline' ? 'bg-blue-50 text-[#1B3F8B] font-bold' : 'text-slate-700'
                }`}
            >
              Event Timeline
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${activeTab === 'admin' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600'
                }`}
            >
              <ShieldAlert className="h-4 w-4 text-[#C1272D]" />
              {isAdminLoggedIn ? 'Admin Panel' : 'Admin Login'}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isTeamLoggedIn ? (
              <>
                <button
                  onClick={() => {
                    setActiveTab('portal');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#1B3F8B] to-blue-800"
                >
                  Team Portal ({team?.id})
                </button>
                <button
                  onClick={() => {
                    logoutTeamSession();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl font-medium text-red-600 bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 rounded-xl font-bold text-[#1B3F8B] border border-[#1B3F8B]"
                >
                  Team Login
                </button>
                <Button
                  onClick={() => {
                    setActiveTab('home');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2.5 font-bold"
                >
                  Register Your Team
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
