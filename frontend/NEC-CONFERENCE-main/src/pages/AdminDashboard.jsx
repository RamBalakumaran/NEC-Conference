import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import QrScannerPanel from '../components/QrScannerPanel';
import { useConference } from '../context/ConferenceContext';
import { 
  Download, Users, DollarSign, LogOut, CheckCircle, Clock, Loader2, 
  Shield, XCircle, BarChart3, TrendingUp, Eye, Filter, Mail, Menu, CalendarCheck, Check, X, Search, ChevronDown,
  Database, QrCode
} from 'lucide-react';

// some event entries use `title` rather than `name` - helper to extract display text
const getEventDisplayName = (e) => {
  if (!e) return 'Unknown';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    return e.title || e.name || e.id || String(e);
  }
  return String(e);
};

const CONFERENCE_EVENT_NAMES =[
  'Code and Connect with Arduino and ESP32',
  'EV Technology and Battery Management Systems',
  'Digital Fabrication 4.0: Smart Manufacturing',
  'CAD to Cut: Wirecut EDM Workshop',
  'VR/XR in Mechanical Engineering Design',
  'Next-Gen Construction Planning 3.0',
  'Sustainable Solutions for Potable Water',
  'Predictive Analytics Using Machine Learning in IoT',
  'From Arrays to Intelligence: Evolving Antenna Technologies - Massive MIMO, RIS, and Beyond',
  'Emerging Trends in Semiconductors & Embedded Systems',
  'Quantum Computing: Concepts & Applications',
  'Augmented Reality Systems',
  'Geospatial Applications in Computing',
  'N8n: AI-Driven Visual Workflow Automation',
  'Challenges of Emerging AI Agents in SaaS',
  'Mathematics in the Age of AI',
  'AI for Placements: Vibe Coding & Interview Readiness',
  'ICoDSES-2026: International Conference on Deep Tech and Sustainable Engineering Solutions'
];

const normalizeEventName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const toEventArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const STATUS_STORAGE_KEY = 'nec-admin-user-statuses';

const loadStoredUserStatuses = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistUserStatuses = (payload) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

const deriveUserStatusKey = (user) => {
  if (!user) return 'unknown';
  return user._id || user.userId || user.email || user.pid || user.name || 'unknown';
};

// --- Helper Components ---

const StatCard = ({ icon, label, value, color }) => {
  const themes = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="bg-[#1a1025]/80 backdrop-blur-md border border-purple-500/20 p-5 rounded-2xl flex items-center gap-4 shadow-lg hover:border-purple-500/40 transition-colors">
      <div className={`p-3 rounded-xl border ${theme.bg} ${theme.border}`}>
        {React.cloneElement(icon, { className: `w-5 h-5 ${theme.text}` })}
      </div>
      <div>
        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold font-orbitron">{label}</p>
        <h3 className="text-2xl font-bold text-white font-orbitron tracking-[0.3em]">{value}</h3>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, color }) => {
  const colors = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
  };

  return (
    <div className={`bg-[#1a1025]/80 border ${colors[color]} p-6 rounded-xl text-center`}>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">{label}</p>
      <h3 className={`text-4xl font-bold ${colors[color].split(' ')[2]}`}>{value}</h3>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let styleClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
  let Icon = Clock;

  if (status === 'Paid') {
    styleClass = "bg-green-500/10 text-green-400 border-green-500/20";
    Icon = CheckCircle;
  } else if (status === 'Pending') {
    styleClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    Icon = Clock;
  } else if (status === 'Failed') {
    styleClass = "bg-red-500/10 text-red-400 border-red-500/20";
    Icon = XCircle;
  }

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 uppercase tracking-wide border ${styleClass}`}>
      <Icon size={10} />
      {status}
    </span>
  );
};

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} />, description: 'KPIs plus reminder controls' },
  { id: 'active-users', label: 'Active Users', icon: <Eye size={18} />, description: 'Live list from the last 30 minutes' },
  { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} />, description: 'Department & event insights' },
  { id: 'db-status', label: 'Database Status', icon: <Database size={18} />, description: 'Toggle active/inactive and view every record' },
  { id: 'reports', label: 'Registrations', icon: <Download size={18} />, description: 'Filtered, export-ready registrations' },
  { id: 'qr-scanner', label: 'QR Scanner', icon: <QrCode size={18} />, description: 'Verify participants on the fly' },
  { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} />, description: 'Mark day-wise attendance' }
];

const AdminTabList = ({ activeTab, onSelectTab, onAfterSelect, className = '' }) => (
  <nav className={`space-y-3 ${className}`}>
    {ADMIN_TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => {
          onSelectTab(tab.id);
          onAfterSelect?.();
        }}
        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all text-left ${
          activeTab === tab.id
            ? 'bg-purple-500/20 border border-purple-400 text-white shadow-[0_15px_40px_rgba(148,77,255,0.35)]'
            : 'text-gray-300 hover:text-white hover:bg-purple-500/10'
        }`}
      >
        <span className={`p-2 rounded-full transition ${activeTab === tab.id ? 'bg-purple-500/30 text-white' : 'bg-white/5 text-purple-300'}`}>
          {tab.icon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{tab.label}</p>
          <p className="text-[11px] text-gray-400 leading-tight">{tab.description}</p>
        </div>
      </button>
    ))}
  </nav>
);

// --- Main Component ---
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useConference();

  // State
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const[activeUsers, setActiveUsers] = useState([]);
  const [deptAnalytics, setDeptAnalytics] = useState({});
  const[eventAnalytics, setEventAnalytics] = useState({});
  
  // Filter States
  const[selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // Show all payment statuses by default
  const [selectedEvents, setSelectedEvents] = useState(['All']);
  const[selectedEventCount, setSelectedEventCount] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const[exportType, setExportType] = useState('all');
  
  const [departments, setDepartments] = useState([]);
  const[events, setEvents] = useState(CONFERENCE_EVENT_NAMES);
  const [stats, setStats] = useState({});
  const [userStatuses, setUserStatuses] = useState(() => loadStoredUserStatuses());
  const [dbSearchTerm, setDbSearchTerm] = useState('');
  const [dbStatusFilter, setDbStatusFilter] = useState('All');
  
  const [emailLoading, setEmailLoading] = useState(false);
  const[emailMessage, setEmailMessage] = useState(null);
  
  const [eventsOpen, setEventsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const eventsRef = useRef(null);
  const isLoggingOut = useRef(false);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const getUserStatusValue = (user) => {
    const key = deriveUserStatusKey(user);
    return userStatuses[key] || 'active';
  };

  const isUserActive = (user) => getUserStatusValue(user) === 'active';

  const toggleUserStatus = (user) => {
    const key = deriveUserStatusKey(user);
    setUserStatuses((prev) => {
      const nextStatus = prev[key] === 'inactive' ? 'active' : 'inactive';
      const next = { ...prev, [key]: nextStatus };
      persistUserStatuses(next);
      return next;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (eventsRef.current && !eventsRef.current.contains(e.target)) {
        setEventsOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  },[]);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  const ALL_DEPARTMENTS =['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'SH'];
  // Check Auth & Fetch Data
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Skip if logout is in progress to avoid double redirect
      if (isLoggingOut.current) {
        return;
      }

      const isAdmin = sessionStorage.getItem('isAdmin');
      const token = localStorage.getItem('adminToken');
      
      if (isAdmin !== 'true' || !token) {
        sessionStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        // Only redirect if logout is not in progress
        if (!isLoggingOut.current) {
          navigate('/admin/login', { replace: true });
        }
        return;
      }

      try {
      const mainRes = await axios.get('http://localhost:5200/conference/api/admin/registrations', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.error("Main data error:", err);
        return { data: { registrations: [], stats: {} } };
      });

        const registrationRows = mainRes.data.registrations || [];
        const transactionRows = mainRes.data.transactions || [];

        const registrationByEmail = new Map(
          registrationRows
            .map((r) => ({
              ...r,
              email: r?.userData?.email || r?.user?.email || r?.contactEmail || ''
            }))
            .filter((r) => r.email)
            .map((r) => [String(r.email).toLowerCase(), r])
        );

        const rawData = [...registrationRows, ...transactionRows];

        // Normalize/flatten backend registration objects so frontend can read fields like
        // `user.name`, `user.email`, `user.paymentAmount`, `user.paymentStatus`, etc.
        const enhancedData = rawData.map(item => {
          // Extract user data - could be nested as item.user or item.userData
          const userData = item.user || item.userData || {};
          const email = String(userData.email || item.userId || item.contactEmail || '').toLowerCase();
          const regMatch = email ? registrationByEmail.get(email) : null;
          
          // Front-end safeguard: Exclude Admin accounts from the table
          if (userData.role === 'admin' || userData.isAdmin || userData.email === 'admin@gmail.com') {
              return null;
          }

          const payment = item.payment || regMatch?.payment || {};
          
          // Normalize Payment Status safely to match dropdown string
          let pStatus = payment.paymentStatus || payment.status || item.status || 'Pending';
          if (pStatus === true || String(pStatus).toLowerCase() === 'paid') pStatus = 'Paid';
          else if (String(pStatus).toLowerCase() === 'failed') pStatus = 'Failed';
          else pStatus = 'Pending';

          // ensure selectedEvents always array of objects with `name`
          const evtsRaw = Array.isArray(item.selectedEvents) && item.selectedEvents.length > 0
            ? item.selectedEvents
            : (Array.isArray(regMatch?.selectedEvents) && regMatch.selectedEvents.length > 0
              ? regMatch.selectedEvents
              : toEventArray(item.events));
          const normalizedEvents = evtsRaw.map(e => {
            const display = getEventDisplayName(e);
            return { name: display };
          });

          return {
            // Keep registration id if present, else fallback to userId or temp id
            _id: regMatch?.id || regMatch?._id || item.id || item._id || undefined,
            // Flattened user fields used across the component
            name: userData.name || userData.fullName || userData.firstName || (item.userId ? String(item.userId).split('@')[0] : ''),
            pid: userData.participantId || userData.pid || item.pid || '-',
            email: userData.email || item.userId || '',
            phone: userData.phone || userData.mobile || '',
            // Properly extract department from nested user object
            department: userData.department || userData.dept || item.department || 'Unknown',
            year: userData.year || item.year || '',
            college: userData.college || item.college || '',

            // Events and payment
            selectedEvents: normalizedEvents,
            paymentAmount: payment.amount || item.amount || item.paymentAmount || 0,
            paymentStatus: pStatus,
            transactionId: payment.transactionId || payment.paymentId || item.transactionId || item.razorpayPaymentId || 'N/A',

            // Attendance and date
            attendance: regMatch?.attendance || item.attendance || { day1: false, day2: false, day3: false },
            createdAt: regMatch?.registeredOn || item.createdAt || item.registeredOn || userData.createdAt || null,
          };
        }).filter(Boolean); // Filters out the nulls (admins)

        const attendanceData = registrationRows.map(item => {
          const userData = item.user || item.userData || {};
          if (userData.role === 'admin' || userData.isAdmin || userData.email === 'admin@gmail.com') {
            return null;
          }

          const payment = item.payment || {};
          let pStatus = payment.paymentStatus || payment.status || item.status || 'Pending';
          if (pStatus === true || String(pStatus).toLowerCase() === 'paid') pStatus = 'Paid';
          else if (String(pStatus).toLowerCase() === 'failed') pStatus = 'Failed';
          else pStatus = 'Pending';

          const evtsRaw = Array.isArray(item.selectedEvents) ? item.selectedEvents : [];
          const normalizedEvents = evtsRaw.map(e => ({ name: getEventDisplayName(e) }));

          return {
            _id: item._id || item.id || undefined,
            name: userData.name || userData.fullName || userData.firstName || '',
            pid: userData.participantId || userData.pid || item.pid || '-',
            email: userData.email || item.contactEmail || '',
            phone: userData.phone || userData.mobile || '',
            department: userData.department || userData.dept || item.department || 'Unknown',
            year: userData.year || item.year || '',
            college: userData.college || item.college || '',
            selectedEvents: normalizedEvents,
            paymentAmount: payment.amount || 0,
            paymentStatus: pStatus,
            transactionId: payment.transactionId || 'N/A',
            attendance: item.attendance || { day1: false, day2: false, day3: false },
            createdAt: item.registeredOn || item.createdAt || userData.createdAt || null,
          };
        }).filter(Boolean);

        setAttendees(enhancedData);
        setAttendanceRows(attendanceData);
        setStats(mainRes.data.stats || {});

        const dataDepts = [...new Set(enhancedData.map(item => item.department).filter(Boolean))];
        const allDepts = [...new Set([...ALL_DEPARTMENTS, ...dataDepts])];
        setDepartments(allDepts);
        
        // Always show full conference catalog (19 events) + include any DB-only names for compatibility.
        const actualEventNames = Array.from(
          new Set(
            enhancedData
              .flatMap((item) => item.selectedEvents || [])
              .map((e) => getEventDisplayName(e))
              .filter(Boolean)
          )
        );
        const mergedEventNames = Array.from(
          new Set([...(CONFERENCE_EVENT_NAMES || []), ...actualEventNames])
        );
        setEvents(mergedEventNames);

        setLoading(false); // core data ready, let UI hydrate immediately

        const extraRequests = await Promise.allSettled([
          axios.get('http://localhost:5200/conference/api/admin/active-users?minutes=30', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5200/conference/api/admin/analytics/department', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5200/conference/api/admin/analytics/events', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const [activeRes, deptRes, eventRes] = extraRequests;

        if (activeRes.status === 'fulfilled') {
          setActiveUsers(activeRes.value.data.users || []);
        } else {
          console.error("Active users error:", activeRes.reason);
          setActiveUsers([]);
        }

        if (deptRes.status === 'fulfilled') {
          setDeptAnalytics(deptRes.value.data || {});
        } else {
          console.error("Dept analytics error:", deptRes.reason);
          setDeptAnalytics({});
        }

        if (eventRes.status === 'fulfilled') {
          setEventAnalytics(eventRes.value.data || {});
        } else {
          console.error("Event analytics error:", eventRes.reason);
          setEventAnalytics({});
        }
      } catch (error) {
        console.error("Error fetching admin data", error);
        setLoading(false);
      }
    };

    checkAuthAndFetch();
    const interval = setInterval(checkAuthAndFetch, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Filtering Logic
  const getFilteredDataFrom = (input, options = {}) => {
    const { hideInactive = false } = options;
    let data = input;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(user =>
        (user.name && user.name.toLowerCase().includes(lowerSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
        (user.pid && user.pid.toLowerCase().includes(lowerSearch)) ||
        (user.transactionId && user.transactionId.toLowerCase().includes(lowerSearch))
      );
    }

    if (selectedDept !== 'All') {
      data = data.filter(user => user.department === selectedDept);
    }

    if (selectedStatus !== 'All') {
      data = data.filter(user => user.paymentStatus === selectedStatus);
    }
    
    if (!selectedEvents.includes('All') && selectedEvents.length > 0) {
      const selectedEventKeys = selectedEvents.map(normalizeEventName);
      data = data.filter(user => 
        user.selectedEvents?.some(e => selectedEventKeys.includes(normalizeEventName(e.name)))
      );
    }

    if (selectedEventCount !== 'All') {
      if (selectedEventCount === 'none') {
        data = data.filter(user => !user.selectedEvents || user.selectedEvents.length === 0);
      } else {
        const count = parseInt(selectedEventCount);
        data = data.filter(user => user.selectedEvents?.length === count);
      }
    }

    if (hideInactive) {
      data = data.filter(user => isUserActive(user));
    }

    return data;
  };

  const displayData = getFilteredDataFrom(attendees, { hideInactive: true });
  const attendanceDisplayData = getFilteredDataFrom(attendanceRows, { hideInactive: true });

  // Filter dropdown events
  const filteredDropdownEvents = events.filter(ev => {
    if (!ev || typeof ev !== 'string') return false; // skip null/undefined/non-string
    const term = eventSearchTerm ? eventSearchTerm.toLowerCase() : '';
    return ev.toLowerCase().includes(term);
  });

  const dbStatusRows = attendees.map(user => ({
    ...user,
    status: getUserStatusValue(user)
  }));

  const dbStatusDisplayData = dbStatusRows.filter(user => {
    if (dbStatusFilter !== 'All' && user.status.toLowerCase() !== dbStatusFilter.toLowerCase()) {
      return false;
    }
    if (!dbSearchTerm) {
      return true;
    }
    const lower = dbSearchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(lower)) ||
      (user.email && user.email.toLowerCase().includes(lower)) ||
      (user.department && user.department.toLowerCase().includes(lower))
    );
  });

  const dbStatusSummary = {
    active: dbStatusRows.filter(user => user.status === 'active').length,
    inactive: dbStatusRows.filter(user => user.status === 'inactive').length,
  };

  // Attendance Toggle (just update local state; save later)
  const handleAttendanceToggle = (userId, day) => {
    const updatedAttendees = attendanceRows.map(att => {
        if (att._id === userId) {
            const currentStatus = att.attendance?.[day] || false;
            return {
                ...att,
                attendance: { ...att.attendance, [day]: !currentStatus }
            };
        }
        return att;
    });
    setAttendanceRows(updatedAttendees);
  };

  // Save all attendance changes in one request
  const handleSaveAttendance = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      // build updates list
      const updates = attendanceRows.map(u => ({
        registrationId: u._id,
        attendance: u.attendance || { day1: false, day2: false, day3: false }
      }));
      await axios.post('http://localhost:5200/conference/api/admin/attendance/bulk',
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Attendance saved successfully');
    } catch (err) {
      console.error('Bulk save attendance failed', err);
      alert('Failed to save attendance');
    }
  };

  // Exports
  const handleExportAttendance = () => {
    const dataToExport = attendanceDisplayData.map(user => ({
      "Name": user.name,
      "Email": user.email,
      "Department": user.department,
      "Phone": user.phone,
      "Events Registered": user.selectedEvents?.length || 0,
      "Day 1 (Mar 25)": user.attendance?.day1 ? 'Present' : 'Absent',
      "Day 2 (Mar 26)": user.attendance?.day2 ? 'Present' : 'Absent',
      "Day 3 (Mar 27)": user.attendance?.day3 ? 'Present' : 'Absent',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    XLSX.writeFile(workbook, `NEC_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExport = async () => {
    let dataToExport = displayData;
    let sheetName = "Registrations";
    let filename = `NEC_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    const formattedExport = dataToExport.map(user => ({
      "Name": user.name,
      "PID": user.pid || '-',
      "Email": user.email,
      "Phone": user.phone,
      "Department": user.department,
      "Year": user.year,
      "College": user.college,
      "Events": user.selectedEvents?.map(e => e.name).join(', ') || 'None',
      "Amount (₹)": user.paymentAmount || 0,
      "Status": user.paymentStatus,
      "Transaction ID": user.transactionId || 'N/A',
      "Registered On": user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  };

  const handleSendPaymentReminders = async () => {
    try {
      setEmailLoading(true);
      setEmailMessage(null);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'http://localhost:5200/conference/api/admin/send-payment-reminders',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sent = Number(response?.data?.emailsSent || 0);
      const errors = Number(response?.data?.errorsCount || 0);
      setEmailMessage({
        type: errors > 0 ? 'error' : 'success',
        text: errors > 0
          ? `Sent ${sent} reminder emails, ${errors} failed.`
          : `Sent ${sent} reminder emails.`
      });
    } catch (error) {
      setEmailMessage({ type: 'error', text: `❌ Failed to send emails.` });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogout = async () => {
    isLoggingOut.current = true;
    await logout();
    sessionStorage.clear();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    // Redirect to home page immediately
    navigate('/', { replace: true });
  };

  const totalRevenue = stats.totalRevenue || 0;
  const paidCount = stats.registered || 0;
  const activeNow = stats.activeNow || 0;
  const pendingPayment = stats.pendingPayment || 0;
  const paymentFailed = stats.paymentFailed || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05020a] text-white flex items-center justify-center font-['Orbitron']">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-purple-300">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05020a] text-white pt-10 pb-12 px-4 sm:px-6 font-['Orbitron'] relative overflow-x-hidden text-sm sm:text-base">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-purple-500/20 pb-6 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Shield className="text-purple-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1 tracking-wider">
              ADMIN DASHBOARD
            </h1>
            <p className="text-purple-300 text-xs tracking-widest uppercase">
              Conference Management System
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-2 rounded-full hover:bg-red-500/20 transition-all font-bold text-xs tracking-wider shadow-lg hover:shadow-red-900/20 whitespace-nowrap"
        >
          <LogOut size={15} /> LOGOUT
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 px-4 lg:px-0">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers || 0} color="blue" />
        <StatCard icon={<Eye className="w-6 h-6" />} label="Active Now" value={activeNow} color="green" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Paid" value={paidCount} color="pink" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="purple" />
      </div>


      <div className="relative z-10 w-full space-y-8 px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-shrink-0 w-full lg:w-72">
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-purple-300">Menu</p>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg border border-purple-500/30 bg-white/5 text-white hover:bg-white/10 transition-all"
              >
                <Menu size={20} />
                <span className="sr-only">Open admin menu</span>
              </button>
            </div>
            <div className="hidden lg:block">
              <div className="max-h-[calc(100vh-5rem)] overflow-y-auto pb-4">
                <AdminTabList
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  className="w-full bg-[#12051f]/80 border border-purple-500/20 rounded-2xl p-4 shadow-2xl sticky lg:top-24"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-8">

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="relative z-10 w-full space-y-8">
          {emailMessage && (
            <div className={`p-4 rounded-lg border ${emailMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <p className="text-sm font-bold">{emailMessage.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard label="Pending Payment" value={pendingPayment} color="yellow" />
            <StatusCard label="Payment Failed" value={paymentFailed} color="red" />
            <StatusCard label="Paid ✓" value={paidCount} color="green" />
          </div>

          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Mail className="text-blue-400" size={24} />
              Send Payment Reminders
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <p className="text-gray-300 text-sm flex-1">
                Send email reminders to {pendingPayment} users with pending payments to complete their registration.
              </p>
              <button
                onClick={handleSendPaymentReminders}
                disabled={emailLoading || pendingPayment === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-lg shadow-lg transition-all whitespace-nowrap"
              >
                {emailLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Mail size={16} /> Send Reminders</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE USERS TAB */}
      {activeTab === 'active-users' && (
        <div className="relative z-10 w-full">
          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Eye className="text-green-400" size={24} />
              Users Active in Last 30 Minutes
            </h2>

            {activeUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No active users at the moment
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-purple-500/30">
                    <tr className="text-purple-300">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Last Login</th>
                      <th className="text-left py-3 px-4">Login Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((user, idx) => (
                      <tr
                        key={`${user.email || user._id || 'active'}-${idx}`}
                        className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300">{user.department}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-green-400 font-bold">{user.loginCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="relative z-10 w-full space-y-8">
          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Department-wise Analytics</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple-500/30">
                  <tr className="text-purple-300">
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-center py-3 px-4">Total</th>
                    <th className="text-center py-3 px-4">Paid</th>
                    <th className="text-center py-3 px-4">Pending</th>
                    <th className="text-center py-3 px-4">Failed</th>
                    <th className="text-center py-3 px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(deptAnalytics).map(([dept, data]) => (
                    <tr key={dept} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{dept}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{data.total}</td>
                      <td className="py-3 px-4 text-center text-green-400 font-bold">{data.paid}</td>
                      <td className="py-3 px-4 text-center text-yellow-400">{data.pending}</td>
                      <td className="py-3 px-4 text-center text-red-400">{data.failed}</td>
                      <td className="py-3 px-4 text-center text-purple-400 font-bold">₹{(data.totalRevenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Event-wise Analytics</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple-500/30">
                  <tr className="text-purple-300">
                    <th className="text-left py-3 px-4">Event</th>
                    <th className="text-center py-3 px-4">Registrations</th>
                    <th className="text-center py-3 px-4">Paid</th>
                    <th className="text-center py-3 px-4">Pending</th>
                    <th className="text-center py-3 px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(eventAnalytics).map(([event, data]) => (
                    <tr key={event} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{event}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{data.total}</td>
                      <td className="py-3 px-4 text-center text-green-400 font-bold">{data.paid}</td>
                      <td className="py-3 px-4 text-center text-yellow-400">{data.pending}</td>
                      <td className="py-3 px-4 text-center text-purple-400 font-bold">₹{(data.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE STATUS TAB */}
      {activeTab === 'db-status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard label="Active Records" value={dbStatusSummary.active} color="green" />
            <StatusCard label="Inactive Records" value={dbStatusSummary.inactive} color="red" />
            <StatCard icon={<Users className="w-6 h-6" />} label="Total Database" value={dbStatusRows.length} color="pink" />
          </div>

          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-[11px] text-purple-200 uppercase tracking-widest block mb-1">Search Records</label>
                <input
                  type="text"
                  placeholder="Name, email, department..."
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                  value={dbSearchTerm}
                  onChange={(e) => setDbSearchTerm(e.target.value)}
                />
              </div>
              <div className="sm:w-40">
                <label className="text-[11px] text-purple-200 uppercase tracking-widest block mb-1">Status View</label>
                <select
                  value={dbStatusFilter}
                  onChange={(e) => setDbStatusFilter(e.target.value)}
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Viewing <strong className="text-white">{dbStatusDisplayData.length}</strong> of <strong className="text-white">{dbStatusRows.length}</strong> records.
            </p>
          </div>

          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl overflow-hidden relative w-full">
            <h3 className="text-lg font-bold mb-4 text-purple-200">Database Content</h3>
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] px-1">
              <table className="w-full min-w-[1100px] lg:min-w-[1300px] text-[11px] sm:text-sm table-auto">
                <thead className="text-purple-200 border-b border-purple-500/30">
                  <tr>
                    <th className="text-left py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Name</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">PID</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Email</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Dept</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Count</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Events Registered</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Amount</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Status</th>
                    <th className="text-center py-3 px-3 sm:px-4 font-orbitron uppercase text-[10px] sm:text-[11px] tracking-[0.3em] whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStatusDisplayData.map((user, idx) => (
                    <tr
                      key={`${user._id || user.email || 'status'}-${idx}`}
                      className="border-b border-purple-500/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4 font-orbitron font-semibold text-white tracking-[0.2em]">{user.name || 'Unknown'}</td>
                      <td className="py-3 px-3 sm:px-4 font-mono text-cyan-200 tracking-[0.2em]">{user.pid || '—'}</td>
                      <td className="py-3 px-3 sm:px-4 font-mono text-cyan-300 break-words tracking-[0.1em]">{user.email || '-'}</td>
                      <td className="py-3 px-3 sm:px-4 font-orbitron text-purple-200 tracking-[0.2em]">{user.department}</td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-blue-500/40 text-blue-200 font-orbitron text-sm">
                          {(user.selectedEvents || []).length}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex flex-col gap-2 w-full">
                          {(user.selectedEvents || []).map((evt, evIdx) => (
                            <div
                              key={evIdx}
                              className="flex items-start gap-3 px-4 py-2.5 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-[#1a0420] to-[#1c0435] text-sm text-purple-100 shadow-inner w-full"
                            >
                              <span className="h-2 w-2 rounded-full bg-pink-400 mt-1 shrink-0" />
                              <span className="leading-snug text-[13px] font-orbitron">{evt.name}</span>
                            </div>
                          ))}
                          {(user.selectedEvents || []).length === 0 && (
                            <span className="text-red-400 text-xs italic">No events selected</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="text-[11px] font-orbitron font-semibold px-3 py-1 rounded-full border border-purple-500 text-purple-200 bg-purple-500/5">
                          ₹{user.paymentAmount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className={`text-[11px] font-orbitron font-semibold px-3 py-1 rounded-full border ${
                          user.paymentStatus === 'Paid'
                            ? 'border-green-400 text-green-300 bg-green-500/10'
                            : user.paymentStatus === 'Failed'
                              ? 'border-red-400 text-red-300 bg-red-500/10'
                              : 'border-yellow-400 text-yellow-300 bg-yellow-500/10'
                        }`}>
                          {user.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className={`text-[11px] font-orbitron font-semibold px-3 py-1 rounded-full border ${
                          user.status === 'active'
                            ? 'border-green-400 text-green-300 bg-green-500/10'
                            : 'border-red-400 text-red-300 bg-red-500/10'
                        }`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`text-[11px] font-semibold tracking-widest px-3 py-1.5 rounded-full border transition ${
                            user.status === 'active'
                              ? 'text-red-300 border-red-400 hover:bg-red-500/20 hover:border-red-300'
                              : 'text-green-300 border-green-400 hover:bg-green-500/20 hover:border-green-300'
                          }`}
                        >
                          {user.status === 'active' ? 'Mark Inactive' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dbStatusDisplayData.length === 0 && (
              <div className="text-center py-10 text-gray-500 italic">No records match the current filters.</div>
            )}
          </div>
        </div>
      )}

      {/* REGISTRATIONS TAB (REPORTS) */}
      {activeTab === 'reports' && (
        <div className="relative z-10 w-full space-y-8">
          
          {/* Export Controls */}
          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl relative z-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Filter size={20} /> Export & Filter Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">Search</label>
                <input
                  type="text"
                  placeholder="Name, email, PID..."
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-pink-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">Department</label>
                <select
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">Status</label>
                <select
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* --- CUSTOM EVENTS FILTER --- */}
              <div className="relative" ref={eventsRef}>
                <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">
                  Filter by Events
                </label>
                
                <button
                  type="button"
                  onClick={() => setEventsOpen(prev => !prev)}
                  className="w-full text-left bg-[#0a0412] border border-purple-500/30 hover:border-purple-500/60 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer flex items-center justify-between transition-all shadow-sm"
                >
                  <span className="truncate font-medium text-white block w-full pr-2 text-sm">
                    {selectedEvents.includes('All') 
                      ? 'All Events Selected' 
                      : `${selectedEvents.length} Event${selectedEvents.length > 1 ? 's' : ''} Selected`}
                  </span>
                  <span className={`text-purple-400 text-xs ml-auto transition-transform duration-200 ${eventsOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} />
                  </span>
                </button>

                {/* Dropdown Menu */}
                {eventsOpen && (
                  <div
                    className="absolute z-[100] mt-1 left-0 w-[300px] bg-[#0a0412] border border-purple-500/50 rounded-lg shadow-2xl flex flex-col max-h-[300px] overflow-hidden"
                  >
                    {/* Search inside Dropdown */}
                    <div className="p-2 border-b border-purple-500/20 bg-[#1a0b2e]">
                      <div className="relative">
                        <Search className="absolute left-2 top-2 text-gray-400 w-3 h-3" />
                        <input
                          type="text"
                          placeholder="Find event..."
                          className="w-full bg-[#05020a] border border-purple-500/30 text-white pl-7 pr-2 py-1.5 rounded text-xs focus:border-pink-500 outline-none"
                          onClick={(e) => e.stopPropagation()} 
                          value={eventSearchTerm}
                          onChange={(e) => setEventSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto custom-scrollbar p-1">
                      {/* 'All Events' Option */}
                      <label className="flex items-center gap-2 px-2 py-2 hover:bg-purple-600/20 rounded cursor-pointer transition-colors mb-1">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedEvents.includes('All') ? 'bg-pink-600 border-pink-600' : 'border-gray-600'}`}>
                          {selectedEvents.includes('All') && <Check size={12} className="text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes('All')}
                          onChange={() => setSelectedEvents(['All'])}
                          className="hidden"
                        />
                        <span className="text-xs font-bold text-white">Select All Events</span>
                      </label>

                      <div className="h-[1px] bg-purple-500/20 my-1 mx-2"></div>

                      {/* Individual Events */}
                      {filteredDropdownEvents.map((ev) => (
                        <label key={ev} className="flex items-start gap-2 px-2 py-2 hover:bg-purple-600/10 rounded cursor-pointer transition-colors group">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                            selectedEvents.includes(ev) 
                              ? 'bg-purple-600 border-purple-600 group-hover:bg-purple-500' 
                              : 'border-gray-600 group-hover:border-purple-400'
                          }`}>
                            {selectedEvents.includes(ev) && <Check size={12} className="text-white" />}
                          </div>
                          
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(ev)}
                            onChange={() => {
                              setSelectedEvents(prev => {
                                if (prev.includes('All')) {
                                  if (ev === 'All') return ['All'];
                                  return [ev];
                                }
                                if (prev.includes(ev)) {
                                  const next = prev.filter(x => x !== ev);
                                  return next.length === 0 ? ['All'] : next;
                                }
                                return [...prev, ev];
                              });
                            }}
                            className="hidden"
                          />
                          <span className={`text-xs leading-snug break-words w-full ${selectedEvents.includes(ev) ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {ev}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Count Filter */}
              <div>
                <label className="text-xs text-purple-300 uppercase tracking-widest block mb-2 font-bold">Count</label>
                <select
                  className="w-full bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:border-pink-500 outline-none text-sm cursor-pointer"
                  value={selectedEventCount}
                  onChange={(e) => setSelectedEventCount(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="none">0</option>
                  {Array.from({ length: 19 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <div className="flex items-end lg:col-span-2">
                <button
                  onClick={handleExport}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-2 px-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] text-sm tracking-wide"
                >
                  <Download size={16} /> EXPORT
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-4">
              <span>📊 Records Found: <strong className="text-white">{displayData.length}</strong></span>
            </p>
          </div>

          {/* Registrations Table */}
          {/* ✅ z-0 ensures this stays below the floating dropdown */}
          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl overflow-hidden relative z-0">
            <h3 className="text-lg font-bold mb-4 text-purple-200">Registrations List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="border-b border-purple-500/30">
                  <tr className="text-purple-300">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">PID</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Dept</th>
                    <th className="text-center py-3 px-4">Count</th>
                    <th className="text-left py-3 px-4 min-w-[400px]">Events Registered</th>
                    <th className="text-center py-3 px-4">Amount</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* FIXED: Removed the .slice() limit. The entire table data will show now. */}
                  {displayData.map((user, idx) => {
                    const eventCount = user.selectedEvents?.length || 0;
                    return (
                      <tr
                        key={`${user._id || user.email || user.pid || 'reg'}-${idx}`}
                        className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                      >
                        
                        {/* Name */}
                        <td className="py-4 px-4 font-medium text-white align-top">
                          {user.name}
                        </td>

                        {/* PID */}
                        <td className="py-4 px-4 text-cyan-300 font-mono align-top">
                          {user.pid || '-'}
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-gray-300 align-top">
                          {user.email}
                        </td>

                        {/* Dept */}
                        <td className="py-4 px-4 text-gray-400 align-top">
                          {user.department}
                        </td>

                        {/* Count Badge */}
                        <td className="py-4 px-4 text-center align-top">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border ${
                            eventCount === 0 
                              ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                              : 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                          }`}>
                            {eventCount}
                          </span>
                        </td>

                        {/* Events Column */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-2">
                            {user.selectedEvents && user.selectedEvents.length > 0 ? (
                              user.selectedEvents.map((e, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-[#2a1b3d] border border-purple-500/30 text-purple-100 px-3 py-2 rounded-lg text-xs shadow-sm flex items-start gap-2 hover:bg-[#35224d] transition-colors"
                                >
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                  <span className="leading-snug">
                                    {e.name}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-red-400 text-xs italic">No events selected</span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-center text-purple-300 font-mono align-top">
                          ₹{user.paymentAmount || 0}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center align-top">
                          <StatusBadge status={user.paymentStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Show message if empty */}
            {displayData.length === 0 && (
                <div className="text-center py-10 text-gray-500 italic">No registrations found matching the current filters.</div>
            )}
          </div>
        </div>
      )}

      {/* QR SCANNER TAB */}
      {activeTab === 'qr-scanner' && <QrScannerPanel />}

      {/* --- ATTENDANCE TAB --- */}
      {activeTab === 'attendance' && (
        <div className="relative z-10 w-full space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-[#130720]/80 border border-purple-500/20 p-4 rounded-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <CalendarCheck className="text-green-400" /> Attendance Marking
            </h3>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Filter name/email..."
                className="bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-pink-500 text-sm w-full max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={handleExportAttendance}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg min-w-[150px] justify-center"
              >
                <Download size={16} /> Export Attendance
              </button>
              <button
                onClick={handleSaveAttendance}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg min-w-[150px] justify-center"
              >
                Save Attendance
              </button>
            </div>
          </div>

          <div className="bg-[#130720]/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-2xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple-500/30">
                  <tr className="text-purple-300">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Dept</th>
                    <th className="text-center py-3 px-4">Day 1 <br/><span className="text-[10px]">Mar 25 (Pre)</span></th>
                    <th className="text-center py-3 px-4">Day 2 <br/><span className="text-[10px]">Mar 26 (Main)</span></th>
                    <th className="text-center py-3 px-4">Day 3 <br/><span className="text-[10px]">Mar 27 (Main)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* FIXED: Also shows all rows in Attendance tab */}
                  {attendanceDisplayData.map((user, idx) => (
                    <tr key={idx} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.department}</td>
                      
                      {['day1', 'day2', 'day3'].map(day => (
                        <td key={day} className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleAttendanceToggle(user._id, day)}
                            className={`p-2 rounded-lg transition-all shadow-md flex items-center justify-center mx-auto w-10 h-10 border ${
                              user.attendance?.[day]
                                ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
                                : 'bg-gray-800/50 border-gray-600 text-gray-500 hover:bg-gray-700'
                            }`}
                            title={`Toggle ${day}`}
                          >
                            {user.attendance?.[day] ? <Check size={18} strokeWidth={3} /> : <X size={18} />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {attendanceDisplayData.length === 0 && (
                <div className="text-center py-10 text-gray-500">No attendees match your search.</div>
            )}
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[1050] flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative z-[1060] h-full w-[260px] bg-gradient-to-b from-[#5a0c91] to-[#25002f] shadow-2xl border-l border-white/10 flex flex-col">
            <div className="px-5 py-6 border-b border-white/10 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-white/70">Menu</p>
                  <h3 className="text-xl font-bold tracking-wide leading-tight">NEC Conference</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white hover:text-purple-200"
                >
                  <X size={24} />
                  <span className="sr-only">Close admin menu</span>
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/60">Conference Control Center</p>
            </div>
            <div className="px-5 py-6 space-y-3 flex-1">
              <AdminTabList
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onAfterSelect={() => setIsSidebarOpen(false)}
                className="space-y-3"
              />
            </div>
            <div className="px-5 pb-8 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-pink-500 text-white text-sm font-semibold uppercase tracking-[0.2em] py-3 hover:bg-pink-400 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
