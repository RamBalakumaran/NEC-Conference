import React from 'react';
import { useConference } from '../context/ConferenceContext';
import { Navbar } from '../components/Navbar/Navbar';
import { Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { cart, removeFromCart, totalPrice, user } = useConference();
  const navigate = useNavigate();

  const MAIN_CONF_ID = 'icodses-2026';

  // Helper variables for display logic
  const hasMainConf = cart.some(item => item.id === MAIN_CONF_ID);
  const standardEvents = cart.filter(item => item.id !== MAIN_CONF_ID);
  const standardCount = standardEvents.length;
  const hasComboPlan = hasMainConf;

  const handleProceed = () => {
    const paymentData = {
      userData: {
        ...user,
        role: user?.role || 'Participant',
        track: cart.map(item => item.name || item.title || 'Event').join(', ')
      },
      amount: totalPrice,
      events: cart // ensure Payment component receives an "events" array
    };

    navigate('/registration/payment', { state: paymentData });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 relative z-10 bg-transparent">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold font-iceland text-white mb-8">Registration Summary</h1>

          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-20 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xl">Your cart is empty.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-4 text-purple-400 hover:underline">
                Go to Tracks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* CART ITEMS LIST */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => {
                  const isMainConf = item.id === MAIN_CONF_ID;

                  return (
                    <div key={item.id} className="bg-white/5 border border-purple-500/20 rounded-xl p-6 flex justify-between items-center group hover:bg-white/10 transition-all">
                      <div className="max-w-[70%]">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight">{item.name || item.title || 'Event'}</h3>
                        <p className="text-purple-300 text-sm">{item.date} • {item.time || 'All Day'}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-6">
                        {/* Price Display Logic */}
                        <span className="text-gray-300 font-mono font-bold text-right">
                          {isMainConf ? (
                            <span className="text-pink-400 text-lg">₹1500</span>
                          ) : (
                            hasComboPlan ? (
                              <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded border border-amber-500/30 whitespace-nowrap">
                                Included in Combo
                              </span>
                            ) : standardCount > 1 ? (
                              <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-500/30 whitespace-nowrap">
                                Included in Bundle
                              </span>
                            ) : (
                              "₹300"
                            )
                          )}
                        </span>

                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400/70 hover:text-red-400 transition-colors p-2 hover:bg-red-900/20 rounded-full"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAYMENT SUMMARY CARD */}
              <div className="lg:col-span-1">
                <div className="bg-[#1a1025] border border-purple-500/50 rounded-2xl p-8 sticky top-28 shadow-2xl">
                  <h2 className="text-2xl font-bold font-iceland text-white mb-6">Payment Details</h2>
                  
                  <div className="space-y-4 text-gray-300 mb-8 text-sm">
                    <div className="flex justify-between">
                      <span>Participant</span>
                      <span className="text-white font-bold">{user?.name || "Guest"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Events Selected</span>
                      <span className="text-white">{cart.length}</span>
                    </div>
                    
                    {/* COST BREAKDOWN */}
                    <div className="border-t border-white/10 pt-3 mt-2 space-y-2">
                      
                      {/* Pre-Conference/Main Conference Cost */}
                      {hasComboPlan ? (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Combo (Pre-Conference + 26 &amp; 27 Full Access)</span>
                          <span className="text-pink-400 font-mono">₹1500</span>
                        </div>
                      ) : (
                        <>
                          {/* Pre-Conference Cost */}
                          {standardCount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Pre-Conference ({standardCount})</span>
                              <span className="text-green-400 font-mono">
                                {standardCount > 1 ? "₹500 (Bundle)" : "₹300"}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-8 pt-4 border-t border-white/20">
                    <span className="text-2xl font-bold text-white">Total</span>
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                      ₹{totalPrice}
                    </span>
                  </div>

                  <button 
                    onClick={handleProceed}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all transform hover:scale-[1.02]"
                  >
                    Proceed to Pay <ArrowRight size={20} />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Checkout;

