import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertCircle, CalendarCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/rainbow-borders-button';

export const CountdownTimer: React.FC = () => {
  const { settings, setActiveTab, isTeamLoggedIn } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date(settings.registrationDeadline).getTime();
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference <= 0 || !settings.isRegistrationOpen) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [settings.registrationDeadline, settings.isRegistrationOpen]);

  const formattedDeadline = new Date(settings.registrationDeadline).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <section className="my-8 max-w-4xl mx-auto px-4">
      {/* Card with Gradient Border */}
      <div className="relative p-1 rounded-3xl bg-gradient-to-r from-[#C1272D] via-amber-500 to-[#1B3F8B] shadow-xl">
        <div className="bg-white rounded-[22px] p-6 sm:p-8 text-center text-slate-800">
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-[#C1272D] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-500">
              Registration Countdown
            </h2>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-700 mb-6">
            Deadline: <span className="font-bold text-[#1B3F8B]">{formattedDeadline}</span>
          </p>

          {timeLeft.isExpired ? (
            /* Expired State */
            <div className="inline-flex flex-col items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 max-w-md mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 text-white font-extrabold text-sm shadow-md">
                <AlertCircle className="h-4 w-4" />
                REGISTRATIONS CLOSED
              </div>
              <p className="text-xs font-medium text-red-800">
                The registration deadline for Phase 1 has passed. Logged-in teams can still access their Team Portal and submit mentor details.
              </p>
            </div>
          ) : (
            /* Active Countdown Grid */
            <div>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
                {/* Days */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-2xl sm:text-4xl font-black bg-gradient-to-br from-[#C1272D] to-red-800 bg-clip-text text-transparent">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-1">
                    Days
                  </span>
                </div>

                {/* Hours */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-2xl sm:text-4xl font-black bg-gradient-to-br from-[#1B3F8B] to-blue-900 bg-clip-text text-transparent">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-1">
                    Hours
                  </span>
                </div>

                {/* Minutes */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-2xl sm:text-4xl font-black bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-1">
                    Minutes
                  </span>
                </div>

                {/* Seconds */}
                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-2xl sm:text-4xl font-black bg-gradient-to-br from-purple-600 to-indigo-900 bg-clip-text text-transparent">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mt-1">
                    Seconds
                  </span>
                </div>
              </div>

              {/* Call to Action Button below countdown (Only for logged out visitors) */}
              {!isTeamLoggedIn && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <Button
                    onClick={() => setActiveTab('register')}
                    className="inline-flex items-center gap-2 px-8 py-3.5"
                  >
                    <CalendarCheck2 className="h-5 w-5" />
                    Register Your Team Now
                  </Button>
                  <p className="text-xs text-slate-500 font-medium">
                    Registration closes on 02 August 2026, 11:59 PM
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
