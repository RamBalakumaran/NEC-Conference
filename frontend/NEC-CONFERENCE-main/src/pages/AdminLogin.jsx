import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use the regular login endpoint and validate admin role
      const { data } = await axios.post('http://localhost:5200/conference/auth/login', formData);

      // Ensure the authenticated user is an admin
      const user = data.result || {};
      if (!user.isAdmin && String(user.role).toLowerCase() !== 'admin') {
        setError('Not an admin user');
        setLoading(false);
        return;
      }

      // Store admin token specifically
      localStorage.setItem('adminToken', data.token);
      // Mark session as admin for quick checks
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Admin Credentials');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05020a] p-4 font-['Orbitron']">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[450px] z-10">
        <div className="bg-[#1a0b2e]/90 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(220,38,38,0.1)]">
          
          <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors font-space-grotesk">
            <ArrowLeft size={16}/> Back to Home
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">Admin Portal</h2>
            <p className="text-gray-400 text-sm font-space-grotesk tracking-widest">Authorized Personnel Only</p>
          </div>
          
          {error && <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center text-sm font-space-grotesk">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5 font-space-grotesk">
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-red-400 transition-colors" />
              <input 
                type="email" 
                required 
                placeholder="Admin Email"
                className="w-full bg-[#0f0518] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-red-500 focus:outline-none transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-red-400 transition-colors" />
              <input 
                type="password" 
                required 
                placeholder="Secure Password"
                className="w-full bg-[#0f0518] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-red-500 focus:outline-none transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <button 
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-red-600 to-pink-700 text-white font-bold py-4 rounded-xl 
                         hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transform hover:scale-[1.02] transition-all duration-300
                         flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Access Dashboard"} 
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 