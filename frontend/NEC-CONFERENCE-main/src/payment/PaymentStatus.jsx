import React, { useState, useMemo, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

const PAYMENT_API_URL = "https://nec.edu.in/icodses/payment/user-payments";
const ALL_PAYMENTS_API_URL = "https://nec.edu.in/icodses/payment/all-payments";
const PAYMENT_STATUS_URL = "https://nec.edu.in/icodses/payment/status";

function PaymentStatus({ registrations = [], refreshData, loading: externalLoading }) {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paperIdSearch, setPaperIdSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const isAdmin = user && user.role === 'admin';

  // Fetch all payments on component mount
  useEffect(() => {
    fetchAllPayments();
  }, [isAdmin]);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn("No token found");
        setPayments([]);
        return;
      }

      const endpoint = isAdmin ? ALL_PAYMENTS_API_URL : PAYMENT_API_URL;
      console.log('Fetching payments from', endpoint);

      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('fetchAllPayments response:', data);
        setPayments(data.payments || []);
      } else {
        console.warn("Failed to fetch payments:", res.status);
        setPayments([]);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment by paper ID
  const handlePaperIdSearch = async () => {
    if (!paperIdSearch.trim()) {
      setSearchError('Please enter a Paper ID');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      setSearchResult(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setSearchError("No token found. Please login.");
        return;
      }

      const res = await fetch(`${PAYMENT_STATUS_URL}/${paperIdSearch}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('handlePaperIdSearch response:', data);
        setSearchResult(data);
      } else if (res.status === 404) {
        setSearchError('Payment record not found for this Paper ID');
      } else {
        setSearchError('Failed to fetch payment details');
      }
    } catch (err) {
      console.error("Error fetching payment by paper ID:", err);
      setSearchError('Error fetching payment details');
    } finally {
      setSearchLoading(false);
    }
  };

  // Normalize status for display
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const statusLower = status.toString().toLowerCase();
    if (statusLower === 'captured') return 'paid';
    if (statusLower === 'not_initiated') return 'pending';
    return statusLower;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter(p => {
      const status = normalizeStatus(p.status);

      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!q) return true;

      const txn = (p.razorpayPaymentId || p.transactionId || '').toString().toLowerCase();
      const paperId = (p.paperId || '').toString().toLowerCase();

      return (
        txn.includes(q) ||
        status.includes(q) ||
        paperId.includes(q)
      );
    });
  }, [payments, query, statusFilter]);

  const statusLabel = (p) => {
    return normalizeStatus(p.status);
  };

  console.log('loading:', loading, 'externalLoading:', externalLoading);

  return (
    <div>
      {/* Search by Paper ID Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Search by Paper ID</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            placeholder="Enter Paper ID"
            value={paperIdSearch}
            onChange={e => setPaperIdSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePaperIdSearch()}
            className="px-3 py-2 border rounded-md flex-1"
          />
          <button
            onClick={handlePaperIdSearch}
            disabled={searchLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchError && <p className="text-red-500 mt-2">{searchError}</p>}

        {/* Search Result */}
        {searchResult && (
          <div className="mt-4 p-3 bg-white border border-green-300 rounded">
            <h4 className="font-semibold mb-2">Payment Details for Paper ID: {searchResult.paperId}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Paper Title:</strong> {searchResult.paperTitle}</div>
              <div><strong>Payment Status:</strong> <span className={`px-2 py-1 rounded text-white ${normalizeStatus(searchResult.paymentStatus) === 'paid' ? 'bg-green-500' : normalizeStatus(searchResult.paymentStatus) === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}>{normalizeStatus(searchResult.paymentStatus).toUpperCase()}</span></div>
              <div><strong>Amount:</strong> ₹{searchResult.amount ? searchResult.amount.toFixed(2) : '0.00'}</div>
              <div><strong>Currency:</strong> {searchResult.currency}</div>
              <div><strong>Payment ID:</strong> {searchResult.paymentId || 'N/A'}</div>
              <div><strong>Payment Date:</strong> {searchResult.paymentDate ? new Date(searchResult.paymentDate).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <input
            type="search"
            placeholder="Search by txn id or paper id"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md">
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => { fetchAllPayments(); if (refreshData) refreshData(); }} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Paper ID</th>
              <th className="p-2">Paper Title</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Payment ID</th>
              <th className="p-2">Order ID</th>
              <th className="p-2">User ID</th>
              <th className="p-2">Failure Reason</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(loading || externalLoading) && payments.length === 0 ? (
              <tr><td colSpan="9" className="p-4 text-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className="p-4 text-center">No payment records found.</td></tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 align-top">{p.paperId || '-'}</td>
                  <td className="p-2 align-top truncate" title={p.paperTitle || '-'}>{p.paperTitle || '-'}</td>
                  <td className="p-2 align-top">₹{p.amount ? p.amount.toFixed(2) : '-'}</td>
                  <td className="p-2 align-top">
                    <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                      statusLabel(p) === 'paid' ? 'bg-green-500' :
                      statusLabel(p) === 'pending' ? 'bg-yellow-500' :
                      statusLabel(p) === 'failed' ? 'bg-red-500' :
                      statusLabel(p) === 'refunded' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}>
                      {statusLabel(p).toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2 align-top text-xs truncate" title={p.razorpayPaymentId || 'N/A'}>{p.razorpayPaymentId || '-'}</td>
                  <td className="p-2 align-top text-xs truncate" title={p.razorpayOrderId || 'N/A'}>{p.razorpayOrderId || '-'}</td>
                  <td className="p-2 align-top text-xs truncate" title={p.userId || p.regUserId || 'N/A'}>{p.userId || p.regUserId || '-'}</td>
                  <td className="p-2 align-top text-xs truncate" title={p.failureReason || 'N/A'}>{p.failureReason || '-'}</td>
                  <td className="p-2 align-top">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentStatus;