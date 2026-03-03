import React, { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

function SuccessPayment() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const paperId = location.state?.paperId;
  const paperTitle = location.state?.paperTitle;
  const amount = location.state?.amount;

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-8 text-center">
          {/* Success Icon */}
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Payment Successful!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Thank you! Your payment has been processed successfully.
          </p>

          {paperId && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
              <div className="space-y-2">
                {paperTitle && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paper:</span>
                    <span className="font-semibold text-gray-800 text-sm">{paperTitle}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Paper ID:</span>
                  <span className="font-semibold text-gray-800">#{paperId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-bold text-green-600">₹{amount || '0'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate("/paper-status")}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Paper Status
            </button>
            
            <button
              onClick={() => navigate("/")}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home
            </button>
          </div>

          <p className="text-gray-500 text-xs mt-6">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuccessPayment;
