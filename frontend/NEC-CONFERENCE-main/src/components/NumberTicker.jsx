import React from 'react';
import {NumberTicker} from "../components/ui/number-ticker.jsx"
const NumberCounter = () => {
  return (
    <div className="w-full bg-gradient-to-br from-purple-900/20 to-transparent backdrop-blur-sm rounded-xl p-2 md:p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-[0_8px_32px_rgba(31,38,135,0.15)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.3)]">
      <div className="flex flex-row justify-between items-center gap-2 px-2">
        
        {/* Tracks Counter */}
        <div className="stat-card flex-1 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-baseline font-orbitron">
              <NumberTicker
                className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-400 text-transparent bg-clip-text"
                value={15}
                duration={2000}
              />
              <span className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-400 text-transparent bg-clip-text">+</span>
            </div>
            <span className="text-purple-200 text-[10px] md:text-base mt-1 font-space-grotesk tracking-wider">Conference Tracks</span>
          </div>
        </div>

        {/* Journals/Publications Counter */}
        <div className="stat-card flex-1 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-baseline font-orbitron">
              {/* Removed Rupee symbol */}
              <NumberTicker
                className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-400 text-transparent bg-clip-text"
                value={50}
                duration={2000}
              />
              <span className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-400 text-transparent bg-clip-text">+</span>
            </div>
            <span className="text-purple-200 text-[10px] md:text-base mt-1 font-space-grotesk tracking-wider">Indexed Journals</span>
          </div>
        </div>

        {/* Keynotes Counter */}
        <div className="stat-card flex-1 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-baseline font-orbitron">
              <span className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">0</span>
              <NumberTicker
                className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text"
                value={12}
                duration={3000}
              />
              <span className="text-lg md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">+</span>
            </div>
            <span className="text-purple-200 text-[10px] md:text-base mt-1 font-space-grotesk tracking-wider">Keynote Speakers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberCounter;