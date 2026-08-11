import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Users, Mail, Phone } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FAQView: React.FC = () => {
  const { faqs } = useAuth();
  return (
    <div className="max-w-[1440px] mx-auto py-10 px-4 animate-in fade-in duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1B3F8B] mb-4">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h1>
        <p className="text-slate-500 mt-2">Find answers to common queries regarding Internal SIH 2026 registration.</p>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <Accordion type="single" defaultValue={faqs[0]?.id} collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem value={faq.id} key={faq.id} className="border-b border-slate-200 last:border-b">
              <AccordionTrigger className="text-left pl-4 md:pl-8 overflow-hidden text-slate-400/80 duration-200 hover:text-slate-700 hover:no-underline cursor-pointer -space-y-6 data-[state=open]:space-y-0 data-[state=open]:text-[#1B3F8B] [&>svg]:hidden w-full py-6">
                <div className="flex flex-1 items-start gap-4">
                  <p className="text-xs font-semibold pt-1">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="uppercase text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-tight select-none">
                    {faq.question}
                  </h3>
                </div>
              </AccordionTrigger>

              <AccordionContent className="text-slate-600 pb-6 pl-4 md:pl-14 text-sm leading-relaxed whitespace-pre-wrap">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export const SupportView: React.FC = () => {
  const { clubCoordinators, settings } = useAuth();
  const [activeIndex, setActiveIndex] = React.useState<number>(0);

  const getClubImageUrl = (clubName: string) => {
    const images: Record<string, string> = {
      'Research Club': 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=800&auto=format&fit=crop',
      'Coding Club': 'https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?q=80&w=800&auto=format&fit=crop',
      'Soft Skills Club': 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=800&auto=format&fit=crop',
      'Design Club': 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=800&auto=format&fit=crop'
    };
    return images[clubName] || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop';
  };

  return (
    <div className="bg-[#F7F8FB] font-sans">
      <section className="container mx-auto px-4 py-12 md:py-20 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Left Side: Header & Text Content */}
          <div className="w-full lg:w-5/12 text-center lg:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-6 mx-auto lg:mx-0 shadow-2xs">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight uppercase">
              Support &amp; Club Coordinators
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Have questions or need technical assistance with your registration? Contact your respective club coordinators. Hover over the cards on the right to reveal coordinator contact details.
            </p>
            {settings.whatsappGroupLink && (
              <div className="mt-8">
                <a
                  href={settings.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] text-white font-extrabold px-8 py-4 rounded-xl shadow-md hover:shadow-lg hover:opacity-95 transition-all duration-300 text-sm tracking-wide uppercase"
                >
                  <Phone className="h-4 w-4" />
                  Join WhatsApp Support Group
                </a>
              </div>
            )}
          </div>

          {/* Right Side: Visual Hover Accordion */}
          <div className="w-full lg:w-7/12">
            <div className="flex flex-row items-stretch justify-center gap-2 sm:gap-4 w-full p-1 sm:p-4 select-none">
              {clubCoordinators.map((club, idx) => {
                const isActive = idx === activeIndex;
                const imageUrl = getClubImageUrl(club.clubName);
                
                return (
                  <div
                    key={idx}
                    className={`
                      relative h-[420px] sm:h-[450px] lg:h-[480px] rounded-3xl overflow-hidden cursor-pointer
                      transition-all duration-500 ease-out border border-white/10 shadow-md min-w-0
                      
                      /* Fluid proportional flex sizing to prevent overflow on any screen */
                      ${isActive ? 'flex-[4] sm:flex-[5] lg:flex-[6]' : 'flex-[1]'}
                    `}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                  >
                    {/* Background Image */}
                    <img
                      src={imageUrl}
                      alt={club.clubName}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).onerror = null; 
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x480/1b3f8b/ffffff?text=' + encodeURIComponent(club.clubName); 
                      }}
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35 transition-opacity duration-300 ${isActive ? 'opacity-90' : 'opacity-70'}`} />

                    {/* Vertical rotated text (when inactive) or Top banner (when active) */}
                    <span
                      className={`
                        absolute text-white font-black tracking-wider whitespace-nowrap uppercase select-none transition-all duration-300 ease-in-out
                        ${
                          isActive
                            ? 'top-4 sm:top-6 left-4 sm:left-6 text-sm sm:text-lg lg:text-xl border-l-3 border-[#C1272D] pl-2 sm:pl-3'
                            : 'bottom-20 left-1/2 -translate-x-1/2 rotate-270 origin-center text-[10px] sm:text-xs md:text-sm lg:text-base opacity-75 hover:opacity-100'
                        }
                      `}
                    >
                      {club.clubName}
                    </span>

                    {/* Coordinator listings (fade in when active) */}
                    {isActive && (
                      <div className="absolute inset-0 p-4 sm:p-6 pt-12 sm:pt-16 lg:pt-20 flex flex-col justify-between text-white animate-in fade-in duration-500 delay-75">
                        <div className="mt-4 space-y-4 lg:space-y-5">
                          {/* Faculty section */}
                          <div className="space-y-1.5">
                            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#C1272D] flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[#C1272D]" />
                              Faculty
                            </h4>
                            <ul className="space-y-1 pl-2 border-l border-white/10">
                              {club.facultyCoordinators.map((faculty, fIdx) => (
                                <li key={fIdx} className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-250 truncate">
                                  {faculty}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Student section */}
                          <div className="space-y-1.5">
                            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-sky-400" />
                              Students
                            </h4>
                            <ul className="space-y-1.5 pl-2 border-l border-white/10">
                              {club.studentCoordinators.map((student, sIdx) => (
                                <li key={sIdx} className="text-[11px] sm:text-xs lg:text-sm font-semibold text-slate-200 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate">{student.name}</span>
                                    <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded-sm text-slate-300 font-bold shrink-0">
                                      {student.sem.replace('th Sem', '')}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Branding Watermark */}
                        <div className="text-[7px] sm:text-[8px] font-black text-white/35 uppercase tracking-widest text-right">
                          VSITR • 2026
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
