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
        
        {/* --- PLAN 1: STANDARD (25th Pre-Conference) --- */}
        <motion.div variants={cardVariants} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          
          <div className="relative h-full bg-[#0f0518] bg-opacity-90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col hover:border-purple-500/50 transition-colors duration-300">
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold font-orbitron text-white mb-2">
                Standard Pass
              </h3>
              <p className="text-purple-300 text-sm">
                25th Pre-Conference Access
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white font-orbitron tracking-wider">₹10</span>
                <span className="text-gray-400">/event</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Access to 1 Technical Track (25th)",
                "Participation Certificate",
                "Lunch & Refreshments",
                "Standard Conference Kit"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <div className="mt-1 bg-purple-900/50 p-1 rounded-full">
                    <Check size={14} className="text-purple-400" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Added flex centering to this button too for consistency */}
            <button className="w-full py-4 rounded-xl border border-purple-500/30 text-white font-bold font-orbitron hover:bg-purple-900/20 transition-all duration-300 flex items-center justify-center gap-2">
              Choose Standard
            </button>
          </div>
        </motion.div>

        {/* --- PLAN 2: UNLIMITED (25th Pre-Conference) --- */}
        <motion.div variants={cardVariants} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF0080] via-purple-600 to-[#FF0080] rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
          
          <div className="relative h-full bg-[#130720] backdrop-blur-xl border border-[#FF0080]/50 rounded-2xl p-8 flex flex-col overflow-hidden">
            
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-l from-[#FF0080] to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-300" /> BEST VALUE
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h3 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300 mb-2">
                Unlimited Pass
              </h3>
              <p className="text-pink-200/80 text-sm">
                Full Access – 25th Pre-Conference
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-[#FF0080]/20">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold text-white font-orbitron tracking-wider">₹15</span>
                <span className="text-gray-300">/total</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Access to ALL Technical Tracks(25th)",
                "Paper Presentation Opportunity",
                "Premium Conference Kit",
                "Publication Eligibility",
                "Lunch & Networking"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <div className="mt-1 bg-gradient-to-br from-[#FF0080] to-purple-600 p-1 rounded-full">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* ✅ FIXED: Added 'flex items-center justify-center gap-2' */}
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF0080] to-purple-600 text-white font-bold font-orbitron hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/25">
              <Zap size={20} className="fill-white" /> Get Unlimited Access
            </button>
          </div>
        </motion.div>

        {/* --- PLAN 3: PREMIUM PLUS (26th & 27th Two-Day Pass) --- */}
        <motion.div variants={cardVariants} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur opacity-40 group-hover:opacity-90 transition duration-700"></div>
          
          <div className="relative h-full bg-[#1a0d05] backdrop-blur-xl border border-yellow-400/40 rounded-2xl p-8 flex flex-col overflow-hidden">

            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-l from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1">
                <Crown size={12} /> 26th & 27th PASS
              </div>
            </div>

            <div className="mb-6 pt-2">
              <h3 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-2">
                Two-Day Premium Pass
              </h3>
              <p className="text-yellow-200/80 text-sm">
                Access for 26th & 27th Main Conference
              </p>
            </div>

            <div className="mb-8 pb-8 border-b border-yellow-400/20">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-bold text-white font-orbitron tracking-wider">₹20</span>
                <span className="text-gray-300">/2 days</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Access to ALL Technical Tracks (26th & 27th)",
                "Paper Presentation + Priority Review",
                "Premium Conference Kit",
                "Publication Eligibility",
                "Lunch Included (2 Days)",
                "4 Times Snacks",
                "Exclusive Networking Access"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <div className="mt-1 bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-full">
                    <Check size={14} className="text-black" strokeWidth={3} />
                  </div>
                  <span className="font-medium text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* This one was already mostly correct, kept it consistent */}
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold font-orbitron hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/25">
              <Crown size={20} /> Get Two-Day Access
            </button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

export default PricingCards;