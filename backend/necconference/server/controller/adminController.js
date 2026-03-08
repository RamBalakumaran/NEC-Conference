const UserData = require("../model/User"); 
const Registration = require("../model/Registration");
const ActionLog = require('../model/ActionLog'); 
const ExcelJS = require('exceljs');
const { sendRegistrationReminderEmail } = require('../config/email');
const { Op } = require('sequelize');
const { sequelize } = require('../model');
const { assignParticipantIdToUser } = require('../service/participantIdService');
const { paymentModel } = require('../model/paymentModel');

const eventNameOf = (ev) => (typeof ev === 'string' ? ev : (ev?.name || ev?.title || null));
const normalizeEventNames = (values) => {
    const items = Array.isArray(values) ? values : [];
    return Array.from(
        new Set(
            items
                .map((ev) => eventNameOf(ev) || String(ev || '').trim())
                .filter(Boolean)
        )
    );
};
const parseQrEvents = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return normalizeEventNames(value);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.includes('|')) {
            return normalizeEventNames(trimmed.split('|'));
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return normalizeEventNames(parsed);
        } catch {}
        return normalizeEventNames([trimmed]);
    }
    return [];
};
const canonicalPaymentStatus = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (value === true || normalized === 'paid' || normalized === 'captured') return 'Paid';
    if (normalized === 'failed') return 'Failed';
    return 'Pending';
};
const parsePaymentEvents = (value) => {
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
const paymentStatusToRegistrationStatus = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'paid') return 'Paid';
    if (normalized === 'failed') return 'Failed';
    return 'Pending';
};

const parseQrPayload = (qrText) => {
    const raw = String(qrText || '').trim();
    if (!raw) throw new Error('Empty QR payload');
    let data = null;
    try {
        data = JSON.parse(raw);
    } catch {
        // Accept payloads pasted without surrounding braces
        const maybeWrapped = raw.startsWith('{') ? raw : `{${raw}}`;
        try {
            data = JSON.parse(maybeWrapped);
        } catch {
            throw new Error('QR payload is not valid JSON');
        }
    }
    if (!data || typeof data !== 'object') {
        throw new Error('QR payload format not recognized');
    }
    return data;
};

const getPaymentByOrderId = (orderId) =>
    new Promise((resolve) => {
        if (!orderId) return resolve(null);
        paymentModel.getPaymentByOrderId(orderId, (err, row) => {
            if (err) return resolve(null);
            return resolve(row || null);
        });
    });

const getPaymentsByUserId = (userId) =>
    new Promise((resolve) => {
        if (!userId) return resolve([]);
        paymentModel.getPaymentsByUserId(userId, (err, rows) => {
            if (err) return resolve([]);
            return resolve(rows || []);
        });
    });

// --- 1. Get All Registrations (Dashboard Main Data) ---
// --- 1. Get All Registrations & Transactions ---
const getAllRegistrations = async (req, res) => {
    try {
        const { from, to, department, status } = req.query;
        
        // 1. Prepare Filters (For the User View)
        const whereUser = {
            role: { [Op.not]: 'admin' }, 
            email: { [Op.notLike]: '%admin%' } 
        };
        
        // Date Filter
        if (from || to) {
            whereUser.createdAt = {};
            if (from) whereUser.createdAt[Op.gte] = new Date(from);
            if (to) whereUser.createdAt[Op.lte] = new Date(to);
        }
        if (department && department !== 'All') whereUser.department = department;
        
        // 2. Fetch Data
        // A. Get Users (Filtered - No Admins)
        const tableUsers = await UserData.findAll({
            where: whereUser,
            attributes: ['id', 'name', 'email', 'participantId', 'phone', 'department', 'year', 'college', 'role', 'isAdmin', 'createdAt', 'lastLogin'],
            order: [['lastLogin', 'DESC'], ['createdAt', 'DESC']],
            raw: false
        });

        // B. Registrations table (used for user-level/attendance view)
        const allRegistrations = await Registration.findAll({
            include: [{ model: UserData, as: 'user', attributes: ['id','name','email','participantId','phone','department','year','college','role'] }],
            order: [['createdAt', 'DESC']], // Newest first
            raw: true,
            nest: true
        });
        const registrationAttempts = allRegistrations.filter(r =>
            r.user?.role !== 'admin' &&
            !String(r.user?.email || '').includes('admin')
        );

        // C. Payments table (attempt-level list for Paid/Pending/Failed)
        const paymentAttempts = await new Promise((resolve) => {
            paymentModel.getAllPayments((err, rows) => {
                if (err) {
                    console.error("Payment fetch error:", err);
                    return resolve([]);
                }
                return resolve(rows || []);
            });
        });

        const usersByEmail = new Map(
            tableUsers
                .map((u) => u.get({ plain: true }))
                .filter((u) => u?.email)
                .map((u) => [String(u.email).toLowerCase(), u])
        );

        const transactionList = paymentAttempts
            .map((p) => {
                const email = String(p.userId || '').trim();
                const user = usersByEmail.get(email.toLowerCase()) || null;
                if ((user?.role || '').toLowerCase() === 'admin' || email.toLowerCase().includes('admin')) {
                    return null;
                }

                return {
                    id: p.id,
                    userId: email,
                    user: user
                        ? {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            participantId: user.participantId,
                            phone: user.phone,
                            department: user.department,
                            year: user.year,
                            college: user.college,
                            role: user.role
                        }
                        : null,
                    events: parsePaymentEvents(p.events),
                    amount: Number(p.amount || 0),
                    currency: p.currency || 'INR',
                    razorpayOrderId: p.razorpayOrderId || null,
                    razorpayPaymentId: p.razorpayPaymentId || null,
                    transactionId: p.transactionId || null,
                    status: canonicalPaymentStatus(p.status),
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                };
            })
            .filter(Boolean);

        // D. Backfill registrations table from latest payment row when selectedEvents is empty.
        const latestPaymentByEmail = new Map();
        for (const txn of transactionList) {
            const email = String(txn.userId || '').toLowerCase();
            if (!email || latestPaymentByEmail.has(email)) continue;
            latestPaymentByEmail.set(email, txn);
        }

        for (const [email, txn] of latestPaymentByEmail.entries()) {
            const reg = await Registration.findOne({
                where: { contactEmail: email },
                order: [['updatedAt', 'DESC']]
            });
            if (!reg) continue;

            const existingEvents = Array.isArray(reg.selectedEvents) ? reg.selectedEvents : [];
            const paymentEvents = parsePaymentEvents(txn.events);
            if (existingEvents.length > 0 || paymentEvents.length === 0) continue;

            const mergedEvents = paymentEvents
                .map((ev) => eventNameOf(ev) || String(ev || '').trim())
                .filter(Boolean);
            const paymentJson = reg.payment || {};
            await reg.update({
                selectedEvents: mergedEvents,
                status: paymentStatusToRegistrationStatus(txn.status),
                payment: {
                    ...paymentJson,
                    amount: txn.amount ?? paymentJson.amount ?? 0,
                    paymentStatus: paymentStatusToRegistrationStatus(txn.status),
                    transactionId: txn.transactionId || txn.razorpayPaymentId || paymentJson.transactionId || null,
                    date: new Date()
                }
            });
        }

        // 3. Calculate Global Stats
        const totalUsersCount = await UserData.count({ where: { role: { [Op.not]: 'admin' } } });
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const activeUsersCount = await UserData.count({
            where: { 
                lastLogin: { [Op.gte]: thirtyMinsAgo },
                role: { [Op.not]: 'admin' }
            }
        });

        let stats = {
            totalUsers: totalUsersCount,
            activeNow: activeUsersCount,
            registered: 0,
            pendingPayment: 0,
            paymentFailed: 0,
            totalRevenue: 0
        };

        transactionList.forEach((txn) => {
            const pStatus = canonicalPaymentStatus(txn.status);
            const amount = parseFloat(txn.amount || 0);

            if (pStatus === 'Paid') {
                stats.registered++;
                stats.totalRevenue += amount;
            }
            else if (pStatus === 'Failed') {
                stats.paymentFailed++;
            }
            else {
                stats.pendingPayment++;
            }
        });

        // 4. Prepare User-Based View (Merged Data)
        for (const user of tableUsers) {
            try { if (!user?.participantId) await assignParticipantIdToUser(user); } catch (e) {}
        }
        
        const mergedData = tableUsers.map((userRow) => {
            const user = userRow.get({ plain: true });
            
            // Find all attempts for this user
            const userRecords = registrationAttempts.filter(r => 
                (r.user && r.user.id.toString() === user.id.toString()) || 
                (r.userData && r.userData.email === user.email)
            );

            // Sort: Paid first, then latest date
            userRecords.sort((a, b) => {
                const statusA = (a.payment?.paymentStatus === true || String(a.payment?.paymentStatus).toLowerCase() === 'paid') ? 1 : 0;
                const statusB = (b.payment?.paymentStatus === true || String(b.payment?.paymentStatus).toLowerCase() === 'paid') ? 1 : 0;
                return statusB - statusA;
            });

            const userReg = userRecords.length > 0 ? userRecords[0] : null;
            const resolvedPid = user.participantId || userReg?.user?.participantId || '-';
            const paymentStatus = userReg?.payment?.paymentStatus 
                ? (userReg.payment.paymentStatus === true ? 'Paid' : userReg.payment.paymentStatus) 
                : 'Pending';
            
            if (status && status !== 'All' && paymentStatus !== status) return null;
            
            return {
                _id: userReg ? userReg.id : `temp_${user.id}`,
                userId: user.id,
                userData: { ...user, participantId: resolvedPid },
                selectedEvents: userReg?.selectedEvents || [],
                attendance: userReg?.attendance || { day1: false, day2: false, day3: false },
                payment: {
                    amount: userReg?.payment?.amount || 0,
                    paymentStatus: paymentStatus,
                    transactionId: userReg?.payment?.transactionId || 'N/A'
                },
                registeredOn: user.createdAt
            };
        }).filter(Boolean); 
        
        res.status(200).json({
            stats,
            registrations: mergedData,    // User View
            transactions: transactionList, // <--- NEW: Entire Payment Table Data
            total: mergedData.length
        });

    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ message: "Server Error fetching data" });
    }
};

// --- 2. Mark Attendance ---
const markAttendance = async (req, res) => {
    try {
        const { registrationId, day, status } = req.body;

        if (!['day1', 'day2', 'day3'].includes(day)) {
            return res.status(400).json({ message: "Invalid day selected" });
        }

        const regId = String(registrationId || '');
        if (!regId) {
            return res.status(400).json({ message: "registrationId required" });
        }
        if (regId.startsWith('temp_')) {
             return res.status(400).json({ message: "User has not completed registration (No Registration ID)" });
        }

        const updateField = registration => {
            const a = registration.attendance || {};
            a[day] = status;
            return { attendance: a };
        };

        const reg = await Registration.findByPk(regId);
        if (reg) {
            await reg.update(updateField(reg));
        } else {
            throw new Error('Registration not found');
        }

        res.status(200).json({ message: "Attendance updated" });
    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({ message: "Failed to mark attendance" });
    }
};

// --- 2b. Bulk attendance updates ---
const markAttendanceBulk = async (req, res) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: "updates array required" });
        }

        for (const upd of updates) {
            const { registrationId, attendance } = upd;
            const regId = String(registrationId || '');
            if (!regId) continue;
            if (regId.startsWith('temp_')) continue;

            const reg = await Registration.findByPk(regId);
            if (!reg) continue;
            // merge attendance object
            const existing = reg.attendance || {};
            await reg.update({ attendance: { ...existing, ...attendance } });
        }

        res.status(200).json({ message: "Bulk attendance updated" });
    } catch (error) {
        console.error("Bulk attendance error:", error);
        res.status(500).json({ message: "Failed to update attendance" });
    }
};

// --- 3. Get Active Users ---
const getActiveUsers = async (req, res) => {
    try {
        const { minutes = 30 } = req.query;
        const activeThreshold = new Date(Date.now() - minutes * 60 * 1000);
        
        // Ensure User model has lastLogin field updated on login
        const activeUsers = await UserData.findAll({
            where: { lastLogin: { [Op.gte]: activeThreshold } },
            attributes: ['name','email','department','lastLogin','loginCount'],
            raw: true
        });
        res.status(200).json({ users: activeUsers });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch active users' });
    }
};

// --- 4. Analytics (Department) ---
const getDepartmentAnalytics = async (req, res) => {
    try {
        const users = await UserData.findAll({ raw: true });
        const registrations = await Registration.findAll({
            include: [{ model: UserData, as: 'user' }],
            raw: true,
            nest: true
        });
        
        const merged = users.map(u => {
            const reg = registrations.find(r => 
                (r.user && r.user.id && u.id && r.user.id.toString() === u.id.toString()) || 
                (r.userData && r.userData.email === u.email)
            );
            return {
                department: u.department || 'Unknown',
                status: reg?.payment?.paymentStatus ? (reg.payment.paymentStatus === true ? 'Paid' : 'Pending') : 'Pending',
                amount: reg?.payment?.amount || 0
            };
        });
        
        const analytics = {};
        merged.forEach(d => {
            if (!analytics[d.department]) analytics[d.department] = { total: 0, paid: 0, pending: 0, failed: 0, totalRevenue: 0 };
            analytics[d.department].total++;
            
            if(d.status === 'Paid') { 
                analytics[d.department].paid++; 
                analytics[d.department].totalRevenue += d.amount; 
            }
            else if(d.status === 'Pending') analytics[d.department].pending++;
            else analytics[d.department].failed++;
        });
        res.status(200).json(analytics);
    } catch(e) { 
        console.error(e);
        res.status(500).json({message: "Error fetching analytics"}); 
    }
};

// --- 5. Analytics (Events) ---
const getEventAnalytics = async (req, res) => {
    try {
        const registrations = await Registration.findAll({ raw: true });
        const eventStats = {};
        
        registrations.forEach(reg => {
            const isPaid = reg.payment?.paymentStatus === true || reg.payment?.paymentStatus === 'Paid';
            const amount = reg.payment?.amount || 0;

            reg.selectedEvents?.forEach(ev => {
                const eventName = eventNameOf(ev);
                if (!eventName) return;
                if(!eventStats[eventName]) eventStats[eventName] = { total: 0, paid: 0, pending: 0, revenue: 0 };
                
                eventStats[eventName].total++;
                if(isPaid) { 
                    eventStats[eventName].paid++; 
                    // Simple revenue split logic: Total Amount / Event Count (Approximation)
                    eventStats[eventName].revenue += (amount / (reg.selectedEvents.length || 1)); 
                } else {
                    eventStats[eventName].pending++;
                }
            });
        });
        res.status(200).json(eventStats);
    } catch(e) { res.status(500).json({message: "Error fetching event stats"}); }
};

// --- 6. Events List ---
const getAllEvents = async (req, res) => {
    try {
        const registrations = await Registration.findAll({ raw: true });
        const eventSet = new Set();
        registrations.forEach(reg => reg.selectedEvents?.forEach(ev => {
            const name = eventNameOf(ev);
            if (name) eventSet.add(name);
        }));
        res.status(200).json({ events: Array.from(eventSet).sort() });
    } catch(e) { res.status(500).json({message: "Error fetching events list"}); }
};

// --- 7. Send Payment Reminders ---
const sendPendingPaymentReminders = async (req, res) => {
    try {
        const pendingRegs = await Registration.findAll({ raw: true });
        let sentCount = 0;
        let errorsCount = 0;

        for (const reg of pendingRegs) {
            const paymentStatus = String(reg?.payment?.paymentStatus || '').toLowerCase();
            const hasEvents = Array.isArray(reg?.selectedEvents) && reg.selectedEvents.length > 0;
            if (!hasEvents || paymentStatus === 'paid') continue;

            const user = reg.userId ? await UserData.findOne({ where: { id: reg.userId }, raw: true }) : null;
            const isAdminUser = Boolean(user?.isAdmin) || String(user?.role || '').toLowerCase() === 'admin';
            const email = reg.contactEmail || user?.email || null;
            if (isAdminUser) continue;
            if (!email) continue;

            try {
                const sent = await sendRegistrationReminderEmail(
                    {
                        name: user?.name || 'Participant',
                        email,
                        participantId: user?.participantId || '-',
                        userId: reg.userId || null
                    },
                    reg.id,
                    {
                        participantId: user?.participantId || '-',
                        amount: reg?.payment?.amount || 0,
                        events: reg?.selectedEvents || [],
                        email
                    }
                );
                if (sent) sentCount++;
                else errorsCount++;
            } catch (err) {
                errorsCount++;
            }
        }

        res.status(200).json({ emailsSent: sentCount, errorsCount });
    } catch (error) {
        console.error('Failed to send reminders:', error);
        res.status(500).json({ message: 'Failed to send reminders' });
    }
};

// --- 8. Export Action Logs (Optional) ---
const exportLogsToExcel = async (req, res) => {
    // Basic placeholder implementation
    res.status(200).json({ message: "Log export not fully configured yet." });
};

// --- 9. Get Logs (Optional) ---
const getLogs = async (req, res) => {
    res.status(200).json({ logs: [] });
};

// --- 10. Export Registrations Excel ---
const exportRegistrationsToExcel = async (req, res) => {
    res.status(200).json({ message: "Use Frontend Export" });
};

// --- 11. Verify QR Scan ---
const verifyQrScan = async (req, res) => {
    try {
        const { qrText } = req.body || {};
        const qrData = parseQrPayload(qrText);

        const email = String(qrData?.em || '').trim();
        const participantId = String(qrData?.pid || '').trim();
        const qrEvents = parseQrEvents(qrData?.ev);

        let user = null;
        if (participantId) {
            user = await UserData.findOne({ where: { participantId } });
        }
        if (!user && email) {
            user = await UserData.findOne({ where: { email } });
        }

        let registration = null;
        if (user?.id) {
            registration = await Registration.findOne({
                where: { userId: user.id },
                order: [['updatedAt', 'DESC']]
            });
        }
        if (!registration && email) {
            registration = await Registration.findOne({
                where: { contactEmail: email },
                order: [['updatedAt', 'DESC']]
            });
        }

        let paymentRow = await getPaymentByOrderId(qrData?.oid || null);
        if (!paymentRow && email) {
            const payments = await getPaymentsByUserId(email);
            if (payments.length > 0) {
                const transactionId = String(qrData?.tid || qrData?.pyid || '').trim();
                paymentRow =
                    payments.find((p) => String(p.transactionId || '').trim() === transactionId) ||
                    payments.find((p) => String(p.razorpayPaymentId || '').trim() === transactionId) ||
                    payments.find((p) => canonicalPaymentStatus(p.status) === 'Paid') ||
                    payments[0];
            }
        }

        const regEvents = normalizeEventNames(registration?.selectedEvents || []);
        const paymentEvents = parsePaymentEvents(paymentRow?.events);
        const mergedEvents = regEvents.length
            ? regEvents
            : paymentEvents.length
            ? normalizeEventNames(paymentEvents)
            : qrEvents;

        const paymentStatus = canonicalPaymentStatus(
            paymentRow?.status ||
            registration?.payment?.paymentStatus ||
            registration?.status
        );

        const paymentAmount =
            Number(paymentRow?.amount) ||
            Number(registration?.payment?.amount) ||
            Number(qrData?.amt) ||
            0;

        const paymentCurrency =
            paymentRow?.currency ||
            registration?.payment?.currency ||
            qrData?.cur ||
            'INR';

        const paymentDetails = {
            amount: paymentAmount,
            currency: paymentCurrency,
            status: paymentStatus,
            orderId: paymentRow?.razorpayOrderId || qrData?.oid || '-',
            paymentId: paymentRow?.razorpayPaymentId || qrData?.pyid || '-',
            transactionId: paymentRow?.transactionId || qrData?.tid || '-',
            upiId: qrData?.upi || '-',
            paymentDate: paymentRow?.updatedAt || registration?.payment?.date || null
        };

        const participant = {
            name: user?.name || qrData?.nm || '-',
            email: user?.email || email || '-',
            participantId: user?.participantId || participantId || '-',
            phone: user?.phone || '-',
            department: user?.department || '-',
            year: user?.year || '-',
            college: user?.college || '-'
        };

        res.status(200).json({
            ok: true,
            participant,
            events: mergedEvents,
            registration: registration
                ? {
                    id: registration.id,
                    status: registration.status || '-',
                    attendance: registration.attendance || {},
                    registeredOn: registration.registeredOn || registration.createdAt || null
                }
                : null,
            payment: paymentDetails,
            sources: {
                user: user ? 'db' : 'qr',
                registration: registration ? 'db' : 'qr',
                payment: paymentRow ? 'payments' : (registration?.payment ? 'registration' : 'qr')
            },
            qr: qrData
        });
    } catch (error) {
        res.status(400).json({ ok: false, message: error?.message || 'Invalid QR payload' });
    }
};

module.exports = { 
    getAllRegistrations, 
    markAttendance, 
    markAttendanceBulk,
    getActiveUsers, 
    getDepartmentAnalytics, 
    getEventAnalytics, 
    getAllEvents, 
    sendPendingPaymentReminders,
    exportLogsToExcel,
    getLogs,
    exportRegistrationsToExcel,
    verifyQrScan
};
