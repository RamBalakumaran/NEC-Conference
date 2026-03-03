import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TimelineCard = ({ title, description, icon }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const getNavigationLink = () => {
    switch (title) {
      case "Pre-Conference Workshops":
      case "Workshops & Sessions":
      case "Keynotes & Tutorials":
        return "/tracks";
      case "Main Conference Days":
      case "Technical Tracks":
      case "Technical Events":
        return "/tracks";
      case "Resource Persons & Networking":
      case "Committee & Leisure":
        return "/contact";
      case "Registration & Participation":
        return "/signup";
      default:
        return null;
    }
  };

  const handleClick = () => {
    const link = getNavigationLink();
    if (link) {
      window.scrollTo(0, 0);
      navigate(link);
    }
  };

  const link = getNavigationLink();

  const scheduleDetails = `
• March 25, 2026: Pre-conference workshops across all departments with hands-on technical sessions and expert-led training.

• March 26-27, 2026: Main conference days for ICoDSES-2026 with keynote sessions, paper presentations, and academic interactions.

• Resource persons from academia and industry conduct practical and research-oriented sessions.

• Registration model: one workshop Rs.300, more than one workshop Rs.500; main conference registration is separate.
  `;

  const hasDropdown =
    title === "Conference Schedule" ||
    title === "Conference Legacy" ||
    title === "Inception of Sympo";

  return (
    <div className="group relative p-4 md:p-6 bg-black/40 rounded-xl transition-all duration-500
                    hover:bg-gradient-to-br from-purple-900/30 to-transparent
                    hover:scale-105 hover:-translate-y-2
                    backdrop-blur-sm border border-purple-500/20
                    hover:border-purple-500/40
                    shadow-[0_8px_32px_rgba(31,38,135,0.15)]
                    hover:shadow-[0_8px_32px_rgba(139,92,246,0.3)]
                    before:absolute before:inset-0 before:rounded-xl
                    before:bg-gradient-to-r before:from-purple-500/20 before:to-transparent
                    before:opacity-0 before:transition-opacity before:duration-500
                    hover:before:opacity-100">
      <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10">
        <div className="p-3 bg-gradient-to-br from-purple-900 to-purple-700 rounded-full
                      shadow-lg shadow-purple-500/20
                      group-hover:shadow-purple-500/40
                      group-hover:scale-110 transition-all duration-500
                      transform group-hover:rotate-6">
          {icon}
        </div>

        <div className="flex flex-col items-center w-full">
          <h3 className="text-xl md:text-2xl font-orbitron font-bold
                         bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400
                         text-transparent bg-clip-text
                         text-center">
            {title}
          </h3>

          <p className="mt-3 md:mt-4 text-sm md:text-base text-purple-200/90
                        font-space-grotesk leading-relaxed
                        group-hover:text-purple-100
                        transition-colors duration-300
                        text-center">
            {description}
          </p>

          {hasDropdown ? (
            <div className="w-full mt-4 space-y-4 flex flex-col items-center">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="transition-all duration-300 ease-in-out
                           px-6 py-2 rounded-lg
                           bg-gradient-to-r from-purple-600 to-pink-600
                           hover:from-purple-500 hover:to-pink-500
                           text-white font-space-grotesk text-sm
                           transform translate-y-2 group-hover:translate-y-0
                           shadow-lg hover:shadow-purple-500/50
                           flex items-center gap-2
                           mx-auto"
              >
                {showDetails ? 'Show Less' : 'Explore More'}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`w-full overflow-auto transition-all duration-500 ease-in-out
                 ${showDetails ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="bg-purple-900/30 rounded-lg p-6 border border-purple-500/20">
                  <p className="text-purple-200/90 font-space-grotesk text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {scheduleDetails}
                  </p>
                </div>
              </div>
            </div>
          ) : link && (
            <button
              onClick={handleClick}
              className="mt-4 transition-all duration-300 ease-in-out
                         px-6 py-2 rounded-lg
                         bg-gradient-to-r from-purple-600 to-pink-600
                         hover:from-purple-500 hover:to-pink-500
                         text-white font-space-grotesk text-sm
                         transform translate-y-2 group-hover:translate-y-0
                         shadow-lg hover:shadow-purple-500/50
                         w-fit cursor-pointer"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
