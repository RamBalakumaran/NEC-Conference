import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Home, Mail } from "lucide-react";
import { useConference } from "../context/ConferenceContext";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formattedTime, setFormattedTime] = useState("");

  const { paperId, paymentId, amount } = location.state || {};
  const { clearCart } = useConference();

  useEffect(() => {
    if (!location.state) {
      navigate("/");
      return;
    }

    // clear any leftover cart as a safeguard
    clearCart();

    // Format current time
    const now = new Date();
    setFormattedTime(
      now.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, [location.state, navigate, clearCart]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1E0F2D] via-[#2A1B3D] to-[#14092A]"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-purple-600/10 to-purple-400/20 opacity-50 blur-3xl"></div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Success Card */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#2A1B3D] rounded-2xl shadow-2xl border border-green-500/30 p-8 md:p-12 text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <CheckCircle className="w-24 h-24 text-green-400" strokeWidth={1.5} />
          </motion.div>

          {/* Success Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-green-400 text-lg font-semibold mb-8">
            ✓ Your registration is confirmed
          </p>

          {/* Payment Details */}
          <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-6 mb-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-green-500/30">
                <span className="text-purple-300">Amount Paid</span>
                <span className="text-2xl font-bold text-green-400">
                  ₹{amount || "300"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-green-500/30">
                <span className="text-purple-300">Payment ID</span>
                <span className="text-sm font-mono text-gray-300">
                  {paymentId ? paymentId.substring(0, 20) + "..." : "Processing..."}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-purple-300">Date & Time</span>
                <span className="text-sm text-gray-300">{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 justify-center">
              <Mail className="w-5 h-5 text-purple-400" />
              Next Steps
            </h3>
            <ul className="text-left space-y-3 text-purple-200 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Check your email for the confirmation and registration details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Your conference ticket will be sent within 24 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span>Login to your account to track your participation status</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <p className="text-sm text-purple-300 mb-8">
            Questions?{" "}
            <a
              href="mailto:support@nec.edu.in"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Contact Support
            </a>
          </p>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center gap-2 border-2 border-purple-500 text-purple-300 hover:text-white hover:border-purple-400 font-bold py-3 px-8 rounded-xl transition-all"
            >
              View Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-200 text-sm text-center"
        >
          📋 Your transaction reference has been saved. You can track your
          registration status anytime.
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentSuccess;
