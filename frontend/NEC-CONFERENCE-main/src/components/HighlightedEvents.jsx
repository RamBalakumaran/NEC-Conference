"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { BorderBeam } from './ui/border-beam';

const events = [
  { id: 1, dept: "CIVIL", title: "Next-Gen Construction Planning 3.0", description: "PlanSwift-Driven Estimation & TILOS-Based Linear Scheduling" },
  { id: 2, dept: "CIVIL", title: "Sustainable Solutions for Potable Water", description: "Innovative potable water technologies" },
  { id: 3, dept: "MECH", title: "Digital Fabrication 4.0", description: "Smart Manufacturing in Industry 4.0" },
  { id: 4, dept: "MECH", title: "AR/VR in Mechanical Design", description: "Immersive mechanical system design" },
  { id: 5, dept: "MECH", title: "CAD to Cut", description: "Wirecut EDM Workshop" },
  { id: 6, dept: "IT", title: "Predictive Analytics in IoT", description: "Machine Learning powered IoT systems" },
  { id: 7, dept: "IT", title: "Predictive Analytics Using Machine Learning in IoT", description: "Deploy intelligent AI systems" },
  { id: 8, dept: "ECE", title: "From Arrays to Intelligence: Evolving Antenna Technologies - Massive MIMO, RIS, and Beyond", description: "Advanced communication systems" }
  { id: 9, dept: "ECE", title: "Embedded Systems & Real-Time", description: "Real-time embedded platforms" },
  { id: 10, dept: "EEE", title: "EV Technology & BMS", description: "Battery management innovations" },
  { id: 11, dept: "EEE", title: "Arduino & ESP32 Workshop", description: "Hands-on IoT microcontrollers" },
  { id: 12, dept: "CSE", title: "Quantum Computing", description: "Concepts and applications" },
  { id: 13, dept: "CSE", title: "Augmented Reality Systems", description: "Interactive AR integration" },
  { id: 14, dept: "CSE", title: "Geospatial Applications", description: "GIS and spatial computing" },
  { id: 15, dept: "AIDS", title: "N8n Automation", description: "AI-driven workflow automation" },
  { id: 16, dept: "AIDS", title: "AI Agents in SaaS", description: "Scalable AI architectures" },
  { id: 17, dept: "S&H", title: "Mathematics in AI Era", description: "Mathematics powering AI systems" },
  { id: 18, dept: "S&H", title: "AI for Placements", description: "Resume & interview readiness" },
];

const EventCard = ({ event, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ rotateX: 5, rotateY: -5 }}
      transition={{ duration: 0.6 }}
      className="relative group h-[420px] w-full rounded-3xl overflow-hidden 
      backdrop-blur-xl bg-white/5 border border-white/10 
      shadow-[0_0_40px_rgba(121,40,202,0.3)] 
      hover:shadow-[0_0_80px_rgba(255,0,128,0.7)] 
      transition-all duration-700 p-8 flex flex-col justify-between"
      style={{ transformStyle: "preserve-3d" }}
    >

      {/* Animated Glow Mesh */}
      <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-70 transition duration-700">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#FF0080]/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#7928CA]/30 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Spotlight */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)]" />

      {/* Department Badge */}
      <div className="relative z-10">
        <span className="px-5 py-1 text-xs tracking-widest rounded-full 
        bg-gradient-to-r from-[#FF0080] to-[#7928CA] text-white font-semibold 
        shadow-[0_0_20px_rgba(255,0,128,0.7)] animate-pulse">
          {event.dept}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 mt-6">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug 
        group-hover:text-transparent group-hover:bg-clip-text 
        group-hover:bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#00C9FF] 
        transition-all duration-500">
          {event.title}
        </h3>

        <p className="text-gray-300 text-sm md:text-base leading-relaxed 
        opacity-80 group-hover:opacity-100 transition duration-500">
          {event.description}
        </p>
      </div>

      {/* Bottom Accent Line */}
      <div className="relative z-10 mt-6 h-[3px] w-20 bg-gradient-to-r 
      from-[#FF0080] via-[#7928CA] to-[#00C9FF] 
      group-hover:w-full transition-all duration-700 rounded-full" />

      <BorderBeam
        size={450}
        duration={10}
        anchor={90}
        borderWidth={2}
        colorFrom="#FF0080"
        colorTo="#7928CA"
        delay={index * 1.2}
      />
    </motion.div>
  );
};

const HighlightedEvents = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardsPerPage = isMobile ? 1 : 2;
  const adjustedTotalPages = Math.ceil(events.length / cardsPerPage);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? window.innerWidth : -window.innerWidth,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({
      x: direction < 0 ? window.innerWidth : -window.innerWidth,
      opacity: 0,
    }),
  };

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentPage((prev) => (prev + newDirection + adjustedTotalPages) % adjustedTotalPages);
  };

  const currentEvents = events.slice(
    currentPage * cardsPerPage,
    currentPage * cardsPerPage + cardsPerPage
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
      <div className="relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14"
          >
            {currentEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation + Dots */}
        <div className="flex flex-col items-center mt-12 gap-6">

          {/* Arrows */}
          <div className="flex justify-center gap-6">
            <button
              onClick={() => paginate(-1)}
              className="p-4 rounded-full bg-white/10 backdrop-blur-lg 
              hover:bg-gradient-to-r hover:from-[#FF0080] hover:to-[#7928CA] 
              transition-all duration-500"
            >
              <IconChevronLeft className="text-white" />
            </button>
             {/* Bottom Dots Indicator */}
          <div className="flex items-center gap-3 mt-2">
            {Array.from({ length: adjustedTotalPages }).map((_, index) => (
              <motion.div
                key={index}
                onClick={() => {
                  setDirection(index > currentPage ? 1 : -1);
                  setCurrentPage(index);
                }}
                initial={false}
                animate={{
                  scale: currentPage === index ? 1.4 : 1,
                  opacity: currentPage === index ? 1 : 0.4,
                }}
                transition={{ duration: 0.3 }}
                className={`h-3 w-3 rounded-full cursor-pointer transition-all duration-500 
                  ${
                    currentPage === index
                      ? "bg-gradient-to-r from-[#FF0080] to-[#7928CA] shadow-[0_0_10px_rgba(255,0,128,0.8)]"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
              />
            ))}
          </div>

            <button
              onClick={() => paginate(1)}
              className="p-4 rounded-full bg-white/10 backdrop-blur-lg 
              hover:bg-gradient-to-r hover:from-[#FF0080] hover:to-[#7928CA] 
              transition-all duration-500"
            >
              <IconChevronRight className="text-white" />
            </button>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default HighlightedEvents;
