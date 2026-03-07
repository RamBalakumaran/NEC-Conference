import React, { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2026-03-25T00:00:00+05:30');

const getTimeLeft = () => {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { d: '00', h: '00', m: '00', s: '00' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    d: String(days).padStart(2, '0'),
    h: String(hours).padStart(2, '0'),
    m: String(minutes).padStart(2, '0'),
    s: String(seconds).padStart(2, '0')
  };
};

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const TimeSection = ({ value, label }) => (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flip-clock flex flex-row items-center gap-1 sm:gap-2 md:gap-4">
        <div className="digit digit-left relative w-[25px] h-[35px] md:w-[75px] md:h-[110px] bg-purple-900 rounded-lg perspective-[400px] m-0.5">
          <div className="card">
            <div className="card-face text-[1em] md:text-[3.5em] font-bold text-white bg-gradient-to-br from-[#a7465b] to-[#6f39cd] rounded-lg shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
              {value[0]}
            </div>
            <div className="card-face card-face-back text-[1em] md:text-[3.5em] font-bold text-white bg-gradient-to-br from-[#a7465b] to-[#6f39cd] rounded-lg shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
              {value[0]}
            </div>
          </div>
        </div>
        <div className="digit digit-right relative w-[25px] h-[35px] md:w-[75px] md:h-[110px] bg-purple-900 rounded-lg perspective-[400px] m-0.5">
          <div className="card">
            <div className="card-face text-[1em] md:text-[3.5em] font-bold text-white bg-gradient-to-br from-[#a7465b] to-[#6f39cd] rounded-lg shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
              {value[1]}
            </div>
            <div className="card-face card-face-back text-[1em] md:text-[3.5em] font-bold text-white bg-gradient-to-br from-[#a7465b] to-[#6f39cd] rounded-lg shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
              {value[1]}
            </div>
          </div>
        </div>
      </div>
      <div className="text-[0.7em] md:text-[1.5em] font-semibold uppercase tracking-[2px] md:tracking-[3px] text-purple-200 mt-2.5 drop-shadow-[0_0_8px_rgba(221,214,254,0.3)]">
        {label}
      </div>
    </div>
  );

  return (
    <div className="relative w-full flex justify-center">
      <div className="w-[95%] md:w-[90%] lg:w-[120%] my-5 p-4 md:p-[15px] bg-white/5 backdrop-blur-[10px] rounded-[25px] shadow-[0_8px_32px_rgba(31,38,135,0.15),0_0_20px_rgba(139,92,246,0.3),inset_0_0_15px_rgba(139,92,246,0.2)] animate-fadeInUp opacity-0 mb-[100px] lg:translate-x-[-8%] border border-purple-500/20">
        <div className="flex gap-1 md:gap-[35px] justify-center items-center p-3 md:p-10 bg-transparent rounded-[20px] shadow-[0_10px_30px_rgba(88,28,135,0.3)]">
          <TimeSection value={timeLeft.d} label="DAYS" />
          <div className="text-[1.2em] md:text-[4em] text-purple-400 font-bold flex items-center justify-center self-center h-full px-[2px] md:px-[5px] drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] mt-[-15px] mb-[15px] md:mt-[-25px] md:mb-0">:</div>

          <TimeSection value={timeLeft.h} label="HOURS" />
          <div className="text-[1.2em] md:text-[4em] text-purple-400 font-bold flex items-center justify-center self-center h-full px-[2px] md:px-[5px] drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] mt-[-15px] mb-[15px] md:mt-[-25px] md:mb-0">:</div>

          <TimeSection value={timeLeft.m} label="MINUTES" />
          <div className="text-[1.2em] md:text-[4em] text-purple-400 font-bold flex items-center justify-center self-center h-full px-[2px] md:px-[5px] drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] mt-[-15px] mb-[15px] md:mt-[-25px] md:mb-0">:</div>

          <TimeSection value={timeLeft.s} label="SECONDS" />
        </div>
      </div>
    </div>
  );
};

export default Countdown;
