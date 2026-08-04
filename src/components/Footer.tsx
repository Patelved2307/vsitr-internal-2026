import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { FooterBackgroundGradient, TextHoverEffect } from './ui/hover-footer';

export const Footer: React.FC = () => {
  const { settings, timeline, setActiveTab, isTeamLoggedIn } = useAuth();

  const effectiveDeadline = settings?.isExtended && settings?.extendedDeadline ? settings.extendedDeadline : settings?.registrationDeadline;
  const formattedDeadline = React.useMemo(() => {
    if (!effectiveDeadline) return "02 August 2026, 11:59 PM";
    try {
      return new Date(effectiveDeadline).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).replace(' at ', ', ').replace(/\s*[pP][mM]\s*$/, ' PM').replace(/\s*[aA][mM]\s*$/, ' AM');
    } catch {
      return "02 August 2026, 11:59 PM";
    }
  }, [effectiveDeadline]);

  const mentorDeadline = React.useMemo(() => {
    const mentorEvent = timeline?.find((t) => t.id === 't2');
    return mentorEvent ? mentorEvent.date : "05 August 2026, 11:59 PM";
  }, [timeline]);

  return (
    <footer className="w-full bg-slate-900 text-slate-300 pt-12 pb-8 relative overflow-hidden border-t border-slate-800">
      {/* Top Gradient Border Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B] z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">

          {/* Col 1: Brand & Logos */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <img src="/logos/sih-logo.png" alt="SIH" className="h-10 w-10 object-contain" />
              <img src="/logos/ksv-logo.png" alt="KSV" className="h-10 w-10 object-contain" />
              <img src="/logos/vsitr-logo.png" alt="VSITR" className="h-10 w-10 object-contain" />
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
                <span className="font-bold text-white">{formattedDeadline}</span>
              </li>
              <li className="flex flex-col">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phase 2 Mentor Details</span>
                <span className="font-bold text-red-400">{mentorDeadline}</span>
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
                <a href="mailto:sihinternal.vsitr@gmail.com" className="hover:text-blue-400 hover:underline transition">
                  sihinternal.vsitr@gmail.com
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
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-bold transition z-20"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
            Admin Portal Access
          </button>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="flex h-[8rem] sm:h-[14rem] lg:h-[22rem] -mt-8 sm:-mt-16 lg:-mt-24 -mb-8 sm:-mb-16 lg:-mb-24 relative z-10">
        <TextHoverEffect text="VSITR" className="z-20" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
};
