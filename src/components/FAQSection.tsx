import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const { faqs } = useAuth();
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id || null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <section className="py-8 max-w-5xl mx-auto px-4">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-xl bg-blue-100 text-[#1B3F8B]">
          <HelpCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Got questions about Internal SIH 2026? Find quick answers below.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => {
          const isOpen = openFaq === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-[#1B3F8B]/30 shadow-md'
                  : 'bg-white/80 hover:bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 font-bold text-slate-900 text-sm sm:text-base"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-[#1B3F8B] shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
