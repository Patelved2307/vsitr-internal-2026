import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Headset, GraduationCap, User, Mail, MessageSquare } from 'lucide-react';

export const SupportSection: React.FC = () => {
  const { clubCoordinators } = useAuth();

  return (
    <section className="py-8 max-w-5xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] text-white shadow-md">
            <Headset className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Support &amp; Organizing Clubs
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Have queries? Reach out directly to your institute club faculty and student coordinators.
            </p>
          </div>
        </div>

        <a
          href="mailto:sih.vsitr@ksv.ac.in"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#1B3F8B] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition self-start sm:self-auto"
        >
          <Mail className="h-4 w-4" />
          Email Support: sih.vsitr@ksv.ac.in
        </a>
      </div>

      {/* 4-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clubCoordinators.map((club, idx) => (
          <div
            key={idx}
            className="group relative p-0.5 rounded-3xl bg-gradient-to-br from-[#C1272D]/30 via-slate-200 to-[#1B3F8B]/30 hover:from-[#C1272D] hover:to-[#1B3F8B] transition-all duration-300 shadow-md"
          >
            <div className="bg-white rounded-[22px] p-6 h-full flex flex-col justify-between">
              
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-lg font-black bg-gradient-to-r from-[#C1272D] to-[#1B3F8B] bg-clip-text text-transparent">
                    {club.clubName}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    VSITR Coordinator
                  </span>
                </div>

                {/* Faculty Coordinators */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <GraduationCap className="h-4 w-4 text-[#C1272D]" />
                    Faculty Coordinators
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-[#C1272D]/20">
                    {club.facultyCoordinators.map((fac, fIdx) => (
                      <p key={fIdx} className="text-sm font-bold text-slate-800">
                        {fac}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Student Coordinators */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <User className="h-4 w-4 text-[#1B3F8B]" />
                    Student Coordinators
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-[#1B3F8B]/20">
                    {club.studentCoordinators.map((stu, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {stu.name}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {stu.sem}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Contact Hint */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1 text-[#1B3F8B]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Available during college hours
                </span>
                <span className="font-bold text-slate-700">VSITR Campus</span>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
