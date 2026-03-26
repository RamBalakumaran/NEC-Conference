import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  Download,
  FileClock,
  History,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { Navbar } from '../components/Navbar/Navbar';
import { useConference } from '../context/ConferenceContext';
import { downloadPaymentBill } from '../utils/paymentBillPdf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5200/conference';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatCurrency = (amount, currency = 'INR') => {
  const numericAmount = Number(amount || 0);
  return `${currency} ${numericAmount.toLocaleString('en-IN')}`;
};

const formatLabel = (value, fallback = 'Not provided') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const toTitleCase = (value) =>
  String(value || 'Participant')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

const statusClasses = {
  Paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  Pending: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  Failed: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  Refunded: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  Active: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
  Inactive: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
};

const summaryAccents = [
  'from-cyan-500/30 via-cyan-500/10 to-transparent',
  'from-emerald-500/30 via-emerald-500/10 to-transparent',
  'from-amber-500/30 via-amber-500/10 to-transparent',
  'from-fuchsia-500/30 via-fuchsia-500/10 to-transparent',
];

const StatCard = ({ icon, label, value, hint, accent }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
    <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
    <div className="relative z-10">
      <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-black/25 p-3 text-white/90">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-white/65">{hint}</p>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-b-0">
    <span className="text-sm text-white/55">{label}</span>
    <span className="max-w-[60%] text-right text-sm font-medium text-white">{formatLabel(value)}</span>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${statusClasses[status] || statusClasses.Pending}`}>
    {status}
  </span>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useConference();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingBillId, setDownloadingBillId] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!user || !token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!ignore) {
          setProfileData(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Profile load failed:', err);
          setError(err.response?.data?.message || 'Unable to load profile history right now.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [navigate, user]);

  const profile = profileData?.profile || {
    participantId: user?.participantId || null,
    name: user?.name || 'Participant',
    email: user?.email || '',
    role: user?.role || 'Participant',
    organization: user?.college || null,
    college: user?.college || null,
    department: user?.department || null,
    phone: user?.phone || null,
    year: user?.year || null,
    accountStatus: user?.accountStatus || 'active',
    lastLogin: user?.lastLogin || null,
    loginCount: Number(user?.loginCount || 0),
    registeredEvents: Array.isArray(user?.registeredEvents) ? user.registeredEvents : [],
  };

  const summary = profileData?.summary || {
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalPaidAmount: 0,
    confirmedEvents: Array.isArray(profile.registeredEvents) ? profile.registeredEvents.length : 0,
  };

  const paymentHistory = profileData?.paymentHistory || [];
  const activityHistory = (profileData?.activityHistory || []).slice(0, 8);
  const organizationLabel = String(profile.role || '').toLowerCase() === 'industry' ? 'Company' : 'Institution';

  const handleDownloadBill = async (payment) => {
    const canDownloadBill = payment?.canDownloadBill ?? payment?.status === 'Paid';
    if (!canDownloadBill) return;

    const paymentKey = payment.id || payment.orderId || payment.transactionId;
    try {
      setError('');
      setDownloadingBillId(paymentKey);
      await downloadPaymentBill({ profile, payment });
    } catch (downloadError) {
      console.error('Bill download failed:', downloadError);
      setError(downloadError?.message || 'The PDF bill could not be generated. Please try again.');
    } finally {
      setDownloadingBillId(null);
    }
  };

  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-[#050816] px-4 pb-16 pt-32 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-5%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/12 blur-[120px]" />
          <div className="absolute bottom-[-12%] right-[-5%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/10 blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.12),_transparent_30%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,18,34,0.96),rgba(18,10,29,0.92))] p-8 shadow-[0_20px_80px_rgba(3,7,18,0.55)]"
          >
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">
                  <Sparkles size={14} />
                  Participant Profile
                </div>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
                  {profile.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                  Your NEC Conference profile keeps the essentials together: role details, registration status, and every payment attempt in one place.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <StatusBadge status={toTitleCase(profile.accountStatus)} />
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                    {toTitleCase(profile.role)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                    Participant ID: {formatLabel(profile.participantId, 'Pending Assignment')}
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/tracks')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-slate-950 transition-transform duration-300 hover:scale-[1.02]"
                  >
                    Browse Tracks
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition-colors duration-300 hover:bg-white/10"
                  >
                    View Cart
                    <CreditCard size={18} />
                  </button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <UserCircle2 className="text-cyan-200" size={26} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">Profile Snapshot</p>
                    <p className="mt-1 text-lg font-semibold text-white">Conference Account</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 rounded-3xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3 text-sm text-white/75">
                    <Mail size={16} className="text-cyan-300" />
                    <span>{formatLabel(profile.email)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/75">
                    <Phone size={16} className="text-cyan-300" />
                    <span>{formatLabel(profile.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/75">
                    <Building2 size={16} className="text-cyan-300" />
                    <span>{formatLabel(profile.organization)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/75">
                    <CalendarClock size={16} className="text-cyan-300" />
                    <span>Last login: {formatDateTime(profile.lastLogin)}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Confirmed Events</p>
                  <p className="mt-3 text-3xl font-bold text-white">{summary.confirmedEvents}</p>
                  <p className="mt-2 text-sm text-emerald-100/75">
                    Completed payments automatically unlock PDF bill download from your history.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">
              <Loader2 className="mx-auto mb-4 animate-spin text-cyan-300" size={34} />
              <p className="text-lg font-semibold text-white">Loading your profile history...</p>
              <p className="mt-2 text-sm text-white/55">Pulling your account details and payment timeline.</p>
            </div>
          ) : (
            <>
              <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                      <BadgeCheck size={22} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/45">Essential Details</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">Participant Information</h2>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-black/15 px-5">
                    <DetailRow label="Participant ID" value={profile.participantId} />
                    <DetailRow label="Role" value={toTitleCase(profile.role)} />
                    <DetailRow label={organizationLabel} value={profile.organization} />
                    <DetailRow label="Department" value={profile.department} />
                    <DetailRow label="Academic Year" value={profile.year} />
                    <DetailRow label="Email" value={profile.email} />
                    <DetailRow label="Phone" value={profile.phone} />
                    <DetailRow label="Account Status" value={toTitleCase(profile.accountStatus)} />
                    <DetailRow label="Login Count" value={profile.loginCount} />
                    <DetailRow label="Last Login" value={formatDateTime(profile.lastLogin)} />
                  </div>

                  <div className="mt-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">Registered Events</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(Array.isArray(profile.registeredEvents) ? profile.registeredEvents : []).length > 0 ? (
                        profile.registeredEvents.map((eventName) => (
                          <span
                            key={eventName}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80"
                          >
                            {eventName}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/55">No confirmed events yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <StatCard
                    icon={<History size={22} />}
                    label="Payment Attempts"
                    value={summary.totalPayments}
                    hint="Every payment attempt tied to this account."
                    accent={summaryAccents[0]}
                  />
                  <StatCard
                    icon={<ShieldCheck size={22} />}
                    label="Successful Payments"
                    value={summary.paidPayments}
                    hint="Paid entries are eligible for PDF bill download."
                    accent={summaryAccents[1]}
                  />
                  <StatCard
                    icon={<Wallet size={22} />}
                    label="Total Paid"
                    value={formatCurrency(summary.totalPaidAmount)}
                    hint="Combined value of successful payments."
                    accent={summaryAccents[2]}
                  />
                  <StatCard
                    icon={<Ticket size={22} />}
                    label="Pending / Failed"
                    value={`${summary.pendingPayments} / ${summary.failedPayments}`}
                    hint="Useful for tracking retry-worthy payment attempts."
                    accent={summaryAccents[3]}
                  />
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/45">History</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">Payment Records</h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">
                      {paymentHistory.length} records
                    </div>
                  </div>

                  {paymentHistory.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-black/15 p-10 text-center">
                      <FileClock className="mx-auto mb-4 text-white/45" size={34} />
                      <p className="text-lg font-semibold text-white">No payment history yet</p>
                      <p className="mt-2 text-sm text-white/55">
                        Once you complete or attempt a payment, the full status trail will appear here.
                      </p>
                      <button
                        onClick={() => navigate('/tracks')}
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/15"
                      >
                        Explore Tracks
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentHistory.map((payment) => {
                        const paymentKey = payment.id || payment.orderId || payment.transactionId;
                        const paymentEvents = Array.isArray(payment.events) ? payment.events : [];
                        const canDownloadBill = payment.canDownloadBill ?? payment.status === 'Paid';
                        const isDownloading = downloadingBillId === paymentKey;

                        return (
                          <motion.div
                            key={paymentKey}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-3xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6"
                          >
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <StatusBadge status={payment.status} />
                                  <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                                    Updated {formatDateTime(payment.updatedAt || payment.createdAt)}
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-end gap-4">
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Amount</p>
                                    <p className="mt-2 text-3xl font-bold text-white">
                                      {formatCurrency(payment.amount, payment.currency)}
                                    </p>
                                  </div>
                                  <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75">
                                    {paymentEvents.length > 0 ? paymentEvents.length : 0} event(s)
                                  </div>
                                </div>

                                <div className="mt-5 rounded-2xl border border-white/5 bg-black/15 p-4">
                                  <p className="text-xs uppercase tracking-[0.25em] text-white/45">Events</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {paymentEvents.length > 0 ? (
                                      paymentEvents.map((eventName) => (
                                        <span
                                          key={`${paymentKey}-${eventName}`}
                                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80"
                                        >
                                          {eventName}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-white/50">No event details captured for this payment.</span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                  <div className="rounded-2xl border border-white/5 bg-black/15 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Order ID</p>
                                    <p className="mt-2 break-all text-sm text-white/80">{formatLabel(payment.orderId)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-white/5 bg-black/15 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Payment ID</p>
                                    <p className="mt-2 break-all text-sm text-white/80">{formatLabel(payment.paymentId)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-white/5 bg-black/15 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Transaction ID</p>
                                    <p className="mt-2 break-all text-sm text-white/80">{formatLabel(payment.transactionId)}</p>
                                  </div>
                                  <div className="rounded-2xl border border-white/5 bg-black/15 p-4">
                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Created</p>
                                    <p className="mt-2 text-sm text-white/80">{formatDateTime(payment.createdAt)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="w-full rounded-3xl border border-white/8 bg-black/20 p-5 lg:w-[18rem]">
                                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Bill Access</p>
                                <p className="mt-3 text-lg font-semibold text-white">
                                  {canDownloadBill ? 'Ready to download' : 'Waiting for successful payment'}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-white/60">
                                  Bills are generated only for completed payment actions and stay available from your profile history.
                                </p>

                                <button
                                  onClick={() => handleDownloadBill(payment)}
                                  disabled={!canDownloadBill || isDownloading}
                                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition-all ${
                                    canDownloadBill
                                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:scale-[1.01]'
                                      : 'cursor-not-allowed border border-white/10 bg-white/5 text-white/35'
                                  }`}
                                >
                                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                  {isDownloading ? 'Preparing PDF...' : 'Download PDF Bill'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-fuchsia-400/10 p-3 text-fuchsia-200">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/45">Activity</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">Recent Timeline</h2>
                    </div>
                  </div>

                  {activityHistory.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-black/15 p-8 text-center text-sm text-white/55">
                      Registration and payment activity will appear here after you start your conference registration.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {activityHistory.map((entry, index) => (
                        <div key={entry.id || `${entry.action}-${index}`} className="relative pl-8">
                          {index !== activityHistory.length - 1 && (
                            <span className="absolute left-[0.72rem] top-7 h-[calc(100%+0.65rem)] w-px bg-white/10" />
                          )}
                          <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-cyan-300/30 bg-cyan-400/20" />

                          <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="font-semibold text-white">{entry.action}</p>
                              <StatusBadge status={entry.status || 'Pending'} />
                            </div>
                            <p className="mt-2 text-sm text-white/55">{formatDateTime(entry.timestamp)}</p>
                            {entry.events?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {entry.events.map((eventName) => (
                                  <span
                                    key={`${entry.id}-${eventName}`}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70"
                                  >
                                    {eventName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
