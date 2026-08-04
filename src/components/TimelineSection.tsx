import React from 'react';
import { Timeline } from './ui/timeline';
import { MapPin, Calendar, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TimelineSection: React.FC = () => {
  const { settings, timeline } = useAuth();
  const effectiveDeadline = settings?.isExtended && settings?.extendedDeadline ? settings.extendedDeadline : settings?.registrationDeadline;

  const formattedDeadlineDate = React.useMemo(() => {
    if (!effectiveDeadline) return "02 August 2026";
    try {
      return new Date(effectiveDeadline).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
    } catch {
      return "02 August 2026";
    }
  }, [effectiveDeadline]);

  const formattedDeadlineTime = React.useMemo(() => {
    if (!effectiveDeadline) return "11:59 PM";
    try {
      return new Date(effectiveDeadline).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).toUpperCase();
    } catch {
      return "11:59 PM";
    }
  }, [effectiveDeadline]);

  const mentorDeadlineDate = React.useMemo(() => {
    const mentorEvent = timeline?.find((t) => t.id === 't2');
    return mentorEvent ? mentorEvent.date : "05 August 2026";
  }, [timeline]);
  const data = [
    {
      title: formattedDeadlineDate,
      content: (
        <div>
          <h4 className="text-lg font-black text-[#C1272D] mb-2">Team Registration Closes</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Deadline to submit your team details (1 Leader + 5 Members, including at least 1 female participant) via the registration portal. Form closes strictly at <strong>{formattedDeadlineTime}</strong>.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Active - Registration Live
            </span>
          </div>

        </div>
      ),
    },
    {
      title: mentorDeadlineDate,
      content: (
        <div>
          <h4 className="text-lg font-black text-[#1B3F8B] mb-2">Mentor Registration Deadline</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Registered teams must submit their industry or faculty mentor details through their Team Portals. Form closes strictly at <strong>11:59 PM</strong>.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Active - Mentor Submissions Open
            </span>
          </div>

        </div>
      ),
    },
    {
      title: "SIH Release",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-800 mb-2">Problem Statements Released</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Official Smart India Hackathon 2026 problem statements will be announced. The official link will be made available in your team dashboard.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
              To Be Confirmed (TBC)
            </span>
          </div>

        </div>
      ),
    },
    {
      title: "Idea Phase",
      content: (
        <div>
          <h4 className="text-lg font-black text-[#1B3F8B] mb-2">Solution Finding &amp; PPT Preparation</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Once problem statements are released, teams will have exactly 1 week to research, brainstorm ideas, identify feasible solution models, formulate technical architecture, and begin preparing their presentation pitch decks.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
              To Be Announced
            </span>
          </div>

        </div>
      ),
    },
    {
      title: "PPT Submission",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-800 mb-2">PPT Submission Window</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            The PPT submission round will open in your portal. Teams must prepare and upload their solution presentations using the official SIH template format.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
              To Be Announced Soon
            </span>
          </div>

        </div>
      ),
    },
    {
      title: "Finals",
      content: (
        <div>
          <h4 className="text-lg font-black text-[#C1272D] mb-2">Internal SIH 2026 Presentation Round</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Presentations will be held live at the <strong>VSITR Kadi Campus</strong>. Teams must demonstrate a pitch deck detailing their solution and show <strong>at least 20% working code/prototype</strong> to the jury.
          </p>

          {/* Refined Presentation & Venue Details */}
          <div className="max-w-xl space-y-4 mt-4">
            {/* Venue & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-[#C1272D] shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue</p>
                  <p className="text-xs md:text-sm font-bold text-slate-800">VSITR Kadi Campus</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-[#1B3F8B] shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date &amp; Time</p>
                  <p className="text-xs md:text-sm font-bold text-slate-800">Will be announced soon</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />

            {/* Requirements Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-4 w-4 shrink-0 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Presentation Requirements
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>Prepare slides showing solution model, technical architecture, and impact.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>
                    Must demonstrate <strong className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md font-bold inline-block">at least 20% working code/prototype</strong> live to the judging panel.
                  </span>
                </li>
              </ul>
            </div>
          </div>


        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <Timeline
        data={data}
        title="Internal SIH 2026 Timeline"
        description="Follow the path from registrations to the final presentation round. Keep track of active submission deadlines below."
      />
    </div>
  );
};
