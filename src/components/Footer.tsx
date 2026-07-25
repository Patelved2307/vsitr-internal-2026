import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, isTeamLoggedIn, settings } = useAuth();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-12 pb-8 relative overflow-hidden border-t border-slate-800">
      {/* Top Gradient Border Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">

          {/* Col 1: Brand & Logos */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs inline-flex">
              <img src="/logos/sih-logo.svg" alt="SIH" className="h-8 w-auto" />
              <span className="text-slate-300 text-xs">|</span>
              <img src="/logos/ksv-logo.svg" alt="KSV" className="h-8 w-auto" />
              <span className="text-slate-300 text-xs">|</span>
              <img src="/logos/vsitr-logo.svg" alt="VSITR" className="h-9 w-auto object-contain shrink-0" />
            </div>

            <h3 className="text-lg font-black text-white">
              Internal SIH 2026
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Vidush Somany Institute of Technology &amp; Research (VSITR), Kadi — under Kadi Sarva Vishwavidyalaya (KSV).
            </p>

            <div className="text-[11px] text-slate-400">
              Managed by: <span className="text-slate-200 font-bold">Research, Coding, Design &amp; Soft Skills Clubs</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-blue-400 transition"
                >
                  Home &amp; Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('rules')}
                  className="hover:text-blue-400 transition"
                >
                  Rules &amp; Regulations
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="hover:text-blue-400 transition"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('support')}
                  className="hover:text-blue-400 transition"
                >
                  Support &amp; Club Coordinators
                </button>
              </li>
              <li>
                {isTeamLoggedIn ? (
                  <button
                    onClick={() => setActiveTab('portal')}
                    className="text-blue-400 hover:underline font-bold"
                  >
                    My Team Portal
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('register')}
                    className="text-red-400 hover:underline font-bold"
                  >
                    Register Team
                  </button>
                )}
              </li>
            </ul>
          </div>

          {/* Col 3: Key Deadlines */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Event Timeline
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phase 1 Registration</span>
                <span className="font-bold text-white">02 August 2026, 11:59 PM</span>
              </li>
              <li className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phase 2 Mentor Details</span>
                <span className="font-bold text-red-400">05 August 2026</span>
              </li>
              <li className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Internal Pitching Round</span>
                <span className="font-bold text-blue-400">To be announced soon</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Institute Address
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>VSITR Campus, Near SV Campus, Kadi - 382715, Gujarat</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                <a href="mailto:internalsih2026@googlegroups.com" className="hover:text-blue-400 hover:underline transition">
                  internalsih2026@googlegroups.com
                </a>
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/EfS0SSUc9aX4DJUhfrpD2U"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 text-xs font-bold hover:bg-emerald-600 hover:text-white transition shadow-2xs"
              >
                Join Official WhatsApp Group
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 Internal SIH Hackathon — Vidush Somany Institute of Technology &amp; Research (KSV)</p>
          <button
            onClick={() => setActiveTab('admin')}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-bold transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
            Admin Portal Access
          </button>
        </div>
      </div>
    </footer>
  );
};
