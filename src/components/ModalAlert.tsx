import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, Info, X, Sparkles } from 'lucide-react';

export const ModalAlert: React.FC = () => {
  const { modalAlert, closeAlert } = useAuth();

  if (!modalAlert || !modalAlert.show) return null;

  // Smart type detection logic
  let alertType = modalAlert.type;
  if (!alertType) {
    const combinedText = `${modalAlert.title} ${modalAlert.message}`.toLowerCase();
    if (
      combinedText.includes('success') ||
      combinedText.includes('submitted') ||
      combinedText.includes('updated') ||
      combinedText.includes('saved') ||
      combinedText.includes('registered') ||
      combinedText.includes('verified')
    ) {
      alertType = 'success';
    } else if (
      combinedText.includes('error') ||
      combinedText.includes('failed') ||
      combinedText.includes('invalid') ||
      combinedText.includes('required') ||
      combinedText.includes('duplicate')
    ) {
      alertType = 'error';
    } else {
      alertType = 'info';
    }
  }

  const isSuccess = alertType === 'success';
  const isError = alertType === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 text-slate-900 transition-all duration-300">
        
        {/* CREATIVE TOP COLOR ACCENT & HERO BADGE */}
        <div className={`h-28 flex items-center justify-center relative overflow-hidden ${
          isSuccess
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
            : isError
            ? 'bg-gradient-to-r from-[#C1272D] via-red-600 to-rose-700'
            : 'bg-gradient-to-r from-[#1B3F8B] via-indigo-700 to-blue-900'
        }`}>
          {/* Subtle Background Pattern Elements */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <button
            onClick={closeAlert}
            className="absolute top-4 right-4 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Floating Hero Icon */}
          <div className="h-16 w-16 rounded-3xl flex items-center justify-center shadow-xl border-2 border-white/30 backdrop-blur-md relative z-10 transform hover:scale-105 transition duration-300 bg-white/20 text-white">
            {isSuccess ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-100" />
            ) : isError ? (
              <AlertCircle className="h-9 w-9 text-red-100" />
            ) : (
              <Info className="h-9 w-9 text-blue-100" />
            )}
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-6 sm:p-8 text-center space-y-4">
          <div className="space-y-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isSuccess ? (
                <>
                  <Sparkles className="h-3 w-3 text-emerald-600" /> Action Confirmed
                </>
              ) : isError ? (
                'Attention Required'
              ) : (
                'Notice'
              )}
            </span>

            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              {modalAlert.title}
            </h3>
          </div>

          <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
            isSuccess
              ? 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-950'
              : isError
              ? 'bg-red-50/70 border border-red-200/80 text-red-950'
              : 'bg-blue-50/70 border border-blue-200/80 text-blue-950'
          }`}>
            {modalAlert.message}
          </div>

          <div className="pt-2">
            <button
              onClick={closeAlert}
              className={`w-full py-3.5 px-8 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all duration-200 transform active:scale-95 cursor-pointer ${
                isSuccess
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/20'
                  : isError
                  ? 'bg-gradient-to-r from-[#C1272D] to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/20'
                  : 'bg-gradient-to-r from-[#1B3F8B] to-blue-900 hover:from-blue-900 hover:to-slate-900 shadow-blue-900/20'
              }`}
            >
              {isSuccess ? 'Awesome, Got It!' : isError ? 'Dismiss & Correct' : 'Got It'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
