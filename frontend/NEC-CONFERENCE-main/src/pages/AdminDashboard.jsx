import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useConference } from '../context/ConferenceContext';
import { 
  Download, Users, DollarSign, LogOut, CheckCircle, Clock, Loader2, 
  Shield, XCircle, BarChart3, TrendingUp, Eye, Filter, Mail, CalendarCheck, Check, X, Search, ChevronDown 
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
        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
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
  
  const [emailLoading, setEmailLoading] = useState(false);
  const[emailMessage, setEmailMessage] = useState(null);
  
  const [eventsOpen, setEventsOpen] = useState(false);
  const eventsRef = useRef(null);
  const isLoggingOut = useRef(false);

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
          return { data: { registrations:[], stats: {} } };
        });

        const rawData = mainRes.data.transactions || mainRes.data.registrations ||[];

        // Normalize/flatten backend registration objects so frontend can read fields like
        // `user.name`, `user.email`, `user.paymentAmount`, `user.paymentStatus`, etc.
        const enhancedData = rawData.map(item => {
          // Extract user data - could be nested as item.user or item.userData
          const userData = item.user || item.userData || {};
          
          // Front-end safeguard: Exclude Admin accounts from the table
          if (userData.role === 'admin' || userData.isAdmin || userData.email === 'admin@gmail.com') {
              return null;
          }

          const payment = item.payment || {};
          
          // Normalize Payment Status safely to match dropdown string
          let pStatus = payment.paymentStatus || payment.status || item.status || 'Pending';
          if (pStatus === true || String(pStatus).toLowerCase() === 'paid') pStatus = 'Paid';
          else if (String(pStatus).toLowerCase() === 'failed') pStatus = 'Failed';
          else pStatus = 'Pending';

          // ensure selectedEvents always array of objects with `name`
          const evtsRaw = Array.isArray(item.selectedEvents) && item.selectedEvents.length > 0
            ? item.selectedEvents
            : toEventArray(item.events);
          const normalizedEvents = evtsRaw.map(e => {
            const display = getEventDisplayName(e);
            return { name: display };
          });

          return {
            // Keep registration id if present, else fallback to userId or temp id
            _id: item.id || item._id || item.userId || (userData.id ? userData.id : undefined),
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
            attendance: item.attendance || { day1: false, day2: false, day3: false },
            createdAt: item.createdAt || item.registeredOn || userData.createdAt || null,
          };
        }).filter(Boolean); // Filters out the nulls (admins)

        setAttendees(enhancedData);
        setStats(mainRes.data.stats || {});

        const dataDepts = [...new Set(enhancedData.map(item => item.department).filter(Boolean))];
        const allDepts = [...new Set([...ALL_DEPARTMENTS, ...dataDepts])];
        setDepartments(allDepts);
        
        // Always show full conference catalog (19 events) + include any DB-only names for compatibility.
        const actualEventNames = Array.from(
          new Set(
            enhancedData
              .flatMap((item) => item.selectedEvents ||[])
              .map((e) => getEventDisplayName(e))
              .filter(Boolean)
          )
        );
        const mergedEventNames = Array.from(
          new Set([...(CONFERENCE_EVENT_NAMES || []), ...actualEventNames])
        );
        setEvents(mergedEventNames);

        const activeRes = await axios.get('http://localhost:5200/conference/api/admin/active-users?minutes=30', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error("Active users error:", err);
          return { data: { users:[] } };
        });
        setActiveUsers(activeRes.data.users ||[]);

        const deptRes = await axios.get('http://localhost:5200/conference/api/admin/analytics/department', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error("Dept analytics error:", err);
          return { data: {} };
        });
        setDeptAnalytics(deptRes.data || {});

        const eventRes = await axios.get('http://localhost:5200/conference/api/admin/analytics/events', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error("Event analytics error:", err);
          return { data: {} };
        });
        setEventAnalytics(eventRes.data || {});

        setLoading(false);
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
  const getFilteredData = () => {
    let data = attendees;

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

    return data;
  };

  const displayData = getFilteredData();

  // Filter dropdown events
  const filteredDropdownEvents = events.filter(ev => {
    if (!ev || typeof ev !== 'string') return false; // skip null/undefined/non-string
    const term = eventSearchTerm ? eventSearchTerm.toLowerCase() : '';
    return ev.toLowerCase().includes(term);
  });

  // Attendance Toggle (just update local state; save later)
  const handleAttendanceToggle = (userId, day) => {
    const updatedAttendees = attendees.map(att => {
        if (att._id === userId) {
            const currentStatus = att.attendance?.[day] || false;
            return {
                ...att,
                attendance: { ...att.attendance, [day]: !currentStatus }
            };
        }
        return att;
    });
    setAttendees(updatedAttendees);
  };

  // Save all attendance changes in one request
  const handleSaveAttendance = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      // build updates list
      const updates = attendees.map(u => ({
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
    const dataToExport = displayData.map(user => ({
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
    <div className="min-h-screen bg-[#05020a] text-white pt-10 pb-12 px-4 sm:px-6 font-['Orbitron'] relative overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-pink-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-purple-500/20 pb-6">
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
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers || 0} color="blue" />
        <StatCard icon={<Eye className="w-6 h-6" />} label="Active Now" value={activeNow} color="green" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Paid" value={paidCount} color="pink" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="purple" />
      </div>

      {/* Tab Navigation */}
      <div className="relative z-10 max-w-7xl mx-auto mb-8 flex gap-2 border-b border-purple-500/20 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
          { id: 'active-users', label: 'Active Users', icon: <Eye size={18} /> },
          { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
          { id: 'reports', label: 'Registrations', icon: <Download size={18} /> },
          { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                : 'text-gray-400 hover:text-purple-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
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
        <div className="relative z-10 max-w-7xl mx-auto">
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
                      <tr key={idx} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
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
        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
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

      {/* REGISTRATIONS TAB (REPORTS) */}
      {activeTab === 'reports' && (
        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          
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
                      <tr key={idx} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                        
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

      {/* --- ATTENDANCE TAB --- */}
      {activeTab === 'attendance' && (
        <div className="relative z-10 max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-[#130720]/80 border border-purple-500/20 p-4 rounded-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <CalendarCheck className="text-green-400" /> Attendance Marking
            </h3>
            <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Filter name/email..."
                  className="bg-[#0a0412] border border-purple-500/30 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-pink-500 text-sm w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={handleExportAttendance}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg"
                >
                  <Download size={16} /> Export Attendance
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg"
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
                  {displayData.map((user, idx) => (
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
            {displayData.length === 0 && (
                <div className="text-center py-10 text-gray-500">No attendees match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
