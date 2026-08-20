import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Timeline } from './ui/timeline';

export const TimelineSection: React.FC = () => {
  const { timeline, settings } = useAuth();

  const now = Date.now();

  const data = (timeline || []).map((event) => {
    let statusLabel = 'Upcoming';
    let statusStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    let isLiveDot = false;

    if (event.id === 't1') {
      const cutoff = new Date('2026-08-02T23:59:00+05:30').getTime();
      if (now > cutoff) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      } else {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    } else if (event.id === 't2') {
      const cutoff = new Date('2026-08-05T23:59:00+05:30').getTime();
      if (now > cutoff) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      } else {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    } else if (event.id === 't3') {
      const cutoff = settings.problemStatementDeadline ? new Date(settings.problemStatementDeadline).getTime() : Number.NaN;
      if (!settings.problemStatementSelectionOpen || !Number.isNaN(cutoff) && now > cutoff) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      } else {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    } else if (event.id === 't4') {
      const cutoff = new Date('2026-08-25T23:59:00+05:30').getTime();
      if (now > cutoff) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      } else {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      }
    } else {
      if (event.active) {
        statusLabel = 'Active';
        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        isLiveDot = true;
      } else if (event.date.toLowerCase().includes('closed')) {
        statusLabel = 'Closed';
        statusStyle = 'bg-red-50 text-red-700 border-red-200';
      }
    }

    return {
      title: event.date,
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
