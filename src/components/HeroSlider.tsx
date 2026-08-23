import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: string;
  url: string;
  alt: string;
}

const SLIDES: Slide[] = [
  {
    id: 's1',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
    alt: 'Students collaborating on hackathon innovation project',
  },
  {
    id: 's2',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    alt: 'Software development team coding together',
  },
  {
    id: 's3',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
    alt: 'Students presenting pitch deck to panel judges',
  },
];

export const HeroSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  return (
    <section
      className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-slate-900 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides Container */}
      <div className="relative w-full h-full">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.alt}
                className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.05]"
              />
            </div>
          );
        })}

        {/* Light & Gradient Overlay for Contrast */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-radial from-transparent via-slate-900/40 to-slate-950/70 pointer-events-none" />
      </div>

      {/* OVERLAID SEPARATE LAYER: Big Hero Title + Tagline (Positioned on top of slider) */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wider uppercase mb-3 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-[#C1272D] animate-ping" />
          Internal Hackathon 2026 • VSITR Kadi
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg max-w-4xl leading-tight">
          INTERNAL{' '}
          <span className="bg-gradient-to-r from-[#FF5252] via-[#FF8A65] to-[#448AFF] bg-clip-text text-transparent">
            SIH 2026
          </span>
        </h1>

        <p className="mt-2 text-base sm:text-xl lg:text-2xl font-bold italic text-slate-100 drop-shadow-md">
          "Innovate. Build. Represent."
        </p>

        <p className="mt-2 text-xs sm:text-sm text-slate-200 max-w-xl font-medium drop-shadow">
          Organized by Research, Coding, Design &amp; Soft Skills Clubs at VSITR (KSV)
        </p>
      </div>

      {/* Left / Right Arrow Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition transform active:scale-90 border border-white/30"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition transform active:scale-90 border border-white/30"
        aria-label="Next Slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-7 bg-gradient-to-r from-[#C1272D] to-[#1B3F8B]'
                : 'w-2.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
