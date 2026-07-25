import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ChevronDown, ChevronUp, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export const RulesSection: React.FC = () => {
  const { rules } = useAuth();
  const [openAccordion, setOpenAccordion] = useState<string | null>('eligibility');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const defaultRulesList = rules.length > 0 ? rules : [
    "Each team must consist of exactly 6 members, including the Team Leader.",
    "Each team must include at least 1 female participant. All-girls teams are welcome and eligible.",
    "All participants must be from the same college (VSITR) — inter-college teams are not permitted.",
    "Members may belong to different years, branches, or disciplines within the same college (IT, CSE, CE).",
    "Each team must use a unique team name that does NOT include the institute's name (e.g. VSITR, Vidush Somany).",
    "Each participant (by enrollment number) may be part of only one team.",
    "A team once registered cannot add/replace members after the registration deadline without admin approval.",
    "Registration is split into two independent phases: (a) Team Registration and (b) Mentor Details Submission. Phase (a) must be completed by deadline; Phase (b) is mandatory for final confirmation.",
    "Only the Team Leader may register the team and will be the sole point of contact for all official communication.",
    "All communication (screening schedules, problem statements, presentation dates, selection updates) will be sent only to the Team Leader's registered college email.",
    "Teams must report on time for screening rounds/presentations as per the schedule communicated via email.",
    "Plagiarism, misrepresentation of information, or providing false enrollment/contact details will lead to disqualification.",
    "Decisions of the organizing committee (Research, Coding, Design, Soft Skills clubs) and faculty coordinators are final and binding.",
    "Any change in team composition or mentor after submission must be communicated to the organizing committee in writing/email — not self-editable post-deadline."
  ];

  const eligibilityRules = defaultRulesList.slice(0, 7);
  const processRules = defaultRulesList.slice(7, 10);
  const conductRules = defaultRulesList.slice(10);

  return (
    <section className="py-8 max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-100 text-[#C1272D]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Rules &amp; Regulations
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Official guidelines for Internal SIH 2026 participation
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Accordion Item 1: Eligibility Criteria */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleAccordion('eligibility')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/80 transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C1272D] text-white font-black text-xs">
                01
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Eligibility &amp; Team Composition Rules
              </h3>
            </div>
            {openAccordion === 'eligibility' ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {openAccordion === 'eligibility' && (
            <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-white">
              {eligibilityRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-[#C1272D] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">Rule {idx + 1}:</span> {rule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accordion Item 2: Registration Process */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleAccordion('process')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/80 transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B3F8B] text-white font-black text-xs">
                02
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Registration &amp; Communication Process
              </h3>
            </div>
            {openAccordion === 'process' ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {openAccordion === 'process' && (
            <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-white">
              {processRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-[#1B3F8B] shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">Rule {idx + 8}:</span> {rule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accordion Item 3: Conduct & Disqualification */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleAccordion('conduct')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/80 transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white font-black text-xs">
                03
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Conduct, Disqualification &amp; Decision Clauses
              </h3>
            </div>
            {openAccordion === 'conduct' ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {openAccordion === 'conduct' && (
            <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-white">
              {conductRules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-slate-900">Rule {idx + 11}:</span> {rule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
