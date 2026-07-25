import React from 'react';
import { Users, UserCheck, School, Layers, MailCheck, AlertCircle } from 'lucide-react';

export const BigTitleSection: React.FC = () => {
  return (
    <section className="py-8 max-w-5xl mx-auto px-4">
      {/* Big Title Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] bg-clip-text text-transparent">
          INTERNAL SIH 2026
        </h2>
        <p className="text-base sm:text-xl font-bold italic text-slate-700 mt-2">
          "Innovate. Build. Represent."
        </p>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-2 leading-relaxed">
          The official internal screening hackathon of Vidush Somany Institute of Technology &amp; Research (VSITR) under Kadi Sarva Vishwavidyalaya (KSV) to select top innovation teams for National Smart India Hackathon 2026.
        </p>
      </div>

      {/* Registration Details Card Grid */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Subtle Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B]" />

        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
          <Layers className="h-5 w-5 text-[#C1272D]" />
          <h3 className="text-lg font-bold text-slate-900">
            Registration Guidelines &amp; Process Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item 1: Team Size */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#C1272D]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Mandatory 6-Member Team
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Each team must consist of exactly 6 participants (1 Team Leader + 5 Team Members). Neither fewer nor more participants are allowed.
              </p>
            </div>
          </div>

          {/* Item 2: Female Member */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                1 Mandatory Female Participant
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Every team must include at least 1 female student. All-female teams are fully eligible and strongly encouraged.
              </p>
            </div>
          </div>

          {/* Item 3: Same College Rule */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1B3F8B]">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Same Institute (VSITR) Requirement
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                All members must belong to VSITR (IT, CSE, or CE departments). Members can be from different semesters and branches within VSITR.
              </p>
            </div>
          </div>

          {/* Item 4: Two-Phase Process */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Two-Phase Registration
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Phase (a): Register Team details before 02 Aug 2026. Phase (b): Submit Mentor Details shortly after for final confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Email Communication Warning Note */}
        <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
          <MailCheck className="h-5 w-5 shrink-0 text-[#1B3F8B] mt-0.5" />
          <div>
            <span className="font-extrabold text-[#1B3F8B]">Important Note:</span>{' '}
            All official timelines, screening round schedules, problem statements, and selection announcements will be communicated{' '}
            <span className="font-bold underline">exclusively to the Team Leader via their registered college email ID</span>.
          </div>
        </div>
      </div>
    </section>
  );
};
