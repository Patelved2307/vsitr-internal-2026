"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

interface GradientBlobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  radius?: number;
}

export const GradientBlobCard: React.FC<GradientBlobCardProps> = ({
  children,
  radius = 14,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative w-full rounded-[14px] flex flex-col justify-center shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] dark:shadow-[20px_20px_60px_#111,-20px_-20px_60px_#222] overflow-hidden",
        className
      )}
      style={{
        borderRadius: `${radius}px`,
      }}
      {...props}
    >
      {/* Glassy Background - exact matching offset and styling */}
      <div className="absolute top-[5px] left-[5px] right-[5px] bottom-[5px] bg-white/95 dark:bg-black/70 backdrop-blur-[24px] rounded-[10px] outline outline-2 outline-white dark:outline-gray-700 z-10 pointer-events-none" />

      {/* Animated Gradient Blob (same bold colors for light & dark mode) */}
      <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] rounded-full opacity-100 filter blur-[12px] z-0 animate-blob bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-20 w-full h-full p-5 text-slate-800 dark:text-slate-100">
        {children}
      </div>

      {/* Inline keyframes animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% {
              transform: translate(-100%, -100%);
            }
            25% {
              transform: translate(0%, -100%);
            }
            50% {
              transform: translate(0%, 0%);
            }
            75% {
              transform: translate(-100%, 0%);
            }
            100% {
              transform: translate(-100%, -100%);
            }
          }

          .animate-blob {
            animation: blob 5s linear infinite;
          }
        `
      }} />
    </div>
  );
};

export default GradientBlobCard;
