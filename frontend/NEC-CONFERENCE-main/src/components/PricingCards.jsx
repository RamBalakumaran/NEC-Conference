import React from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";

const PricingCards = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <motion.div 
      className="w-full max-w-7xl mx-auto px-4 py-12 relative z-10"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
        
        {/* --- PLAN 1: ONE EVENT (25th Pre-Conference) --- */}
        <motion.div variants={cardVariants} className="relative group flex flex-col h-full">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-2xl blur opacity-20 transition duration-500"></div>
          
          <div className="relative flex-1 bg-[#0f0518] bg-opacity-90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col hover:border-purple-500/30 transition-colors duration-300">
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold font-orbitron text-white mb-2">
                One Event Pass
              </h3>
              <p className="text-purple-300 text-sm">
                25th Pre-Conference Access
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white font-orbitron tracking-wider">₹300</span>
                <span className="text-gray-400">/event</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Pre-Conference: One Event Access (25th)",
                "Workshop kit",
                "Softcopy of the workshop material & conference proceedings",
                "Tea & snacks",
                "E certificate"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <div className="mt-1 bg-purple-900/50 p-1 rounded-full shrink-0">
                    <Check size={14} className="text-purple-400" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Rendered as static text instead of a button */}
            <div className="w-full py-4 mt-auto rounded-xl bg-white/5 border border-white/10 text-center text-purple-200 font-bold font-orbitron flex items-center justify-center gap-2 cursor-default">
              One Event Access
            </div>
          </div>
        </motion.div>

        {/* --- PLAN 2: MULTI EVENT (25th Pre-Conference) --- */}
        <motion.div variants={cardVariants} className="relative group flex flex-col h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF0080] via-purple-600 to-[#FF0080] rounded-2xl blur opacity-30 transition duration-1000"></div>
          
          <div className="relative flex-1 bg-[#130720] backdrop-blur-xl border border-[#FF0080]/30 rounded-2xl p-8 flex flex-col overflow-hidden">
            
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-l from-[#FF0080] to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-300" /> BEST VALUE
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h3 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 mb-2">
                Multi Event Pass
              </h3>
              <p className="text-pink-200/80 text-sm">
                Full Access – 25th Pre-Conference
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-[#FF0080]/20">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold text-white font-orbitron tracking-wider">₹500</span>
                <span className="text-gray-300">/total</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Pre-Conference: More Than One Event Access (25th)",
                "Workshop kit",
                "Softcopy of the workshop material & conference proceedings",
                "Tea & snacks",
                "E certificate"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <div className="mt-1 bg-gradient-to-br from-[#FF0080] to-purple-600 p-1 rounded-full shrink-0">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Rendered as static text instead of a button */}
            <div className="w-full py-4 mt-auto rounded-xl bg-[#FF0080]/10 border border-[#FF0080]/30 text-center text-pink-300 font-bold font-orbitron flex items-center justify-center gap-2 cursor-default">
              <Zap size={20} className="text-pink-400" /> Multi Event Access
            </div>
          </div>
        </motion.div>

        {/* --- PLAN 3: COMBO (PRE-CONFERENCE + 26th & 27th) --- */}
        <motion.div variants={cardVariants} className="relative group flex flex-col h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur opacity-25 transition duration-700"></div>
          
          <div className="relative flex-1 bg-[#1a0d05] backdrop-blur-xl border border-yellow-400/30 rounded-2xl p-8 flex flex-col overflow-hidden">

            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-l from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1">
                <Crown size={12} /> COMBO PASS
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h3 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-2">
                Full Access Combo
              </h3>
              <p className="text-yellow-200/80 text-sm">
                Pre-Conference + 26th & 27th Full Access
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-yellow-400/20">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold text-white font-orbitron tracking-wider">₹1500</span>
                <span className="text-gray-300">/total</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Pre-Conference: More Than One Event Access (25th)",
                "Main Conference: Full Access (26th & 27th)",
                "Workshop kit",
                "Softcopy of the workshop material & conference proceedings",
                "6 Times Tea & snacks",
                "E certificate"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <div className="mt-1 bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-full shrink-0">
                    <Check size={14} className="text-black" strokeWidth={3} />
                  </div>
                  <span className="font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Rendered as static text instead of a button */}
            <div className="w-full py-4 mt-auto rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center text-yellow-300 font-bold font-orbitron flex items-center justify-center gap-2 cursor-default">
              <Crown size={20} className="text-yellow-400" /> Full Combo Access
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default PricingCards;
