import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Timeline } from './ui/timeline';
import { formatTimelineDate, parseTimelineDate } from '../lib/timeline';

export const TimelineSection: React.FC = () => {
  const { timeline } = useAuth();

  const now = Date.now();

  const data = (timeline || []).map((event) => {
    let statusLabel = 'Upcoming';
    let statusStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    let isLiveDot = false;

    const eventDate = parseTimelineDate(event.date);
    if (eventDate) {
      if (now > eventDate.getTime()) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      } else if (event.active) {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    } else if (!event.active || event.date.toLowerCase().includes('closed')) {
      statusLabel = 'Closed';
      statusStyle = 'bg-red-50 text-red-700 border-red-200';
    } else {
      if (event.active) {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    }

    return {
      title: formatTimelineDate(event.date),
      content: (
        <div>
          <h4 className="text-lg font-black text-[#1B3F8B] mb-2">{event.title}</h4>
          <p className="text-neutral-800 text-xs md:text-sm font-medium mb-4 leading-relaxed">
            {event.description}
          </p>
          <div className="flex gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusStyle}`}>
              {isLiveDot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
              {statusLabel}
            </span>
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
