import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Timeline } from './ui/timeline';

export const TimelineSection: React.FC = () => {
  const { timeline } = useAuth();

  const data = (timeline || []).map((event) => {
    const isClosed = event.date.toLowerCase().includes('closed');
    const isActive = event.active;

    return {
      title: event.date,
      content: (
        <div>
          <h4 className="text-lg font-black text-[#1B3F8B] mb-2">{event.title}</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            {event.description}
          </p>
          <div className="flex gap-2">
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-750 border border-red-200">
                Closed
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            ) : (
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                Upcoming
              </span>
            )}
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Timeline
        data={data}
        title="Internal SIH 2026 Timeline"
        description="Follow the path from registrations to the final presentation round. Keep track of active submission deadlines below."
      />
    </div>
  );
};
