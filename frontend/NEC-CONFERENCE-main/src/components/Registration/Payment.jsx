import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Loader } from "lucide-react";
import { useConference } from "../../context/ConferenceContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5200/conference";

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(false);
    document.body.appendChild(script);
  });

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const registrationData = location.state || { userData: {}, amount: 0, events: [] };
  const { userData, amount, events } = registrationData;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  

  useEffect(() => {
    if (!userData || !userData.email) {
      navigate("/registration/userdetail");
    }
  }, [userData, navigate]);

  const { clearCart } = useConference();

  const markPaymentFailed = async (orderId, paymentId = null, reason = "cancelled_by_user") => {
    if (!orderId) return;
    try {
      await axios.post(
        `${API_BASE_URL}/payment/failure`,
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          error: reason,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
    } catch (e) {
      console.warn("[Payment] Failed to mark payment as Failed:", e?.message || e);
    }
  };

  const handleRegistration = async (paymentDetails = {}) => {
    try {
      const eventNames = Array.isArray(events)
        ? events
            .map((ev) => (typeof ev === "string" ? ev : ev?.name || ev?.title || ev?.id || ""))
            .filter(Boolean)
        : [];

      const payload = {
        ...userData,
        email: userData?.email,
        paymentStatus: true,
        amount,
        transactionId: paymentDetails.transactionId || null,
        razorpayOrderId: paymentDetails.razorpayOrderId || null,
        razorpayPaymentId: paymentDetails.razorpayPaymentId || null,
        paymentDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        events: eventNames,
      };

      try {
        await axios.post(`${API_BASE_URL}/registration/register`, payload, {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        });
      } catch (regErr) {
        console.warn("[Payment] Registration endpoint warning:", regErr.message);
      }

      clearCart();

      navigate("/payment-success", {
        state: {
          events,
          amount,
          user: userData.email,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError("Payment successful but registration encountered an issue");
      setModalMessage(
        "Payment succeeded, but registration processing had an issue. Contact support if confirmation is not received."
      );
      setShowModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const initiateRazorpayPayment = async () => {
    try {
      setProcessing(true);
      setError("");

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay. Please check your internet connection.");
      }

      const orderResponse = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { userId: userData.email, events, amount },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );

      const { keyId, orderId, amount: orderAmount, currency } = orderResponse.data;
      if (!keyId || !orderId) {
        throw new Error("Failed to create payment order. Please try again.");
      }

      let paymentCompleted = false;

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency || "INR",
        name: "NEC Conference 2026",
        description: `Registration - ${userData.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/payment/verify`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                },
              }
            );

            if (verifyResponse.data.verified) {
              paymentCompleted = true;
              await handleRegistration({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                transactionId: verifyResponse.data?.transactionId || response.razorpay_payment_id,
              });
            } else {
              throw new Error(verifyResponse.data.error || "Payment verification failed");
            }
          } catch (err) {
            await markPaymentFailed(orderId, null, "verification_failed");
            clearCart();
            setError(err.response?.data?.error || err.message || "Payment verification failed");
            setModalMessage("Payment verification failed. Please try again.");
            setShowModal(true);
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: userData.name || "",
          email: userData.email || "",
        },
        theme: { color: "#A855F7" },
        modal: {
          ondismiss: async () => {
            if (!paymentCompleted) {
              await markPaymentFailed(orderId, null, "cancelled_by_user");
              clearCart();
            }
            setProcessing(false);
            setError("Payment cancelled. Status updated as Failed.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", async (response) => {
        const paymentId = response?.error?.metadata?.payment_id || null;
        const failedOrderId = response?.error?.metadata?.order_id || orderId;
        await markPaymentFailed(failedOrderId, paymentId, response?.error?.description || "payment_failed");
        clearCart();
        setProcessing(false);
        setError("Payment failed. Please try again.");
      });
      razorpay.open();
    } catch (err) {
      console.error("Razorpay initialization error:", err);
      setError(err.message || "Failed to initiate payment");
      setModalMessage(err.message || "Failed to initiate payment. Please try again.");
      setShowModal(true);
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-[#1E0F2D] via-[#2A1B3D] to-[#14092A] text-purple-200"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-purple-600/10 to-purple-400/20 opacity-50 blur-3xl"></div>

      <div className="relative z-10 bg-[#2A1B3D] p-8 rounded-2xl shadow-2xl border border-purple-700/30 w-full max-w-lg">
        <div className="mb-6 border-b border-purple-700/50 pb-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Registration Summary</h2>
          <div className="bg-purple-900/40 rounded-lg p-3 text-sm">
            <p>
              <span className="text-purple-400">Name:</span> {userData.name}
            </p>
            <p>
              <span className="text-purple-400">Email:</span> {userData.email}
            </p>
            <p className="mt-2 text-xl font-bold text-white">Total Payable: Rs.{amount}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-purple-100 mb-4">Complete Payment</h2>

        <div className="mb-6 p-4 border border-purple-600/50 bg-purple-900/20 rounded-lg text-center">
          <p className="text-sm text-purple-300 mb-2">Secure payment powered by</p>
          <p className="text-lg font-bold text-white">Razorpay</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6 p-4 bg-[#3B2A4F]/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-purple-300">Amount</span>
            <span className="font-bold text-white">Rs.{amount}</span>
          </div>
          <div className="border-t border-purple-700/30"></div>
          <div className="flex justify-between items-center">
            <span className="text-purple-300">Total</span>
            <span className="text-lg font-bold text-white">Rs.{amount}</span>
          </div>
        </div>

        

        <div className="mt-8">
          <button
            onClick={initiateRazorpayPayment}
            disabled={processing || !userData?.email}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay Rs.${amount} with Razorpay`
            )}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1E0F2D] border border-purple-500/50 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center"
          >
            <h3 className="text-xl font-bold mb-3 text-purple-200">Notice</h3>
            <p className="text-gray-300 mb-6 whitespace-pre-wrap">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Payment;
