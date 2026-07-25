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
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
          <Users className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Support & Club Coordinators</h1>
        <p className="text-slate-500 mt-2">Contact your respective club coordinators for any technical or registration assistance.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubCoordinators.map((coord) => (
          <div key={coord.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-xl font-black text-slate-400 mb-4">
              {coord.name.charAt(0)}
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{coord.name}</h3>
            <p className="text-xs font-bold text-[#1B3F8B] mt-1">{coord.role}</p>
            <p className="text-xs text-slate-500 mt-0.5">{coord.clubName} Club</p>
            <div className="mt-5 space-y-2">
              <a href={`mailto:${coord.email}`} className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-[#C1272D] transition bg-slate-50 py-2 rounded-lg border border-slate-100">
                <Mail className="h-3.5 w-3.5" /> {coord.email}
              </a>
              <a href={`tel:${coord.phone}`} className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-[#C1272D] transition bg-slate-50 py-2 rounded-lg border border-slate-100">
                <Phone className="h-3.5 w-3.5" /> {coord.phone}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
