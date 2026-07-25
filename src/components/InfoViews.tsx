import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Users, Mail, Phone } from 'lucide-react';

export const FAQView: React.FC = () => {
  const { faqs } = useAuth();
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3F8B] mb-4">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h1>
        <p className="text-slate-500 mt-2">Find answers to common queries regarding Internal SIH 2026 registration.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={faq.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex gap-3">
              <span className="text-[#C1272D]">Q{i + 1}.</span>
              {faq.question}
            </h3>
            <div className="mt-3 pl-7 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SupportView: React.FC = () => {
  const { clubCoordinators } = useAuth();
  const [expandedClub, setExpandedClub] = React.useState<string | null>(null);

  const toggleClub = (clubName: string) => {
    if (expandedClub === clubName) setExpandedClub(null);
    else setExpandedClub(clubName);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <Users className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Support & Club Coordinators</h1>
        <p className="text-slate-500 mt-2">Contact your respective club coordinators for any technical or registration assistance.</p>
      </div>
      <div className="space-y-4">
        {clubCoordinators.map((club, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleClub(club.clubName)}
              className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {club.clubName.charAt(0)}
                </div>
                <h3 className="text-lg font-black text-slate-900">{club.clubName}</h3>
              </div>
              <span className={`transform transition-transform duration-300 ${expandedClub === club.clubName ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedClub === club.clubName && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Faculty Coordinators */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-bold text-[#C1272D] uppercase tracking-wider mb-3 flex items-center gap-2">
                      Faculty Coordinators
                    </h4>
                    <ul className="space-y-2">
                      {club.facultyCoordinators.map((faculty, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          {faculty}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Student Coordinators */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h4 className="text-xs font-bold text-[#1B3F8B] uppercase tracking-wider mb-3 flex items-center gap-2">
                      Student Coordinators
                    </h4>
                    <ul className="space-y-3">
                      {club.studentCoordinators.map((student, sIdx) => (
                        <li key={sIdx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <span className="font-bold text-slate-800">{student.name}</span>
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg whitespace-nowrap">
                            {student.sem}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
