const UserData = require("../model/User"); 
const Registration = require("../model/Registration");
const ActionLog = require('../model/ActionLog'); // Optional: If you track admin actions
const ExcelJS = require('exceljs');
const { sendRegistrationReminderEmail } = require('../config/email');
const { Op } = require('sequelize');
const { sequelize } = require('../model');
const { assignParticipantIdToUser } = require('../service/participantIdService');

const eventNameOf = (ev) => (typeof ev === 'string' ? ev : (ev?.name || ev?.title || null));

// --- 1. Get All Registrations (Dashboard Main Data) ---
const getAllRegistrations = async (req, res) => {
    try {
        const { from, to, department, status } = req.query;
        const whereUser = {};
        
        // Date Filter on User Creation
        if (from || to) {
            whereUser.createdAt = {};
            if (from) whereUser.createdAt[Op.gte] = new Date(from);
            if (to) whereUser.createdAt[Op.lte] = new Date(to);
        }
        // Dept Filter
        if (department && department !== 'All') whereUser.department = department;
        
        // 1. Get Users based on filters
        const allUsers = await UserData.findAll({
            where: whereUser,
            attributes: ['id', 'name', 'email', 'participantId', 'phone', 'department', 'year', 'college', 'role', 'isAdmin', 'createdAt', 'lastLogin'],
            order: [['lastLogin', 'DESC'], ['createdAt', 'DESC']],
            raw: false
        });

        // Ensure non-admin users always have participantId persisted.
        for (const user of allUsers) {
            try {
                if (!user?.participantId) {
                    await assignParticipantIdToUser(user);
                }
            } catch (pidErr) {
                console.warn(`PID assignment skipped for user ${user?.id}:`, pidErr?.message || pidErr);
            }
        }
        
        // 2. Get All Registrations to merge
        const registrations = await Registration.findAll({
            include: [{ model: UserData, as: 'user', attributes: ['id','name','email','participantId'] }],
            raw: true,
            nest: true
        });
        
        // 3. Merge Data
        const mergedData = allUsers.map((userRow) => {
            const user = userRow.get({ plain: true });
            // Match Registration to User. Sequelize include provided `user` object nested.
            const userReg = registrations.find(r => 
                (r.user && r.user.id.toString() === user.id.toString()) || 
                (r.userData && r.userData.email === user.email)
            );

            const resolvedPid =
                user.participantId ||
                userReg?.user?.participantId ||
                userReg?.userData?.participantId ||
                userReg?.userData?.pid ||
                '-';

            const paymentStatus = userReg?.payment?.paymentStatus 
                ? (userReg.payment.paymentStatus === true ? 'Paid' : userReg.payment.paymentStatus) 
                : 'Pending';
            
            // Filter by Payment Status if requested
            if (status && status !== 'All' && paymentStatus !== status) return null;
            
            return {
                _id: userReg ? userReg.id : `temp_${user.id}`, // Use Reg ID if exists, else User ID
                userId: user.id,
                userData: {
                    name: user.name,
                    email: user.email,
                    participantId: resolvedPid,
                    phone: user.phone,
                    department: user.department,
                    year: user.year,
                    college: user.college,
                    role: user.role,
                },
                pid: resolvedPid,
                selectedEvents: userReg?.selectedEvents || [],
                payment: {
                    amount: userReg?.payment?.amount || 0,
                    paymentStatus: paymentStatus,
                    transactionId: userReg?.payment?.transactionId || 'N/A'
                },
                attendance: userReg?.attendance || { day1: false, day2: false, day3: false },
                registeredOn: user.createdAt
            };
        }).filter(Boolean); // Remove nulls from status filter
        
        const stats = calculateStats(mergedData);
        
        res.status(200).json({
            stats,
            registrations: mergedData,
            total: mergedData.length
        });
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ message: "Server Error fetching data" });
    }
};

const calculateStats = (data) => {
    const now = Date.now();
    const thirtyMinsAgo = new Date(now - 30 * 60 * 1000);
    return {
        totalUsers: data.length,
        // Assuming lastLogin is on user object, estimating active based on recent reg/update for now
        activeNow: 0, 
        registered: data.filter(u => u.payment.paymentStatus === 'Paid').length,
        pendingPayment: data.filter(u => u.payment.paymentStatus === 'Pending').length,
        paymentFailed: data.filter(u => u.payment.paymentStatus === 'Failed').length,
        totalRevenue: data.filter(u => u.payment.paymentStatus === 'Paid').reduce((sum, u) => sum + (u.payment.amount || 0), 0),
    };
};

// --- 2. Mark Attendance ---
const markAttendance = async (req, res) => {
    try {
        const { registrationId, day, status } = req.body;

        if (!['day1', 'day2', 'day3'].includes(day)) {
            return res.status(400).json({ message: "Invalid day selected" });
        }

        if (registrationId.startsWith('temp_')) {
             return res.status(400).json({ message: "User has not completed registration (No Registration ID)" });
        }

        const updateField = registration => {
            const a = registration.attendance || {};
            a[day] = status;
            return { attendance: a };
        };

        const reg = await Registration.findByPk(registrationId);
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
            if (!registrationId) continue;
            if (registrationId.startsWith('temp_')) continue;

            const reg = await Registration.findByPk(registrationId);
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
    // Usually handled by frontend using the JSON data, but if backend generation is needed:
    // Implementation involves creating a buffer and sending it.
    // For now, frontend export (which you implemented) is often better for load.
    res.status(200).json({ message: "Use Frontend Export" });
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
    exportRegistrationsToExcel
};

