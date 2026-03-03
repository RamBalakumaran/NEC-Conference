import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const API_BASE_URL = "https://nec.edu.in/icodses";

function Payment() {
  // -------------------------------------------------------------
  // SECTION 1: ALL HOOKS MUST BE AT THE TOP (Never put a return above this)
  // -------------------------------------------------------------
  const { logout, user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paperId, setPaperId] = useState(null);
  const [paperTitle, setPaperTitle] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Hook 1: Handle Token Login
  useEffect(() => {
    const token = searchParams.get("token");
    const paperIdParam = searchParams.get("paperId");
    
    if (token) {
      login(token);
      navigate("/payment", { replace: true });
    }
    
    if (paperIdParam) {
      setPaperId(parseInt(paperIdParam));
    }
    
    if (location.state && location.state.paperId) {
      setPaperId(location.state.paperId);
      setPaperTitle(location.state.paperTitle || "");
    }
  }, [searchParams, login, navigate, location]);

  // Hook 2: Fetch Data
  useEffect(() => {
    // We do logic INSIDE the hook, we do NOT return early outside of it
    if (!user || user.role !== "user") {
      navigate("/auth");
    } else if (paperId) {
      fetchPaymentStatus();
    }
  }, [user, navigate, paperId]);

  // -------------------------------------------------------------
  // SECTION 2: FUNCTIONS (API Logic)
  // -------------------------------------------------------------

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payment/status/${paperId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data);
        setPaperTitle(data.paperTitle || "");
        setPaymentConfig(data.paymentConfig || null);
        setShowBreakdown(false);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch payment status");
      }
    } catch (err) {
      console.error("Error fetching payment status:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    // Get Mobile Number safely
    const userMobile = user?.mobile || user?.phone || ""; 
    
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paperId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment order");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ICoDSES Conference",
        description: `Paper: ${paperTitle}`,
        order_id: data.orderId,
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["collect", "qr", "intent"] 
                  }
                ],
              },
            },
            sequence: ["block.upi", "block.card", "block.netbanking"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payment/verify`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              navigate("/success-payment", {
                state: { paperId, paperTitle, amount: data.amount / 100 },
              });
            } else {
              setError(verifyData.error || "Payment verification failed");
              navigate("/cancel-payment", {
                state: { paperId, error: verifyData.error || "Payment verification failed." },
              });
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setError("Payment verification failed");
            navigate("/cancel-payment", {
              state: { paperId, error: "Payment verification failed" },
            });
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: userMobile, 
        },
        theme: {
          color: "#4F46E5",
        },
        retry: {
          enabled: true
        }
      };

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response){
           console.error("Razorpay internal failure", response.error);
        });
        razorpay.open();
      };
      script.onerror = () => {
        throw new Error("Failed to load payment gateway");
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNowClick = () => {
    setError(null);
    if (!paymentConfig) {
      setError("Please complete the Payment Dashboard before proceeding to payment.");
      return;
    }
    setShowBreakdown(true);
  };

  const handleConfirmPayment = () => {
    if (processing) return;
    handlePayment();
  };

  // -------------------------------------------------------------
  // SECTION 3: CONDITIONAL RETURNS (Must be at the BOTTOM)
  // -------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mx-auto mb-6"></div>
          </div>
          <p className="text-gray-700 text-lg font-semibold">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || "User"}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/auth");
            }}
            className="flex-shrink-0 inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:py-16">
        <div className="flex gap-8">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 text-xl mb-1">{user?.name || "User"}</h3>
                  <p className="text-gray-500 text-sm mb-4">Conference Participant</p>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/auth");
                    }}
                    className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-3 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-1">Payment</h2>
                  <p className="text-gray-600 text-base">Complete your conference registration payment</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {paymentStatus && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paper Title:</span>
                        <span className="font-semibold text-gray-800">{paperTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paper ID:</span>
                        <span className="font-semibold text-gray-800">#{paperId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-green-600 text-xl">₹{paymentStatus.amount / 100}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          paymentStatus.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : paymentStatus.paymentStatus === 'not_initiated'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {paymentStatus.paymentStatus === 'paid' ? 'Paid' : 
                           paymentStatus.paymentStatus === 'not_initiated' ? 'Pending' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {paymentStatus.canPay ? (
                    <div className="space-y-4">
                      {!paymentConfig && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                          Please complete the Payment Dashboard to set presentation mode, stay requirement, and participants.
                        </div>
                      )}

                      {!showBreakdown ? (
                        <button
                          onClick={handlePayNowClick}
                          disabled={processing}
                          className={`w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 ${
                            processing ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay Now ₹{paymentStatus.amount / 100}
                        </button>
                      ) : (
                        <>
                          {paymentConfig && (
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                              <h4 className="text-lg font-bold text-gray-800 mb-4">Amount Structure</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base Category</span>
                                  <span className="font-semibold text-gray-800">{paymentConfig.baseCategory || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Base Amount</span>
                                  <span className="font-semibold text-gray-800">₹{(paymentConfig.baseAmount || 0) / 100}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Additional Participants</span>
                                  <span className="font-semibold text-gray-800">{paymentConfig.additionalParticipants || 0} x ₹1500</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Additional Amount</span>
                                  <span className="font-semibold text-gray-800">₹{(paymentConfig.additionalAmount || 0) / 100}</span>
                                </div>
                                <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-gray-800">
                                  <span>Total</span>
                                  <span>₹{(paymentConfig.totalAmount || 0) / 100}</span>
                                </div>
                              </div>
                              <div className="mt-4 text-sm text-gray-600 space-y-1">
                                <div>Presentation Mode: <span className="font-semibold text-gray-800">{paymentConfig.presentationMode || "N/A"}</span></div>
                                <div>Stay Required: <span className="font-semibold text-gray-800">{paymentConfig.stayRequired ? "Yes" : "No"}</span></div>
                              </div>
                              {paymentStatus.amountOverride && paymentConfig.totalAmount !== paymentStatus.amountOverride && (
                                <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                                  Note: Amount has been updated by admin to ₹{paymentStatus.amountOverride / 100}.
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={handleConfirmPayment}
                            disabled={processing}
                            className={`w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 ${
                              processing ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {processing ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing Payment...
                              </>
                            ) : (
                              <>
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Confirm Payment
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => navigate(`/payment-dashboard?paperId=${paperId}`, { state: { paperId, paperTitle } })}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200"
                          >
                            Edit Payment Details
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                      <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-800 font-semibold text-lg">Payment Completed!</p>
                      <p className="text-green-600 mt-1">Thank you for your payment.</p>
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/paper-status")}
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Paper Status
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;