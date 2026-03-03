import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

const PAYMENT_API_BASE = "https://nec.edu.in/icodses/payment";
const ADMIN_API_BASE = "https://nec.edu.in/icodses/admin";

const BASE_AMOUNTS = {
  ug_student: 8000,
  pg_student: 8000,
  faculty: 9000,
  industry: 10000
};

const BASE_LABELS = {
  ug_student: "UG/PG Student",
  pg_student: "UG/PG Student",
  faculty: "Faculty",
  industry: "Industry"
};

const normalizeType = (value) => {
  if (!value) return "";
  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("ug")) return "ug_student";
  if (normalized.includes("pg")) return "pg_student";
  if (normalized.includes("faculty")) return "faculty";
  if (normalized.includes("industry")) return "industry";
  return normalized;
};

const parseAuthors = (authors) => {
  if (!authors) return [];
  if (Array.isArray(authors)) return authors;
  if (typeof authors === "string") {
    try {
      const parsed = JSON.parse(authors);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function PaymentDashboard() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [paper, setPaper] = useState(location.state?.paper || null);
  const [authors, setAuthors] = useState([]);
  const [presentationMode, setPresentationMode] = useState("online");
  const [stayRequired, setStayRequired] = useState(false);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [baseCategory, setBaseCategory] = useState("");
  const [additionalCount, setAdditionalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [paymentStatusDetails, setPaymentStatusDetails] = useState(null);
  const summaryRef = useRef(null);

  const paperIdParam = searchParams.get("paperId");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      login(token);
      navigate("/payment-dashboard", { replace: true });
    }
  }, [searchParams, login, navigate]);

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/auth");
    }
  }, [user, navigate]);

  const loadPaperFromApi = async (paperId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${ADMIN_API_BASE}/paper-status/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch paper details");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        const match = data.find((p) => String(p.id) === String(paperId));
        if (match) {
          setPaper(match);
        } else {
          setError("Paper not found for payment");
        }
      }
    } catch (err) {
      console.error("Error loading paper:", err);
      setError("Unable to load paper details");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentConfig = async (paperId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${PAYMENT_API_BASE}/config/${paperId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setPresentationMode(data.presentationMode || "online");
      setStayRequired(!!data.stayRequired);
      if (Array.isArray(data.participantIndexes) && data.participantIndexes.length > 0) {
        setSelectedIndexes(data.participantIndexes);
      }
      if (data.baseAmount) {
        setBaseAmount(data.baseAmount / 100);
      }
      if (data.baseCategory) {
        setBaseCategory(data.baseCategory);
      }
      if (data.totalAmount) {
        setTotalAmount(data.totalAmount / 100);
      }
    } catch (err) {
      console.error("Error loading payment config:", err);
    }
  };

  const loadPaymentStatus = async (paperId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${PAYMENT_API_BASE}/status/${paperId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPaymentStatusDetails(data);
      if (data.paymentConfig) {
        setPresentationMode(data.paymentConfig.presentationMode || "online");
        setStayRequired(!!data.paymentConfig.stayRequired);
        if (Array.isArray(data.paymentConfig.participantIndexes)) {
          setSelectedIndexes(data.paymentConfig.participantIndexes);
        }
        if (data.paymentConfig.baseAmount) {
          setBaseAmount(data.paymentConfig.baseAmount / 100);
        }
        if (data.paymentConfig.baseCategory) {
          setBaseCategory(data.paymentConfig.baseCategory);
        }
        if (data.paymentConfig.totalAmount) {
          setTotalAmount(data.paymentConfig.totalAmount / 100);
        }
      }
    } catch (err) {
      console.error("Error loading payment status:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (paper) {
        const parsed = parseAuthors(paper.authors);
        setAuthors(parsed);
        setLoading(false);
        return;
      }
      if (!paperIdParam) {
        setError("Paper details not available for payment");
        setLoading(false);
        return;
      }
      if (paperIdParam && user) {
        await loadPaperFromApi(paperIdParam);
      }
    };
    init();
  }, [paper, paperIdParam, user]);

  useEffect(() => {
    if (!paper) return;
    const parsed = parseAuthors(paper.authors);
    setAuthors(parsed);

    if (parsed.length > 0) {
      const mainType = normalizeType(parsed[0]?.type);
      const base = BASE_AMOUNTS[mainType] || 0;
      setBaseAmount(base);
      setBaseCategory(BASE_LABELS[mainType] || "");
      setSelectedIndexes(parsed.map((_, idx) => idx));
    }

    loadPaymentConfig(paper.id);
    loadPaymentStatus(paper.id);
    setLoading(false);
  }, [paper]);

  useEffect(() => {
    const count = Math.max(0, selectedIndexes.length - 1);
    setAdditionalCount(count);
    const total = baseAmount + count * 20;
    setTotalAmount(total);
  }, [selectedIndexes, baseAmount]);

  const toggleParticipant = (index) => {
    if (index === 0) return;
    setSelectedIndexes((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  const handlePreparePayment = async () => {
    if (!paper?.id) return;
    setSaving(true);
    setError("");
    setShowSummary(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${PAYMENT_API_BASE}/prepare`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paperId: paper.id,
          presentationMode,
          stayRequired,
          participantIndexes: selectedIndexes
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save payment details");
      }

      setSummary(data);
      if (data.baseAmount) setBaseAmount(data.baseAmount / 100);
      if (data.baseCategory) setBaseCategory(data.baseCategory);
      if (data.totalAmount) setTotalAmount(data.totalAmount / 100);
      setShowSummary(true);
    } catch (err) {
      console.error("Prepare payment error:", err);
      setError(err.message || "Failed to save payment details");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (showSummary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showSummary]);

  const isPaid = (paymentStatusDetails?.paymentStatus || paper?.paymentStatus) === "paid";
  const canProceed = paper && paper.notificationSent && !isPaid && (
    ["accepted", "accepted_with_minor_revision", "accepted_with_major_revision"].includes(paper.status) ||
    ["accepted", "accepted_with_minor_revision", "accepted_with_major_revision"].includes(paper.reviewStatus)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Loading payment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:py-16">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-3 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">Payment Dashboard</h2>
              <p className="text-gray-600 text-base">Select your presentation and participant details</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {!paper && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <p className="text-gray-700">Paper details not available.</p>
            <button
              onClick={() => navigate("/paper-status")}
              className="mt-4 inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl"
            >
              Back to Paper Status
            </button>
          </div>
        )}

        {paper && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{paper.paperTitle}</h3>
                  <p className="text-gray-500 text-sm">Paper ID: #{paper.id}</p>
                </div>
                {isPaid && (
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                    Payment Completed
                  </span>
                )}
              </div>
            </div>

            {isPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <p className="text-green-800 font-medium mb-4">
                  Payment is already completed for this paper.
                </p>
                <button
                  onClick={() => navigate(`/payment?paperId=${paper.id}`, { state: { paperId: paper.id, paperTitle: paper.paperTitle } })}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-green-300 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-100 transition-all duration-200"
                >
                  View Payment Status
                </button>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-green-200 p-4">
                    <h5 className="text-base font-bold text-gray-800 mb-3">Payment Status</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className="font-semibold text-green-700">Paid</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-semibold text-gray-800">₹{paymentStatusDetails?.amount ? paymentStatusDetails.amount / 100 : totalAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID</span>
                        <span className="font-semibold text-gray-800">{paymentStatusDetails?.paymentId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Date</span>
                        <span className="font-semibold text-gray-800">
                          {paymentStatusDetails?.paymentDate ? new Date(paymentStatusDetails.paymentDate).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-green-200 p-4">
                    <h5 className="text-base font-bold text-gray-800 mb-3">Payment Details</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Presentation Mode</span>
                        <span className="font-semibold text-gray-800">{presentationMode || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stay Required</span>
                        <span className="font-semibold text-gray-800">{stayRequired ? "Yes" : "No"}</span>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Participants</p>
                        <div className="text-gray-800 text-sm">
                          {(selectedIndexes.length ? selectedIndexes : authors.map((_, idx) => idx))
                            .map((idx) => authors[idx]?.name || `Author ${idx + 1}`)
                            .join(", ") || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !canProceed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <p className="text-yellow-800 font-medium">
                    Payment is available only after your paper is accepted and notified by the admin.
                  </p>
                </div>
              )
            )}

            {!isPaid && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Presentation Mode</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                {["online", "offline"].map((mode) => (
                  <label key={mode} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="presentationMode"
                      value={mode}
                      checked={presentationMode === mode}
                      onChange={() => setPresentationMode(mode)}
                      className="w-4 h-4 text-green-600"
                      disabled={!canProceed}
                    />
                    <span className="text-gray-700 capitalize">{mode}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {!isPaid && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Stay Required</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                {[{ label: "Yes", value: true }, { label: "No", value: false }].map((option) => (
                  <label key={option.label} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="stayRequired"
                      value={option.label}
                      checked={stayRequired === option.value}
                      onChange={() => setStayRequired(option.value)}
                      className="w-4 h-4 text-green-600"
                      disabled={!canProceed}
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {!isPaid && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Participants</h4>
              <p className="text-sm text-gray-600 mb-4">
                Main author is included by default. Additional participants add ₹20 each.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {authors.map((author, idx) => (
                  <label key={`${author.email || author.name}-${idx}`} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg border">
                    <input
                      type="checkbox"
                      checked={selectedIndexes.includes(idx)}
                      onChange={() => toggleParticipant(idx)}
                      disabled={!canProceed || idx === 0}
                      className="mt-1 w-4 h-4 text-green-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {author.name || `Author ${idx + 1}`}
                        {idx === 0 && " (Main Author)"}
                      </p>
                      <p className="text-xs text-gray-500">{author.email || "No email"}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            )}

            {!isPaid && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow border border-blue-100 p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Amount Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Category</span>
                  <span className="font-semibold text-gray-800">{baseCategory || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount</span>
                  <span className="font-semibold text-gray-800">₹{baseAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Additional Participants</span>
                  <span className="font-semibold text-gray-800">{additionalCount} x ₹20</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>
            )}

            {!isPaid && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePreparePayment}
                  disabled={!canProceed || saving}
                  className={`inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200 ${
                    (!canProceed || saving) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Pay Now"}
                </button>
                <button
                  onClick={() => navigate("/paper-status")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Back to Paper Status
                </button>
              </div>
            )}

            {!isPaid && showSummary && summary && (
              <div ref={summaryRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Amount Structure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Category</span>
                    <span className="font-semibold text-gray-800">{summary.baseCategory || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount</span>
                    <span className="font-semibold text-gray-800">₹{(summary.baseAmount || 0) / 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Participants</span>
                    <span className="font-semibold text-gray-800">{summary.additionalParticipants || 0} x ₹20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Amount</span>
                    <span className="font-semibold text-gray-800">₹{(summary.additionalAmount || 0) / 100}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                    <span>Total</span>
                    <span>₹{(summary.totalAmount || 0) / 100}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div>Presentation Mode: <span className="font-semibold text-gray-800">{summary.presentationMode}</span></div>
                  <div>Stay Required: <span className="font-semibold text-gray-800">{summary.stayRequired ? "Yes" : "No"}</span></div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate(`/payment?paperId=${paper.id}`, { state: { paperId: paper.id, paperTitle: paper.paperTitle } })}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200"
                  >
                    Proceed to Payment
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDashboard;
