"use client";
import {
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  title?: string;
  description?: string;
}

export const Timeline = ({ data, title = "Event Timeline", description }: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-[#F7F8FB] font-sans md:px-10"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto pt-16 pb-8 px-4 md:px-8 lg:px-10 text-center md:text-left">
        <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] bg-clip-text text-transparent mb-3">
          {title}
        </h2>
        {description && (
          <p className="text-slate-500 text-xs md:text-sm max-w-xl font-medium">
            {description}
          </p>
        )}
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-30 items-center top-36 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white flex items-center justify-center border-2 border-slate-200/80 shadow-xs">
                <div className="h-3.5 w-3.5 rounded-full bg-[#1B3F8B] shadow-xs animate-pulse" />
              </div>
              <motion.h3 
                initial={{ opacity: 0.2 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.85 }}
                transition={{ duration: 0.5 }}
                className="hidden md:block text-xl md:pl-20 md:text-2xl font-black text-slate-800"
              >
                {item.title}
              </motion.h3>
            </div>

            <motion.div 
              initial={{ opacity: 0.2, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6 }}
              className="relative pl-20 pr-4 md:pl-4 w-full"
            >
              <h3 className="md:hidden block text-xl mb-4 text-left font-black text-slate-800">
                {item.title}
              </h3>
              {item.content}
            </motion.div>
          </div>
        ))}
        
        <div
          className="absolute md:left-8 left-8 top-10 md:top-40 bottom-24 md:bottom-48 overflow-hidden w-[2px] bg-gradient-to-b from-transparent via-slate-200 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-[#C1272D] to-[#1B3F8B] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
