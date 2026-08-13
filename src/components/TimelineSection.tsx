import React from 'react';
import { Timeline } from './ui/timeline';

export const TimelineSection: React.FC = () => {
  const data = [
    {
      title: "Closed",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-500 mb-2">Team Registration</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Official registration of teams is closed. No new teams can be registered.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-750 border border-red-200">
              Closed
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Closed",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-500 mb-2">Team &amp; Mentor Modifications</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Team changes and modification of faculty mentor details are officially closed.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-750 border border-red-200">
              Closed
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Till 16 Aug, 11:59 PM",
      content: (
        <div>
          <h4 className="text-lg font-black text-[#1B3F8B] mb-2">PS Selection &amp; Locking</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Teams must select and lock their chosen problem statement directly from their Team Portal. The Problem statment Selection Deadline is 16 August, 2026 till 11:59 PM.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Selection Open
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Till 23 Aug, 11:59 PM",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-850 mb-2">PPT Submission</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            All teams must submit their finalized solution presentation (PPT) via the team portal before the deadline.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
              Upcoming
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "27 August 2026",
      content: (
        <div>
          <h4 className="text-lg font-black text-slate-800 mb-2">Internal Round Presentation Day</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            Live pitch presentations and prototype evaluations before the judging panel at <strong>Gandhinagar Campus</strong> to select the top teams.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
              Upcoming
            </span>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-[1440px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Timeline
        data={data}
        title="Internal SIH 2026 Timeline"
        description="Follow the path from registrations to the final presentation round. Keep track of active submission deadlines below."
      />
    </div>
  );
};
