import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQSection: React.FC = () => {
  const { faqs } = useAuth();

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

      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6">
        <Accordion type="single" defaultValue={faqs[0]?.id} collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem value={faq.id} key={faq.id} className="border-b border-slate-200 last:border-b">
              <AccordionTrigger className="text-left pl-2 sm:pl-4 md:pl-6 overflow-hidden text-slate-400/80 duration-200 hover:text-slate-700 hover:no-underline cursor-pointer -space-y-6 data-[state=open]:space-y-0 data-[state=open]:text-[#1B3F8B] [&>svg]:hidden w-full py-5">
                <div className="flex flex-1 items-start gap-4">
                  <p className="text-xs font-semibold pt-1">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="uppercase text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight select-none">
                    {faq.question}
                  </h3>
                </div>
              </AccordionTrigger>

              <AccordionContent className="text-slate-600 pb-5 pl-2 sm:pl-8 md:pl-10 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
